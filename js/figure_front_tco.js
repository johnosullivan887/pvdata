function renderFrontTcoPlot(rows) {
  const base = window.TceMaterialPlotBase;
  const tax = window.TceMaterialTaxonomy;

  if (!base || !tax) {
    const plotDiv = document.getElementById("front-tco-plot");
    if (plotDiv) plotDiv.innerHTML = "<p>TCE plot helpers are missing.</p>";
    return;
  }

  tax.renderMaterialPlot(rows, {
    plotId: "front-tco-plot",
    title: "Front TCE materials",
    subtitle: "Window electrode materials used in tandem devices",
    rawGetter: (row) => base.resolveField(row, ["Front TCO", "Front TCE (fTCE)"]),
    familyGetter: tax.familyFromFront
  });
}
