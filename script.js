/* Masarif Pro Mobile V2
   Local-first expense tracker. Existing archive stays in localStorage. */

const STORAGE_KEY = "masarifProMobile.v1";
const CURRENCY = "MAD";
const CATEGORY_MIGRATION_VERSION = 2;

const CATEGORY_DEFINITIONS = [
  {
    name: "الأكل", emoji: "🍽️",
    legacy: ["قهوة", "فطور", "غداء", "عشاء", "أكل", "اكل"],
    keywords: ["قهوة", "قهوي", "cafe", "café", "coffee", "nespresso", "فطور", "فطر", "breakfast", "petit dej", "petit déjeuner", "غداء", "غدا", "lunch", "dejeuner", "déjeuner", "عشاء", "dinner", "مطعم", "restaurant", "food", "ماكلة", "وجبة", "pizza", "tacos", "sandwich", "خبز", "حريرة", "كسكس", "طاجين", "سمك", "دجاج", "لحم", "شاورما"]
  },
  {
    name: "النقل", emoji: "🚕",
    legacy: ["طاكسي", "تاكسي", "بنزين"],
    keywords: ["طاكسي", "تاكسي", "taxi", "ترام", "tram", "train", "تران", "قطار", "bus", "حافلة", "autocar", "سيارة", "car", "parking", "باركينغ", "autoroute", "طريق سيار", "essence", "diesel", "gasoil", "بنزين", "مازوط", "carburant", "uber", "indrive", "in drive", "careem", "تذكرة سفر", "تذكرة القطار"]
  },
  {
    name: "الكراء", emoji: "🏠",
    legacy: ["كراء"],
    keywords: ["كراء", "loyer", "rent", "سومة الكراء"]
  },
  {
    name: "الهدايا", emoji: "🎁",
    legacy: ["هدية"],
    keywords: ["هدية", "هدايا", "cadeau", "gift"]
  },
  {
    name: "العائلة", emoji: "👨‍👩‍👧",
    legacy: [],
    keywords: ["عائلة", "العائلة", "الوالدة", "الوالد", "امي", "أمي", "ابي", "أبي", "الأم", "الاب", "الأب", "اخي", "أخي", "اختي", "أختي", "خوت", "family", "famille"]
  },
  {
    name: "الملابس", emoji: "👕",
    legacy: [],
    keywords: ["ملابس", "حوايج", "لباس", "قميص", "سروال", "pantalon", "chemise", "chaussures", "حذاء", "صبابط", "vetement", "vêtement"]
  },
  {
    name: "المشروبات", emoji: "🥤",
    legacy: ["عصير"],
    keywords: ["عصير", "jus", "juice", "ماء", "water", "coca", "pepsi", "red bull", "مشروب", "boisson", "شاي", "اتاي", "أتاي"]
  },
  {
    name: "الفندق", emoji: "🏨",
    legacy: [],
    keywords: ["فندق", "hotel", "hôtel", "auberge", "نزل"]
  },
  {
    name: "الشات", emoji: "💬",
    legacy: [],
    keywords: ["chatgpt", "chat gpt", "openai", "claude", "gemini", "perplexity", "شات", "chat"]
  },
  {
    name: "البيرمي", emoji: "📄",
    legacy: ["بيرمي"],
    keywords: ["بيرمي", "permis", "رخصة السياقة", "رخصة السواقة", "auto ecole", "auto-école", "امتحان السياقة"]
  },
  {
    name: "التعبئة", emoji: "📱",
    legacy: [],
    keywords: ["تعبئة", "recharge", "orange", "inwi", "iam", "maroc telecom", "اتصالات المغرب", "رصيد الهاتف"]
  },
  {
    name: "النظافة (مع الحلاقة)", emoji: "🧹",
    legacy: ["نظافة"],
    keywords: ["نظافة", "حلاقة", "barbier", "barber", "coiffeur", "coiffure", "savon", "صابون", "shampoo", "shampoing", "dentifrice", "معجون الاسنان", "مناديل", "clean", "menage", "ménage"]
  },
  {
    name: "مصاريف البنك", emoji: "🏦",
    legacy: [],
    keywords: ["مصاريف البنك", "frais bancaire", "frais bancaires", "commission bancaire", "commission bank", "agios", "عمولة البنك", "بنك"]
  },
  {
    name: "الوجبات الخفيفة", emoji: "🍬",
    legacy: ["حلوى", "دانون", "علكة", "بيمو"],
    keywords: ["حلوى", "حلويات", "حلاوة", "gateau", "gâteau", "sweet", "sweets", "biscuit", "بسكويت", "بيمو", "bimo", "علكة", "علك", "gum", "دانون", "danone", "ياغورت", "yogurt", "مكسرات", "noix", "snack", "شيبس", "chips"]
  },
  {
    name: "سلفيات (محمد)", emoji: "💸",
    legacy: [],
    keywords: ["سلف محمد", "محمد سلف", "سلفيات محمد", "سلفية محمد", "سلف", "سلفية", "سلفيات", "avance", "pret", "prêt", "loan", "محمد"]
  },
  {
    name: "الخدمة", emoji: "🛠️",
    legacy: [],
    keywords: ["الخدمة", "خدمة", "travail", "work", "service", "مصاريف العمل", "مصاريف الخدمة"]
  },
  {
    name: "الصدقة", emoji: "🤲",
    legacy: ["صدقة"],
    keywords: ["صدقة", "الصدق", "sadaka", "charity", "تبرع", "إحسان", "احسان"]
  },
  {
    name: "الصحة", emoji: "🏥",
    legacy: ["صحة", "طبيب", "تحاليل", "أدوية", "ادوية", "سكانير"],
    keywords: ["صحة", "طبيب", "دكتور", "doctor", "medecin", "médecin", "دواء", "دوا", "أدوية", "ادوية", "pharma", "pharmacie", "صيدلية", "تحاليل", "تحليل", "analyse", "analyses", "scanner", "سكانير", "scan", "irm", "radio", "radiologie", "مستشفى", "مصحة", "clinic", "clinique", "تمريض"]
  },
  {
    name: "المدخول", emoji: "💼",
    legacy: ["مدخول"],
    keywords: ["مدخول", "دخل", "دخول", "income", "revenu", "salaire", "pay", "أجرة", "اجرة", "راتب", "استرجاع سلف", "استرجاع سلفيات", "رجع ليا"]
  },
  {
    name: "أخرى", emoji: "📦",
    legacy: ["أخرى", "اخرى"],
    keywords: []
  }
];

