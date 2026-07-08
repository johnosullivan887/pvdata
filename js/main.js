const navButtons = document.querySelectorAll(".nav-btn");
const views = document.querySelectorAll(".view");

let tableData = [];
let databaseRows = [];
let databaseSort = { key: null, direction: "asc" };
let databaseControlsBound = false;

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    navButtons.forEach((b) => b.classList.remove("active"));
    button.classList.add("active");

    const target = button.dataset.target;
    views.forEach((view) => {
      view.classList.toggle("active", view.id === target);
    });

    if (
      tableData.length &&
      ["indium-use", "tce-materials", "evaluation"].includes(target)
    ) {
      renderAllFigures();
    }
  });
});

function parseDate(value) {
  if (!value) return null;

  const s = String(value).trim();
  const parts = s.split("/");

  if (parts.length === 3) {
    const [day, month, year] = parts.map(Number);
    const d = new Date(year, month - 1, day);
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function parseNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : null;
}

function getValue(row, ...keys) {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatReference(value) {
  const ref = String(value ?? "").trim();
  if (!ref) return "";

  if (/^https?:\/\//i.test(ref)) {
    return `<a href="${escapeHtml(ref)}" target="_blank" rel="noopener noreferrer">Open</a>`;
  }

  if (/^10\.\d{4,9}\//i.test(ref)) {
    const doiUrl = `https://doi.org/${ref}`;
    return `<a href="${escapeHtml(doiUrl)}" target="_blank" rel="noopener noreferrer">Open</a>`;
  }

  return escapeHtml(ref);
}

function normalizeCategory(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";

  const lower = text.toLowerCase();
  if (lower === "not clear") return "Not clear";
  if (lower === "none") return "None";
  if (lower === "other") return "Other";
  if (lower === "in-free" || lower === "in free") return "In-Free";
  if (lower === "no layer") return "No layer";
  if (lower === "no tce") return "No TCE";

  return text;
}

function getPaperHighlight(row) {
  return getValue(row, "Highlight");
}

function getDatabaseYear(row) {
  const yearRaw = getValue(row, "Year");
  if (yearRaw) return String(yearRaw).trim();

  const dateRaw = getValue(row, "Publishing date", "Date");
  const match = String(dateRaw).match(/(19|20)\d{2}/);
  return match ? match[0] : "";
}

function getDatabaseDateSortValue(row) {
  const parsed = parseDate(getValue(row, "Publishing date", "Date"));
  if (parsed) return parsed.getTime();

  const year = getDatabaseYear(row);
  const numericYear = Number(year);
  return Number.isFinite(numericYear) ? numericYear : 0;
}

function getDatabaseCell(row) {
  return normalizeCategory(getValue(row, "Si Bottom cell type", "Cell"));
}

function getDatabaseFrontTCO(row) {
  return normalizeCategory(getValue(row, "Front TCE (fTCE)", "Front TCO"));
}

function getDatabaseCertified(row) {
  const v = getValue(row, "Certified (yes/no)", "Certified", "certified");
  const s = v.toLowerCase();
  if (s === "yes") return "yes";
  if (s === "no") return "no";
  return "";
}

function getDatabaseInterlayerTCE(row) {
  return normalizeCategory(getValue(row, "Interlayer TCE", "Inter-layer"));
}

function getDatabaseRearTCE(row) {
  return normalizeCategory(getValue(row, "Rear Electrode", "Rear electrode"));
}

function compareDatabaseValues(a, b) {
  const an = Number(a);
  const bn = Number(b);
  const aNum = Number.isFinite(an);
  const bNum = Number.isFinite(bn);

  if (aNum && bNum) return an - bn;

  return String(a ?? "").localeCompare(String(b ?? ""), undefined, {
    numeric: true,
    sensitivity: "base"
  });
}

function sortHeaderHtml(label, key) {
  const arrow =
    databaseSort.key === key
      ? databaseSort.direction === "asc"
        ? " ▲"
        : " ▼"
      : "";
  return `${label}${arrow}`;
}

function uniqueSorted(values, comparator) {
  return [...new Set(values.filter((v) => String(v ?? "").trim() !== ""))].sort(
    comparator
  );
}

function fillSelect(selectId, values, allLabel, keyFn = (v) => v) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const current = select.value || "all";
  const options = [`<option value="all">${allLabel}</option>`]
    .concat(
      values.map(
        (v) =>
          `<option value="${escapeHtml(keyFn(v))}">${escapeHtml(v)}</option>`
      )
    )
    .join("");

  select.innerHTML = options;
  select.value = values.some((v) => keyFn(v) === current) ? current : "all";
}

function populateDatabaseFilters(rows) {
  const years = uniqueSorted(rows.map(getDatabaseYear), (a, b) => Number(b) - Number(a));
  const cells = uniqueSorted(rows.map(getDatabaseCell), (a, b) => a.localeCompare(b));
  const fronts = uniqueSorted(rows.map(getDatabaseFrontTCO), (a, b) => a.localeCompare(b));
  const interlayers = uniqueSorted(rows.map(getDatabaseInterlayerTCE), (a, b) =>
    a.localeCompare(b)
  );
  const rears = uniqueSorted(rows.map(getDatabaseRearTCE), (a, b) => a.localeCompare(b));

  fillSelect("db-year", years, "All years");
  fillSelect("db-cell", cells, "All cell types");
  fillSelect("db-front", fronts, "All front TCEs");
  fillSelect("db-interlayer", interlayers, "All interlayer TCEs");
  fillSelect("db-rear", rears, "All rear TCEs");
}

function getDatabaseFilters() {
  return {
    q: (document.getElementById("db-search")?.value || "").trim().toLowerCase(),
    certified: document.getElementById("db-certified")?.value || "all",
    year: document.getElementById("db-year")?.value || "all",
    cell: document.getElementById("db-cell")?.value || "all",
    front: document.getElementById("db-front")?.value || "all",
    interlayer: document.getElementById("db-interlayer")?.value || "all",
    rear: document.getElementById("db-rear")?.value || "all"
  };
}

function rowMatchesDatabase(row, filters) {
  const haystack = [
    getValue(row, "Author"),
    getValue(row, "Publishing date", "Date", "Year"),
    getValue(row, "Highlight"),
    getValue(row, "Si Bottom cell type", "Cell"),
    getValue(
      row,
      "Interlayer TCE",
      "Inter-layer",
      "Inter-layer thicknes",
      "Inter-layer thickness",
      "IL thickness (nm)"
    ),
    getValue(row, "Rear Electrode", "Rear electrode"),
    getValue(row, "Rear TCE thickness (nm)", "Rear TCO thickness"),
    getValue(row, "Active Area (cm2)", "Cell active area"),
    getValue(row, "Front TCE (fTCE)", "Front TCO"),
    getValue(
      row,
      "fTCE thickness (nm)",
      "Front TCO thickness",
      "Total front TCO thickness"
    ),
    getValue(row, "η (%)", "n tandem"),
    getValue(row, "Certified (yes/no)", "Certified", "certified"),
    getValue(row, "Reference", "Reference link", "DOI")
  ]
    .join(" | ")
    .toLowerCase();

  if (filters.q && !haystack.includes(filters.q)) return false;
  if (filters.certified !== "all" && getDatabaseCertified(row) !== filters.certified) return false;
  if (filters.year !== "all" && getDatabaseYear(row) !== filters.year) return false;
  if (filters.cell !== "all" && getDatabaseCell(row) !== filters.cell) return false;
  if (filters.front !== "all" && getDatabaseFrontTCO(row) !== filters.front) return false;
  if (filters.interlayer !== "all" && getDatabaseInterlayerTCE(row) !== filters.interlayer) return false;
  if (filters.rear !== "all" && getDatabaseRearTCE(row) !== filters.rear) return false;

  return true;
}

function renderDatabaseTable() {
  const summaryEl = document.getElementById("database-summary");
  const tableWrapEl = document.getElementById("database-table-wrap");
  if (!summaryEl || !tableWrapEl) return;

  const filters = getDatabaseFilters();
  const filteredRows = databaseRows.filter((row) => rowMatchesDatabase(row, filters));
  window.filteredDatabaseRows = filteredRows;
  
  summaryEl.innerHTML = `
    Showing <strong>${filteredRows.length}</strong> of <strong>${databaseRows.length}</strong> rows.
  `;

  if (!filteredRows.length) {
    tableWrapEl.innerHTML = "<p>No rows match the current filters.</p>";
    return;
  }

  const sortedRows = filteredRows.slice();

  const accessorMap = {
    author: (row) => getValue(row, "Author"),
    date: (row) => getDatabaseDateSortValue(row),
    highlight: (row) => getPaperHighlight(row),
    cell: (row) => getDatabaseCell(row),
    interlayer: (row) => getDatabaseInterlayerTCE(row),
    "interlayer-thickness": (row) =>
      getValue(
        row,
        "Inter-layer thicknes",
        "Inter-layer thickness",
        "IL thickness (nm)",
        "Inter-layer TCE thickness"
      ),
    rear: (row) => getDatabaseRearTCE(row),
    "rear-thickness": (row) => getValue(row, "Rear TCE thickness (nm)", "Rear TCO thickness"),
    area: (row) => getValue(row, "Active Area (cm2)", "Cell active area"),
    front: (row) => getDatabaseFrontTCO(row),
    "front-thickness": (row) =>
      getValue(row, "fTCE thickness (nm)", "Front TCO thickness", "Total front TCO thickness"),
    efficiency: (row) => getValue(row, "η (%)", "n tandem"),
    certified: (row) => getDatabaseCertified(row)
  };

  if (databaseSort.key && accessorMap[databaseSort.key]) {
    sortedRows.sort((r1, r2) => {
      const v1 = accessorMap[databaseSort.key](r1);
      const v2 = accessorMap[databaseSort.key](r2);
      const cmp = compareDatabaseValues(v1, v2);
      return databaseSort.direction === "asc" ? cmp : -cmp;
    });
  }

  const rowsHtml = sortedRows
    .map((row) => {
      const highlight = getPaperHighlight(row);
      return `
        <tr>
          <td>${escapeHtml(getValue(row, "Author"))}</td>
          <td>${escapeHtml(getValue(row, "Publishing date", "Date", "Year"))}</td>
          <td class="highlight-cell" title="${escapeHtml(highlight)}">${escapeHtml(highlight)}</td>
          <td>${escapeHtml(getValue(row, "Si Bottom cell type", "Cell"))}</td>
          <td>${escapeHtml(getValue(row, "Interlayer TCE", "Inter-layer"))}</td>
          <td>${escapeHtml(
            getValue(
              row,
              "Inter-layer thicknes",
              "Inter-layer thickness",
              "IL thickness (nm)",
              "Inter-layer TCE thickness"
            )
          )}</td>
          <td>${escapeHtml(getValue(row, "Rear Electrode", "Rear electrode"))}</td>
          <td>${escapeHtml(getValue(row, "Rear TCE thickness (nm)", "Rear TCO thickness"))}</td>
          <td>${escapeHtml(getValue(row, "Active Area (cm2)", "Cell active area"))}</td>
          <td>${escapeHtml(getValue(row, "Front TCE (fTCE)", "Front TCO"))}</td>
          <td>${escapeHtml(
            getValue(row, "fTCE thickness (nm)", "Front TCO thickness", "Total front TCO thickness")
          )}</td>
          <td>${escapeHtml(getValue(row, "η (%)", "n tandem"))}</td>
          <td>${escapeHtml(getValue(row, "Certified (yes/no)", "Certified", "certified"))}</td>
          <td>${formatReference(getValue(row, "Reference", "Reference link", "DOI"))}</td>
        </tr>
      `;
    })
    .join("");

  tableWrapEl.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th data-sort="author" style="cursor:pointer;">${sortHeaderHtml("Author", "author")}</th>
          <th data-sort="date" style="cursor:pointer;">${sortHeaderHtml("Date", "date")}</th>
          <th data-sort="highlight" style="cursor:pointer;">${sortHeaderHtml("Highlight", "highlight")}</th>
          <th data-sort="cell" style="cursor:pointer;">${sortHeaderHtml("Si Bottom cell type", "cell")}</th>
          <th data-sort="interlayer" style="cursor:pointer;">${sortHeaderHtml("Interlayer TCE", "interlayer")}</th>
          <th data-sort="interlayer-thickness" style="cursor:pointer;">${sortHeaderHtml("IL thickness (nm)", "interlayer-thickness")}</th>
          <th data-sort="rear" style="cursor:pointer;">${sortHeaderHtml("Rear Electrode", "rear")}</th>
          <th data-sort="rear-thickness" style="cursor:pointer;">${sortHeaderHtml("Rear TCE thickness (nm)", "rear-thickness")}</th>
          <th data-sort="area" style="cursor:pointer;">${sortHeaderHtml("Active Area (cm<sup>2</sup>)", "area")}</th>
          <th data-sort="front" style="cursor:pointer;">${sortHeaderHtml("Front TCE (fTCE)", "front")}</th>
          <th data-sort="front-thickness" style="cursor:pointer;">${sortHeaderHtml("fTCE thickness (nm)", "front-thickness")}</th>
          <th data-sort="efficiency" style="cursor:pointer;">${sortHeaderHtml("η (%)", "efficiency")}</th>
          <th data-sort="certified" style="cursor:pointer;">${sortHeaderHtml("Certified (yes/no)", "certified")}</th>
          <th>Reference (link to paper)</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;

  tableWrapEl.querySelectorAll("th[data-sort]").forEach((th) => {
    th.addEventListener("click", () => {
      const sortKey = th.dataset.sort;

      if (databaseSort.key === sortKey) {
        databaseSort.direction = databaseSort.direction === "asc" ? "desc" : "asc";
      } else {
        databaseSort.key = sortKey;
        databaseSort.direction = "asc";
      }

      renderDatabaseTable();
    });
  });
}

function bindDatabaseControls() {
  if (databaseControlsBound) return;
  databaseControlsBound = true;

  const ids = [
    "db-search",
    "db-certified",
    "db-year",
    "db-cell",
    "db-front",
    "db-interlayer",
    "db-rear"
  ];

  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", renderDatabaseTable);
    el.addEventListener("change", renderDatabaseTable);
  });

  document.getElementById("db-reset")?.addEventListener("click", () => {
    const search = document.getElementById("db-search");
    const certified = document.getElementById("db-certified");
    const year = document.getElementById("db-year");
    const cell = document.getElementById("db-cell");
    const front = document.getElementById("db-front");
    const interlayer = document.getElementById("db-interlayer");
    const rear = document.getElementById("db-rear");

    if (search) search.value = "";
    if (certified) certified.value = "all";
    if (year) year.value = "all";
    if (cell) cell.value = "all";
    if (front) front.value = "all";
    if (interlayer) interlayer.value = "all";
    if (rear) rear.value = "all";

    databaseSort.key = null;
    databaseSort.direction = "asc";
    renderDatabaseTable();
  });
}

