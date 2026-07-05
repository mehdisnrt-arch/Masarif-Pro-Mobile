/* Masarif Pro Mobile
   A local-first expense tracker. All data is stored on the user's phone
   with localStorage, so the first version does not need any backend. */

const STORAGE_KEY = "masarifProMobile.v1";
const CURRENCY = "MAD";
const CATEGORIES = [
  "قهوة",
  "فطور",
  "غداء",
  "عشاء",
  "أكل",
  "دواء",
  "طبيب",
  "سكانير",
  "طاكسي",
  "بنزين",
  "كراء",
  "صدقة",
  "هدية",
  "أخرى"
];
const INCOME_WORDS = ["مدخول", "دخل", "دخول", "income", "revenu", "revenue"];

const state = loadState();

const elements = {
  screenTitle: document.querySelector("#screen-title"),
  views: document.querySelectorAll(".view"),
  navButtons: document.querySelectorAll(".nav-button"),
  categoryInput: document.querySelector("#category-input"),
  form: document.querySelector("#transaction-form"),
  editId: document.querySelector("#edit-id"),
  amountInput: document.querySelector("#amount-input"),
  amountPreview: document.querySelector("#amount-preview"),
  dateInput: document.querySelector("#date-input"),
  noteInput: document.querySelector("#note-input"),
  clearFormBtn: document.querySelector("#clear-form-btn"),
  searchInput: document.querySelector("#search-input"),
  budgetInput: document.querySelector("#budget-input"),
  saveBudgetBtn: document.querySelector("#save-budget-btn"),
  resetDataBtn: document.querySelector("#reset-data-btn"),
  exportJsonBtn: document.querySelector("#export-json-btn"),
  importJsonInput: document.querySelector("#import-json-input"),
  exportCsvBtn: document.querySelector("#export-csv-btn"),
  toast: document.querySelector("#toast")
};

document.addEventListener("DOMContentLoaded", init);

function init() {
  populateCategories();
  elements.dateInput.value = todayISO();
  elements.budgetInput.value = state.settings.monthlyBudget || "";
  bindEvents();
  render();
}

function bindEvents() {
  elements.navButtons.forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.view, button.dataset.title));
  });

  elements.form.addEventListener("submit", saveTransaction);
  elements.clearFormBtn.addEventListener("click", resetForm);
  elements.amountInput.addEventListener("input", updateAmountPreview);
  elements.searchInput.addEventListener("input", renderTransactions);
  elements.saveBudgetBtn.addEventListener("click", saveBudget);
  elements.resetDataBtn.addEventListener("click", resetAllData);
  elements.exportJsonBtn.addEventListener("click", exportJson);
  elements.importJsonInput.addEventListener("change", importJson);
  elements.exportCsvBtn.addEventListener("click", exportCsv);
}

function populateCategories() {
  elements.categoryInput.innerHTML = CATEGORIES
    .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
    .join("");
}

function showView(viewId, title) {
  elements.views.forEach((view) => view.classList.toggle("active", view.id === viewId));
  elements.navButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === viewId));
  elements.screenTitle.textContent = title;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function saveTransaction(event) {
  event.preventDefault();

  let parsed;
  try {
    parsed = parseTransactionInput(
      elements.amountInput.value,
      elements.categoryInput.value,
      document.querySelector("input[name='type']:checked").value
    );
  } catch (error) {
    showToast(error.message);
    elements.amountInput.focus();
    return;
  }

  const transaction = {
    id: elements.editId.value || generateId(),
    amount: parsed.amount,
    category: parsed.category,
    type: parsed.type,
    date: elements.dateInput.value || todayISO(),
    note: elements.noteInput.value.trim(),
    updatedAt: new Date().toISOString()
  };

  const existingIndex = state.transactions.findIndex((item) => item.id === transaction.id);
  if (existingIndex >= 0) {
    state.transactions[existingIndex] = transaction;
    showToast("تم تعديل العملية");
  } else {
    state.transactions.push({ ...transaction, createdAt: new Date().toISOString() });
    showToast("تم حفظ العملية");
  }

  persist();
  resetForm();
  render();
  showView("dashboard-view", "لوحة التحكم");
}

