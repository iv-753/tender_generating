import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { extractWorkbook } from './extract-workbook.mjs';
import JSZip from 'jszip';

const FIXTURES = new URL('../../outputs/01a065d6-excel-import/', import.meta.url);

async function formulasFixture(cells) {
  const zip = await JSZip.loadAsync(await readFile(new URL('01-字段别名与无关数据.xlsx', FIXTURES)));
  // Keep the tab name but deliberately change its underlying filename.
  zip.remove('xl/worksheets/sheet1.xml');
  zip.file('xl/worksheets/formulas.xml', `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData><row r="1">${cells}</row></sheetData></worksheet>`);
  const relations = await zip.file('xl/_rels/workbook.xml.rels').async('string');
  zip.file('xl/_rels/workbook.xml.rels', relations.replaceAll('sheet1.xml', 'formulas.xml'));
  zip.file('[Content_Types].xml', (await zip.file('[Content_Types].xml').async('string')).replaceAll('sheet1.xml', 'formulas.xml'));
  return zip.generateAsync({ type: 'nodebuffer' });
}

test('reads cached formula numbers, zero and text using workbook relationships', async () => {
  const bytes = await formulasFixture('<c r="A1"><f>850</f><v>850</v></c><c r="B1"><f>4500*4</f><v>18000</v></c><c r="C1"><f>100+20</f><v>120</v></c><c r="D1"><f>1-1</f><v>0</v></c><c r="E1" t="str"><f>"珠江华城"</f><v>珠江华城</v></c>');
  const result = await extractWorkbook(bytes);
  assert.deepEqual(['A1','B1','C1','D1','E1'].map(a => result.cells[`经营测算底稿!${a}`]), [850,18000,120,0,'珠江华城']);
  assert.match(result.modelText, /B1=18000/);
  const capped = await extractWorkbook(bytes, { maxCells: 2 });
  assert.equal(Object.keys(capped.cells).length, 2);
  assert.equal(capped.truncated, true);
});

test('evaluates formulas without caches, including cross-sheet references', async () => {
  const result = await extractWorkbook(await formulasFixture('<c r="A1"><f>4500*4</f></c><c r="B1"><f>\'环境与楼宇\'!C6*2</f></c>'));
  assert.equal(result.cells['经营测算底稿!A1'], 18000);
  assert.equal(result.cells['经营测算底稿!B1'], 84);
});

test('does not turn formula errors into blank or zero', async () => {
  const result = await extractWorkbook(await formulasFixture('<c r="A1" t="e"><f>1/0</f><v>#DIV/0!</v></c><c r="B1"><f>1/0</f></c>'));
  assert.match(result.cells['经营测算底稿!A1'], /公式错误/);
  assert.ok(result.cells['经营测算底稿!B1']);
  assert.notEqual(result.cells['经营测算底稿!B1'], 0);
});

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
