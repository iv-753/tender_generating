import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import init, { Workbook } from 'formualizer';

const modelUrl = new URL('../../动态成本分析模型.xlsx', import.meta.url);
const expectedSheets = ['总-汇总表', '服务', '清洁', '绿化', '客助'];
const actionRows = {
  '服务': Array.from({ length: 17 }, (_, index) => index + 5),
  '清洁': Array.from({ length: 48 }, (_, index) => index + 5),
  '绿化': Array.from({ length: 51 }, (_, index) => index + 5),
  '客助': [4, 5, 7, 8, 9, 10],
};
const actionOutputs = {
  '服务': [19, 20],
  '清洁': [25, 27, 28],
  '绿化': [25, 26],
  '客助': [16],
};
const summaries = [
  ['服务', 27, 20, 438000, 'T27'],
  ['清洁', 60, 27, 737019.230769233, 'AA60'],
  ['绿化', 61, 26, 210576.923076923, 'Z61'],
  ['客助', 13, 16, 1056000, 'P13'],
];
const tolerance = 0.02;

function assertNumericOutput(value, label) {
  assert.equal(
    typeof value === 'number' && Number.isFinite(value),
    true,
    `${label} expected a finite numeric output, received ${JSON.stringify(value)}`,
  );
}

await init();
const workbook = Workbook.fromXlsxBytes(await readFile(modelUrl));
const sheetNames = workbook.sheetNames();

for (const sheetName of expectedSheets) {
  assert.ok(sheetNames.includes(sheetName), `missing worksheet: ${sheetName}`);
}

const allActionRows = Object.values(actionRows).flat();
assert.equal(allActionRows.length, 122, 'expected exactly 122 action rows');
assert.ok(!actionRows['客助'].includes(6), '客助 row 6 must be excluded');

workbook.evaluateAll();

for (const [sheetName, rows] of Object.entries(actionRows)) {
  const sheet = workbook.sheet(sheetName);
  for (const row of rows) {
    for (const column of actionOutputs[sheetName]) {
      assertNumericOutput(sheet.getValue(row, column), `${sheetName}!R${row}C${column}`);
    }
  }
}

for (const [sheetName, row, column, expected, address] of summaries) {
  const actual = workbook.sheet(sheetName).getValue(row, column);
  assertNumericOutput(actual, `${sheetName}!${address}`);
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${sheetName}!${address} expected ${expected} ± ${tolerance}, received ${actual}`,
  );
  console.log(`PASS ${sheetName}!${address} = ${actual}`);
}

console.log(`PASS worksheets=${expectedSheets.length} actions=${allActionRows.length} tolerance=${tolerance}`);
