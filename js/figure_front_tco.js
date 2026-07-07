function renderFrontTcoPlot(rows) {
  const plotDiv = document.getElementById("front-tco-plot");
  if (!plotDiv) return;

  // Keep the plot in a wide landscape layout
  plotDiv.style.width = "100%";
  plotDiv.style.height = "520px";

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

  plotRows.sort((a, b) => a.date - b.date);

  const categories = [...new Set(plotRows.map((row) => row.frontTCO))].sort(
    (a, b) => a.localeCompare(b)
  );

  const markerSymbols = [
    "circle",
    "diamond",
    "square",
    "triangle-up",
    "triangle-down",
    "cross",
    "x",
    "pentagon",
    "hexagon",
    "star",
    "hourglass",
    "bowtie",
    "triangle-left",
    "triangle-right"
  ];

  const markerColors = [
    "#1f77b4",
    "#ff7f0e",
    "#2ca02c",
    "#d62728",
    "#9467bd",
    "#8c564b",
    "#e377c2",
    "#7f7f7f",
    "#bcbd22",
    "#17becf",
    "#4c78a8",
    "#f58518",
    "#54a24b",
    "#e45756",
    "#72b7b2",
    "#b279a2",
    "#ff9da6",
    "#9d755d",
    "#bab0ab",
    "#5f9ed1",
    "#8dd3c7",
    "#fb8072",
    "#80b1d3",
    "#fdb462"
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
      customdata: group.map((row) => [
        getValue(row, "Author"),
        getDatabaseYear(row),
        getPaperUrl(row)
      ]),
      marker: {
        symbol: style.marker,
        size: 10,
        color: style.color,
        opacity: 0.72,
        line: { color: "#1a1a1a", width: 0.8 }
      },
      hovertemplate:
        "<b>%{x|%Y-%m-%d}</b><br>" +
        "Efficiency: %{y:.2f}%<br>" +
        "Author: %{customdata[0]}<br>" +
        "Year: %{customdata[1]}<br>" +
        "Front TCO: " + cat +
        "<extra></extra>"
    };
  });

  const layout = {
    autosize: true,
    height: 520,
    margin: { l: 65, r: 20, t: 18, b: 55 },
    paper_bgcolor: "#ffffff",
    plot_bgcolor: "#ffffff",
    font: {
      family: "Arial, sans-serif",
      size: 13,
      color: "#111111"
    },
    xaxis: {
      title: "Publication date",
      tickformat: "%Y",
      dtick: "M12",
      showline: true,
      linecolor: "#666666",
      zeroline: false,
      showgrid: true,
      gridcolor: "#e6e6e6",
      gridwidth: 0.6,
      range: [CONFIG.xMin, CONFIG.xMax]
    },
    yaxis: {
      title: "Power conversion efficiency (%)",
      range: [CONFIG.efficiency.min, CONFIG.efficiency.max],
      dtick: 5,
      showline: true,
      linecolor: "#666666",
      zeroline: false,
      showgrid: true,
      gridcolor: "#e6e6e6",
      gridwidth: 0.6
    },
    legend: {
      orientation: "v",
      x: 0.02,
      y: 0.98,
      bgcolor: "rgba(255,255,255,0.92)",
      bordercolor: "#d0d0d0",
      borderwidth: 1,
      font: { size: 12 }
    }
  };

  Plotly.react(plotDiv, traces, layout, {
    responsive: true,
    displayModeBar: true
  });

  plotDiv.style.cursor = "pointer";
  bindPaperOpenBehavior(plotDiv);
}