function renderDatabase(rows) {
  databaseRows = rows.slice();
  populateDatabaseFilters(databaseRows);
  bindDatabaseControls();
  renderDatabaseTable();
}

function renderAllFigures() {
  if (typeof renderIndiumPlot === "function") renderIndiumPlot(tableData);
  if (typeof renderFrontTcoPlot === "function") renderFrontTcoPlot(tableData);
  if (typeof renderInterlayerTcePlot === "function") renderInterlayerTcePlot(tableData);
  if (typeof renderRearTcePlot === "function") renderRearTcePlot(tableData);
  if (typeof renderViolinGroupsPlot === "function") renderViolinGroupsPlot(tableData);
  if (typeof renderViolinThicknessPlot === "function") renderViolinThicknessPlot(tableData);
  if (typeof renderCombinationHeatmap === "function") renderCombinationHeatmap(tableData);
  if (typeof renderTimelinePlot === "function") renderTimelinePlot(tableData);
  if (typeof renderInterlayerTimelinePlot === "function") renderInterlayerTimelinePlot(tableData);
  if (typeof renderRearTimelinePlot === "function") renderRearTimelinePlot(tableData);
  if (typeof renderBottomCellTimelinePlot === "function") renderBottomCellTimelinePlot(tableData);
}

function renderTceMaterialFigures() {
  if (typeof renderFrontTcoPlot === "function") renderFrontTcoPlot(tableData);
  if (typeof renderInterlayerTcePlot === "function") renderInterlayerTcePlot(tableData);
  if (typeof renderRearTcePlot === "function") renderRearTcePlot(tableData);
}

