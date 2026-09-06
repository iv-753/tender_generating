import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { recognizeExcel, recognizeExcelLocally, recognizeExcelWithFallback } from './recognize-excel.mjs';

const FIXTURE = new URL('../../outputs/01a065d6-excel-import/02-多工作表与异常口径.xlsx', import.meta.url);
const emptyMapping = { fields: {}, buildings: [] };

test('sends the complete workbook and rule candidates to the provider', async () => {
  let received;
  const provider = {
    provider: 'fixture',
    model: 'fixture',
    async mapWorkbook(text, candidates) {
      received = { text, candidates };
      return emptyMapping;
    },
  };

  await recognizeExcel(await readFile(FIXTURE), { provider });

  assert.match(received.text, /历史及无关数据/);
  assert.equal(received.candidates.fields.residentialChargeArea[0].cell, 'E8');
  assert.equal(received.candidates.buildings[0].fields.buildingCount[0].cell, 'B4');
});

test('falls back to complete-workbook AI mapping when candidate generation fails', async () => {
  let received;
  const provider = {
    provider: 'fixture',
    model: 'fixture',
    async mapWorkbook(text, candidates) {
      received = { text, candidates };
      return emptyMapping;
    },
  };

  await recognizeExcel(await readFile(FIXTURE), {
    provider,
    buildCandidates() { throw new Error('rule failure'); },
  });

  assert.match(received.text, /项目总览/);
  assert.equal(received.candidates, undefined);
});

test('recognizes common workbook fields without an AI provider', async () => {
  const result = await recognizeExcelLocally(await readFile(FIXTURE));

  assert.equal(result.provider, 'local-rules');
  assert.equal(result.project.projectName, '云麓华庭');
  assert.equal(result.project.region, '浙江省');
  assert.equal(result.project.city, '杭州市');
  assert.equal(result.project.residentialChargeArea, 108000);
  assert.ok(result.missingFields.includes('seasonalFlowerArea'));
});

test('returns local rule results with a warning when online enhancement is unavailable', async () => {
  const result = await recognizeExcelWithFallback(await readFile(FIXTURE), {
    async remoteRecognize() { throw new Error('network unavailable'); },
  });

  assert.equal(result.provider, 'local-rules');
  assert.equal(result.project.projectName, '云麓华庭');
  assert.match(result.warnings.at(-1), /智能识别暂时不可用/);
});

test('uses online enhancement when local rules leave fields to confirm', async () => {
  const enhanced = { version: 1, provider: 'qwen', model: 'fixture', project: {}, recognition: { fields: {}, buildings: [] }, missingFields: [], warnings: [] };
  let calls = 0;
  const result = await recognizeExcelWithFallback(await readFile(FIXTURE), {
    async remoteRecognize(bytes) {
      calls += 1;
      assert.ok(bytes.length > 0);
      return enhanced;
    },
  });

  assert.equal(calls, 1);
  assert.equal(result, enhanced);
});
