import assert from 'node:assert/strict';
import test from 'node:test';
import { recognizeZhujiangWorkbook } from './zhujiang-import.mjs';
import { recognizeExcelSmart, recognizeExcelWithFallback } from './recognize-excel.mjs';
import { createExcelRecognitionHandler } from '../../api/excel/recognize.mjs';
import { createRecognitionProvider } from './providers.mjs';
import { calculateZhujiangProject } from '../calculation/zhujiang-model.mjs';
import { validateProject } from '../calculation/calculator.mjs';
import { EXAMPLE_PROJECT } from '../../src/exampleProject.ts';
import JSZip from 'jszip';

function workbook(sheets) {
  const cells = {};
  return { truncated: false, cells, sheets: Object.entries(sheets).map(([name, data]) => ({ name,
    rows: data.map(([row, values]) => ({ row, cells: Object.entries(values).map(([col, value]) => {
      const address = `${col}${row}`; cells[`${name}!${address}`] = value; return { address, value };
    }) })),
  })) };
}
const fixture = (extra = {}) => workbook({
  '1 项目基本情况': [
    [6, { A: '项目', B: '单位', C: '填写内容' }],
    [7, { A: '项目名称', B: '—', C: '测试花园' }], [8, { A: '省份', C: '广东省' }],
    [9, { A: '城市', C: '广州市' }], [10, { A: '区／县', C: '越秀区' }],
    [11, { A: '服务档位（按珠江档位填写）', C: '重点项目' }],
    [12, { A: '总建筑面积', B: '㎡', C: 56423 }], [13, { A: '住宅收费面积', B: '㎡', C: 43000 }],
    [14, { A: '已交付户数', B: '户', C: 386 }], [15, { A: '已收楼户数', B: '户', C: 380 }],
    [16, { A: '常住户数', B: '户', C: 370 }], [17, { A: '出入口及外围面积', B: '㎡', C: 350 }],
    [20, { A: '绿化面积', B: '㎡', H: '项目自行绿化维护工作' }],
    [21, { A: '草坪占绿化面积比例', B: '%', C: 50 }],
    [24, { A: '单层车库面积', B: '㎡', H: '地下车库产权已独立出售，不在小区管理范围之内' }],
    [25, { A: '车库层数', B: '层', C: 4 }],
    [29, { A: '项目', B: '单位', C: '第1组', D: '第2组' }],
    [30, { A: '楼栋数量', B: '栋', C: 1, D: 1 }],
    [31, { A: '大堂及电梯厅面积', B: '㎡', C: 100, D: 100 }],
    [32, { A: '架空层面积', B: '㎡', C: 850, D: 850 }],
    [33, { A: '楼层总数', B: '层', C: 29, D: 28 }],
    [34, { A: '标准前厅面积', B: '㎡', C: 20, D: 20 }],
    [35, { A: '疏散楼梯面积', B: '㎡', C: 290, D: 280, H: '整栋楼疏散楼梯面积' }],
    [36, { A: '天台面积', B: '㎡', C: 824, D: 824 }],
  ],
  '2 设备和场地': [
    [6, { A: '序号', B: '设备或场地', C: '单位', D: '填写数量／面积' }],
    [8, { A: 1, B: '地下停车区防火卷帘数量', C: '个', D: '-' }],
    [12, { A: 5, B: '地下发电机房数量', C: '个', D: 4 }],
    [35, { A: 27, B: '首层架空层面积', C: '㎡', D: 100 }],
    [40, { A: 32, B: '屋面层面积', C: '㎡' }],
    [43, { A: 35, B: '电梯数量', C: '台', D: 6 }],
    [44, { A: 36, B: '避难层面积', C: '㎡', D: 0 }],
    [49, { A: 41, B: '楼栋管井数量', C: '个' }],
  ],
  '3 固定值守点': [[5, { A: '值守位置', B: '有几个点位', C: '每天几班', D: '每班每个点位几人', E: '值守时间' }],
    [9, { A: '中控室', B: 1, C: 2, D: 1, E: '8:00-20:00，20:00-8:00' }]],
  '合同约定服务标准': [[5, { A: '序号', B: '服务内容', C: '服务频次（如2次/季，6次/年等）' }],
    [7, { A: 1, B: '邮包、快递外卖代收', C: '不提供' }],
    [12, { A: 5, B: '出入口大门地面深度清扫', C: '1月1次' }],
    [17, { A: 10, B: '大堂电梯地面大理石保养', C: '/', E: '不涉及' }],
    [44, { A: 33, B: '安保领班一共几人', C: 99 }]],
  '5 实际人数和费用': [[7, { A: '管理—项目经理', B: 7, C: 999999 }]],
  '6 项目收入': [[6, { A: '住宅物业费单价', C: 99 }]], ...extra,
});

