import assert from 'node:assert/strict';
import test from 'node:test';
import { applyRuleReview, buildDraftMapping } from './rule-review.mjs';

const candidates = {
  fields: {
    projectName: [{ sheet: '总览', cell: 'B2', score: 0.99 }],
    city: [],
  },
  buildings: [
    { label: '高层', fields: { buildingCount: [{ sheet: '楼栋', cell: 'B4', score: 0.99 }] } },
    { label: '说明文字', fields: { buildingCount: [] } },
  ],
};

test('turns rule candidates into a complete mapping draft', () => {
  const draft = buildDraftMapping(candidates);
  assert.equal(draft.fields.projectName.cell, 'B2');
  assert.equal(draft.fields.city.cell, null);
  assert.equal(draft.buildings[0].fields.buildingCount.cell, 'B4');
  assert.equal(draft.buildings[0].fields.rooftopArea.cell, null);
});

test('applies only AI corrections, removals, and additions to the rule draft', () => {
  const mapping = applyRuleReview(candidates, {
    fieldCorrections: [{ field: 'city', sheet: '总览', cell: 'E3', confidence: 0.96 }],
    removeBuildingIndexes: [1],
    buildingCorrections: [{
      index: 0,
      label: '高层住宅',
      fieldCorrections: [{ field: 'rooftopArea', sheet: '楼栋', cell: 'H4', confidence: 0.94 }],
    }],
    newBuildings: [],
  });

  assert.equal(mapping.fields.projectName.cell, 'B2');
  assert.equal(mapping.fields.city.cell, 'E3');
  assert.equal(mapping.buildings.length, 1);
  assert.equal(mapping.buildings[0].label, '高层住宅');
  assert.equal(mapping.buildings[0].fields.rooftopArea.cell, 'H4');
});
