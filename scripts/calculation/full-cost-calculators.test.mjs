import assert from 'node:assert/strict';
import test from 'node:test';

import { parameterValues, resolveAdvancedParameters } from './advanced-parameters.mjs';
import { calculateFullCostModules } from './full-cost-calculators.mjs';
import { PARITY_PROJECTS } from './fixtures/parity-projects.mjs';
import {
  ENGINEERING_ANNUAL_CAPACITY_HOURS,
  ENGINEERING_BUDGET_FACTOR,
  ENGINEERING_MONTHLY_CAPACITY_HOURS,
  ENGINEERING_OUTSOURCED_MONTHLY_RATE,
  ENGINEERING_ROUTINE_MONTHLY_RATE,
  FULL_MODEL_COST_FACTORS,
  MANAGEMENT_BUDGET_FACTOR,
  PEST_WORKDAY_RATE,
  WORKBOOK_BASE_COST_BAND,
} from './rules/constants.mjs';
import { ENGINEERING_OUTSOURCED_RULES } from './rules/engineering-outsourced-rules.mjs';
import { ENGINEERING_ROUTINE_RULES } from './rules/engineering-routine-rules.mjs';
import { PEST_CONTROL_RULES } from './rules/pest-control-rules.mjs';

const baseProject = PARITY_PROJECTS[0];
const tolerance = 1e-9;

function closeTo(actual, expected, label = '数值') {
  assert.ok(
    Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)),
    `${label}: ${actual} !== ${expected}`,
  );
}

function calculate(project = baseProject) {
  return calculateFullCostModules(project, parameterValues(resolveAdvancedParameters(project)));
}

function group(result, category) {
  return result.groups.find(({ summary }) => summary.category === category);
}

test('定义以工作簿 upper 档为基准的完整模型成本常量', () => {
  assert.equal(WORKBOOK_BASE_COST_BAND, 'upper');
  assert.deepEqual(FULL_MODEL_COST_FACTORS, {
    high: 1.2 / 1.1,
    upper: 1,
    standard: 1 / 1.1,
    base: 0.9 / 1.1,
  });
  assert.equal(ENGINEERING_ROUTINE_MONTHLY_RATE, 6666.66666666667);
  assert.equal(ENGINEERING_OUTSOURCED_MONTHLY_RATE, 7500);
  assert.equal(ENGINEERING_BUDGET_FACTOR, 1.2);
  assert.equal(MANAGEMENT_BUDGET_FACTOR, 1.06);
  assert.equal(PEST_WORKDAY_RATE, 600);
  assert.equal(ENGINEERING_MONTHLY_CAPACITY_HOURS, 30 * 8);
  assert.equal(ENGINEERING_ANNUAL_CAPACITY_HOURS, 12 * 30 * 8);
});

test('计算 7 项四害、95 项工程委外、228 项工程常规及 4 个管理岗位', () => {
  const result = calculate();
  assert.deepEqual(result.groups.map(({ actions }) => actions.length), [7, 95, 228]);
  assert.deepEqual(result.groups.map(({ summary }) => summary.actionCount), [7, 95, 228]);
  assert.equal(result.management.headcount, 4);
  assert.ok(result.management.annualCost > 0);
});

test('网球场数量为零时保留真实对应动作且数量、年工时和年成本均为零', () => {
  const project = {
    ...baseProject,
    advancedParameterOverrides: { 'grounds.tennisCourtCount': 0 },
  };
  const routine = group(calculate(project), 'engineeringRoutine');
  const tennisActions = routine.actions.filter(({ id }) => [
    'engineering-routine-192',
    'engineering-routine-193',
    'engineering-routine-194',
  ].includes(id));
  assert.equal(tennisActions.length, 3);
  for (const action of tennisActions) {
    assert.equal(action.quantity, 0);
    assert.equal(action.annualHours, 0);
    assert.equal(action.annualCost, 0);
  }
});

