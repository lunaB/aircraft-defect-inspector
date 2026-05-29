import re
import unittest
from pathlib import Path


FRONTEND_DIR = Path(__file__).parent


class DetectionConfigTest(unittest.TestCase):
    def test_shared_confidence_thresholds_are_defined_and_used(self) -> None:
        config = FRONTEND_DIR / "lib" / "detection-config.ts"
        page = FRONTEND_DIR / "app" / "page.tsx"
        route = FRONTEND_DIR / "app" / "api" / "analyze" / "route.ts"

        config_text = config.read_text(encoding="utf-8")
        page_text = page.read_text(encoding="utf-8")
        route_text = route.read_text(encoding="utf-8")

        visible = re.search(
            r"DEFAULT_VISIBLE_CONFIDENCE\s*=\s*([0-9.]+)",
            config_text,
        )
        backend = re.search(
            r"BACKEND_CANDIDATE_CONFIDENCE\s*=\s*([0-9.]+)",
            config_text,
        )

        self.assertIsNotNone(visible)
        self.assertIsNotNone(backend)
        self.assertEqual(float(visible.group(1)), 0.1)
        self.assertEqual(float(backend.group(1)), 0.05)
        self.assertIn("DEFAULT_VISIBLE_CONFIDENCE", page_text)
        self.assertIn("BACKEND_CANDIDATE_CONFIDENCE", route_text)

    def test_llm_report_is_grounded_to_yolo_detections_before_rendering(self) -> None:
        route = FRONTEND_DIR / "app" / "api" / "analyze" / "route.ts"
        grounding = FRONTEND_DIR / "lib" / "report-grounding.ts"

        route_text = route.read_text(encoding="utf-8")
        grounding_text = grounding.read_text(encoding="utf-8")

        self.assertIn("groundReportInDetections", route_text)
        self.assertIn("groundReportInDetections(parsed, detectResp.detections)", route_text)
        self.assertIn("byId.get(defect.id)", grounding_text)
        self.assertIn("yolo_class: detection.class", grounding_text)
        self.assertIn("yolo_confidence: detection.confidence", grounding_text)

    def test_report_cards_are_filtered_by_visible_detection_ids(self) -> None:
        panel = FRONTEND_DIR / "components" / "ReportPanel.tsx"
        panel_text = panel.read_text(encoding="utf-8")

        self.assertIn("visibleDetectionIds", panel_text)
        self.assertIn("visibleDetectionIds.has(d.id)", panel_text)
        self.assertIn("visibleReport", panel_text)


if __name__ == "__main__":
    unittest.main()
