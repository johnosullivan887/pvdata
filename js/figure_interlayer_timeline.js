function renderInterlayerTimelinePlot(rows) {
  const base = window.PVDataAdoptionTimeline;
  const tax = window.TceMaterialTaxonomy;
  if (!base || !tax) return;

  const categories = [
    "ITO-family",
    "IZO-family",
    "IZrO-family",
    "Other InOx",
    "In-free / alternative",
    "Tunnel junction / interlayer",
    "No layer / no TCE",
    "Unclear / other"
  ];

  const colorMap = Object.fromEntries(
    categories.map((cat) => [cat, tax.familyStyle(cat).color])
  );

  base.renderStackedAdoptionTimeline({
    rows,
    plotDivId: "interlayer-timeline-plot",
    certifiedCheckboxId: "certified-only-interlayer-timeline",
    categories,
    classifyRow: (row) => {
      const raw = base.resolveField(row, ["Interlayer TCE", "Inter-layer"]);
      return tax.familyFromInterlayer(raw);
    },
    colorMap,
    yTitle: "Number of papers"
  });
}
