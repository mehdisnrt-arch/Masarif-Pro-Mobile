/* Masarif Pro Mobile - user category fixes
   This file only extends/renames categories and smart keywords. It does not delete archive/data. */
(function () {
  "use strict";

  const CATEGORY_RENAMES = {
    "سلفيات (محمد)": "سلفيات",
    "النظافة (مع الحلاقة)": "نظافة شخصية"
  };

  const CATEGORIES_TO_REMOVE = ["النظافة (مع الحلاقة)"];

  const EXTRA_DEFINITIONS = [
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

  function extendCategories() {
    if (typeof CATEGORY_DEFINITIONS === "undefined" || typeof CATEGORY_NAMES === "undefined" || typeof CATEGORY_BY_NAME === "undefined") return false;

    CATEGORIES_TO_REMOVE.forEach(removeCategoryFromArrays);

    EXTRA_DEFINITIONS.forEach(function (definition) {
      if (!CATEGORY_BY_NAME[definition.name]) {
        const insertAt = CATEGORY_NAMES.includes("أخرى") ? CATEGORY_NAMES.indexOf("أخرى") : CATEGORY_DEFINITIONS.length;
        CATEGORY_DEFINITIONS.splice(insertAt, 0, definition);
        CATEGORY_NAMES.splice(insertAt, 0, definition.name);
        CATEGORY_BY_NAME[definition.name] = definition;
      } else {
        CATEGORY_BY_NAME[definition.name].emoji = definition.emoji;
        addUnique(CATEGORY_BY_NAME[definition.name].keywords, definition.keywords || []);
        addUnique(CATEGORY_BY_NAME[definition.name].legacy, definition.legacy || []);
      }
    });

    Object.keys(EXTRA_KEYWORDS).forEach(function (categoryName) {
      const category = CATEGORY_BY_NAME[categoryName];
      if (category) addUnique(category.keywords, EXTRA_KEYWORDS[categoryName]);
    });

    if (typeof LEGACY_CATEGORY_MAP !== "undefined") {
      Object.keys(CATEGORY_RENAMES).forEach(function (oldName) {
        LEGACY_CATEGORY_MAP[normalize(oldName)] = CATEGORY_RENAMES[oldName];
      });
      EXTRA_DEFINITIONS.forEach(function (definition) {
        LEGACY_CATEGORY_MAP[normalize(definition.name)] = definition.name;
        (definition.legacy || []).forEach(function (legacy) { LEGACY_CATEGORY_MAP[normalize(legacy)] = definition.name; });
      });
    }

    if (typeof state !== "undefined" && state.settings) {
      state.settings.categoryMigrationVersion = 0;
    }

    return true;
  }

  function renameStoredData() {
    if (typeof state === "undefined") return;
    if (Array.isArray(state.transactions)) {
      state.transactions.forEach(function (item) {
        const current = String(item.category || "");
        if (CATEGORY_RENAMES[current]) {
          item.originalCategory = item.originalCategory || current;
          item.category = CATEGORY_RENAMES[current];
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

  function refreshApp() {
    try {
      extendCategories();
      renameStoredData();
      if (typeof migrateStateWithoutDeletingArchive === "function") migrateStateWithoutDeletingArchive(true);
      renameStoredData();
      if (typeof persist === "function") persist();
      if (typeof refreshCategoryControls === "function") refreshCategoryControls();
      if (typeof renderFixedCategories === "function") renderFixedCategories();
      if (typeof render === "function") render();
    } catch (error) {
      console.warn("Category extension refresh failed", error);
    }
  }

  try {
    extendCategories();
  } catch (error) {
    console.warn("Category extension skipped", error);
  }

  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(refreshApp, 100);
    setTimeout(refreshApp, 800);
  });
})();
