// Curator's notes for the bundled sample images. Keyed by sample filename
// (e.g., "sample-1.jpg"). Rewritten 2026-05-15: all 10 samples now come from
// the UTS Aircraft Defect Detection v3 test split (Public Domain, Roboflow),
// the same dataset the model was trained on — so detections should reliably
// fire. Class balance: Dent x4, Fastener Damage x3, Rupture x3.

export interface SampleContext {
  id: string;
  title: string;
  one_liner: string;
  pattern_to_watch: string;
}

export const SAMPLE_CONTEXT: Record<string, SampleContext> = {
  "sample-1.jpg": {
    id: "sample-1",
    title: "Hangar Close-Up — Twin Dents",
    one_liner:
      "Hangar shop-floor close-up of an aluminum panel section with two clear dents side-by-side (Dent class).",
    pattern_to_watch:
      "Two high-confidence Dent boxes — both should clear 0.8. Strong baseline detection for the Dent class.",
  },
  "sample-2.jpg": {
    id: "sample-2",
    title: "Shop-Floor Close-Up — Fastener Damage",
    one_liner:
      "Hangar close-up of a deformed/missing fastener on a metal panel (Fastener Damage class).",
    pattern_to_watch:
      "Look for one tight Fastener Damage box on the damaged rivet head. Small box — may need the confidence slider lowered.",
  },
  "sample-3.jpg": {
    id: "sample-3",
    title: "Skin Tear Reference — Rupture",
    one_liner:
      "Reference photo of a torn aluminum skin panel with jagged edges (Rupture class).",
    pattern_to_watch:
      "Expect a large Rupture box hugging the tear edge — the model's strongest class, so confidence should be high.",
  },
  "sample-4.jpg": {
    id: "sample-4",
    title: "Piper PA28R Cabin Door — Multi-Dent",
    one_liner:
      "Parts-catalog photo of a Piper PA28R-200 cabin door structure peppered with multiple dents (Dent class).",
    pattern_to_watch:
      "Expect 4-5 Dent boxes spread across the door. NMS-wise the model's raw output is already well-separated, so the IoU slider barely changes the count here.",
  },
  "sample-5.jpg": {
    id: "sample-5",
    title: "Shop-Floor Panel — Fastener Damage",
    one_liner:
      "Hangar close-up of a panel section with a damaged fastener row (Fastener Damage class).",
    pattern_to_watch:
      "Hard test case — Fastener Damage box is small. Drop confidence below 0.3 to surface it.",
  },
  "sample-6.jpg": {
    id: "sample-6",
    title: "Multi-Crack Panel — Rupture",
    one_liner:
      "Aircraft skin panel showing several rupture lines running across it (Rupture class).",
    pattern_to_watch:
      "Should fire multiple Rupture boxes — top one around 0.75. Good demo for severity escalation in the LLM report.",
  },
  "sample-7.jpg": {
    id: "sample-7",
    title: "Hangar Photo — Surface Dent",
    one_liner:
      "Hangar walkaround photo showing a clear surface dent on an aircraft panel (Dent class).",
    pattern_to_watch:
      "Single mid-frame Dent box. The model has been reliable on this kind of off-center, well-lit dent.",
  },
  "sample-8.jpg": {
    id: "sample-8",
    title: "Hangar Photo — Fastener Hardware",
    one_liner:
      "Hangar walkaround photo showing damaged fastener hardware on a panel seam (Fastener Damage class).",
    pattern_to_watch:
      "Small, low-confidence Fastener Damage box. Useful for showing where the model is precision-leaning but recall-weak.",
  },
  "sample-9.jpg": {
    id: "sample-9",
    title: "Torn Panel Reference — Rupture",
    one_liner:
      "Reference photo of a torn aluminum panel section (Rupture class).",
    pattern_to_watch:
      "Rupture box should cover most of the tear. Compare LLM severity output to sample-3 and sample-6.",
  },
  "sample-10.jpg": {
    id: "sample-10",
    title: "Minor Dents Repair Reference",
    one_liner:
      "Training/repair reference photo showing several minor dents in an aluminum skin (Dent class).",
    pattern_to_watch:
      "Multiple smaller Dent boxes possible. Good case for the 'Dent' filter chip and IoU tuning.",
  },
};

export function getSampleContextBySrc(src: string | null): SampleContext | null {
  if (!src) return null;
  // src may be a path like "/samples/sample-1.jpg" — match by filename.
  const file = src.split("/").pop() ?? src;
  return SAMPLE_CONTEXT[file] ?? null;
}
