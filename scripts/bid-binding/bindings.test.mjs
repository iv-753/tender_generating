import assert from 'node:assert/strict';
import test from 'node:test';

import { buildBidBindings } from './bindings.mjs';
import { fullResult } from '../test-fixtures/full-result.mjs';

test('builds representative Word rows from a complete V2 result', () => {
  const result = fullResult();
  const bindings = buildBidBindings(result, new Date('2026-09-03T08:00:00+08:00'));

  assert.equal(bindings.actionRows.length, 109);
  assert.equal(bindings.staffingRows.length, 6);
  assert.equal(bindings.named['项目名称'], result.project.projectName);
  assert.equal(bindings.named['年度运营成本'], (result.annualCost / 10000).toFixed(2));
  assert.equal(bindings.named['综合单价'], (result.annualCost / result.project.residentialChargeArea / 12).toFixed(2));
  assert.equal(bindings.named['人员总数'], String(Math.ceil(result.totalHeadcount)));
  assert.equal(bindings.named['四害消杀人数'], '1');
  assert.equal(bindings.named['工程委外人数'], '4');
  assert.equal(bindings.named['工程常规人数'], '5');
  assert.equal(bindings.named['管理人员人数'], '4');
  assert.equal(
    [
      '客户服务人数', '客助服务人数', '环境清洁人数', '绿化养护人数',
      '四害消杀人数', '工程委外人数', '工程常规人数', '管理人员人数',
    ].reduce((sum, key) => sum + Number(bindings.named[key]), 0),
    Number(bindings.named['人员总数']),
  );
  assert.equal(bindings.named['标准动作数'], '452');
  assert.deepEqual(bindings.summary, {
    annualCost: result.annualCost,
    unitPrice: result.annualCost / result.project.residentialChargeArea / 12,
    headcount: result.totalHeadcount,
    actionCount: result.standardActionCount,
  });
  assert.equal(bindings.actionRows.find((item) => item.id === 'cleaning-47').scope, '80,121平方米');
  assert.equal(bindings.staffingRows.find((item) => item.id === 'assistance-8').basis, '252,481平方米');
});

test('uses supplied V2 values instead of fixed demo values', () => {
  const result = fullResult({ projectName: '乙项目', residentialChargeArea: 200000 });
  const target = result.actions.find((item) => item.id === 'service-5');
  target.basis = '乙项目动态范围';
  target.frequency = '乙项目动态频次';

  const bindings = buildBidBindings(result);
  assert.equal(bindings.named['项目名称'], '乙项目');
  assert.equal(bindings.named['综合单价'], (result.annualCost / 200000 / 12).toFixed(2));
  assert.equal(bindings.actionRows[0].scope, '乙项目动态范围');
  assert.equal(bindings.actionRows[0].frequency, '乙项目动态频次');
});

test('rejects incomplete and non-V2 calculation results', () => {
  const incomplete = fullResult();
  incomplete.actions.pop();
  incomplete.totalActionCount -= 1;
  incomplete.activeActionCount -= 1;
  assert.throws(() => buildBidBindings(incomplete), /标准动作必须完整包含 452 项/);

  const legacy = fullResult();
  legacy.version = 1;
  assert.throws(() => buildBidBindings(legacy), /测算结果版本必须为 2/);
});

test('accepts stopped standards and custom actions for fixed-template export', () => {
  const result = fullResult();
  const stopped = result.actions.find((item) => item.id === 'service-5');
  stopped.enabled = false;
  stopped.annualFrequency = 0;
  stopped.annualHours = 0;
  stopped.annualCost = 0;
  result.activeActionCount -= 1;
  result.categories[0].actionCount -= 1;

  const bindings = buildBidBindings(result);
  assert.equal(bindings.actionRows.find((item) => item.id === 'service-5').enabled, false);
  assert.equal(bindings.named['标准动作数'], '452');
});
