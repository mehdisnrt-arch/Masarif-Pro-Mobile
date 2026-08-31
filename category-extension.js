/* Masarif Pro Mobile - extra categories requested by user
   This file only extends categories and smart keywords. It does not delete archive/data. */
(function () {
  "use strict";

  const EXTRA_DEFINITIONS = [
    {
      name: "نظافة شخصية",
      emoji: "🧴",
      legacy: ["نظافة شخصية"],
      keywords: ["كينطة", "كِنطة", "قينطة", "kinta", "kineta", "quenta", "نظافة شخصية", "عطر", "parfum", "deodorant", "gel douche", "shampoing", "shampoo"]
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
    }
  ];

  const EXTRA_KEYWORDS = {
    "الأكل": ["موندا", "موندَة", "monda", "munda", "مندا"],
    "نظافة شخصية": ["كينطة", "قينطة", "kinta", "kineta", "quenta"],
    "التجول": ["بحر", "البحر", "شاطئ", "plage", "beach", "mer", "خرجة", "خروج"],
    "أجهزة إلكترونية": ["الكترونيك", "إلكترونيك", "electronique", "électronique", "electronic", "electronics"]
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

  function extendCategories() {
    if (typeof CATEGORY_DEFINITIONS === "undefined" || typeof CATEGORY_NAMES === "undefined" || typeof CATEGORY_BY_NAME === "undefined") return false;

    EXTRA_DEFINITIONS.forEach(function (definition) {
      if (!CATEGORY_BY_NAME[definition.name]) {
        const insertAt = CATEGORY_NAMES.includes("أخرى") ? CATEGORY_NAMES.indexOf("أخرى") : CATEGORY_DEFINITIONS.length;
        CATEGORY_DEFINITIONS.splice(insertAt, 0, definition);
        CATEGORY_NAMES.splice(insertAt, 0, definition.name);
        CATEGORY_BY_NAME[definition.name] = definition;
      } else {
        addUnique(CATEGORY_BY_NAME[definition.name].keywords, definition.keywords || []);
        addUnique(CATEGORY_BY_NAME[definition.name].legacy, definition.legacy || []);
      }
    });

    Object.keys(EXTRA_KEYWORDS).forEach(function (categoryName) {
      const category = CATEGORY_BY_NAME[categoryName];
      if (category) addUnique(category.keywords, EXTRA_KEYWORDS[categoryName]);
    });

    if (typeof LEGACY_CATEGORY_MAP !== "undefined") {
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

  function refreshApp() {
    try {
      extendCategories();
      if (typeof migrateStateWithoutDeletingArchive === "function") migrateStateWithoutDeletingArchive(true);
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
