function renderIndiumPlot(rows) {
  const plotDiv = document.getElementById("indium-plot");
  if (!plotDiv) return;

  // Force a wide landscape panel
  plotDiv.style.width = "100%";
  plotDiv.style.height = "540px";

  const DEP_EFF = 0.8;

  const normalize = (value) =>
    String(value ?? "")
      .trim()
      .replace(/\s+/g, " ");

  const resolveField = (row, keys) => {
    for (const key of keys) {
      const value = row[key];
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        return value;
      }
    }
    return null;
  };

  const toNumber = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const n = Number(String(value).replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : null;
  };

  const calcMgPerW = (thicknessNm, efficiencyPct, indiumFraction, density) => {
    if (
      thicknessNm === null ||
      efficiencyPct === null ||
      !Number.isFinite(indiumFraction) ||
      !Number.isFinite(density) ||
      efficiencyPct <= 0
    ) {
      return null;
    }

    const gramsPerW =
      ((thicknessNm * 1e-7) / DEP_EFF) *
      density *
      indiumFraction *
      1000 /
      ((efficiencyPct / 100) * 0.1);

    return Number.isFinite(gramsPerW) ? gramsPerW : null;
  };

  const FRONT_LOOKUP = {
    "ITO": [0.74, 7.14],
    "IZO": [0.827 * 0.9, 7.14],
    "IO:H/ITO": [0.827 * 0.9 + 0.74 * 0.1, 7.14],
    "IWO": [0.827 * 0.99, 7.14],
    "IZrO": [0.827 * 0.98, 7.14],
    "AgNWs": [0.0, 0.0],
    "AZO": [0.0, 0.0],
    "MoOx/Au/MoOx": [0.0, 0.0],
    "Other": [0.0, 0.0]
  };

  const REAR_LOOKUP = {
    "InOx:H/Ag": [0.827, 7.14],
    "IZO/Ag": [0.827 * 0.9, 7.14],
    "IZO/MgF2/Ag": [0.827 * 0.9, 7.14],
    "Doped-InOx:H/Ag/SiOx/Ag": [0.74, 7.14],
    "ITO/Ag": [0.74, 7.14],
    "ITO/Ag/Al": [0.74, 7.14],
    "ITO/Al/Ag": [0.74, 7.14],
    "ITO/Au": [0.74, 7.14],
    "ITO/SiO2/Ag": [0.74, 7.14],
    "ITO/Silica/Ag": [0.74, 7.14],
    "ITO/SiO2-NP/Ag": [0.74, 7.14],
    "ITO/MgF2/Ni/Al": [0.74, 7.14],
    "ITO/MgFx/Ag": [0.74, 7.14],
    "ITO/meso-Al2O3/Ag": [0.74, 7.14],
    "InOx/Ag": [0.827, 7.14],
    "Doped InOx/Ag/SiO2/Ag": [0.74, 7.14],
    "Doped InOx/Ag": [0.74, 7.14],
    "IZrO/Ag": [0.827 * 0.98, 7.14],
    "IZrO/SiOx/Ag": [0.827 * 0.98, 7.14],
    "IWO/Ag": [0.827 * 0.99, 7.14],
    "Ag": [0.0, 0.0],
    "Al": [0.0, 0.0],
    "Ag/Al": [0.0, 0.0],
    "Al/Ag": [0.0, 0.0],
    "Al/Ti/Ag": [0.0, 0.0],
    "Ti/Pd/Ag/Pt": [0.0, 0.0],
    "Ti/Pd/Ag": [0.0, 0.0],
    "Cr/Ag": [0.0, 0.0],
    "Cr/Pd/Ag/Ag/Al": [0.0, 0.0],
    "TCO/Ag": [0.0, 0.0],
    "Other": [0.0, 0.0]
  };

  const INTER_LOOKUP = {
    "IWO": [0.827 * 0.99, 7.14],
    "ITO": [0.74, 7.14],
    "IZO": [0.827 * 0.9, 7.14],
    "InOx": [0.827, 7.14],
    "Doped InOx": [0.74, 7.14],
    "Doped-InOx:H": [0.74, 7.14],
    "InOx:H": [0.827, 7.14],
    "ZTO": [0.0, 0.0],
    "None": [0.0, 0.0],
    "No layer": [0.0, 0.0],
    "Other": [0.0, 0.0]
  };

  const classifyCellType = (row) => {
    const raw = normalize(resolveField(row, ["Cell", "Si Bottom cell type"])).toLowerCase();

    if (raw.includes("shj") || raw.includes("heterojunction")) return "SHJ";
    if (raw.includes("topcon") || raw.includes("polo")) return "TOPCon/POLO";
    if (raw.includes("perc") || raw.includes("al-bsf") || raw.includes("bsf")) return "Al-BSF/PERC";
    return "Other";
  };

  const getActiveArea = (row) => {
    return toNumber(
      resolveField(row, [
        "Cell active area",
        "Active Area (cm2)",
        "Active area",
        "Area"
      ])
    );
  };

  const getEfficiency = (row) => {
    return toNumber(resolveField(row, ["n tandem", "η (%)", "Efficiency"]));
  };

  const getFrontMgW = (row, efficiencyPct) => {
    const tco = normalize(resolveField(row, ["Front TCO", "Front TCE (fTCE)"]));
    const thickness = toNumber(
      resolveField(row, [
        "Total front TCO thickness",
        "Front TCO thickness",
        "fTCE thickness (nm)",
        "Front TCO thickness (nm)"
      ])
    );

    const lookup = FRONT_LOOKUP[tco] || FRONT_LOOKUP.Other;
    return calcMgPerW(thickness, efficiencyPct, lookup[0], lookup[1]);
  };

  const getRearMgW = (row, efficiencyPct) => {
    const tco = normalize(resolveField(row, ["Rear electrode", "Rear Electrode"]));
    const thickness = toNumber(
      resolveField(row, [
        "Rear TCO thickness",
        "Rear TCE thickness (nm)",
        "Rear TCO thickness (nm)"
      ])
    );

    const lookup = REAR_LOOKUP[tco] || REAR_LOOKUP.Other;
    return calcMgPerW(thickness, efficiencyPct, lookup[0], lookup[1]);
  };

  const getInterMgW = (row, efficiencyPct) => {
    const tco = normalize(resolveField(row, ["Inter-layer", "Interlayer TCE"]));
    const thickness = toNumber(
      resolveField(row, [
        "Inter-layer thickness",
        "IL thickness (nm)",
        "Interlayer thickness"
      ])
    );

    const lookup = INTER_LOOKUP[tco] || INTER_LOOKUP.Other;
    return calcMgPerW(thickness, efficiencyPct, lookup[0], lookup[1]);
  };

  const certifiedOnly =
    document.getElementById("certified-only")?.checked ?? true;

  const plotRows = rows
    .filter((row) => Number.isFinite(getEfficiency(row)))
    .map((row) => {
      const efficiency = getEfficiency(row);
      const activeArea = getActiveArea(row);

      const front = getFrontMgW(row, efficiency);
      const rear = getRearMgW(row, efficiency);
      const inter = getInterMgW(row, efficiency);

      const parts = [front, rear, inter].filter((v) => Number.isFinite(v));
      const totalMgW = parts.length ? parts.reduce((a, b) => a + b, 0) : null;

      return {
        date: parseDate(resolveField(row, ["Publishing date", "Date"])),
        efficiency,
        activeArea,
        cellType: classifyCellType(row),
        totalMgW,
        certified: normalize(resolveField(row, ["Certified", "certified"])).toLowerCase()
      };
    })
    .filter((row) => row.totalMgW !== null && Number.isFinite(row.efficiency));

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

  const activeAreas = visibleRows
    .map((row) => row.activeArea)
    .filter((v) => Number.isFinite(v) && v > 0);

  const logAreas = activeAreas.map((v) => Math.log10(v));
  const minLog = logAreas.length ? Math.min(...logAreas) : -2;
  const maxLog = logAreas.length ? Math.max(...logAreas) : 1.2;

  const tickCandidates = [0.01, 0.03, 0.1, 0.3, 1, 3, 10, 16];
  const colorTickVals = tickCandidates
    .filter((v) => v >= Math.pow(10, minLog) && v <= Math.pow(10, maxLog))
    .map((v) => Math.log10(v));

  const colorTickText = tickCandidates
    .filter((v) => v >= Math.pow(10, minLog) && v <= Math.pow(10, maxLog))
    .map((v) => String(v));

  const colorscale = [
    [0.0, "#011959"],
    [0.15, "#0A285C"],
    [0.30, "#103F60"],
    [0.45, "#1C5A62"],
    [0.60, "#3C6D56"],
    [0.75, "#687B3E"],
    [0.88, "#D29343"],
    [1.0, "#F8A17B"]
  ];

  const traces = cellOrder
    .filter((cell) => visibleRows.some((row) => row.cellType === cell))
    .map((cell) => {
      const group = visibleRows.filter((row) => row.cellType === cell);

      return {
        type: "scatter",
        mode: "markers",
        name: cell,
        x: group.map((row) => row.totalMgW),
        y: group.map((row) => row.efficiency),
        text: group.map((row) => {
          const area = Number.isFinite(row.activeArea)
            ? row.activeArea.toFixed(3)
            : "n/a";
          return `Cell type: ${row.cellType}<br>Active area: ${area} cm²<br>Indium: ${row.totalMgW.toFixed(3)} mg/W`;
        }),
        hovertemplate:
          "<b>%{x:.3f} mg/W</b><br>" +
          "Efficiency: %{y:.2f}%<br>" +
          "%{text}<extra></extra>",
        marker: {
          symbol: cellSymbols[cell],
          size: 12,
          opacity: 0.82,
          color: group.map((row) => Math.log10(Math.max(row.activeArea, 0.01))),
          coloraxis: "coloraxis",
          line: { color: "#1a1a1a", width: 0.8 }
        }
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
      range: [0, 11],
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
        title: "Cell active area (cm²)",
        tickmode: "array",
        tickvals: colorTickVals,
        ticktext: colorTickText,
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
      bgcolor: "rgba(255,255,255,0.92)",
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
        y1: 35,
        line: { color: "#555555", width: 1, dash: "dash" }
      },
      {
        type: "line",
        x0: 1.159,
        x1: 1.159,
        y0: 15,
        y1: 35,
        line: { color: "#555555", width: 1, dash: "dash" }
      },
      {
        type: "line",
        x0: 0.02,
        x1: 0.02,
        y0: 34.7,
        y1: 37.2,
        line: { color: "#f2d400", width: 6 }
      }
    ],
    annotations: [
      {
        x: 0.064,
        y: 35,
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
        bgcolor: "rgba(255,255,255,0.95)",
        bordercolor: "rgba(0,0,0,0)",
        borderpad: 2
      },
      {
        x: 1.159,
        y: 35,
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
        bgcolor: "rgba(255,255,255,0.95)",
        bordercolor: "rgba(0,0,0,0)",
        borderpad: 2
      },
      {
        x: 0.0,
        y: 1.03,
        xref: "paper",
        yref: "paper",
        text: "<b>a</b>",
        showarrow: false,
        font: { size: 26, color: "#111111" },
        xanchor: "left",
        yanchor: "top"
      }
    ]
  };

  Plotly.react(plotDiv, traces, layout, {
    responsive: true,
    displayModeBar: true
  });
}
