function renderFrontTcoPlot(rows) {
  const plotDiv = document.getElementById("front-tco-plot");
  if (!plotDiv) return;

  const cleanRows = rows
    .map((row) => ({
      date: parseDate(row["Publishing date"]),
      efficiency: parseNumber(row["n tandem"]),
      frontTCO: (row["Front TCO"] || "").trim(),
      certified: (row["Certified"] || "").trim().toLowerCase()
    }))
    .filter((row) => row.date && row.efficiency !== null && row.frontTCO);

  const certifiedOnly =
    document.getElementById("certified-only")?.checked ?? true;

  const plotRows = certifiedOnly
    ? cleanRows.filter((row) => row.certified === "yes")
    : cleanRows;

  console.log("Total rows:", rows.length);
  console.log("Valid rows:", cleanRows.length);
  console.log("Plotted rows:", plotRows.length);

  const categories = [...new Set(plotRows.map((row) => row.frontTCO))].sort();

  const markerSymbols = [
    "circle",
    "diamond",
    "square",
    "triangle-up",
    "triangle-down",
    "cross",
    "x",
    "star",
    "hexagon",
    "hourglass",
    "bowtie",
    "triangle-left",
    "triangle-right",
    "pentagon"
  ];

  const markerColors = [
    "#011959",
    "#0A285C",
    "#103F60",
    "#1C5A62",
    "#3C6D56",
    "#687B3E",
    "#9D892B",
    "#D29343",
    "#F8A17B",
    "#FDB7BC",
    "#FACCFA",
    "#6A4C93",
    "#2A9D8F",
    "#E76F51"
  ];

  const styleMap = {};
  categories.forEach((cat, i) => {
    styleMap[cat] = {
      marker: markerSymbols[i % markerSymbols.length],
      color: markerColors[i % markerColors.length]
    };
  });

  const traces = categories.map((cat) => {
    const group = plotRows.filter((row) => row.frontTCO === cat);
    const style = styleMap[cat];

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
        line: { color: "#011959", width: 1 }
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
      linecolor: "#10233f",
      range: [CONFIG.xMin, CONFIG.xMax]
    },
    yaxis: {
      title: "Power conversion efficiency (%)",
      range: [CONFIG.efficiency.min, CONFIG.efficiency.max],
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

document.addEventListener("change", (event) => {
  if (event.target && event.target.id === "certified-only" && window.__tableData) {
    renderFrontTcoPlot(window.__tableData);
  }
});
