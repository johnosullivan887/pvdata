function renderInterlayerTcePlot(rows) {
  const base = window.TceMaterialPlotBase;
  const tax = window.TceMaterialTaxonomy;

  if (!base || !tax) {
    const plotDiv = document.getElementById("interlayer-tce-plot");
    if (plotDiv) plotDiv.innerHTML = "<p>TCE plot helpers are missing.</p>";
    return;
  }

  tax.renderMaterialPlot(rows, {
    plotId: "interlayer-tce-plot",
    title: "Interconnection layer materials",
    subtitle: "Recombination layers and tunnel junctions in tandem devices",
    rawGetter: (row) => base.resolveField(row, ["Interlayer TCE", "Inter-layer"]),
    familyGetter: tax.familyFromInterlayer
  });
}
