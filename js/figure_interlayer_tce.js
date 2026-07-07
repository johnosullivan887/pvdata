function renderRearTcePlot(rows) {
  const base = window.TceMaterialPlotBase;
  const tax = window.TceMaterialTaxonomy;

  if (!base || !tax) {
    const plotDiv = document.getElementById("rear-tce-plot");
    if (plotDiv) plotDiv.innerHTML = "<p>TCE plot helpers are missing.</p>";
    return;
  }

  tax.renderMaterialPlot(rows, {
    plotId: "rear-tce-plot",
    title: "Rear electrode materials",
    subtitle: "Back-contact and rear transparent electrode materials",
    rawGetter: (row) => base.resolveField(row, ["Rear electrode", "Rear Electrode"]),
    familyGetter: tax.familyFromRear
  });
}
