function renderIndiumPlot(rows) {
  const plotDiv = document.getElementById("indium-plot");
  if (!plotDiv) return;

  plotDiv.style.width = "100%";
  plotDiv.style.height = "540px";

  if (!window.PVDataIndium) {
    plotDiv.innerHTML = "<p>Indium helpers are missing.</p>";
    return;
  }

  const certifiedOnly = document.getElementById("certified-only")?.checked ?? false;

  const normalizeText = (value) =>
    String(value ?? "")
      .trim()
      .replace(/\s+/g, " ");

  const classifyCellType = (row) => {
    const raw = normalizeText(
      row["Cell"] ?? row["Si Bottom cell type"] ?? ""
    ).toLowerCase();

    if (
      raw.includes("shj") ||
      raw.includes("heterojunction") ||
      raw.includes("hjt")
    ) {
      return "SHJ";
    }

    if (
      raw.includes("topcon") ||
      raw.includes("polo")
    ) {
      return "TOPCon/POLO";
    }

    if (
      raw.includes("perc") ||
      raw.includes("pert") ||
      raw.includes("al-bsf") ||
      raw.includes("bsf")
    ) {
      return "Al-BSF/PERC";
    }

    return "Other";
  };

  const plotRows = rows
    .map((row) => {
      const computed = PVDataIndium.computeRow(row);
      if (!computed || computed.totalMgW === null || !Number.isFinite(computed.efficiency)) {
        return null;
      }

      return {
        ...computed,
        cellType: classifyCellType(row)
      };
    })
    .filter(Boolean);

  const visibleRows = certifiedOnly
    ? plotRows.filter((row) => row.certified === "yes")
    : plotRows;

  const cellOrder = ["SHJ", "TOPCon/POLO", "Al-BSF/PERC", "Other"];

  const cellSymbols = {
    SHJ: "diamond",
    "TOPCon/POLO": "circle",
    "Al-BSF/PERC": "triangle-up",
    Other: "star"
  };

  const cellColors = {
    SHJ: "#1f77b4",
    "TOPCon/POLO": "#ff7f0e",
    "Al-BSF/PERC": "#2ca02c",
    Other: "#7f7f7f"
  };

  const activeAreas = visibleRows
    .map((row) => row.activeArea)
    .filter((v) => Number.isFinite(v) && v > 0);

  const logAreas = activeAreas.length
    ? activeAreas.map((v) => Math.log10(v))
    : [-2, 1.2];

  const minLog = Math.min(...logAreas);
  const maxLog = Math.max(...logAreas);

  const tickCandidates = [0.01, 0.03, 0.1, 0.3, 1, 3, 10, 16];
  const usableTicks = tickCandidates.filter(
    (v) => v >= Math.pow(10, minLog) && v <= Math.pow(10, maxLog)
  );

  const exponentLabel = (value) => {
    const exp = Math.round(Math.log10(value));
    return `10<sup>${exp}</sup>`;
  };

  const colorscale = [
    [0.0, "#011959"],
    [0.15, "#0A285C"],
    [0.3, "#103F60"],
    [0.45, "#1C5A62"],
    [0.6, "#3C6D56"],
    [0.75, "#687B3E"],
    [0.88, "#D29343"],
    [1.0, "#F8A17B"]
  ];

  const legendTraces = cellOrder
    .filter((cell) => visibleRows.some((row) => row.cellType === cell))
    .map((cell) => ({
      type: "scatter",
      mode: "markers",
      name: cell,
      x: [null],
      y: [null],
      showlegend: true,
      hoverinfo: "skip",
      marker: {
        symbol: cellSymbols[cell],
        size: 12,
        color: "white",
        line: {
          color: cellColors[cell],
          width: 2
        }
      }
    }));

  const dataTraces = cellOrder
    .filter((cell) => visibleRows.some((row) => row.cellType === cell))
    .map((cell) => {
      const group = visibleRows.filter((row) => row.cellType === cell);

      return {
        type: "scatter",
        mode: "markers",
        name: cell,
        showlegend: false,
        x: group.map((row) => row.totalMgW),
        y: group.map((row) => row.efficiency),
        customdata: group.map((row) => [
          row.author,
          row.year,
          row.paperUrl,
          row.cellType,
          Number.isFinite(row.activeArea) ? row.activeArea.toFixed(3) : "n/a"
        ]),
        marker: {
          symbol: cellSymbols[cell],
          size: 12,
          opacity: 0.82,
          color: group.map((row) => Math.log10(Math.max(row.activeArea || 0.01, 0.01))),
          coloraxis: "coloraxis",
          line: { color: "#1a1a1a", width: 0.8 }
        },
        hovertemplate:
          "<b>%{x:.3f} mg W⁻¹</b><br>" +
          "Efficiency: %{y:.2f}%<br>" +
          "Author: %{customdata[0]}<br>" +
          "Year: %{customdata[1]}<br>" +
          "Cell type: %{customdata[3]}<br>" +
          "Active area: %{customdata[4]} cm²<extra></extra>"
      };
    });

  const layout = {
    autosize: true,
    height: 540,
    margin: { l: 72, r: 28, t: 22, b: 62 },
    paper_bgcolor: "#ffffff",
    plot_bgcolor: "#ffffff",
    font: {
      family: "Arial, sans-serif",
      size: 13,
      color: "#111111"
    },
    xaxis: {
      title: "Indium content (mg W⁻¹)",
      range: [CONFIG?.indium?.min ?? 0, CONFIG?.indium?.max ?? 11],
      showline: true,
      linecolor: "#222222",
      zeroline: false,
      showgrid: true,
      gridcolor: "#e5e5e5",
      gridwidth: 0.7
    },
    yaxis: {
      title: "Power conversion efficiency (%)",
      range: [15, 35],
      dtick: 5,
      showline: true,
      linecolor: "#222222",
      zeroline: false,
      showgrid: true,
      gridcolor: "#e5e5e5",
      gridwidth: 0.7
    },
    coloraxis: {
      colorscale: colorscale,
      cmin: minLog,
      cmax: maxLog,
      colorbar: {
        title: {
          text: "Cell active area (cm²)",
          side: "right"
        },
        tickmode: "array",
        tickvals: usableTicks.map((v) => Math.log10(v)),
        ticktext: usableTicks.map((v) => exponentLabel(v)),
        thickness: 18,
        outlinewidth: 0.8,
        outlinecolor: "#222222"
      }
    },
    legend: {
      orientation: "v",
      x: 0.98,
      y: 0.98,
      xanchor: "right",
      yanchor: "top",
      bgcolor: "rgba(255,255,255,1)",
      bordercolor: "#222222",
      borderwidth: 1,
      font: { size: 12 }
    }
  };

  Plotly.react(plotDiv, [...legendTraces, ...dataTraces], layout, {
    responsive: true,
    displayModeBar: true
  });

  plotDiv.style.cursor = "pointer";

  if (!plotDiv.dataset.paperClickBound) {
    plotDiv.dataset.paperClickBound = "true";

    plotDiv.on("plotly_click", (eventData) => {
      const point = eventData?.points?.[0];
      const url = point?.customdata?.[2];

      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    });
  }
}
