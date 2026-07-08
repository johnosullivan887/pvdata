function renderCombinationHeatmap(rows) {
  const plotDiv = document.getElementById("heatmap-plot");
  if (!plotDiv) return;

  const tax = window.TceMaterialTaxonomy;
  if (!tax) {
    plotDiv.innerHTML = "<p>TCE plot helpers are missing.</p>";
    return;
  }

  plotDiv.style.width = "100%";
  plotDiv.style.height = "700px";

  const certifiedOnly =
    document.getElementById("certified-only-heatmap")?.checked ??
    document.getElementById("certified-only")?.checked ??
    false;

  const normalize = (value) =>
    String(value ?? "")
      .trim()
      .replace(/\s+/g, " ");

  const keyify = (value) =>
    normalize(value).toLowerCase().replace(/\s+/g, "");

  const getFrontFamily = (row) =>
    tax.familyFromFront(getValue(row, "Front TCE (fTCE)", "Front TCO"));

  const getRearFamily = (row) =>
    tax.familyFromRear(getValue(row, "Rear electrode", "Rear Electrode"));

  const getInterFamily = (row) => {
    const raw = normalize(getValue(row, "Interlayer TCE", "Inter-layer"));
    const k = keyify(raw);

    if (!k) return null;

    if (k.includes("notclear") || k.includes("unclear") || k.includes("other")) {
      return "Other / unclear";
    }

    if (k.includes("nolayer") || k.includes("none") || k.includes("notce")) {
      return "None";
    }

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
      k.includes("zto") ||
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
      front: getFrontFamily(row),
      rear: getRearFamily(row),
      inter: getInterFamily(row),
      certified: baseKey(getValue(row, "Certified", "certified"))
    }))
    .filter((row) => row.front && row.rear && row.inter)
    .filter((row) => (certifiedOnly ? row.certified === "yes" : true));

  function baseKey(value) {
    return String(value ?? "").trim().toLowerCase();
  }

  if (!visibleRows.length) {
    plotDiv.innerHTML = "<p>No rows match the current filters.</p>";
    return;
  }

  function countMatrix(frontList, rearList, subset) {
    return frontList.map((front) =>
      rearList.map(
        (rear) =>
          subset.filter((row) => row.front === front && row.rear === rear).length
      )
    );
  }

  function logMatrix(counts) {
    return counts.map((row) => row.map((v) => Math.log10(v + 1)));
  }

  function maxCount(counts) {
    return Math.max(...counts.flat(), 0);
  }

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
    [0.00, 0.29],
    [0.355, 0.645],
    [0.71, 1.00]
  ];

  const yDomains = [
    [0.60, 1.00],
    [0.00, 0.36]
  ];

  const subplotTitles = [
    "ITO",
    "IZO",
    "Other indium-based",
    "Indium-free TCO",
    "Tunnel junction",
    "None"
  ];

  const subplotData = interCats.map((interLabel) => {
    const subset = visibleRows.filter((row) => row.inter === interLabel);
    const counts = countMatrix(frontCats, rearCats, subset);
    return {
      interLabel,
      subset,
      counts,
      logCounts: logMatrix(counts),
      maxCount: maxCount(counts)
    };
  });

  const globalMaxCount = Math.max(...subplotData.map((d) => d.maxCount), 1);
  const globalMaxLog = Math.log10(globalMaxCount + 1);

  const tickCounts = [0, 1, 2, 5, 10, 20, 50, 100];
  const tickVals = tickCounts
    .map((v) => Math.log10(v + 1))
    .filter((v) => v <= globalMaxLog + 1e-9);
  const tickText = tickCounts
    .map((v) => String(v))
    .slice(0, tickVals.length);

  const traces = [];
  const annotations = [];

  subplotData.forEach((block, i) => {
    const col = i % 3;
    const row = i < 3 ? 0 : 1;
    const xaxisName = i === 0 ? "x" : `x${i + 1}`;
    const yaxisName = i === 0 ? "y" : `y${i + 1}`;

    const xDomain = xDomains[col];
    const yDomain = yDomains[row];

    traces.push({
      type: "heatmap",
      x: rearCats,
      y: frontCats,
      z: block.logCounts,
      customdata: countMatrix(frontCats, rearCats, block.subset),
      text: countMatrix(frontCats, rearCats, block.subset).map((r) =>
        r.map((v) => (v > 0 ? String(v) : ""))
      ),
      texttemplate: "%{text}",
      textfont: { size: 10, color: "#111111" },
      colorscale,
      zmin: 0,
      zmax: globalMaxLog,
      showscale: i === subplotData.length - 1,
      colorbar: i === subplotData.length - 1 ? {
        title: "Count",
        tickmode: "array",
        tickvals: tickVals,
        ticktext: tickText,
        thickness: 18,
        outlinewidth: 0.8,
        outlinecolor: "#222222"
      } : undefined,
      hovertemplate:
        "Interlayer: " + block.interLabel + "<br>" +
        "Front: %{y}<br>" +
        "Rear: %{x}<br>" +
        "Count: %{customdata}<extra></extra>",
      xaxis: xaxisName,
      yaxis: yaxisName,
      hoverongaps: false
    });

    annotations.push({
      x: (xDomain[0] + xDomain[1]) / 2,
      y: yDomain[1] + 0.04,
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
    height: 860,
    paper_bgcolor: "#ffffff",
    plot_bgcolor: "#ffffff",
    margin: { l: 100, r: 80, t: 55, b: 90 },
    font: { family: "Arial, sans-serif", size: 12, color: "#111111" },
    annotations,
    xaxis: {
      domain: xDomains[0],
      anchor: "y",
      title: "Rear TCE Family",
      tickangle: -35,
      tickfont: { size: 10 },
      showline: true,
      linecolor: "#222222",
      zeroline: false,
      automargin: true,
      showticklabels: true
    },
    yaxis: {
      domain: yDomains[0],
      anchor: "x",
      title: "Front TCE Family",
      tickfont: { size: 10 },
      autorange: "reversed",
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
      tickfont: { size: 10 },
      showline: true,
      linecolor: "#222222",
      zeroline: false,
      automargin: true
    },
    yaxis2: {
      domain: yDomains[0],
      anchor: "x2",
      tickfont: { size: 10 },
      autorange: "reversed",
      showline: true,
      linecolor: "#222222",
      zeroline: false,
      automargin: true
    },
    xaxis3: {
      domain: xDomains[2],
      anchor: "y3",
      tickfont: { size: 10 },
      tickangle: -35,
      showline: true,
      linecolor: "#222222",
      zeroline: false,
      automargin: true
    },
    yaxis3: {
      domain: yDomains[0],
      anchor: "x3",
      tickfont: { size: 10 },
      autorange: "reversed",
      showline: true,
      linecolor: "#222222",
      zeroline: false,
      automargin: true
    },
    xaxis4: {
      domain: xDomains[0],
      anchor: "y4",
      tickfont: { size: 10 },
      tickangle: -35,
      showline: true,
      linecolor: "#222222",
      zeroline: false,
      automargin: true
    },
    yaxis4: {
      domain: yDomains[1],
      anchor: "x4",
      tickfont: { size: 10 },
      autorange: "reversed",
      showline: true,
      linecolor: "#222222",
      zeroline: false,
      automargin: true
    },
    xaxis5: {
      domain: xDomains[1],
      anchor: "y5",
      tickfont: { size: 10 },
      tickangle: -35,
      showline: true,
      linecolor: "#222222",
      zeroline: false,
      automargin: true
    },
    yaxis5: {
      domain: yDomains[1],
      anchor: "x5",
      tickfont: { size: 10 },
      autorange: "reversed",
      showline: true,
      linecolor: "#222222",
      zeroline: false,
      automargin: true
    },
    xaxis6: {
      domain: xDomains[2],
      anchor: "y6",
      tickfont: { size: 10 },
      tickangle: -35,
      showline: true,
      linecolor: "#222222",
      zeroline: false,
      automargin: true
    },
    yaxis6: {
      domain: yDomains[1],
      anchor: "x6",
      tickfont: { size: 10 },
      autorange: "reversed",
      showline: true,
      linecolor: "#222222",
      zeroline: false,
      automargin: true
    }
  };

  Plotly.react(plotDiv, traces, layout, {
    responsive: true,
    displayModeBar: true
  });
}
