import type { Detection, InspectionReport } from "./types";

function detectionId(detection: Detection, index: number): string {
  return detection.id ?? `D${index + 1}`;
}

export function groundReportInDetections(
  report: InspectionReport,
  detections: Detection[],
): InspectionReport {
  const byId = new Map(
    detections.map((detection, index) => [
      detectionId(detection, index),
      { ...detection, id: detectionId(detection, index) },
    ]),
  );

  const defects = report.defects.flatMap((defect) => {
    const detection = byId.get(defect.id);
    if (!detection) return [];
    return [
      {
        ...defect,
        id: detection.id,
        yolo_class: detection.class,
        yolo_confidence: detection.confidence,
      },
    ];
  });

  if (defects.length === report.defects.length) {
    return { ...report, defects };
  }

  return {
    ...report,
    summary:
      defects.length === 0
        ? "No YOLO-backed aircraft surface defects were detected."
        : `${defects.length} YOLO-backed aircraft surface defect(s) detected — maintenance action recommended.`,
    defects,
  };
}
