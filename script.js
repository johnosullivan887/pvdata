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

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",");

  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row = {};
    headers.forEach((header, i) => {
      row[header.trim()] = (values[i] || "").trim();
    });
    return row;
  });
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
  const response = await fetch("data/tandem.csv");
  const text = await response.text();
  tableData = parseCSV(text);
  renderDatabase(tableData);
}

loadData().catch((error) => {
  console.error("Failed to load data:", error);
});
