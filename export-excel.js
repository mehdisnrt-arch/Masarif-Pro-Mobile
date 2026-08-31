/* Masarif Pro Mobile - persistence guard + Excel export */

/* Strong autosave for iPhone/PWA. Keeps the normal storage key unchanged and adds a mirror backup. */
(function () {
  "use strict";

  const MAIN_KEY = "masarifProMobile.v1";
  const MIRROR_KEY = "masarifProMobile.autosave.v1";
  let saving = false;

  function appState() {
    try {
      if (typeof state !== "undefined" && state && Array.isArray(state.transactions)) return state;
    } catch (_) {}
    return null;
  }

  function savedAt(value) {
    return Number(value && value.settings && value.settings.__lastSavedAt) || 0;
  }

  function readJson(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  /* Runs before DOMContentLoaded. If the mirror is newer, put it back into the live state
     before the application renders. */
  function restoreNewestCopy() {
    const live = appState();
    const mirror = readJson(MIRROR_KEY);
    if (!live || !mirror || !Array.isArray(mirror.transactions)) return;

    if (savedAt(mirror) > savedAt(live)) {
      live.transactions = mirror.transactions;
      live.settings = mirror.settings || {};
      try { localStorage.setItem(MAIN_KEY, JSON.stringify(live)); } catch (_) {}
    }
  }

  function saveEverything() {
    if (saving) return;
    const live = appState();
    if (!live) return;

    saving = true;
    try {
      live.settings = live.settings || {};
      live.settings.__lastSavedAt = Date.now();
      const payload = JSON.stringify(live);

      /* Mirror first, then primary. If iOS interrupts one write, one valid copy remains. */
      localStorage.setItem(MIRROR_KEY, payload);
      localStorage.setItem(MAIN_KEY, payload);
    } catch (error) {
      console.warn("Masarif autosave failed", error);
    } finally {
      saving = false;
    }
  }

  restoreNewestCopy();

  /* Make every existing persist() call also create the safety copy. */
  try {
    if (typeof persist === "function" && !window.__masarifPersistWrapped) {
      const originalPersist = persist;
      persist = function () {
        const live = appState();
        if (live) {
          live.settings = live.settings || {};
          live.settings.__lastSavedAt = Date.now();
          try { localStorage.setItem(MIRROR_KEY, JSON.stringify(live)); } catch (_) {}
        }
        originalPersist();
        saveEverything();
      };
      window.__masarifPersistWrapped = true;
    }
  } catch (error) {
    console.warn("Could not wrap persist", error);
  }

  document.addEventListener("DOMContentLoaded", function () {
    saveEverything();
    setTimeout(saveEverything, 1200);

    /* When a transaction is edited manually, the newly selected category becomes the truth.
       This prevents an old originalCategory from restoring itself on the next PWA launch. */
    const form = document.getElementById("transaction-form");
    if (form) {
      form.addEventListener("submit", function () {
        const idField = document.getElementById("modal-transaction-id");
        const categoryField = document.getElementById("modal-category");
        const typeField = document.getElementById("modal-type");
        const id = idField ? idField.value : "";
        const chosenCategory = typeField && typeField.value === "income" ? "المدخول" : (categoryField ? categoryField.value : "");

        setTimeout(function () {
          const live = appState();
          if (!live || !id) {
            saveEverything();
            return;
          }
          const item = live.transactions.find(function (transaction) { return String(transaction.id) === String(id); });
          if (item && chosenCategory) {
            item.category = chosenCategory;
            if (item.originalCategory && item.originalCategory !== chosenCategory) delete item.originalCategory;
          }
          saveEverything();
        }, 0);
      }, true);
    }
  });

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") saveEverything();
  });
  window.addEventListener("pagehide", saveEverything);
  window.addEventListener("beforeunload", saveEverything);
  window.addEventListener("freeze", saveEverything);

  /* Extra safety while the PWA stays open. */
  setInterval(saveEverything, 5000);
})();

