import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { extractWorkbook } from './extract-workbook.mjs';
import { normalizeRecognition } from './normalize-recognition.mjs';

const FIXTURES = new URL('../../outputs/01a065d6-excel-import/', import.meta.url);
const ref = (sheet, cell, confidence = 0.96) => ({ sheet, cell, confidence, note: '' });
const missing = () => ({ sheet: null, cell: null, confidence: 0, note: '原表未提供' });

test('normalizes units, derives city cost band, and never fills a missing field', async () => {
  const workbook = await extractWorkbook(await readFile(new URL('02-多工作表与异常口径.xlsx', FIXTURES)));
  const overview = '项目总览';
  const grounds = '园林与地库';
  const buildingSheet = '楼宇明细';
  const mapping = {
    fields: {
      projectName: ref(overview, 'E5'), region: ref(overview, 'E6'), city: ref(overview, 'E6'),
      serviceGrade: ref(overview, 'E13'), totalBuildingArea: ref(overview, 'E7'),
      residentialChargeArea: ref(overview, 'E8'), deliveredHouseholds: ref(overview, 'E9'),
      receivedHouseholds: ref(overview, 'E11'), occupiedHouseholds: ref(overview, 'E10'),
      perimeterEntrances: ref(grounds, 'D5'), gatehouses: ref(grounds, 'F5'),
      pavedRoadArea: ref(grounds, 'D11'), greenArea: ref(grounds, 'D6'), lawnRatio: ref(grounds, 'D7'),
      seasonalFlowerArea: missing(), winterProtectionArea: ref(grounds, 'D8'),
      garageFloorArea: ref(grounds, 'D14'), garageFloors: ref(grounds, 'F14'),
    },
    buildings: [4, 5].map((row) => ({
      label: row === 4 ? '高层一组团' : '洋房二组团',
      fields: {
        buildingCount: ref(buildingSheet, `B${row}`), lobbyElevatorCount: ref(buildingSheet, `C${row}`),
        stiltFloorArea: ref(buildingSheet, `D${row}`), totalFloors: ref(buildingSheet, `E${row}`),
        standardLobbyArea: ref(buildingSheet, `F${row}`), evacuationStairArea: ref(buildingSheet, `G${row}`),
        rooftopArea: ref(buildingSheet, `H${row}`),
      },
    })),
  };

  const result = normalizeRecognition(workbook, mapping, { provider: 'local', model: 'fixture-model' });

  assert.deepEqual(result.project, {
    projectName: '云麓华庭', region: '浙江省', city: '杭州市', serviceGrade: 'B', costBand: 'upper',
    recommendedCostBand: 'upper', costBandSourceVersion: '2025-wage-2026-09',
    totalBuildingArea: 158000, residentialChargeArea: 108000, deliveredHouseholds: 1260,
    receivedHouseholds: 930, occupiedHouseholds: 715, perimeterEntrances: 380, gatehouses: 2,
    pavedRoadArea: 17500, greenArea: 18500, lawnRatio: 0.35, seasonalFlowerArea: null,
    winterProtectionArea: 1200, garageFloorArea: 27800, garageFloors: 2,
    buildings: [
      { buildingCount: 5, lobbyElevatorCount: 40, stiltFloorArea: 180, totalFloors: 150, standardLobbyArea: 38, evacuationStairArea: 16, rooftopArea: 300 },
      { buildingCount: 2, lobbyElevatorCount: 18, stiltFloorArea: 90, totalFloors: 54, standardLobbyArea: 32, evacuationStairArea: 14, rooftopArea: 160 },
    ],
  });
  assert.deepEqual(result.missingFields, ['seasonalFlowerArea']);
  assert.equal(result.recognition.fields.seasonalFlowerArea.status, 'missing');
  assert.equal(result.recognition.fields.costBand.status, 'derived');
  assert.equal(result.recognition.fields.residentialChargeArea.source.raw, '10.8万㎡');
  assert.equal(JSON.stringify(result).includes('104000'), false, '不得误用历史住宅收费面积');
});

test('converts a numeric percentage and rejects a hallucinated source cell', async () => {
  const workbook = await extractWorkbook(await readFile(new URL('01-字段别名与无关数据.xlsx', FIXTURES)));
  const result = normalizeRecognition(workbook, {
    fields: {
      projectName: ref('经营测算底稿', 'C4'), region: ref('经营测算底稿', 'C5'), city: ref('经营测算底稿', 'F5'),
      serviceGrade: ref('经营测算底稿', 'F9'), lawnRatio: ref('环境与楼宇', 'C6'),
      seasonalFlowerArea: ref('环境与楼宇', 'Z99'),
    },
    buildings: [],
  }, { provider: 'qwen', model: 'qwen3.7-max' });

  assert.equal(result.project.lawnRatio, 0.42);
  assert.equal(result.project.serviceGrade, 'A');
  assert.equal(result.project.region, '广东省');
  assert.equal(result.project.city, '深圳市');
  assert.equal(result.project.costBand, 'high');
  assert.equal(result.project.recommendedCostBand, 'high');
  assert.equal(result.project.seasonalFlowerArea, null);
  assert.equal(result.recognition.fields.seasonalFlowerArea.status, 'missing');
});
