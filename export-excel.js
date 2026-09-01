/* Masarif Pro Mobile - strong persistence + iPhone-safe Excel export */
(function () {
  "use strict";

  const MAIN_KEY = "masarifProMobile.v1";
  const MIRROR_KEY = "masarifProMobile.autosave.v1";

  function getLiveState() {
    try {
      if (typeof state !== "undefined" && state && Array.isArray(state.transactions)) return state;
    } catch (_) {}
    try {
      const saved = JSON.parse(localStorage.getItem(MAIN_KEY) || "null");
      return saved && Array.isArray(saved.transactions) ? saved : null;
    } catch (_) {
      return null;
    }
  }

  function saveMirror() {
    const live = getLiveState();
    if (!live) return;
    try {
      live.settings = live.settings || {};
      live.settings.__lastSavedAt = Date.now();
      const payload = JSON.stringify(live);
      localStorage.setItem(MIRROR_KEY, payload);
      localStorage.setItem(MAIN_KEY, payload);
    } catch (error) {
      console.warn("Masarif autosave failed", error);
    }
  }

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") saveMirror();
  });
  window.addEventListener("pagehide", saveMirror);
  window.addEventListener("beforeunload", saveMirror);
  setInterval(saveMirror, 5000);
})();

(function () {
  "use strict";

  const STORAGE_KEY = "masarifProMobile.v1";
  const XLSX_CDN = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";
  let xlsxLoading = null;

  document.addEventListener("DOMContentLoaded", function () {
    setupExcelButton();
    preloadXlsx();
  });

  function setupExcelButton() {
    const button = document.getElementById("export-xlsx-btn");
    if (!button) return;
    button.onclick = exportExcelXlsx;
  }

  function preloadXlsx() {
    if (window.XLSX) return Promise.resolve();
    if (xlsxLoading) return xlsxLoading;
    xlsxLoading = new Promise(function (resolve, reject) {
      const existing = document.querySelector('script[data-masarif-xlsx="1"]');
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = XLSX_CDN;
      script.dataset.masarifXlsx = "1";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return xlsxLoading;
  }

  function getState() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return Array.isArray(data.transactions) ? data : { transactions: [], settings: {} };
    } catch (_) {
      return { transactions: [], settings: {} };
    }
  }

  function todayISO() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 10);
  }

  function money(value) {
    return Math.round(Number(value || 0) * 100) / 100;
  }

  function isIncome(item) {
    return item && item.type === "income";
  }

  function sum(items) {
    return money(items.reduce(function (total, item) {
      return total + Number(item.amount || 0);
    }, 0));
  }

  function sortedTransactions(items) {
    return items.slice().sort(function (a, b) {
      const dateCompare = String(a.date || "").localeCompare(String(b.date || ""));
      if (dateCompare) return dateCompare;
      return String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
    });
  }

  function transactionRows(transactions) {
    return sortedTransactions(transactions).map(function (item) {
      return {
        "التاريخ": String(item.date || ""),
        "النوع": isIncome(item) ? "مدخول" : "مصروف",
        "الفئة": String(item.category || "أخرى"),
        "الوصف": String(item.description || item.raw || item.note || ""),
        "الوصف الأصلي": String(item.raw || ""),
        "الملاحظة": String(item.note || ""),
        "المبلغ": money(item.amount)
      };
    });
  }

  function summaryRows(transactions, settings) {
    const expenses = transactions.filter(function (item) { return !isIncome(item); });
    const incomes = transactions.filter(isIncome);
    const expenseTotal = sum(expenses);
    const incomeTotal = sum(incomes);
    const budget = money(settings && settings.monthlyBudget);
    return [
      { "العنوان": "مجموع المصاريف", "القيمة": expenseTotal },
      { "العنوان": "مجموع المداخيل", "القيمة": incomeTotal },
      { "العنوان": "الصافي", "القيمة": money(incomeTotal - expenseTotal) },
      { "العنوان": "ميزانية الشهر", "القيمة": budget },
      { "العنوان": "الباقي من الميزانية", "القيمة": money(budget - expenseTotal) },
      { "العنوان": "عدد العمليات", "القيمة": transactions.length }
    ];
  }

  function dailyRows(transactions) {
    const grouped = {};
    transactions.forEach(function (item) {
      const date = String(item.date || "");
      if (!grouped[date]) grouped[date] = { expense: 0, income: 0, count: 0 };
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

  function categoryRows(transactions) {
    const grouped = {};
    transactions.forEach(function (item) {
      const category = String(item.category || "أخرى");
      if (!grouped[category]) grouped[category] = { expense: 0, income: 0, count: 0 };
      grouped[category].count += 1;
      if (isIncome(item)) grouped[category].income += Number(item.amount || 0);
      else grouped[category].expense += Number(item.amount || 0);
    });
    return Object.keys(grouped).sort(function (a, b) {
      return grouped[b].expense - grouped[a].expense;
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

  function makeSheet(rows, headers, widths) {
    const sheet = XLSX.utils.json_to_sheet(rows, { header: headers });
    sheet["!dir"] = "rtl";
    sheet["!cols"] = widths.map(function (width) { return { wch: width }; });
    return sheet;
  }

  function downloadWorkbook(workbook) {
    const data = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "masarif-complet-" + todayISO() + ".xlsx";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    setTimeout(function () {
      URL.revokeObjectURL(url);
      link.remove();
    }, 3000);
  }

  function buildAndDownload() {
    const current = getState();
    const transactions = current.transactions || [];
    if (!transactions.length) {
      alert("ما كايناش عمليات باش تخرج Excel.");
      return;
    }

    const workbook = XLSX.utils.book_new();
    workbook.Workbook = { Views: [{ RTL: true }] };

    XLSX.utils.book_append_sheet(workbook, makeSheet(summaryRows(transactions, current.settings || {}), ["العنوان", "القيمة"], [30, 20]), "Résumé");
    XLSX.utils.book_append_sheet(workbook, makeSheet(dailyRows(transactions), ["التاريخ", "مجموع المصاريف", "مجموع المداخيل", "الصافي", "عدد العمليات"], [14, 20, 20, 18, 15]), "Par jour");
    XLSX.utils.book_append_sheet(workbook, makeSheet(categoryRows(transactions), ["الفئة", "مجموع المصاريف", "مجموع المداخيل", "الصافي", "عدد العمليات"], [22, 20, 20, 18, 15]), "Par catégorie");
    XLSX.utils.book_append_sheet(workbook, makeSheet(transactionRows(transactions), ["التاريخ", "النوع", "الفئة", "الوصف", "الوصف الأصلي", "الملاحظة", "المبلغ"], [14, 12, 22, 30, 36, 25, 14]), "Transactions");

    downloadWorkbook(workbook);
  }

  function exportExcelXlsx() {
    if (window.XLSX) {
      try {
        buildAndDownload();
      } catch (error) {
        console.error(error);
        alert("وقع مشكل فـ Excel. عاود جرب.");
      }
      return;
    }

    const button = document.getElementById("export-xlsx-btn");
    if (button) {
      button.disabled = true;
      button.textContent = "كنوجد Excel...";
    }

    preloadXlsx().then(function () {
      if (button) {
        button.disabled = false;
        button.textContent = "Export Excel XLSX";
      }
      buildAndDownload();
    }).catch(function () {
      if (button) {
        button.disabled = false;
        button.textContent = "Export Excel XLSX";
      }
      alert("تعذر تحميل خدمة Excel. تأكد من الإنترنت وعاود جرب.");
    });
  }
})();
