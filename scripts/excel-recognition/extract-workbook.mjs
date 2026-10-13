import init, { Workbook } from 'formualizer';
import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';
import { posix } from 'node:path';

// Use Excel's saved formula results, including zero and text. Sheet IDs and
// filenames need not match the visible tab order, so resolve workbook relations.
async function formulaResults(bytes) {
  const zip = await JSZip.loadAsync(bytes);
  const readXml = async (path) => {
    const file = zip.file(path);
    return file ? new DOMParser().parseFromString((await file.async('string')).replace(/^\uFEFF/, ''), 'application/xml') : null;
  };
  const elements = (node, name) => Array.from(node?.getElementsByTagNameNS('*', name) ?? []);
  const book = await readXml('xl/workbook.xml');
  const relations = await readXml('xl/_rels/workbook.xml.rels');
  const targets = new Map(elements(relations, 'Relationship')
    .filter(r => r.getAttribute('TargetMode') !== 'External')
    .map(r => [r.getAttribute('Id'), r.getAttribute('Target')]));
  const strings = elements(await readXml('xl/sharedStrings.xml'), 'si')
    .map(si => elements(si, 't').map(t => t.textContent).join(''));
  const results = new Map();
  for (const sheet of elements(book, 'sheet')) {
    const id = sheet.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
    const target = targets.get(id);
    if (!target) continue;
    const path = target.startsWith('/') ? target.slice(1) : posix.normalize(posix.join('xl', target));
    if (!path.startsWith('xl/')) continue;
    const xml = await readXml(path);
    for (const cell of elements(xml, 'c')) {
      if (!elements(cell, 'f').length) continue;
      const value = elements(cell, 'v')[0];
      const raw = value?.textContent ?? '';
      const type = cell.getAttribute('t');
      let resolved;
      if (value && type === 'str') resolved = raw;
      else if (value && type === 's' && /^\d+$/.test(raw)) resolved = strings[Number(raw)];
      else if (type === 'b' && /^[01]$/.test(raw)) resolved = raw === '1';
      else if (type === 'e') resolved = `公式错误：${raw || '未知错误'}`;
      else if (raw.trim() !== '' && Number.isFinite(Number(raw))) resolved = Number(raw);
      const match = /^([A-Z]+)([1-9]\d*)$/.exec(cell.getAttribute('r'));
      if (!match) continue;
      const column = [...match[1]].reduce((n, char) => n * 26 + char.charCodeAt(0) - 64, 0);
      const name = sheet.getAttribute('name');
      if (!results.has(name)) results.set(name, new Map());
      results.get(name).set(cell.getAttribute('r'), { value: resolved, address: { row: Number(match[2]), column } });
    }
  }
  return results;
}

function columnName(column) {
  let value = column;
  let result = '';
  while (value > 0) {
    value -= 1;
    result = String.fromCharCode(65 + (value % 26)) + result;
    value = Math.floor(value / 26);
  }
  return result;
}

function modelValue(value) {
  if (['string', 'number', 'boolean'].includes(typeof value)) return value;
  if (value === null || value === undefined) return null;
  try {
    return JSON.stringify(value).slice(0, 300);
  } catch {
    return String(value).slice(0, 300);
  }
}

export async function extractWorkbook(bytes, { maxCells = 6000, maxScanCells = 100000 } = {}) {
  if (!(bytes instanceof Uint8Array) && !Buffer.isBuffer(bytes)) throw new TypeError('Excel 文件内容无效');
  await init();
  const workbook = Workbook.fromXlsxBytes(bytes);
  const savedFormulaResults = await formulaResults(bytes);
  const sheets = [];
  const cells = {};
  let keptCells = 0;
  let nonEmptyCells = 0;
  let scannedCells = 0;
  let scanTruncated = false;

  for (const name of workbook.sheetNames()) {
    const rows = new Map();
    const seen = new Set();
    const formulas = savedFormulaResults.get(name) ?? new Map();
    const readItem = (item) => {
      const address = `${columnName(item.address.column)}${item.address.row}`;
      seen.add(address);
      const formula = formulas.get(address);
      let raw = item.value;
      if (formula?.value !== undefined) raw = formula.value;
      else if (item.formula || formula) {
        // Generated files may omit caches. Never execute formulas as JavaScript.
        try { raw = workbook.evaluateCell(name, item.address.row, item.address.column); }
        catch { raw = '公式结果无法计算，请在 Excel 中重新计算并保存'; }
        if (raw === null || raw === undefined || typeof raw === 'object') raw = '公式结果无法计算，请核对原表公式';
      }
      const value = modelValue(raw);
      if (value === null || value === '') return;
      nonEmptyCells += 1;
      if (keptCells >= maxCells) return;
      cells[`${name}!${address}`] = value;
      if (!rows.has(item.address.row)) rows.set(item.address.row, []);
      rows.get(item.address.row).push({ address, value });
      keptCells += 1;
    };
    let offset = 0;
    while (scannedCells < maxScanCells) {
      const page = workbook.rangePage(
        { sheet: name, startRow: null, startColumn: null, endRow: null, endColumn: null },
        { offset, limit: Math.min(5000, maxScanCells - scannedCells) },
      );
      scannedCells += page.items.length;
      for (const item of page.items) readItem(item);
      if (page.nextOffset === null) break;
      offset = page.nextOffset;
    }
    // The library's used range can omit cells (or entire sheets) containing only formulas.
    for (const [address, formula] of formulas) {
      if (seen.has(address)) continue;
      if (scannedCells >= maxScanCells) { scanTruncated = true; break; }
      scannedCells += 1;
      readItem({ address: formula.address, value: null, formula: true });
    }
    if (scannedCells >= maxScanCells) scanTruncated = true;
    sheets.push({
      name,
      rows: [...rows.entries()].sort(([a], [b]) => a - b).map(([row, rowCells]) => ({ row, cells: rowCells })),
    });
    if (scanTruncated) break;
  }

  const modelText = sheets.map((sheet) => {
    const lines = sheet.rows.map(({ row, cells: rowCells }) => `R${row}: ${rowCells.map(({ address, value }) => `${address}=${String(value)}`).join(' | ')}`);
    return `【工作表：${sheet.name}】\n${lines.join('\n')}`;
  }).join('\n\n');

  return {
    sheets,
    cells,
    modelText,
    totalNonEmptyCells: nonEmptyCells,
    truncated: scanTruncated || nonEmptyCells > keptCells,
  };
}
