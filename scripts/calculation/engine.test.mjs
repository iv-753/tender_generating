import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateProject } from './engine.mjs';
import { PARITY_PROJECTS } from './fixtures/parity-projects.mjs';
import { FULL_MODEL_COST_FACTORS } from './rules/constants.mjs';

const EXPECTED_CATEGORIES = [
  ['service', 17],
  ['cleaning', 48],
  ['greening', 51],
  ['assistance', 6],
  ['pestControl', 7],
  ['engineeringOutsourced', 95],
  ['engineeringRoutine', 228],
];

test('returns the formal V2 contract with all 452 standard actions', () => {
  const result = calculateProject(PARITY_PROJECTS[0]);
  assert.equal(result.version, 2);
  assert.equal(result.advancedParameterVersion, '2026-09-full-model-v1');
  assert.equal(result.advancedParameters.length, 90);
  assert.equal(result.standardActionCount, 452);
  assert.equal(result.totalActionCount, 452);
  assert.equal(result.activeActionCount, 452);
  assert.equal(result.totalActionCount, result.actions.length);
  assert.deepEqual(result.categories.map((item) => [item.category, item.actionCount]), EXPECTED_CATEGORIES);
  assert.equal(new Set(result.actions.map(({ id }) => id)).size, 452);
  assert.ok(result.actions.every(({ source, enabled }) => source === 'baseline' && enabled === true));
  assert.equal(result.management.headcount, 4);
  assert.ok(result.management.annualCost > 0);
  for (const action of result.actions) {
    assert.ok(Number.isFinite(action.annualCost));
    assert.ok(action.annualCost >= 0);
  }
  assert.ok(Number.isFinite(result.totalHeadcount));
  assert.ok(Number.isFinite(result.annualCost));
});

test('derives totals once from seven category summaries plus management', () => {
  const result = calculateProject(PARITY_PROJECTS[0]);
  assert.equal(
    result.annualCost,
    result.categories.reduce((sum, item) => sum + item.annualCost, 0) + result.management.annualCost,
  );
  assert.equal(
    result.totalHeadcount,
    result.categories.reduce((sum, item) => sum + item.headcount, 0) + result.management.headcount,
  );
  assert.equal(
    result.workloadAnnualCost,
    result.categories.reduce((sum, item) => sum + item.workloadAnnualCost, 0),
  );
  for (const category of result.categories) {
    assert.equal(
      category.workloadAnnualCost,
      result.actions
        .filter((item) => item.category === category.category)
        .reduce((sum, item) => sum + item.annualCost, 0),
      category.category,
    );
  }
  const pest = result.categories.find(({ category }) => category === 'pestControl');
  assert.ok(Math.abs(pest.workloadAnnualCost - 40540.49180224) <= 1e-7);
});

test('matches the workbook upper-band unit prices naturally for all four grades', () => {
  const expected = { A: 3.156125962, B: 2.589873385, C: 2.261791829, D: 1.946698928 };
  for (const [serviceGrade, target] of Object.entries(expected)) {
    const project = { ...PARITY_PROJECTS[0], serviceGrade, costBand: 'upper' };
    const result = calculateProject(project);
    const unitPrice = result.annualCost / project.residentialChargeArea / 12;
    assert.ok(Math.abs(unitPrice - target) <= 0.01, `${serviceGrade}: ${unitPrice} !== ${target}`);
  }
});

test('applies the city factor exactly once to every category, action, and management cost', () => {
  const upper = calculateProject(PARITY_PROJECTS[0]);
  for (const costBand of ['high', 'standard', 'base']) {
    const result = calculateProject({ ...PARITY_PROJECTS[0], costBand });
    const factor = FULL_MODEL_COST_FACTORS[costBand];
    for (let index = 0; index < result.categories.length; index += 1) {
      assert.ok(Math.abs(result.categories[index].annualCost - upper.categories[index].annualCost * factor) <= 1e-7);
      assert.ok(Math.abs(result.categories[index].workloadAnnualCost - upper.categories[index].workloadAnnualCost * factor) <= 1e-7);
    }
    for (let index = 0; index < result.actions.length; index += 1) {
      assert.ok(Math.abs(result.actions[index].annualCost - upper.actions[index].annualCost * factor) <= 1e-7);
    }
    assert.ok(Math.abs(result.management.annualCost - upper.management.annualCost * factor) <= 1e-7);
  }
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
