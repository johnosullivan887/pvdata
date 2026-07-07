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
    const raw = normalizeText(row["Cell"] ?? row["Si Bottom cell type"] ?? "").toLowerCase();

    if (raw.includes("shj") || raw.includes("heterojunction") || raw.includes("hjt")) {
      return "SHJ";
    }

    if (raw.includes("topcon") || raw.includes("polo")) {
      return "TOPCon/POLO";
    }

    if (
      raw.includes("perc") ||
      raw.includes("pert") ||
      raw.includes("homojunction") ||
      raw.includes("homo-junction") ||
      raw.includes("al-bsf") ||
      raw.includes("bsf")
    ) {
      return "Al-BSF/PERC";
    }

    return "Other";
  };

  const twYrFromMgW = (mgW) => {
    const x1 = 0.064;
    const y1 = 3.0;
    const x2 = 1.159;
    const y2 = 0.17;

    const b = Math.log(y2 / y1) / Math.log(x2 / x1);
    const a = y1 / Math.pow(x1, b);

    return a * Math.pow(mgW, b);
  };

  const plotRows = rows
    .map((row) => {
      const computed = PVDataIndium.computeRow(row);
      if (!computed || computed.totalMgW === null || !Number.isFinite(computed.efficiency)) {
        return null;
      }

      return {
        ...computed,
        cellType: classifyCellType(row),
        twYr: twYrFromMgW(computed.totalMgW)
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

  const colorscale = [
    [0.00, "#435887"],
    [0.10, "#4A6B86"],
    [0.20, "#527F8A"],
    [0.35, "#5F9583"],
    [0.50, "#78A47B"],
    [0.65, "#9CAF82"],
    [0.80, "#C7B89B"],
    [0.90, "#D8C4C4"],
    [1.00, "#E4CCE2"]
  ];

  const colorMin = -2;
  const colorMax = 1.2;

  const tickValues = [-2, -1, 0, 1];
  const tickText = ["10⁻²", "10⁻¹", "10⁰", "10¹"];

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
          Number.isFinite(row.activeArea) ? row.activeArea.toFixed(3) : "n/a",
          Number.isFinite(row.twYr) ? row.twYr : null
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
          "TW/yr: %{customdata[5]:.2f}<br>" +
          "Author: %{customdata[0]}<br>" +
          "Year: %{customdata[1]}<br>" +
          "Cell type: %{customdata[3]}<br>" +
          "Active area: %{customdata[4]} cm²<extra></extra>"
      };
    });

  const layout = {
    autosize: true,
    height: 540,
    margin: { l: 72, r: 35, t: 92, b: 62 },
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
      range: [15, 35.75],
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
      cmin: colorMin,
      cmax: colorMax,
      colorbar: {
        title: {
          text: "Cell active area (cm²)",
          side: "right"
        },
        tickmode: "array",
        tickvals: tickValues,
        ticktext: tickText,
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
    },
    shapes: [
      {
        type: "line",
        x0: 0.064,
        x1: 0.064,
        y0: 15,
        y1: 35.75,
        line: { color: "#555555", width: 1, dash: "dash" }
      },
      {
        type: "line",
        x0: 1.159,
        x1: 1.159,
        y0: 15,
        y1: 35.75,
        line: { color: "#555555", width: 1, dash: "dash" }
      }
    ],
    annotations: [
      {
        x: 0.064,
        y: 35.45,
        yref: "y",
        text: "0.064 mg W⁻¹ (3 TW yr⁻¹)",
        showarrow: true,
        arrowhead: 0,
        ax: 52,
        ay: -42,
        arrowcolor: "#222222",
        arrowsize: 1,
        arrowwidth: 1,
        font: { size: 14, color: "#111111" },
        align: "left",
        xanchor: "left",
        yanchor: "bottom",
        bgcolor: "rgba(255,255,255,0.95)",
        bordercolor: "rgba(0,0,0,0)",
        borderpad: 2
      },
      {
        x: 1.159,
        y: 35.45,
        yref: "y",
        text: "1.159 mg W⁻¹ (0.17 TW yr⁻¹)",
        showarrow: true,
        arrowhead: 0,
        ax: 48,
        ay: -42,
        arrowcolor: "#222222",
        arrowsize: 1,
        arrowwidth: 1,
        font: { size: 14, color: "#111111" },
        align: "left",
        xanchor: "left",
        yanchor: "bottom",
        bgcolor: "rgba(255,255,255,0.95)",
        bordercolor: "rgba(0,0,0,0)",
        borderpad: 2
      }
    ]
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