function resetForm() {
  elements.form.reset();
  elements.editId.value = "";
  elements.dateInput.value = todayISO();
  elements.amountPreview.textContent = "يمكنك استعمال + - * /";
  document.querySelector("input[name='type'][value='expense']").checked = true;
}

function updateAmountPreview() {
  const value = elements.amountInput.value.trim();
  if (!value) {
    elements.amountPreview.textContent = "أمثلة: قهوة 10، فطور 8*3، مدخول 1000";
    return;
  }

  try {
    const parsed = parseTransactionInput(
      value,
      elements.categoryInput.value,
      document.querySelector("input[name='type']:checked").value
    );
    const typeLabel = parsed.type === "income" ? "مدخول" : "مصروف";
    elements.amountPreview.textContent = `${typeLabel}: ${parsed.category} · ${formatMoney(parsed.amount)}`;
  } catch {
    elements.amountPreview.textContent = "أدخل حسابا صحيحا";
  }
}

function editTransaction(id) {
  const transaction = state.transactions.find((item) => item.id === id);
  if (!transaction) return;

  elements.editId.value = transaction.id;
  elements.amountInput.value = transaction.amount;
  elements.categoryInput.value = transaction.category;
  elements.dateInput.value = transaction.date;
  elements.noteInput.value = transaction.note || "";
  document.querySelector(`input[name='type'][value='${transaction.type}']`).checked = true;
  updateAmountPreview();
  showView("add-view", "تعديل عملية");
}

function deleteTransaction(id) {
  if (!confirm("هل تريد حذف هذه العملية؟")) return;
  state.transactions = state.transactions.filter((item) => item.id !== id);
  persist();
  render();
  showToast("تم حذف العملية");
}

function saveBudget() {
  const budget = Number(elements.budgetInput.value);
  if (!Number.isFinite(budget) || budget < 0) {
    showToast("أدخل ميزانية صحيحة");
    return;
  }

  state.settings.monthlyBudget = roundMoney(budget);
  persist();
  renderDashboard();
  showToast("تم حفظ الميزانية");
}

function resetAllData() {
  if (!confirm("سيتم حذف كل العمليات والإعدادات. هل أنت متأكد؟")) return;
  if (!confirm("تأكيد أخير: حذف جميع بيانات Masarif Pro Mobile؟")) return;

  state.transactions = [];
  state.settings = { monthlyBudget: 0 };
  persist();
  elements.budgetInput.value = "";
  resetForm();
  render();
  showToast("تم مسح البيانات");
}

function render() {
  renderDashboard();
  renderTransactions();
  renderReports();
}

function renderDashboard() {
  const today = todayISO();
  const monthKey = today.slice(0, 7);
  const currentMonth = state.transactions.filter((item) => item.date.startsWith(monthKey));
  const todayExpenses = sumBy(state.transactions, (item) => item.type === "expense" && item.date === today);
  const monthExpenses = sumBy(currentMonth, (item) => item.type === "expense");
  const monthIncome = sumBy(currentMonth, (item) => item.type === "income");
  const net = monthIncome - monthExpenses;
  const budget = Number(state.settings.monthlyBudget) || 0;
  const remaining = budget - monthExpenses;

  setText("#today-total", formatMoney(todayExpenses));
  setText("#month-expense-total", formatMoney(monthExpenses));
  setText("#month-income-total", formatMoney(monthIncome));
  setText("#budget-total", formatMoney(budget));
  setText("#budget-remaining", formatMoney(remaining));

  const netElement = document.querySelector("#net-balance");
  netElement.textContent = formatMoney(net);
  netElement.classList.toggle("positive", net >= 0);
  netElement.classList.toggle("negative", net < 0);

  document.querySelector("#budget-warning").classList.toggle("hidden", !(budget > 0 && monthExpenses > budget));
}

