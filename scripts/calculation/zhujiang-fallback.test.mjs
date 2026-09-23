import test from 'node:test';
import assert from 'node:assert/strict';
import { EXAMPLE_PROJECT } from '../../src/exampleProject.ts';
import { calculateZhujiangProject, getZhujiangInputs } from './zhujiang-model.mjs';
import { calculateWorkbookProject } from './workbook-model.mjs';
const project = {...EXAMPLE_PROJECT, calculationModel:'zhujiang-v1', district:'增城区', serviceGrade:'D'};
const calc = (workbookOverrides={}) => calculateZhujiangProject({...project,workbookOverrides});
const original = calculateWorkbookProject({...project,calculationModel:'workbook-v3'});
const action = (result,id) => result.actions.find(item=>item.id===id);

test('missing Zhujiang plans use actual original annual frequencies, not zero or one cycle',()=>{
  const result=calc();
  for(const id of ['service-5','cleaning-48','greening-5','engineering-routine-22','engineering-outsourced-67']) {
    assert.equal(action(result,id).annualFrequency,action(original,id).annualFrequency,id);
    assert.equal(action(result,id).standardStatus,'reference',id);
    assert.ok(action(result,id).annualCost>0,id);
  }
  assert.equal(action(result,'greening-8').annualFrequency,10);
  assert.equal(action(result,'greening-8').standardStatus,'mapped');
});

test('template quantities are disclosed and explicit project overrides including zero take precedence',()=>{
  const input=getZhujiangInputs(project).find(x=>x.key==='zhuj.asset.building.elevatorCount');
  assert.equal(input.defaultValue,28);
  assert.equal(input.defaultLabel,'动态成本表参考值');
  for(const value of [0,6]) {
    const r=calc({'zhuj.asset.building.elevatorCount':value});
    assert.equal(action(r,'engineering-routine-104').quantity,value);
    assert.equal(action(r,'engineering-outsourced-67').quantity,value);
  }
});

test('excluded, optional and conflicting standards are not blindly filled from the old table',()=>{
  const r=calc({'zhuj.garageIncluded':0});
  for(const id of ['cleaning-48','engineering-routine-5','engineering-routine-8','greening-47','service-15']) assert.equal(action(r,id).enabled,false,id);
  assert.equal(getZhujiangInputs(project).find(x=>x.key==='工程常规!L30').defaultValue,null);
  assert.equal(action(calc(),'engineering-routine-30').standardStatus,'pending');
});

test('reference-only patrol is costed and explicitly marked; complete actual routes replace it',()=>{
  const r=calc();
  assert.equal(action(r,'assistance-8').headcount,action(original,'assistance-8').headcount);
  assert.equal(action(r,'assistance-8').standardStatus,'reference');
  const actual=calc({'zhuj.outdoorPatrolMinutes':30,'zhuj.indoorPatrolMinutes':1,'zhuj.priorityPatrolMinutes':0});
  assert.equal(action(actual,'assistance-8').headcount,Math.ceil((6*30+project.buildings.reduce((s,b)=>s+b.totalFloors,0))/60/8));
});

test('reference defaults reduce gaps without inventing missing new service measurements',()=>{
  const r=calc();
  assert.ok(r.activeActionCount>250);
  assert.ok(r.missingInputs.length<130);
  assert.equal(action(r,'zhuj-toilet-clean').standardStatus,'pending');
  assert.ok(r.missingInputs.length>0);
  assert.ok(r.missingInputs.every(x=>!/[A-Z]+-[A-Z]+-\d+/.test(x.label)));
  for(const basis of ['standard','workload']) assert.ok(Math.abs(r.budgetComparison[basis].annualCost-r.categories.reduce((s,c)=>s+(basis==='standard'?c.standardAnnualCost:c.workloadBudgetAnnualCost),0)-r.management.annualCost)<1e-6);
});
