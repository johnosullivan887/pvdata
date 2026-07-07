const TceMaterialTaxonomy = (() => {
  const familyMeta = {
    "ITO-family": { label: "ITO-family", color: "#1f77b4", symbol: "diamond" },
    "IZO-family": { label: "IZO-family", color: "#ff7f0e", symbol: "circle" },
    "IZrO-family": { label: "IZrO-family", color: "#2ca02c", symbol: "square" },
    "Other InOx": { label: "Other InOx", color: "#9467bd", symbol: "triangle-up" },
    "In-free / alternative": { label: "In-free / alternative", color: "#7f7f7f", symbol: "star" },
    "Metal / reflector": { label: "Metal / reflector", color: "#8c564b", symbol: "triangle-down" },
    "Tunnel junction / interlayer": {
      label: "Tunnel junction / interlayer",
      color: "#e377c2",
      symbol: "x"
    },
    "No layer / no TCE": { label: "No layer / no TCE", color: "#bcbd22", symbol: "cross" },
    "Unclear / other": { label: "Unclear / other", color: "#17becf", symbol: "hourglass" }
  };

  function normalizeText(value) {
    return String(value ?? "")
      .trim()
      .replace(/\s+/g, " ");
  }

  function keyify(value) {
    return normalizeText(value).toLowerCase().replace(/\s+/g, "");
  }

  function containsAny(rawKey, needles) {
    return needles.some((needle) => rawKey.includes(keyify(needle)));
  }

  function familyFromFront(rawValue) {
    const raw = keyify(rawValue);
    if (!raw) return "Unclear / other";

    if (containsAny(raw, ["not clear", "unclear", "other"])) return "Unclear / other";
    if (containsAny(raw, ["izro"])) return "IZrO-family";
    if (containsAny(raw, ["izo"])) return "IZO-family";
    if (containsAny(raw, ["ito"])) return "ITO-family";
    if (containsAny(raw, ["inox", "iwo", "doped inox", "doped-inox", "io:h"])) return "Other InOx";
    if (containsAny(raw, ["agnws", "azo", "moox/au/moox", "in-free", "in free"])) {
      return "In-free / alternative";
    }

    return "Unclear / other";
  }

  function familyFromInterlayer(rawValue) {
    const raw = keyify(rawValue);
    if (!raw) return "Unclear / other";

    if (containsAny(raw, ["not clear", "unclear", "other"])) return "Unclear / other";
    if (containsAny(raw, ["no layer", "none", "no tce", "notce"])) return "No layer / no TCE";

    if (
      containsAny(raw, [
        "siox",
        "si-based",
        "tj",
        "tisi2",
        "tiox",
        "tiny",
        "organic",
        "ito/izo",
        "izo/ito"
      ])
    ) {
      return "Tunnel junction / interlayer";
    }

    if (containsAny(raw, ["izro"])) return "IZrO-family";
    if (containsAny(raw, ["izo"])) return "IZO-family";
    if (containsAny(raw, ["ito"])) return "ITO-family";
    if (containsAny(raw, ["inox", "iwo", "doped inox", "doped-inox", "io:h"])) return "Other InOx";
    if (containsAny(raw, ["zto"])) return "In-free / alternative";

    return "Unclear / other";
  }

  function familyFromRear(rawValue) {
    const raw = keyify(rawValue);
    if (!raw) return "Unclear / other";

    if (containsAny(raw, ["not clear", "unclear", "other"])) return "Unclear / other";
    if (containsAny(raw, ["no tce", "no layer", "none", "notce"])) return "No layer / no TCE";

    if (containsAny(raw, ["izro"])) return "IZrO-family";
    if (containsAny(raw, ["izo"])) return "IZO-family";
    if (containsAny(raw, ["ito"])) return "ITO-family";
    if (containsAny(raw, ["inox", "iwo", "doped inox", "doped-inox", "io:h"])) return "Other InOx";
    if (containsAny(raw, ["azo", "agnws", "in-free", "in free"])) return "In-free / alternative";

    if (containsAny(raw, ["ag", "al", "cr", "ti", "pd", "au"])) return "Metal / reflector";

    return "Unclear / other";
  }

  function familyStyle(name) {
    return familyMeta[name] || familyMeta["Unclear / other"];
  }

  function renderMaterialPlot(rows, options) {
    const base = window.TceMaterialPlotBase;
    if (!base) {
      const plotDiv = document.getElementById(options.plotId);
      if (plotDiv) plotDiv.innerHTML = "<p>Material plot helpers are missing.</p>";
      return;
    }

    const {
      plotId,
      title,
      subtitle = "",
      rawGetter,
      familyGetter,
      certifiedOnlyCheckboxId = "certified-only",
      xRange = [base.parseDate("2015-07-07"), base.parseDate("2025-12-12")],
      yRange = [15, 36],
      xaxisTitle = "Publication date",
      yaxisTitle = "Power conversion efficiency (%)"
    } = options;

    const plotDiv = document.getElementById(plotId);
    if (!plotDiv) return;

    plotDiv.style.width = "100%";
    plotDiv.style.height = "520px";

    const certifiedOnly = document.getElementById(certifiedOnlyCheckboxId)?.checked ?? false;

    const plotRows = rows
      .map((row) => {
        const date = base.parseDate(base.resolveField(row, ["Publishing date", "Date"]));
        const efficiency = base.getEfficiency(row);
        const rawLabel = normalizeText(rawGetter(row));
        const family = familyGetter(rawLabel, row);

        if (!date || efficiency === null || !family) return null;

        return {
          date,
          efficiency,
          rawLabel,
          family,
          certified: base.keyify(base.resolveField(row, ["Certified", "certified"])),
          author: base.getAuthor(row),
          year: base.getYear(row),
          paperUrl: base.getPaperUrl(row)
        };
      })
      .filter(Boolean);

    const familyCounts = plotRows.reduce((acc, row) => {
      acc[row.family] = (acc[row.family] || 0) + 1;
      return acc;
    }, {});

    const allFamilies = Object.keys(familyCounts).sort((a, b) => {
      const diff = familyCounts[b] - familyCounts[a];
      return diff !== 0 ? diff : a.localeCompare(b);
    });

    const visibleRows = certifiedOnly
      ? plotRows.filter((row) => row.certified === "yes")
      : plotRows;

    const legendTraces = allFamilies
      .filter((family) => visibleRows.some((row) => row.family === family))
      .map((family) => {
        const style = familyStyle(family);

        return {
          type: "scatter",
          mode: "markers",
          name: family,
          x: [null],
          y: [null],
          showlegend: true,
          hoverinfo: "skip",
          marker: {
            symbol: style.symbol,
            size: 11,
            color: "white",
            line: {
              color: style.color,
              width: 2
            }
          }
        };
      });

    const dataTraces = allFamilies
      .filter((family) => visibleRows.some((row) => row.family === family))
      .map((family) => {
        const style = familyStyle(family);
        const group = visibleRows.filter((row) => row.family === family);

        return {
          type: "scatter",
          mode: "markers",
          name: family,
          showlegend: false,
          x: group.map((row) => row.date),
          y: group.map((row) => row.efficiency),
          customdata: group.map((row) => [
            row.author,
            row.year,
            row.paperUrl,
            row.family,
            row.rawLabel
          ]),
          marker: {
            symbol: style.symbol,
            size: 10,
            color: style.color,
            opacity: 0.8,
            line: { color: "#1a1a1a", width: 0.7 }
          },
          hovertemplate:
            "<b>%{x|%Y-%m-%d}</b><br>" +
            "Efficiency: %{y:.2f}%<br>" +
            "Family: %{customdata[3]}<br>" +
            "Raw label: %{customdata[4]}<br>" +
            "Author: %{customdata[0]}<br>" +
            "Year: %{customdata[1]}<extra></extra>"
        };
      });

    const layout = {
      autosize: true,
      height: 520,
      margin: { l: 65, r: 20, t: 95, b: 55 },
      paper_bgcolor: "#ffffff",
      plot_bgcolor: "#ffffff",
      font: {
        family: "Arial, sans-serif",
        size: 13,
        color: "#111111"
      },
      title: {
        text:
          `<b>${title}</b>` +
          (subtitle ? `<br><span style="font-size:12px;color:#5c6b82;">${subtitle}</span>` : ""),
        x: 0.02,
        xanchor: "left",
        y: 0.98,
        yanchor: "top",
        font: { size: 18, color: "#10233f" }
      },
      xaxis: {
        title: xaxisTitle,
        tickformat: "%Y",
        dtick: "M12",
        range: xRange,
        showline: true,
        linecolor: "#666666",
        zeroline: false,
        showgrid: true,
        gridcolor: "#e6e6e6",
        gridwidth: 0.6
      },
      yaxis: {
        title: yaxisTitle,
        range: yRange,
        dtick: 5,
        showline: true,
        linecolor: "#666666",
        zeroline: false,
        showgrid: true,
        gridcolor: "#e6e6e6",
        gridwidth: 0.6
      },
      legend: {
        orientation: "v",
        x: 0.98,
        y: 0.98,
        xanchor: "right",
        yanchor: "top",
        bgcolor: "rgba(255,255,255,1)",
        bordercolor: "#d0d0d0",
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

  return {
    normalizeText,
    keyify,
    familyMeta,
    familyFromFront,
    familyFromInterlayer,
    familyFromRear,
    familyStyle,
    renderMaterialPlot
  };
})();

window.TceMaterialTaxonomy = TceMaterialTaxonomy;