document.addEventListener("change", (event) => {
  const id = event.target?.id;

  if (id === "certified-only-tce") {
    renderTceMaterialFigures();
    return;
  }

  if (id === "certified-only-violin-groups") {
    renderViolinGroupsPlot(tableData);
    return;
  }

  if (id === "certified-only-violin-thickness") {
    renderViolinThicknessPlot(tableData);
    return;
  }

  if (id === "certified-only-heatmap") {
    renderCombinationHeatmap(tableData);
    return;
  }

  if (id === "certified-only-timeline") {
    renderTimelinePlot(tableData);
    return;
  }

  if (id === "certified-only-interlayer-timeline") {
    renderInterlayerTimelinePlot(tableData);
    return;
  }

  if (id === "certified-only-rear-timeline") {
    renderRearTimelinePlot(tableData);
    return;
  }

  if (id === "certified-only-bottom-cell-timeline") {
    renderBottomCellTimelinePlot(tableData);
    return;
  }
});

document.addEventListener("input", (event) => {
  if (event.target && event.target.id === "violin-thickness-min-eff") {
    renderViolinThicknessPlot(tableData);
  }
});

function bindDownloadButtons() {
  if (!window.PVDataDownload) return;

  window.PVDataDownload.bindButton(
    "download-database-filtered",
    "PVData_database_filtered.csv",
    () => window.filteredDatabaseRows || []
  );

  window.PVDataDownload.bindButton(
    "download-indium-filtered",
    "PVData_indium_filtered.csv",
    () => window.filteredIndiumRows || []
  );

  window.PVDataDownload.bindButton(
    "download-front-tce-filtered",
    "PVData_front_tce_filtered.csv",
    () => window.filteredFrontTceRows || []
  );

  window.PVDataDownload.bindButton(
    "download-interlayer-tce-filtered",
    "PVData_interlayer_tce_filtered.csv",
    () => window.filteredInterlayerTceRows || []
  );

  window.PVDataDownload.bindButton(
    "download-rear-tce-filtered",
    "PVData_rear_tce_filtered.csv",
    () => window.filteredRearTceRows || []
  );
}

