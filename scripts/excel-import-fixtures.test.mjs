import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import init, { Workbook } from 'formualizer';

const fixtureRoot = new URL('../outputs/01a065d6-excel-import/', import.meta.url);

const fixtures = [
  {
    file: '01-字段别名与无关数据.xlsx',
    sheets: ['经营测算底稿', '环境与楼宇'],
    expectedProject: {
      projectName: '星河悦府', region: '广东省深圳市南山区', city: '深圳', serviceGrade: 'A', costBand: 'high',
      totalBuildingArea: 186520.5, residentialChargeArea: 128600, deliveredHouseholds: 1680,
      receivedHouseholds: 1420, occupiedHouseholds: 980, perimeterEntrances: 420, gatehouses: 3,
      pavedRoadArea: 21800, greenArea: 24500, lawnRatio: 0.42, seasonalFlowerArea: 260,
      winterProtectionArea: 0, garageFloorArea: 32600, garageFloors: 2,
      buildings: [
        { buildingCount: 6, lobbyElevatorCount: 48, stiltFloorArea: 220, totalFloors: 186, standardLobbyArea: 42, evacuationStairArea: 19, rooftopArea: 360 },
        { buildingCount: 3, lobbyElevatorCount: 24, stiltFloorArea: 110, totalFloors: 78, standardLobbyArea: 36, evacuationStairArea: 16, rooftopArea: 210 },
      ],
    },
    evidence: [
      ['经营测算底稿', 4, 3, '星河悦府'], ['经营测算底稿', 6, 3, 186520.5],
      ['经营测算底稿', 7, 3, 128600], ['环境与楼宇', 5, 3, 24500],
      ['环境与楼宇', 6, 3, 42], ['环境与楼宇', 17, 3, 32600],
    ],
  },
  {
    file: '02-多工作表与异常口径.xlsx',
    sheets: ['项目总览', '楼宇明细', '园林与地库', '历史及无关数据'],
    expectedProject: {
      projectName: '云麓华庭', region: '浙江省杭州市余杭区', city: '杭州', serviceGrade: 'B', costBand: 'high',
      totalBuildingArea: 158000, residentialChargeArea: 108000, deliveredHouseholds: 1260,
      receivedHouseholds: 930, occupiedHouseholds: 715, perimeterEntrances: 380, gatehouses: 2,
      pavedRoadArea: 17500, greenArea: 18500, lawnRatio: 0.35, seasonalFlowerArea: null,
      winterProtectionArea: 1200, garageFloorArea: 27800, garageFloors: 2,
      buildings: [
        { buildingCount: 5, lobbyElevatorCount: 40, stiltFloorArea: 180, totalFloors: 150, standardLobbyArea: 38, evacuationStairArea: 16, rooftopArea: 300 },
        { buildingCount: 2, lobbyElevatorCount: 18, stiltFloorArea: 90, totalFloors: 54, standardLobbyArea: 32, evacuationStairArea: 14, rooftopArea: 160 },
      ],
    },
    evidence: [
      ['项目总览', 5, 5, '云麓华庭'], ['项目总览', 8, 5, '10.8万㎡'],
      ['项目总览', 11, 5, 930], ['园林与地库', 6, 4, '1.85万㎡'],
      ['园林与地库', 7, 4, '35%'], ['历史及无关数据', 7, 4, 104000],
    ],
  },
];

await init();

for (const fixture of fixtures) {
  test(`${fixture.file} 保留预期口径与识别证据`, async () => {
    const workbook = Workbook.fromXlsxBytes(await readFile(new URL(fixture.file, fixtureRoot)));
    assert.deepEqual(workbook.sheetNames(), fixture.sheets);
    for (const [sheetName, row, column, expected] of fixture.evidence) {
      assert.equal(workbook.sheet(sheetName).getValue(row, column), expected, `${sheetName}!R${row}C${column}`);
    }
    assert.equal(Object.keys(fixture.expectedProject).length, 20);
    assert.equal(fixture.expectedProject.buildings.length, 2);
  });
}
