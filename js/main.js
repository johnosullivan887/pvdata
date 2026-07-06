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

  // Fallback for ISO dates
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function parseNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function renderDatabase(rows) {
  const databaseSection = document.querySelector("#database .panel");
  if (!databaseSection) return;

  const rowsHtml = rows.map((row) => {
    const ref = row["Reference"] || row["Reference link"] || row["DOI"] || "";
    const refHtml = ref
      ? /^https?:\/\//i.test(ref)
        ? `<a href="${ref}" target="_blank" rel="noopener noreferrer">Open</a>`
        : ref
      : "";

    return `
      <tr>
        <td>${row["Author"] || ""}</td>
        <td>${row["Publishing date"] || row["Date"] || row["Year"] || ""}</td>
        <td>${row["Si Bottom cell type"] || row["Cell"] || ""}</td>
        <td>${row["Interlayer TCE"] || row["Inter-layer"] || ""}</td>
        <td>${row["IL thickness (nm)"] || row["Inter-layer thickness"] || ""}</td>
        <td>${row["Rear Electrode"] || row["Rear electrode"] || ""}</td>
        <td>${row["Rear TCE thickness (nm)"] || row["Rear TCO thickness"] || ""}</td>
        <td>${row["Active Area (cm2)"] || row["Cell active area"] || ""}</td>
        <td>${row["Front TCE (fTCE)"] || row["Front TCO"] || ""}</td>
        <td>${row["fTCE thickness (nm)"] || row["Front TCO thickness"] || ""}</td>
        <td>${row["η (%)"] || row["n tandem"] || ""}</td>
        <td>${row["Certified (yes/no)"] || row["Certified"] || row["certified"] || ""}</td>
        <td>${refHtml}</td>
      </tr>
    `;
  }).join("");

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
  tableData = await loadCSV("data/tandem.csv");
  window.__tableData = tableData;
  renderDatabase(tableData);
  renderFrontTcoPlot(tableData);
  renderIndiumPlot(tableData);
}

loadData().catch((error) => {
  console.error("Failed to load data:", error);
});
