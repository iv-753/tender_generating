import test from 'node:test';
import assert from 'node:assert/strict';
import { EXAMPLE_PROJECT } from '../../src/exampleProject.ts';
import { calculateZhujiangProject, getZhujiangInputs } from './zhujiang-model.mjs';
import { getZhujiangProjectInputs } from './zhujiang-project-inputs.mjs';
import { sourceCell } from './zhujiang-rules.mjs';
import { ACTION_POLICIES } from './zhujiang-operations.mjs';
const p={...EXAMPLE_PROJECT,calculationModel:'zhujiang-v1',district:'增城区',serviceGrade:'D'};
const calc=(workbookOverrides={})=>calculateZhujiangProject({...p,workbookOverrides});
const action=(r,id)=>r.actions.find(a=>a.id===id);

test('unentered project equipment is unknown, never the workbook sample; actual counts feed both uses',()=>{
  const inputs=getZhujiangInputs(p),r=calc();
  assert.equal(inputs.find(x=>x.key==='zhuj.asset.building.elevatorCount').value,null);
  assert.equal(action(r,'engineering-routine-104').standardStatus,'pending');
  assert.equal(action(r,'engineering-outsourced-67').annualCost,0);
  const gap=r.missingInputs.find(x=>x.key==='zhuj.asset.building.elevatorCount');
  assert.ok(gap.actionIds.includes('zhuj-lift-clean'));
  assert.ok(!r.missingInputs.some(x=>x.key==='zhuj.task.lift-clean.quantity'));
  const actual=calc({'zhuj.asset.building.elevatorCount':6,'zhuj.task.lift-clean.hours':0.1});
  assert.equal(action(actual,'engineering-routine-104').quantity,6);
  assert.equal(action(actual,'zhuj-lift-clean').quantity,6);
  assert.equal(action(actual,'zhuj-lift-clean').annualHours,219);
  assert.equal(action(calc({'zhuj.asset.building.elevatorCount':0}),'zhuj-lift-clean').standardStatus,'excluded');
});

test('shared treatment scope is entered once but pest control and disinfection keep separate standards',()=>{
  const inputs=getZhujiangProjectInputs(p);
  assert.equal(inputs.find(x=>x.key==='zhuj.task.disinfect-drains.quantity').visibleWhen,'zhuj.task.pest-drains.quantity');
  const r=calc({'zhuj.task.pest-drains.quantity':1000,'zhuj.task.pest-drains.hours':0.001,'zhuj.task.disinfect-drains.hours':0.002});
  assert.equal(action(r,'zhuj-disinfect-drains').quantity,1000);
  assert.equal(action(r,'zhuj-pest-drains').annualHours,19);
  assert.notEqual(action(r,'zhuj-pest-drains').annualFrequency,action(r,'zhuj-disinfect-drains').annualFrequency);
  const adjusted=calc({'zhuj.task.pest-drains.quantity':1000,'zhuj.task.disinfect-drains.quantity':200,'zhuj.task.disinfect-drains.hours':0.002});
  assert.equal(action(adjusted,'zhuj-disinfect-drains').quantity,200);
  assert.ok(calc().missingInputs.some(x=>x.key==='zhuj.task.disinfect-common.quantity'));
});

test('project-wide annual training and exercises use standard event counts only once',()=>{
  const ids=['fire-training','owner-fire-training','flood-exercise','emergency-exercise','owner-survey'];
  const r=calc(Object.fromEntries(ids.map(id=>[`zhuj.task.${id}.hours`,3])));
  for(const [i,id] of ids.entries()) {
    assert.equal(action(r,`zhuj-${id}`).annualHours,[6,3,3,3,3][i]);
    assert.ok(!getZhujiangProjectInputs(p).some(x=>x.key===`zhuj.task.${id}.quantity`));
  }
});

test('quarterly pipeline inspection follows the specific source and original unit-hour formula',()=>{
  assert.match(sourceCell('环境管理',54,'D').sourceText,/管道每季度检查一次/);
  for(const serviceGrade of 'ABCD') {
    const r=calculateZhujiangProject({...p,serviceGrade,workbookOverrides:{'zhuj.asset.grounds.drainagePipelineLength':100}});
    const a=action(r,'engineering-routine-223');
    assert.equal(a.annualFrequency,4);
    assert.equal(a.standardSource,'环境管理!C54');
    // Original neutral unit effort 0.0002 h/m plus 10% travel, four inspections/year.
    assert.ok(Math.abs(a.annualHours-100*0.0002*1.1*4)<1e-10);
  }
  for(const row of [221,224,227]) assert.equal(ACTION_POLICIES.get(`engineering-routine-${row}`).kind,'plan');
  for(const row of [220,222,225,228]) assert.equal(ACTION_POLICIES.get(`engineering-routine-${row}`).kind,'scope');
  assert.equal(ACTION_POLICIES.get('engineering-routine-30').kind,'conflict');
  assert.equal(ACTION_POLICIES.get('engineering-routine-226').kind,'conflict');
});

test('unmatched mopping effort remains unknown and names the actual Zhujiang operation',()=>{
  const gap=calc().missingInputs.find(x=>x.key==='清洁!F34');
  assert.match(gap.label,/清拖/);
  assert.ok(!gap.label.includes('深度清洁'));
  assert.equal(action(calc(),'cleaning-34').standardStatus,'pending');
});