document.addEventListener("change", (event) => {
  if (event.target && event.target.id === "certified-only-tce") {
    renderTceMaterialFigures();
  }
});

document.addEventListener("input", (event) => {
  if (event.target && event.target.id === "violin-thickness-min-eff") {
    renderViolinThicknessPlot(tableData);
  }
});

document.addEventListener("change", (event) => {
  const id = event.target?.id;

  if (id === "certified-only-tce") {
    renderTceMaterialFigures();
    return;
  }

  if (id === "certified-only-violin-groups") {
    renderViolinGroupsPlot(tableData);
    return;
  }

  if (id === "certified-only-violin-thickness") {
    renderViolinThicknessPlot(tableData);
    return;
  }

  if (id === "certified-only-heatmap") {
    renderCombinationHeatmap(tableData);
    return;
  }

  if (id === "certified-only-timeline") {
    renderTimelinePlot(tableData);
    return;
  }

  if (id === "certified-only-interlayer-timeline") {
    renderInterlayerTimelinePlot(tableData);
    return;
  }

  if (id === "certified-only-rear-timeline") {
    renderRearTimelinePlot(tableData);
    return;
  }

  if (id === "certified-only-bottom-cell-timeline") {
    renderBottomCellTimelinePlot(tableData);
    return;
  }
});

