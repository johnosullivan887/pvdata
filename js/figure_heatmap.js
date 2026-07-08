function renderCombinationHeatmap(rows) {
  const plotDiv = document.getElementById("heatmap-plot");
  if (!plotDiv) return;

  const tax = window.TceMaterialTaxonomy;
  if (!tax) {
    plotDiv.innerHTML = "<p>TCE plot helpers are missing.</p>";
    return;
  }

  plotDiv.style.width = "100%";
  plotDiv.style.height = "760px";

  const certifiedOnly =
    document.getElementById("certified-only-heatmap")?.checked ?? false;

  const MIN_EFF = Number(document.getElementById("certified-only-heatmap")?.value ?? 0);
  const minEffValueEl = document.getElementById("certified-only-heatmap");
  if (minEffValueEl) {
    minEffValueEl.textContent = MIN_EFF.toFixed(1);
  }
  
  if (efficiency < MIN_EFF) return null;

  const normalize = (value) =>
    String(value ?? "")
      .trim()
      .replace(/\s+/g, " ");

  const keyify = (value) =>
    normalize(value).toLowerCase().replace(/\s+/g, "");

  const classifyInterlayer = (row) => {
    const raw = normalize(getValue(row, "Interlayer TCE", "Inter-layer"));
    const k = keyify(raw);

    if (!k) return null;

    if (k.includes("notclear") || k.includes("unclear")) return "Unclear / other";
    if (k.includes("none") || k.includes("nolayer") || k.includes("notce")) return "None";

    if (k.includes("ito")) return "ITO";
    if (k.includes("izo")) return "IZO";

    if (
      k.includes("izro") ||
      k.includes("inox") ||
      k.includes("iwo") ||
      k.includes("dopedinox") ||
      k.includes("doped-inox") ||
      k.includes("io:h")
    ) {
      return "Other indium-based";
    }

    if (
      k.includes("azo") ||
      k.includes("agnw") ||
      k.includes("in-free") ||
      k.includes("infree") ||
      k.includes("moox/aumoox")
    ) {
      return "Indium-free TCO";
    }

    if (
      k.includes("siox") ||
      k.includes("si-based") ||
      k.includes("tj") ||
      k.includes("tunnel") ||
      k.includes("tisi2") ||
      k.includes("tiox") ||
      k.includes("tiny") ||
      k.includes("organic") ||
      k.includes("nc-siox")
    ) {
      return "Tunnel junction";
    }

    return "Tunnel junction";
  };

  const frontCats = [
    "ITO-family",
    "IZO-family",
    "IZrO-family",
    "Other InOx",
    "In-free / alternative",
    "Unclear / other"
  ];

  const rearCats = [
    "ITO-family",
    "IZO-family",
    "IZrO-family",
    "Other InOx",
    "In-free / alternative",
    "Metal / reflector",
    "No layer / no TCE",
    "Unclear / other"
  ];

  const interCats = [
    "ITO",
    "IZO",
    "Other indium-based",
    "Indium-free TCO",
    "Tunnel junction",
    "None"
  ];

  const visibleRows = rows
    .map((row) => ({
      front: tax.familyFromFront(getValue(row, "Front TCE (fTCE)", "Front TCO")),
      rear: tax.familyFromRear(getValue(row, "Rear electrode", "Rear Electrode")),
      inter: classifyInterlayer(row),
      certified: String(getValue(row, "Certified", "certified")).trim().toLowerCase()
    }))
    .filter((row) => row.front && row.rear && row.inter)
    .filter((row) => (certifiedOnly ? row.certified === "yes" : true));

  if (!visibleRows.length) {
    plotDiv.innerHTML = "<p>No rows match the current filters.</p>";
    return;
  }

  function buildCountMatrix(subset) {
    const countMap = new Map();

    subset.forEach((row) => {
      const key = `${row.front}|||${row.rear}`;
      countMap.set(key, (countMap.get(key) || 0) + 1);
    });

    return frontCats.map((front) =>
      rearCats.map((rear) => countMap.get(`${front}|||${rear}`) || 0)
    );
  }

  const subplotData = interCats.map((interLabel) => {
    const subset = visibleRows.filter((row) => row.inter === interLabel);
    const counts = buildCountMatrix(subset);
    const maxCount = Math.max(...counts.flat(), 0);

    return {
      interLabel,
      subset,
      counts,
      maxCount,
      logCounts: counts.map((row) => row.map((v) => Math.log10(v + 1)))
    };
  });

  const globalMaxCount = Math.max(...subplotData.map((d) => d.maxCount), 0);
  if (globalMaxCount === 0) {
    plotDiv.innerHTML = "<p>No rows match the current filters.</p>";
    return;
  }

  const globalMaxLog = Math.log10(globalMaxCount + 1);

  const tickCandidates = [0, 1, 2, 5, 10, 20, 50, 100];
  const tickPairs = tickCandidates
    .map((count) => ({ count, log: Math.log10(count + 1) }))
    .filter((item) => item.log <= globalMaxLog + 1e-9);

  const colorscale = [
    [0.0, "#f7fbff"],
    [0.15, "#deebf7"],
    [0.3, "#c6dbef"],
    [0.45, "#9ecae1"],
    [0.6, "#6baed6"],
    [0.75, "#4292c6"],
    [0.9, "#2171b5"],
    [1.0, "#084594"]
  ];

  const xDomains = [
    [0.00, 0.31],
    [0.345, 0.655],
    [0.69, 1.00]
  ];

  const yDomains = [
    [0.54, 1.00],
    [0.00, 0.46]
  ];

  const subplotTitles = [
    "ITO",
    "IZO",
    "Other indium-based",
    "Indium-free TCO",
    "Tunnel junction",
    "None"
  ];

  const traces = [];
  const annotations = [];

  subplotData.forEach((block, i) => {
    const col = i % 3;
    const row = i < 3 ? 0 : 1;
    const xaxisName = i === 0 ? "x" : `x${i + 1}`;
    const yaxisName = i === 0 ? "y" : `y${i + 1}`;
    const xDomain = xDomains[col];
    const yDomain = yDomains[row];

    const counts = block.counts;
    const texts = counts.map((r) => r.map((v) => (v > 0 ? String(v) : "")));

    traces.push({
      type: "heatmap",
      x: rearCats,
      y: frontCats,
      z: block.logCounts,
      customdata: counts,
      text: texts,
      texttemplate: "%{text}",
      textfont: { size: 10, color: "#111111" },
      hoverongaps: false,
      colorscale,
      zmin: 0,
      zmax: globalMaxLog,
      showscale: i === subplotData.length - 1,
      colorbar: i === subplotData.length - 1 ? {
        title: "Count<br>(log scale)",
        tickmode: "array",
        tickvals: tickPairs.map((p) => p.log),
        ticktext: tickPairs.map((p) => String(p.count)),
        thickness: 18,
        outlinewidth: 0.8,
        outlinecolor: "#222222"
      } : undefined,
      xaxis: xaxisName,
      yaxis: yaxisName,
      hovertemplate:
        "Interlayer: " + block.interLabel + "<br>" +
        "Front: %{y}<br>" +
        "Rear: %{x}<br>" +
        "Count: %{customdata}<extra></extra>"
    });

    annotations.push({
      x: (xDomain[0] + xDomain[1]) / 2,
      y: row === 0 ? 0.99 : 0.45,
      xref: "paper",
      yref: "paper",
      text: `<b>${subplotTitles[i]}</b>`,
      showarrow: false,
      font: { size: 14, color: "#111111" },
      xanchor: "center",
      yanchor: "bottom"
    });
  });

  const layout = {
    autosize: true,
    height: 760,
    paper_bgcolor: "#ffffff",
    plot_bgcolor: "#ffffff",
    margin: { l: 100, r: 55, t: 55, b: 95 },
    font: { family: "Arial, sans-serif", size: 12, color: "#111111" },
    annotations,
    xaxis: {
      domain: xDomains[0],
      anchor: "y",
      title: "Rear TCE family",
      tickangle: -35,
      showline: true,
      linecolor: "#222222",
      zeroline: false,
      automargin: true,
      showticklabels: false
    },
    yaxis: {
      domain: yDomains[0],
      anchor: "x",
      title: "Front TCE family",
      showline: true,
      linecolor: "#222222",
      zeroline: false,
      automargin: true,
      showticklabels: true
    },
    xaxis2: {
      domain: xDomains[1],
      anchor: "y2",
      tickangle: -35,
      showline: true,
      linecolor: "#222222",
      zeroline: false,
      automargin: true,
      showticklabels: false
    },
    yaxis2: {
      domain: yDomains[0],
      anchor: "x2",
      showline: true,
      linecolor: "#222222",
      zeroline: false,
      automargin: true,
      showticklabels: false
    },
    xaxis3: {
      domain: xDomains[2],
      anchor: "y3",
      tickangle: -35,
      showline: true,
      linecolor: "#222222",
      zeroline: false,
      automargin: true,
      showticklabels: false
    },
    yaxis3: {
      domain: yDomains[0],
      anchor: "x3",
      showline: true,
      linecolor: "#222222",
      zeroline: false,
      automargin: true,
      showticklabels: false
    },
    xaxis4: {
      domain: xDomains[0],
      anchor: "y4",
      title: "Rear TCE family",
      tickangle: -35,
      showline: true,
      linecolor: "#222222",
      zeroline: false,
      automargin: true,
      showticklabels: true
    },
    yaxis4: {
      domain: yDomains[1],
      anchor: "x4",
      showline: true,
      linecolor: "#222222",
      zeroline: false,
      automargin: true,
      showticklabels: true
    },
    xaxis5: {
      domain: xDomains[1],
      anchor: "y5",
      tickangle: -35,
      showline: true,
      linecolor: "#222222",
      zeroline: false,
      automargin: true,
      showticklabels: true
    },
    yaxis5: {
      domain: yDomains[1],
      anchor: "x5",
      showline: true,
      linecolor: "#222222",
      zeroline: false,
      automargin: true,
      showticklabels: false
    },
    xaxis6: {
      domain: xDomains[2],
      anchor: "y6",
      tickangle: -35,
      showline: true,
      linecolor: "#222222",
      zeroline: false,
      automargin: true,
      showticklabels: true
    },
    yaxis6: {
      domain: yDomains[1],
      anchor: "x6",
      showline: true,
      linecolor: "#222222",
      zeroline: false,
      automargin: true,
      showticklabels: false
    }
  };

  Plotly.react(plotDiv, traces, layout, {
    responsive: true,
    displayModeBar: true
  });
}
