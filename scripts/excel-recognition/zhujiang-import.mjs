import { CITY_CATALOG_VERSION, normalizeCityLocation } from '../calculation/city-catalog.mjs';
import { recognizeRevenue } from './revenue-import.mjs';
import { BASIC_IMPORT_FIELDS, BUILDING_IMPORT_FIELDS, ASSET_IMPORT_FIELDS, PLAN_IMPORT_FIELDS, SUPPLEMENT_FIELDS, GARAGE_ASSET_KEYS, normalizeLabel } from './zhujiang-import-fields.mjs';

const missingText = /^(?:待核实|待确认|不清楚|未知|未约定|未提供|暂无|[-—/／]*)$/;
const absentText = /^(?:0|无|没有|不涉及|不提供|无需|不适用)$/;
const grades = { A: 'A', B: 'B', C: 'C', D: 'D', 御享: 'A', 雅享: 'B', 悦享: 'C', 善享: 'D' };
const normalizeUnit = value => String(value ?? '').replace(/平方米|m²|m2/gi, '㎡').replace(/米/g, 'm').replace(/％/, '%').trim();
const at = (row, col) => row?.cells.find(c => c.address.replace(/\d+/g, '') === col);
const hasValue = value => value !== undefined && value !== null && String(value).trim() !== '';
const noteOf = (row, columns) => columns.map(col => at(row, col)?.value ?? '').join(' ');
const matches = (value, def) => [def.label, ...(def.aliases ?? [])].some(label => normalizeLabel(value) === normalizeLabel(label));
const ref = (sheet, row, col) => ({ sheet: sheet.name, cell: `${col}${row.row}`, raw: at(row, col)?.value ?? null });

