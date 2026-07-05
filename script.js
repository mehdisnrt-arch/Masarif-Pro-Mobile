const categories = [
  "قهوة",
  "فطور",
  "غداء",
  "حلوى",
  "عصير",
  "طاكسي",
  "صحة",
  "تحاليل",
  "أدوية",
  "صدقة",
  "سكانير",
  "نظافة",
  "دانون",
  "علكة",
  "بيمو",
  "بيرمي",
  "مدخول",
  "أخرى"
];

const categoryAliases = [
  { category: "قهوة", aliases: ["قهوة", "cafe", "café", "coffee"] },
  { category: "فطور", aliases: ["فطور", "petit dej", "petit-dej", "petit dejeuner", "breakfast"] },
  { category: "غداء", aliases: ["غداء", "dejeuner", "déjeuner", "lunch"] },
  { category: "طاكسي", aliases: ["طاكسي", "taxi"] },
  { category: "حلوى", aliases: ["حلوى"] },
  { category: "عصير", aliases: ["عصير"] },
  { category: "صحة", aliases: ["صحة"] },
  { category: "تحاليل", aliases: ["تحاليل"] },
  { category: "أدوية", aliases: ["أدوية"] },
  { category: "صدقة", aliases: ["صدقة"] },
  { category: "سكانير", aliases: ["سكانير"] },
  { category: "نظافة", aliases: ["نظافة"] },
  { category: "دانون", aliases: ["دانون"] },
  { category: "علكة", aliases: ["علكة"] },
  { category: "بيمو", aliases: ["بيمو"] },
  { category: "بيرمي", aliases: ["بيرمي"] },
  { category: "مدخول", aliases: ["مدخول", "revenu", "income"] }
];

const storageKey = "masarif_transactions_v1";
const budgetKey = "masarif_monthly_budget_v1";

cleanupOldOfflineCache();

const dateInput = document.getElementById("expenseDate");
const budgetInput = document.getElementById("monthlyBudget");
const expenseText = document.getElementById("expenseText");
const monthExpenseText = document.getElementById("monthExpenseText");
const addBtn = document.getElementById("addBtn");
const importMonthBtn = document.getElementById("importMonthBtn");
const tableBody = document.getElementById("expensesTable");
const emptyState = document.getElementById("emptyState");
const dayTotalEl = document.getElementById("dayTotal");
const monthTotalEl = document.getElementById("monthTotal");
const budgetLeftEl = document.getElementById("budgetLeft");
const budgetAlert = document.getElementById("budgetAlert");
const categoryTotalsTable = document.getElementById("categoryTotalsTable");
const incomeTotalsTable = document.getElementById("incomeTotalsTable");
const totalExpensesReport = document.getElementById("totalExpensesReport");
const totalIncomeReport = document.getElementById("totalIncomeReport");
const netReport = document.getElementById("netReport");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const exportJsonBtn = document.getElementById("exportJsonBtn");
const importJsonInput = document.getElementById("importJsonInput");

let transactions = loadTransactions();

function todayDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now - offset).toISOString().slice(0, 10);
}

function formatMoney(amount) {
  return `${amount.toFixed(2).replace(".00", "")} درهم`;
}

function formatNumber(amount) {
  return amount.toFixed(2).replace(".00", "");
}

function formatMad(amount) {
  return `${formatNumber(amount)} MAD`;
}

function isIncome(transaction) {
  return transaction.category === "مدخول";
}

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return String(Date.now() + Math.random());
}

function normalizeNumber(text) {
  const map = {
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
    "۰": "0",
    "۱": "1",
    "۲": "2",
    "۳": "3",
    "۴": "4",
    "۵": "5",
    "۶": "6",
    "۷": "7",
    "۸": "8",
    "۹": "9"
  };

  return text.replace(/[٠-٩۰-۹]/g, digit => map[digit]).replace(",", ".");
}