const CATEGORY_NAMES = CATEGORY_DEFINITIONS.map((item) => item.name);
const CATEGORY_BY_NAME = Object.fromEntries(CATEGORY_DEFINITIONS.map((item) => [item.name, item]));
const LEGACY_CATEGORY_MAP = buildLegacyCategoryMap();

let runtimeState = null;
const state = loadState();
runtimeState = state;
const elements = {};
let activeMonth = todayISO().slice(0, 7);
let selectedDay = todayISO();
let previousView = "reports-view";
let toastTimer = 0;

window.addEventListener("DOMContentLoaded", init);

function init() {
  cacheElements();
  const migrated = migrateStateWithoutDeletingArchive();
  elements.activeMonth.value = activeMonth;
  elements.quickDate.value = todayISO();
  elements.budgetInput.value = state.settings.monthlyBudget || "";
  bindEvents();
  refreshCategoryControls();
  renderFixedCategories();
  render();
  if (migrated) persist();
  unregisterOldServiceWorkers();
}

function cacheElements() {
  [
    "screen-title", "active-month", "net-balance", "month-income-total", "month-expense-total",
    "today-total", "budget-remaining", "budget-total", "dashboard-count", "budget-warning",
    "recent-transactions", "quick-date", "quick-input", "quick-preview", "save-quick-btn",
    "clear-quick-btn", "month-import-input", "import-preview", "import-month-btn", "clear-import-btn",
    "report-expenses", "report-income", "report-net", "biggest-category", "category-report",
    "daily-report", "transaction-count", "search-input", "filter-date", "filter-category",
    "transactions-list", "back-from-day-btn", "day-view-title", "day-expense-total",
    "day-income-total", "day-net-total", "add-day-transaction-btn", "day-transactions-list",
    "budget-input", "save-budget-btn", "fixed-category-list", "keyword-category", "keyword-input",
    "add-keyword-btn", "keyword-list", "export-json-btn", "import-json-input", "export-csv-btn",
    "reset-data-btn", "transaction-modal", "transaction-form", "transaction-modal-title",
    "close-transaction-modal", "cancel-transaction-modal", "modal-transaction-id", "modal-date",
    "modal-type", "modal-category", "modal-description", "modal-amount", "modal-note", "toast"
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
    button.addEventListener("click", () => showView(button.dataset.viewJump, "التقارير"));
  });

  elements.activeMonth.addEventListener("change", () => {
    activeMonth = elements.activeMonth.value || todayISO().slice(0, 7);
    elements.filterDate.value = "";
    render();
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
  elements.recentTransactions.addEventListener("click", handleTransactionAction);
  elements.dailyReport.addEventListener("click", handleOpenDayClick);

  elements.backFromDayBtn.addEventListener("click", () => showView(previousView, previousView === "dashboard-view" ? "الرئيسية" : "التقارير"));
  elements.addDayTransactionBtn.addEventListener("click", () => openTransactionModal("", selectedDay));
  elements.dayTransactionsList.addEventListener("click", handleDayTransactionAction);

  elements.saveBudgetBtn.addEventListener("click", saveBudget);
  elements.keywordCategory.addEventListener("change", renderKeywordList);
  elements.addKeywordBtn.addEventListener("click", addKeyword);
  elements.keywordList.addEventListener("click", handleKeywordDelete);

  elements.exportJsonBtn.addEventListener("click", exportJson);
  elements.importJsonInput.addEventListener("change", importJson);
  elements.exportCsvBtn.addEventListener("click", exportCsv);
  elements.resetDataBtn.addEventListener("click", resetAllData);

  elements.transactionForm.addEventListener("submit", saveTransactionFromModal);
  elements.closeTransactionModal.addEventListener("click", closeTransactionModal);
  elements.cancelTransactionModal.addEventListener("click", closeTransactionModal);
  elements.transactionModal.addEventListener("click", (event) => {
    if (event.target.dataset.closeModal === "true") closeTransactionModal();
  });
  elements.modalType.addEventListener("change", syncModalType);
}

function showView(viewId, title) {
  elements.views.forEach((view) => view.classList.toggle("active", view.id === viewId));
  elements.navButtons.forEach((button) => button.classList.toggle("active", button.dataset.view === viewId));
  elements.screenTitle.textContent = title || "Masarif";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function saveQuickEntries() {
  const date = elements.quickDate.value || todayISO();
  const parsed = parseLines(elements.quickInput.value, date);
  if (parsed.errors.length) {
    showToast(parsed.errors[0]);
    return;
  }
  if (!parsed.transactions.length) {
    showToast("كتب شي عملية عاد حفظ");
    return;
  }

  addTransactions(parsed.transactions, { dedupe: false });
  persist();
  activeMonth = date.slice(0, 7);
  elements.activeMonth.value = activeMonth;
  clearQuickInput();
  render();
  showToast(`تزادو ${parsed.transactions.length} عمليات`);
  openDayView(date, "", "add-view");
}

function clearQuickInput() {
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
  if (parsed.transactions[0]) {
    activeMonth = parsed.transactions[0].date.slice(0, 7);
    elements.activeMonth.value = activeMonth;
  }
  persist();
  render();
  renderImportPreview();
  showToast(`تسجلو ${result.added} وتفادينا ${result.skipped} مكرر`);
}

function addTransactions(transactions, options = {}) {
  const existingKeys = new Set(state.transactions.map(buildDuplicateKey));
  let added = 0;
  let skipped = 0;

  transactions.forEach((transaction) => {
    const prepared = normalizeTransaction({
      ...transaction,
      id: transaction.id || generateId(),
      createdAt: transaction.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    const key = buildDuplicateKey(prepared);
    if (options.dedupe && existingKeys.has(key)) {
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
  String(text || "").split(/\r?\n/).forEach((rawLine, index) => {
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
  const category = detectCategory(`${label} ${note}`);
  const type = category === "المدخول" || isIncomeLabel(label) ? "income" : "expense";
  const finalCategory = type === "income" ? "المدخول" : category;

  return {
    id: generateId(),
    date,
    type,
    category: finalCategory,
    description: label || finalCategory,
    amount,
    note,
    raw: normalizedLine,
    importKey: stableKey(`${date}|${type}|${finalCategory}|${amount}|${normalizeForMatch(normalizedLine)}`),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function detectCategory(text) {
  const normalized = normalizeForMatch(text);
  if (!normalized) return "أخرى";
  if (isIncomeLabel(text)) return "المدخول";

  const exact = CATEGORY_NAMES.find((name) => normalizeForMatch(name) === normalized || normalizeForMatch(`${getCategoryEmoji(name)} ${name}`) === normalized);
  if (exact) return exact;

  const candidates = [];
  CATEGORY_DEFINITIONS.forEach((category, categoryIndex) => {
    const customKeywords = runtimeState && runtimeState.settings && runtimeState.settings.keywords ? (runtimeState.settings.keywords[category.name] || []) : [];
    [...customKeywords, ...category.keywords].forEach((keyword) => {
      const key = normalizeForMatch(keyword);
      if (key && normalized.includes(key)) {
        candidates.push({ name: category.name, score: key.length + 20, categoryIndex });
      }
    });
  });

  candidates.sort((a, b) => b.score - a.score || a.categoryIndex - b.categoryIndex);
  return candidates[0] ? candidates[0].name : "أخرى";
}

function isIncomeLabel(label) {
  const normalized = normalizeForMatch(label);
  const incomeCategory = CATEGORY_BY_NAME["المدخول"];
  const customIncomeKeywords = runtimeState && runtimeState.settings && runtimeState.settings.keywords ? (runtimeState.settings.keywords["المدخول"] || []) : [];
  const keywords = [...incomeCategory.keywords, ...customIncomeKeywords];
  return keywords.some((keyword) => normalized.includes(normalizeForMatch(keyword)));
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
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function parseAmountExpression(expression) {
  const input = normalizeInput(expression).replace(/\s+/g, "").replace(/,/g, ".");
  if (!input) throw new Error("دخل المبلغ");
  if (!/^[\d+\-*/().]+$/.test(input)) throw new Error("استعمل غير + - * /");

  let index = 0;
  function peek() { return input[index]; }
  function consume() { return input[index++]; }
  function parseNumber() {
    let value = "";
    while (/[\d.]/.test(peek() || "")) value += consume();
    if (!value || (value.match(/\./g) || []).length > 1) throw new Error("رقم غير صالح");
    const number = Number(value);
    if (!Number.isFinite(number)) throw new Error("رقم غير صالح");
    return number;
  }
  function parseFactor() {
    if (peek() === "+") { consume(); return parseFactor(); }
    if (peek() === "-") { consume(); return -parseFactor(); }
    if (peek() === "(") {
      consume();
      const value = parseExpression();
      if (consume() !== ")") throw new Error("القوس ناقص");
      return value;
    }
    return parseNumber();
  }
  function parseTerm() {
    let value = parseFactor();
    while (peek() === "*" || peek() === "/") {
      const operator = consume();
      const right = parseFactor();
      if (operator === "/" && right === 0) throw new Error("القسمة على صفر ممنوعة");
      value = operator === "*" ? value * right : value / right;
    }
    return value;
  }
  function parseExpression() {
    let value = parseTerm();
    while (peek() === "+" || peek() === "-") {
      const operator = consume();
      const right = parseTerm();
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  }

  const result = parseExpression();
  if (index !== input.length || !Number.isFinite(result) || result < 0) throw new Error("الحساب غير صالح");
  return roundMoney(result);
}

function render() {
  renderDashboard();
  renderReports();
  renderTransactions();
  renderSettings();
  renderQuickPreview();
  renderImportPreview();
  if (document.getElementById("day-view").classList.contains("active")) renderDayView();
}

function renderDashboard() {
  const monthItems = getTransactionsForMonth(activeMonth);
  const expenses = sumBy(monthItems, (item) => item.type === "expense");
  const income = sumBy(monthItems, (item) => item.type === "income");
  const budget = roundMoney(state.settings.monthlyBudget || 0);
  const remaining = roundMoney(budget - expenses);
  const todayExpense = activeMonth === todayISO().slice(0, 7) ? dayExpenseTotal(todayISO()) : 0;

  elements.netBalance.textContent = formatMoney(income - expenses);
  elements.monthIncomeTotal.textContent = formatMoney(income);
  elements.monthExpenseTotal.textContent = formatMoney(expenses);
  elements.todayTotal.textContent = formatMoney(todayExpense);
  elements.budgetRemaining.textContent = formatMoney(remaining);
  elements.budgetTotal.textContent = formatMoney(budget);
  elements.dashboardCount.textContent = monthItems.length;
  elements.budgetWarning.classList.toggle("hidden", !(budget > 0 && expenses > budget));

  const recent = getSortedTransactions(monthItems).slice(0, 6);
  elements.recentTransactions.innerHTML = recent.length ? recent.map((item) => compactTransactionHtml(item)).join("") : emptyState("ما كايناش عمليات فهاد الشهر");
}

function renderReports() {
  const monthItems = getTransactionsForMonth(activeMonth);
  const expenses = monthItems.filter((item) => item.type === "expense");
  const incomeItems = monthItems.filter((item) => item.type === "income");
  const expenseTotal = sumBy(expenses, () => true);
  const incomeTotal = sumBy(incomeItems, () => true);
  const byCategory = totalsBy(expenses, (item) => item.category);
  const sortedCategories = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);

  elements.reportExpenses.textContent = formatMoney(expenseTotal);
  elements.reportIncome.textContent = formatMoney(incomeTotal);
  elements.reportNet.textContent = formatMoney(incomeTotal - expenseTotal);
  elements.biggestCategory.textContent = sortedCategories[0] ? `${getCategoryEmoji(sortedCategories[0][0])} ${sortedCategories[0][0]}` : "-";

  if (!sortedCategories.length) {
    elements.categoryReport.innerHTML = emptyState("ما كايناش مصاريف فهاد الشهر");
  } else {
    const max = sortedCategories[0][1] || 1;
    elements.categoryReport.innerHTML = sortedCategories.map(([category, total]) => `
      <div class="bar-item">
        <div class="bar-head"><strong>${getCategoryEmoji(category)} ${escapeHtml(category)}</strong><b>${formatMoney(total)}</b></div>
        <div class="bar-track"><div class="bar-fill" style="width:${Math.max(4, (total / max) * 100)}%"></div></div>
      </div>
    `).join("");
  }

  const days = groupDays(monthItems);
  elements.dailyReport.innerHTML = days.length ? days.map((day) => `
    <button class="daily-row" type="button" data-open-day="${escapeHtml(day.date)}">
      <div><strong>📅 ${formatDate(day.date)}</strong><span>${day.count} عمليات</span></div>
      <b class="amount expense">-${formatMoney(day.expense)}</b>
      <span>فتح ←</span>
    </button>
  `).join("") : emptyState("ما كايناش أيام مسجلة");
}

function renderTransactions() {
  let items = getSortedTransactions(getTransactionsForMonth(activeMonth));
  const query = normalizeForMatch(elements.searchInput.value || "");
  const filterDate = elements.filterDate.value;
  const filterCategory = elements.filterCategory.value;

  if (query) {
    items = items.filter((item) => normalizeForMatch(`${item.description} ${item.note} ${item.raw} ${item.category}`).includes(query));
  }
  if (filterDate) items = items.filter((item) => item.date === filterDate);
  if (filterCategory) items = items.filter((item) => item.category === filterCategory);

  elements.transactionCount.textContent = items.length;
  elements.transactionsList.innerHTML = items.length ? items.map((item) => transactionHtml(item, false)).join("") : emptyState("ما لقيت حتى عملية");
}

function renderDayView() {
  const items = getSortedTransactions(state.transactions.filter((item) => item.date === selectedDay));
  const expense = sumBy(items, (item) => item.type === "expense");
  const income = sumBy(items, (item) => item.type === "income");
  elements.dayViewTitle.textContent = `📅 ${formatDate(selectedDay)}`;
  elements.dayExpenseTotal.textContent = formatMoney(expense);
  elements.dayIncomeTotal.textContent = formatMoney(income);
  elements.dayNetTotal.textContent = formatMoney(income - expense);
  elements.dayTransactionsList.innerHTML = items.length ? items.map((item) => transactionHtml(item, true)).join("") : emptyState("ما كاين حتى مصروف فهاد النهار");
}

function openDayView(date, editId = "", fromView = "reports-view") {
  selectedDay = date || todayISO();
  previousView = fromView === "day-view" ? "reports-view" : fromView;
  activeMonth = selectedDay.slice(0, 7);
  elements.activeMonth.value = activeMonth;
  renderDayView();
  showView("day-view", "مصاريف اليوم");
  if (editId) setTimeout(() => openTransactionModal(editId, selectedDay), 80);
}

function handleOpenDayClick(event) {
  const button = event.target.closest("[data-open-day]");
  if (!button) return;
  openDayView(button.dataset.openDay, "", "reports-view");
}

function handleTransactionAction(event) {
  const openDayButton = event.target.closest("[data-open-day]");
  if (openDayButton && !event.target.closest("[data-action]")) {
    openDayView(openDayButton.dataset.openDay, "", event.currentTarget === elements.recentTransactions ? "dashboard-view" : "reports-view");
    return;
  }
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const item = state.transactions.find((transaction) => transaction.id === button.dataset.id);
  if (!item) return;
  if (button.dataset.action === "edit") {
    openDayView(item.date, item.id, event.currentTarget === elements.recentTransactions ? "dashboard-view" : "reports-view");
  }
  if (button.dataset.action === "delete") deleteTransaction(item.id);
}

function handleDayTransactionAction(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  if (button.dataset.action === "edit") openTransactionModal(button.dataset.id, selectedDay);
  if (button.dataset.action === "delete") deleteTransaction(button.dataset.id);
}

function openTransactionModal(id, date) {
  const item = id ? state.transactions.find((transaction) => transaction.id === id) : null;
  elements.modalTransactionId.value = item ? item.id : "";
  elements.transactionModalTitle.textContent = item ? "✏️ تعديل المصروف" : "➕ إضافة مصروف";
  elements.modalDate.value = item ? item.date : (date || selectedDay || todayISO());
  elements.modalType.value = item ? item.type : "expense";
  elements.modalCategory.value = item ? normalizeCategoryName(item.category, item.raw || item.description) : "أخرى";
  elements.modalDescription.value = item ? (item.description || deriveDescription(item)) : "";
  elements.modalAmount.value = item ? item.amount : "";
  elements.modalNote.value = item ? (item.note || "") : "";
  syncModalType();
  elements.transactionModal.classList.remove("hidden");
  document.body.classList.add("modal-open");
  setTimeout(() => elements.modalDescription.focus(), 100);
}

function closeTransactionModal() {
  elements.transactionModal.classList.add("hidden");
  document.body.classList.remove("modal-open");
  elements.transactionForm.reset();
  elements.modalTransactionId.value = "";
}

function syncModalType() {
  const income = elements.modalType.value === "income";
  elements.modalCategory.disabled = income;
  if (income) elements.modalCategory.value = "المدخول";
  if (!income && elements.modalCategory.value === "المدخول") elements.modalCategory.value = "أخرى";
}

function saveTransactionFromModal(event) {
  event.preventDefault();
  const id = elements.modalTransactionId.value;
  const date = elements.modalDate.value || selectedDay || todayISO();
  const type = elements.modalType.value === "income" ? "income" : "expense";
  const description = elements.modalDescription.value.trim();
  const amount = roundMoney(Number(elements.modalAmount.value));
  const note = elements.modalNote.value.trim();
  const category = type === "income" ? "المدخول" : elements.modalCategory.value;

  if (!description) {
    showToast("كتب الوصف");
    return;
  }
  if (!Number.isFinite(amount) || amount < 0) {
    showToast("دخل مبلغ صحيح");
    return;
  }

  const raw = `${description} ${amount}${note ? ` ${note}` : ""}`;
  if (id) {
    const index = state.transactions.findIndex((item) => item.id === id);
    if (index === -1) return;
    state.transactions[index] = normalizeTransaction({
      ...state.transactions[index],
      date,
      type,
      category,
      description,
      amount,
      note,
      raw,
      importKey: stableKey(`${date}|${type}|${category}|${amount}|${normalizeForMatch(raw)}`),
      updatedAt: new Date().toISOString()
    });
    showToast("تعدل المصروف بنجاح");
  } else {
    addTransactions([{
      id: generateId(), date, type, category, description, amount, note, raw,
      importKey: stableKey(`${date}|${type}|${category}|${amount}|${normalizeForMatch(raw)}`),
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    }], { dedupe: false });
    showToast("تزادت العملية");
  }

  selectedDay = date;
  activeMonth = date.slice(0, 7);
  elements.activeMonth.value = activeMonth;
  persist();
  closeTransactionModal();
  render();
  renderDayView();
  showView("day-view", "مصاريف اليوم");
}

function deleteTransaction(id) {
  const item = state.transactions.find((transaction) => transaction.id === id);
  if (!item || !confirm(`تحيد هاد العملية؟\n${item.description || item.raw} - ${formatMoney(item.amount)}`)) return;
  state.transactions = state.transactions.filter((transaction) => transaction.id !== id);
  persist();
  render();
  if (document.getElementById("day-view").classList.contains("active")) renderDayView();
  showToast("تحيدات العملية");
}

function transactionHtml(item, dayMode) {
  const emoji = getCategoryEmoji(item.category);
  const description = item.description || deriveDescription(item);
  return `
    <article class="transaction-card" data-open-day="${escapeHtml(item.date)}">
      <div class="transaction-main">
        <div class="category-icon">${emoji}</div>
        <div class="transaction-copy">
          <strong>${escapeHtml(description || item.category)}</strong>
          <span>${escapeHtml(item.category)} · ${formatDate(item.date)}${item.note ? ` · ${escapeHtml(item.note)}` : ""}</span>
        </div>
      </div>
      <div class="transaction-side">
        <strong class="amount ${item.type}">${item.type === "income" ? "+" : "-"}${formatMoney(item.amount)}</strong>
        <div class="transaction-actions">
          <button class="icon-button" type="button" data-action="edit" data-id="${escapeHtml(item.id)}" aria-label="تعديل">✏️</button>
          <button class="icon-button delete" type="button" data-action="delete" data-id="${escapeHtml(item.id)}" aria-label="حذف">🗑️</button>
        </div>
      </div>
    </article>
  `;
}

function compactTransactionHtml(item) {
  const emoji = getCategoryEmoji(item.category);
  return `
    <article class="compact-transaction" data-open-day="${escapeHtml(item.date)}">
      <div class="category-icon">${emoji}</div>
      <div class="transaction-copy"><strong>${escapeHtml(item.description || deriveDescription(item))}</strong><span>${formatDate(item.date)} · ${escapeHtml(item.category)}</span></div>
      <strong class="amount ${item.type}">${item.type === "income" ? "+" : "-"}${formatMoney(item.amount)}</strong>
    </article>
  `;
}

function renderQuickPreview() {
  const parsed = parseLines(elements.quickInput.value, elements.quickDate.value || todayISO());
  const expense = sumBy(parsed.transactions, (item) => item.type === "expense");
  const income = sumBy(parsed.transactions, (item) => item.type === "income");
  elements.quickPreview.textContent = parsed.errors.length
    ? parsed.errors[0]
    : `${parsed.transactions.length} عمليات · مصاريف ${formatMoney(expense)} · مداخيل ${formatMoney(income)}`;
}

function renderImportPreview() {
  const parsed = parseMonthImport(elements.monthImportInput.value);
  const expense = sumBy(parsed.transactions, (item) => item.type === "expense");
  const income = sumBy(parsed.transactions, (item) => item.type === "income");
  elements.importPreview.textContent = parsed.errors.length
    ? parsed.errors[0]
    : `${parsed.transactions.length} عمليات · مصاريف ${formatMoney(expense)} · مداخيل ${formatMoney(income)}`;
}

function renderSettings() {
  renderKeywordList();
}

function renderFixedCategories() {
  elements.fixedCategoryList.innerHTML = CATEGORY_DEFINITIONS.map((category) => `
    <div class="category-tile"><span>${category.emoji}</span><b>${escapeHtml(category.name)}</b></div>
  `).join("");
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
  renderKeywordList();
  showToast(`تزادت كلمة ${keyword}`);
}

function handleKeywordDelete(event) {
  const button = event.target.closest("[data-delete-keyword]");
  if (!button) return;
  const category = button.dataset.category;
  const keyword = button.dataset.deleteKeyword;
  state.settings.keywords[category] = (state.settings.keywords[category] || []).filter((item) => item !== keyword);
  persist();
  renderKeywordList();
}

function renderKeywordList() {
  const category = elements.keywordCategory.value || CATEGORY_NAMES[0];
  const customKeywords = state.settings.keywords[category] || [];
  const defaults = CATEGORY_BY_NAME[category] ? CATEGORY_BY_NAME[category].keywords.slice(0, 8) : [];
  const all = unique([...customKeywords, ...defaults]);
  elements.keywordList.innerHTML = all.length ? all.map((keyword) => {
    const removable = customKeywords.includes(keyword);
    return `<div class="chip"><span>${escapeHtml(keyword)}</span>${removable ? `<button type="button" data-category="${escapeHtml(category)}" data-delete-keyword="${escapeHtml(keyword)}">×</button>` : ""}</div>`;
  }).join("") : emptyState("ما كايناش كلمات لهاد الفئة");
}

function refreshCategoryControls() {
  const options = CATEGORY_DEFINITIONS.map((category) => `<option value="${escapeHtml(category.name)}">${category.emoji} ${escapeHtml(category.name)}</option>`).join("");
  elements.filterCategory.innerHTML = `<option value="">كل الفئات</option>${options}`;
  elements.keywordCategory.innerHTML = options;
  elements.modalCategory.innerHTML = options;
  elements.keywordCategory.value = CATEGORY_NAMES[0];
  elements.modalCategory.value = "أخرى";
}

function exportJson() {
  downloadFile(`masarif-backup-${todayISO()}.json`, JSON.stringify(state, null, 2), "application/json;charset=utf-8");
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
      migrateStateWithoutDeletingArchive(true);
      elements.budgetInput.value = state.settings.monthlyBudget || "";
      persist();
      render();
      showToast("ترجعات النسخة والأرشيف كامل");
    } catch (error) {
      showToast(error.message || "ملف غير صالح");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

function exportCsv() {
  const header = ["التاريخ", "النوع", "الفئة", "الوصف", "المبلغ", "الملاحظة"];
  const rows = getSortedTransactions(state.transactions).map((item) => [
    item.date,
    item.type === "income" ? "مدخول" : "مصروف",
    `${getCategoryEmoji(item.category)} ${item.category}`,
    item.description || deriveDescription(item),
    item.amount,
    item.note || ""
  ]);
  const csv = "\uFEFF" + [header, ...rows].map((row) => row.map(csvCell).join(";")).join("\r\n");
  downloadFile(`masarif-transactions-${todayISO()}.csv`, csv, "text/csv;charset=utf-8");
}

function resetAllData() {
  if (!confirm("غادي يتحيد الأرشيف كامل. متأكد؟")) return;
  if (!confirm("تأكيد أخير: نمسحو جميع المصاريف والمداخيل؟")) return;
  state.transactions = [];
  state.settings = normalizeSettings({});
  elements.budgetInput.value = "";
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
  } catch (error) {
    console.warn("Could not read stored data", error);
  }
  return { transactions: [], settings: normalizeSettings({}) };
}

function normalizeSettings(settings) {
  return {
    ...settings,
    monthlyBudget: Number(settings.monthlyBudget) || 0,
    customCategories: Array.isArray(settings.customCategories) ? settings.customCategories.map(String).filter(Boolean) : [],
    keywords: normalizeKeywordSettings(settings.keywords || {}),
    categoryMigrationVersion: Number(settings.categoryMigrationVersion) || 0
  };
}

function normalizeKeywordSettings(keywords) {
  const result = {};
  Object.keys(keywords || {}).forEach((category) => {
    const mapped = CATEGORY_BY_NAME[category] ? category : (LEGACY_CATEGORY_MAP[normalizeForMatch(category)] || "أخرى");
    result[mapped] = unique([...(result[mapped] || []), ...((keywords[category] || []).map(String).filter(Boolean))]);
  });
  return result;
}

function normalizeTransaction(item) {
  const sourceCategory = String(item.category || "").trim();
  const normalizedSourceCategory = normalizeCategoryName(sourceCategory, item.raw);
  const type = item.type === "income" || normalizedSourceCategory === "المدخول" ? "income" : "expense";
  const category = type === "income" ? "المدخول" : normalizeCategoryName(sourceCategory, `${item.raw || ""} ${item.description || ""} ${item.note || ""}`);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(item.date || "") ? item.date : todayISO();
  const amount = roundMoney(Number(item.amount) || 0);
  const description = String(item.description || deriveDescription(item) || category);
  const raw = String(item.raw || `${description} ${amount}${item.note ? ` ${item.note}` : ""}`);
  return {
    ...item,
    id: String(item.id || generateId()),
    date,
    type,
    category,
    originalCategory: item.originalCategory || (sourceCategory && sourceCategory !== category ? sourceCategory : undefined),
    description,
    amount,
    note: String(item.note || ""),
    raw,
    importKey: item.importKey || stableKey(`${date}|${type}|${category}|${amount}|${normalizeForMatch(raw)}`),
    createdAt: item.createdAt || new Date().toISOString(),
    updatedAt: item.updatedAt || item.createdAt || new Date().toISOString()
  };
}

function migrateStateWithoutDeletingArchive(force = false) {
  if (!force && state.settings.categoryMigrationVersion >= CATEGORY_MIGRATION_VERSION) return false;
  let changed = false;
  state.transactions = state.transactions.map((item) => {
    const oldCategory = String(item.category || "أخرى");
    const normalized = normalizeTransaction(item);
    if (normalized.category !== oldCategory || !item.description) {
      changed = true;
      if (!normalized.originalCategory && oldCategory !== normalized.category) normalized.originalCategory = oldCategory;
    }
    return normalized;
  });
  state.settings.keywords = normalizeKeywordSettings(state.settings.keywords || {});
  state.settings.categoryMigrationVersion = CATEGORY_MIGRATION_VERSION;
  return changed || true;
}

function normalizeCategoryName(category, context = "") {
  const rawCategory = String(category || "").trim();
  if (CATEGORY_BY_NAME[rawCategory]) return rawCategory;
  const normalized = normalizeForMatch(rawCategory);
  if (LEGACY_CATEGORY_MAP[normalized]) return LEGACY_CATEGORY_MAP[normalized];
  const detected = detectCategory(`${rawCategory} ${context}`);
  return detected || "أخرى";
}

function buildLegacyCategoryMap() {
  const map = {};
  CATEGORY_DEFINITIONS.forEach((category) => {
    map[normalizeForMatch(category.name)] = category.name;
    category.legacy.forEach((legacy) => { map[normalizeForMatch(legacy)] = category.name; });
  });
  return map;
}

function validateImport(data) {
  if (!data || !Array.isArray(data.transactions)) throw new Error("ملف النسخة غير صالح");
  data.transactions.forEach((item) => {
    const amount = Number(item.amount);
    if (!Number.isFinite(amount) || amount < 0 || !/^\d{4}-\d{2}-\d{2}$/.test(item.date || "")) {
      throw new Error("كاينة عملية غير صالحة فالنسخة");
    }
  });
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error(error);
    showToast("تعذر حفظ البيانات فهاد المتصفح");
  }
}

function getTransactionsForMonth(month) {
  return state.transactions.filter((item) => item.date.slice(0, 7) === month);
}

function getSortedTransactions(items) {
  return [...items].sort((a, b) => {
    const byDate = b.date.localeCompare(a.date);
    if (byDate) return byDate;
    return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
  });
}

function groupDays(items) {
  const grouped = {};
  items.forEach((item) => {
    if (!grouped[item.date]) grouped[item.date] = { date: item.date, expense: 0, income: 0, count: 0 };
    grouped[item.date].count += 1;
    if (item.type === "income") grouped[item.date].income += Number(item.amount);
    else grouped[item.date].expense += Number(item.amount);
  });
  return Object.values(grouped).map((day) => ({ ...day, expense: roundMoney(day.expense), income: roundMoney(day.income) })).sort((a, b) => b.date.localeCompare(a.date));
}

function buildDuplicateKey(item) {
  return item.importKey || stableKey(`${item.date}|${item.type}|${item.category}|${roundMoney(item.amount)}|${normalizeForMatch(item.raw || item.description || item.note || "")}`);
}

function stableKey(value) {
  let hash = 0;
  const text = String(value);
  for (let index = 0; index < text.length; index += 1) hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
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

function getCategoryEmoji(category) {
  return CATEGORY_BY_NAME[category] ? CATEGORY_BY_NAME[category].emoji : "📦";
}

function deriveDescription(item) {
  if (item && item.description) return String(item.description);
  const raw = String((item && item.raw) || "").trim();
  if (!raw) return String((item && item.category) || "أخرى");
  const firstNumber = normalizeInput(raw).search(/\d/);
  return (firstNumber > 0 ? raw.slice(0, firstNumber) : raw).trim() || String((item && item.category) || "أخرى");
}

function todayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function formatDate(date) {
  try {
    return new Intl.DateTimeFormat("ar-MA", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${date}T12:00:00`));
  } catch {
    return date;
  }
}

function formatMoney(value) {
  return `${roundMoney(value).toLocaleString("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${CURRENCY}`;
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function normalizeInput(value) {
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
  return String(value || "")
    .replace(/[٠-٩]/g, (digit) => arabicDigits.indexOf(digit))
    .replace(/[۰-۹]/g, (digit) => persianDigits.indexOf(digit))
    .replace(/[×xX]/g, "*")
    .replace(/[÷]/g, "/")
    .replace(/[−–—]/g, "-");
}

function normalizeForMatch(value) {
  return normalizeInput(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function generateId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return `t-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function unique(items) {
  return [...new Set(items.map((item) => String(item).trim()).filter(Boolean))];
}

function csvCell(value) {
  const text = String(value == null ? "" : value).replace(/"/g, '""');
  return `"${text}"`;
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    link.remove();
  }, 1200);
}

function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  toastTimer = setTimeout(() => elements.toast.classList.remove("show"), 3200);
}

function emptyState(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function toCamel(id) {
  return id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function unregisterOldServiceWorkers() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  }).catch(() => {});
}