test('imports quantities/plans, excludes observed staffing/pay and separates revenue from cost inputs', () => {
  const r = recognizeZhujiangWorkbook(fixture());
  assert.equal(r.project.projectName, '测试花园');
  assert.equal(r.project.district, '越秀区');
  assert.equal(r.project.lawnRatio, .5);
  assert.equal(r.project.buildings.length, 2);
  assert.equal(r.project.buildings[0].evacuationStairArea, 10);
  assert.equal(r.project.workbookOverrides['zhuj.asset.building.elevatorCount'], 6);
  assert.equal(r.project.workbookOverrides['zhuj.asset.basement.generatorRoomCount'], 4);
  assert.equal(r.project.workbookOverrides['清洁!X7'], 12);
  assert.equal(r.project.workbookOverrides['服务!P8'], 0);
  assert.equal(r.project.workbookOverrides['zhuj.lobbyMarbleArea'], 0);
  assert.equal(r.project.workbookOverrides['zhuj.monitorPosts'], 1);
  assert.equal(r.project.workbookOverrides['zhuj.monitorStaff'], 1);
  assert.ok(!Object.keys(r.project.workbookOverrides).some(k => /annualCost|managementAnnualCost|securityLeaders/.test(k)));
  assert.equal(r.ignoredSheets.length, 1);
  assert.ok(r.project.revenueScenario);
});

test('reports contradictory geometry, unknown grade and missing values without guessing', () => {
  const r = recognizeZhujiangWorkbook(fixture());
  assert.equal(r.project.serviceGrade, null);
  assert.equal(r.project.greenArea, null);
  assert.equal(r.project.workbookOverrides['zhuj.asset.building.refugeFloorArea'], 0);
  assert.equal(r.project.workbookOverrides['zhuj.asset.building.shaftCount'], undefined);
  assert.equal(r.project.workbookOverrides['zhuj.asset.building.roofArea'], 1648);
  assert.equal(r.project.workbookOverrides['zhuj.asset.building.stiltFloorArea'], undefined);
  assert.ok(r.issues.some(x => x.key === 'zhuj.asset.building.stiltFloorArea' && x.kind === 'conflict' && x.sources.length >= 2));
  assert.ok(r.issues.some(x => x.key === 'greenArea' && x.kind === 'missing'));
});

test('an excluded garage does not exclude shared pump or electrical rooms', () => {
  const r = recognizeZhujiangWorkbook(fixture());
  assert.equal(r.project.workbookOverrides['zhuj.garageIncluded'], 0);
  assert.equal(r.project.garageFloorArea, 0);
  assert.equal(r.project.workbookOverrides['zhuj.asset.basement.fireShutterCount'], undefined);
  assert.equal(r.project.workbookOverrides['zhuj.asset.basement.generatorRoomCount'], 4);
});

test('rejects negatives, wrong units, fractional equipment, ambiguous numbers and disagreeing duplicates', () => {
  const r = recognizeZhujiangWorkbook(fixture({ '2 设备和场地': [
    [6, { B: '设备或场地', C: '单位', D: '填写数量／面积' }],
    [7, { B: '电梯数量', C: '台', D: 1.5 }],
    [8, { B: '地下发电机房数量', C: '个', D: -2 }],
    [9, { B: '园区围墙长度', C: '㎡', D: 250 }],
    [10, { B: '园区排水井数量', C: '个', D: '约12或15' }],
    [11, { B: '园区垃圾收集点数量', C: '个', D: 2 }],
    [12, { B: '园区垃圾收集点数量', C: '个', D: 3 }],
  ] }));
  for (const key of ['building.elevatorCount', 'basement.generatorRoomCount', 'grounds.wallLength', 'grounds.drainageWellCount']) {
    assert.ok(r.issues.some(x => x.key === `zhuj.asset.${key}` && x.kind === 'invalid'), key);
    assert.equal(r.project.workbookOverrides[`zhuj.asset.${key}`], undefined);
  }
  assert.ok(r.issues.some(x => x.key === 'zhuj.asset.grounds.wasteCollectionPointCount' && x.kind === 'conflict'));
});

