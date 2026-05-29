import json
import re
import unittest
from pathlib import Path


NOTEBOOK = Path(__file__).parent / "aircraft_defect_colab_training.ipynb"


class ColabNotebookConfigTest(unittest.TestCase):
    def test_roboflow_key_is_extracted_to_a_dedicated_constant_cell(self) -> None:
        notebook = json.loads(NOTEBOOK.read_text(encoding="utf-8"))
        cell_sources = ["".join(cell.get("source", [])) for cell in notebook["cells"]]
        text = "\n".join(cell_sources)

        self.assertRegex(text, r'ROBOFLOW_API_KEY_VALUE\s*=\s*["\'][^"\']+["\']')
        self.assertIn("ROBOFLOW_API_KEY = ROBOFLOW_API_KEY_VALUE", text)

        key_cell_indexes = [
            index
            for index, source in enumerate(cell_sources)
            if "ROBOFLOW_API_KEY_VALUE" in source
        ]
        config_cell_indexes = [
            index
            for index, source in enumerate(cell_sources)
            if "ROBOFLOW_WORKSPACE" in source
        ]

        self.assertTrue(key_cell_indexes)
        self.assertTrue(config_cell_indexes)
        self.assertLess(min(key_cell_indexes), min(config_cell_indexes))

        config_source = cell_sources[min(config_cell_indexes)]
        self.assertNotRegex(config_source, r"ROBOFLOW_API_KEY\s*=\s*['\"]")


if __name__ == "__main__":
    unittest.main()
