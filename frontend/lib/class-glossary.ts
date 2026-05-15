// Plain-English explanations for the 3 UTS Aircraft Defect classes
// the YOLO model returns. Surfaced on hover in the ClassFilter and elsewhere.

import type { Severity } from "./types";

export interface ClassGlossEntry {
  code: string;
  short: string;
  full: string;
  severity_typical: Severity;
  example_keywords: string;
}

export const CLASS_GLOSSARY: Record<string, ClassGlossEntry> = {
  Dent: {
    code: "Dent",
    short: "Surface dent or dimple in the fuselage skin.",
    full: "A localized inward deformation of the aluminum skin without rupture. Severity scales with depth, sharpness, and proximity to fasteners or splice lines. Shallow rounded dents are often cosmetic; sharp or deep dents near a stress concentration require structural assessment.",
    severity_typical: "LOW",
    example_keywords: "hail damage, ground equipment contact, bird strike",
  },
  "Fastener Damage": {
    code: "Fastener Damage",
    short: "Missing, sheared, or backed-out rivets / bolts.",
    full: "Failed or compromised fasteners along a skin lap-joint, doubler, or panel boundary. A single backed-out fastener is often deferrable, but a cluster suggests load redistribution and the skin around them must be inspected for crack initiation. Common indicator of fatigue at attachment points.",
    severity_typical: "MEDIUM",
    example_keywords: "missing rivet, sheared fastener, pillowing, smoking rivet",
  },
  Rupture: {
    code: "Rupture",
    short: "Through-thickness skin tear or breach.",
    full: "A penetrating failure of the fuselage skin — a crack, tear, or hole that violates the pressure boundary. Almost always an immediate, no-go finding pending engineering disposition. Investigate the surrounding fastener pattern and stringer attachments for collateral damage.",
    severity_typical: "HIGH",
    example_keywords: "skin tear, crack-through, blow-out, breach, puncture",
  },
};

export function getClassGloss(code: string): ClassGlossEntry | null {
  return CLASS_GLOSSARY[code] ?? null;
}
