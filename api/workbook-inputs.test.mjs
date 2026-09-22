import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorkbookInputsHandler } from './workbook-inputs.mjs';

test('parameter preview validates project before exposing inputs', async () => {
  let called = false;
  const handler = createWorkbookInputsHandler({ validate: () => '请选择区县', inputs: () => { called = true; return []; } });
  const response = await handler.fetch(new Request('http://local/api/workbook-inputs', { method: 'POST', body: '{}' }));
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, '请选择区县');
  assert.equal(called, false);
});

test('parameter preview preserves numeric fractional defaults and rejects other methods', async () => {
  const expected = [{ key: '清洁!W5', value: 0.5, defaultValue: 0.5 }];
  const handler = createWorkbookInputsHandler({ validate: () => undefined, inputs: () => expected });
  const response = await handler.fetch(new Request('http://local/api/workbook-inputs', { method: 'POST', body: '{}' }));
  assert.deepEqual(await response.json(), expected);
  assert.equal((await handler.fetch(new Request('http://local/api/workbook-inputs'))).status, 405);
});
import { PARITY_PROJECTS } from '../scripts/calculation/fixtures/parity-projects.mjs';
import { createCalculator } from '../scripts/calculation/calculator.mjs';
import { resultValidationError } from './_lib/result-validation.mjs';

test('Zhujiang API exposes ratios and both budgets with a valid result contract', async () => {
  const project={...PARITY_PROJECTS[0],calculationModel:'zhujiang-v1',region:'广东省',city:'广州市',district:'增城区',serviceGrade:'A',workbookOverrides:{'zhuj.cleaningAreaPerPerson':4000}};
  const response=await createWorkbookInputsHandler().fetch(new Request('http://local/api/workbook-inputs',{method:'POST',body:JSON.stringify(project)}));
  assert.equal(response.status,200);
  const inputs=await response.json();
  assert.equal(inputs.find(x=>x.key==='zhuj.cleaningAreaPerPerson').value,4000);
  assert.equal(inputs.find(x=>x.key==='zhuj.cleaningAreaPerPerson').defaultValue,5000);
  for(const budgetBasis of ['standard','workload']) {
    const result=createCalculator()({...project,budgetBasis});
    assert.equal(resultValidationError(result),undefined);
    assert.equal(result.annualCost,result.budgetComparison[budgetBasis].annualCost);
  }
});

test('complete district model exposes editable inputs and exports a valid 453-action result', async () => {
  const project = {...PARITY_PROJECTS[0], calculationModel:'workbook-v3', region:'广东省', city:'广州市', district:'白云区', workbookOverrides:{'客助!P12':7000}};
  const handler = createWorkbookInputsHandler();
  const post = (body) => new Request('http://local/api/workbook-inputs', {method:'POST', body:JSON.stringify(body)});
  const response = await handler.fetch(post(project));
  assert.equal(response.status, 200);
  const inputs = await response.json();
  assert.equal(inputs.length, 2308);
  const salary = inputs.find(item => item.key === '客助!P12');
  assert.equal(salary.value, 7000);
  assert.equal(salary.defaultValue, 8000);
  const result = createCalculator()(project);
  assert.equal(resultValidationError(result), undefined);
  result.actions = result.actions.filter(item => item.id !== 'assistance-6');
  assert.match(resultValidationError(result), /453/);
  assert.equal((await handler.fetch(post({...project, district:undefined}))).status, 400);
  assert.equal((await handler.fetch(post({...project, workbookOverrides:{'客助!P13':0}}))).status, 400);
});
