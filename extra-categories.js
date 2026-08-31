/* Extra categories for Masarif Pro Mobile - added without deleting archive */
(function () {
  "use strict";

  const EXTRA_CATEGORIES = [
    {
      name: "نظافة شخصية",
      emoji: "🧴",
      legacy: [],
      keywords: ["كينطة", "قينطة", "kinta", "quenta", "نظافة شخصية", "عطر", "parfum", "deodorant", "gel douche", "shampoing", "shampoo"]
    },
    {
      name: "التجول",
      emoji: "🚶",
      legacy: [],
      keywords: ["بحر", "البحر", "تجول", "التجول", "خرجة", "خروج", "balade", "promenade", "sortie", "plage", "beach"]
    },
    {
      name: "أجهزة إلكترونية",
      emoji: "💻",
      legacy: [],
      keywords: ["الكترونيك", "إلكترونيك", "الكترونيات", "إلكترونيات", "electronique", "électronique", "electronics", "chargeur", "شارجور", "كابل", "cable", "usb", "pc", "telephone", "هاتف", "ordinateur"]
    }
  ];

  const EXTRA_KEYWORDS = {
    "الأكل": ["موندا", "monda", "munda", "مندا"]
  };

  function norm(value) {
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

  function installExtraCategories() {
    if (typeof CATEGORY_DEFINITIONS === "undefined" || typeof CATEGORY_NAMES === "undefined" || typeof CATEGORY_BY_NAME === "undefined") return;

    EXTRA_CATEGORIES.forEach(function (category) {
      if (!CATEGORY_BY_NAME[category.name]) {
        CATEGORY_DEFINITIONS.splice(Math.max(CATEGORY_DEFINITIONS.length - 1, 0), 0, category);
        CATEGORY_NAMES.splice(Math.max(CATEGORY_NAMES.length - 1, 0), 0, category.name);
        CATEGORY_BY_NAME[category.name] = category;
      }
      if (typeof LEGACY_CATEGORY_MAP !== "undefined") {
        LEGACY_CATEGORY_MAP[norm(category.name)] = category.name;
        category.legacy.forEach(function (legacy) { LEGACY_CATEGORY_MAP[norm(legacy)] = category.name; });
      }
    });

    Object.keys(EXTRA_KEYWORDS).forEach(function (categoryName) {
      const target = CATEGORY_BY_NAME[categoryName];
      if (!target) return;
      target.keywords = Array.from(new Set([...(target.keywords || []), ...EXTRA_KEYWORDS[categoryName]]));
    });
  }

  installExtraCategories();

  document.addEventListener("DOMContentLoaded", function () {
    installExtraCategories();
    try {
      if (typeof refreshCategoryControls === "function") refreshCategoryControls();
      if (typeof renderFixedCategories === "function") renderFixedCategories();
      if (typeof render === "function") render();
    } catch (error) {
      console.warn("Extra categories refresh failed", error);
    }
  });
})();
