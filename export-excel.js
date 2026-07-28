/* Masarif Pro Mobile - Excel export helper */
(function () {
  "use strict";

  const STORAGE_KEY = "masarifProMobile.v1";
  const XLSX_CDN = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js";

  document.addEventListener("DOMContentLoaded", setupExcelButton);

  function setupExcelButton() {
    const csvButton = document.getElementById("export-csv-btn");
    let xlsxButton = document.getElementById("export-xlsx-btn");

    if (!xlsxButton && csvButton) {
      xlsxButton = document.createElement("button");
      xlsxButton.id = "export-xlsx-btn";
      xlsxButton.className = "secondary-button";
      xlsxButton.type = "button";
      xlsxButton.textContent = "Export Excel XLSX";
      csvButton.insertAdjacentElement("afterend", xlsxButton);
    }

    if (xlsxButton) {
      xlsxButton.removeEventListener("click", exportExcelXlsx);
      xlsxButton.addEventListener("click", exportExcelXlsx);
    }
  }

  function getState() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      if (!Array.isArray(data.transactions)) return { transactions: [] };
      return data;
    } catch {
      return { transactions: [] };
    }
  }

  function todayISO() {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 10);
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (window.XLSX) return resolve();
      const script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function exportExcelXlsx() {
    try {
      await loadScript(XLSX_CDN);
      const state = getState();
      const rows = state.transactions.map(function (item) {
        const amount = Number(item.amount || 0);
        return {
          "التاريخ": String(item.date || ""),
          "النوع": item.type === "income" ? "مدخول" : "مصروف",
          "الفئة": String(item.category || ""),
          "الوصف الأصلي": String(item.raw || item.note || ""),
          "الملاحظة": String(item.note || ""),
          "المبلغ": Math.round(amount * 100) / 100,
          "تاريخ الإضافة": String(item.createdAt || "")
        };
      });

      const headers = ["التاريخ", "النوع", "الفئة", "الوصف الأصلي", "الملاحظة", "المبلغ", "تاريخ الإضافة"];
      const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
      worksheet["!cols"] = [
        { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 34 }, { wch: 24 }, { wch: 12 }, { wch: 24 }
      ];
      worksheet["!dir"] = "rtl";

      const workbook = XLSX.utils.book_new();
      workbook.Workbook = { Views: [{ RTL: true }] };
      XLSX.utils.book_append_sheet(workbook, worksheet, "Masarif");
      XLSX.writeFile(workbook, "masarif-excel-" + todayISO() + ".xlsx");
    } catch (error) {
      alert("تعذر تصدير Excel. جرّب مرة أخرى، وتأكد من الاتصال بالإنترنت أول مرة.");
    }
  }
})();
