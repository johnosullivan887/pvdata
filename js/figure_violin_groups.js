function renderViolinGroupsPlot(rows) {
  const plotDiv = document.getElementById("violin-plot-1");
  if (!plotDiv) return;

  plotDiv.style.width = "100%";
  plotDiv.style.height = "620px";

  const colors = [
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
    "#FACCFA"
  ];

  const normalize = (value) =>
    String(value ?? "")
      .trim()
      .replace(/\s+/g, " ");

  const toNumber = (value) => {
    if (value === null || value === undefined || value === "") return null;
    const n = Number(String(value).replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : null;
  };

  const classifyRear = (val) => {
    if (val === null || val === undefined || String(val).trim() === "") return "Missing";

    const s = String(val).trim();

    const totalNotclear = new Set(["Not clear", "TCO/Ag"]);
    if (totalNotclear.has(s)) return "Not clear";

    const totalMetal = new Set([
      "Ag", "Al", "Ag/Al", "Al/Ag", "Al/Ti/Ag",
      "Ti/Pd/Ag/Pt", "Ti/Pd/Ag", "Cr/Ag", "Cr/Pd/Ag/Ag/Al"
    ]);
    if (totalMetal.has(s)) return "No TCE";

    const totalITO = new Set([
      "ITO/Ag", "ITO/Al", "ITO/Ag/Al", "ITO/Al/Ag", "ITO/Au",
      "ITO/SiO2/Ag", "ITO/Silica/Ag", "ITO/SiO2-NP/Ag",
      "ITO/MgF2/Ni/Al", "ITO/MgFx/Ag", "ITO/meso-Al2O3/Ag"
    ]);
    if (totalITO.has(s)) return "ITO";

    const totalIZO = new Set(["IZO/Ag", "IZO/MgF2/Ag"]);
    if (totalIZO.has(s)) return "IZO";

    const totalIZrO = new Set(["IZrO/Ag", "IZrO/SiOx/Ag"]);
    if (totalIZrO.has(s)) return "IZrO";

    const otherIn = new Set([
      "IWO/Ag", "ICO/Ag", "InOx:H/Ag", "InOx/Ag", "Doped-InOx/Ag",
      "Doped-InOx", "Doped-InOx/Ag/SiO2/Ag", "Doped-InOx:H/Ag/SiOx/Ag"
    ]);
    if (otherIn.has(s)) return "Other InO$_x$";

    const totalAZO = new Set(["AZO/Ag", "AZO/Al"]);
    if (totalAZO.has(s)) return "AZO";

    return "Other";
  };

  const getEfficiency = (row) =>
    toNumber(getValue(row, "n tandem", "η (%)", "Efficiency"));

  const getFrontRaw = (row) => normalize(getValue(row, "Front TCO"));

  const getInterRaw = (row) => {
    const raw = normalize(getValue(row, "Inter-layer", "Interlayer TCE"));
    if (!raw || raw.toLowerCase() === "nan" || raw.toLowerCase() === "none") return "No layer";
    if (raw.toLowerCase() === "not clear") return "Not clear";
    return raw;
  };

  const getRearCat = (row) =>
    classifyRear(getValue(row, "Rear electrode", "Rear Electrode"));

  const certifiedOnly = document.getElementById("certified-only")?.checked ?? true;

  const cleanRows = rows
    .map((row) => ({
      efficiency: getEfficiency(row),
      front: getFrontRaw(row),
      inter: getInterRaw(row),
      rear: getRearCat(row),
      certified: normalize(getValue(row, "Certified", "certified")).toLowerCase()
    }))
    .filter((row) => Number.isFinite(row.efficiency));

  const visibleRows = certifiedOnly
    ? cleanRows.filter((row) => row.certified === "yes")
    : cleanRows;

  const frontCats = [
    "ITO",
    "IZO",
    "IO:H/ITO",
    "ICO",
    "IZrO",
    "IZrO/IZO",
    "In-Free",
    "Not clear"
  ];

  const interCats = [
    "ITO",
    "IZO",
    "Undoped InO$_x$",
    "Doped InO$_x$",
    "ZTO",
    "No layer",
    "Not clear",
    "SiO$_x$-based TJ",
    "Other TJ",
    "Si-based TJ"
  ];

  const rearCats = [
    "No TCE",
    "Not clear",
    "ITO",
    "IZO",
    "IZrO",
    "Other InO$_x$",
    "AZO"
  ];

  const frontGroups = [
    { label: "ITO", values: ["ITO"], color: colors[0] },
    { label: "IZO", values: ["IZO"], color: colors[0] },
    { label: "IO:H/ITO", values: ["IO:H/ITO"], color: colors[0] },
    { label: "ICO", values: ["ICO"], color: colors[0] },
    { label: "IZrO", values: ["IZrO"], color: colors[0] },
    { label: "IZrO/IZO", values: ["IZrO/IZO"], color: colors[0] },
    { label: "In-Free", values: ["AgNWs", "AZO", "MoOx/Au/MoOx"], color: colors[0] },
    { label: "Not clear", values: ["Not clear"], color: colors[6] }
  ];

  const interGroups = [
    { label: "ITO", values: ["ITO"], color: colors[0] },
    { label: "IZO", values: ["IZO"], color: colors[0] },
    { label: "Undoped InO$_x$", values: ["InOx"], color: colors[0] },
    { label: "Doped InO$_x$", values: ["IWO", "Doped InOx", "IO:H", "ITO/IZO"], color: colors[0] },
    { label: "ZTO", values: ["ZTO"], color: colors[0] },
    { label: "No layer", values: ["No layer"], color: colors[3] },
    { label: "Not clear", values: ["Not clear"], color: colors[6] },
    { label: "SiO$_x$-based TJ", values: ["nc-SiOx(n)", "nc-SiOx:H(n/p)"], color: colors[8] },
    { label: "Other TJ", values: ["TiSi2", "TiOx/TiNy", "n-n-p organic"], color: colors[8] },
    {
      label: "Si-based TJ",
      values: [
        "a*-Si:H(n)", "nc-Si:H(p)", "nc-Si:H(n)", "a-Si:H(p+)",
        "nc-Si:H(n/p)", "nc-Si:H(p/n)", "poly-Si(n/p)",
        "nc-Si(n+)", "uc-Si:H(p/n)"
      ],
      color: colors[8]
    }
  ];

  const rearGroups = [
    { label: "No TCE", values: ["No TCE"], color: colors[4] },
    { label: "Not clear", values: ["Not clear"], color: colors[6] },
    { label: "ITO", values: ["ITO"], color: colors[0] },
    { label: "IZO", values: ["IZO"], color: colors[0] },
    { label: "IZrO", values: ["IZrO"], color: colors[0] },
    { label: "Other InO$_x$", values: ["Other InO$_x$"], color: colors[0] },
    { label: "AZO", values: ["AZO"], color: colors[0] }
  ];

  const getVals = (fieldGetter, values) =>
    visibleRows
      .filter((row) => values.includes(fieldGetter(row)))
      .map((row) => row.efficiency);

  const frontData = frontGroups.map((g) => getVals((row) => row.front, g.values));
  const interData = interGroups.map((g) => getVals((row) => row.inter, g.values));
  const rearData = rearGroups.map((g) => getVals((row) => row.rear, g.values));

  const cats = frontCats.concat(interCats, rearCats);
  const allData = frontData.concat(interData, rearData);
  const groupMeta = frontGroups.concat(interGroups, rearGroups);

  const gap = 1.0;
  const sepGap = 1.8;

  const Nf = frontCats.length;
  const Ni = interCats.length;
  const Nr = rearCats.length;

  const frontPositions = Array.from({ length: Nf }, (_, i) => i * gap);
  const interPositions = Array.from({ length: Ni }, (_, j) => frontPositions[frontPositions.length - 1] + sepGap + j * gap);
  const rearPositions = Array.from({ length: Nr }, (_, k) => interPositions[interPositions.length - 1] + sepGap + k * gap);

  const positions = frontPositions.concat(interPositions, rearPositions);

  const colorMap = {
    "TCO": colors[0],
    "Interconnection-free layer": colors[3],
    "Tunnelling junction": colors[8],
    "Not disclosed": colors[6],
    "TCE-free rear electrode": colors[4]
  };

  const legendTraces = [
    { name: "TCO", color: colors[0] },
    { name: "Interconnection-free layer", color: colors[3] },
    { name: "Tunnelling junction", color: colors[8] },
    { name: "Not disclosed", color: colors[6] },
    { name: "TCE-free rear electrode", color: colors[4] }
  ].map((item) => ({
    type: "scatter",
    mode: "markers",
    x: [null],
    y: [null],
    name: item.name,
    marker: { color: item.color, size: 10 },
    showlegend: true,
    hoverinfo: "skip"
  }));

  const violinTraces = [];

  cats.forEach((cat, idx) => {
    const valsArr = allData[idx];
    if (!valsArr || !valsArr.length) return;

    const x = positions[idx];
    const meta = groupMeta[idx];
    const col = meta.color;

    violinTraces.push({
      type: "violin",
      x: Array(valsArr.length).fill(x),
      y: valsArr,
      name: cat,
      showlegend: false,
      points: false,
      spanmode: "hard",
      width: 0.85,
      line: { color: col, width: 1 },
      fillcolor: col,
      opacity: 0.55,
      meanline: { visible: false },
      hovertemplate: "Efficiency: %{y:.2f}%<extra></extra>"
    });

    const jitter = Array.from({ length: valsArr.length }, () => (Math.random() - 0.5) * 0.16);

    violinTraces.push({
      type: "scatter",
      mode: "markers",
      x: valsArr.map((_, i) => x + jitter[i]),
      y: valsArr,
      showlegend: false,
      marker: {
        size: 6,
        color: col,
        opacity: 0.55,
        line: { color: "none" }
      },
      hovertemplate: "Efficiency: %{y:.2f}%<extra></extra>"
    });
  });

  const annotations = [];

  cats.forEach((cat, idx) => {
    const valsArr = allData[idx];
    if (!valsArr || !valsArr.length) return;

    const x = positions[idx];
    annotations.push({
      x,
      y: Math.min(Math.max(...valsArr) + 0.2, 35.5),
      text: String(valsArr.length),
      showarrow: false,
      font: { size: 12, color: "#111111" },
      xanchor: "center",
      yanchor: "bottom"
    });
  });

  const sep1X = (frontPositions[frontPositions.length - 1] + interPositions[0]) / 2;
  const sep2X = (interPositions[interPositions.length - 1] + rearPositions[0]) / 2;

  annotations.push(
    {
      x: (frontPositions[0] + frontPositions[frontPositions.length - 1]) / 2,
      y: 38,
      text: "<b>Front electrode</b>",
      showarrow: false,
      font: { size: 14, color: "#111111" },
      xanchor: "center",
      yanchor: "bottom"
    },
    {
      x: (interPositions[0] + interPositions[interPositions.length - 1]) / 2,
      y: 38,
      text: "<b>Interconnection electrode</b>",
      showarrow: false,
      font: { size: 14, color: "#111111" },
      xanchor: "center",
      yanchor: "bottom"
    },
    {
      x: (rearPositions[0] + rearPositions[rearPositions.length - 1]) / 2,
      y: 38,
      text: "<b>Rear electrode</b>",
      showarrow: false,
      font: { size: 14, color: "#111111" },
      xanchor: "center",
      yanchor: "bottom"
    }
  );

  const layout = {
    autosize: true,
    height: 620,
    paper_bgcolor: "#ffffff",
    plot_bgcolor: "#ffffff",
    margin: { l: 70, r: 30, t: 28, b: 140 },
    font: { family: "Arial, sans-serif", size: 12, color: "#111111" },
    xaxis: {
      tickmode: "array",
      tickvals: positions,
      ticktext: cats,
      tickangle: 60,
      range: [positions[0] - 1, positions[positions.length - 1] + 1],
      showline: true,
      linecolor: "#222222",
      zeroline: false
    },
    yaxis: {
      title: "Power conversion efficiency (%)",
      range: [10, 40],
      dtick: 5,
      showline: true,
      linecolor: "#222222",
      zeroline: false
    },
    shapes: [
      {
        type: "line",
        x0: sep1X,
        x1: sep1X,
        y0: 10,
        y1: 36,
        line: { color: "#b0b0b0", width: 1.2, dash: "dash" }
      },
      {
        type: "line",
        x0: sep2X,
        x1: sep2X,
        y0: 10,
        y1: 36,
        line: { color: "#b0b0b0", width: 1.2, dash: "dash" }
      }
    ],
    annotations,
    legend: {
      orientation: "h",
      x: 0.5,
      y: -0.28,
      xanchor: "center",
      yanchor: "top",
      bordercolor: "#000000",
      borderwidth: 1,
      frameon: true
    }
  };

  Plotly.react(plotDiv, [...legendTraces, ...violinTraces], layout, {
    responsive: true,
    displayModeBar: true
  });
}