function normalizeText(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function loadTransactions() {
  const saved = localStorage.getItem(storageKey);

  if (!saved) {
    return [];
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTransactions() {
  localStorage.setItem(storageKey, JSON.stringify(transactions));
}

function saveBudget() {
  localStorage.setItem(budgetKey, budgetInput.value || "0");
}

function getMonthKey(date) {
  return date.slice(0, 7);
}

function parseLine(line, date = dateInput.value) {
  const cleanLine = normalizeNumber(line.trim());
  const amountMatch = cleanLine.match(/(\d+(?:\.\d+)?)\s*$/);

  if (!amountMatch) {
    return {
      error: `السطر "${line}" ما فيهش المبلغ. كتب مثلا: قهوة 10`
    };
  }

  const amount = Number(amountMatch[1]);
  const description = cleanLine.replace(amountMatch[0], "").trim();

  if (!description) {
    return {
      error: `السطر "${line}" خاصو category قبل المبلغ.`
    };
  }

  if (Number.isNaN(amount) || amount <= 0) {
    return {
      error: `السطر "${line}" فيه مبلغ غير صحيح.`
    };
  }

  const normalizedDescription = normalizeText(description);
  const match = categoryAliases.find(item =>
    item.aliases.some(alias => normalizedDescription.includes(normalizeText(alias)))
  );
  const category = match ? match.category : "أخرى";

  return {
    id: createId(),
    date,
    category,
    description,
    amount,
    createdAt: new Date().toISOString()
  };
}

function parseMonthDate(line) {
  const cleanLine = normalizeNumber(line.trim());
  const match = cleanLine.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  const yyyy = String(year).padStart(4, "0");
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

function looksLikeMonthDate(line) {
  return /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.test(normalizeNumber(line.trim()));
}

function makeImportKey(transaction, occurrence) {
  const normalizedDescription = normalizeText(transaction.description);
  return [
    transaction.date,
    normalizedDescription,
    transaction.amount.toFixed(2),
    occurrence
  ].join("|");
}

function parseMonthExpenses() {
  const lines = monthExpenseText.value.split("\n");
  const parsedTransactions = [];
  const errors = [];
  const occurrenceCounters = {};
  let currentDate = null;
  let firstDate = null;

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();

    if (!line) {
      return;
    }

    const parsedDate = parseMonthDate(line);

    if (parsedDate) {
      currentDate = parsedDate;
      firstDate = firstDate || parsedDate;
      return;
    }

    if (looksLikeMonthDate(line)) {
      errors.push(`السطر ${index + 1}: التاريخ غير صحيح.`);
      return;
    }

    if (!currentDate) {
      errors.push(`السطر ${index + 1}: خاص التاريخ قبل المصاريف.`);
      return;
    }

    const parsedLine = parseLine(line, currentDate);

    if (parsedLine.error) {
      errors.push(`السطر ${index + 1}: ${parsedLine.error}`);
      return;
    }

    const counterKey = [
      parsedLine.date,
      normalizeText(parsedLine.description),
      parsedLine.amount.toFixed(2)
    ].join("|");
    occurrenceCounters[counterKey] = (occurrenceCounters[counterKey] || 0) + 1;
    parsedLine.importKey = makeImportKey(parsedLine, occurrenceCounters[counterKey]);
    parsedLine.importSource = "month";
    parsedTransactions.push(parsedLine);
  });

  if (!firstDate && errors.length === 0) {
    errors.push("كتب مصاريف الشهر بالتاريخ، مثلا: 01/06/2026");
  }

  return {
    errors,
    firstDate,
    transactions: parsedTransactions
  };
}

function addExpenses() {
  const lines = expenseText.value.split("\n").map(line => line.trim()).filter(Boolean);
  const parsedLines = lines.map(parseLine);
  const errors = parsedLines.filter(item => item.error).map(item => item.error);
  const newTransactions = parsedLines.filter(item => !item.error);

  if (errors.length > 0) {
    alert(errors.join("\n"));
    return;
  }

  if (newTransactions.length === 0) {
    alert("كتب على الأقل مصروف واحد بحال: قهوة 10");
    return;
  }

  transactions = [...newTransactions, ...transactions];
  saveTransactions();
  expenseText.value = "";
  render();
}

function importMonthExpenses() {
  const result = parseMonthExpenses();

  if (result.errors.length > 0) {
    alert(result.errors.join("\n"));
    return;
  }

  const existingImportKeys = new Set(
    transactions
      .filter(transaction => transaction.importKey)
      .map(transaction => transaction.importKey)
  );
  const newTransactions = result.transactions.filter(transaction =>
    !existingImportKeys.has(transaction.importKey)
  );

  if (newTransactions.length > 0) {
    transactions = [...newTransactions, ...transactions];
    saveTransactions();
  }

  if (result.firstDate) {
    dateInput.value = result.firstDate;
  }

  monthExpenseText.value = "";
  render();
  alert("تم إدخال مصاريف الشهر بنجاح");
}

function deleteTransaction(id) {
  transactions = transactions.filter(transaction => transaction.id !== id);
  saveTransactions();
  render();
}

function getFilteredMonthTransactions() {
  const selectedMonth = getMonthKey(dateInput.value);
  return transactions.filter(transaction => getMonthKey(transaction.date) === selectedMonth);
}

function render() {
  const selectedDate = dateInput.value;
  const selectedMonth = getMonthKey(selectedDate);
  const monthlyBudget = Number(budgetInput.value) || 0;
  const monthTransactions = getFilteredMonthTransactions();
  const dayExpenses = transactions
    .filter(transaction => transaction.date === selectedDate && !isIncome(transaction))
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const monthExpenses = monthTransactions
    .filter(transaction => !isIncome(transaction))
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const budgetLeft = monthlyBudget - monthExpenses;

  dayTotalEl.textContent = formatMoney(dayExpenses);
  monthTotalEl.textContent = formatMoney(monthExpenses);
  budgetLeftEl.textContent = formatMoney(budgetLeft);
  tableBody.innerHTML = "";

  monthTransactions.forEach(transaction => {
    const row = document.createElement("tr");
    const dateCell = document.createElement("td");
    const categoryCell = document.createElement("td");
    const descriptionCell = document.createElement("td");
    const amountCell = document.createElement("td");
    const actionCell = document.createElement("td");
    const deleteButton = document.createElement("button");

    dateCell.textContent = transaction.date;
    categoryCell.textContent = transaction.category;
    descriptionCell.textContent = transaction.description;
    amountCell.textContent = formatMoney(transaction.amount);
    amountCell.className = "amount";

    deleteButton.textContent = "حذف";
    deleteButton.className = "delete-btn";
    deleteButton.dataset.id = transaction.id;
    deleteButton.type = "button";

    actionCell.appendChild(deleteButton);
    row.append(dateCell, categoryCell, descriptionCell, amountCell, actionCell);
    tableBody.appendChild(row);
  });

  emptyState.classList.toggle("hidden", monthTransactions.length > 0);
  renderCategoryReport(monthTransactions);
  renderBudgetAlert(monthlyBudget, monthExpenses, selectedMonth);
}

function renderCategoryReport(monthTransactions) {
  const categoryTotals = {};
  const totalExpenses = monthTransactions
    .filter(transaction => !isIncome(transaction))
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalIncome = monthTransactions
    .filter(isIncome)
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  monthTransactions.filter(transaction => !isIncome(transaction)).forEach(transaction => {
    categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + transaction.amount;
  });

  renderCategoryTotals(categoryTotals);
  renderIncomeTotal(totalIncome);
  totalExpensesReport.textContent = formatMad(totalExpenses);
  totalIncomeReport.textContent = formatMad(totalIncome);
  netReport.textContent = formatMad(totalExpenses - totalIncome);
}

function renderCategoryTotals(categoryTotals) {
  categoryTotalsTable.innerHTML = "";
  const sortedTotals = Object.entries(categoryTotals)
    .sort((first, second) => categories.indexOf(first[0]) - categories.indexOf(second[0]));

  if (sortedTotals.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 2;
    cell.textContent = "ما كاين حتى مصروف فهاد الشهر.";
    row.appendChild(cell);
    categoryTotalsTable.appendChild(row);
    return;
  }

  sortedTotals.forEach(([category, total]) => {
    const row = document.createElement("tr");
    const categoryCell = document.createElement("td");
    const totalCell = document.createElement("td");

    categoryCell.textContent = category;
    totalCell.textContent = formatNumber(total);
    totalCell.className = "amount";
    row.append(categoryCell, totalCell);
    categoryTotalsTable.appendChild(row);
  });
}

function renderIncomeTotal(totalIncome) {
  incomeTotalsTable.innerHTML = "";
  const row = document.createElement("tr");
  const labelCell = document.createElement("td");
  const totalCell = document.createElement("td");

  labelCell.textContent = "مدخول";
  totalCell.textContent = formatNumber(totalIncome);
  totalCell.className = "amount";
  row.append(labelCell, totalCell);
  incomeTotalsTable.appendChild(row);
}

function renderBudgetAlert(monthlyBudget, monthTotal, selectedMonth) {
  budgetAlert.className = "alert hidden";
  budgetAlert.textContent = "";

  if (monthlyBudget <= 0) {
    return;
  }

  const percentage = (monthTotal / monthlyBudget) * 100;

  if (monthTotal > monthlyBudget) {
    budgetAlert.textContent = `تنبيه أحمر: مصاريف شهر ${selectedMonth} فاتت Budget. صرفتي ${formatMoney(monthTotal)} من أصل ${formatMoney(monthlyBudget)}.`;
    budgetAlert.className = "alert danger";
    return;
  }

  if (percentage >= 80) {
    budgetAlert.textContent = `تنبيه برتقالي: وصلتي ${percentage.toFixed(0)}% من Budget ديال شهر ${selectedMonth}.`;
    budgetAlert.className = "alert warning";
  }
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function exportCsv() {
  const rows = [["date", "category", "description", "amount"]];

  transactions.forEach(transaction => {
    rows.push([
      transaction.date,
      transaction.category,
      transaction.description,
      String(transaction.amount)
    ]);
  });

  const csv = rows
    .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  downloadFile("masarif.csv", csv, "text/csv;charset=utf-8");
}

function exportJson() {
  const backup = {
    exportedAt: new Date().toISOString(),
    monthlyBudget: budgetInput.value || "0",
    transactions
  };

  downloadFile("masarif-backup.json", JSON.stringify(backup, null, 2), "application/json");
}

function importJson(file) {
  const reader = new FileReader();

  reader.onload = event => {
    try {
      const data = JSON.parse(event.target.result);
      const importedTransactions = Array.isArray(data) ? data : data.transactions;

      if (!Array.isArray(importedTransactions)) {
        throw new Error("Invalid backup");
      }

      transactions = importedTransactions;
      saveTransactions();

      if (data.monthlyBudget !== undefined) {
        budgetInput.value = data.monthlyBudget;
        saveBudget();
      }

      render();
      alert("Import tamam. رجعات data بنجاح.");
    } catch {
      alert("هاد الملف ماشي JSON backup صحيح.");
    }
  };

  reader.readAsText(file);
}

function cleanupOldOfflineCache() {
  if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then(registrations => {
        registrations.forEach(registration => {
          registration.unregister();
        });
      })
      .catch(() => {});
  }

  if (typeof window !== "undefined" && "caches" in window) {
    caches.keys()
      .then(cacheNames => {
        cacheNames
          .filter(cacheName => cacheName.startsWith("masarif-static"))
          .forEach(cacheName => {
            caches.delete(cacheName);
          });
      })
      .catch(() => {});
  }
}

dateInput.value = todayDate();
budgetInput.value = localStorage.getItem(budgetKey) || "";

addBtn.addEventListener("click", addExpenses);
importMonthBtn.addEventListener("click", importMonthExpenses);
dateInput.addEventListener("change", render);
budgetInput.addEventListener("input", () => {
  saveBudget();
  render();
});

tableBody.addEventListener("click", event => {
  if (event.target.classList.contains("delete-btn")) {
    deleteTransaction(event.target.dataset.id);
  }
});

exportCsvBtn.addEventListener("click", exportCsv);
exportJsonBtn.addEventListener("click", exportJson);
importJsonInput.addEventListener("change", event => {
  const file = event.target.files[0];

  if (file) {
    importJson(file);
  }

  event.target.value = "";
});

render();
