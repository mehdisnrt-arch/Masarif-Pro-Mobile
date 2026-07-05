/* Masarif Pro Mobile
   Static, local-first expense tracker. Data stays in localStorage. */

const STORAGE_KEY = "masarifProMobile.v1";
const CURRENCY = "MAD";

const DEFAULT_CATEGORIES = [
  "قهوة",
  "فطور",
  "غداء",
  "عشاء",
  "أكل",
  "حلوى",
  "عصير",
  "طاكسي",
  "صحة",
  "طبيب",
  "تحاليل",
  "أدوية",
  "سكانير",
  "بنزين",
  "كراء",
  "صدقة",
  "هدية",
  "نظافة",
  "دانون",
  "علكة",
  "بيمو",
  "بيرمي",
  "مدخول",
  "أخرى"
];

const BASE_KEYWORDS = {
  "قهوة": ["قهوة", "قهوي", "cafe", "coffee", "nespresso"],
  "فطور": ["فطور", "فطر", "breakfast", "petit dej"],
  "غداء": ["غداء", "غدا", "lunch", "dejeuner"],
  "عشاء": ["عشاء", "dinner"],
  "أكل": ["أكل", "اكل", "ماكلة", "مطعم", "restaurant", "food"],
  "حلوى": ["حلوى", "حلاوة", "حلويات", "gateau", "sweet"],
  "عصير": ["عصير", "jus", "juice"],
  "طاكسي": ["طاكسي", "تاكسي", "taxi"],
  "صحة": ["صحة", "sante", "health"],
  "طبيب": ["طبيب", "دكتور", "doctor", "medecin"],
  "تحاليل": ["تحاليل", "تحليل", "analyse", "analyses"],
  "أدوية": ["أدوية", "ادوية", "دواء", "دوا", "pharma", "pharmacie"],
  "سكانير": ["سكانير", "scanner", "scan"],
  "بنزين": ["بنزين", "مازوط", "gasoil", "diesel", "essence"],
  "كراء": ["كراء", "loyer", "rent"],
  "صدقة": ["صدقة", "sadaka"],
  "هدية": ["هدية", "gift", "cadeau"],
  "نظافة": ["نظافة", "clean", "menage"],
  "دانون": ["دانون", "danone"],
  "علكة": ["علكة", "علك", "gum"],
  "بيمو": ["بيمو", "bimo"],
  "بيرمي": ["بيرمي", "permis", "permit"],
  "مدخول": ["مدخول", "دخل", "دخول", "income", "revenu", "salaire", "pay"]
};

const state = loadState();
let editingId = "";

const elements = {};

document.addEventListener("DOMContentLoaded", init);

function init() {
  cacheElements();
  elements.quickDate.value = todayISO();
  elements.budgetInput.value = state.settings.monthlyBudget || "";
  bindEvents();
  refreshCategoryControls();
  render();
}

function cacheElements() {
  [
    "screen-title",
    "net-balance",
    "month-income-total",
    "month-expense-total",
    "today-total",
    "budget-remaining",
    "budget-total",
    "dashboard-count",
    "budget-warning",
    "recent-transactions",
    "edit-id",
    "quick-date",
    "quick-input",
    "quick-preview",
    "save-quick-btn",
    "clear-quick-btn",
    "month-import-input",
    "import-preview",
    "import-month-btn",
    "clear-import-btn",
    "report-expenses",
    "report-income",
    "report-net",
    "biggest-category",
    "category-report",
    "daily-report",
    "transaction-count",
    "search-input",
    "filter-date",
    "filter-category",
    "transactions-list",
    "budget-input",
    "save-budget-btn",
    "custom-category-input",
    "add-category-btn",
    "custom-category-list",
    "keyword-category",
    "keyword-input",
    "add-keyword-btn",
    "keyword-list",
    "export-json-btn",
    "import-json-input",
    "export-csv-btn",
    "reset-data-btn",
    "toast"
  ].forEach((id) => {
    elements[toCamel(id)] = document.getElementById(id);
  });

  elements.views = document.querySelectorAll(".view");
  elements.navButtons = document.querySelectorAll(".nav-button");
  elements.jumpButtons = document.querySelectorAll("[data-view-jump]");
}

