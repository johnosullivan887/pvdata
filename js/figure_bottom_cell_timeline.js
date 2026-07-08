function renderBottomCellTimelinePlot(rows) {
  const base = window.PVDataAdoptionTimeline;
  if (!base) return;

  const categories = ["SHJ", "TOPCon/POLO", "Al-BSF/PERC", "Other"];

  const colorMap = {
    SHJ: "#1f77b4",
    "TOPCon/POLO": "#ff7f0e",
    "Al-BSF/PERC": "#2ca02c",
    Other: "#7f7f7f"
  };

  base.renderStackedAdoptionTimeline({
    rows,
    plotDivId: "bottom-cell-timeline-plot",
    certifiedCheckboxId: "certified-only-bottom-cell-timeline",
    categories,
    classifyRow: (row) => {
      const raw = base.normalizeText(
        base.resolveField(row, ["Cell", "Si Bottom cell type"])
      ).toLowerCase();

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
    },
    colorMap,
    yTitle: "Number of papers"
  });
}
