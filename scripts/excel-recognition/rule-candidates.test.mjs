import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { extractWorkbook } from './extract-workbook.mjs';
import { buildRuleCandidates } from './rule-candidates.mjs';

const FIXTURES = new URL('../../outputs/01a065d6-excel-import/', import.meta.url);

test('finds current scalar fields and excludes historical sheets', async () => {
  const workbook = await extractWorkbook(await readFile(new URL('02-多工作表与异常口径.xlsx', FIXTURES)));
  const result = buildRuleCandidates(workbook);

  assert.equal(result.fields.projectName[0].cell, 'E5');
  assert.equal(result.fields.residentialChargeArea[0].cell, 'E8');
  assert.equal(result.fields.greenArea[0].cell, 'D6');
  assert.equal(result.fields.seasonalFlowerArea.length, 0);
  assert.equal(Object.values(result.fields).flat().some((item) => item.sheet === '历史及无关数据'), false);
});

test('recognizes aliases and finds tabular building source cells', async () => {
  const workbook = await extractWorkbook(await readFile(new URL('01-字段别名与无关数据.xlsx', FIXTURES)));
  const result = buildRuleCandidates(workbook);

  assert.equal(result.fields.totalBuildingArea[0].cell, 'C6');
  assert.equal(result.fields.residentialChargeArea[0].cell, 'F6');
  assert.equal(result.fields.serviceGrade[0].cell, 'F9');
  assert.equal(result.buildings[0].fields.buildingCount[0].cell, 'C11');
  assert.equal(result.buildings[1].fields.rooftopArea[0].cell, 'I12');
});

test('keeps conflicting valid candidates for AI review', async () => {
  const workbook = await extractWorkbook(await readFile(new URL('01-字段别名与无关数据.xlsx', FIXTURES)));
  const result = buildRuleCandidates(workbook);

  assert.equal(result.fields.residentialChargeArea.length, 2);
  assert.ok(result.conflicts.includes('residentialChargeArea'));
});
