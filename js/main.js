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

function renderDatabase(rows) {
  const databaseSection = document.querySelector("#database .panel");
  if (!databaseSection) return;

  const rowsHtml = rows
    .map((row) => {
      return `
        <tr>
          <td>${escapeHtml(getValue(row, "Author"))}</td>
          <td>${escapeHtml(getValue(row, "Publishing date", "Date", "Year"))}</td>
          <td>${escapeHtml(getValue(row, "Si Bottom cell type", "Cell"))}</td>
          <td>${escapeHtml(getValue(row, "Interlayer TCE", "Inter-layer", "Inter-layer thicknes", "Inter-layer thickness", "IL thickness (nm)"))}</td>
          <td>${escapeHtml(getValue(row, "Inter-layer thicknes", "Inter-layer thickness", "IL thickness (nm)"))}</td>
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

  databaseSection.innerHTML = `
    <h2>Database</h2>
    <p><strong>Loaded ${rows.length} rows from tandem.csv.</strong></p>
    <div class="table-wrap">
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
            <th>Active Area (cm2)</th>
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
    </div>
  `;
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