function bindEvents() {
  elements.navButtons.forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.view, button.dataset.title));
  });

  elements.jumpButtons.forEach((button) => {
    button.addEventListener("click", () => showView(button.dataset.viewJump, "Reports"));
  });

  elements.quickInput.addEventListener("input", renderQuickPreview);
  elements.quickDate.addEventListener("change", renderQuickPreview);
  elements.saveQuickBtn.addEventListener("click", saveQuickEntries);
  elements.clearQuickBtn.addEventListener("click", clearQuickInput);

  elements.monthImportInput.addEventListener("input", renderImportPreview);
  elements.importMonthBtn.addEventListener("click", importMonthEntries);
  elements.clearImportBtn.addEventListener("click", () => {
    elements.monthImportInput.value = "";
    renderImportPreview();
  });

  elements.searchInput.addEventListener("input", renderTransactions);
  elements.filterDate.addEventListener("change", renderTransactions);
  elements.filterCategory.addEventListener("change", renderTransactions);
  elements.transactionsList.addEventListener("click", handleTransactionAction);

  elements.saveBudgetBtn.addEventListener("click", saveBudget);
  elements.addCategoryBtn.addEventListener("click", addCustomCategory);
  elements.customCategoryList.addEventListener("click", handleCustomCategoryDelete);
  elements.keywordCategory.addEventListener("change", renderKeywordList);
  elements.addKeywordBtn.addEventListener("click", addKeyword);
  elements.keywordList.addEventListener("click", handleKeywordDelete);

  elements.exportJsonBtn.addEventListener("click", exportJson);
  elements.importJsonInput.addEventListener("change", importJson);
  elements.exportCsvBtn.addEventListener("click", exportCsv);
  elements.resetDataBtn.addEventListener("click", resetAllData);
}

function showView(viewId, title) {
  elements.views.forEach((view) => view.classList.toggle("active", view.id === viewId));
  elements.navButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === viewId));
  elements.screenTitle.textContent = title;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function saveQuickEntries() {
  const date = elements.quickDate.value || todayISO();
  const lines = parseLines(elements.quickInput.value, date);

  if (lines.errors.length) {
    showToast(lines.errors[0]);
    return;
  }

  if (!lines.transactions.length) {
    showToast("كتب شي عملية عاد حفظ");
    return;
  }

  if (editingId) {
    const first = lines.transactions[0];
    const index = state.transactions.findIndex((item) => item.id === editingId);
    if (index !== -1) {
      state.transactions[index] = {
        ...state.transactions[index],
        ...first,
        id: editingId,
        updatedAt: new Date().toISOString()
      };
    }
    showToast("تعدلات العملية");
  } else {
    addTransactions(lines.transactions, { dedupe: false });
    showToast(`تزادو ${lines.transactions.length} عمليات`);
  }

  persist();
  clearQuickInput();
  render();
  showView("dashboard-view", "Dashboard");
}

function clearQuickInput() {
  editingId = "";
  elements.editId.value = "";
  elements.quickInput.value = "";
  elements.quickDate.value = todayISO();
  renderQuickPreview();
}

function importMonthEntries() {
  const parsed = parseMonthImport(elements.monthImportInput.value);

  if (parsed.errors.length) {
    showToast(parsed.errors[0]);
    return;
  }

  if (!parsed.transactions.length) {
    showToast("ما كاين حتى سطر صالح");
    return;
  }

  const result = addTransactions(parsed.transactions, { dedupe: true });
  persist();
  render();
  renderImportPreview();
  showToast(`تسجلو ${result.added} وتفادينا ${result.skipped} مكرر`);
}

function addTransactions(transactions, options) {
  const dedupe = options && options.dedupe;
  const existingKeys = new Set(state.transactions.map(buildDuplicateKey));
  let added = 0;
  let skipped = 0;

  transactions.forEach((transaction) => {
    const prepared = {
      id: transaction.id || generateId(),
      date: transaction.date || todayISO(),
      type: transaction.type || "expense",
      category: transaction.category || "أخرى",
      amount: roundMoney(transaction.amount),
      note: transaction.note || "",
      raw: transaction.raw || "",
      importKey: transaction.importKey || "",
      createdAt: transaction.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const key = buildDuplicateKey(prepared);
    if (dedupe && existingKeys.has(key)) {
      skipped += 1;
      return;
    }

    state.transactions.push(prepared);
    existingKeys.add(key);
    added += 1;
  });

  return { added, skipped };
}

function parseLines(text, fallbackDate) {
  const transactions = [];
  const errors = [];
  const lines = String(text || "").split(/\r?\n/);

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line || parseDateLine(line)) return;

    try {
      transactions.push(parseTransactionLine(line, fallbackDate));
    } catch (error) {
      errors.push(`السطر ${index + 1}: ${error.message}`);
    }
  });

  return { transactions, errors };
}

