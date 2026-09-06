import test from 'node:test';
import assert from 'node:assert/strict';

import { buildPresentationBindings } from './bindings.mjs';
import { fullResult } from '../test-fixtures/full-result.mjs';

test('binds V2 project totals and the 452 standard-action count', () => {
  const result = fullResult();
  const bindings = buildPresentationBindings(result, new Date('2026-09-03T00:00:00+08:00'));

  assert.equal(bindings.named['project-name-field'], result.project.projectName);
  assert.equal(bindings.named['field-unit-price'], (result.annualCost / result.project.residentialChargeArea / 12).toFixed(2));
  assert.equal(bindings.named['field-annual-cost'], (result.annualCost / 10000).toFixed(2));
  assert.equal(bindings.named['field-headcount'], String(Math.ceil(result.totalHeadcount)));
  assert.equal(bindings.named['field-action-count'], String(result.standardActionCount));
  assert.equal(bindings.named['field-staffing-summary'], '配置8类人员，共48人。');
  assert.equal(bindings.named['field-staffing-management'], '项目经理1人、管家主任1人、工程主任1人、客助主任1人');
  assert.equal(bindings.named['field-staffing-customer'], '客户服务5人、客助服务11人');
  assert.equal(bindings.named['field-staffing-environment'], '环境清洁15人、绿化养护3人、四害消杀1人');
  assert.equal(bindings.named['field-staffing-engineering'], '工程委外4人、工程常规5人');
  assert.deepEqual(bindings.summary, {
    annualCost: result.annualCost,
    unitPrice: result.annualCost / result.project.residentialChargeArea / 12,
    headcount: result.totalHeadcount,
    actionCount: result.standardActionCount,
  });
  assert.equal(bindings.cards.length, 16);
});

test('keeps representative cards instead of placing all 452 actions into the deck', () => {
  const result = fullResult();
  const bindings = buildPresentationBindings(result);

  assert.ok(bindings.cards.length < result.standardActionCount);
  assert.deepEqual(bindings.cards[0], {
    title: '客户投诉处理',
    scope: '已收未住5%＋常住户数20%',
    frequency: '13分钟响应，48小时完成',
  });
  assert.equal(bindings.cards[10].scope, '80,121㎡');
  assert.equal(bindings.cards[13].frequency, '乔木1次/年·灌木2次/年');
});

test('rejects incomplete and non-V2 calculation results', () => {
  const incomplete = fullResult();
  incomplete.actions = incomplete.actions.filter((item) => item.id !== 'service-12');
  incomplete.totalActionCount -= 1;
  incomplete.activeActionCount -= 1;
  assert.throws(() => buildPresentationBindings(incomplete), /标准动作必须完整包含 452 项/);

  const legacy = fullResult();
  legacy.version = 1;
  assert.throws(() => buildPresentationBindings(legacy), /测算结果版本必须为 2/);
});
