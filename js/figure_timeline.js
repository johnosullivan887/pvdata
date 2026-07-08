function renderTimelinePlot(rows) {
  const plotDiv = document.getElementById("timeline-plot");
  if (!plotDiv) return;

  plotDiv.style.width = "100%";
  plotDiv.style.height = "420px";

  const certifiedOnly = document.getElementById("certified-only")?.checked ?? true;

  const points = rows
    .map((row) => ({
      year: Number(getDatabaseYear(row)),
      front: getDatabaseFrontTCO(row),
      certified: getDatabaseCertified(row)
    }))
    .filter((row) => Number.isFinite(row.year) && row.front);

  const visible = certifiedOnly
    ? points.filter((row) => row.certified === "yes")
    : points;

  if (!visible.length) return;

  const years = [...new Set(visible.map((row) => row.year))].sort((a, b) => a - b);
  const fronts = [...new Set(visible.map((row) => row.front))].sort((a, b) => a.localeCompare(b));

  const palette = [
    "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd",
    "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf", "#4c78a8"
  ];

  const traces = fronts.map((front, i) => {
    const counts = years.map((year) =>
      visible.filter((row) => row.year === year && row.front === front).length
    );

    return {
      type: "bar",
      name: front,
      x: years,
      y: counts,
      marker: { color: palette[i % palette.length] },
      hovertemplate:
        "Year: %{x}<br>" +
        "Count: %{y}<br>" +
        "Front TCE: " + front +
        "<extra></extra>"
    };
  });

  const layout = {
    autosize: true,
    height: 420,
    margin: { l: 60, r: 20, t: 20, b: 55 },
    paper_bgcolor: "#ffffff",
    plot_bgcolor: "#ffffff",
    barmode: "stack",
    font: { family: "Arial, sans-serif", size: 13, color: "#111111" },
    xaxis: {
      title: "Publication year",
      dtick: 1,
      showline: true,
      linecolor: "#222222",
      zeroline: false,
      showgrid: true,
      gridcolor: "#e5e5e5"
    },
    yaxis: {
      title: "Paper count",
      showline: true,
      linecolor: "#222222",
      zeroline: false,
      showgrid: true,
      gridcolor: "#e5e5e5"
    },
    legend: {
      orientation: "h",
      x: 0,
      y: 1.15
    },
  };

  Plotly.react(plotDiv, traces, layout, {
    responsive: true,
    displayModeBar: true
  });
}
