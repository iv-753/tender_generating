import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { extractWorkbook } from './extract-workbook.mjs';

const FIXTURES = new URL('../../outputs/01a065d6-excel-import/', import.meta.url);

test('extracts non-empty cells with stable sheet names and A1 addresses', async () => {
  const bytes = await readFile(new URL('01-字段别名与无关数据.xlsx', FIXTURES));
  const result = await extractWorkbook(bytes);

  assert.deepEqual(result.sheets.map((sheet) => sheet.name), ['经营测算底稿', '环境与楼宇']);
  assert.equal(result.cells['经营测算底稿!C4'], '星河悦府');
  assert.equal(result.cells['环境与楼宇!C6'], 42);
  assert.equal(result.cells['环境与楼宇!F17'], 2);
  assert.equal(result.truncated, false);
  assert.match(result.modelText, /环境与楼宇/);
  assert.match(result.modelText, /C6=42/);
});

test('keeps current and historical evidence distinguishable and caps oversized input', async () => {
  const bytes = await readFile(new URL('02-多工作表与异常口径.xlsx', FIXTURES));
  const full = await extractWorkbook(bytes);
  assert.equal(full.cells['项目总览!E8'], '10.8万㎡');
  assert.equal(full.cells['历史及无关数据!D7'], 104000);

  const capped = await extractWorkbook(bytes, { maxCells: 12 });
  assert.equal(capped.truncated, true);
  assert.equal(Object.keys(capped.cells).length, 12);
});
