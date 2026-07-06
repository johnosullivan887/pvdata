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

  const traces = categories.map((cat) => {
    const group = certifiedRows.filter((row) => row.frontTCO === cat);

    const style = {
      marker: CONFIG.frontTCOMarkers[cat] || CONFIG.frontTCOMarkers.Other,
      color: CONFIG.frontTCOColours[cat] || CONFIG.frontTCOColours.Other
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
