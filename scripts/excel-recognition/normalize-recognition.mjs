import { BUILDING_FIELD_DEFINITIONS, FIELD_DEFINITIONS } from './schema.mjs';
import { CITY_CATALOG_VERSION, normalizeCityLocation } from '../calculation/city-catalog.mjs';

function parseChineseInteger(value) {
  const digit = { 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  const match = String(value).match(/[零一二两三四五六七八九十]+/);
  if (!match) return null;
  const token = match[0];
  if (!token.includes('十')) return digit[token] ?? null;
  const [left, right] = token.split('十');
  return (left ? digit[left] : 1) * 10 + (right ? digit[right] : 0);
}

function normalizeNumber(raw, ratio = false) {
  let value;
  if (typeof raw === 'number') value = raw;
  else {
    const source = String(raw).trim().replace(/,/g, '');
    const match = source.match(/-?\d+(?:\.\d+)?/);
    value = match ? Number(match[0]) : parseChineseInteger(source);
    if (value !== null && source.includes('万')) value *= 10000;
    if (value !== null && source.includes('千')) value *= 1000;
    if (ratio && source.includes('%')) value /= 100;
  }
  if (!Number.isFinite(value)) return null;
  if (ratio && value > 1) value /= 100;
  return value >= 0 ? Number(value.toFixed(10)) : null;
}

function normalizeCity(raw) {
  let value = String(raw ?? '').trim();
  if (!value) return null;
  value = value.replace(/^.*?省/, '');
  const city = value.match(/^(.+?)(?:市|自治州|地区)/)?.[1];
  return (city || value).replace(/市$/, '').trim() || null;
}

function normalizeGrade(raw) {
  const value = String(raw ?? '').trim().toUpperCase();
  const latin = value.match(/[ABCD]/)?.[0];
  if (latin) return latin;
  return ({ 紫荆花: 'A', 金百合: 'B', 郁金香: 'C', 向日葵: 'D' })[value] ?? null;
}

function normalizeValue(raw, type) {
  if (type === 'number') return normalizeNumber(raw);
  if (type === 'ratio') return normalizeNumber(raw, true);
  if (type === 'city') return normalizeCity(raw);
  if (type === 'grade') return normalizeGrade(raw);
  const value = String(raw ?? '').trim();
  return value || null;
}

function resolveField(workbook, reference, type) {
  const sheet = typeof reference?.sheet === 'string' ? reference.sheet.trim() : '';
  const cell = typeof reference?.cell === 'string' ? reference.cell.trim().toUpperCase() : '';
  const key = sheet && cell ? `${sheet}!${cell}` : '';
  const validSource = key && Object.hasOwn(workbook.cells, key);
  const raw = validSource ? workbook.cells[key] : null;
  const value = validSource ? normalizeValue(raw, type) : null;
  const confidence = Number.isFinite(reference?.confidence) ? Math.max(0, Math.min(1, reference.confidence)) : 0;
  return {
    value,
    evidence: {
      status: value === null ? 'missing' : confidence < 0.8 ? 'needs_confirmation' : 'recognized',
      confidence: value === null ? 0 : confidence,
      source: value === null ? null : { sheet, cell, raw },
      note: String(reference?.note ?? ''),
    },
  };
}

export function normalizeRecognition(workbook, mapping, { provider, model } = {}) {
  const project = {};
  const fieldEvidence = {};
  const missingFields = [];

  for (const [field, [, type]] of Object.entries(FIELD_DEFINITIONS)) {
    const { value, evidence } = resolveField(workbook, mapping?.fields?.[field], type);
    project[field] = value;
    fieldEvidence[field] = evidence;
    if (value === null) missingFields.push(field);
  }

  const location = normalizeCityLocation(project.region, project.city);
  if (location) {
    project.region = location.region;
    project.city = location.city;
    project.recommendedCostBand = location.recommendedCostBand;
    project.costBandSourceVersion = CITY_CATALOG_VERSION;
  }
  project.costBand = location?.recommendedCostBand ?? null;
  fieldEvidence.costBand = {
    status: project.costBand ? 'derived' : 'missing',
    confidence: project.costBand ? 1 : 0,
    source: project.city ? fieldEvidence.city.source : null,
    note: project.costBand ? '根据城市成本档位库确定' : '城市尚未纳入成本档位库，请人工选择',
  };
  if (!project.costBand) missingFields.push('costBand');

  const buildingEvidence = [];
  project.buildings = (Array.isArray(mapping?.buildings) ? mapping.buildings : []).slice(0, 5).map((building, index) => {
    const normalized = {};
    const evidence = {};
    for (const [field, [, type]] of Object.entries(BUILDING_FIELD_DEFINITIONS)) {
      const resolved = resolveField(workbook, building?.fields?.[field], type);
      normalized[field] = resolved.value;
      evidence[field] = resolved.evidence;
      if (resolved.value === null) missingFields.push(`buildings[${index}].${field}`);
    }
    buildingEvidence.push({ label: String(building?.label ?? `楼栋类型${index + 1}`), fields: evidence });
    return normalized;
  });

  return {
    version: 1,
    provider: provider || 'unknown',
    model: model || 'unknown',
    project,
    recognition: { fields: fieldEvidence, buildings: buildingEvidence },
    missingFields,
    warnings: workbook.truncated ? ['工作簿内容较大，识别输入已按安全上限截断，请重点核对结果。'] : [],
  };
}
