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

for (const category of ['engineeringRoutine', 'engineeringOutsourced', 'pestControl']) {
  test(`changing ${category} frequency updates action, category, and project costs`, () => {
    const before = baseline();
    const source = before.actions.find((item) => item.category === category && item.annualHours > 0);
    const beforeSummary = before.categories.find((item) => item.category === category);
    const adjustedFrequency = source.annualFrequency + 1200;
    const after = applyAdjustments(before, {
      ...emptyAdjustments(),
      overrides: { [source.id]: { annualFrequency: adjustedFrequency } },
    });
    const changed = after.actions.find((item) => item.id === source.id);
    const afterSummary = after.categories.find((item) => item.category === category);

    assert.equal(changed.annualFrequency, adjustedFrequency);
    assert.notEqual(changed.annualHours, source.annualHours);
    assert.notEqual(changed.annualCost, source.annualCost);
    assert.notEqual(afterSummary.workloadAnnualCost, beforeSummary.workloadAnnualCost);
    assert.notEqual(after.annualCost, before.annualCost);
  });
}

for (const category of ['engineeringRoutine', 'engineeringOutsourced', 'pestControl']) {
  test(`changing ${category} annual hours updates workload and rounded project budget`, () => {
    const before = baseline();
    const source = before.actions.find((item) => item.category === category && item.annualHours > 0);
    const beforeSummary = before.categories.find((item) => item.category === category);
    const after = applyAdjustments(before, {
      ...emptyAdjustments(), overrides: { [source.id]: { annualHours: 12000 } },
    });
    const changed = after.actions.find((item) => item.id === source.id);
    const afterSummary = after.categories.find((item) => item.category === category);

    assert.equal(changed.annualHours, 12000);
    assert.notEqual(changed.annualCost, source.annualCost);
    assert.notEqual(afterSummary.workloadAnnualCost, beforeSummary.workloadAnnualCost);
    assert.notEqual(afterSummary.annualCost, beforeSummary.annualCost);
    assert.notEqual(after.annualCost, before.annualCost);
  });
}

test('engineering summaries derive workload cost from effective hours even when legacy input contains a direct cost', () => {
  const before = baseline();
  const routine = before.actions.find((item) => item.category === 'engineeringRoutine' && item.annualHours > 0);
  const outsourced = before.actions.find((item) => item.category === 'engineeringOutsourced' && item.annualHours > 0);
  const after = applyAdjustments(before, {
    ...emptyAdjustments(),
    overrides: {
      [routine.id]: { annualHours: 3000 },
      [outsourced.id]: { annualHours: 100, annualCost: 1234.56 },
    },
  });
  const routineSummary = after.categories.find((item) => item.category === 'engineeringRoutine');
  const outsourcedSummary = after.categories.find((item) => item.category === 'engineeringOutsourced');
  const changedOutsourced = after.actions.find((item) => item.id === outsourced.id);
  const effectiveRoutineHours = after.actions.filter((item) => item.category === 'engineeringRoutine' && item.enabled !== false).reduce((sum, item) => sum + item.annualHours, 0);

  assert.equal(routineSummary.workloadEquivalentHeadcount, effectiveRoutineHours / 2880);
  assert.equal(routineSummary.headcount, Math.ceil(effectiveRoutineHours / 2880));
  assert.ok(Math.abs(changedOutsourced.annualCost - 100 * outsourced.annualCost / outsourced.annualHours) < 1e-9);
  assert.equal(outsourcedSummary.workloadAnnualCost, after.actions.filter((item) => item.category === 'engineeringOutsourced' && item.enabled !== false).reduce((sum, item) => sum + item.annualCost, 0));
});

