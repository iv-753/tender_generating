import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extractWorkbook } from './extract-workbook.mjs';
import { recognizeRevenue } from './revenue-import.mjs';

const localWorkbook = new URL('../../../珠江/珠江数据/物业项目资料收集表（最新版）.xlsx', import.meta.url);
test('real September workbook: annual revenue with inspectable derivations and no actual staffing input', { skip: !existsSync(localWorkbook) }, async () => {
  const w = await extractWorkbook(await readFile(localWorkbook));
  const r = recognizeRevenue(w);
  assert.equal(r.commercialAnnual, 595170);
  assert.equal(r.parkingAnnual, 0);
  assert.equal(r.valueAddedAnnual, 275720);
  assert.equal(r.nonContractAnnual, 36080);
  assert.equal(r.currentResidentialRate, 2.4);
  assert.equal(r.sourceResidentialArea, 43339.375);
  assert.match(r.sources.nonContractAnnual, /E12/);
  assert.ok(r.notes.some(n => /统计/.test(n)));
});
const workbook = rows => ({ sheets: [{ name: '6 项目收入', rows: rows.map(([label, unit, value, note], i) => ({ row: i + 20, cells: Object.entries({ A: label, B: unit, C: value, E: note }).filter(([,v])=>v!==undefined).map(([c,v])=>({address:c+(i+20),value:v})) })) }] });
test('matches labels and units, rejects ambiguous annualization and incomplete notes', () => {
  assert.equal(recognizeRevenue({ sheets: [] }), null);
  const r = recognizeRevenue(workbook([
    ['车位管理费每月合计', '元/月', 100],
    ['增值服务全年收入', '万元/年', 2],
    ['无合同全年收入', '元/年', undefined, '广告收入待核实\n电动车管理费=8元/月*140*12月'],
  ]));
  assert.equal(r.parkingAnnual, 1200);
  assert.equal(r.valueAddedAnnual, 20000);
  assert.equal(r.commercialAnnual, null);
  assert.equal(r.nonContractAnnual, null);
});