function renderTransactions() {
  const query = elements.searchInput.value.trim().toLowerCase();
  const filtered = state.transactions
    .filter((item) => {
      const text = `${item.category} ${item.note || ""}`.toLowerCase();
      return text.includes(query);
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt));

  document.querySelector("#transaction-count").textContent = filtered.length;

  const list = document.querySelector("#transactions-list");
  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state">لا توجد عمليات حاليا</div>`;
    return;
  }

  const grouped = groupBy(filtered, (item) => item.date);
  list.innerHTML = Object.entries(grouped)
    .map(([date, transactions]) => renderDateGroup(date, transactions))
    .join("");

  list.querySelectorAll("[data-edit-id]").forEach((button) => {
    button.addEventListener("click", () => editTransaction(button.dataset.editId));
  });
  list.querySelectorAll("[data-delete-id]").forEach((button) => {
    button.addEventListener("click", () => deleteTransaction(button.dataset.deleteId));
  });
}

function renderDateGroup(date, transactions) {
  const dayTotal = sumBy(transactions, (item) => item.type === "expense");
  return `
    <article class="date-group">
      <div class="date-title">
        <span>${formatDate(date)}</span>
        <span>${formatMoney(dayTotal)}</span>
      </div>
      <div class="table-wrap">
        <table class="transactions-table">
          <tbody>
            ${transactions.map(renderTransactionItem).join("")}
          </tbody>
        </table>
      </div>
    </article>
  `;
}

function renderTransactionItem(transaction) {
  const sign = transaction.type === "expense" ? "-" : "+";
  const note = transaction.note ? `<div class="transaction-note">${escapeHtml(transaction.note)}</div>` : "";
  const typeLabel = transaction.type === "expense" ? "مصروف" : "دخل";

  return `
    <tr class="transaction-item">
      <td class="transaction-meta">
        <div class="transaction-category">${escapeHtml(transaction.category)} · ${typeLabel}</div>
        ${note}
      </td>
      <td class="amount ${transaction.type}">${sign}${formatMoney(transaction.amount)}</td>
      <td class="transaction-actions">
        <button class="icon-button" type="button" data-edit-id="${escapeHtml(transaction.id)}" aria-label="تعديل">✎</button>
        <button class="icon-button delete" type="button" data-delete-id="${escapeHtml(transaction.id)}" aria-label="حذف">×</button>
      </td>
    </tr>
  `;
}

function renderReports() {
  const monthKey = todayISO().slice(0, 7);
  const monthTransactions = state.transactions.filter((item) => item.date.startsWith(monthKey));
  const monthExpenses = monthTransactions.filter((item) => item.type === "expense");
  const categoryTotals = totalsBy(monthExpenses, (item) => item.category);
  const dailyTotals = totalsBy(monthExpenses, (item) => item.date);
  const totalExpense = sumBy(monthTransactions, (item) => item.type === "expense");
  const totalIncome = sumBy(monthTransactions, (item) => item.type === "income");

  renderCategoryReport(categoryTotals, totalExpense);
  renderDailyReport(dailyTotals);
  renderMonthlySummary(totalIncome, totalExpense);
}

