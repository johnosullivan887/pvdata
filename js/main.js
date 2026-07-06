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
  const d = new Date(value);
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

function renderFrontTcoPlot(rows) {
  const plotDiv = document.getElementById("front-tco-plot");
  if (!plotDiv) return;

  const cleanRows = rows
    .map((row) => ({
      date: parseDate(row["Publishing date"]),
      efficiency: parseNumber(row["n tandem"]),
      frontTCO: (row["Front TCO"] || "").trim(),
      certified: (row["certified"] || "").trim().toLowerCase()
    }))
    .filter((row) => row.date && row.efficiency !== null && row.frontTCO);

  const certifiedRows = cleanRows.filter((row) => row.certified === "yes");

  const categories = [...new Set(certifiedRows.map((row) => row.frontTCO))];

  const colorMap = {
    ITO: { marker: "circle", color: "#f8a17b", line: "#d29343" },
    IZO: { marker: "diamond", color: "#84a8ac", line: "#0a285c" },
    "Doped-InOx": { marker: "square", color: "#9db5aa", line: "#3c6d56" },
    "In-free": { marker: "triangle-up", color: "#d29343", line: "#d29343" }
  };

  const traces = categories.map((cat) => {
    const group = certifiedRows.filter((row) => row.frontTCO === cat);
    const style = colorMap[cat] || {
      marker: "triangle-down",
      color: "#b26eb5",
      line: "#011959"
    };

    return {
      type: "scatter",
      mode: "markers",
      name: cat,
      x: group.map((row) => row.date),
      y: group.map((row) => row.efficiency),
      marker: {
        symbol: style.marker,
        size: 11,
        color: style.color,
        line: { color: style.line, width: 1 }
      },
      hovertemplate:
        "<b>%{x|%Y-%m-%d}</b><br>" +
        "Efficiency: %{y:.2f}%<br>" +
        "Front TCO: " + cat +
        "<extra></extra>"
    };
  });

  const layout = {
    margin: { l: 65, r: 20, t: 20, b: 60 },
    paper_bgcolor: "#ffffff",
    plot_bgcolor: "#ffffff",
    xaxis: {
      title: "Publication date",
      tickformat: "%Y",
      dtick: "M12",
      showline: true,
      linecolor: "#10233f"
    },
    yaxis: {
      title: "Power conversion efficiency (%)",
      range: [15, 36],
      dtick: 5,
      showline: true,
      linecolor: "#10233f"
    },
    legend: {
      orientation: "v",
      x: 0.02,
      y: 0.98
    }
  };

  Plotly.newPlot(plotDiv, traces, layout, { responsive: true });
}

let tableData = [];

async function loadData() {
  tableData = await loadCSV("data/tandem.csv");
  renderDatabase(tableData);
  renderFrontTcoPlot(tableData);
}

loadData().catch((error) => {
  console.error("Failed to load data:", error);
});
