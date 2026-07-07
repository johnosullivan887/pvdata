const PVDataIndium = (() => {
  const DEP_EFF = 0.8;

  function normalizeText(value) {
    return String(value ?? "")
      .trim()
      .replace(/\s+/g, " ");
  }

  function normalizeKey(value) {
    return normalizeText(value).toLowerCase();
  }

  function parseDate(value) {
    if (!value) return null;

    const s = String(value).trim();
    const parts = s.split("/");

    if (parts.length === 3) {
      const [day, month, year] = parts.map(Number);
      const d = new Date(year, month - 1, day);
      return isNaN(d.getTime()) ? null : d;
    }

    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  function resolveField(row, keys) {
    for (const key of keys) {
      const value = row[key];
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        return value;
      }
    }
    return null;
  }

  function toNumber(value) {
    if (value === null || value === undefined || value === "") return null;
    const n = Number(String(value).replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : null;
  }

  function getAuthor(row) {
    return normalizeText(resolveField(row, ["Author"]));
  }

  function getYear(row) {
    const yearRaw = resolveField(row, ["Year"]);
    if (yearRaw) return normalizeText(yearRaw);

    const dateRaw = resolveField(row, ["Publishing date", "Date"]);
    const match = String(dateRaw ?? "").match(/(19|20)\d{2}/);
    return match ? match[0] : "";
  }

  function getPaperUrl(row) {
    const ref = normalizeText(resolveField(row, ["Reference", "Reference link", "DOI"]));
    if (!ref) return "";

    if (/^https?:\/\//i.test(ref)) return ref;

    if (/^10\.\d{4,9}\//i.test(ref)) {
      return `https://doi.org/${ref}`;
    }

    return "";
  }

  function getEfficiency(row) {
    return toNumber(resolveField(row, ["n tandem", "η (%)", "Efficiency"]));
  }

  function getActiveArea(row) {
    return toNumber(
      resolveField(row, [
        "Cell active area",
        "Active Area (cm2)",
        "Active area",
        "Area"
      ])
    );
  }

  function classifyCellType(row) {
    const raw = normalizeKey(resolveField(row, ["Cell", "Si Bottom cell type"]));

    if (raw.includes("shj") || raw.includes("heterojunction")) return "SHJ";
    if (raw.includes("topcon") || raw.includes("polo")) return "TOPCon/POLO";
    if (raw.includes("perc") || raw.includes("al-bsf") || raw.includes("bsf")) return "Al-BSF/PERC";
    return "Other";
  }

  function indiumProfile(fraction, density) {
    return { mode: "indium", fraction, density };
  }

  function zeroProfile() {
    return { mode: "zero" };
  }

  const FRONT_PROFILES = {
    "ito": indiumProfile(0.74, 7.14),
    "izo": indiumProfile(0.827 * 0.9, 7.14),
    "io:h/ito": indiumProfile(0.827 * 0.9 + 0.74 * 0.1, 7.14),
    "iwo": indiumProfile(0.827 * 0.99, 7.14),
    "izro": indiumProfile(0.827 * 0.98, 7.14),
    "agnws": zeroProfile(),
    "azo": zeroProfile(),
    "moox/au/moox": zeroProfile(),
    "in-free": zeroProfile()
  };

  const REAR_PROFILES = {
    "inox:h/ag": indiumProfile(0.827, 7.14),
    "izo/ag": indiumProfile(0.827 * 0.9, 7.14),
    "izo/mgf2/ag": indiumProfile(0.827 * 0.9, 7.14),
    "doped-inox:h/ag/siox/ag": indiumProfile(0.74, 7.14),
    "ito/ag": indiumProfile(0.74, 7.14),
    "ito/ag/al": indiumProfile(0.74, 7.14),
    "ito/al/ag": indiumProfile(0.74, 7.14),
    "ito/au": indiumProfile(0.74, 7.14),
    "ito/sio2/ag": indiumProfile(0.74, 7.14),
    "ito/silica/ag": indiumProfile(0.74, 7.14),
    "ito/sio2-np/ag": indiumProfile(0.74, 7.14),
    "ito/mgf2/ni/al": indiumProfile(0.74, 7.14),
    "ito/mgfx/ag": indiumProfile(0.74, 7.14),
    "ito/meso-al2o3/ag": indiumProfile(0.74, 7.14),
    "inox/ag": indiumProfile(0.827, 7.14),
    "doped inox/ag/sio2/ag": indiumProfile(0.74, 7.14),
    "doped inox/ag": indiumProfile(0.74, 7.14),
    "izro/ag": indiumProfile(0.827 * 0.98, 7.14),
    "izro/siox/ag": indiumProfile(0.827 * 0.98, 7.14),
    "iwo/ag": indiumProfile(0.827 * 0.99, 7.14),

    "ag": zeroProfile(),
    "al": zeroProfile(),
    "ag/al": zeroProfile(),
    "al/ag": zeroProfile(),
    "al/ti/ag": zeroProfile(),
    "ti/pd/ag/pt": zeroProfile(),
    "ti/pd/ag": zeroProfile(),
    "cr/ag": zeroProfile(),
    "cr/pd/ag/ag/al": zeroProfile(),
    "azo/ag": zeroProfile(),
    "azo/al": zeroProfile(),
    "no tce": zeroProfile(),

    "tco/ag": null,
    "not clear": null,
    "other": null
  };

  const INTER_PROFILES = {
    "iwo": indiumProfile(0.827 * 0.99, 7.14),
    "ito": indiumProfile(0.74, 7.14),
    "izo": indiumProfile(0.827 * 0.9, 7.14),
    "inox": indiumProfile(0.827, 7.14),
    "doped inox": indiumProfile(0.74, 7.14),
    "doped-inox:h": indiumProfile(0.74, 7.14),
    "inox:h": indiumProfile(0.827, 7.14),
    "io:h": indiumProfile(0.74, 7.14),
    "ito/izo": indiumProfile(0.74, 7.14),

    "zto": zeroProfile(),
    "none": zeroProfile(),
    "no layer": zeroProfile(),
    "nc-siox(n)": zeroProfile(),
    "nc-siox:h(n/p)": zeroProfile(),
    "tisi2": zeroProfile(),
    "tiox/tiny": zeroProfile(),
    "n-n-p organic": zeroProfile(),
    "a*-si:h(n)": zeroProfile(),
    "nc-si:h(p)": zeroProfile(),
    "nc-si:h(n)": zeroProfile(),
    "a-si:h(p+)": zeroProfile(),
    "nc-si:h(n/p)": zeroProfile(),
    "nc-si:h(p/n)": zeroProfile(),
    "poly-si(n/p)": zeroProfile(),
    "nc-si(n+)": zeroProfile(),
    "uc-si:h(p/n)": zeroProfile(),

    "not clear": null,
    "other": null
  };

  function getProfile(kind, rawValue) {
    const key = normalizeKey(rawValue);
    if (!key) return null;

    let profile = null;
    if (kind === "front") profile = FRONT_PROFILES[key] ?? null;
    if (kind === "rear") profile = REAR_PROFILES[key] ?? null;
    if (kind === "inter") profile = INTER_PROFILES[key] ?? null;

    if (profile === null) return null;
    return profile;
  }

  function getThickness(row, kind) {
    if (kind === "front") {
      return toNumber(
        resolveField(row, [
          "Total front TCO thickness",
          "Front TCO thickness",
          "fTCE thickness (nm)",
          "Front TCO thickness (nm)"
        ])
      );
    }

    if (kind === "rear") {
      return toNumber(
        resolveField(row, [
          "Rear TCO thickness",
          "Rear TCE thickness (nm)",
          "Rear TCO thickness (nm)"
        ])
      );
    }

    return toNumber(
      resolveField(row, [
        "Inter-layer thickness",
        "IL thickness (nm)",
        "Interlayer thickness",
        "Inter-layer thicknes"
      ])
    );
  }

  function getContribution(row, kind, efficiencyPct) {
    const raw =
      kind === "front"
        ? resolveField(row, ["Front TCO", "Front TCE (fTCE)"])
        : kind === "rear"
          ? resolveField(row, ["Rear electrode", "Rear Electrode"])
          : resolveField(row, ["Inter-layer", "Interlayer TCE"]);

    const profile = getProfile(kind, raw);
    if (!profile) return null;

    if (profile.mode === "zero") return 0;

    const thicknessNm = getThickness(row, kind);
    if (thicknessNm === null) return null;

    const gramsPerW =
      ((thicknessNm * 1e-7) / DEP_EFF) *
      profile.density *
      profile.fraction *
      1000 /
      ((efficiencyPct / 100) * 0.1);

    return Number.isFinite(gramsPerW) ? gramsPerW : null;
  }

  function computeRow(row) {
    const efficiency = getEfficiency(row);
    if (!Number.isFinite(efficiency)) return null;

    const frontMgW = getContribution(row, "front", efficiency);
    const rearMgW = getContribution(row, "rear", efficiency);
    const interMgW = getContribution(row, "inter", efficiency);

    if (frontMgW === null || rearMgW === null || interMgW === null) return null;

    const activeArea = getActiveArea(row);

    return {
      date: parseDate(resolveField(row, ["Publishing date", "Date"])),
      efficiency,
      activeArea,
      cellType: classifyCellType(row),
      totalMgW: frontMgW + rearMgW + interMgW,
      frontMgW,
      rearMgW,
      interMgW,
      frontTco: normalizeText(resolveField(row, ["Front TCO", "Front TCE (fTCE)"])),
      rearTco: normalizeText(resolveField(row, ["Rear electrode", "Rear Electrode"])),
      interTco: normalizeText(resolveField(row, ["Inter-layer", "Interlayer TCE"])),
      certified: normalizeKey(resolveField(row, ["Certified", "certified"])),
      author: getAuthor(row),
      year: getYear(row),
      paperUrl: getPaperUrl(row)
    };
  }

  return {
    parseDate,
    normalizeText,
    resolveField,
    toNumber,
    getAuthor,
    getYear,
    getPaperUrl,
    getEfficiency,
    getActiveArea,
    classifyCellType,
    computeRow
  };
})();
