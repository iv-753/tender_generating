import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateProject } from './engine.mjs';
import { PARITY_PROJECTS } from './fixtures/parity-projects.mjs';

test('returns the stable 122-action calculation contract', () => {
  const result = calculateProject(PARITY_PROJECTS[0]);
  assert.equal(result.totalActionCount, 122);
  assert.deepEqual(result.categories.map((item) => [item.category, item.actionCount]), [
    ['service', 17], ['cleaning', 48], ['greening', 51], ['assistance', 6],
  ]);
  assert.equal(new Set(result.actions.map(({ id }) => id)).size, 122);
  for (const action of result.actions) {
    assert.ok(Number.isFinite(action.annualCost));
    assert.ok(action.annualCost >= 0);
  }
  assert.ok(Number.isFinite(result.totalHeadcount));
  assert.ok(Number.isFinite(result.annualCost));
});

test('keeps action detail cost separate from rounded category staffing cost', () => {
  const result = calculateProject(PARITY_PROJECTS[0]);
  for (const category of ['service', 'cleaning', 'greening']) {
    const detailCost = result.actions.filter((item) => item.category === category).reduce((sum, item) => sum + item.annualCost, 0);
    const summaryCost = result.categories.find((item) => item.category === category).annualCost;
    assert.notEqual(detailCost, summaryCost);
  }
});

test('rounds assistance staffing per action', () => {
  const result = calculateProject({ ...PARITY_PROJECTS[0], totalBuildingArea: 100001, serviceGrade: 'C' });
  const patrol = result.actions.find(({ id }) => id === 'assistance-8');
  assert.equal(patrol.quantity, 100001);
  assert.equal(patrol.headcount, 2);
});

test('treats a workbook blank annual frequency as zero', () => {
  const result = calculateProject({ ...PARITY_PROJECTS[0], serviceGrade: 'B' });
  const winterCare = result.actions.find(({ id }) => id === 'greening-22');
  assert.equal(winterCare.frequency, '0');
  assert.equal(winterCare.annualFrequency, 0);
  assert.equal(winterCare.annualHours, 0);
  const sunflower = calculateProject({ ...PARITY_PROJECTS[0], serviceGrade: 'D' });
  assert.equal(sunflower.actions.find(({ id }) => id === 'service-13').frequency, '0');
});

test('keeps the quarter-hour seasonal flower conversion', () => {
  const project = { ...PARITY_PROJECTS[0], costBand: 'standard', seasonalFlowerArea: 185 };
  const result = calculateProject(project);
  const seasonalFlowers = result.actions.find(({ id }) => id === 'greening-16');
  assert.ok(Math.abs(seasonalFlowers.annualHours - (185 * 15.0769231 * 1.05 * 3 / 4)) <= 1e-7);
});
