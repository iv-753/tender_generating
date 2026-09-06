import { BUILDING_FIELD_DEFINITIONS, FIELD_DEFINITIONS } from './schema.mjs';

const missingReference = () => ({ sheet: null, cell: null, confidence: 0, note: '规则未识别，AI未补充' });

function candidateReference(candidate) {
  return candidate ? {
    sheet: candidate.sheet,
    cell: candidate.cell,
    confidence: candidate.score,
    note: '规则候选，AI未提出修正',
  } : missingReference();
}

function completeFields(definitions, fields = {}) {
  return Object.fromEntries(Object.keys(definitions).map((field) => [field, candidateReference(fields[field]?.[0])]));
}

function correctionReference(correction) {
  const present = typeof correction?.sheet === 'string' && typeof correction?.cell === 'string';
  return present ? {
    sheet: correction.sheet,
    cell: correction.cell,
    confidence: correction.confidence,
    note: 'AI核对后修正或补充',
  } : missingReference();
}

export function buildDraftMapping(candidates) {
  return {
    fields: completeFields(FIELD_DEFINITIONS, candidates?.fields),
    buildings: (candidates?.buildings || []).map((building) => ({
      label: building.label,
      fields: completeFields(BUILDING_FIELD_DEFINITIONS, building.fields),
    })),
  };
}

export function applyRuleReview(candidates, review = {}) {
  const mapping = buildDraftMapping(candidates);
  for (const correction of review.fieldCorrections || []) {
    if (Object.hasOwn(FIELD_DEFINITIONS, correction?.field)) mapping.fields[correction.field] = correctionReference(correction);
  }
  for (const correction of review.buildingCorrections || []) {
    const building = mapping.buildings[correction?.index];
    if (!building) continue;
    if (typeof correction.label === 'string' && correction.label.trim()) building.label = correction.label.trim();
    for (const fieldCorrection of correction.fieldCorrections || []) {
      if (Object.hasOwn(BUILDING_FIELD_DEFINITIONS, fieldCorrection?.field)) {
        building.fields[fieldCorrection.field] = correctionReference(fieldCorrection);
      }
    }
  }
  const removals = new Set((review.removeBuildingIndexes || []).filter(Number.isInteger));
  mapping.buildings = mapping.buildings.filter((_, index) => !removals.has(index));
  for (const addition of review.newBuildings || []) {
    const fields = completeFields(BUILDING_FIELD_DEFINITIONS);
    for (const correction of addition?.fields || []) {
      if (Object.hasOwn(BUILDING_FIELD_DEFINITIONS, correction?.field)) fields[correction.field] = correctionReference(correction);
    }
    mapping.buildings.push({ label: String(addition?.label || `楼栋类型${mapping.buildings.length + 1}`), fields });
  }
  mapping.buildings = mapping.buildings.slice(0, 5);
  return mapping;
}
