const navButtons = document.querySelectorAll(".nav-btn");
const views = document.querySelectorAll(".view");

let tableData = [];

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    navButtons.forEach((b) => b.classList.remove("active"));
    button.classList.add("active");

    const target = button.dataset.target;
    views.forEach((view) => {
      view.classList.toggle("active", view.id === target);
    });
  });
});

function parseDate(value) {
  if (!value) return null;

  const s = String(value).trim();

  // Handles DD/MM/YYYY
  const parts = s.split("/");
  if (parts.length === 3) {
    const [day, month, year] = parts.map(Number);
    const d = new Date(year, month - 1, day);
    return isNaN(d.getTime()) ? null : d;
  }

  // Fallback for ISO dates or browser-parsable formats
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
    const value = row[key];
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

function getValue(row, ...keys) {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function normalizeCategory(value) {
  const text = String(value ?? "").trim();

  if (text === "") return "";

  const lower = text.toLowerCase();

  if (lower === "not clear") return "Not clear";
  if (lower === "none") return "None";
  if (lower === "other") return "Other";

  return text;
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

function buildReferenceCell(row) {
  const ref = row["Reference"] || row["Reference link"] || row["DOI"] || "";

  if (!ref) return "";

  if (/^https?:\/\//i.test(ref)) {
    return `<a href="${ref}" target="_blank" rel="noopener noreferrer">Open</a>`;
  }

  if (/^10\.\d{4,9}\//i.test(ref)) {
    return `<a href="https://doi.org/${ref}" target="_blank" rel="noopener noreferrer">Open</a>`;
  }

  return ref;
}

let databaseRows = [];
let databaseSort = { key: null, direction: "asc" };

function getDatabaseYear(row) {
  const yearRaw = getValue(row, "Year");
  if (yearRaw) return String(yearRaw).trim();

  const dateRaw = getValue(row, "Publishing date", "Date");
  const match = String(dateRaw).match(/(19|20)\d{2}/);
  return match ? match[0] : "";
}

function getDatabaseCell(row) {
  return getValue(row, "Si Bottom cell type", "Cell");
}

function getDatabaseFrontTCO(row) {
  return normalizeCategory(
    getValue(row, "Front TCE (fTCE)", "Front TCO")
  );
}

function getDatabaseCertified(row) {
  const v = getValue(row, "Certified (yes/no)", "Certified", "certified");
  const s = v.toLowerCase();
  if (s === "yes") return "yes";
  if (s === "no") return "no";
  return "";
}

function getDatabaseInterlayerTCE(row) {
  return normalizeCategory(
    getValue(row, "Interlayer TCE", "Inter-layer")
  );
}

function getDatabaseRearTCE(row) {
  return normalizeCategory(
    getValue(row, "Rear Electrode", "Rear electrode")
  );
}

function uniqueSorted(values, comparator) {
  return [...new Set(values.filter((v) => String(v ?? "").trim() !== ""))].sort(comparator);
}

function fillSelect(selectId, values, allLabel, keyFn = (v) => v) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const current = select.value || "all";
  const options = [`<option value="all">${allLabel}</option>`]
    .concat(values.map((v) => `<option value="${escapeHtml(keyFn(v))}">${escapeHtml(v)}</option>`))
    .join("");

  select.innerHTML = options;
  select.value = values.some((v) => keyFn(v) === current) ? current : "all";
}

function populateDatabaseFilters(rows) {
  const years = uniqueSorted(rows.map(getDatabaseYear), (a, b) => Number(b) - Number(a));
  const cells = uniqueSorted(rows.map(getDatabaseCell), (a, b) => a.localeCompare(b));
  const fronts = uniqueSorted(rows.map(getDatabaseFrontTCO), (a, b) => a.localeCompare(b));
  const interlayers = uniqueSorted(rows.map(getDatabaseInterlayerTCE), (a, b) => a.localeCompare(b));
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
    getValue(row, "Si Bottom cell type", "Cell"),
    getValue(row, "Interlayer TCE", "Inter-layer", "Inter-layer thicknes", "Inter-layer thickness", "IL thickness (nm)"),
    getValue(row, "Rear Electrode", "Rear electrode"),
    getValue(row, "Rear TCE thickness (nm)", "Rear TCO thickness"),
    getValue(row, "Active Area (cm2)", "Cell active area"),
    getValue(row, "Front TCE (fTCE)", "Front TCO"),
    getValue(row, "fTCE thickness (nm)", "Front TCO thickness", "Total front TCO thickness"),
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

  summaryEl.innerHTML = `
    Showing <strong>${filteredRows.length}</strong> of <strong>${databaseRows.length}</strong> rows.
  `;

  if (!filteredRows.length) {
    tableWrapEl.innerHTML = "<p>No rows match the current filters.</p>";
    return;
  }

  const rowsHtml = filteredRows
    .map((row) => {
      return `
        <tr>
          <td>${escapeHtml(getValue(row, "Author"))}</td>
          <td>${escapeHtml(getValue(row, "Publishing date", "Date", "Year"))}</td>
          <td>${escapeHtml(getValue(row, "Si Bottom cell type", "Cell"))}</td>
          <td>${escapeHtml(getValue(row, "Interlayer TCE", "Inter-layer"))}</td>
          <td>${escapeHtml(getValue(row, "Inter-layer thicknes", "Inter-layer thickness", "IL thickness (nm)", "Inter-layer TCE thickness"))}</td>
          <td>${escapeHtml(getValue(row, "Rear Electrode", "Rear electrode"))}</td>
          <td>${escapeHtml(getValue(row, "Rear TCE thickness (nm)", "Rear TCO thickness"))}</td>
          <td>${escapeHtml(getValue(row, "Active Area (cm2)", "Cell active area"))}</td>
          <td>${escapeHtml(getValue(row, "Front TCE (fTCE)", "Front TCO"))}</td>
          <td>${escapeHtml(getValue(row, "fTCE thickness (nm)", "Front TCO thickness", "Total front TCO thickness"))}</td>
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
          <th>Author</th>
          <th>Date</th>
          <th>Si Bottom cell type</th>
          <th>Interlayer TCE</th>
          <th>IL thickness (nm)</th>
          <th>Rear Electrode</th>
          <th>Rear TCE thickness (nm)</th>
          <th>Active Area (cm<sup>2</sup>)</th>
          <th>Front TCE (fTCE)</th>
          <th>fTCE thickness (nm)</th>
          <th>η (%)</th>
          <th>Certified (yes/no)</th>
          <th>Reference (link to paper)</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;
}

function bindDatabaseControls() {
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

    renderDatabaseTable();
  });
}

function renderDatabase(rows) {
  databaseRows = rows.slice();
  populateDatabaseFilters(databaseRows);
  bindDatabaseControls();
  renderDatabaseTable();
}

function bindDatabaseControls() {
  const ids = ["db-search", "db-certified", "db-year", "db-cell", "db-front"];
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

    if (search) search.value = "";
    if (certified) certified.value = "all";
    if (year) year.value = "all";
    if (cell) cell.value = "all";
    if (front) front.value = "all";

    renderDatabaseTable();
  });
}

function renderDatabase(rows) {
  databaseRows = rows.slice();
  populateDatabaseFilters(databaseRows);
  bindDatabaseControls();
  renderDatabaseTable();
}
async function loadData() {
  try {
    tableData = await loadCSV("data/tandem.csv");
    window.__tableData = tableData;
    renderDatabase(tableData);
    renderAllFigures();
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

function renderAllFigures() {
  if (typeof renderFrontTcoPlot === "function") {
    renderFrontTcoPlot(tableData);
  }

  if (typeof renderIndiumPlot === "function") {
    renderIndiumPlot(tableData);
  }
}

document.addEventListener("change", (event) => {
  if (event.target && event.target.id === "certified-only") {
    renderAllFigures();
  }
});

loadData();
