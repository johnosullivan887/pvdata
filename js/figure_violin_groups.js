function renderViolinGroupsPlot(rows) {const plotDiv = document.getElementById("violin-plot-1");if (!plotDiv) return;

plotDiv.style.width = "100%";plotDiv.style.height = "620px";

const colors = ["#011959","#0A285C","#103F60","#1C5A62","#3C6D56","#687B3E","#9D892B","#D29343","#F8A17B","#FDB7BC","#FACCFA"];

const MIN_EFF = Number(document.getElementById("certified-only-violin-groups")?.value ?? 0);const minEffValueEl = document.getElementById("certified-only-violin-groups");if (minEffValueEl) {minEffValueEl.textContent = MIN_EFF.toFixed(1);}

//if (efficiency < MIN_EFF) return null;

const normalize = (value) =>String(value ?? "").trim().replace(/\s+/g, " ");

const toNumber = (value) => {if (value === null || value === undefined || value === "") return null;const n = Number(String(value).replace(/,/g, "").trim());return Number.isFinite(n) ? n : null;};

const getEfficiency = (row) =>toNumber(getValue(row, "n tandem", "η (%)", "Efficiency"));

const getFrontRaw = (row) => {const raw = normalize(getValue(row, "Front TCO"));if (!raw) return "";if (raw.toLowerCase() === "not clear") return "Not clear";return raw;};

const getInterRaw = (row) => {const raw = normalize(getValue(row, "Inter-layer", "Interlayer TCE"));if (!raw || raw.toLowerCase() === "nan" || raw.toLowerCase() === "none") return "No layer";if (raw.toLowerCase() === "not clear") return "Not clear";return raw;};

const classifyRear = (val) => {if (val === null || val === undefined || String(val).trim() === "") return "Missing";

const s = String(val).trim();

const totalNotclear = new Set(["Not clear", "TCO/Ag"]);
if (totalNotclear.has(s)) return "Not clear";

const totalMetal = new Set([
  "Ag",
  "Al",
  "Ag/Al",
  "Al/Ag",
  "Al/Ti/Ag",
  "Ti/Pd/Ag/Pt",
  "Ti/Pd/Ag",
  "Cr/Ag",
  "Cr/Pd/Ag/Ag/Al"
]);
if (totalMetal.has(s)) return "No TCE";

const totalITO = new Set([
  "ITO/Ag",
  "ITO/Al",
  "ITO/Ag/Al",
  "ITO/Al/Ag",
  "ITO/Au",
  "ITO/SiO2/Ag",
  "ITO/Silica/Ag",
  "ITO/SiO2-NP/Ag",
  "ITO/MgF2/Ni/Al",
  "ITO/MgFx/Ag",
  "ITO/meso-Al2O3/Ag"
]);
if (totalITO.has(s)) return "ITO";

const totalIZO = new Set(["IZO/Ag", "IZO/MgF2/Ag"]);
if (totalIZO.has(s)) return "IZO";

const totalIZrO = new Set(["IZrO/Ag", "IZrO/SiOx/Ag"]);
if (totalIZrO.has(s)) return "IZrO";

const otherIn = new Set([
  "IWO/Ag",
  "ICO/Ag",
  "InOx:H/Ag",
  "InOx/Ag",
  "Doped-InOx/Ag",
  "Doped-InOx",
  "Doped-InOx/Ag/SiO2/Ag",
  "Doped-InOx:H/Ag/SiOx/Ag"
]);
if (otherIn.has(s)) return "Other InO$_x$";

const totalAZO = new Set(["AZO/Ag", "AZO/Al"]);
if (totalAZO.has(s)) return "AZO";

return "Other";

};

const getRearCat = (row) =>classifyRear(getValue(row, "Rear electrode", "Rear Electrode"));

const certifiedOnly =document.getElementById("certified-only-violin-groups")?.checked ?? false;

const cleanRows = rows.map((row) => ({efficiency: getEfficiency(row),front: getFrontRaw(row),inter: getInterRaw(row),rear: getRearCat(row),certified: normalize(getValue(row, "Certified", "certified")).toLowerCase()})).filter((row) => Number.isFinite(row.efficiency));

const visibleRows = certifiedOnly? cleanRows.filter((row) => row.certified === "yes"): cleanRows;

window.filteredViolinGroupsRows = visibleRows;

const subgroups = ["SHJ", "TOPCon/POLO"];const groupColors = {SHJ: colors[0],"TOPCon/POLO": colors[3]};

const sectionDefs = [{ key: "Front", label: "Front", field: "front" },{ key: "Middle", label: "Middle", field: "inter" },{ key: "Rear", label: "Rear", field: "rear" },{ key: "Total", label: "Total", field: "total" }];

const totalValues = visibleRows.map((row) => ({...row,total:Number.isFinite(row.front) && Number.isFinite(row.inter) && Number.isFinite(row.rear)? row.front + row.inter + row.rear: null}));

const sectionData = {Front: subgroups.map((grp) =>visibleRows.filter((row) => row.cellGroup === grp && Number.isFinite(row.front)).map((row) => row.front)),Middle: subgroups.map((grp) =>visibleRows.filter((row) => row.cellGroup === grp && Number.isFinite(row.inter)).map((row) => row.inter)),Rear: subgroups.map((grp) =>visibleRows.filter((row) => row.cellGroup === grp && Number.isFinite(row.rear)).map((row) => row.rear)),Total: subgroups.map((grp) =>totalValues.filter((row) => row.cellGroup === grp && Number.isFinite(row.total)).map((row) => row.total))};

const sectionMax = Object.fromEntries(sectionDefs.map((sec) => {const vals = sectionData[sec.key].flat().filter((v) => Number.isFinite(v));const max = vals.length ? Math.max(...vals) : 1;return [sec.key, max * 1.22];}));

const xDomains = [[0.00, 0.22],[0.27, 0.49],[0.54, 0.76],[0.81, 1.00]];

const axisIds = [{ x: "x", y: "y" },{ x: "x2", y: "y2" },{ x: "x3", y: "y3" },{ x: "x4", y: "y4" }];

const legendTraces = [{type: "scatter",mode: "markers",x: [null],y: [null],name: "SHJ",marker: { color: groupColors.SHJ, size: 10 },hoverinfo: "skip"},{type: "scatter",mode: "markers",x: [null],y: [null],name: "TOPCon/POLO",marker: { color: groupColors["TOPCon/POLO"], size: 10 },hoverinfo: "skip"}];

const traces = [];

sectionDefs.forEach((sec, secIndex) => {const valuesByGroup = sectionData[sec.key];const ymax = sectionMax[sec.key];const axis = axisIds[secIndex];

subgroups.forEach((grp, grpIndex) => {
  const vals = valuesByGroup[grpIndex];
  if (!vals || !vals.length) return;

  const xPos = grpIndex;
  const color = groupColors[grp];

  traces.push({
    type: "violin",
    x: Array(vals.length).fill(xPos),
    y: vals,
    xaxis: axis.x,
    yaxis: axis.y,
    name: grp,
    showlegend: false,
    points: false,
    spanmode: "hard",
    width: 0.9,
    line: { color, width: 1 },
    fillcolor: color,
    opacity: 0.55,
    hovertemplate: "Thickness: %{y:.2f} nm<extra></extra>"
  });

  const sampled = vals.length > 200
    ? vals.slice().sort(() => 0.5 - Math.random()).slice(0, 200)
    : vals;

  const jitter = sampled.map(() => (Math.random() - 0.5) * 0.16);

  traces.push({
    type: "scatter",
    mode: "markers",
    x: sampled.map((_, i) => xPos + jitter[i]),
    y: sampled,
    xaxis: axis.x,
    yaxis: axis.y,
    showlegend: false,
    marker: {
      size: 6,
      color,
      opacity: 0.55,
      line: { color: "none" }
    },
    hovertemplate: "Thickness: %{y:.2f} nm<extra></extra>"
  });

  traces.push({
    type: "scatter",
    mode: "text",
    x: [xPos],
    y: [Math.min(Math.max(...vals) + 0.03 * ymax, ymax * 0.88)],
    xaxis: axis.x,
    yaxis: axis.y,
    showlegend: false,
    text: [`n = ${vals.length}<br>median = ${median(vals).toFixed(1)}`],
    textposition: "top center",
    hoverinfo: "skip",
    textfont: { size: 12, color: "#111111" }
  });
});

traces.push({
  type: "scatter",
  mode: "text",
  x: [0.5],
  y: [ymax * 0.95],
  xaxis: axis.x,
  yaxis: axis.y,
  showlegend: false,
  text: [`<b>${sec.label}</b>`],
  hoverinfo: "skip",
  textposition: "top center",
  textfont: { size: 14, color: "#111111" }
});

});

function median(arr) {if (!arr.length) return NaN;const a = arr.slice().sort((x, y) => x - y);const mid = Math.floor(a.length / 2);return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;}

const layout = {autosize: true,height: 620,paper_bgcolor: "#ffffff",plot_bgcolor: "#ffffff",margin: { l: 70, r: 30, t: 28, b: 140 },font: { family: "Arial, sans-serif", size: 12, color: "#111111" },

xaxis: {
  domain: xDomains[0],
  anchor: "y",
  tickmode: "array",
  tickvals: [0, 1],
  ticktext: subgroups,
  tickangle: 0,
  showline: true,
  linecolor: "#222222",
  zeroline: false
},
xaxis2: {
  domain: xDomains[1],
  anchor: "y2",
  tickmode: "array",
  tickvals: [0, 1],
  ticktext: subgroups,
  showline: true,
  linecolor: "#222222",
  zeroline: false
},
xaxis3: {
  domain: xDomains[2],
  anchor: "y3",
  tickmode: "array",
  tickvals: [0, 1],
  ticktext: subgroups,
  showline: true,
  linecolor: "#222222",
  zeroline: false
},
xaxis4: {
  domain: xDomains[3],
  anchor: "y4",
  tickmode: "array",
  tickvals: [0, 1],
  ticktext: subgroups,
  showline: true,
  linecolor: "#222222",
  zeroline: false
},

yaxis: {
  anchor: "free",
  position: xDomains[0][0],
  title: "TCE thickness (nm)",
  showline: true,
  linecolor: "#222222",
  zeroline: false,
  automargin: true
},
yaxis2: {
  anchor: "free",
  position: xDomains[1][0],
  showline: true,
  linecolor: "#222222",
  zeroline: false,
  automargin: true
},
yaxis3: {
  anchor: "free",
  position: xDomains[2][0],
  showline: true,
  linecolor: "#222222",
  zeroline: false,
  automargin: true
},
yaxis4: {
  anchor: "free",
  position: xDomains[3][0],
  showline: true,
  linecolor: "#222222",
  zeroline: false,
  automargin: true
}

};

Plotly.react(plotDiv, [...legendTraces, ...traces], layout, {responsive: true,displayModeBar: true});}
