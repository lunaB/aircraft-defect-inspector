import type { ATAChapter } from "./types";

// ATA 100 chapter taxonomy for airframe structures (chapters 51-57).
// Used by the LLM to ground its semantic analysis of YOLO detections.
export const ATA_CHAPTERS: ATAChapter[] = [
  {
    code: "ATA-51",
    title_en: "Standard Practices / Structures",
    description:
      "General structural repair practices, surface treatments, and standard procedures applicable across the airframe.",
    sub_chapters: [
      { code: "51-10", title_en: "General Repair Practices" },
      { code: "51-20", title_en: "Surface Treatments" },
    ],
  },
  {
    code: "ATA-52",
    title_en: "Doors",
    description:
      "Passenger, crew, service, and cargo doors and their attachments / fasteners.",
    sub_chapters: [
      { code: "52-10", title_en: "Passenger / Crew Doors" },
      { code: "52-30", title_en: "Service / Cargo Doors" },
    ],
  },
  {
    code: "ATA-53",
    title_en: "Fuselage",
    description:
      "Fuselage skin, frames, stringers, and fastener systems. Most surface damage maps here.",
    sub_chapters: [
      { code: "53-10", title_en: "Fuselage – Skin / Plates" },
      { code: "53-30", title_en: "Fuselage – Frames / Stringers" },
      { code: "53-40", title_en: "Fuselage – Attachments / Fasteners" },
    ],
  },
  {
    code: "ATA-54",
    title_en: "Nacelles / Pylons",
    description:
      "Engine nacelles and pylons connecting the engines to the airframe.",
    sub_chapters: [
      { code: "54-10", title_en: "Nacelles" },
      { code: "54-50", title_en: "Pylons" },
    ],
  },
  {
    code: "ATA-55",
    title_en: "Stabilizers",
    description: "Horizontal and vertical stabilizer structures.",
    sub_chapters: [
      { code: "55-10", title_en: "Horizontal Stabilizer" },
      { code: "55-30", title_en: "Vertical Stabilizer" },
    ],
  },
  {
    code: "ATA-56",
    title_en: "Windows",
    description:
      "Flight compartment and cabin windows, including window frames and fasteners.",
    sub_chapters: [
      { code: "56-10", title_en: "Flight Compartment Windows" },
      { code: "56-20", title_en: "Cabin Windows" },
    ],
  },
  {
    code: "ATA-57",
    title_en: "Wings",
    description:
      "Wing center section and wing surfaces, including skin panels and control surfaces.",
    sub_chapters: [
      { code: "57-10", title_en: "Wing – Center Section" },
      { code: "57-50", title_en: "Wing – Surfaces" },
    ],
  },
];

export function getATAChapter(code: string): ATAChapter | undefined {
  // "53-10" matches "ATA-53".
  const major = code.startsWith("ATA-")
    ? code.split("-").slice(0, 2).join("-")
    : `ATA-${code.split("-")[0]}`;
  return ATA_CHAPTERS.find((c) => c.code === major);
}

export function getATASubTitle(code: string): string {
  for (const major of ATA_CHAPTERS) {
    const sub = major.sub_chapters.find((s) => s.code === code);
    if (sub) return `${major.title_en} – ${sub.title_en}`;
  }
  const major = getATAChapter(code);
  return major ? major.title_en : code;
}

// Token-efficient representation for embedding in the LLM prompt.
export function compactATAChart(): string {
  return ATA_CHAPTERS.map((c) => {
    const subs = c.sub_chapters
      .map((s) => `${s.code} ${s.title_en}`)
      .join("; ");
    return `[${c.code} ${c.title_en}] ${subs}`;
  }).join("\n");
}

// Map UTS Aircraft Defect YOLO class to an ATA chapter / sub-chapter.
export function mapYoloClassToATA(yoloClass: string): {
  code: string;
  title: string;
} {
  switch (yoloClass) {
    case "Dent":
      return { code: "53-10", title: "Fuselage – Skin / Plates" };
    case "Fastener Damage":
      return { code: "53-40", title: "Fuselage – Fasteners" };
    case "Rupture":
      return { code: "53-10", title: "Fuselage – Skin / Plates (Major)" };
    default:
      return { code: "XX", title: "Unclassified" };
  }
}
