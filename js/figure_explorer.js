const PVDataExplorer = (() => {
  function normalizeText(value) {
    return String(value ?? "").trim().replace(/\s+/g, " ");
  }

  function toNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const n = Number(String(value).replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : null;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function median(values) {
    const arr = values.filter((v) => Number.isFinite(v)).slice().sort((a, b) => a - b);
    if (!arr.length) return NaN;
    const mid = Math.floor(arr.length / 2);
    return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
  }

  function logSafe(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.log10(n);
  }

  function parseYear(row) {
    const yearRaw = getValue(row, "Year");
    if (yearRaw) {
      const m = String(yearRaw).match(/(19|20)\d{2}/);
      if (m) return Number(m[0]);
      const n = Number(yearRaw);
      if (Number.isFinite(n)) return n;
    }

    const dateRaw = getValue(row, "Publishing date", "Date");
    const m = String(dateRaw).match(/(19|20)\d{2}/);
    if (m) return Number(m[0]);

    const d = new Date(String(dateRaw ?? ""));
    return isNaN(d.getTime()) ? NaN : d.getFullYear();
  }

  function getCertified(row) {
    const v = getValue(row, "Certified (yes/no)", "Certified", "certified");
    const s = String(v ?? "").trim().toLowerCase();
    if (s === "yes") return "yes";
    if (s === "no") return "no";
    return "";
  }

  function classifyBottom(row) {
    const raw = normalizeText(getValue(row, "Cell", "Si Bottom cell type")).toLowerCase();

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
  }

  function buildExplorerRow(row, index) {
    const front = TceMaterialTaxonomy.familyFromFront(
      getValue(row, "Front TCE (fTCE)", "Front TCO")
    );
    const inter = TceMaterialTaxonomy.familyFromInterlayer(
      getValue(row, "Interlayer TCE", "Inter-layer")
    );
    const rear = TceMaterialTaxonomy.familyFromRear(
      getValue(row, "Rear Electrode", "Rear electrode")
    );

    const efficiency = toNumber(getValue(row, "η (%)", "n tandem", "Efficiency"));
    const area = toNumber(
      getValue(row, "Active Area (cm2)", "Cell active area", "Active area", "Area")
    );
    const yearNum = parseYear(row);
    const certified = getCertified(row);
    const bottom = classifyBottom(row);

    let indiumMgW = null;
    if (window.PVDataIndium && typeof window.PVDataIndium.computeRow === "function") {
      const computed = window.PVDataIndium.computeRow(row);
      indiumMgW = computed && Number.isFinite(computed.totalMgW) ? computed.totalMgW : null;
    }

    if (!front || !inter || !rear || !bottom || !Number.isFinite(efficiency)) return null;

    return {
      index,
      row,
      author: normalizeText(getValue(row, "Author")) || "Unknown",
      yearLabel: normalizeText(getValue(row, "Year")) || (Number.isFinite(yearNum) ? String(yearNum) : ""),
      yearNum,
      front,
      inter,
      rear,
      bottom,
      efficiency,
      area,
      indiumMgW,
      certified,
      paperUrl: getValue(row, "Reference", "Reference link", "DOI"),
      sourceText: [
        getValue(row, "Author"),
        getValue(row, "Publishing date", "Date", "Year"),
        front,
        inter,
        rear,
        bottom
      ]
        .join(" | ")
        .toLowerCase()
    };
  }

  function buildExplorerRows(rows) {
    return rows
      .map((row, index) => buildExplorerRow(row, index))
      .filter(Boolean);
  }

  function countBy(rows, key) {
    const out = new Map();
    rows.forEach((row) => {
      const value = row[key];
      if (!value) return;
      out.set(value, (out.get(value) || 0) + 1);
    });
    return out;
  }

  function getBuilderFilters() {
    return {
      front: document.getElementById("explorer-front")?.value || "Any",
      inter: document.getElementById("explorer-inter")?.value || "Any",
      rear: document.getElementById("explorer-rear")?.value || "Any",
      bottom: document.getElementById("explorer-bottom")?.value || "Any"
    };
  }

  function matchesBuilderFilters(row, filters) {
    if (filters.front !== "Any" && row.front !== filters.front) return false;
    if (filters.inter !== "Any" && row.inter !== filters.inter) return false;
    if (filters.rear !== "Any" && row.rear !== filters.rear) return false;
    if (filters.bottom !== "Any" && row.bottom !== filters.bottom) return false;
    return true;
  }

  function formatMetric(value, digits = 1) {
    return Number.isFinite(value) ? value.toFixed(digits) : "n/a";
  }

  function paperLink(url) {
    const ref = String(url ?? "").trim();
    if (!ref) return "";

    if (/^https?:\/\//i.test(ref)) {
      return `<a href="${escapeHtml(ref)}" target="_blank" rel="noopener noreferrer">Open</a>`;
    }

    if (/^10\.\d{4,9}\//i.test(ref)) {
      const doiUrl = `https://doi.org/${ref}`;
      return `<a href="${escapeHtml(doiUrl)}" target="_blank" rel="noopener noreferrer">Open</a>`;
    }

    return escapeHtml(ref);
  }

  function renderStatsCards(targetEl, rows, sourceLabel) {
    const effs = rows.map((r) => r.efficiency).filter(Number.isFinite);
    const areas = rows.map((r) => r.area).filter(Number.isFinite);
    const indium = rows.map((r) => r.indiumMgW).filter(Number.isFinite);

    const best = effs.length ? Math.max(...effs) : NaN;

    targetEl.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${rows.length}</div>
          <div class="stat-label">${sourceLabel}</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${formatMetric(best, 2)}</div>
          <div class="stat-label">Best efficiency (%)</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${formatMetric(median(effs), 2)}</div>
          <div class="stat-label">Median efficiency (%)</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${formatMetric(median(areas), 2)}</div>
          <div class="stat-label">Median active area (cm²)</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${formatMetric(median(indium), 3)}</div>
          <div class="stat-label">Median indium use (mg W⁻¹)</div>
        </div>
      </div>
    `;
  }

  function renderBuilderTable(rows) {
    const wrap = document.getElementById("explorer-builder-table-wrap");
    if (!wrap) return;

    if (!rows.length) {
      wrap.innerHTML = "<p>No matching cells.</p>";
      return;
    }

    const sorted = rows
      .slice()
      .sort((a, b) => {
        const da = Number.isFinite(a.efficiency) ? a.efficiency : -Infinity;
        const db = Number.isFinite(b.efficiency) ? b.efficiency : -Infinity;
        if (db !== da) return db - da;
        const ya = Number.isFinite(a.yearNum) ? a.yearNum : -Infinity;
        const yb = Number.isFinite(b.yearNum) ? b.yearNum : -Infinity;
        return yb - ya;
      })
      .slice(0, 25);

    const body = sorted
      .map(
        (r) => `
          <tr>
            <td>
              <button type="button" class="explorer-source-button" data-explorer-source-index="${r.index}">
                Compare
              </button>
            </td>
            <td>${escapeHtml(r.author)}</td>
            <td>${escapeHtml(r.yearLabel)}</td>
            <td>${formatMetric(r.efficiency, 2)}</td>
            <td>${escapeHtml(r.front)}</td>
            <td>${escapeHtml(r.inter)}</td>
            <td>${escapeHtml(r.rear)}</td>
            <td>${escapeHtml(r.bottom)}</td>
            <td>${formatMetric(r.area, 2)}</td>
            <td>${formatMetric(r.indiumMgW, 3)}</td>
            <td>${escapeHtml(r.certified || "")}</td>
            <td>${paperLink(r.paperUrl)}</td>
          </tr>
        `
      )
      .join("");

    wrap.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Compare</th>
            <th>Author</th>
            <th>Year</th>
            <th>Efficiency (%)</th>
            <th>Front</th>
            <th>Interlayer</th>
            <th>Rear</th>
            <th>Bottom</th>
            <th>Area</th>
            <th>Indium</th>
            <th>Certified</th>
            <th>Reference</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    `;
  }

  function renderBuilder(rows) {
    const summaryEl = document.getElementById("explorer-builder-summary");
    if (!summaryEl) return;

    const filters = getBuilderFilters();
    const filtered = rows.filter((row) => matchesBuilderFilters(row, filters));

    window.filteredExplorerArchitectureRows = filtered;

    renderStatsCards(summaryEl, filtered, "Matching cells");
    renderBuilderTable(filtered);
  }

  function hexToRgba(hex, alpha) {
    const h = String(hex || "").replace("#", "");
    if (h.length !== 6) return `rgba(0,0,0,${alpha})`;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function stageNodes(rows, key, prefix, colorFn) {
    const counts = countBy(rows, key);
    return [...counts.entries()]
      .filter(([, count]) => count > 0)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([label, count]) => ({
        label: `${prefix}${label}`,
        stageLabel: label,
        count,
        color: colorFn(label)
      }));
  }

  function renderSankey(rows) {
    const plotDiv = document.getElementById("explorer-sankey-plot");
    if (!plotDiv) return;

    if (!rows.length) {
      plotDiv.innerHTML = "<p>No rows match the current filters.</p>";
      return;
    }

    const frontNodes = stageNodes(rows, "front", "Front: ", (label) =>
      TceMaterialTaxonomy.familyStyle(label).color
    );
    const interNodes = stageNodes(rows, "inter", "Inter: ", (label) =>
      TceMaterialTaxonomy.familyStyle(label).color
    );
    const rearNodes = stageNodes(rows, "rear", "Rear: ", (label) =>
      TceMaterialTaxonomy.familyStyle(label).color
    );

    const bottomPalette = {
      SHJ: "#1f77b4",
      "TOPCon/POLO": "#ff7f0e",
      "Al-BSF/PERC": "#2ca02c",
      Other: "#7f7f7f"
    };
    const bottomNodes = stageNodes(rows, "bottom", "Bottom: ", (label) => bottomPalette[label] || "#777777");

    const stages = [
      { nodes: frontNodes, x: 0.02 },
      { nodes: interNodes, x: 0.34 },
      { nodes: rearNodes, x: 0.66 },
      { nodes: bottomNodes, x: 0.98 }
    ];

    const labels = [];
    const colors = [];
    const xs = [];
    const ys = [];
    const lookup = new Map();

    stages.forEach((stage, stageIndex) => {
      const n = stage.nodes.length;
      stage.nodes.forEach((node, i) => {
        const id = labels.length;
        labels.push(node.label);
        colors.push(node.color);
        xs.push(stage.x);
        ys.push(n === 1 ? 0.5 : 0.03 + (0.92 * i) / Math.max(n - 1, 1));
        lookup.set(`${stageIndex}:${node.stageLabel}`, id);
      });
    });

    const links = new Map();

    function addLink(source, target) {
      const key = `${source}|||${target}`;
      links.set(key, (links.get(key) || 0) + 1);
    }

    rows.forEach((row) => {
      addLink(`0:${row.front}`, `1:${row.inter}`);
      addLink(`1:${row.inter}`, `2:${row.rear}`);
      addLink(`2:${row.rear}`, `3:${row.bottom}`);
    });

    const source = [];
    const target = [];
    const value = [];
    const linkColor = [];

    links.forEach((count, key) => {
      const [s, t] = key.split("|||");
      const sIndex = lookup.get(s);
      const tIndex = lookup.get(t);
      if (!Number.isFinite(sIndex) || !Number.isFinite(tIndex)) return;

      source.push(sIndex);
      target.push(tIndex);
      value.push(count);
      linkColor.push(hexToRgba(colors[sIndex], 0.25));
    });

    const trace = {
      type: "sankey",
      arrangement: "snap",
      node: {
        label: labels,
        color: colors,
        pad: 16,
        thickness: 18,
        x: xs,
        y: ys,
        line: { color: "#444444", width: 0.5 },
        hovertemplate: "%{label}<extra></extra>"
      },
      link: {
        source,
        target,
        value,
        color: linkColor,
        hovertemplate: "%{source.label} → %{target.label}<br>Count: %{value}<extra></extra>"
      }
    };

    const layout = {
      autosize: true,
      height: 760,
      paper_bgcolor: "#ffffff",
      plot_bgcolor: "#ffffff",
      margin: { l: 20, r: 20, t: 20, b: 20 },
      font: { family: "Arial, sans-serif", size: 12, color: "#111111" }
    };

    Plotly.react(plotDiv, [trace], layout, {
      responsive: true,
      displayModeBar: true
    });
  }

  function getSourceRows(rows) {
    const query = normalizeText(document.getElementById("explorer-source-search")?.value || "").toLowerCase();

    const filtered = rows
      .filter((row) => {
        if (!query) return true;
        return (
          row.author.toLowerCase().includes(query) ||
          row.yearLabel.toLowerCase().includes(query) ||
          row.front.toLowerCase().includes(query) ||
          row.inter.toLowerCase().includes(query) ||
          row.rear.toLowerCase().includes(query) ||
          row.bottom.toLowerCase().includes(query)
        );
      })
      .slice()
      .sort((a, b) => (Number.isFinite(b.yearNum) ? b.yearNum : -Infinity) - (Number.isFinite(a.yearNum) ? a.yearNum : -Infinity));

    return filtered.slice(0, 25);
  }

  function similarityDistance(a, b) {
    let d = 0;

    d += a.front === b.front ? 0 : 3.0;
    d += a.inter === b.inter ? 0 : 3.0;
    d += a.rear === b.rear ? 0 : 3.0;
    d += a.bottom === b.bottom ? 0 : 1.5;

    if (Number.isFinite(a.efficiency) && Number.isFinite(b.efficiency)) {
      d += Math.abs(a.efficiency - b.efficiency) / 4.0;
    }

    if (Number.isFinite(a.area) && Number.isFinite(b.area)) {
      d += Math.abs(logSafe(a.area + 0.01) - logSafe(b.area + 0.01)) * 1.25;
    }

    if (Number.isFinite(a.indiumMgW) && Number.isFinite(b.indiumMgW)) {
      d += Math.abs(logSafe(a.indiumMgW + 0.001) - logSafe(b.indiumMgW + 0.001)) * 1.0;
    }

    if (Number.isFinite(a.yearNum) && Number.isFinite(b.yearNum)) {
      d += Math.abs(a.yearNum - b.yearNum) / 10.0;
    }

    if ((a.certified || "") !== (b.certified || "")) {
      d += 0.25;
    }

    return d;
  }

  function renderCandidateTable(rows) {
    const wrap = document.getElementById("explorer-source-results-wrap");
    if (!wrap) return;

    const queryRows = getSourceRows(rows);
    if (!queryRows.length) {
      wrap.innerHTML = "<p>No matching cells.</p>";
      return;
    }

    const selectedIndex = Number(window.__explorerSourceIndex);
    const body = queryRows
      .map(
        (r) => `
          <tr ${r.index === selectedIndex ? 'style="background:#f6f9ff;"' : ""}>
            <td>
              <button type="button" class="explorer-source-button" data-explorer-source-index="${r.index}">
                Use
              </button>
            </td>
            <td>${escapeHtml(r.author)}</td>
            <td>${escapeHtml(r.yearLabel)}</td>
            <td>${escapeHtml(r.front)}</td>
            <td>${escapeHtml(r.inter)}</td>
            <td>${escapeHtml(r.rear)}</td>
            <td>${escapeHtml(r.bottom)}</td>
            <td>${formatMetric(r.efficiency, 2)}</td>
          </tr>
        `
      )
      .join("");

    wrap.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Use</th>
            <th>Author</th>
            <th>Year</th>
            <th>Front</th>
            <th>Interlayer</th>
            <th>Rear</th>
            <th>Bottom</th>
            <th>Efficiency</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    `;
  }

  function renderSimilarExplorer(rows) {
    const summaryEl = document.getElementById("explorer-source-summary");
    const wrap = document.getElementById("explorer-similar-table-wrap");
    if (!summaryEl || !wrap) return;

    const sourceIndex = Number(window.__explorerSourceIndex);
    let source = rows.find((r) => r.index === sourceIndex);

    if (!source && rows.length) {
      source = rows[0];
      window.__explorerSourceIndex = source.index;
    }

    if (!source) {
      summaryEl.innerHTML = "<p>No source paper selected.</p>";
      wrap.innerHTML = "";
      return;
    }

    const comparable = rows
      .filter((r) => r.index !== source.index)
      .map((r) => ({
        row: r,
        distance: similarityDistance(source, r)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 10);

    summaryEl.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${escapeHtml(source.author)}</div>
          <div class="stat-label">Selected paper</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${escapeHtml(source.yearLabel || "n/a")}</div>
          <div class="stat-label">Year</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${formatMetric(source.efficiency, 2)}</div>
          <div class="stat-label">Efficiency (%)</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${escapeHtml(source.front)}</div>
          <div class="stat-label">Front / Inter / Rear / Bottom</div>
        </div>
      </div>
    `;

    if (!comparable.length) {
      wrap.innerHTML = "<p>No similar cells found.</p>";
      return;
    }

    const body = comparable
      .map(
        ({ row, distance }, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>
              <button type="button" class="explorer-source-button" data-explorer-source-index="${row.index}">
                Use
              </button>
            </td>
            <td>${escapeHtml(row.author)}</td>
            <td>${escapeHtml(row.yearLabel)}</td>
            <td>${formatMetric(100 / (1 + distance), 1)}</td>
            <td>${escapeHtml(row.front)}</td>
            <td>${escapeHtml(row.inter)}</td>
            <td>${escapeHtml(row.rear)}</td>
            <td>${escapeHtml(row.bottom)}</td>
            <td>${formatMetric(row.efficiency, 2)}</td>
            <td>${formatMetric(row.area, 2)}</td>
            <td>${formatMetric(row.indiumMgW, 3)}</td>
            <td>${paperLink(row.paperUrl)}</td>
          </tr>
        `
      )
      .join("");

    wrap.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Use</th>
            <th>Author</th>
            <th>Year</th>
            <th>Similarity</th>
            <th>Front</th>
            <th>Interlayer</th>
            <th>Rear</th>
            <th>Bottom</th>
            <th>Efficiency</th>
            <th>Area</th>
            <th>Indium</th>
            <th>Reference</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    `;
  }

  function bindControls() {
    if (window.__explorerBound) return;
    window.__explorerBound = true;

    document.addEventListener("change", (event) => {
      const id = event.target?.id;
      if (!id || !id.startsWith("explorer-")) return;
      renderExplorer(window.__tableData || []);
    });

    document.addEventListener("input", (event) => {
      const id = event.target?.id;
      if (id === "explorer-source-search") {
        renderExplorer(window.__tableData || []);
      }
    });

    document.addEventListener("click", (event) => {
      const btn = event.target?.closest?.("[data-explorer-source-index]");
      if (!btn) return;

      const index = Number(btn.dataset.explorerSourceIndex);
      if (!Number.isFinite(index)) return;

      window.__explorerSourceIndex = index;
      renderExplorer(window.__tableData || []);
    });

    document.getElementById("explorer-reset")?.addEventListener("click", () => {
      const certified = document.getElementById("explorer-certified-only");
      const front = document.getElementById("explorer-front");
      const inter = document.getElementById("explorer-inter");
      const rear = document.getElementById("explorer-rear");
      const bottom = document.getElementById("explorer-bottom");
      const search = document.getElementById("explorer-source-search");

      if (certified) certified.checked = false;
      if (front) front.value = "Any";
      if (inter) inter.value = "Any";
      if (rear) rear.value = "Any";
      if (bottom) bottom.value = "Any";
      if (search) search.value = "";

      delete window.__explorerSourceIndex;
      renderExplorer(window.__tableData || []);
    });
  }

  function renderExplorer(rows) {
    const section = document.getElementById("explorer");
    if (!section) return;

    const tax = window.TceMaterialTaxonomy;
    if (!tax) {
      section.innerHTML = "<p>Explorer helpers are missing.</p>";
      return;
    }

    bindControls();

    const allRows = buildExplorerRows(rows);
    const certifiedOnly = document.getElementById("explorer-certified-only")?.checked ?? false;
    const visibleRows = certifiedOnly ? allRows.filter((row) => row.certified === "yes") : allRows;

    window.filteredExplorerRows = visibleRows;

    const builderSummary = document.getElementById("explorer-builder-summary");
    if (builderSummary) {
      const builderFilters = getBuilderFilters();
      const filtered = visibleRows.filter((row) => matchesBuilderFilters(row, builderFilters));
      renderStatsCards(builderSummary, filtered, "Matching cells");
      renderBuilderTable(filtered);
    }

    renderSankey(visibleRows);
    renderCandidateTable(visibleRows);
    renderSimilarExplorer(visibleRows);
  }

  return {
    renderExplorer
  };
})();

window.PVDataExplorer = PVDataExplorer;

function renderExplorer(rows) {
  return PVDataExplorer.renderExplorer(rows);
}
