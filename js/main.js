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

  const previewRows = rows.slice(0, 10);

  const htmlRows = previewRows.map((row) => {
    return `
      <tr>
        <td>${row["Author"] || ""}</td>
        <td>${row["Year"] || ""}</td>
        <td>${row["n tandem"] || ""}</td>
        <td>${row["Front TCO"] || ""}</td>
      </tr>
    `;
  }).join("");

  databaseSection.innerHTML = `
    <h2>Database</h2>
    <p><strong>Loaded ${rows.length} rows from tandem.csv.</strong></p>
    <table class="data-table">
      <thead>
        <tr>
          <th>Author</th>
          <th>Year</th>
          <th>Efficiency</th>
          <th>Front TCO</th>
        </tr>
      </thead>
      <tbody>
        ${htmlRows}
      </tbody>
    </table>
  `;
}

async function loadData() {
  tableData = await loadCSV("data/tandem.csv");
  window.__tableData = tableData;
  renderDatabase(tableData);
  renderFrontTcoPlot(tableData);
}

loadData().catch((error) => {
  console.error("Failed to load data:", error);
});
