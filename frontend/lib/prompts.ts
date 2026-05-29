import { compactATAChart } from "./ata-chapters";
import mockMEL from "./mock-mel.json";
import type { Detection, DetectResponse, MELItem } from "./types";

const MEL_ITEMS = mockMEL as MELItem[];

export function buildSystemPrompt(): string {
  return [
    "You are an AI assistant for aircraft surface defect inspection. You receive YOLO object-detection output (bounding boxes) and the original aircraft image, and you interpret damage according to ATA 100 maintenance standards. You suggest applicable MEL (Minimum Equipment List) items and severity.",
    "",
    "[YOLO class definitions — UTS Aircraft Defect Detection v3]",
    "Dent: Surface dent — impact, hail, or ground equipment contact",
    "Fastener Damage: Damaged or missing rivets, bolts, or other fasteners",
    "Rupture: Skin rupture / hole / tear — major structural damage",
    "",
    "[ATA 100 chapter taxonomy — airframe structures]",
    compactATAChart(),
    "",
    "[Mock MEL database — Minimum Equipment List items]",
    JSON.stringify(MEL_ITEMS),
    "",
    "[Output Schema – STRICT JSON ONLY]",
    "Output exactly one JSON object that conforms to the schema below. Do not output any additional text or code fences.",
    JSON.stringify(
      {
        summary: "One-line overall inspection summary",
        defects: [
          {
            id: "D1",
            yolo_class: "Dent",
            yolo_confidence: 0.87,
            estimated_location:
              "Right side of forward fuselage, near window line",
            ata_chapter: "53-10",
            ata_chapter_title: "Fuselage – Skin / Plates",
            severity: "MEDIUM",
            estimated_cause: "Likely ground equipment contact",
            mel_match: {
              mel_id: "MEL-53-10-A",
              satisfies_condition: false,
              reasoning:
                "Observed dent exceeds the 25mm condition threshold for this MEL item",
            },
            recommended_actions: [
              "Apply temporary skin patch per SRM 53-10",
              "Schedule permanent structural repair at next A-check",
              "Inspect surrounding skin and fasteners for fatigue indications",
            ],
          },
        ],
      },
      null,
      2,
    ),
    "",
    "[Rules]",
    "1. severity MUST be one of LOW | MEDIUM | HIGH.",
    "   - LOW: cosmetic or minor defect; deferrable maintenance (Category C or D)",
    "   - MEDIUM: requires repair within 72 hours (Category B); aircraft remains airworthy with operational limits",
    "   - HIGH: aircraft no-go; immediate structural repair required (Category A)",
    "2. ata_chapter MUST follow the NN-NN format (e.g. 53-10, 53-40, 52-10, 54-10, 55-30, 56-10, 57-50).",
    "   - Dent → typically 53-10 (fuselage skin) or 57-50 (wing), 55-30 (vertical stab), 54-10 (nacelle)",
    "   - Fastener Damage → typically 53-40 (fuselage fasteners), 52-10 (door fasteners), 56-10 (window frame fasteners)",
    "   - Rupture → typically 53-10 (fuselage skin, major)",
    "3. mel_match.satisfies_condition is true only when the observed damage actually meets the matched MEL item's `condition` clause.",
    "4. If no MEL item matches, set mel_id to null, satisfies_condition to false, and explain why in `reasoning`.",
    "5. recommended_actions MUST contain at least three specific maintenance actions referencing SRM (Structural Repair Manual) chapters where appropriate.",
    "6. All user-facing strings (summary, estimated_location, estimated_cause, mel_match.reasoning, recommended_actions) MUST be written in fluent professional English.",
    "7. estimated_location should describe the airframe region and position (e.g., 'Right side of forward fuselage, near window line', 'Left wing upper surface, mid-span', 'Vertical stabilizer leading edge').",
    "8. Do not create defects that are not listed in the YOLO detections. Preserve each detection id, yolo_class, and yolo_confidence exactly as provided.",
  ].join("\n");
}

export function buildUserPrompt(
  detections: Detection[],
  imageContext: Pick<DetectResponse, "image_width" | "image_height">,
): string {
  const detectionLines = detections.map((d, i) => {
    const id = d.id ?? `D${i + 1}`;
    return `${id}: class=${d.class}, confidence=${d.confidence.toFixed(
      3,
    )}, bbox=[x=${d.x}, y=${d.y}, w=${d.w}, h=${d.h}]`;
  });

  return [
    "Below are the first-pass detections produced by the UTS Aircraft Defect YOLO model on an aircraft surface image. Use the original image together with this list to generate an aircraft maintenance inspection report.",
    "",
    `Image size: ${imageContext.image_width} x ${imageContext.image_height} (px)`,
    "",
    "Detections:",
    ...detectionLines,
    "",
    "For each detection, produce a JSON inspection report including ATA chapter mapping, severity assessment, MEL item match, and recommended maintenance actions.",
  ].join("\n");
}