test('工程动作与分类严格使用工时、系统月薪、统一预算月薪和向上取整公式', () => {
  const result = calculate();
  const outsourced = group(result, 'engineeringOutsourced');
  const routine = group(result, 'engineeringRoutine');
  const outsourcedRule = ENGINEERING_OUTSOURCED_RULES[0];
  const routineRule = ENGINEERING_ROUTINE_RULES[0];
  const outsourcedAction = outsourced.actions[0];
  const routineAction = routine.actions[0];

  const expectedOutsourcedHours = outsourcedAction.quantity
    * outsourcedRule.unitHours.C * outsourcedRule.annualFrequency.C;
  assert.equal(outsourcedAction.unitHours, outsourcedRule.unitHours.C);
  closeTo(outsourcedAction.annualHours, expectedOutsourcedHours, '工程委外年工时');
  closeTo(
    outsourcedAction.annualCost,
    expectedOutsourcedHours * (outsourcedRule.monthlyRate / 30 / 8),
    '工程委外动作工作量成本',
  );
  assert.equal(routineAction.unitHours, routineRule.unitHours.C);
  closeTo(routineAction.annualHours, routineAction.quantity * routineAction.unitHours
    * routineAction.annualFrequency, '工程常规年工时');
  closeTo(
    routineAction.annualCost,
    routineAction.annualHours * (6666.66666666667 / 30 / 8),
    '工程常规动作工作量成本',
  );

  for (const [current, monthlyRate] of [
    [outsourced, ENGINEERING_OUTSOURCED_MONTHLY_RATE],
    [routine, ENGINEERING_ROUTINE_MONTHLY_RATE],
  ]) {
    const expectedHours = current.actions.reduce((sum, item) => sum + item.annualHours, 0);
    closeTo(current.summary.annualHours, expectedHours, `${current.summary.title}合计年工时`);
    closeTo(
      current.summary.workloadEquivalentHeadcount,
      expectedHours / ENGINEERING_ANNUAL_CAPACITY_HOURS,
      `${current.summary.title}工作量折算人数`,
    );
    assert.equal(current.summary.headcount, Math.ceil(expectedHours / ENGINEERING_ANNUAL_CAPACITY_HOURS));
    closeTo(
      current.summary.annualCost,
      current.summary.headcount * monthlyRate * 12 * ENGINEERING_BUDGET_FACTOR,
      `${current.summary.title}年度预算`,
    );
    closeTo(
      current.summary.workloadAnnualCost,
      current.actions.reduce((sum, item) => sum + item.annualCost, 0),
      `${current.summary.title}工作量成本`,
    );
  }
  closeTo(outsourced.summary.annualCost, 432000, '示范项目工程委外预算');
  closeTo(routine.summary.annualCost, 480000, '示范项目工程常规预算');
});

test('四害将 Excel 合并区域的一份共享工作量等额分摊到 7 行明细', () => {
  const pest = group(calculate(), 'pestControl');
  const rule = PEST_CONTROL_RULES[0];
  const sharedAnnualHours = pest.actions[0].quantity
    * rule.unitHours.C * rule.annualFrequency.C;
  const expectedActionHours = sharedAnnualHours / pest.actions.length;
  const expectedWorkdays = sharedAnnualHours / 8;
  const expectedHeadcount = expectedWorkdays / (12 * 30);

  for (const action of pest.actions) {
    assert.equal(action.sharedWorkloadGroup, 'pest-control');
    assert.equal(action.allocationRatio, 1 / 7);
    assert.equal(action.sourceSharedUnitHours, rule.unitHours.C);
    assert.equal(action.unitHours, rule.unitHours.C / 7);
    closeTo(
      action.annualHours,
      action.quantity * action.unitHours * action.annualFrequency,
      `${action.id}有效单位工时公式`,
    );
    closeTo(action.annualHours, expectedActionHours, `${action.id}分摊年工时`);
    closeTo(
      action.annualCost,
      expectedActionHours * (PEST_WORKDAY_RATE / 8),
      `${action.id}分摊工作量成本`,
    );
  }
  assert.equal(
    pest.actions.reduce((sum, action) => sum + action.annualHours, 0),
    pest.summary.annualHours,
  );
  assert.equal(
    pest.actions.reduce((sum, action) => sum + action.annualCost, 0),
    pest.summary.workloadAnnualCost,
  );
  closeTo(pest.summary.annualHours, sharedAnnualHours, '四害共享年工时');
  closeTo(pest.summary.annualWorkdays, expectedWorkdays, '四害全年工作日');
  closeTo(pest.summary.headcount, expectedHeadcount, '四害全年兼职人数');
  closeTo(pest.summary.workloadAnnualCost, sharedAnnualHours * (PEST_WORKDAY_RATE / 8));
  closeTo(pest.summary.annualCost, expectedHeadcount * PEST_WORKDAY_RATE * 365);
  closeTo(pest.summary.annualCost, 41103.55418838223, '示范项目四害年度预算');
});

