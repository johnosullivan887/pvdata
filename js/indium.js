const PVDataIndium = (() => {
  const DEP_EFF = 0.8;

  function normalizeText(value) {
    return String(value ?? "")
      .trim()
      .replace(/\s+/g, " ");
  }

  function keyify(value) {
    return normalizeText(value).toLowerCase().replace(/\s+/g, "");
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
      const value = row?.[key];
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
    const raw = normalizeText(resolveField(row, ["Cell", "Si Bottom cell type"])).toLowerCase();

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

  function indiumProfile(fraction, density) {
    return { mode: "indium", fraction, density };
  }

  function zeroProfile() {
    return { mode: "zero" };
  }

  function buildLookup(entries) {
    const out = {};
    entries.forEach(([aliases, profile]) => {
      aliases.forEach((alias) => {
        out[keyify(alias)] = profile;
      });
    });
    return out;
  }

  const FRONT_PROFILES = buildLookup([
    [["ITO"], indiumProfile(0.74, 7.14)],
    [["IZO"], indiumProfile(0.827 * 0.9, 7.14)],
    [["IO:H/ITO", "IO:H / ITO"], indiumProfile(0.827 * 0.9 + 0.74 * 0.1, 7.14)],
    [["IWO"], indiumProfile(0.827 * 0.99, 7.14)],
    [["IZrO"], indiumProfile(0.827 * 0.98, 7.14)],
    [["Doped-InOx", "Doped InOx", "Doped-InOx:H", "Doped InOx:H"], indiumProfile(0.74, 7.14)],
    [["AgNWs", "AZO", "MoOx/Au/MoOx", "In-Free", "In-free"], zeroProfile()],
    [["Not clear", "Other"], null]
  ]);

  const REAR_PROFILES = buildLookup([
    [["InOx:H/Ag", "InOx:H / Ag"], indiumProfile(0.827, 7.14)],
    [["IZO/Ag", "IZO / Ag"], indiumProfile(0.827 * 0.9, 7.14)],
    [["IZO/MgF2/Ag", "IZO / MgF2 / Ag"], indiumProfile(0.827 * 0.9, 7.14)],
    [["Doped-InOx:H/Ag/SiOx/Ag", "Doped InOx:H/Ag/SiOx/Ag"], indiumProfile(0.74, 7.14)],
    [["ITO/Ag", "ITO / Ag"], indiumProfile(0.74, 7.14)],
    [["ITO/Ag/Al", "ITO / Ag / Al"], indiumProfile(0.74, 7.14)],
    [["ITO/Al/Ag", "ITO / Al / Ag"], indiumProfile(0.74, 7.14)],
    [["ITO/Au", "ITO / Au"], indiumProfile(0.74, 7.14)],
    [["ITO/SiO2/Ag", "ITO / SiO2 / Ag"], indiumProfile(0.74, 7.14)],
    [["ITO/Silica/Ag"], indiumProfile(0.74, 7.14)],
    [["ITO/SiO2-NP/Ag"], indiumProfile(0.74, 7.14)],
    [["ITO/MgF2/Ni/Al"], indiumProfile(0.74, 7.14)],
    [["ITO/MgFx/Ag"], indiumProfile(0.74, 7.14)],
    [["ITO/meso-Al2O3/Ag"], indiumProfile(0.74, 7.14)],
    [["InOx/Ag", "InOx / Ag"], indiumProfile(0.827, 7.14)],
    [["Doped InOx/Ag/SiO2/Ag", "Doped-InOx/Ag/SiO2/Ag"], indiumProfile(0.74, 7.14)],
    [["Doped InOx/Ag", "Doped-InOx/Ag"], indiumProfile(0.74, 7.14)],
    [["IZrO/Ag", "IZrO / Ag"], indiumProfile(0.827 * 0.98, 7.14)],
    [["IZrO/SiOx/Ag", "IZrO / SiOx / Ag"], indiumProfile(0.827 * 0.98, 7.14)],
    [["IWO/Ag", "IWO / Ag"], indiumProfile(0.827 * 0.99, 7.14)],
    [["Ag", "Al", "Ag/Al", "Al/Ag", "Al/Ti/Ag", "Ti/Pd/Ag/Pt", "Ti/Pd/Ag", "Cr/Ag", "Cr/Pd/Ag/Ag/Al", "AZO/Ag", "AZO/Al", "No TCE"], zeroProfile()],
    [["TCO/Ag", "Not clear", "Other"], null]
  ]);

  const INTER_PROFILES = buildLookup([
    [["IWO"], indiumProfile(0.827 * 0.99, 7.14)],
    [["ITO"], indiumProfile(0.74, 7.14)],
    [["IZO"], indiumProfile(0.827 * 0.9, 7.14)],
    [["InOx"], indiumProfile(0.827, 7.14)],
    [["Doped InOx", "Doped-InOx:H", "Doped InOx:H"], indiumProfile(0.74, 7.14)],
    [["InOx:H"], indiumProfile(0.827, 7.14)],
    [["IO:H"], indiumProfile(0.74, 7.14)],
    [["ITO/IZO", "ITO / IZO"], indiumProfile(0.74, 7.14)],
    [["ZTO", "None", "No layer"], zeroProfile()],
    [["nc-SiOx(n)", "nc-SiOx:H(n/p)", "TiSi2", "TiOx/TiNy", "n-n-p organic", "a*-Si:H(n)", "nc-Si:H(p)", "nc-Si:H(n)", "a-Si:H(p+)", "nc-Si:H(n/p)", "nc-Si:H(p/n)", "poly-Si(n/p)", "nc-Si(n+)", "uc-Si:H(p/n)"], zeroProfile()],
    [["Not clear", "Other"], null]
  ]);

  function getProfile(kind, rawValue) {
    const key = keyify(rawValue);
    if (!key) return null;

    if (kind === "front") return FRONT_PROFILES[key] ?? null;
    if (kind === "rear") return REAR_PROFILES[key] ?? null;
    if (kind === "inter") return INTER_PROFILES[key] ?? null;

    return null;
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
        "Inter-layer thicknes",
        "Inter-layer TCE thickness"
      ])
    );
  }

  function getContribution(row, kind, efficiencyPct, materialUtilisation = DEP_EFF) {
    const raw =
      kind === "front"
        ? resolveField(row, ["Front TCO", "Front TCE (fTCE)"])
        : kind === "rear"
          ? resolveField(row, ["Rear electrode", "Rear Electrode"])
          : resolveField(row, ["Inter-layer", "Interlayer TCE"]);

    const profile = getProfile(kind, raw);
    if (!profile) return null;

    if (profile.mode === "zero") return 0;

    const utilisation = Number(materialUtilisation);
    if (!Number.isFinite(utilisation) || utilisation <= 0) return null;

    const thicknessNm = getThickness(row, kind);
    if (thicknessNm === null) return null;

    const gramsPerW =
      ((thicknessNm * 1e-7) / utilisation) *
      profile.density *
      profile.fraction *
      1000 /
      ((efficiencyPct / 100) * 0.1);

    return Number.isFinite(gramsPerW) ? gramsPerW : null;
  }

  function computeRow(row, materialUtilisation = DEP_EFF) {
    const efficiency = getEfficiency(row);
    if (!Number.isFinite(efficiency)) return null;

    const frontMgW = getContribution(row, "front", efficiency, materialUtilisation);
    const rearMgW = getContribution(row, "rear", efficiency, materialUtilisation);
    const interMgW = getContribution(row, "inter", efficiency, materialUtilisation);

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
      certified: keyify(resolveField(row, ["Certified", "certified"])),
      author: getAuthor(row),
      year: getYear(row),
      paperUrl: getPaperUrl(row),
      materialUtilisation: Number(materialUtilisation)
    };
  }

  return {
    defaultMaterialUtilisation: DEP_EFF,
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

window.PVDataIndium = PVDataIndium;