test('AI suggestions can only supplement unmatched calculation rows and cannot overwrite rules', () => {
  const w = fixture({ '2 设备和场地': [[6, { B: '设备或场地', C: '单位', D: '填写数量／面积' }],
    [7, { B: '电梯数量', C: '台', D: 6 }], [8, { B: '备用发电设备房间数', C: '个', D: 4 }]] });
  const suggestions = [
    { key: 'zhuj.asset.basement.generatorRoomCount', sheet: '2 设备和场地', cell: 'D8', confidence: .96 },
    { key: 'zhuj.asset.building.elevatorCount', sheet: '2 设备和场地', cell: 'D8', confidence: .99 },
    { key: 'zhuj.managementAnnualCost.0', sheet: '5 实际人数和费用', cell: 'C7', confidence: 1 },
  ];
  const r = recognizeZhujiangWorkbook(w, suggestions);
  assert.equal(r.project.workbookOverrides['zhuj.asset.basement.generatorRoomCount'], 4);
  assert.equal(r.project.workbookOverrides['zhuj.asset.building.elevatorCount'], 6);
  assert.equal(r.project.workbookOverrides['zhuj.managementAnnualCost.0'], undefined);
});

async function xlsx(w) {
  const xml = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/></Types>');
  zip.file('_rels/.rels', '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>');
  zip.file('xl/workbook.xml', `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${w.sheets.map((s, i) => `<sheet name="${xml(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`);
  zip.file('xl/_rels/workbook.xml.rels', `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${w.sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}</Relationships>`);
  w.sheets.forEach((s, i) => zip.file(`xl/worksheets/sheet${i + 1}.xml`, `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${s.rows.map(r => `<row r="${r.row}">${r.cells.map(c => typeof c.value === 'number' ? `<c r="${c.address}"><v>${c.value}</v></c>` : `<c r="${c.address}" t="inlineStr"><is><t>${xml(c.value)}</t></is></c>`).join('')}</row>`).join('')}</sheetData></worksheet>`));
  return zip.generateAsync({ type: 'nodebuffer' });
}

test('imports more than five annotated groups and reads the relocated notes column', () => {
  const w = fixture();
  const basic = w.sheets[0];
  const groupRows = basic.rows.filter(r => r.row >= 29);
  const columns = ['C','D','E','F','G','H','I','J','K','L','M','N'];
  for (const row of groupRows) {
    const original = row.cells.find(c => c.address === `C${row.row}`)?.value;
    row.cells = row.cells.filter(c => /^[AB]\d+$/.test(c.address));
    for (const [i, col] of columns.entries()) row.cells.push({ address: `${col}${row.row}`, value: row.row === 29 ? `第${i + 1}组（${i + 1}栋）` : original });
    row.cells.push({ address: `O${row.row}`, value: row.row === 29 ? '怎么填' : row.row === 35 ? '每栋整栋面积' : '' });
  }
  const r = recognizeZhujiangWorkbook(w);
  assert.equal(r.project.buildings.length, 12);
  assert.equal(r.project.buildings[11].lobbyElevatorCount, 100);
  assert.equal(r.project.buildings[11].evacuationStairArea, 10);
  assert.equal(r.recognition.buildings[11].label, '第12组（12栋）');
  assert.ok(!r.issues.some(i => i.key === 'buildings'));
});

test('formula values reach project fields while out-of-scope garages remain excluded', async () => {
  const zip = await JSZip.loadAsync(await xlsx(fixture()));
  let xml = await zip.file('xl/worksheets/sheet1.xml').async('string');
  xml = xml.replace('<row r="20">', '<row r="20"><c r="C20"><f>850</f><v>850</v></c>')
    .replace('<row r="24">', '<row r="24"><c r="C24"><f>4500*4</f><v>18000</v></c>')
    .replace('<c r="C31"><v>100</v></c>', '<c r="C31"><f>100+20</f><v>120</v></c>')
    .replace('<c r="C35"><v>290</v></c>', '<c r="C35"><f>29*2*20+80</f><v>1240</v></c>');
  zip.file('xl/worksheets/sheet1.xml', xml);
  const r = await recognizeExcelSmart(await zip.generateAsync({ type: 'nodebuffer' }));
  assert.equal(r.project.greenArea, 850);
  assert.equal(r.project.garageFloorArea, 18000);
  assert.equal(r.project.workbookOverrides['zhuj.garageIncluded'], 0);
  assert.equal(r.project.buildings[0].lobbyElevatorCount, 120);
  assert.equal(r.project.buildings[0].evacuationStairArea * 29, 1240);
  assert.ok(r.issues.some(issue => issue.key === 'zhuj.asset.building.stiltFloorArea'));
});

test('known template uses rules without calling AI, even when source data needs correction', async () => {
  let calls = 0;
  const bytes = await xlsx(fixture());
  const r = await recognizeExcelSmart(bytes, { provider: { async mapSupplement() { calls++; throw Error('must not call'); } } });
  assert.equal(r.provider, 'local-rules');
  assert.equal(calls, 0);
  assert.equal(r.project.workbookOverrides['zhuj.asset.building.elevatorCount'], 6);
  assert.deepEqual(r.unmatchedRows, []);
  await recognizeExcelWithFallback(bytes, { remoteRecognize() { calls++; throw Error('must not call'); } });
  assert.equal(calls, 0, 'portable upload must also stay local for known missing data');
});

test('unknown equipment labels alone reach the API and API failure keeps valid local data', async () => {
  const bytes = await xlsx(fixture({ '2 设备和场地': [[6, { B: '设备或场地', C: '单位', D: '填写数量／面积' }],
    [7, { B: '电梯数量', C: '台', D: 6 }], [8, { B: '备用发电设备房间数', C: '个', D: 4 }]] }));
  let calls = 0;
  const provider = createRecognitionProvider({ provider: 'local', baseUrl: 'https://example.test/v1', model: 'fixture', async fetchImpl(url, options) {
    calls++;
    const body = JSON.parse(options.body);
    const payload = JSON.parse(body.messages[1].content);
    assert.equal(payload.rows.length, 1);
    assert.equal(payload.rows[0].label, '备用发电设备房间数');
    assert.doesNotMatch(body.messages[1].content, /999999|实际人数和费用|项目收入/);
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ mappings: [{ key: 'zhuj.asset.basement.generatorRoomCount', sheet: '2 设备和场地', cell: 'D8', confidence: .95 }] }) } }] }));
  } });
  const enhanced = await recognizeExcelSmart(bytes, { provider });
  assert.equal(calls, 1);
  assert.equal(enhanced.project.workbookOverrides['zhuj.asset.basement.generatorRoomCount'], 4);
  assert.equal(enhanced.project.workbookOverrides['zhuj.asset.building.elevatorCount'], 6);
  const fallback = await recognizeExcelSmart(bytes, { provider: { async mapSupplement() { throw Error('offline'); } } });
  assert.equal(fallback.project.workbookOverrides['zhuj.asset.building.elevatorCount'], 6);
  assert.ok(fallback.issues.some(i => i.kind === 'unmatched'));
  assert.match(fallback.warnings.at(-1), /智能识别暂时不可用/);
});

