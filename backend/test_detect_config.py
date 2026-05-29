import inspect
import unittest

from fastapi.params import Query

from backend import main


class DetectConfigTest(unittest.TestCase):
    def test_detect_accepts_low_confidence_query_parameter(self) -> None:
        sig = inspect.signature(main.detect)

        self.assertIn("conf", sig.parameters)
        param = sig.parameters["conf"]

        self.assertIsInstance(param.default, Query)
        self.assertEqual(param.default.default, 0.05)
        metadata = {type(item).__name__: item for item in param.default.metadata}
        self.assertEqual(metadata["Ge"].ge, 0.0)
        self.assertEqual(metadata["Le"].le, 1.0)


if __name__ == "__main__":
    unittest.main()
