// Core domain types for the Aircraft Damage & Defect Inspection Assistant.

export type Severity = "LOW" | "MEDIUM" | "HIGH";

export interface Detection {
  id?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  // YOLO class string (UTS Aircraft Defects: Dent | Fastener Damage | Rupture).
  class: string;
  confidence: number;
}

export interface DetectResponse {
  detections: Detection[];
  image_width: number;
  image_height: number;
}

// Top-level ATA chapter (ATA 100 maintenance taxonomy).
export interface ATAChapter {
  code: string;
  title_en: string;
  description: string;
  sub_chapters: ATASubChapter[];
}

export interface ATASubChapter {
  code: string;
  title_en: string;
}

// MEL (Minimum Equipment List) categories.
// A = immediate (no-go), B = 72 hours, C = 10 days, D = 120 days.
export type MELCategory = "A" | "B" | "C" | "D";

export interface MELItem {
  id: string;
  ata: string;
  item_name: string;
  category: MELCategory;
  applicability: string;
  condition: string;
  action: string;
  operational_limit: string;
}

export interface MELMatch {
  mel_id: string | null;
  satisfies_condition: boolean;
  reasoning: string;
}

export interface DefectAnalysis {
  id: string;
  yolo_class: string;
  yolo_confidence: number;
  // Position expression (e.g. "Right side of forward fuselage, near window line").
  estimated_location: string;
  ata_chapter: string;
  ata_chapter_title: string;
  severity: Severity;
  estimated_cause: string;
  mel_match: MELMatch;
  recommended_actions: string[];
}

export interface InspectionReport {
  summary: string;
  defects: DefectAnalysis[];
}

// SSE event payloads streamed from /api/analyze.
export type AnalyzeEvent =
  | { type: "detections"; payload: DetectResponse }
  | { type: "report_chunk"; payload: string }
  | { type: "report_done"; payload: InspectionReport }
  | { type: "error"; payload: { message: string } };