/* Excel export helper */
(function () {
  "use strict";

  const STORAGE_KEY = "masarifProMobile.v1";
  const XLSX_CDN = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";

  document.addEventListener("DOMContentLoaded", setupExcelButton);

  function setupExcelButton() {
    const csvButton = document.getElementById("export-csv-btn");
    let xlsxButton = document.getElementById("export-xlsx-btn");

    if (!xlsxButton && csvButton) {
      xlsxButton = document.createElement("button");
      xlsxButton.id = "export-xlsx-btn";
      xlsxButton.className = "secondary-button";
      xlsxButton.type = "button";
      xlsxButton.textContent = "Export Excel XLSX";
      csvButton.insertAdjacentElement("afterend", xlsxButton);
    }

    if (xlsxButton) {
      xlsxButton.removeEventListener("click", exportExcelXlsx);
      xlsxButton.addEventListener("click", exportExcelXlsx);
    }
  }

  function getState() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (!Array.isArray(data.transactions)) return { transactions: [], settings: {} };
      return data;
    } catch {
      return { transactions: [], settings: {} };
    }
  }

  function todayISO() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 10);
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (window.XLSX) return resolve();
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function money(value) {
    const amount = Number(value || 0);
    return Math.round(amount * 100) / 100;
  }

  function isIncome(item) {
    return item && item.type === "income";
  }

  function isExpense(item) {
    return !isIncome(item);
  }

  function sortedTransactions(transactions) {
    return transactions.slice().sort(function (a, b) {
      const byDate = String(a.date || "").localeCompare(String(b.date || ""));
      if (byDate) return byDate;
      return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
    });
  }

  function buildTransactionRows(transactions) {
    return sortedTransactions(transactions).map(function (item) {
      return {
        "التاريخ": String(item.date || ""),
        "النوع": isIncome(item) ? "مدخول" : "مصروف",
        "الفئة": String(item.category || "أخرى"),
        "الوصف الأصلي": String(item.raw || item.note || ""),
        "الملاحظة": String(item.note || ""),
        "المبلغ": money(item.amount),
        "تاريخ الإضافة": String(item.createdAt || "")
      };
    });
  }

  function buildSummaryRows(transactions, settings) {
    const totalExpenses = money(sum(transactions.filter(isExpense), "amount"));
    const totalIncome = money(sum(transactions.filter(isIncome), "amount"));
    const budget = money(settings && settings.monthlyBudget ? settings.monthlyBudget : 0);
    const remainingBudget = money(budget - totalExpenses);
    const net = money(totalIncome - totalExpenses);
    const categoryTotals = groupTotals(transactions.filter(isExpense), "category");
    const biggestCategory = Object.entries(categoryTotals).sort(function (a, b) { return b[1] - a[1]; })[0];

    return [
      { "العنوان": "مجموع المصاريف", "القيمة": totalExpenses, "ملاحظة": "Total dépenses" },
      { "العنوان": "مجموع المداخيل", "القيمة": totalIncome, "ملاحظة": "Total revenus" },
      { "العنوان": "الصافي", "القيمة": net, "ملاحظة": "المداخيل - المصاريف" },
      { "العنوان": "ميزانية الشهر", "القيمة": budget, "ملاحظة": "Budget" },
      { "العنوان": "الباقي من الميزانية", "القيمة": remainingBudget, "ملاحظة": "Budget - dépenses" },
      { "العنوان": "عدد العمليات", "القيمة": transactions.length, "ملاحظة": "كل العمليات" },
      { "العنوان": "عدد المصاريف", "القيمة": transactions.filter(isExpense).length, "ملاحظة": "Expenses count" },
      { "العنوان": "عدد المداخيل", "القيمة": transactions.filter(isIncome).length, "ملاحظة": "Income count" },
      { "العنوان": "أكبر فئة", "القيمة": biggestCategory ? biggestCategory[0] : "-", "ملاحظة": biggestCategory ? money(biggestCategory[1]) : 0 },
      { "العنوان": "تاريخ التصدير", "القيمة": todayISO(), "ملاحظة": "" }
    ];
  }

  function buildDailyRows(transactions) {
    const grouped = {};
    transactions.forEach(function (item) {
      const date = String(item.date || "");
      if (!grouped[date]) grouped[date] = { income: 0, expense: 0, count: 0 };
      grouped[date].count += 1;
      if (isIncome(item)) grouped[date].income += Number(item.amount || 0);
      else grouped[date].expense += Number(item.amount || 0);
    });

    return Object.keys(grouped).sort().map(function (date) {
      const row = grouped[date];
      return {
        "التاريخ": date,
        "مجموع المصاريف": money(row.expense),
        "مجموع المداخيل": money(row.income),
        "الصافي": money(row.income - row.expense),
        "عدد العمليات": row.count
      };
    });
  }

  function buildCategoryRows(transactions) {
    const grouped = {};
    transactions.forEach(function (item) {
      const category = String(item.category || "أخرى");
      if (!grouped[category]) grouped[category] = { income: 0, expense: 0, count: 0 };
      grouped[category].count += 1;
      if (isIncome(item)) grouped[category].income += Number(item.amount || 0);
      else grouped[category].expense += Number(item.amount || 0);
    });

    return Object.keys(grouped).sort(function (a, b) {
      return (grouped[b].expense + grouped[b].income) - (grouped[a].expense + grouped[a].income);
    }).map(function (category) {
      const row = grouped[category];
      return {
        "الفئة": category,
        "مجموع المصاريف": money(row.expense),
        "مجموع المداخيل": money(row.income),
        "الصافي": money(row.income - row.expense),
        "عدد العمليات": row.count
      };
    });
  }

  function groupTotals(items, key) {
    return items.reduce(function (acc, item) {
      const name = String(item[key] || "أخرى");
      acc[name] = money((acc[name] || 0) + Number(item.amount || 0));
      return acc;
    }, {});
  }

  function sum(items, key) {
    return items.reduce(function (total, item) {
      return total + Number(item[key] || 0);
    }, 0);
  }

  function sheetFromRows(rows, headers, widths) {
    const sheet = XLSX.utils.json_to_sheet(rows, { header: headers });
    sheet["!cols"] = widths.map(function (wch) { return { wch: wch }; });
    sheet["!dir"] = "rtl";
    return sheet;
  }

  async function exportExcelXlsx() {
    try {
      await loadScript(XLSX_CDN);
      const current = getState();
      const transactions = Array.isArray(current.transactions) ? current.transactions : [];
      const settings = current.settings || {};

      const transactionRows = buildTransactionRows(transactions);
      const summaryRows = buildSummaryRows(transactions, settings);
      const dailyRows = buildDailyRows(transactions);
      const categoryRows = buildCategoryRows(transactions);

      const workbook = XLSX.utils.book_new();
      workbook.Workbook = { Views: [{ RTL: true }] };

      XLSX.utils.book_append_sheet(workbook, sheetFromRows(summaryRows, ["العنوان", "القيمة", "ملاحظة"], [28, 18, 30]), "Résumé");
      XLSX.utils.book_append_sheet(workbook, sheetFromRows(dailyRows, ["التاريخ", "مجموع المصاريف", "مجموع المداخيل", "الصافي", "عدد العمليات"], [14, 18, 18, 16, 14]), "Par jour");
      XLSX.utils.book_append_sheet(workbook, sheetFromRows(categoryRows, ["الفئة", "مجموع المصاريف", "مجموع المداخيل", "الصافي", "عدد العمليات"], [18, 18, 18, 16, 14]), "Par catégorie");
      XLSX.utils.book_append_sheet(workbook, sheetFromRows(transactionRows, ["التاريخ", "النوع", "الفئة", "الوصف الأصلي", "الملاحظة", "المبلغ", "تاريخ الإضافة"], [14, 12, 16, 36, 24, 12, 24]), "Transactions");

      XLSX.writeFile(workbook, "masarif-complet-" + todayISO() + ".xlsx");
    } catch (error) {
      alert("تعذر تصدير Excel. جرّب مرة أخرى، وتأكد من الاتصال بالإنترنت أول مرة.");
    }
  }
})();
