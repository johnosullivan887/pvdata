function renderTimelinePlot(rows) {
  const base = window.PVDataAdoptionTimeline;
  const tax = window.TceMaterialTaxonomy;
  if (!base || !tax) return;

  const categories = [
    "ITO-family",
    "IZO-family",
    "IZrO-family",
    "Other InOx",
    "In-free / alternative",
    "Unclear / other"
  ];

  const colorMap = Object.fromEntries(
    categories.map((cat) => [cat, tax.familyStyle(cat).color])
  );

  base.renderStackedAdoptionTimeline({
    rows,
    plotDivId: "timeline-plot",
    certifiedCheckboxId: "certified-only-timeline",
    categories,
    classifyRow: (row) => {
      const raw = base.resolveField(row, ["Front TCE (fTCE)", "Front TCO"]);
      return tax.familyFromFront(raw);
    },
    colorMap,
    yTitle: "Number of papers"
  });
}
