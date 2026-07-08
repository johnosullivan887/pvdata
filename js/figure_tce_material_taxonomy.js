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
      symbol: "x"
    },

    "Metal / reflector": {
      label: "Metal / reflector",
      color: "#d62728",
      symbol: "triangle-down"
    },

    "Unclear / other": {
      label: "Unclear / other",
      color: "#17becf",
      symbol: "hourglass"
    }
  };

  function normalizeText(value) {
    return String(value ?? "")
      .trim()
      .replace(/\s+/g, " ");
  }

  function keyify(value) {
    return normalizeText(value).toLowerCase().replace(/\s+/g, "");
  }

  function tokenize(value) {
    return normalizeText(value)
      .toLowerCase()
      .split(/[^a-z0-9]+/g)
      .filter(Boolean);
  }

  function containsAnyPhrase(rawValue, phrases) {
    const raw = keyify(rawValue);
    return phrases.some((phrase) => raw.includes(keyify(phrase)));
  }

  function containsAnyToken(rawValue, tokens) {
    const set = new Set(tokenize(rawValue));
    return tokens.some((token) => set.has(token.toLowerCase()));
  }

  function familyFromFront(rawValue) {
    const raw = normalizeText(rawValue);
    if (!raw) return "Unclear / other";

    if (containsAnyPhrase(raw, ["not clear", "unclear"])) return "Unclear / other";

    if (containsAnyPhrase(raw, ["izro"])) return "IZrO-family";
    if (containsAnyPhrase(raw, ["izo"])) return "IZO-family";
    if (containsAnyPhrase(raw, ["ito"])) return "ITO-family";

    if (
      containsAnyPhrase(raw, [
        "ico",
        "inox",
        "iwo",
        "doped inox",
        "doped-inox",
        "doped-inox:h",
        "doped inox:h",
        "io:h"
      ])
    ) {
      return "Other InOx";
    }

    if (
      containsAnyPhrase(raw, [
        "agnws",
        "azo",
        "moox/au/moox",
        "in-free",
        "in free"
      ])
    ) {
      return "In-free / alternative";
    }

    if (containsAnyPhrase(raw, ["other"])) return "Unclear / other";

    return "Unclear / other";
  }

  function familyFromInterlayer(rawValue) {
    const raw = normalizeText(rawValue);
    if (!raw) return "Unclear / other";

    if (containsAnyPhrase(raw, ["not clear", "unclear"])) return "Unclear / other";
    if (containsAnyPhrase(raw, ["no layer", "none", "no tce", "notce"])) return "No layer / no TCE";

    if (
      containsAnyPhrase(raw, [
        "siox",
        "si-based",
        "tj",
        "tunnel",
        "tisi2",
        "tiox",
        "TiOx/TiNy",
        "tiny",
        "organic",
        "n-n-p organic",
        "nc-Si:H(n)",
        "nc-Si:H(n/p)",
        "nc-Si:H(p)",
        "nc-Si:H(p/n)",
        "nc-Si(n+)",
        "poly-Si(n)",
        "uc-Si:H(p/n)",
        "nc-siox",
        "nc-siox:h",
        "nc-siox(n)",
        "nc-siox:h(n/p)"
      ])
    ) {
      return "Tunnel junction / interlayer";
    }

    if (containsAnyPhrase(raw, ["izro"])) return "IZrO-family";
    if (containsAnyPhrase(raw, ["izo"])) return "IZO-family";
    if (containsAnyPhrase(raw, ["ito"])) return "ITO-family";

    if (
      containsAnyPhrase(raw, [
        "ico",
        "ito/izo",
        "izo/ito",
        "inox",
        "iwo",
        "doped inox",
        "doped-inox",
        "doped-inox:h",
        "doped inox:h",
        "io:h"
      ])
    ) {
      return "Other InOx";
    }

    if (containsAnyPhrase(raw, ["zto"])) return "In-free / alternative";

    if (containsAnyPhrase(raw, ["other"])) return "Unclear / other";

    return "Unclear / other";
  }

  function familyFromRear(rawValue) {
    const raw = normalizeText(rawValue);
    if (!raw) return "Unclear / other";

    if (containsAnyPhrase(raw, ["not clear", "unclear"])) return "Unclear / other";
    if (containsAnyPhrase(raw, ["no tce", "no layer", "none", "notce"])) return "No layer / no TCE";

    if (containsAnyPhrase(raw, ["izro"])) return "IZrO-family";
    if (containsAnyPhrase(raw, ["izo"])) return "IZO-family";
    if (containsAnyPhrase(raw, ["ito"])) return "ITO-family";

    if (
      containsAnyPhrase(raw, [
        "ico",
        "inox",
        "iwo",
        "doped inox",
        "doped-inox",
        "doped-inox:h",
        "doped inox:h",
        "io:h"
      ])
    ) {
      return "Other InOx";
    }

    if (
      containsAnyPhrase(raw, [
        "azo",
        "agnws",
        "in-free",
        "in free",
        "zno"
      ])
    ) {
      return "In-free / alternative";
    }

    const metalTokens = ["ag", "al", "cr", "ti", "pd", "au", "ni"];
    const hasMetal = containsAnyToken(raw, metalTokens);
    const hasTcoLike = containsAnyPhrase(raw, [
      "ito",
      "izo",
      "izro",
      "inox",
      "iwo",
      "io:h",
      "doped inox",
      "doped-inox"
    ]);

    if (hasMetal && !hasTcoLike) return "Metal / reflector";

    if (containsAnyPhrase(raw, ["other"])) return "Unclear / other";

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
