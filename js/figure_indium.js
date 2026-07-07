function renderIndiumPlot(rows) {
  const plotDiv = document.getElementById("indium-plot");
  if (!plotDiv) return;

  plotDiv.style.width = "100%";
  plotDiv.style.height = "540px";

  if (!window.PVDataIndium) {
    plotDiv.innerHTML = "<p>Indium helpers are missing.</p>";
    return;
  }

  window.__indiumRows = rows;

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
      const materialUtilisation = Number(document.getElementById("indium-util-eff")?.value ?? 80) / 100;
      const computed = PVDataIndium.computeRow(row, materialUtilisation);
      if (!computed || computed.totalMgW === null || !Number.isFinite(computed.efficiency)) {
        return null;
      }

      const yearMatch = String(computed.year || "").match(/(19|20)\d{2}/);
      const yearNum = yearMatch ? Number(yearMatch[0]) : NaN;

      return {
        ...computed,
        cellType: classifyCellType(row),
        yearNum,
        twYr: twYrFromMgW(computed.totalMgW)
      };
    })
    .filter(Boolean);

  const yearValues = plotRows.map((row) => row.yearNum).filter((v) => Number.isFinite(v));
  const minYearAvailable = yearValues.length ? Math.min(...yearValues) : 2015;
  const maxYearAvailable = yearValues.length ? Math.max(...yearValues) : 2026;

  const controlsId = "indium-controls";
  let controls = document.getElementById(controlsId);

  if (!controls) {
    controls = document.createElement("div");
    controls.id = controlsId;
    controls.style.cssText = [
      "display:grid",
      "grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))",
      "gap: 12px",
      "padding: 12px 14px",
      "margin-bottom: 16px",
      "background:#ffffff",
      "border:1px solid #dbe3ef",
      "border-radius:14px",
      "box-shadow: 0 2px 10px rgba(10, 40, 92, 0.04)"
    ].join(";");

    controls.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:10px;">
        <div style="font-weight:700; color:#10233f;">Filters</div>

        <label style="display:flex; align-items:center; gap:10px; font-size:14px; user-select:none;">
          <input type="checkbox" id="indium-certified-only" />
          Show certified values only
        </label>

        <label style="display:flex; flex-direction:column; gap:6px; font-size:14px;">
          <span>Show papers from year ≤ <strong id="indium-year-value"></strong></span>
          <input type="range" id="indium-year-max" min="${minYearAvailable}" max="${maxYearAvailable}" step="1" value="${maxYearAvailable}" />
        </label>

        <label style="display:flex; flex-direction:column; gap:6px; font-size:14px;">
          <span>Material utilisation efficiency: <strong id="indium-util-value">80</strong>%</span>
          <input type="range" id="indium-util-eff" min="5" max="100" step="1" value="80" />
        </label>
      </div>

      <div style="display:flex; flex-direction:column; gap:10px;">
        <div style="font-weight:700; color:#10233f;">Bottom cell type</div>

        <div style="display:flex; flex-wrap:wrap; gap:12px; align-items:center;">
          <label style="display:flex; align-items:center; gap:8px; font-size:14px; user-select:none;">
            <input type="checkbox" class="indium-cell-toggle" value="SHJ" checked />
            SHJ
          </label>
          <label style="display:flex; align-items:center; gap:8px; font-size:14px; user-select:none;">
            <input type="checkbox" class="indium-cell-toggle" value="TOPCon/POLO" checked />
            TOPCon/POLO
          </label>
          <label style="display:flex; align-items:center; gap:8px; font-size:14px; user-select:none;">
            <input type="checkbox" class="indium-cell-toggle" value="Al-BSF/PERC" checked />
            Al-BSF/PERC
          </label>
          <label style="display:flex; align-items:center; gap:8px; font-size:14px; user-select:none;">
            <input type="checkbox" class="indium-cell-toggle" value="Other" checked />
            Other
          </label>
        </div>

        <div style="margin-top:auto; display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
          <button id="indium-reset" type="button" style="padding:8px 12px; border:1px solid #d0d9e7; border-radius:10px; background:#f7fbff; cursor:pointer;">Reset filters</button>
          <span style="font-size:12px; color:#5c6b82;">Use the filters to reduce clutter in the indium plot.</span>
        </div>
      </div>
    `;

    const parent = plotDiv.parentElement || plotDiv;
    parent.insertBefore(controls, plotDiv);

    if (!controls.dataset.bound) {
      controls.dataset.bound = "true";

      const rerender = () => renderIndiumPlot(window.__indiumRows || rows);

      controls.querySelectorAll("input").forEach((input) => {
        input.addEventListener("input", rerender);
        input.addEventListener("change", rerender);
      });

      controls.querySelector("#indium-reset")?.addEventListener("click", () => {
        const certified = controls.querySelector("#indium-certified-only");
        const year = controls.querySelector("#indium-year-max");
        const util = controls.querySelector("#indium-util-eff");
        const cellBoxes = controls.querySelectorAll(".indium-cell-toggle");

        if (certified) certified.checked = false;
        if (year) year.value = String(maxYearAvailable);
        if (util) util.value = "80";
        cellBoxes.forEach((box) => {
          box.checked = true;
        });

        renderIndiumPlot(window.__indiumRows || rows);
      });
    }
  }

  const certifiedOnlyEl = document.getElementById("indium-certified-only");
  const yearMaxEl = document.getElementById("indium-year-max");
  const effMinEl = document.getElementById("indium-eff-min");
  const yearValueEl = document.getElementById("indium-year-value");
  const effValueEl = document.getElementById("indium-eff-value");
  const utilValueEl = document.getElementById("indium-util-value");
  
  if (utilValueEl && util) {
    utilValueEl.textContent = util.value;
  }

  if (yearMaxEl) {
    yearMaxEl.min = String(minYearAvailable);
    yearMaxEl.max = String(maxYearAvailable);
    if (!yearMaxEl.value) yearMaxEl.value = String(maxYearAvailable);
  }

  if (effMinEl && !effMinEl.value) {
    effMinEl.value = "15";
  }

  if (yearValueEl && yearMaxEl) {
    yearValueEl.textContent = yearMaxEl.value;
  }

  if (effValueEl && effMinEl) {
    effValueEl.textContent = Number(effMinEl.value).toFixed(1);
  }

  const certifiedOnly = certifiedOnlyEl?.checked ?? false;
  const maxYear = Number(yearMaxEl?.value ?? maxYearAvailable);
  const minEfficiency = Number(effMinEl?.value ?? 15);

  const enabledCells = new Set(
    Array.from(document.querySelectorAll(".indium-cell-toggle"))
      .filter((box) => box.checked)
      .map((box) => box.value)
  );

  const visibleRows = plotRows.filter((row) => {
    if (certifiedOnly && row.certified !== "yes") return false;
    if (Number.isFinite(row.yearNum) && row.yearNum > maxYear) return false;
    if (!enabledCells.has(row.cellType)) return false;
    return true;
  });

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
    [0.10, "#2f6f9d"],
    [0.22, "#1f8fa7"],
    [0.36, "#19a98c"],
    [0.50, "#49b86a"],
    [0.64, "#98c84f"],
    [0.76, "#f1c84b"],
    [0.88, "#f79f53"],
    [1.00, "#e4cce2"]
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
          opacity: 0.84,
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
    margin: { l: 72, r: 35, t: 120, b: 62 },
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
      range: [15, 36.4],
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
        y1: 36.4,
        line: { color: "#555555", width: 1, dash: "dash" }
      },
      {
        type: "line",
        x0: 1.159,
        x1: 1.159,
        y0: 15,
        y1: 36.4,
        line: { color: "#555555", width: 1, dash: "dash" }
      }
    ],
    annotations: [
      {
        x: 0.064,
        y: 36.05,
        yref: "y",
        text: "0.064 mg W⁻¹ (3 TW yr⁻¹)",
        showarrow: true,
        arrowhead: 0,
        ax: 50,
        ay: -44,
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
        y: 35.05,
        yref: "y",
        text: "1.159 mg W⁻¹ (0.17 TW yr⁻¹)",
        showarrow: true,
        arrowhead: 0,
        ax: 55,
        ay: -30,
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
