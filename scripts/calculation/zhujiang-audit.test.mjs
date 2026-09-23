import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateZhujiangProject as calculate, getZhujiangInputs } from './zhujiang-model.mjs';
import { PARITY_PROJECTS } from './fixtures/parity-projects.mjs';
import { resultValidationError } from '../../api/_lib/result-validation.mjs';
const project={...PARITY_PROJECTS[0],calculationModel:'zhujiang-v1',serviceGrade:'D',region:'广东省',city:'广州市',district:'增城区'};
const calc=(overrides={},extra={})=>calculate({...project,...extra,workbookOverrides:overrides});
test('outdoor cleaning is not billed as underground garage cleaning',()=>{
  const r=calc();
  for(const id of ['cleaning-47','cleaning-48']) {
    const a=r.actions.find(x=>x.id===id);
    assert.equal(a.standardStatus,'reference'); assert.ok(a.annualCost>0);
    assert.ok(!a.standardSource.includes('26'));
  }
});
test('known geometry is calculated while unentered equipment remains unknown',()=>{
  const r=calc();
  assert.ok(r.categories.find(x=>x.category==='engineeringOutsourced').annualCost>0);
  assert.equal(getZhujiangInputs(project).find(x=>x.key==='zhuj.asset.building.elevatorCount').value,null);
  assert.equal(r.actions.find(x=>x.id==='engineering-outsourced-67').annualCost,0);
  assert.equal(r.standard.complete,false);
  assert.ok(r.standard.pendingActionCount>0);
  assert.equal(resultValidationError(r),undefined);
});
test('known elevator count feeds daily Zhujiang inspection, without original 28-elevator sample',()=>{
  const r=calc({'zhuj.asset.building.elevatorCount':6});
  const a=r.actions.find(x=>x.id==='engineering-routine-104');
  assert.ok(a); assert.equal(a.quantity,6); assert.equal(a.annualFrequency,365);
  assert.equal(a.standardStatus,'mapped');
});
test('garage out of service scope removes garage work despite nonzero input geometry',()=>{
  const r=calc({'zhuj.garageIncluded':0,'清洁!X48':365,'工程常规!D5':1000});
  for(const id of ['cleaning-47','cleaning-48','engineering-routine-5']) {
    const a=r.actions.find(x=>x.id===id); assert.equal(a.annualCost,0); assert.equal(a.standardStatus,'excluded');
  }
});
test('ratio staffing uses twelve-month salary and explicit all-in annual cost, without reapplying overhead',()=>{
  const r=calc({'zhuj.annualCost.cleaning':51720,'zhuj.annualCost.assistance':67040});
  for(const [key,rate] of [['cleaning',51720],['assistance',67040]]) {
    const c=r.categories.find(x=>x.category===key);
    assert.equal(c.standardAnnualCost,c.standardHeadcount*rate);
    assert.equal(c.workloadBudgetAnnualCost,c.workloadHeadcount*rate);
  }
  const base=calc(),clean=base.categories.find(x=>x.category==='cleaning');
  assert.equal(clean.standardAnnualCost,clean.standardHeadcount*3500*12);
  assert.equal(clean.workloadHeadcount,Math.ceil(clean.annualHours/(26*12*8)));
  assert.ok(clean.workloadBudgetAnnualCost>=clean.workloadAnnualCost);
});
test('suspicious Luhuge area per household is flagged, never silently repaired',()=>{
  const r=calc({}, {residentialChargeArea:8536,deliveredHouseholds:386,receivedHouseholds:386,occupiedHouseholds:386});
  assert.ok(r.warnings.some(x=>x.includes('22.1')&&x.includes('收费面积')));
  assert.equal(r.project.residentialChargeArea,8536);
});
test('manual confirmation activates only that action; explicit zero is excluded rather than pending',()=>{
  const r=calc({'清洁!X48':12,'服务!P15':0});
  const garage=r.actions.find(x=>x.id==='cleaning-48');
  assert.equal(garage.standardStatus,'manual'); assert.equal(garage.annualFrequency,12); assert.ok(garage.annualCost>0);
  assert.equal(r.actions.find(x=>x.id==='service-15').standardStatus,'excluded');
  assert.equal(resultValidationError(r),undefined);
});
test('mopping does not reuse old deep-cleaning effort without explicit confirmation',()=>{
  const a=calc(),b=calc({'清洁!F34':0.08});
  assert.equal(a.actions.find(x=>x.id==='cleaning-34').standardStatus,'pending');
  assert.equal(b.actions.find(x=>x.id==='cleaning-34').annualFrequency,52);
  assert.ok(b.actions.find(x=>x.id==='cleaning-34').annualCost>0);
});
test('contract amount replaces engineering estimate and is counted once in each independent budget',()=>{
  const a=calc(),b=calc({'zhuj.engineeringContractAnnualCost':36000});
  for(const basis of ['standard','workload']) assert.ok(Math.abs(b.budgetComparison[basis].annualCost-a.budgetComparison[basis].annualCost-(36000-a.categories.find(c=>c.category==='engineeringOutsourced').annualCost))<1e-6);
  assert.equal(resultValidationError(b),undefined);
});
test('all-in management expense has no duplicate welfare percentage',()=>{
  const r=calc({'zhuj.managementAnnualCost.0':140000,'管理模块!C4':1,'管理模块!C5':0,'管理模块!C6':0,'管理模块!C7':0});
  assert.equal(r.management.annualCost,140000);
  assert.equal(resultValidationError(r),undefined);
});
