"""One-time migration helper: transcribe workbook rows into static ESM rule tables."""

from __future__ import annotations

import json
import re
from pathlib import Path

import openpyxl


HERE = Path(__file__).resolve()
WORKBOOK = HERE.parents[4] / "动态成本分析模型.xlsx"
OUTPUT = HERE.parents[1] / "rules"
GRADES = ("A", "B", "C", "D")


def js(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def write_module(name: str, export_name: str, rows: list[dict]) -> None:
    content = (
        "// Generated once from the internal workbook; production never reads that workbook.\n"
        f"export const {export_name} = Object.freeze({js(rows)}.map(Object.freeze));\n"
    )
    (OUTPUT / name).write_text(content, encoding="utf-8", newline="\n")


def multiplier(formula: str) -> float:
    match = re.search(r"\*([0-9.]+)$", formula)
    if not match:
        raise ValueError(f"Cannot find multiplier: {formula}")
    return float(match.group(1))


def ratio(formula: str) -> float:
    match = re.search(r"\*([0-9.]+)$", formula)
    return float(match.group(1)) if match else 0.0


def grade_values(sheet, row: int, columns: tuple[int, int, int, int]) -> dict:
    return dict(zip(GRADES, (sheet.cell(row, column).value for column in columns)))


def service_rules(sheet) -> list[dict]:
    demands = {
        5: {"type": "linear", "terms": {"occupiedHouseholds": 0.5}},
        6: {"type": "linear", "terms": {"deliveredHouseholds": 0.02, "receivedHouseholds": -0.01, "occupiedHouseholds": -0.005}},
        7: {"type": "linear", "terms": {"occupiedHouseholds": 1}},
        8: {"type": "constant", "value": 0},
        9: {"type": "linear", "terms": {"deliveredHouseholds": 0.5, "occupiedHouseholds": -0.4}},
        10: {"type": "linear", "terms": {"occupiedHouseholds": 3}},
        11: {"type": "linear", "terms": {"deliveredHouseholds": 1, "receivedHouseholds": 1, "occupiedHouseholds": 4}},
        12: {"type": "grade-linear", "terms": {"receivedHouseholds": 0.05, "occupiedHouseholds": 0.15}, "gradeFactors": {"A": 1.5, "B": 1.2, "C": 1, "D": 0.8}},
        13: {"type": "grade-linear", "terms": {"occupiedHouseholds": 0.1}, "gradeFactors": {"A": 8, "B": 4, "C": 2, "D": 0}},
        14: {"type": "linear", "terms": {"occupiedHouseholds": 0.1}},
        15: {"type": "grade-constant", "values": {"A": 18, "B": 12, "C": 8, "D": 3}},
        16: {"type": "grade-constant", "values": {"A": 6, "B": 4, "C": 4, "D": 2}},
        17: {"type": "constant", "value": 4},
        18: {"type": "constant", "value": 730},
        19: {"type": "linear", "terms": {"deliveredHouseholds": 0.05, "occupiedHouseholds": -0.05}},
        20: {"type": "linear", "terms": {"receivedHouseholds": 0.5, "occupiedHouseholds": -0.3}},
        21: {"type": "constant", "value": 12},
    }
    fixed_hours = {17: 1, 18: 2, 20: 0.1}
    rows = []
    for row in range(5, 22):
        rows.append({
            "id": f"service-{row}",
            "action": sheet.cell(row, 1).value,
            "property": sheet.cell(row, 8).value,
            "basis": sheet.cell(row, 15).value or "",
            "frequency": grade_values(sheet, row, (9, 10, 11, 12)),
            "demand": demands[row],
            "unitHours": {"type": "fixed", "value": fixed_hours[row]} if row in fixed_hours else {
                "type": "grade-adjusted",
                "base": multiplier(sheet.cell(row, 5).value),
                "additional": sheet.cell(row, 6).value or 0,
            },
        })
    return rows


CLEANING_QUANTITIES = {
    **dict.fromkeys((5, 6, 7, 12), ("perimeterEntrances", 1)),
    **dict.fromkeys((8, 9, 10), ("gateWallArea", 1)),
    11: ("gateWallArea", 0.5),
    **dict.fromkeys((13, 14, 15, 16), ("pavedRoadArea", 1)),
    **dict.fromkeys((17, 18, 19, 20, 23, 24), ("stiltFloorArea", 1)),
    **dict.fromkeys((21, 22), ("stiltWallArea", 1)),
    **dict.fromkeys((25, 26, 27, 28, 31), ("lobbyFloorArea", 1)),
    **dict.fromkeys((29, 30), ("lobbyWallArea", 1)),
    **dict.fromkeys((32, 33, 34, 37), ("standardLobbyFloorArea", 1)),
    **dict.fromkeys((35, 36), ("standardLobbyWallArea", 1)),
    **dict.fromkeys((38, 39, 40, 43), ("stairFloorArea", 1)),
    **dict.fromkeys((41, 42), ("stairWallArea", 1)),
    **dict.fromkeys((44, 45, 46), ("rooftopFloorArea", 1)),
    **dict.fromkeys((47, 48, 49, 50, 51, 52), ("garageTotalArea", 1)),
}


def cleaning_rules(sheet) -> list[dict]:
    surface = ""
    location = ""
    rows = []
    for row in range(5, 53):
        surface = sheet.cell(row, 1).value or surface
        location = sheet.cell(row, 2).value or location
        source, scale = CLEANING_QUANTITIES[row]
        rows.append({
            "id": f"cleaning-{row}",
            "action": sheet.cell(row, 3).value,
            "property": sheet.cell(row, 13).value,
            "unit": sheet.cell(row, 4).value,
            "basis": " / ".join(filter(None, (surface, location))),
            "quantitySource": source,
            "quantityScale": scale,
            "baseUnitHours": multiplier(sheet.cell(row, 6).value),
            "travelRatio": ratio(sheet.cell(row, 9).value),
            "frequency": grade_values(sheet, row, (14, 16, 18, 20)),
            "annualFrequency": grade_values(sheet, row, (15, 17, 19, 21)),
        })
    return rows


GREENING_QUANTITIES = {
    **dict.fromkeys(range(5, 13), "entranceLawnArea"),
    **dict.fromkeys((13, 14, 15, 17, 18, 19, 20, 21), "entranceGroundcoverArea"),
    16: "seasonalFlowerArea",
    22: "zero",
    **dict.fromkeys((23, 24), "entranceGreenArea"),
    **dict.fromkeys(range(25, 33), "mainLawnArea"),
    **dict.fromkeys((33, 34, 35, 37, 38, 39, 40, 41), "mainGroundcoverArea"),
    36: "zero",
    42: "zero",
    **dict.fromkeys((43, 44), "mainGreenArea"),
    **dict.fromkeys(range(45, 53), "treeShrubCount"),
    53: "zero",
    54: "zero",
    55: "zero",
}


def greening_rules(sheet) -> list[dict]:
    rows = []
    for row in range(5, 56):
        rows.append({
            "id": f"greening-{row}",
            "action": sheet.cell(row, 1).value,
            "property": sheet.cell(row, 10).value,
            "unit": sheet.cell(row, 2).value,
            "quantitySource": GREENING_QUANTITIES[row],
            "baseUnitHours": multiplier(sheet.cell(row, 4).value),
            "unitHoursScale": 0.25 if "/4" in sheet.cell(row, 9).value else 1,
            "travelRatio": ratio(sheet.cell(row, 7).value),
            "frequency": grade_values(sheet, row, (11, 13, 15, 17)),
            "annualFrequency": grade_values(sheet, row, (12, 14, 16, 18)),
        })
    return rows


def assistance_rules(sheet) -> list[dict]:
    definitions = {
        4: {"type": "multiply", "quantitySource": "one", "standards": {"A": 3, "B": 2, "C": 2, "D": 2}},
        5: {"type": "multiply", "quantitySource": "one", "standards": {"A": 0, "B": 0, "C": 0, "D": 0}},
        7: {"type": "multiply", "quantitySource": "one", "standards": {"A": 2, "B": 2, "C": 2, "D": 2}},
        8: {"type": "divide", "quantitySource": "totalBuildingArea", "standards": {"A": 80000, "B": 100000, "C": 100000, "D": 150000}},
        9: {"type": "divide", "quantitySource": "assistanceBaseRaw", "standards": {"A": 5.2, "B": 5.2, "C": 5.2, "D": 5.2}},
        10: {"type": "divide", "quantitySource": "assistanceWithReliefRaw", "standards": {"A": 4, "B": 4, "C": 4, "D": 8}},
    }
    rows = []
    for row in (4, 5, 7, 8, 9, 10):
        rule = definitions[row]
        rows.append({
            "id": f"assistance-{row}",
            "action": sheet.cell(row, 1).value,
            "property": sheet.cell(row, 4).value,
            "unit": sheet.cell(row, 2).value,
            "frequency": grade_values(sheet, row, (5, 7, 9, 11)),
            **rule,
        })
    return rows


def main() -> None:
    workbook = openpyxl.load_workbook(WORKBOOK, data_only=False, read_only=True)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    write_module("service-rules.mjs", "SERVICE_RULES", service_rules(workbook["服务"]))
    write_module("cleaning-rules.mjs", "CLEANING_RULES", cleaning_rules(workbook["清洁"]))
    write_module("greening-rules.mjs", "GREENING_RULES", greening_rules(workbook["绿化"]))
    write_module("assistance-rules.mjs", "ASSISTANCE_RULES", assistance_rules(workbook["客助"]))


if __name__ == "__main__":
    main()
