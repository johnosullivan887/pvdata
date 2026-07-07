const TceMaterialPlotBase = (() => {
  const DEP_EFF = 0.8;

  function normalizeText(value) {
    return String(value ?? "")
      .trim()
      .replace(/\s+/g, " ");
  }

  function keyify(value) {
    return normalizeText(value)
      .toLowerCase()
      .replace(/\s+/g, "");
  }

  function resolveField(row, keys) {
    for (const key of keys) {
      const value = row?.[key];
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        return value;
      }
    }
    return null;
  }

  function toNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const n = Number(String(value).replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : null;
  }

  function parseDate(value) {
    if (!value) return null;

    const s = String(value).trim();
    const parts = s.split("/");

    if (parts.length === 3) {
      const [day, month, year] = parts.map(Number);
      const d = new Date(year, month - 1, day);
      return isNaN(d.getTime()) ? null : d;
    }

    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  function getAuthor(row) {
    return normalizeText(resolveField(row, ["Author"]));
  }

  function getYear(row) {
    const yearRaw = resolveField(row, ["Year"]);
    if (yearRaw) return normalizeText(yearRaw);

    const dateRaw = resolveField(row, ["Publishing date", "Date"]);
    const match = String(dateRaw ?? "").match(/(19|20)\d{2}/);
    return match ? match[0] : "";
  }

  function getPaperUrl(row) {
    const ref = normalizeText(resolveField(row, ["Reference", "Reference link", "DOI"]));
    if (!ref) return "";

    if (/^https?:\/\//i.test(ref)) return ref;

    if (/^10\.\d{4,9}\//i.test(ref)) {
      return `https://doi.org/${ref}`;
    }

    return "";
  }

  function getEfficiency(row) {
    return toNumber(resolveField(row, ["n tandem", "η (%)", "Efficiency"]));
  }

  function getActiveArea(row) {
    return toNumber(
      resolveField(row, [
        "Cell active area",
        "Active Area (cm2)",
        "Active area",
        "Area"
      ])
    );
  }

  function classifyCellType(row) {
    const raw = keyify(resolveField(row, ["Cell", "Si Bottom cell type"]));

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
  }

  function twYrFromMgW(mgW) {
    const x1 = 0.064;
    const y1 = 3.0;
    const x2 = 1.159;
    const y2 = 0.17;

    const b = Math.log(y2 / y1) / Math.log(x2 / x1);
    const a = y1 / Math.pow(x1, b);

    return a * Math.pow(mgW, b);
  }

  function indiumProfile(fraction, density) {
    return { mode: "indium", fraction, density };
  }

  function zeroProfile() {
    return { mode: "zero" };
  }

  function buildLookup(entries) {
    const out = {};
    entries.forEach(([aliases, profile]) => {
      aliases.forEach((alias) => {
        out[keyify(alias)] = profile;
      });
    });
    return out;
  }

  function matchGroup(rawValue, groups) {
    const raw = keyify(rawValue);
    if (!raw) return null;

    for (const group of groups) {
      for (const alias of group.aliases || []) {
        if (raw === keyify(alias)) return group;
      }
    }

    return null;
  }

  function getDefaultColorScale() {
    return [
      [0.0, "#011959"],
      [0.15, "#0A285C"],
      [0.3, "#103F60"],
      [0.45, "#1C5A62"],
      [0.6, "#3C6D56"],
      [0.75, "#687B3E"],
      [0.88, "#D29343"],
      [1.0, "#F8A17B"]
    ];
  }

  function defaultTickLabels() {
    return {
      tickvals: [-2, -1, 0, 1],
      ticktext: ["10<sup>-2</sup>", "10<sup>-1</sup>", "10<sup>0</sup>", "10<sup>1</sup>"]
    };
  }

  function buildPlotRows(rows, options) {
    const {
      rawCategoryGetter,
      thicknessGetter,
      profileLookup,
      cellTypeGetter = classifyCellType,
      efficiencyGetter = getEfficiency,
      activeAreaGetter = getActiveArea,
      authorGetter = getAuthor,
      yearGetter = getYear,
      paperUrlGetter = getPaperUrl
    } = options;

    return rows
      .map((row) => {
        const efficiency = efficiencyGetter(row);
        if (!Number.isFinite(efficiency)) return null;

        const rawCategory = rawCategoryGetter(row);
        const profile = profileLookup(rawCategory);
        if (!profile) return null;

        const thicknessNm = thicknessGetter(row);
        if (profile.mode !== "zero" && thicknessNm === null) return null;

        let mgW = 0;
        if (profile.mode === "indium") {
          mgW =
            ((thicknessNm * 1e-7) / DEP_EFF) *
            profile.density *
            profile.fraction *
            1000 /
            ((efficiency / 100) * 0.1);
        }

        if (!Number.isFinite(mgW)) return null;

        return {
          x: mgW,
          efficiency,
          activeArea: activeAreaGetter(row),
          cellType: cellTypeGetter(row),
          rawCategory: normalizeText(rawCategory),
          author: authorGetter(row),
          year: yearGetter(row),
          paperUrl: paperUrlGetter(row)
        };
      })
      .filter(Boolean);
  }

  function renderTceMaterialPlot(rows, options) {
    const {
      plotId,
      title,
      xLabel = "Indium content (mg W⁻¹)",
      groups,
      rawCategoryGetter,
      thicknessGetter,
      profileLookup,
      xRange = [CONFIG?.indium?.min ?? 0, CONFIG?.indium?.max ?? 11],
      yRange = [15, 35],
      showTwGuide = true,
      certifiedOnlyCheckboxId = "certified-only"
    } = options;

    const plotDiv = document.getElementById(plotId);
    if (!plotDiv) return;

    plotDiv.style.width = "100%";
    plotDiv.style.height = "540px";

    const certifiedOnly = document.getElementById(certifiedOnlyCheckboxId)?.checked ?? false;

    const plotRows = buildPlotRows(rows, {
      rawCategoryGetter,
      thicknessGetter,
      profileLookup,
      cellTypeGetter: options.cellTypeGetter,
      efficiencyGetter: options.efficiencyGetter,
      activeAreaGetter: options.activeAreaGetter,
      authorGetter: options.authorGetter,
      yearGetter: options.yearGetter,
      paperUrlGetter: options.paperUrlGetter
    });

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

    const colorMin = Math.min(...logAreas);
    const colorMax = Math.max(...logAreas);

    const colorScale = options.colorScale || getDefaultColorScale();
    const ticks = options.colorTicks || defaultTickLabels();

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
          x: group.map((row) => row.x),
          y: group.map((row) => row.efficiency),
          customdata: group.map((row) => [
            row.author,
            row.year,
            row.paperUrl,
            row.cellType,
            Number.isFinite(row.activeArea) ? row.activeArea.toFixed(3) : "n/a",
            Number.isFinite(row.x) ? twYrFromMgW(row.x) : null
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
      margin: { l: 72, r: 28, t: 22, b: 62 },
      paper_bgcolor: "#ffffff",
      plot_bgcolor: "#ffffff",
      font: {
        family: "Arial, sans-serif",
        size: 13,
        color: "#111111"
      },
      xaxis: {
        title: xLabel,
        range: xRange,
        showline: true,
        linecolor: "#222222",
        zeroline: false,
        showgrid: true,
        gridcolor: "#e5e5e5",
        gridwidth: 0.7
      },
      yaxis: {
        title: "Power conversion efficiency (%)",
        range: yRange,
        dtick: 5,
        showline: true,
        linecolor: "#222222",
        zeroline: false,
        showgrid: true,
        gridcolor: "#e5e5e5",
        gridwidth: 0.7
      },
      coloraxis: {
        colorscale: colorScale,
        cmin: colorMin,
        cmax: colorMax,
        colorbar: {
          title: {
            text: "Cell active area (cm²)",
            side: "right"
          },
          tickmode: "array",
          tickvals: ticks.tickvals,
          ticktext: ticks.ticktext,
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

    if (showTwGuide) {
      layout.shapes = [
        {
          type: "line",
          x0: 0.064,
          x1: 0.064,
          y0: yRange[0],
          y1: yRange[1],
          line: { color: "#555555", width: 1, dash: "dash" }
        },
        {
          type: "line",
          x0: 1.159,
          x1: 1.159,
          y0: yRange[0],
          y1: yRange[1],
          line: { color: "#555555", width: 1, dash: "dash" }
        }
      ];

      layout.annotations = [
        {
          x: 0.064,
          y: yRange[1],
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
          y: yRange[1],
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
          x: 0.03,
          y: 0.08,
          xref: "paper",
          yref: "paper",
          text:
            "TW/yr conversion:<br>" +
            "0.064 mg W⁻¹ → 3 TW yr⁻¹<br>" +
            "1.159 mg W⁻¹ → 0.17 TW yr⁻¹",
          showarrow: false,
          align: "left",
          bgcolor: "rgba(255,255,255,0.95)",
          bordercolor: "#222222",
          borderwidth: 1,
          borderpad: 6,
          font: { size: 12, color: "#111111" }
        }
      ];
    }

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

  return {
    normalizeText,
    keyify,
    resolveField,
    toNumber,
    parseDate,
    getAuthor,
    getYear,
    getPaperUrl,
    getEfficiency,
    getActiveArea,
    classifyCellType,
    twYrFromMgW,
    indiumProfile,
    zeroProfile,
    buildLookup,
    matchGroup,
    renderTceMaterialPlot
  };
})();

window.TceMaterialPlotBase = TceMaterialPlotBase;
