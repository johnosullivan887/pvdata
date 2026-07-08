const PVDataDownload = (() => {
  function collectHeaders(rows) {
    const headers = [];
    const seen = new Set();

    rows.forEach((row) => {
      if (!row || typeof row !== "object") return;
      Object.keys(row).forEach((key) => {
        if (!seen.has(key)) {
          seen.add(key);
          headers.push(key);
        }
      });
    });

    return headers;
  }

  function csvEscape(value) {
    const text = value === null || value === undefined ? "" : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  }

  function rowsToCSV(rows) {
    if (!Array.isArray(rows) || !rows.length) return "";

    const headers = collectHeaders(rows);
    const lines = [headers.join(",")];

    rows.forEach((row) => {
      const line = headers
        .map((header) => {
          const value = row?.[header];
          if (value && typeof value === "object") {
            return csvEscape(JSON.stringify(value));
          }
          return csvEscape(value);
        })
        .join(",");
      lines.push(line);
    });

    return lines.join("\n");
  }

  function downloadCSV(filename, rows) {
    if (!rows || !rows.length) {
      alert("No data to download.");
      return;
    }

    const csv = rowsToCSV(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }

  function bindButton(buttonId, filename, getRows) {
    const btn = document.getElementById(buttonId);
    if (!btn || btn.dataset.bound === "true") return;

    btn.dataset.bound = "true";
    btn.addEventListener("click", () => {
      downloadCSV(filename, getRows());
    });
  }

  return {
    rowsToCSV,
    downloadCSV,
    bindButton
  };
})();

window.PVDataDownload = PVDataDownload;
