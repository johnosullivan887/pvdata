function renderRearTimelinePlot(rows) {
  const base = window.PVDataAdoptionTimeline;
  const tax = window.TceMaterialTaxonomy;
  if (!base || !tax) return;

  const categories = [
    "ITO-family",
    "IZO-family",
    "IZrO-family",
    "Other InOx",
    "In-free / alternative",
    "Metal / reflector",
    "No layer / no TCE",
    "Unclear / other"
  ];

  const colorMap = Object.fromEntries(
    categories.map((cat) => [cat, tax.familyStyle(cat).color])
  );

  base.renderStackedAdoptionTimeline({
    rows,
    plotDivId: "rear-timeline-plot",
    certifiedCheckboxId: "certified-only-rear-timeline",
    title: "Rear TCE adoption timeline",
    categories,
    classifyRow: (row) => {
      const raw = base.resolveField(row, ["Rear electrode", "Rear Electrode"]);
      return tax.familyFromRear(raw);
    },
    colorMap,
    yTitle: "Number of papers"
  });
}