export function parseImportValue(raw, def, unit = '', note = '') {
  if (def.type === 'text') return hasValue(raw) && !missingText.test(String(raw).trim()) ? { value: String(raw).trim() } : { kind: 'missing', message: '原表未填写。' };
  if (def.type === 'grade') return grades[String(raw ?? '').trim().toUpperCase()]
    ? { value: grades[String(raw).trim().toUpperCase()] }
    : { kind: 'missing', message: '请确认对应的御享、雅享、悦享或善享档位；“重点项目”等分类不能直接换算。' };
  let text = String(raw ?? '').trim().replace(/[,，\s]/g, '');
  if (def.type === 'frequency') {
    // Accept an explicit zero with an unambiguous absence explanation, not
    // arbitrary parenthesized caveats such as “0（另有2次）”.
    const explainedZero = /^0(?:次)?[（(](?:(?:无|没有)(?:空巢老人|服务对象|该设施|此设施|此项目)|不涉及|不提供|无需|不适用)[）)]$/.test(text);
    if (absentText.test(text) || explainedZero || (/^[/／—-]+$/.test(text) && /不涉及|不提供|无需/.test(note))) return { value: 0 };
    if (missingText.test(text)) return { kind: 'missing', message: '未提供明确计划，不按零次处理。' };
    if (def.eventCount) return { kind: 'conflict', message: '测算需要全年服务总次数；“提供”或每人频次不能直接换成全年总量。' };
    const factors = { 天: 365, 日: 365, 周: 52, 月: 12, 季: 4, 季度: 4, 年: 1 };
    let m = text.match(/^(?:每)?(\d+(?:\.\d+)?)?(天|日|周|月|季度|季|年)(\d+(?:\.\d+)?)次$/);
    if (m && Number(m[1] ?? 1) > 0) return { value: Number(m[3]) * factors[m[2]] / Number(m[1] ?? 1) };
    m = text.match(/^(\d+(?:\.\d+)?)(?:次)?[/／](?:(\d+(?:\.\d+)?))?(天|日|周|月|季度|季|年)$/);
    if (m && Number(m[2] ?? 1) > 0) return { value: Number(m[1]) * factors[m[3]] / Number(m[2] ?? 1) };
    return { kind: 'invalid', message: '频次需带明确周期，例如每月1次、2次/季；按需开展不能自动折算。' };
  }
  if (!hasValue(raw) || missingText.test(text)) return { kind: 'missing', message: '原表未填写明确数值；空白和“—”不会当成0。' };
  if (/^\d+(?:\.\d+)?[/／]\d+(?:\.\d+)?$/.test(text)) return { kind: 'invalid', message: '原表用斜杠列出两个数，无法确定采用哪一个；请填写本次服务范围内的实际数值。' };
  if (def.unit === '层' && /[（(]/.test(text)) return { kind: 'invalid', message: '原表层数附有分期或范围说明，不能直接把开头数字用于整个车库；请核对各期层数及对应面积。' };
  if (/市政道路/.test(text)) return { kind: 'invalid', message: '原表说明属于市政道路，但没有明确本项目是否承担维护；不承担时填0，承担时填实际服务面积。' };
  if (unit && def.unit && normalizeUnit(unit) !== normalizeUnit(def.unit)) return { kind: 'invalid', message: `单位为“${unit}”，需要“${def.unit}”，请核对口径。` };
  const inlineUnit = text.match(/(㎡|平方米|%|％|台|个|户|栋|层|米)$/)?.[1];
  if (inlineUnit && def.unit && normalizeUnit(inlineUnit) !== normalizeUnit(def.unit)) return { kind: 'invalid', message: `数值中的单位“${inlineUnit}”与“${def.unit}”不一致。` };
  const number = typeof raw === 'number' ? raw : /^\d+(?:\.\d+)?(?:万|千)?(?:㎡|平方米|%|％|台|个|户|栋|层|米)?$/.test(text)
    ? Number(text.match(/^\d+(?:\.\d+)?/)[0]) * (text.includes('万') ? 10000 : text.includes('千') ? 1000 : 1) : NaN;
  if (!Number.isFinite(number) || number < 0 || (def.integer && !Number.isInteger(number))) return { kind: 'invalid', message: def.integer ? '需要非负整数，不能填写负数、小数或多个候选数值。' : '需要明确的非负数，不能填写负数、范围或说明文字。' };
  const value = def.type === 'ratio' ? number / (normalizeUnit(unit) === '%' || /[%％]/.test(text) || number > 1 ? 100 : 1) : number;
  if (def.type === 'ratio' && value > 1) return { kind: 'invalid', message: '比例不能超过100%。' };
  return { value };
}

// This adapter follows row labels and column headers, never a file name or fixed row number.
// Observed staffing/pay stay excluded; revenue is separate from service cost inputs.
export function recognizeZhujiangWorkbook(workbook, suggestions = []) {
  const basic = workbook.sheets.find(s => /项目基本情况/.test(s.name));
  if (!basic || !basic.rows.some(r => r.cells.some(c => normalizeLabel(c.value) === '填写内容'))) return null;
  const equipment = workbook.sheets.find(s => /设备和场地/.test(s.name));
  const posts = workbook.sheets.find(s => /固定值守点/.test(s.name));
  const plans = workbook.sheets.find(s => /合同约定服务标准|服务计划/.test(s.name));
  const relevant = [basic, equipment, posts, plans].filter(Boolean);
  const result = { version: 1, provider: 'local-rules', model: 'zhujiang-template', project: { buildings: [], workbookOverrides: {} },
    recognition: { fields: {}, buildings: [], parameters: [] }, issues: [], missingFields: [], warnings: [],
    ignoredSheets: workbook.sheets.filter(s => !relevant.includes(s)).map(s => s.name), ignoredFields: [], unmatchedRows: [] };
  const entries = new Map();
  const addIssue = (key, label, kind, message, sources = []) => {
    result.issues = result.issues.filter(i => i.key !== key);
    result.issues.push({ key, label, kind, message, sources });
  };
  const put = (def, raw, source, unit = '', note = '', viaAI = false) => {
    const parsed = parseImportValue(raw, def, unit, note);
    const prior = entries.get(def.key);
    if (prior && (prior.value !== parsed.value || prior.kind !== parsed.kind)) {
      entries.set(def.key, { ...prior, value: undefined, kind: 'conflict' });
      addIssue(def.key, def.label, 'conflict', '同一参数出现不同数值或不同状态，请核对后重新上传。', [...prior.sources, source]);
      return;
    }
    if (prior) { prior.sources.push(source); return; }
    const entry = { ...def, ...parsed, sources: [source], note, viaAI };
    if (def.confirmScope && parsed.value > 0) { entry.value = undefined; entry.kind = 'conflict'; entry.message = def.confirmScope; }
    entries.set(def.key, entry);
    if (entry.kind) addIssue(def.key, def.label, entry.kind, entry.message, [source]);
  };
  const headerCol = (sheet, pattern, fallback) => sheet?.rows.flatMap(r => r.cells).find(c => pattern.test(String(c.value)))?.address.replace(/\d+/g, '') ?? fallback;
  const valueCol = headerCol(basic, /^填写内容$/, 'C');
  const isGroup = value => /^第\s*(?:\d+|[一二三四五六七八九十百]+)\s*组(?:\s*[（(].*)?$/.test(String(value).trim());
  const groupHeader = basic.rows.find(r => r.cells.some(c => isGroup(c.value)));
  const noteCol = headerCol(basic, /^怎么填$|^填报说明$|^备注$/, 'H');
  const basicRows = basic.rows.filter(r => !groupHeader || r.row < groupHeader.row);
  for (const def of BASIC_IMPORT_FIELDS) {
    const rows = basicRows.filter(r => matches(at(r, 'A')?.value, def));
    for (const row of rows) put(def, at(row, valueCol)?.value, ref(basic, row, valueCol), at(row, 'B')?.value, noteOf(row, [noteCol]));
    if (!rows.length) {
      entries.set(def.key, { ...def, kind: 'missing', sources: [], value: undefined });
      addIssue(def.key, def.label, 'missing', '未找到该测算字段。');
    }
  }
  for (const row of basicRows) {
    const label = String(at(row, 'A')?.value ?? '');
    if (label && hasValue(at(row, valueCol)?.value) && !/项目$|填写|怎么填|单位/.test(label) && !BASIC_IMPORT_FIELDS.some(d => matches(label, d))) {
      result.unmatchedRows.push({ label, ...ref(basic, row, valueCol), unit: at(row, 'B')?.value ?? '', note: noteOf(row, [noteCol]), section: '基础资料' });
    }
  }
  const excludedGarage = basicRows.find(r => /车库/.test(String(at(r, 'A')?.value)) && /不[在再属].*(?:管理|服务)范围|不纳入|不承担.*车库/.test(noteOf(r, [noteCol])));
  if (excludedGarage) {
    put({ key: 'zhuj.garageIncluded', label: '车库不纳入服务', target: 'override', section: '服务范围' }, 0, ref(basic, excludedGarage, noteCol));
    const entry = entries.get('garageFloorArea');
    if (entry?.kind === 'missing') { Object.assign(entry, { value: 0, kind: undefined, note: '按原表明确的车库服务排除说明，测算面积取0。' }); result.issues = result.issues.filter(i => i.key !== entry.key); }
  }
  const groups = groupHeader?.cells.filter(c => isGroup(c.value)) ?? [];
  for (const column of groups) {
    const col = column.address.replace(/\d+/g, '');
    const rows = basic.rows.filter(r => r.row > groupHeader.row);
    if (!rows.some(r => BUILDING_IMPORT_FIELDS.some(d => matches(at(r, 'A')?.value, d)) && hasValue(at(r, col)?.value))) continue;
    const index = result.project.buildings.length;
    result.project.buildings.push({});
    result.recognition.buildings.push({ label: String(column.value), fields: {} });
    for (const field of BUILDING_IMPORT_FIELDS) {
      const def = { ...field, key: `buildings[${index}].${field.key}`, label: `${column.value} · ${field.label}`, target: 'building', index, field: field.key };
      const found = rows.filter(r => matches(at(r, 'A')?.value, field));
      if (!found.length) { put(def, undefined, { sheet: basic.name, cell: column.address, raw: null }); continue; }
      for (const row of found) put(def, at(row, col)?.value, ref(basic, row, col), at(row, 'B')?.value, noteOf(row, [noteCol]));
    }
    const stairs = entries.get(`buildings[${index}].evacuationStairArea`);
    const count = entries.get(`buildings[${index}].buildingCount`)?.value;
    const floors = entries.get(`buildings[${index}].totalFloors`)?.value;
    if (stairs?.value !== undefined && /整栋|每栋/.test(stairs.note) && count > 0 && floors > 0) {
      stairs.value = stairs.value * count / floors;
      stairs.note = '原表为每栋合计面积，已按楼栋数和总楼层换算为模型使用的每层面积。';
    }
  }
  if (!groups.length || !result.project.buildings.length) addIssue('buildings', '楼栋资料', 'missing', '未找到已填写的楼栋分组。');
  const readTable = (sheet, definitions, col, labelCol, unitCol, noteCols) => {
    if (!sheet) return;
    for (const row of sheet.rows) {
      const label = String(at(row, labelCol)?.value ?? '').trim();
      const def = definitions.find(d => matches(label, d));
      if (def) {
        if (excludedGarage && GARAGE_ASSET_KEYS.has(def.key)) {
          result.ignoredFields.push(`${sheet.name}：${label}（已排除车库服务）`); continue;
        }
        put(def, at(row, col)?.value, ref(sheet, row, col), unitCol ? at(row, unitCol)?.value : '', noteOf(row, noteCols));
      } else if (label && hasValue(at(row, col)?.value) && !/填写|频次|序号|怎么填|服务内容|设备或场地|^岗位$|人员|人数|几人|每个.*岗|屋面层风机房数量/.test(label)) {
        result.unmatchedRows.push({ label, ...ref(sheet, row, col), unit: unitCol ? at(row, unitCol)?.value ?? '' : '', note: noteOf(row, noteCols), section: sheet === equipment ? '设备和场地' : '合同服务计划' });
      } else if (/人数|几人|每个.*岗|屋面层风机房数量/.test(label)) result.ignoredFields.push(`${sheet.name}：${label}`);
    }
  };
  readTable(equipment, ASSET_IMPORT_FIELDS, headerCol(equipment, /^填写数量/, 'D'), 'B', 'C', ['E']);
  readTable(plans, PLAN_IMPORT_FIELDS, headerCol(plans, /^服务频次/, 'C'), 'B', '', ['E']);
  const ruleEntries = new Map(entries);
  const unresolvedRows = [...result.unmatchedRows];
  for (const suggestion of suggestions) {
    const row = unresolvedRows.find(r => r.sheet === suggestion.sheet && r.cell === suggestion.cell);
    const def = SUPPLEMENT_FIELDS.find(d => d.key === suggestion.key && d.section === row?.section);
    const existing = ruleEntries.get(def?.key);
    if (!row || !def || existing && (existing.sources.length || existing.kind !== 'missing') || !Number.isFinite(suggestion.confidence) || suggestion.confidence < .9) continue;
    if (excludedGarage && GARAGE_ASSET_KEYS.has(def.key)) continue;
    if (entries.get(def.key) === existing) { entries.delete(def.key); result.issues = result.issues.filter(i => i.key !== def.key); }
    put(def, row.raw, row, row.unit, row.note, true);
    result.unmatchedRows = result.unmatchedRows.filter(r => r !== row);
  }
  for (const [asset, field] of [['grounds.entrancePlazaArea', 'perimeterEntrances'], ['grounds.roadArea', 'pavedRoadArea'], ['grounds.zoneArea', 'greenArea']]) {
    const basicEntry = entries.get(field), key = `zhuj.asset.${asset}`, assetEntry = entries.get(key);
    if (basicEntry?.kind || basicEntry?.value === undefined) continue;
    if (assetEntry && !assetEntry.kind && Math.abs(assetEntry.value - basicEntry.value) > .01) {
      addIssue(key, assetEntry.label, 'conflict', `基础资料为${basicEntry.value}㎡，设备场地表为${assetEntry.value}㎡，请核对服务范围。`, [...basicEntry.sources, ...assetEntry.sources]);
      assetEntry.value = undefined; assetEntry.kind = 'conflict';
    } else if (!assetEntry || assetEntry.kind === 'missing') {
      entries.set(key, { ...ASSET_IMPORT_FIELDS.find(d => d.key === key), value: basicEntry.value, sources: basicEntry.sources, derived: true, note: '采用基础资料中的同口径面积。' });
      result.issues = result.issues.filter(i => i.key !== key);
    }
  }
  // Cross-check table 2 totals against table 1 geometry before allowing either to be used.
  for (const [asset, field, multiplier] of [
    ['groundFloorLobbyArea', 'lobbyElevatorCount', 'buildingCount'], ['stiltFloorArea', 'stiltFloorArea', 'buildingCount'],
    ['standardFloorArea', 'standardLobbyArea', 'totalFloors'], ['roofArea', 'rooftopArea', 'buildingCount'],
    ['evacuationStairArea', 'evacuationStairArea', 'totalFloors'],
  ]) {
    const pairs = result.project.buildings.map((_, i) => [entries.get(`buildings[${i}].${field}`), entries.get(`buildings[${i}].${multiplier}`)]);
    if (!pairs.length || pairs.some(pair => pair.some(e => !e || e.kind || e.value === undefined))) continue;
    const value = pairs.reduce((sum, [a, b]) => sum + a.value * b.value, 0);
    const key = `zhuj.asset.building.${asset}`;
    const sources = pairs.flatMap(pair => pair.flatMap(e => e.sources));
    const existing = entries.get(key);
    if (existing && !existing.kind && Math.abs(existing.value - value) > .01) {
      const original = existing.value;
      existing.value = undefined; existing.kind = 'conflict';
      addIssue(key, existing.label, 'conflict', `设备表为${original}㎡，楼栋资料合计为${Number(value.toFixed(4))}㎡，请核对是否同一服务范围。`, [...existing.sources, ...sources]);
    } else if (!existing || existing.kind === 'missing') {
      const def = ASSET_IMPORT_FIELDS.find(d => d.key === key);
      entries.set(key, { ...def, value, sources, note: '由楼栋资料按相同口径合计。', derived: true });
      result.issues = result.issues.filter(i => i.key !== key);
    }
  }
  const marble = entries.get('清洁!X27');
  if (marble?.value === 0 && /不涉及|不提供/.test(marble.note)) put({ key: 'zhuj.lobbyMarbleArea', label: '大堂大理石养护面积', unit: '㎡', target: 'override', section: '服务范围' }, 0, marble.sources[0]);
  if (posts) {
    for (const row of posts.rows) {
      const label = String(at(row, 'A')?.value ?? '');
      if (!['大门', '车场出入口', '其他固定位置', '中控室', '服务处前台'].includes(label)) continue;
      const source = ref(posts, row, 'B');
      const count = parseImportValue(source.raw, { integer: true });
      const shifts = parseImportValue(at(row, 'C')?.value, { integer: true });
      const people = parseImportValue(at(row, 'D')?.value, { integer: true });
      const notes = noteOf(row, ['E', 'F']);
      if ([count, shifts, people].some(x => x.kind)) {
        addIssue(`posts.${label}`, `${label}值守安排`, 'missing', '点位、班次和每班人数需填写明确非负整数。', [source]); continue;
      }
      if (count.value === 0 && (shifts.value > 0 || people.value > 0) || count.value > 0 && (!shifts.value || !people.value)) {
        addIssue(`posts.${label}`, `${label}值守安排`, 'conflict', '点位、班次和人数相互矛盾，请核对。', [source]); continue;
      }
      if (label === '中控室') {
        put({ key: 'zhuj.monitorPosts', label: '监控中心数量', target: 'override', section: '值守安排', integer: true }, count.value, source);
        put({ key: 'zhuj.monitorStaff', label: '每班监控中心人员', target: 'override', section: '值守安排', integer: true }, people.value, ref(posts, row, 'D'));
        result.warnings.push('中控室按24小时覆盖和每班人数测算；每天班数不等于净配置人数。');
      } else if (count.value > 0) {
        addIssue(`posts.${label}`, `${label}值守安排`, 'conflict', /巡逻|包含|门岗/.test(notes)
          ? `备注涉及巡逻、兼岗或其他岗位，需确认归属，避免重复配置。原备注：${notes}`
          : '需核实主次入口、覆盖时长及替休后的净增人数，不能将点位×班次直接当作编制。', [source, ref(posts, row, 'C'), ref(posts, row, 'D'), ref(posts, row, 'E'), ref(posts, row, 'F')]);
      }
    }
  }
  for (const [small, large, message] of [['occupiedHouseholds', 'receivedHouseholds', '常住户数不能超过已收楼户数。'],
    ['receivedHouseholds', 'deliveredHouseholds', '已收楼户数不能超过已交付户数。'],
    ['residentialChargeArea', 'totalBuildingArea', '住宅收费面积不能超过总建筑面积，请核对。']]) {
    const a = entries.get(small), b = entries.get(large);
    if (a?.value !== undefined && b?.value !== undefined && a.value > b.value) {
      addIssue(small, a.label, 'conflict', message, [...a.sources, ...b.sources]); a.kind = 'conflict'; a.value = undefined;
    }
  }
  for (const entry of entries.values()) {
    const value = entry.value ?? null;
    const evidence = { status: entry.kind === 'conflict' || entry.kind === 'invalid' ? 'needs_confirmation' : value === null ? 'missing' : entry.derived ? 'derived' : 'recognized',
      confidence: value === null ? 0 : entry.viaAI ? .9 : 1, source: entry.sources[0] ?? null, note: entry.note ?? '' };
    if (entry.target === 'project') { result.project[entry.key] = value; result.recognition.fields[entry.key] = evidence; }
    if (entry.target === 'building') { result.project.buildings[entry.index][entry.field] = value; result.recognition.buildings[entry.index].fields[entry.field] = evidence; }
    if (entry.target === 'override') {
      if (value !== null && !entry.kind) result.project.workbookOverrides[entry.key] = value;
      result.recognition.parameters.push({ key: entry.key, label: entry.label, unit: entry.unit ?? '', group: entry.section ?? '项目参数', value, ...evidence });
    }
  }
  for (const row of result.unmatchedRows) addIssue(`${row.sheet}!${row.cell}`, row.label, 'unmatched', '未能可靠对应测算字段，尚未导入；请核对字段名称或用途。', [row]);
  for (const [sheet, label] of [[equipment, '设备和场地'], [posts, '固定值守点'], [plans, '合同约定服务标准']]) {
    if (!sheet) addIssue(`sheet.${label}`, label, 'missing', '工作簿缺少该资料表，请补充所需测算条件。');
  }
  const location = normalizeCityLocation(result.project.region, result.project.city);
  if (location) Object.assign(result.project, { region: location.region, city: location.city, recommendedCostBand: location.recommendedCostBand,
    costBand: location.recommendedCostBand, costBandSourceVersion: CITY_CATALOG_VERSION });
  else result.project.costBand = null;
  result.recognition.fields.costBand = { status: location ? 'derived' : 'missing', confidence: location ? 1 : 0, source: result.recognition.fields.city?.source ?? null, note: '由城市匹配成本档位。' };
  result.missingFields = [...new Set(result.issues.filter(i => i.kind === 'missing').map(i => i.key))];
  if (workbook.truncated) addIssue('workbook', '工作簿完整性', 'invalid', '工作簿读取达到上限，部分内容未检查，请拆分后重新上传。');
  const revenueScenario = recognizeRevenue(workbook);
  if (revenueScenario) {
    result.project.revenueScenario = revenueScenario;
    result.ignoredSheets = result.ignoredSheets.filter(name => !/项目收入/.test(name));
  }
  result.warnings.push('实际在岗人数、已发生费用不写入测算参数；表6收入单独用于结果页收费试算，不改变服务成本。');
  if (result.recognition.parameters.some(p => p.group === '合同服务计划' && p.value > 0)) result.warnings.push('已识别的合同频次按年度换算，采用后作为项目服务计划；请核对与所选服务档位的差异。');
  return result;
}