test('API upload returns template parameters and calculation consumes the accepted values', async () => {
  const handler = createExcelRecognitionHandler({ loadConfig: async () => ({}) });
  const response = await handler.fetch(new Request('http://localhost/api/excel/recognize', { method: 'POST', headers: { 'x-file-name': encodeURIComponent('项目资料.xlsx') }, body: await xlsx(fixture()) }));
  assert.equal(response.status, 200);
  const r = await response.json();
  const project = { ...EXAMPLE_PROJECT, calculationModel: 'zhujiang-v1', district: '增城区', workbookOverrides: r.project.workbookOverrides };
  const output = calculateZhujiangProject(project);
  assert.equal(output.actions.find(a => a.id === 'engineering-routine-104').quantity, 6);
  assert.equal(output.actions.find(a => a.id === 'cleaning-7').annualFrequency, 12);
  assert.equal(output.management.roles[0].headcount, 1);
  assert.match(validateProject({ ...project, importReviewIssues: r.issues }), /导入资料仍有待核对项/);
});

test('conflicting duplicate AI matches and cross-sheet areas stay unresolved', () => {
  const w = fixture({ '2 设备和场地': [[6, { B: '设备或场地', C: '单位', D: '填写数量／面积' }],
    [7, { B: '出入口及广场面积', C: '㎡', D: 999 }],
    [8, { B: '备用发电设备房间数', C: '个', D: 4 }], [9, { B: '另一发电机房数', C: '个', D: 5 }]] });
  const r = recognizeZhujiangWorkbook(w, [8, 9].map(n => ({ key: 'zhuj.asset.basement.generatorRoomCount', sheet: '2 设备和场地', cell: `D${n}`, confidence: .99 })));
  for (const key of ['zhuj.asset.grounds.entrancePlazaArea', 'zhuj.asset.basement.generatorRoomCount']) {
    assert.ok(r.issues.some(i => i.key === key && i.kind === 'conflict'));
    assert.equal(r.project.workbookOverrides[key], undefined);
  }
});
