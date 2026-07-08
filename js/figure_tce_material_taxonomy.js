const TceMaterialTaxonomy = (() => {
  const familyMeta = {
  "ITO-family": {
    label: "ITO-family",
    color: "#1f77b4",
    symbol: "diamond"
  },

  "IZO-family": {
    label: "IZO-family",
    color: "#ff7f0e",
    symbol: "circle"
  },

  "IZrO-family": {
    label: "IZrO-family",
    color: "#2ca02c",
    symbol: "square"
  },

  "Other InOx": {
    label: "Other InOx",
    color: "#9467bd",
    symbol: "triangle-up"
  },

  "In-free / alternative": {
    label: "In-free / alternative",
    color: "#7f7f7f",
    symbol: "star"
  },

  "Tunnel junction / interlayer": {
    label: "Tunnel junction / interlayer",
    color: "#8c564b",
    symbol: "cross"
  },

  "No layer / no TCE": {
    label: "No layer / no TCE",
    color: "#bcbd22",
    symbol: "cross-thin"
  },

  "Metal / reflector": {
    label: "Metal / reflector",
    color: "#d62728",
    symbol: "triangle-down"
  },

  "Unclear / other": {
    label: "Unclear / other",
    color: "#17becf",
    symbol: "x"
  }
};,
  

  function normalizeText(value) {
    return String(value ?? "")
      .trim()
      .replace(/\s+/g, " ");
  }

  function keyify(value) {
    return normalizeText(value).toLowerCase().replace(/\s+/g, "");
  }

  function containsAny(rawKey, needles) {
    return needles.some((needle) => rawKey.includes(keyify(needle)));
  }

  function familyFromFront(rawValue) {
    const raw = keyify(rawValue);
    if (!raw) return "Unclear / other";

    if (containsAny(raw, ["not clear", "unclear", "other"])) return "Unclear / other";
    if (containsAny(raw, ["izro"])) return "IZrO-family";
    if (containsAny(raw, ["izo"])) return "IZO-family";
    if (containsAny(raw, ["ito"])) return "ITO-family";
    if (containsAny(raw, ["ico", "inox", "iwo", "doped inox", "doped-inox", "io:h"])) {
      return "Other InOx";
    }
    if (containsAny(raw, ["agnws", "azo", "moox/au/moox", "in-free", "in free"])) {
      return "In-free / alternative";
    }

    return "Unclear / other";
  }

  function familyFromInterlayer(rawValue) {
    const raw = keyify(rawValue);
    if (!raw) return "Unclear / other";

    if (containsAny(raw, ["not clear", "unclear", "other"])) return "Unclear / other";
    if (containsAny(raw, ["no layer", "none", "no tce", "notce"])) return "No layer / no TCE";

    if (
      containsAny(raw, [
        "siox",
        "si-based",
        "tj",
        "tisi2",
        "tiox",
        "tiny",
        "organic",
        "ito/izo",
        "izo/ito"
      ])
    ) {
      return "Tunnel junction / interlayer";
    }

    if (containsAny(raw, ["izro"])) return "IZrO-family";
    if (containsAny(raw, ["izo"])) return "IZO-family";
    if (containsAny(raw, ["ito"])) return "ITO-family";
    if (containsAny(raw, ["ico", "inox", "iwo", "doped inox", "doped-inox", "io:h"])) {
      return "Other InOx";
    }
    if (containsAny(raw, ["zto"])) return "In-free / alternative";

    return "Unclear / other";
  }

  function familyFromRear(rawValue) {
    const raw = keyify(rawValue);
    if (!raw) return "Unclear / other";

    if (containsAny(raw, ["not clear", "unclear", "other"])) return "Unclear / other";
    if (containsAny(raw, ["no tce", "no layer", "none", "notce"])) return "No layer / no TCE";

    if (containsAny(raw, ["izro"])) return "IZrO-family";
    if (containsAny(raw, ["izo"])) return "IZO-family";
    if (containsAny(raw, ["ito"])) return "ITO-family";
    if (containsAny(raw, ["ico", "inox", "iwo", "doped inox", "doped-inox", "io:h"])) {
      return "Other InOx";
    }
    if (containsAny(raw, ["azo", "agnws", "in-free", "in free"])) return "In-free / alternative";

    if (containsAny(raw, ["ag", "al", "cr", "ti", "pd", "au"])) return "Metal / reflector";

    return "Unclear / other";
  }

  function familyStyle(name) {
    return familyMeta[name] || familyMeta["Unclear / other"];
  }

  return {
    normalizeText,
    keyify,
    familyMeta,
    familyFromFront,
    familyFromInterlayer,
    familyFromRear,
    familyStyle
  };
})();

window.TceMaterialTaxonomy = TceMaterialTaxonomy;
