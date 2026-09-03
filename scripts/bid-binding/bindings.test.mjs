import assert from 'node:assert/strict';
import test from 'node:test';

import { buildBidBindings } from './bindings.mjs';

const range = (start, end) => Array.from({ length: end - start + 1 }, (_, index) => start + index);

function action(id, category, overrides = {}) {
  return {
    id,
    category,
    action: `${id} 动作`,
    property: '基础',
    basis: `${id}适用范围`,
    frequency: `${id}频次`,
    quantity: 100,
    unit: '平方米',
    headcount: category === 'assistance' ? 1.2 : undefined,
    annualCost: 1000,
    ...overrides,
  };
}

function result(overrides = {}) {
  const actions = [
    ...range(5, 21).map((row) => action(`service-${row}`, 'service')),
    ...range(5, 52).map((row) => action(`cleaning-${row}`, 'cleaning')),
    ...range(5, 55).map((row) => action(`greening-${row}`, 'greening')),
    ...[4, 5, 7, 8, 9, 10].map((row) => action(`assistance-${row}`, 'assistance')),
  ];
  return {
    version: 1,
    calculatedAt: '2026-09-03T00:00:00.000Z',
    project: {
      projectName: '甲项目',
      region: '广东省广州市增城区',
      city: '广州',
      serviceGrade: 'C',
      totalBuildingArea: 200000,
      residentialChargeArea: 100000,
      deliveredHouseholds: 1800,
      receivedHouseholds: 1500,
      occupiedHouseholds: 1200,
      perimeterEntrances: 500,
      gatehouses: 2,
      pavedRoadArea: 26000,
      greenArea: 25000,
      lawnRatio: 0.5,
      seasonalFlowerArea: 0,
      winterProtectionArea: 0,
      buildings: [{ buildingCount: 8 }],
      garageFloorArea: 40000,
      garageFloors: 2,
    },
    totalActionCount: 122,
    totalHeadcount: 22.2,
    annualCost: 1200000,
    categories: [
      { category: 'service', title: '服务', actionCount: 17, headcount: 4.2, annualCost: 240000 },
      { category: 'cleaning', title: '清洁', actionCount: 48, headcount: 8.2, annualCost: 360000 },
      { category: 'greening', title: '绿化', actionCount: 51, headcount: 3.1, annualCost: 180000 },
      { category: 'assistance', title: '客助', actionCount: 6, headcount: 6.7, annualCost: 420000 },
    ],
    actions,
    ...overrides,
  };
}

test('builds the cleaned template inventory from the current 122-action result', () => {
  const bindings = buildBidBindings(result(), new Date('2026-09-03T08:00:00+08:00'));

  assert.equal(bindings.actionRows.length, 109);
  assert.equal(bindings.staffingRows.length, 6);
  assert.equal(bindings.actionRows[0].id, 'service-5');
  assert.equal(bindings.actionRows.at(-1).id, 'greening-52');
  assert.equal(bindings.named['项目名称'], '甲项目');
  assert.equal(bindings.named['年度运营成本'], '120.00');
  assert.equal(bindings.named['综合单价'], '1.00');
  assert.equal(bindings.named['客户服务人数'], '5');
  assert.equal(bindings.named['人员总数'], '23');
});

test('uses the supplied calculation result rather than fixed demo values', () => {
  const first = result();
  const second = result({
    project: { ...first.project, projectName: '乙项目', residentialChargeArea: 200000 },
    annualCost: 3600000,
    totalHeadcount: 31.1,
    actions: first.actions.map((item) => item.id === 'service-5'
      ? { ...item, basis: '乙项目动态范围', frequency: '乙项目动态频次' }
      : item.id === 'assistance-4'
        ? { ...item, headcount: 4.1 }
        : item),
  });

  const bindings = buildBidBindings(second);
  assert.equal(bindings.named['项目名称'], '乙项目');
  assert.equal(bindings.named['综合单价'], '1.50');
  assert.equal(bindings.named['人员总数'], '32');
  assert.equal(bindings.actionRows[0].scope, '乙项目动态范围');
  assert.equal(bindings.actionRows[0].frequency, '乙项目动态频次');
  assert.equal(bindings.staffingRows[0].headcount, '5');
});

test('rejects incomplete calculation results instead of silently inserting defaults', () => {
  const current = result();
  current.actions = current.actions.filter((item) => item.id !== 'cleaning-12');

  assert.throws(() => buildBidBindings(current), /缺少测算动作 cleaning-12/);
});
