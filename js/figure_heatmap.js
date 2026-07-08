function renderCombinationHeatmap(rows) {
  const plotDiv = document.getElementById("heatmap-plot");
  if (!plotDiv) return;

  plotDiv.style.width = "100%";
  plotDiv.style.height = "520px";

  const certifiedOnly = document.getElementById("certified-only")?.checked ?? true;

  const points = rows
    .map((row) => ({
      front: getDatabaseFrontTCO(row),
      rear: getDatabaseRearTCE(row),
      certified: getDatabaseCertified(row)
    }))
    .filter((row) => row.front && row.rear);

  const visible = certifiedOnly
    ? points.filter((row) => row.certified === "yes")
    : points;

  if (!visible.length) return;

  const fronts = [...new Set(visible.map((row) => row.front))].sort((a, b) => a.localeCompare(b));
  const rears = [...new Set(visible.map((row) => row.rear))].sort((a, b) => a.localeCompare(b));

  const z = fronts.map((front) =>
    rears.map((rear) =>
      visible.filter((row) => row.front === front && row.rear === rear).length
    )
  );

  const hover = fronts.map((front) =>
    rears.map((rear) => {
      const count = visible.filter((row) => row.front === front && row.rear === rear).length;
      return `Front: ${front}<br>Rear: ${rear}<br>Count: ${count}`;
    })
  );

  const trace = {
    type: "heatmap",
    x: rears,
    y: fronts,
    z,
    text: hover,
    hovertemplate: "%{text}<extra></extra>",
    colorscale: [
      [0.0, "#f7fbff"],
      [0.2, "#deebf7"],
      [0.4, "#c6dbef"],
      [0.6, "#9ecae1"],
      [0.8, "#6baed6"],
      [1.0, "#2171b5"]
    ],
    zsmooth: false,
    colorbar: {
      title: "Count"
    }
  };

  const layout = {
    autosize: true,
    height: 520,
    margin: { l: 120, r: 20, t: 20, b: 90 },
    paper_bgcolor: "#ffffff",
    plot_bgcolor: "#ffffff",
    font: { family: "Arial, sans-serif", size: 13, color: "#111111" },
    xaxis: {
      title: "Rear TCE",
      tickangle: -30,
      showline: true,
      linecolor: "#222222"
    },
    yaxis: {
      title: "Front TCE",
      showline: true,
      linecolor: "#222222"
    },
  };

  Plotly.react(plotDiv, [trace], layout, {
    responsive: true,
    displayModeBar: true
  });
}
