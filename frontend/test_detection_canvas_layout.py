import re
import unittest
from pathlib import Path


CANVAS = Path(__file__).parent / "components" / "DetectionCanvas.tsx"


class DetectionCanvasLayoutTest(unittest.TestCase):
    def test_overlay_layer_is_explicitly_aligned_to_rendered_image(self) -> None:
        text = CANVAS.read_text(encoding="utf-8")

        self.assertRegex(text, r"left:\s*rect\.left\s*-\s*containerRect\.left")
        self.assertRegex(text, r"top:\s*rect\.top\s*-\s*containerRect\.top")
        self.assertRegex(text, r"left:\s*scale\.left")
        self.assertRegex(text, r"top:\s*scale\.top")


if __name__ == "__main__":
    unittest.main()