function renderCategoryReport(categoryTotals, totalExpense) {
  const report = document.querySelector("#category-report");
  const rows = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  if (!rows.length) {
    report.innerHTML = `<div class="empty-state">لا توجد مصاريف لهذا الشهر</div>`;
    return;
  }

  report.innerHTML = rows
    .map(([category, total]) => {
      const percent = totalExpense ? Math.round((total / totalExpense) * 100) : 0;
      return `
        <div>
          <div class="report-row">
            <strong>${escapeHtml(category)}</strong>
            <span>${formatMoney(total)}</span>
          </div>
          <div class="bar-track" aria-hidden="true">
            <div class="bar-fill" style="width: ${percent}%"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderDailyReport(dailyTotals) {
  const body = document.querySelector("#daily-report");
  const rows = Object.entries(dailyTotals).sort((a, b) => b[0].localeCompare(a[0]));

  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="2">لا توجد مصاريف</td></tr>`;
    return;
  }

  body.innerHTML = rows
    .map(([date, total]) => `<tr><td>${formatDate(date)}</td><td>${formatMoney(total)}</td></tr>`)
    .join("");
}

function renderMonthlySummary(totalIncome, totalExpense) {
  const net = totalIncome - totalExpense;
  document.querySelector("#monthly-summary").innerHTML = `
    <div class="summary-row"><strong>الدخل</strong><span>${formatMoney(totalIncome)}</span></div>
    <div class="summary-row"><strong>المصاريف</strong><span>${formatMoney(totalExpense)}</span></div>
    <div class="summary-row"><strong>الصافي</strong><span>${formatMoney(net)}</span></div>
  `;
}

function exportJson() {
  downloadFile(
    `masarif-backup-${todayISO()}.json`,
    JSON.stringify(state, null, 2),
    "application/json"
  );
}

function importJson(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      validateImport(imported);
      state.transactions = imported.transactions;
      state.settings = { monthlyBudget: Number(imported.settings?.monthlyBudget) || 0 };
      persist();
      elements.budgetInput.value = state.settings.monthlyBudget || "";
      render();
      showToast("تم استيراد النسخة الاحتياطية");
    } catch (error) {
      showToast(error.message || "ملف غير صالح");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

function exportCsv() {
  const header = ["id", "date", "type", "category", "amount", "note"];
  const rows = state.transactions.map((item) => [
    item.id,
    item.date,
    item.type,
    item.category,
    item.amount,
    item.note || ""
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  downloadFile(`masarif-transactions-${todayISO()}.csv`, csv, "text/csv;charset=utf-8");
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function validateImport(data) {
  if (!data || !Array.isArray(data.transactions)) {
    throw new Error("ملف النسخة الاحتياطية غير صالح");
  }

  data.transactions.forEach((item) => {
    const validType = item.type === "expense" || item.type === "income";
    const validAmount = Number.isFinite(Number(item.amount)) && Number(item.amount) >= 0;
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(item.date || "");
    const validId = /^[A-Za-z0-9:_-]+$/.test(String(item.id || ""));
    if (!validId || !validType || !validAmount || !validDate) {
      throw new Error("النسخة الاحتياطية تحتوي على عملية غير صالحة");
    }
    item.id = String(item.id);
    item.amount = roundMoney(Number(item.amount));
    item.category = String(item.category || "أخرى");
    item.note = String(item.note || "");
    item.updatedAt = item.updatedAt || new Date().toISOString();
  });
}

function parseTransactionInput(rawValue, fallbackCategory, fallbackType) {
  const value = normalizeInput(rawValue);
  if (!value) throw new Error("أدخل العملية");

  const firstNumberIndex = value.search(/\d/);
  if (firstNumberIndex === -1) throw new Error("أدخل المبلغ");

  const categoryText = value.slice(0, firstNumberIndex).trim();
  const expression = value.slice(firstNumberIndex).trim();
  const amount = parseAmountExpression(expression);
  const type = isIncomeText(categoryText) ? "income" : fallbackType;
  const category = resolveCategory(categoryText, type, fallbackCategory);

  return { amount, category, type };
}

function resolveCategory(categoryText, type, fallbackCategory) {
  if (type === "income" && isIncomeText(categoryText)) {
    return "مدخول";
  }

  if (!categoryText) {
    return fallbackCategory || "أخرى";
  }

  const exactCategory = CATEGORIES.find((category) => category === categoryText);
  if (exactCategory) return exactCategory;

  const compactText = categoryText.replace(/\s+/g, "");
  const compactCategory = CATEGORIES.find((category) => category.replace(/\s+/g, "") === compactText);
  return compactCategory || fallbackCategory || "أخرى";
}

function isIncomeText(text) {
  const normalized = normalizeInput(text).toLowerCase();
  return INCOME_WORDS.some((word) => normalized.includes(word.toLowerCase()));
}

/* Safe calculator parser for + - * / without using eval.
   Grammar: expression -> term -> factor, with optional parentheses. */
function parseAmountExpression(expression) {
  const input = normalizeInput(expression).replace(/\s+/g, "").replace(/,/g, ".");
  if (!input) throw new Error("أدخل المبلغ");
  if (!/^[\d+\-*/().]+$/.test(input)) throw new Error("الحساب يحتوي على رموز غير مسموحة");

  let index = 0;

  function parseExpression() {
    let value = parseTerm();
    while (input[index] === "+" || input[index] === "-") {
      const operator = input[index++];
      const next = parseTerm();
      value = operator === "+" ? value + next : value - next;
    }
    return value;
  }

  function parseTerm() {
    let value = parseFactor();
    while (input[index] === "*" || input[index] === "/") {
      const operator = input[index++];
      const next = parseFactor();
      if (operator === "/" && next === 0) throw new Error("لا يمكن القسمة على صفر");
      value = operator === "*" ? value * next : value / next;
    }
    return value;
  }

  function parseFactor() {
    if (input[index] === "-") {
      index += 1;
      return -parseFactor();
    }

    if (input[index] === "(") {
      index += 1;
      const value = parseExpression();
      if (input[index] !== ")") throw new Error("الأقواس غير مكتملة");
      index += 1;
      return value;
    }

    return parseNumber();
  }

  function parseNumber() {
    const start = index;
    while (/\d|\./.test(input[index])) index += 1;
    const raw = input.slice(start, index);
    if (!raw || raw === "." || (raw.match(/\./g) || []).length > 1) {
      throw new Error("أدخل رقما صحيحا");
    }
    return Number(raw);
  }

  const result = parseExpression();
  if (index !== input.length) throw new Error("الحساب غير مكتمل");
  if (!Number.isFinite(result) || result < 0) throw new Error("المبلغ يجب أن يكون صفرا أو أكثر");
  return roundMoney(result);
}

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored && Array.isArray(stored.transactions)) {
      return {
        transactions: stored.transactions,
        settings: { monthlyBudget: Number(stored.settings?.monthlyBudget) || 0 }
      };
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }

  return {
    transactions: [],
    settings: { monthlyBudget: 0 }
  };
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    showToast("تعذر حفظ البيانات على هذا المتصفح");
  }
}

function generateId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `tx-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function sumBy(items, predicate) {
  return roundMoney(items.reduce((total, item) => total + (predicate(item) ? Number(item.amount) : 0), 0));
}

function totalsBy(items, keyFn) {
  return items.reduce((totals, item) => {
    const key = keyFn(item);
    totals[key] = roundMoney((totals[key] || 0) + Number(item.amount));
    return totals;
  }, {});
}

function groupBy(items, keyFn) {
  return items.reduce((groups, item) => {
    const key = keyFn(item);
    groups[key] = groups[key] || [];
    groups[key].push(item);
    return groups;
  }, {});
}

function todayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function formatDate(date) {
  return new Intl.DateTimeFormat("ar-MA", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(`${date}T12:00:00`));
}

function formatMoney(value) {
  return `${roundMoney(value).toLocaleString("fr-MA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} ${CURRENCY}`;
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function normalizeInput(value) {
  return String(value || "")
    .replace(/[٠-٩]/g, (digit) => "٠١٢٣٤٥٦٧٨٩".indexOf(digit))
    .replace(/[۰-۹]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹".indexOf(digit))
    .trim();
}

function setText(selector, value) {
  document.querySelector(selector).textContent = value;
}

function csvCell(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => elements.toast.classList.remove("show"), 2200);
}
