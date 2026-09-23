import test from 'node:test';
import assert from 'node:assert/strict';
import { EXAMPLE_PROJECT } from '../../src/exampleProject.ts';
import { getCalculationInputs, createCalculator } from './calculator.mjs';
import { getZhujiangInputs } from './zhujiang-model.mjs';

const project = {...EXAMPLE_PROJECT, calculationModel: 'zhujiang-v1', district: '增城区'};
const calculate = createCalculator();

test('public inputs hide workbook coefficients, fixed frequencies and duplicate quantities', () => {
  const inputs = getCalculationInputs(project);
  assert.ok(inputs.length < getZhujiangInputs(project).length / 3);
  const keys = new Set(inputs.map(input => input.key));
  assert.equal(keys.size, inputs.length);
  for (const key of ['客助!N9', '客助!P12', '工程常规!D5', '工程常规!E5', '工程常规!G5', '工程常规!M5', '清洁!X5', '绿化!U8', 'zhuj.task.lobby-mop.frequency', 'zhuj.zhuj-theme-publicity.frequency', 'zhuj.asset.pest.treatmentArea']) assert.equal(keys.has(key), false, key);
  for (const key of ['zhuj.cleaningAreaPerPerson', 'zhuj.annualCost.assistance', 'zhuj.asset.building.elevatorCount', '四害消杀!O17']) assert.ok(keys.has(key), key);
  assert.equal(inputs.find(input => input.key === 'zhuj.securityDailyHours').defaultLabel, '项目暂定值');
  assert.equal(inputs.find(input => input.key === 'zhuj.outdoorPatrolMinutes').defaultLabel, '待项目确认');
});

test('all four tiers retain reachable missing inputs, including newly confirmed equipment and tasks', () => {
  for (const serviceGrade of ['A', 'B', 'C', 'D']) {
    for (const workbookOverrides of [{}, {'zhuj.asset.building.elevatorCount': 6, 'zhuj.task.lift-clean.quantity': 6, 'zhuj.task.pest-toilet.quantity': 20}, {'zhuj.engineeringContractAnnualCost': 100000}, {'zhuj.garageIncluded': 0, 'zhuj.task.lobby-mop.quantity': 0}]) {
      const p = {...project, serviceGrade, workbookOverrides};
      const inputs = getCalculationInputs(p);
      for (const missing of calculate(p).missingInputs) {
        const input = inputs.find(input => input.key === missing.key);
        assert.ok(input, `${serviceGrade}: ${missing.key}`);
        if (input.visibleWhen) assert.ok(inputs.find(field => field.key === input.visibleWhen)?.value > 0, missing.key);
      }
      if (workbookOverrides['zhuj.engineeringContractAnnualCost'] != null) assert.ok(!inputs.some(input => input.key === 'zhuj.specialistHourlyRate'));
    }
  }
});

test('Zhujiang ratios follow the selected tier and public edits change the appropriate costs', () => {
  for (const [index, serviceGrade] of ['A', 'B', 'C', 'D'].entries()) {
    const p = {...project, serviceGrade};
    const input = getCalculationInputs(p).find(input => input.key === 'zhuj.cleaningAreaPerPerson');
    assert.equal(input.defaultValue, [5000, 7000, 8500, 10000][index]);
    assert.match(input.note, /珠江原区间/);
  }
  const p = {...project, serviceGrade: 'A'};
  const baseline = calculate(p);
  const edited = calculate({...p, workbookOverrides: {'zhuj.cleaningAreaPerPerson': 4000}});
  assert.ok(edited.budgetComparison.standard.annualCost > baseline.budgetComparison.standard.annualCost);
  assert.equal(edited.budgetComparison.workload.annualCost, baseline.budgetComparison.workload.annualCost);
  const copy = structuredClone(project);
  const before = calculate(copy).budgetComparison;
  getCalculationInputs(copy);
  assert.deepEqual(copy, project);
  assert.deepEqual(calculate(copy).budgetComparison, before);
  assert.equal(calculate(copy).unitPrice.toFixed(2), '3.21');
});
