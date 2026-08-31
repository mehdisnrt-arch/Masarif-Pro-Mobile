/* Masarif Pro Mobile - category manager
   Adds/renames/hides categories and lets the user add/delete categories from the app.
   Archive stays in localStorage; transactions are never deleted. */
(function () {
  "use strict";

  const USER_CATEGORY_KEY = "masarifProMobile.userCategories.v1";
  const HIDDEN_CATEGORY_KEY = "masarifProMobile.hiddenCategories.v1";

  const CATEGORY_RENAMES = {
    "سلفيات (محمد)": "سلفيات",
    "النظافة (مع الحلاقة)": "نظافة شخصية"
  };

  const SYSTEM_REMOVE = ["النظافة (مع الحلاقة)"];
  const PROTECTED_CATEGORIES = ["أخرى", "المدخول"];

  const BASE_EXTRA_DEFINITIONS = [
    {
      name: "نظافة شخصية",
      emoji: "🧴",
      legacy: ["نظافة شخصية", "النظافة (مع الحلاقة)", "نظافة", "حلاقة"],
      keywords: ["كينطة", "كِنطة", "قينطة", "kinta", "kineta", "quenta", "نظافة شخصية", "نظافة", "حلاقة", "حلاق", "barbier", "barber", "coiffeur", "coiffure", "عطر", "parfum", "deodorant", "gel douche", "savon", "صابون", "shampoing", "shampoo", "dentifrice", "معجون الاسنان", "مناديل", "clean", "menage", "ménage"]
    },
    {
      name: "التجول",
      emoji: "🚶",
      legacy: ["التجول", "تجول"],
      keywords: ["بحر", "البحر", "شاطئ", "كورنيش", "plage", "beach", "mer", "promenade", "balade", "tour", "sortie", "تجول", "التجول", "جولة", "خرجة", "خروج"]
    },
    {
      name: "أجهزة إلكترونية",
      emoji: "💻",
      legacy: ["اجهزة الكترونية", "أجهزة إلكترونية", "الكترونيك", "إلكترونيك"],
      keywords: ["الكترونيك", "إلكترونيك", "الكترونيات", "إلكترونيات", "اجهزة الكترونية", "أجهزة إلكترونية", "electronic", "electronics", "electronique", "électronique", "pc", "ordinateur", "laptop", "هاتف", "telephone", "téléphone", "chargeur", "شارجور", "cable", "كابل", "usb", "ssd", "ram"]
    },
    {
      name: "سلفيات",
      emoji: "💸",
      legacy: ["سلفيات", "سلفيات (محمد)", "سلفيات محمد", "سلف محمد", "محمد سلف", "سلفية محمد"],
      keywords: ["سلف", "سلفية", "سلفيات", "سلف محمد", "محمد سلف", "سلفيات محمد", "سلفية محمد", "avance", "pret", "prêt", "loan", "محمد"]
    }
  ];

  const EXTRA_KEYWORDS = {
    "الأكل": ["موندا", "موندَة", "monda", "munda", "مندا"],
    "نظافة شخصية": ["كينطة", "قينطة", "kinta", "kineta", "quenta", "نظافة", "حلاقة", "حلاق", "barbier", "coiffeur"],
    "التجول": ["بحر", "البحر", "شاطئ", "plage", "beach", "mer", "خرجة", "خروج"],
    "أجهزة إلكترونية": ["الكترونيك", "إلكترونيك", "electronique", "électronique", "electronic", "electronics"],
    "سلفيات": ["سلف", "سلفية", "سلفيات", "محمد", "avance", "pret", "prêt", "loan"]
  };

  function normalize(value) {
    if (typeof normalizeForMatch === "function") return normalizeForMatch(value);
    return String(value || "")
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

  function readJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return value == null ? fallback : value;
    } catch {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getUserCategories() {
    const fromKey = readJson(USER_CATEGORY_KEY, []);
    const fromSettings = (typeof state !== "undefined" && state.settings && Array.isArray(state.settings.userCategories)) ? state.settings.userCategories : [];
    return uniqueObjects([].concat(fromKey, fromSettings));
  }

  function saveUserCategories(categories) {
    const clean = uniqueObjects(categories).filter((cat) => cat.name && !PROTECTED_CATEGORIES.includes(cat.name));
    writeJson(USER_CATEGORY_KEY, clean);
    if (typeof state !== "undefined" && state.settings) state.settings.userCategories = clean;
  }

  function getHiddenCategories() {
    const fromKey = readJson(HIDDEN_CATEGORY_KEY, []);
    const fromSettings = (typeof state !== "undefined" && state.settings && Array.isArray(state.settings.hiddenCategories)) ? state.settings.hiddenCategories : [];
    return unique([].concat(fromKey, fromSettings, SYSTEM_REMOVE));
  }

  function saveHiddenCategories(categories) {
    const clean = unique(categories).filter((name) => !PROTECTED_CATEGORIES.includes(name));
    writeJson(HIDDEN_CATEGORY_KEY, clean);
    if (typeof state !== "undefined" && state.settings) state.settings.hiddenCategories = clean;
  }

  function unique(items) {
    return [...new Set(items.map((item) => String(item || "").trim()).filter(Boolean))];
  }

  function uniqueObjects(items) {
    const map = new Map();
    items.forEach((item) => {
      const name = String(item && item.name || "").trim();
      if (!name) return;
      const existing = map.get(normalize(name));
      const clean = {
        name,
        emoji: String(item.emoji || "🏷️").trim() || "🏷️",
        legacy: unique(item.legacy || [name]),
        keywords: unique(item.keywords || [name])
      };
      if (existing) {
        existing.keywords = unique(existing.keywords.concat(clean.keywords));
        existing.legacy = unique(existing.legacy.concat(clean.legacy));
        existing.emoji = clean.emoji || existing.emoji;
      } else {
        map.set(normalize(name), clean);
      }
    });
    return Array.from(map.values());
  }

  function addUnique(array, values) {
    values.forEach(function (value) {
      if (!array.some(function (item) { return normalize(item) === normalize(value); })) array.push(value);
    });
  }

  function removeCategoryFromArrays(name) {
    if (typeof CATEGORY_DEFINITIONS !== "undefined") {
      for (let index = CATEGORY_DEFINITIONS.length - 1; index >= 0; index -= 1) {
        if (CATEGORY_DEFINITIONS[index] && CATEGORY_DEFINITIONS[index].name === name) CATEGORY_DEFINITIONS.splice(index, 1);
      }
    }
    if (typeof CATEGORY_NAMES !== "undefined") {
      for (let index = CATEGORY_NAMES.length - 1; index >= 0; index -= 1) {
        if (CATEGORY_NAMES[index] === name) CATEGORY_NAMES.splice(index, 1);
      }
    }
    if (typeof CATEGORY_BY_NAME !== "undefined" && CATEGORY_BY_NAME[name]) delete CATEGORY_BY_NAME[name];
  }

  function insertOrUpdateCategory(definition) {
    if (!definition || !definition.name || PROTECTED_CATEGORIES.includes(definition.name)) return;
    if (!CATEGORY_BY_NAME[definition.name]) {
      const insertAt = CATEGORY_NAMES.includes("أخرى") ? CATEGORY_NAMES.indexOf("أخرى") : CATEGORY_DEFINITIONS.length;
      CATEGORY_DEFINITIONS.splice(insertAt, 0, definition);
      CATEGORY_NAMES.splice(insertAt, 0, definition.name);
      CATEGORY_BY_NAME[definition.name] = definition;
    } else {
      CATEGORY_BY_NAME[definition.name].emoji = definition.emoji || CATEGORY_BY_NAME[definition.name].emoji || "🏷️";
      addUnique(CATEGORY_BY_NAME[definition.name].keywords, definition.keywords || []);
      addUnique(CATEGORY_BY_NAME[definition.name].legacy, definition.legacy || []);
    }
  }

  function extendCategories() {
    if (typeof CATEGORY_DEFINITIONS === "undefined" || typeof CATEGORY_NAMES === "undefined" || typeof CATEGORY_BY_NAME === "undefined") return false;

    const hidden = getHiddenCategories();
    hidden.forEach(removeCategoryFromArrays);

    BASE_EXTRA_DEFINITIONS.forEach(insertOrUpdateCategory);
    getUserCategories().forEach(insertOrUpdateCategory);

    Object.keys(EXTRA_KEYWORDS).forEach(function (categoryName) {
      const category = CATEGORY_BY_NAME[categoryName];
      if (category) addUnique(category.keywords, EXTRA_KEYWORDS[categoryName]);
    });

    hidden.forEach(removeCategoryFromArrays);

    if (typeof LEGACY_CATEGORY_MAP !== "undefined") {
      Object.keys(CATEGORY_RENAMES).forEach(function (oldName) {
        LEGACY_CATEGORY_MAP[normalize(oldName)] = CATEGORY_RENAMES[oldName];
      });
      CATEGORY_DEFINITIONS.forEach(function (definition) {
        LEGACY_CATEGORY_MAP[normalize(definition.name)] = definition.name;
        (definition.legacy || []).forEach(function (legacy) { LEGACY_CATEGORY_MAP[normalize(legacy)] = definition.name; });
      });
    }
    return true;
  }

  function renameAndRestoreStoredData() {
    if (typeof state === "undefined") return;
    if (Array.isArray(state.transactions)) {
      state.transactions.forEach(function (item) {
        const current = String(item.category || "");
        if (CATEGORY_RENAMES[current]) {
          item.originalCategory = item.originalCategory || current;
          item.category = CATEGORY_RENAMES[current];
        }
        if (item.originalCategory && CATEGORY_BY_NAME[item.originalCategory]) {
          item.category = item.originalCategory;
        }
        if (!CATEGORY_BY_NAME[item.category]) {
          item.originalCategory = item.originalCategory || item.category;
          item.category = "أخرى";
        }
      });
    }
    if (state.settings && state.settings.keywords) {
      Object.keys(CATEGORY_RENAMES).forEach(function (oldName) {
        const newName = CATEGORY_RENAMES[oldName];
        if (state.settings.keywords[oldName]) {
          state.settings.keywords[newName] = (state.settings.keywords[newName] || []).concat(state.settings.keywords[oldName]);
          delete state.settings.keywords[oldName];
        }
      });
    }
  }

  function injectCategoryManager() {
    if (document.getElementById("category-manager-panel")) return;
    const fixedList = document.getElementById("fixed-category-list");
    if (!fixedList) return;
    const panel = document.createElement("article");
    panel.id = "category-manager-panel";
    panel.className = "panel";
    panel.innerHTML = `
      <h3>➕ تعديل الفئات</h3>
      <p class="muted-text">زيد فئة جديدة أو حيد فئة. المصاريف ما كيتحيدوش، غير الفئة المحيدة كترجع 📦 أخرى.</p>
      <div class="category-manager-grid">
        <input id="new-category-emoji" type="text" maxlength="4" placeholder="Emoji مثال: 🚶">
        <input id="new-category-name" type="text" placeholder="اسم الفئة">
      </div>
      <input id="new-category-keywords" type="text" placeholder="كلمات التصنيف: كلمة، كلمة، كلمة">
      <button id="save-new-category-btn" class="secondary-button" type="button">➕ زيد الفئة</button>
      <div id="editable-category-list" class="editable-category-list"></div>
    `;
    fixedList.closest("article").insertAdjacentElement("afterend", panel);
    panel.querySelector("#save-new-category-btn").addEventListener("click", addCategoryFromForm);
    panel.querySelector("#editable-category-list").addEventListener("click", handleDeleteCategory);
    addManagerCss();
  }

  function addManagerCss() {
    if (document.getElementById("category-manager-style")) return;
    const style = document.createElement("style");
    style.id = "category-manager-style";
    style.textContent = `
      .category-manager-grid{display:grid;grid-template-columns:80px 1fr;gap:10px;margin:10px 0}
      .editable-category-list{display:grid;gap:8px;margin-top:12px}
      .editable-category-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border:1px solid rgba(15,107,92,.16);border-radius:14px;background:rgba(255,255,255,.72)}
      .editable-category-row strong{font-size:14px}
      .editable-category-row span{display:block;color:#6b7280;font-size:12px;margin-top:2px}
      .mini-danger{border:0;border-radius:999px;padding:7px 10px;background:#fee2e2;color:#991b1b;font-weight:800}
      .mini-danger:disabled{opacity:.35}
    `;
    document.head.appendChild(style);
  }

  function addCategoryFromForm() {
    const emojiInput = document.getElementById("new-category-emoji");
    const nameInput = document.getElementById("new-category-name");
    const keywordsInput = document.getElementById("new-category-keywords");
    const name = String(nameInput.value || "").trim();
    const emoji = String(emojiInput.value || "🏷️").trim() || "🏷️";
    const keywords = unique(String(keywordsInput.value || "").split(/[،,]/).concat([name]));
    if (!name) return toast("كتب اسم الفئة");
    if (CATEGORY_BY_NAME && CATEGORY_BY_NAME[name]) return toast("هاد الفئة موجودة من قبل");

    const categories = getUserCategories();
    categories.push({ name, emoji, legacy: [name], keywords });
    saveUserCategories(categories);
    saveHiddenCategories(getHiddenCategories().filter((item) => normalize(item) !== normalize(name)));
    refreshApp(true);
    emojiInput.value = "";
    nameInput.value = "";
    keywordsInput.value = "";
    toast("تزادت الفئة");
  }

  function handleDeleteCategory(event) {
    const button = event.target.closest("[data-delete-category]");
    if (!button) return;
    const name = button.dataset.deleteCategory;
    if (PROTECTED_CATEGORIES.includes(name)) return;
    if (!confirm(`تحيد فئة: ${name}؟\nالمصاريف ديالها غادي تبقى ولكن تتحول إلى أخرى.`)) return;

    const categories = getUserCategories().filter((cat) => normalize(cat.name) !== normalize(name));
    saveUserCategories(categories);
    saveHiddenCategories(unique(getHiddenCategories().concat([name])));

    if (typeof state !== "undefined" && Array.isArray(state.transactions)) {
      state.transactions.forEach(function (item) {
        if (item.category === name) {
          item.originalCategory = item.originalCategory || name;
          item.category = "أخرى";
        }
      });
    }
    refreshApp(true);
    toast("تحيدات الفئة");
  }

  function renderEditableCategoryList() {
    const list = document.getElementById("editable-category-list");
    if (!list || typeof CATEGORY_DEFINITIONS === "undefined") return;
    const hidden = getHiddenCategories();
    const rows = CATEGORY_DEFINITIONS
      .filter((cat) => cat && cat.name && !hidden.includes(cat.name))
      .map((cat) => {
        const disabled = PROTECTED_CATEGORIES.includes(cat.name) ? "disabled" : "";
        const label = PROTECTED_CATEGORIES.includes(cat.name) ? "ثابتة" : "حذف";
        return `<div class="editable-category-row"><div><strong>${cat.emoji || "🏷️"} ${escapeValue(cat.name)}</strong><span>${PROTECTED_CATEGORIES.includes(cat.name) ? "ما كتتحيدش" : "تقدر تحيدها"}</span></div><button class="mini-danger" type="button" data-delete-category="${escapeValue(cat.name)}" ${disabled}>${label}</button></div>`;
      }).join("");
    list.innerHTML = rows || "";
  }

  function escapeValue(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function toast(message) {
    if (typeof showToast === "function") showToast(message);
    else alert(message);
  }

  function refreshApp(save) {
    try {
      extendCategories();
      renameAndRestoreStoredData();
      if (save && typeof persist === "function") persist();
      if (typeof refreshCategoryControls === "function") refreshCategoryControls();
      if (typeof renderFixedCategories === "function") renderFixedCategories();
      injectCategoryManager();
      renderEditableCategoryList();
      if (typeof render === "function") render();
      renderEditableCategoryList();
    } catch (error) {
      console.warn("Category manager refresh failed", error);
    }
  }

  try { extendCategories(); } catch (error) { console.warn("Category extension skipped", error); }

  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(function () { refreshApp(true); }, 100);
    setTimeout(function () { refreshApp(false); }, 800);
  });
})();
