import assert from 'node:assert/strict';
import test from 'node:test';

import { applyAdjustments } from './adjustments.mjs';
import { calculateProject } from './engine.mjs';
import { PARITY_PROJECTS } from './fixtures/parity-projects.mjs';

const emptyAdjustments = () => ({ version: 1, overrides: {}, customActions: [] });
const baseline = () => calculateProject(PARITY_PROJECTS[0]);

test('returns workbook totals when no adjustment exists', () => {
  const before = baseline();
  const after = applyAdjustments(before, emptyAdjustments());

  assert.equal(after.annualCost, before.annualCost);
  assert.equal(after.totalHeadcount, before.totalHeadcount);
  assert.equal(after.totalActionCount, 452);
  assert.equal(after.activeActionCount, 452);
  assert.deepEqual(after.categories, before.categories);
  assert.deepEqual(after.management, before.management);
  assert.equal(after.workloadAnnualCost, before.workloadAnnualCost);
});

test('rejects a malformed V2 baseline instead of inventing management defaults', () => {
  const { management: _management, ...incomplete } = baseline();
  assert.throws(
    () => applyAdjustments(incomplete, emptyAdjustments()),
    /V2 基准测算缺少管理成本/,
  );
});

test('changing annual frequency recalculates hours and workload cost', () => {
  const before = baseline();
  const source = before.actions.find((item) => item.id === 'service-5');
  const after = applyAdjustments(before, { ...emptyAdjustments(), overrides: { 'service-5': { annualFrequency: 400 } } });
  const changed = after.actions.find((item) => item.id === 'service-5');

  assert.equal(changed.annualFrequency, 400);
  assert.ok(Math.abs(changed.annualHours - source.annualHours * 400 / source.annualFrequency) < 1e-7);
  assert.ok(changed.annualCost < source.annualCost);
});

test('an annual-hours override is authoritative', () => {
  const after = applyAdjustments(baseline(), {
    ...emptyAdjustments(),
    overrides: { 'service-5': { annualFrequency: 400, annualHours: 100 } },
  });
  const changed = after.actions.find((item) => item.id === 'service-5');

  assert.equal(changed.annualFrequency, 400);
  assert.equal(changed.annualHours, 100);
  assert.equal(changed.annualCost, 100 * 30);
});

test('a zero-frequency workbook action can be activated by frequency', () => {
  const after = applyAdjustments(baseline(), {
    ...emptyAdjustments(),
    overrides: { 'service-8': { annualFrequency: 100 } },
  });
  const changed = after.actions.find((item) => item.id === 'service-8');

  assert.equal(changed.annualHours, 100 * 0.01 * 1.05);
  assert.equal(changed.annualCost, changed.annualHours * 30);
});

test('disabling an action zeros its workload cost', () => {
  const before = baseline();
  const after = applyAdjustments(before, { ...emptyAdjustments(), overrides: { 'service-5': { disabled: true } } });
  const disabled = after.actions.find((item) => item.id === 'service-5');

  assert.equal(disabled.enabled, false);
  assert.equal(disabled.annualFrequency, 0);
  assert.equal(disabled.annualHours, 0);
  assert.equal(disabled.annualCost, 0);
  assert.equal(after.totalActionCount, 452);
  assert.equal(after.activeActionCount, 451);
  assert.equal(after.totalActionCount, after.actions.length);
  assert.ok(after.workloadAnnualCost < before.actions.reduce((sum, item) => sum + item.annualCost, 0));
});

test('a custom action adds workload cost and participates in rounded staffing', () => {
  const before = baseline();
  const after = applyAdjustments(before, {
    ...emptyAdjustments(),
    customActions: [{
      id: 'custom-service-1', category: 'service', action: '夜间客户关怀', property: '自定义', annualFrequency: 120, annualHours: 500,
    }],
  });
  const custom = after.actions.find((item) => item.id === 'custom-service-1');

  assert.equal(custom.source, 'custom');
  assert.equal(custom.annualCost, 500 * 30);
  assert.equal(after.totalActionCount, 453);
  assert.equal(after.activeActionCount, 453);
  assert.equal(after.totalActionCount, after.actions.length);
  assert.ok(after.workloadAnnualCost > before.actions.reduce((sum, item) => sum + item.annualCost, 0));
});

test('assistance custom actions use whole posts and monthly pricing', () => {
  const after = applyAdjustments(baseline(), {
    ...emptyAdjustments(),
    customActions: [{ id: 'custom-assistance-1', category: 'assistance', action: '夜间门岗', property: '自定义', headcount: 2 }],
  });
  const custom = after.actions.find((item) => item.id === 'custom-assistance-1');

  assert.equal(custom.headcount, 2);
  assert.equal(custom.annualCost, 2 * 8000 * 12 * 1.06);
});

test('rejects invalid numbers, unknown ids, and duplicate custom ids', () => {
  assert.throws(() => applyAdjustments(baseline(), { ...emptyAdjustments(), overrides: { 'service-5': { annualHours: -1 } } }), /非负/);
  assert.throws(() => applyAdjustments(baseline(), { ...emptyAdjustments(), overrides: { missing: { annualHours: 1 } } }), /不存在/);
  assert.throws(() => applyAdjustments(baseline(), {
    ...emptyAdjustments(),
    customActions: [{ id: 'service-5', category: 'service', action: '重复动作', property: '自定义', annualHours: 1 }],
  }), /编号重复/);
  assert.throws(() => applyAdjustments(baseline(), {
    ...emptyAdjustments(),
    customActions: [{ id: 'custom-assistance-1', category: 'assistance', action: '半个人', property: '自定义', headcount: 1.5 }],
  }), /整数/);
});
