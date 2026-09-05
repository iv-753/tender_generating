import importlib.util
import math
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace


MODULE_PATH = Path(__file__).with_name("generate-static-rules.py")
SPEC = importlib.util.spec_from_file_location("generate_static_rules", MODULE_PATH)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


GRADE_FORMULA = (
    "=IF(A1,'分级单价保洁、绿化 '!Y4,IF(A2,'分级单价保洁、绿化 '!Y5,"
    "IF(A3,'分级单价保洁、绿化 '!Y6,IF(A4,'分级单价保洁、绿化 '!Y7,1))))*0.1"
)


class FakeSheet:
    def __init__(self, title, values):
        self.title = title
        self.values = values

    def cell(self, row, column):
        return SimpleNamespace(
            value=self.values.get((row, column)),
            coordinate=f"{'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[column - 1]}{row}",
        )


class FakePriceSheet:
    title = "分级单价保洁、绿化 "

    def __init__(self, values=None):
        self.values = values or {"Y4": 1.2, "Y5": 1.1, "Y6": 1.05, "Y7": 1}

    def __getitem__(self, reference):
        return SimpleNamespace(value=self.values.get(reference))


class StrictParsingTests(unittest.TestCase):
    def test_ratio_rejects_unrecognized_nonempty_formula(self):
        self.assertEqual(MODULE.ratio(""), 0.0)
        self.assertEqual(MODULE.ratio("=E5*0.1"), 0.1)
        with self.assertRaisesRegex(ValueError, "无法读取在途比例"):
            MODULE.ratio("=E5+0.1")

    def test_required_number_preserves_zero_and_rejects_invalid_values(self):
        self.assertEqual(MODULE.required_number(0, "数量"), 0.0)
        for value in (None, math.nan, math.inf, -math.inf, "12"):
            with self.subTest(value=value):
                with self.assertRaisesRegex(ValueError, "必须是有限数值"):
                    MODULE.required_number(value, "数量")

    def test_workbook_hash_must_match_mapping_metadata(self):
        with tempfile.TemporaryDirectory() as directory:
            workbook = Path(directory) / "model.xlsx"
            workbook.write_bytes(b"audited workbook")
            with self.assertRaisesRegex(ValueError, "工作簿 SHA-256 不匹配"):
                MODULE.validate_workbook_hash(workbook, "0" * 64)

    def test_module_source_is_multiline_and_deep_freezes_nested_values(self):
        source = MODULE.module_source("RULES", [{"nested": {"hours": [1, 2]}}])
        self.assertGreater(source.count("\n"), 10)
        self.assertIn("function deepFreeze", source)
        self.assertIn("export const RULES = deepFreeze", source)

    def test_engineering_rule_rejects_each_missing_required_cached_number(self):
        formula_values = {
            (5, 1): "A-SS-50 动作",
            (5, 2): "系统",
            (5, 3): "个",
            (5, 5): GRADE_FORMULA,
            (5, 7): "=E5*0.1",
            (5, 11): "每月1次",
        }
        valid_values = {(5, 4): 0, (5, 14): 0, (5, 16): 0}
        for column in (4, 14, 16):
            with self.subTest(column=column):
                values = {**valid_values, (5, column): None}
                with self.assertRaisesRegex(ValueError, "必须是有限数值"):
                    MODULE.engineering_rule(
                        FakeSheet("工程常规", formula_values),
                        FakeSheet("工程常规", values),
                        FakePriceSheet(),
                        5,
                        "engineering-routine",
                        "building.exampleCount",
                    )

    def test_grade_unit_hours_rejects_bad_references_and_nonfinite_inputs(self):
        bad_formula = GRADE_FORMULA.replace("!Y7", "!Y8")
        with self.assertRaisesRegex(ValueError, "无法读取四档标准工时"):
            MODULE.grade_unit_hours(
                FakeSheet("工程常规", {(5, 5): bad_formula, (5, 7): "=E5*0.1"}),
                FakePriceSheet(),
                5,
            )
        with self.assertRaisesRegex(ValueError, "无法读取四档标准工时"):
            MODULE.grade_unit_hours(
                FakeSheet("工程常规", {(5, 5): 1, (5, 7): "=E5*0.1"}),
                FakePriceSheet(),
                5,
            )
        with self.assertRaisesRegex(ValueError, "必须是有限数值"):
            MODULE.grade_unit_hours(
                FakeSheet("工程常规", {(5, 5): GRADE_FORMULA, (5, 7): math.inf}),
                FakePriceSheet(),
                5,
            )


if __name__ == "__main__":
    unittest.main()
