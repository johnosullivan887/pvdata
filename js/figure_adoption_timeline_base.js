const PVDataAdoptionTimeline = (() => {
  function normalizeText(value) {
    return String(value ?? "")
      .trim()
      .replace(/\s+/g, " ");
  }

  function keyify(value) {
    return normalizeText(value).toLowerCase().replace(/\s+/g, "");
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

  function getYearNumber(row) {
    const yearRaw = resolveField(row, ["Year"]);
    if (yearRaw) {
      const yearMatch = String(yearRaw).match(/(19|20)\d{2}/);
      if (yearMatch) return Number(yearMatch[0]);

      const numericYear = Number(yearRaw);
      if (Number.isFinite(numericYear)) return numericYear;
    }

    const dateRaw = resolveField(row, ["Publishing date", "Date"]);
    const parsed = new Date(String(dateRaw ?? ""));
    if (!isNaN(parsed.getTime())) return parsed.getFullYear();

    return NaN;
  }

  function isCertified(row) {
    const v = resolveField(row, ["Certified (yes/no)", "Certified", "certified"]);
    return String(v ?? "").trim().toLowerCase() === "yes";
  }

  function renderStackedAdoptionTimeline({
    rows,
    plotDivId,
    certifiedCheckboxId,
    categories,
    classifyRow,
    colorMap,
    yTitle = "Number of papers"
  }) {
    const plotDiv = document.getElementById(plotDivId);
    if (!plotDiv) return;

    plotDiv.style.width = "100%";
    plotDiv.style.height = "420px";

    const certifiedOnly = document.getElementById(certifiedCheckboxId)?.checked ?? false;

    const classifiedRows = rows
      .map((row) => {
        const yearNum = getYearNumber(row);
        const category = classifyRow(row);

        return {
          yearNum,
          category,
          certified: isCertified(row)
        };
      })
      .filter((row) => Number.isFinite(row.yearNum) && row.category);

    const visibleRows = certifiedOnly
      ? classifiedRows.filter((row) => row.certified)
      : classifiedRows;

    if (!visibleRows.length) {
      plotDiv.innerHTML = "<p>No rows match the current filters.</p>";
      return;
    }

    const years = [...new Set(visibleRows.map((row) => row.yearNum))].sort((a, b) => a - b);
    const yearIso = years.map((year) => new Date(year, 0, 1).toISOString());

    const traces = categories
      .map((category) => {
        const counts = years.map(
          (year) =>
            visibleRows.filter((row) => row.yearNum === year && row.category === category).length
        );

        if (!counts.some((v) => v > 0)) return null;

        return {
          type: "bar",
          name: category,
          x: yearIso,
          y: counts,
          marker: {
            color: colorMap?.[category] || "#999999"
          },
          hovertemplate:
            "Year: %{x|%Y}<br>" +
            "Category: " + category + "<br>" +
            "Count: %{y}<extra></extra>"
        };
      })
      .filter(Boolean);

    if (!traces.length) {
      plotDiv.innerHTML = "<p>No rows match the current filters.</p>";
      return;
    }

    const minYear = years[0];
    const maxYear = years[years.length - 1];

    const layout = {
      autosize: true,
      height: 420,
      paper_bgcolor: "#ffffff",
      plot_bgcolor: "#ffffff",
      margin: { l: 65, r: 120, t: 18, b: 55 },
      font: {
        family: "Arial, sans-serif",
        size: 13,
        color: "#111111"
      },
      barmode: "stack",
      xaxis: {
        title: "Publication year",
        type: "date",
        tickformat: "%Y",
        dtick: "M12",
        range: [new Date(minYear, 0, 1).toISOString(), new Date(maxYear, 11, 31).toISOString()],
        showline: true,
        linecolor: "#222222",
        zeroline: false,
        showgrid: true,
        gridcolor: "#e6e6e6",
        gridwidth: 0.6
      },
      yaxis: {
        title: yTitle,
        showline: true,
        linecolor: "#222222",
        zeroline: false,
        showgrid: true,
        gridcolor: "#e6e6e6",
        gridwidth: 0.6
      },
      legend: {
        orientation: "v",
        x: 1.02,
        y: 1,
        xanchor: "left",
        yanchor: "top",
        bgcolor: "rgba(255,255,255,0.95)",
        bordercolor: "#d0d0d0",
        borderwidth: 1,
        font: { size: 12 }
      }
    };

    Plotly.react(plotDiv, traces, layout, {
      responsive: true,
      displayModeBar: true
    });
  }

  return {
    normalizeText,
    keyify,
    resolveField,
    getYearNumber,
    isCertified,
    renderStackedAdoptionTimeline
  };
})();

window.PVDataAdoptionTimeline = PVDataAdoptionTimeline;