document.addEventListener("input", (event) => {
  if (event.target && event.target.id === "violin-thickness-min-eff") {
    renderViolinThicknessPlot(tableData);
  }
});

async function loadData() {
  try {
    tableData = await loadCSV("data/tandem.csv");
    window.__tableData = tableData;

    renderDatabase(tableData);
    renderAllFigures();
    bindDownloadButtons();
  } catch (error) {
    console.error("Failed to load data:", error);

    const databaseSection = document.querySelector("#database .panel");
    if (databaseSection) {
      databaseSection.innerHTML = `
        <h2>Database</h2>
        <p>Failed to load data.</p>
        <pre style="white-space: pre-wrap; color: #b00020;">${String(
          error?.message || error
        )}</pre>
      `;
    }
  }
}
document
  .getElementById("download-database-filtered")
  ?.addEventListener("click", () => {
    downloadCSV(
      "PVData_filtered_database.csv",
      window.filteredDatabaseRows || []
    );
  });

function bindDownloadButtons() {
  if (!window.PVDataDownload) return;

  window.PVDataDownload.bindButton(
    "download-database-filtered",
    "PVData_database_filtered.csv",
    () => window.filteredDatabaseRows || []
  );

  window.PVDataDownload.bindButton(
    "download-indium-filtered",
    "PVData_indium_filtered.csv",
    () => window.filteredIndiumRows || []
  );

  window.PVDataDownload.bindButton(
    "download-front-tce-filtered",
    "PVData_front_tce_filtered.csv",
    () => window.filteredFrontTceRows || []
  );

  window.PVDataDownload.bindButton(
    "download-interlayer-tce-filtered",
    "PVData_interlayer_tce_filtered.csv",
    () => window.filteredInterlayerTceRows || []
  );

  window.PVDataDownload.bindButton(
    "download-rear-tce-filtered",
    "PVData_rear_tce_filtered.csv",
    () => window.filteredRearTceRows || []
  );
}

loadData();
bindDownloadButtons();
