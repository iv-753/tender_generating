import init, { Workbook } from 'formualizer';

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
  const sheets = [];
  const cells = {};
  let keptCells = 0;
  let nonEmptyCells = 0;
  let scannedCells = 0;
  let scanTruncated = false;

  for (const name of workbook.sheetNames()) {
    const rows = new Map();
    let offset = 0;
    while (scannedCells < maxScanCells) {
      const page = workbook.rangePage(
        { sheet: name, startRow: null, startColumn: null, endRow: null, endColumn: null },
        { offset, limit: Math.min(5000, maxScanCells - scannedCells) },
      );
      scannedCells += page.items.length;
      for (const item of page.items) {
        const value = modelValue(item.value);
        if (value === null || value === '') continue;
        nonEmptyCells += 1;
        if (keptCells >= maxCells) continue;
        const address = `${columnName(item.address.column)}${item.address.row}`;
        cells[`${name}!${address}`] = value;
        if (!rows.has(item.address.row)) rows.set(item.address.row, []);
        rows.get(item.address.row).push({ address, value });
        keptCells += 1;
      }
      if (page.nextOffset === null) break;
      offset = page.nextOffset;
    }
    if (scannedCells >= maxScanCells) scanTruncated = true;
    sheets.push({
      name,
      rows: [...rows.entries()].map(([row, rowCells]) => ({ row, cells: rowCells })),
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
