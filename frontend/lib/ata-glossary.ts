// Plain-English explainers for ATA Chapter codes and the MEL system.
// Surfaced via popovers on ReportCard ATA pills and MEL ids.

export interface ATAGloss {
  code: string;
  name: string;
  plain: string;
}

export const ATA_GLOSSARY: Record<string, ATAGloss> = {
  "51": {
    code: "51",
    name: "Standard Practices / Structures",
    plain:
      "Cross-cutting structural repair practices and surface treatments. The chapter every other airframe chapter falls back to for general techniques.",
  },
  "52": {
    code: "52",
    name: "Doors",
    plain:
      "Passenger, crew, service, and cargo doors — their structure, latches, and the fasteners that attach them to the fuselage.",
  },
  "53": {
    code: "53",
    name: "Fuselage",
    plain:
      "The pressurized body of the aircraft: skin panels, frames, stringers, and the fastener systems that hold them together. Most surface damage from hail, GSE, or fatigue maps here.",
  },
  "53-10": {
    code: "53-10",
    name: "Fuselage — Skin / Plates",
    plain:
      "Outer skin panels of the fuselage. The pressure-bearing aluminum (or composite) surface that takes most environmental and ground-handling damage.",
  },
  "53-30": {
    code: "53-30",
    name: "Fuselage — Frames / Stringers",
    plain:
      "The internal skeleton — circular frames (rings) and longitudinal stringers — that gives the skin its shape and carries flight loads.",
  },
  "53-40": {
    code: "53-40",
    name: "Fuselage — Attachments / Fasteners",
    plain:
      "Rivets, bolts, and Hi-Loks that join skin panels, doublers, and reinforcements. Failure here often shows up before the surrounding skin fails.",
  },
  "54": {
    code: "54",
    name: "Nacelles / Pylons",
    plain:
      "Engine nacelles and the pylons that hang them off the wing or fuselage.",
  },
  "55": {
    code: "55",
    name: "Stabilizers",
    plain:
      "Horizontal and vertical stabilizers at the tail — the structures that give the aircraft pitch and yaw stability.",
  },
  "56": {
    code: "56",
    name: "Windows",
    plain:
      "Flight compartment and cabin windows plus their frames and seals. Pressure-bearing assemblies.",
  },
  "57": {
    code: "57",
    name: "Wings",
    plain:
      "Wing center section, surfaces, and control surface attachments. Heavily fastener-dense around the wing root.",
  },
};

export function getATAGloss(code: string): ATAGloss | null {
  // Accept "ATA 53-10", "53-10", "ATA-53", or "53".
  if (!code) return null;
  const cleaned = code.replace(/^ATA[-\s]*/, "").trim();
  if (ATA_GLOSSARY[cleaned]) return ATA_GLOSSARY[cleaned];
  const major = cleaned.split("-")[0];
  return ATA_GLOSSARY[major] ?? null;
}

export const MEL_EXPLAINER = {
  title: "MEL — Minimum Equipment List",
  plain:
    "A regulatory document, approved per aircraft type, that defines which conditions allow continued flight and how long a defect may be deferred before it must be rectified. If a finding cannot be matched to a permissive MEL item, the aircraft is no-go until repaired.",
  categories: {
    A: "Immediate (no-go) — must be rectified before next flight.",
    B: "Within 72 hours of discovery.",
    C: "Within 10 calendar days.",
    D: "Within 120 calendar days.",
  } as Record<string, string>,
};

export function getMELCategoryFromId(melId: string | null): string | null {
  if (!melId) return null;
  // Convention used in this demo: "MEL-53-10-A" → category "A".
  const m = melId.match(/-([ABCD])$/);
  return m ? m[1] : null;
}