test('pest shared workload responds to every effective row instead of reading only the first row', () => {
  const before = baseline();
  const pestActions = before.actions.filter((item) => item.category === 'pestControl');
  const target = pestActions[1];
  const beforeSummary = before.categories.find((item) => item.category === 'pestControl');
  const after = applyAdjustments(before, {
    ...emptyAdjustments(),
    overrides: { [target.id]: { disabled: true } },
  });
  const afterSummary = after.categories.find((item) => item.category === 'pestControl');
  const effectiveHours = after.actions.filter((item) => item.category === 'pestControl' && item.enabled !== false).reduce((sum, item) => sum + item.annualHours, 0);

  assert.equal(afterSummary.annualHours, effectiveHours);
  assert.equal(afterSummary.headcount, effectiveHours / 2880);
  assert.ok(afterSummary.workloadAnnualCost < beforeSummary.workloadAnnualCost);
  assert.ok(afterSummary.annualCost < beforeSummary.annualCost);
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
  assert.equal(after.standardActionCount, 452);
  assert.equal(after.activeActionCount, 451);
  assert.equal(after.totalActionCount, after.actions.length);
  assert.ok(after.workloadAnnualCost < before.actions.reduce((sum, item) => sum + item.annualCost, 0));
});

test('a custom action adds workload cost and participates in rounded staffing', () => {
  const before = baseline();
  const after = applyAdjustments(before, {
    ...emptyAdjustments(),
    customActions: [{
      id: 'custom-service-1', category: 'service', action: '夜间客户关怀', property: '自定义', annualFrequency: 120, annualHours: 500, annualCost: 1,
    }],
  });
  const custom = after.actions.find((item) => item.id === 'custom-service-1');

  assert.equal(custom.source, 'custom');
  assert.equal(custom.annualCost, 500 * 30);
  assert.equal(after.totalActionCount, 453);
  assert.equal(after.standardActionCount, 452);
  assert.equal(after.activeActionCount, 453);
  assert.equal(after.totalActionCount, after.actions.length);
  assert.ok(after.workloadAnnualCost > before.actions.reduce((sum, item) => sum + item.annualCost, 0));
});

for (const category of ['service', 'cleaning', 'greening', 'pestControl', 'engineeringOutsourced', 'engineeringRoutine']) {
  test(`adds a custom ${category} workload action using its category cost model`, () => {
    const before = baseline();
    const after = applyAdjustments(before, {
      ...emptyAdjustments(),
      customActions: [{
        id: `custom-${category}-cost`, category, action: '自定义工作量', property: '自定义', annualFrequency: 12, annualHours: 24,
      }],
    });
    const custom = after.actions.find((item) => item.id === `custom-${category}-cost`);
    const summary = after.categories.find((item) => item.category === category);

    assert.equal(custom.source, 'custom');
    assert.ok(custom.annualCost > 0);
    if (category === 'engineeringOutsourced') assert.equal(custom.annualCost, 24 * (7500 / 30 / 8));
    assert.equal(summary.workloadAnnualCost, after.actions.filter((item) => item.category === category && item.enabled !== false).reduce((sum, item) => sum + item.annualCost, 0));
    assert.equal(after.totalActionCount, 453);
    assert.equal(after.standardActionCount, 452);
  });
}

test('normalizes editable workload decimals, derives cost, and requires whole annual frequency', () => {
  const before = baseline();
  const action = before.actions.find((item) => item.category === 'engineeringRoutine' && item.annualHours > 0);
  const after = applyAdjustments(before, {
    ...emptyAdjustments(),
    overrides: { [action.id]: { annualHours: 12.345, annualCost: 456.789 } },
  });
  const changed = after.actions.find((item) => item.id === action.id);

  assert.equal(changed.annualHours, 12.35);
  assert.equal(changed.annualCost, 12.35 * action.annualCost / action.annualHours);
  assert.throws(() => applyAdjustments(before, {
    ...emptyAdjustments(), overrides: { [action.id]: { annualFrequency: 1.5 } },
  }), /年频次必须为整数/);
});

test('management is unchanged and project totals include it exactly once', () => {
  const before = baseline();
  const target = before.actions.find((item) => item.category === 'engineeringRoutine' && item.annualHours > 0);
  const after = applyAdjustments(before, {
    ...emptyAdjustments(), overrides: { [target.id]: { disabled: true } },
  });

  assert.deepEqual(after.management, before.management);
  assert.equal(after.totalHeadcount, after.categories.reduce((sum, item) => sum + item.headcount, 0) + before.management.headcount);
  assert.equal(after.annualCost, after.categories.reduce((sum, item) => sum + item.annualCost, 0) + before.management.annualCost);
  assert.equal(after.workloadAnnualCost, after.categories.reduce((sum, item) => sum + item.workloadAnnualCost, 0));
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
