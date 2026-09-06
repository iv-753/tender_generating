import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { recognizeExcel } from './recognize-excel.mjs';

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