function parseMonthImport(text) {
  const transactions = [];
  const errors = [];
  let currentDate = "";

  String(text || "").split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) return;

    const date = parseDateLine(line);
    if (date) {
      currentDate = date;
      return;
    }

    if (!currentDate) {
      errors.push(`السطر ${index + 1}: خاص التاريخ قبل العمليات`);
      return;
    }

    try {
      transactions.push(parseTransactionLine(line, currentDate));
    } catch (error) {
      errors.push(`السطر ${index + 1}: ${error.message}`);
    }
  });

  return { transactions, errors };
}

function parseTransactionLine(line, date) {
  const normalizedLine = normalizeInput(line);
  const firstNumber = normalizedLine.search(/\d/);
  if (firstNumber === -1) throw new Error("ما لقيتش المبلغ");

  const label = normalizedLine.slice(0, firstNumber).trim();
  const rest = normalizedLine.slice(firstNumber).trim();
  const amountMatch = rest.match(/^([0-9+\-*/().,\s]+)/);
  if (!amountMatch) throw new Error("الحساب غير صالح");

  const expression = amountMatch[1].trim();
  const note = rest.slice(amountMatch[1].length).trim();
  const amount = parseAmountExpression(expression);
  const category = detectCategory(label);
  const type = category === "مدخول" || isIncomeLabel(label) ? "income" : "expense";

  return {
    id: generateId(),
    date,
    type,
    category: type === "income" ? "مدخول" : category,
    amount,
    note,
    raw: normalizedLine,
    importKey: stableKey(`${date}|${type}|${category}|${amount}|${normalizeForMatch(normalizedLine)}`),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function detectCategory(label) {
  const normalized = normalizeForMatch(label);
  if (!normalized) return "أخرى";
  if (isIncomeLabel(label)) return "مدخول";

  const categories = getAllCategories();
  const exact = categories.find((category) => normalizeForMatch(category) === normalized);
  if (exact) return exact;

  const keywordMap = getKeywordMap();
  for (const category of categories) {
    const keywords = keywordMap[category] || [];
    if (keywords.some((keyword) => normalized.includes(normalizeForMatch(keyword)))) {
      return category;
    }
  }

  return "أخرى";
}

function isIncomeLabel(label) {
  const normalized = normalizeForMatch(label);
  return (BASE_KEYWORDS["مدخول"] || []).some((keyword) => normalized.includes(normalizeForMatch(keyword)));
}

function parseDateLine(line) {
  const value = normalizeInput(line).trim();
  let match = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (match) return toISODate(Number(match[1]), Number(match[2]), Number(match[3]));

  match = value.match(/^(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?$/);
  if (!match) return "";

  const day = Number(match[1]);
  const month = Number(match[2]);
  let year = match[3] ? Number(match[3]) : Number(todayISO().slice(0, 4));
  if (year < 100) year += 2000;
  return toISODate(year, month, day);
}

function toISODate(year, month, day) {
  if (month < 1 || month > 12 || day < 1 || day > 31) return "";
  const date = new Date(year, month - 1, day, 12, 0, 0);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return "";
  return [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0")
  ].join("-");
}

/* Safe calculator parser for + - * / without eval. */
function parseAmountExpression(expression) {
  const input = normalizeInput(expression).replace(/\s+/g, "").replace(/,/g, ".");
  if (!input) throw new Error("دخل المبلغ");
  if (!/^[\d+\-*/().]+$/.test(input)) throw new Error("استعمل غير + - * /");

  let index = 0;

  function parseExpression() {
    let value = parseTerm();
    while (input[index] === "+" || input[index] === "-") {
      const operator = input[index];
      index += 1;
      const next = parseTerm();
      value = operator === "+" ? value + next : value - next;
    }
    return value;
  }

  function parseTerm() {
    let value = parseFactor();
    while (input[index] === "*" || input[index] === "/") {
      const operator = input[index];
      index += 1;
      const next = parseFactor();
      if (operator === "/" && next === 0) throw new Error("القسمة على صفر ممنوعة");
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
      if (input[index] !== ")") throw new Error("الأقواس ناقصة");
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
      throw new Error("رقم غير صالح");
    }
    return Number(raw);
  }

  const result = parseExpression();
  if (index !== input.length) throw new Error("الحساب غير مكتمل");
  if (!Number.isFinite(result) || result < 0) throw new Error("المبلغ خاصو يكون موجب");
  return roundMoney(result);
}

function render() {
  refreshCategoryControls();
  renderDashboard();
  renderQuickPreview();
  renderImportPreview();
  renderReports();
  renderTransactions();
  renderSettings();
}

function renderDashboard() {
  const monthKey = todayISO().slice(0, 7);
  const monthTransactions = state.transactions.filter((item) => item.date.startsWith(monthKey));
  const todayExpenses = sumBy(state.transactions, (item) => item.type === "expense" && item.date === todayISO());
  const monthExpenses = sumBy(monthTransactions, (item) => item.type === "expense");
  const monthIncome = sumBy(monthTransactions, (item) => item.type === "income");
  const net = roundMoney(monthIncome - monthExpenses);
  const budget = Number(state.settings.monthlyBudget) || 0;
  const remaining = roundMoney(budget - monthExpenses);

  setText(elements.todayTotal, formatMoney(todayExpenses));
  setText(elements.monthExpenseTotal, formatMoney(monthExpenses));
  setText(elements.monthIncomeTotal, formatMoney(monthIncome));
  setText(elements.netBalance, formatMoney(net));
  setText(elements.budgetTotal, formatMoney(budget));
  setText(elements.budgetRemaining, formatMoney(remaining));
  setText(elements.dashboardCount, String(monthTransactions.length));

  elements.netBalance.classList.toggle("positive", net >= 0);
  elements.netBalance.classList.toggle("negative", net < 0);
  elements.budgetRemaining.classList.toggle("positive", remaining >= 0);
  elements.budgetRemaining.classList.toggle("negative", remaining < 0);
  elements.budgetWarning.classList.toggle("hidden", !(budget > 0 && monthExpenses > budget));

  renderRecentTransactions();
}

function renderRecentTransactions() {
  const recent = getSortedTransactions().slice(0, 4);
  if (!recent.length) {
    elements.recentTransactions.innerHTML = `<div class="empty-state">ما كايناش عمليات دابا</div>`;
    return;
  }

  elements.recentTransactions.innerHTML = recent.map((item) => `
    <div class="compact-item">
      <div>
        <strong>${escapeHtml(item.category)}</strong>
        <span>${formatShortDate(item.date)}</span>
      </div>
      <b class="amount ${item.type}">${item.type === "income" ? "+" : "-"}${formatMoney(item.amount)}</b>
    </div>
  `).join("");
}

function renderQuickPreview() {
  const parsed = parseLines(elements.quickInput.value, elements.quickDate.value || todayISO());
  const expenses = sumBy(parsed.transactions, (item) => item.type === "expense");
  const income = sumBy(parsed.transactions, (item) => item.type === "income");

  if (parsed.errors.length) {
    elements.quickPreview.textContent = parsed.errors[0];
    return;
  }

  elements.quickPreview.textContent = `${parsed.transactions.length} عملية · مصاريف ${formatMoney(expenses)} · مدخول ${formatMoney(income)}`;
}

function renderImportPreview() {
  const parsed = parseMonthImport(elements.monthImportInput.value);
  const expenses = sumBy(parsed.transactions, (item) => item.type === "expense");
  const income = sumBy(parsed.transactions, (item) => item.type === "income");

  if (parsed.errors.length) {
    elements.importPreview.textContent = parsed.errors[0];
    return;
  }

  elements.importPreview.textContent = `${parsed.transactions.length} عملية · مصاريف ${formatMoney(expenses)} · مدخول ${formatMoney(income)}`;
}

function renderReports() {
  const monthKey = todayISO().slice(0, 7);
  const monthTransactions = state.transactions.filter((item) => item.date.startsWith(monthKey));
  const monthExpenses = sumBy(monthTransactions, (item) => item.type === "expense");
  const monthIncome = sumBy(monthTransactions, (item) => item.type === "income");
  const net = roundMoney(monthIncome - monthExpenses);
  const budget = Number(state.settings.monthlyBudget) || 0;
  const remaining = roundMoney(budget - monthExpenses);
  const categoryTotals = totalsBy(monthTransactions.filter((item) => item.type === "expense"), (item) => item.category);
  const dailyTotals = totalsBy(monthTransactions.filter((item) => item.type === "expense"), (item) => item.date);
  const biggest = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];

  setText(elements.reportExpenses, formatMoney(monthExpenses));
  setText(elements.reportIncome, formatMoney(monthIncome));
  setText(elements.reportNet, formatMoney(net));
  setText(elements.biggestCategory, biggest ? `${biggest[0]} · ${formatMoney(biggest[1])}` : "-");
  setText(elements.budgetRemaining, formatMoney(remaining));

  elements.reportNet.classList.toggle("positive", net >= 0);
  elements.reportNet.classList.toggle("negative", net < 0);

  renderCategoryReport(categoryTotals, monthExpenses);
  renderDailyReport(dailyTotals);
}

function renderCategoryReport(categoryTotals, totalExpense) {
  const rows = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  if (!rows.length) {
    elements.categoryReport.innerHTML = `<div class="empty-state">ما كايناش مصاريف هاد الشهر</div>`;
    return;
  }

  elements.categoryReport.innerHTML = rows.map(([category, total]) => {
    const percent = totalExpense ? Math.round((total / totalExpense) * 100) : 0;
    return `
      <div class="bar-row">
        <div class="bar-row-head">
          <strong>${escapeHtml(category)}</strong>
          <span>${formatMoney(total)}</span>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width: ${percent}%"></div></div>
      </div>
    `;
  }).join("");
}

function renderDailyReport(dailyTotals) {
  const rows = Object.entries(dailyTotals).sort((a, b) => b[0].localeCompare(a[0]));

  if (!rows.length) {
    elements.dailyReport.innerHTML = `<div class="empty-state">ما كايناش مجاميع يومية</div>`;
    return;
  }

  elements.dailyReport.innerHTML = rows.map(([date, total]) => `
    <div class="daily-row">
      <span>${formatDate(date)}</span>
      <strong>${formatMoney(total)}</strong>
    </div>
  `).join("");
}

function renderTransactions() {
  const query = normalizeForMatch(elements.searchInput.value);
  const filterDate = elements.filterDate.value;
  const filterCategory = elements.filterCategory.value;

  const filtered = getSortedTransactions().filter((item) => {
    const haystack = normalizeForMatch(`${item.category} ${item.note || ""} ${item.raw || ""}`);
    const matchesQuery = !query || haystack.includes(query);
    const matchesDate = !filterDate || item.date === filterDate;
    const matchesCategory = !filterCategory || item.category === filterCategory;
    return matchesQuery && matchesDate && matchesCategory;
  });

  setText(elements.transactionCount, String(filtered.length));

  if (!filtered.length) {
    elements.transactionsList.innerHTML = `<div class="empty-state">ما كايناش عمليات بهاد الفلتر</div>`;
    return;
  }

  let lastDate = "";
  elements.transactionsList.innerHTML = filtered.map((item) => {
    const dateHeader = item.date !== lastDate
      ? `<div class="date-divider"><span>${formatDate(item.date)}</span><strong>${formatMoney(dayExpenseTotal(item.date))}</strong></div>`
      : "";
    lastDate = item.date;

    return `
      ${dateHeader}
      <article class="transaction-card">
        <div class="transaction-main">
          <div>
            <div class="transaction-title">${escapeHtml(item.category)} · ${item.type === "income" ? "مدخول" : "مصروف"}</div>
            <div class="transaction-note">${escapeHtml(item.note || item.raw || "")}</div>
          </div>
          <strong class="amount ${item.type}">${item.type === "income" ? "+" : "-"}${formatMoney(item.amount)}</strong>
        </div>
        <div class="transaction-actions">
          <button class="icon-button" type="button" data-action="edit" data-id="${escapeHtml(item.id)}" aria-label="تعديل">✎</button>
          <button class="icon-button delete" type="button" data-action="delete" data-id="${escapeHtml(item.id)}" aria-label="حذف">×</button>
        </div>
      </article>
    `;
  }).join("");
}

function handleTransactionAction(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const id = button.dataset.id;
  if (button.dataset.action === "edit") editTransaction(id);
  if (button.dataset.action === "delete") deleteTransaction(id);
}

function editTransaction(id) {
  const transaction = state.transactions.find((item) => item.id === id);
  if (!transaction) return;

  editingId = id;
  elements.editId.value = id;
  elements.quickDate.value = transaction.date;
  elements.quickInput.value = `${transaction.category} ${transaction.amount}${transaction.note ? ` ${transaction.note}` : ""}`;
  renderQuickPreview();
  showView("add-view", "Add");
}

function deleteTransaction(id) {
  if (!confirm("تحيد هاد العملية؟")) return;
  state.transactions = state.transactions.filter((item) => item.id !== id);
  persist();
  render();
  showToast("تحيدات العملية");
}

function renderSettings() {
  renderCustomCategories();
  renderKeywordList();
}

function saveBudget() {
  const budget = Number(elements.budgetInput.value);
  if (!Number.isFinite(budget) || budget < 0) {
    showToast("دخل ميزانية صحيحة");
    return;
  }

  state.settings.monthlyBudget = roundMoney(budget);
  persist();
  render();
  showToast("تحفظات الميزانية");
}

function addCustomCategory() {
  const category = elements.customCategoryInput.value.trim();
  if (!category) {
    showToast("كتب اسم الفئة");
    return;
  }

  if (getAllCategories().includes(category)) {
    showToast("الفئة موجودة");
    return;
  }

  state.settings.customCategories.push(category);
  elements.customCategoryInput.value = "";
  persist();
  render();
}

function handleCustomCategoryDelete(event) {
  const button = event.target.closest("[data-delete-category]");
  if (!button) return;

  const category = button.dataset.deleteCategory;
  state.settings.customCategories = state.settings.customCategories.filter((item) => item !== category);
  delete state.settings.keywords[category];
  persist();
  render();
}

function addKeyword() {
  const category = elements.keywordCategory.value;
  const keyword = elements.keywordInput.value.trim();
  if (!category || !keyword) {
    showToast("اختار الفئة وكتب الكلمة");
    return;
  }

  state.settings.keywords[category] = unique([...(state.settings.keywords[category] || []), keyword]);
  elements.keywordInput.value = "";
  persist();
  render();
}

function handleKeywordDelete(event) {
  const button = event.target.closest("[data-delete-keyword]");
  if (!button) return;

  const category = button.dataset.category;
  const keyword = button.dataset.deleteKeyword;
  state.settings.keywords[category] = (state.settings.keywords[category] || []).filter((item) => item !== keyword);
  persist();
  render();
}

function renderCustomCategories() {
  if (!state.settings.customCategories.length) {
    elements.customCategoryList.innerHTML = `<div class="empty-state">ما زدتاش فئات خاصة</div>`;
    return;
  }

  elements.customCategoryList.innerHTML = state.settings.customCategories.map((category) => `
    <div class="chip">
      <span>${escapeHtml(category)}</span>
      <button type="button" data-delete-category="${escapeHtml(category)}" aria-label="حذف">×</button>
    </div>
  `).join("");
}

function renderKeywordList() {
  const category = elements.keywordCategory.value || getAllCategories()[0];
  const keywords = state.settings.keywords[category] || [];

  if (!keywords.length) {
    elements.keywordList.innerHTML = `<div class="empty-state">ما كايناش كلمات خاصة لهاد الفئة</div>`;
    return;
  }

  elements.keywordList.innerHTML = keywords.map((keyword) => `
    <div class="chip">
      <span>${escapeHtml(keyword)}</span>
      <button type="button" data-category="${escapeHtml(category)}" data-delete-keyword="${escapeHtml(keyword)}" aria-label="حذف">×</button>
    </div>
  `).join("");
}

function refreshCategoryControls() {
  const categories = getAllCategories();
  const optionHtml = [
    `<option value="">كل الفئات</option>`,
    ...categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
  ].join("");

  const currentFilter = elements.filterCategory.value;
  elements.filterCategory.innerHTML = optionHtml;
  elements.filterCategory.value = categories.includes(currentFilter) ? currentFilter : "";

  const currentKeywordCategory = elements.keywordCategory.value;
  elements.keywordCategory.innerHTML = categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("");
  elements.keywordCategory.value = categories.includes(currentKeywordCategory) ? currentKeywordCategory : categories[0];
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
      state.transactions = imported.transactions.map(normalizeTransaction);
      state.settings = normalizeSettings(imported.settings || {});
      elements.budgetInput.value = state.settings.monthlyBudget || "";
      persist();
      render();
      showToast("تستوردات النسخة");
    } catch (error) {
      showToast(error.message || "ملف غير صالح");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

function exportCsv() {
  const header = ["id", "date", "type", "category", "amount", "note", "raw"];
  const rows = state.transactions.map((item) => [
    item.id,
    item.date,
    item.type,
    item.category,
    item.amount,
    item.note || "",
    item.raw || ""
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  downloadFile(`masarif-transactions-${todayISO()}.csv`, csv, "text/csv;charset=utf-8");
}

function resetAllData() {
  if (!confirm("غادي يتحيدو جميع العمليات والإعدادات. متأكد؟")) return;
  if (!confirm("تأكيد أخير: نمسحو كلشي؟")) return;

  state.transactions = [];
  state.settings = normalizeSettings({});
  elements.budgetInput.value = "";
  clearQuickInput();
  persist();
  render();
  showToast("تم مسح البيانات");
}

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored && Array.isArray(stored.transactions)) {
      return {
        transactions: stored.transactions.map(normalizeTransaction),
        settings: normalizeSettings(stored.settings || {})
      };
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }

  return {
    transactions: [],
    settings: normalizeSettings({})
  };
}

function normalizeSettings(settings) {
  return {
    monthlyBudget: Number(settings.monthlyBudget) || 0,
    customCategories: unique((settings.customCategories || []).map(String).filter(Boolean)),
    keywords: normalizeKeywordSettings(settings.keywords || {})
  };
}

function normalizeKeywordSettings(keywords) {
  return Object.keys(keywords).reduce((result, category) => {
    result[category] = unique((keywords[category] || []).map(String).filter(Boolean));
    return result;
  }, {});
}

function normalizeTransaction(item) {
  const category = String(item.category || "أخرى");
  const type = item.type === "income" ? "income" : "expense";
  const amount = roundMoney(Number(item.amount) || 0);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(item.date || "") ? item.date : todayISO();

  return {
    id: String(item.id || generateId()),
    date,
    type,
    category,
    amount,
    note: String(item.note || ""),
    raw: String(item.raw || item.note || ""),
    importKey: item.importKey || stableKey(`${date}|${type}|${category}|${amount}|${normalizeForMatch(item.raw || item.note || "")}`),
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString()
  };
}

function validateImport(data) {
  if (!data || !Array.isArray(data.transactions)) {
    throw new Error("ملف النسخة غير صالح");
  }

  data.transactions.forEach((item) => {
    const amount = Number(item.amount);
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(item.date || "");
    if (!Number.isFinite(amount) || amount < 0 || !validDate) {
      throw new Error("كاينة عملية غير صالحة فالنسخة");
    }
  });
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    showToast("تعذر حفظ البيانات فهاد المتصفح");
  }
}

function getAllCategories() {
  return unique([...DEFAULT_CATEGORIES, ...state.settings.customCategories]);
}

function getKeywordMap() {
  const map = {};
  getAllCategories().forEach((category) => {
    map[category] = unique([...(BASE_KEYWORDS[category] || []), ...(state.settings.keywords[category] || [])]);
  });
  return map;
}

function getSortedTransactions() {
  return [...state.transactions].sort((a, b) => {
    const byDate = b.date.localeCompare(a.date);
    if (byDate) return byDate;
    return (b.updatedAt || "").localeCompare(a.updatedAt || "");
  });
}

function buildDuplicateKey(item) {
  if (item.importKey) return item.importKey;
  return stableKey(`${item.date}|${item.type}|${item.category}|${roundMoney(item.amount)}|${normalizeForMatch(item.raw || item.note || "")}`);
}

function stableKey(value) {
  let hash = 0;
  const text = String(value);
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
  }
  return `k${Math.abs(hash)}`;
}

function dayExpenseTotal(date) {
  return sumBy(state.transactions, (item) => item.type === "expense" && item.date === date);
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

function formatShortDate(date) {
  return new Intl.DateTimeFormat("ar-MA", {
    day: "2-digit",
    month: "short"
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

function normalizeForMatch(value) {
  return normalizeInput(value)
    .toLowerCase()
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[^0-9a-z\u0600-\u06ff]+/g, "");
}

function generateId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `tx-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function setText(element, value) {
  element.textContent = value;
}

function toCamel(id) {
  return id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function csvCell(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
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
  showToast.timer = setTimeout(() => elements.toast.classList.remove("show"), 2400);
}
