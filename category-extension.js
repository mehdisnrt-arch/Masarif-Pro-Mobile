/* Masarif Pro Mobile - extra categories requested by user
   This file only extends categories and smart keywords. It does not delete archive/data. */
(function () {
  "use strict";

  const EXTRA_DEFINITIONS = [
    {
      name: "نظافة شخصية",
      emoji: "🧴",
      legacy: [],
      keywords: ["كينطة", "كِنطة", "kinta", "kineta", "quenta"]
    },
    {
      name: "التجول",
      emoji: "🚶",
      legacy: [],
      keywords: ["بحر", "البحر", "شاطئ", "كورنيش", "plage", "beach", "mer", "promenade", "balade", "tour", "sortie", "تجول", "جولة"]
    },
    {
      name: "أجهزة إلكترونية",
      emoji: "💻",
      legacy: [],
      keywords: ["الكترونيك", "إلكترونيك", "الكترونيات", "إلكترونيات", "electronic", "electronique", "électronique", "pc", "ordinateur", "laptop", "هاتف", "telephone", "téléphone", "chargeur", "شارجور", "cable", "كابل", "usb", "ssd", "ram"]
    }
  ];

  const EXTRA_KEYWORDS = {
    "الأكل": ["موندا", "موندَة", "monda", "munda"],
    "نظافة شخصية": ["كينطة", "kinta", "kineta"],
    "التجول": ["بحر", "البحر", "شاطئ", "plage", "beach", "mer"],
    "أجهزة إلكترونية": ["الكترونيك", "إلكترونيك", "electronique", "électronique", "electronic"]
  };

  function normalize(value) {
    if (typeof normalizeForMatch === "function") return normalizeForMatch(value);
    return String(value || "").toLowerCase().trim();
  }

  function addUnique(array, values) {
    values.forEach(function (value) {
      if (!array.some(function (item) { return normalize(item) === normalize(value); })) array.push(value);
    });
  }

  function extendCategories() {
    if (typeof CATEGORY_DEFINITIONS === "undefined" || typeof CATEGORY_NAMES === "undefined" || typeof CATEGORY_BY_NAME === "undefined") return;

    EXTRA_DEFINITIONS.forEach(function (definition) {
      if (!CATEGORY_BY_NAME[definition.name]) {
        CATEGORY_DEFINITIONS.splice(Math.max(CATEGORY_DEFINITIONS.length - 1, 0), 0, definition);
        CATEGORY_NAMES.splice(Math.max(CATEGORY_NAMES.length - 1, 0), 0, definition.name);
        CATEGORY_BY_NAME[definition.name] = definition;
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
      // Force a safe recategorization on next init without deleting any transaction.
      state.settings.categoryMigrationVersion = 0;
    }
  }

  try {
    extendCategories();
  } catch (error) {
    console.warn("Category extension skipped", error);
  }
})();
