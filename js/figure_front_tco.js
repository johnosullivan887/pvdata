function renderFrontTcoPlot(rows) {
  const plotDiv = document.getElementById("front-tco-plot");
  if (!plotDiv) return;

  const base = window.TceMaterialPlotBase;
  const tax = window.TceMaterialTaxonomy;

  if (!base || !tax) {
    plotDiv.innerHTML = "<p>TCE plot helpers are missing.</p>";
    return;
  }

  plotDiv.style.width = "100%";
  plotDiv.style.height = "520px";

  const certifiedOnly = document.getElementById("certified-only")?.checked ?? false;


  const plotRows = rows
  .map((row) => {
    const dateText = base.resolveField(row, ["Publishing date", "Date"]);
    const yearText = base.getYear(row);
    const date =
      base.parseDate(dateText) ||
      (yearText ? new Date(Number(yearText), 0, 1) : null);

    const efficiency = base.getEfficiency(row);
    const rawLabel = tax.normalizeText(base.resolveField(row, ["Front TCO", "Front TCE (fTCE)"]));
    const family = tax.familyFrom...(rawLabel);

    if (!Number.isFinite(efficiency) || !family) return null;

    return {
      date,
      efficiency,
      rawLabel,
      family,
      certified: base.keyify(base.resolveField(row, ["Certified", "certified"])),
      author: base.getAuthor(row),
      year: yearText,
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
      const style = tax.familyStyle(family);

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
      const style = tax.familyStyle(family);
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
    margin: { l: 65, r: 20, t: 45, b: 55 },
    paper_bgcolor: "#ffffff",
    plot_bgcolor: "#ffffff",
    font: {
      family: "Arial, sans-serif",
      size: 13,
      color: "#111111"
    },
    xaxis: {
      title: "Publication date",
      tickformat: "%Y",
      dtick: "M12",
      range: [base.parseDate("2015-07-07"), base.parseDate("2025-12-12")],
      showline: true,
      linecolor: "#666666",
      zeroline: false,
      showgrid: true,
      gridcolor: "#e6e6e6",
      gridwidth: 0.6
    },
    yaxis: {
      title: "Power conversion efficiency (%)",
      range: [15, 36],
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