test('四害共享数量为零时 7 行分摊工作量和分类成本同时归零', () => {
  const project = {
    ...baseProject,
    advancedParameterOverrides: { 'pest.treatmentArea': 0 },
  };
  const pest = group(calculate(project), 'pestControl');
  assert.equal(pest.actions.length, 7);
  assert.ok(pest.actions.every(({ quantity, annualHours, annualCost }) => (
    quantity === 0 && annualHours === 0 && annualCost === 0
  )));
  assert.equal(pest.summary.annualHours, 0);
  assert.equal(pest.summary.workloadAnnualCost, 0);
  assert.equal(pest.summary.annualCost, 0);
});

test('管理成本使用四岗位工资、1.06 附加比例及城市相对因子', () => {
  const management = calculate().management;
  assert.equal(management.headcount, 4);
  assert.deepEqual(management.roles, [
    { title: '项目经理', monthlyRate: 18000, headcount: 1 },
    { title: '管家主任', monthlyRate: 10000, headcount: 1 },
    { title: '工程主任', monthlyRate: 10000, headcount: 1 },
    { title: '客助主任', monthlyRate: 10000, headcount: 1 },
  ]);
  closeTo(management.annualCost, (18000 + 10000 + 10000 + 10000) * 12 * 1.06);
  closeTo(management.annualCost, 610560, '示范项目管理预算');
});

test('所有模块和动作按四个城市档位同比缩放且所有结果有限非负', () => {
  const upper = calculate();
  for (const costBand of ['high', 'upper', 'standard', 'base']) {
    const project = { ...baseProject, costBand };
    const result = calculate(project);
    const factor = FULL_MODEL_COST_FACTORS[costBand];
    closeTo(result.management.annualCost, upper.management.annualCost * factor, `${costBand}管理成本`);
    for (let index = 0; index < result.groups.length; index += 1) {
      closeTo(
        result.groups[index].summary.annualCost,
        upper.groups[index].summary.annualCost * factor,
        `${costBand}/${result.groups[index].summary.title}预算`,
      );
      closeTo(
        result.groups[index].summary.workloadAnnualCost,
        upper.groups[index].summary.workloadAnnualCost * factor,
        `${costBand}/${result.groups[index].summary.title}工作量成本`,
      );
      for (let actionIndex = 0; actionIndex < result.groups[index].actions.length; actionIndex += 1) {
        closeTo(
          result.groups[index].actions[actionIndex].annualCost,
          upper.groups[index].actions[actionIndex].annualCost * factor,
          `${costBand}/${result.groups[index].actions[actionIndex].id}成本`,
        );
      }
    }

    for (const current of [
      result.management,
      ...result.groups.map(({ summary }) => summary),
      ...result.groups.flatMap(({ actions }) => actions),
    ]) {
      for (const [key, value] of Object.entries(current)) {
        if (typeof value === 'number') {
          assert.ok(Number.isFinite(value) && value >= 0, `${costBand}/${key} 必须有限非负`);
        }
      }
    }
  }
});

test('拒绝缺失、非有限、负数参数及未知等级或成本档位', () => {
  const parameters = parameterValues(resolveAdvancedParameters(baseProject));
  const missing = { ...parameters };
  delete missing['basement.parkingArea'];
  for (const invalid of [missing, { ...parameters, 'basement.parkingArea': Number.NaN }, { ...parameters, 'basement.parkingArea': -1 }]) {
    assert.throws(() => calculateFullCostModules(baseProject, invalid), /(?:参数缺失|必须为有限非负数)/);
  }
  assert.throws(
    () => calculateFullCostModules({ ...baseProject, serviceGrade: 'E' }, parameters),
    /未知服务等级/,
  );
  assert.throws(
    () => calculateFullCostModules({ ...baseProject, costBand: 'premium' }, parameters),
    /未知城市成本档位/,
  );
});
