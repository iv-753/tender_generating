import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateZhujiangProject, getZhujiangInputs } from './zhujiang-model.mjs';
import { PARITY_PROJECTS } from './fixtures/parity-projects.mjs';
import { resultValidationError } from '../../api/_lib/result-validation.mjs';
import { ZHUJIANG_TASKS, taskSource, taskFrequency } from './zhujiang-operations.mjs';
const p={...PARITY_PROJECTS[0],calculationModel:'zhujiang-v1',serviceGrade:'D',region:'广东省',city:'广州市',district:'增城区'};
const calc=(workbookOverrides={},serviceGrade='D')=>calculateZhujiangProject({...p,serviceGrade,workbookOverrides});
const action=(r,id)=>r.actions.find(a=>a.id===id);
test('every original action has a reviewed disposition, with data gaps distinct from unmapped rules',()=>{
  const r=calc();
  assert.equal(r.standard.unreviewedActionCount,0);
  assert.ok(r.actions.every(a=>a.ruleKind && a.standardNote));
  assert.ok(r.missingInputs.length>0);
  assert.ok(r.missingInputs.every(x=>x.key && x.reason && x.actionIds.length));
});
test('specific engineering rules replace generic inspections; daily lift work is separate from its contract',()=>{
  for(const [g,f] of [['A',365],['B',52],['C',12],['D',4]]) {
    const r=calc({'zhuj.asset.basement.powerDistributionRoomCount':1},g);
    assert.equal(action(r,'engineering-routine-42').annualFrequency,f);
  }
  const r=calc({'zhuj.asset.building.elevatorCount':6,'zhuj.engineeringContractAnnualCost':36000});
  assert.equal(action(r,'engineering-routine-104').annualFrequency,365);
  assert.equal(r.categories.find(c=>c.category==='engineeringOutsourced').annualCost,36000);
});
test('new source-backed actions calculate quantity times frequency times independently entered effort',()=>{
  const r=calc({'zhuj.task.lift-clean.quantity':6,'zhuj.task.lift-clean.hours':0.1},'A');
  const a=action(r,'zhuj-lift-clean');
  assert.equal(a.annualFrequency,730); assert.equal(a.annualHours,438);
  assert.ok(a.standardSource.includes('22'));
  assert.equal(resultValidationError(r),undefined);
});
test('unknown scope is not silently excluded and zero scope does not ask for effort',()=>{
  assert.equal(action(calc(),'zhuj-toilet-clean').standardStatus,'pending');
  const r=calc({'zhuj.task.toilet-clean.quantity':0});
  assert.equal(action(r,'zhuj-toilet-clean').standardStatus,'excluded');
  assert.ok(!r.missingInputs.some(x=>x.key==='zhuj.task.toilet-clean.hours'));
});
test('source conflict requires an explicit frequency and never adds the two competing clauses',()=>{
  const key='工程常规!L30';
  const input=getZhujiangInputs(p).find(x=>x.key===key);
  assert.equal(input.defaultValue,null); assert.match(input.note,/49.*89/);
  const r=calc({'工程常规!D30':1,[key]:365});
  assert.equal(action(r,'engineering-routine-30').annualFrequency,365);
  assert.equal(action(r,'engineering-routine-30').standardStatus,'manual');
});
test('old pest aggregate cannot duplicate source-specific pest work',()=>{
  const r=calc({'zhuj.task.pest-common.quantity':1000,'zhuj.task.pest-common.hours':0.001},'D');
  assert.equal(action(r,'zhuj-pest-common').annualFrequency,9.5);
  assert.ok(r.actions.filter(a=>a.id.startsWith('pest-control-')).every(a=>!a.enabled));
  assert.equal(r.categories.find(c=>c.category==='pestControl').annualCost,action(r,'zhuj-pest-common').annualCost);
});
test('every positive fixed supplementary frequency has source text, and unmerged blanks remain unknown',()=>{
  for(const grade of 'ABCD') for(const task of ZHUJIANG_TASKS) if(taskFrequency(task,grade)>0) {
    const {sourceText,sourceRef}=taskSource(task,grade);
    assert.ok(sourceText&&sourceText!=='——',`${grade} ${task.key} ${sourceRef}`);
  }
  assert.equal(taskFrequency(ZHUJIANG_TASKS.find(t=>t.key==='fans-maintenance'),'A'),null);
});
test('management concurrency and shared accounting count payroll once',()=>{
  const overrides={'zhuj.management.accountant.annualCost':120000,'zhuj.management.cashier.annualCost':60000};
  const a=calc(overrides),b=calc({...overrides,'zhuj.managerConcurrentRole':2});
  const head=a.management.roles.find(r=>r.title==='工程主任');
  assert.ok(Math.abs(a.management.headcount-b.management.headcount-1)<1e-9);
  assert.equal(a.management.annualCost-b.management.annualCost,head.annualCost);
  assert.equal(a.management.roles.find(r=>r.title==='共享会计').annualCost,48000);
});
test('all-in payroll and productive work use one consistent hourly basis',()=>{
  const r=calc({'zhuj.annualCost.engineeringRoutine':72000,'zhuj.task.building-structure.quantity':2,'zhuj.task.building-structure.hours':8});
  const a=action(r,'zhuj-building-structure');
  assert.equal(a.annualCost,16*72000/2880);
  for(const c of r.categories.filter(c=>['service','cleaning','greening','engineeringRoutine'].includes(c.category))) assert.ok(c.workloadBudgetAnnualCost+1e-6>=c.workloadAnnualCost);
});
test('fully specified fixture clears readiness, changing one necessary input back to blank reopens it',()=>{
  const overrides={};
  let r=calc(overrides);
  // Explicit fixture assumptions: unknown facilities are absent; unknown plans
  // are zero. This exercises confirmation versus blanks, not a production preset.
  for(let i=0;i<3&&r.missingInputs.length;i++) {
    for(const item of r.missingInputs) overrides[item.key]=0;
    r=calc(overrides);
  }
  assert.deepEqual(r.missingInputs,[]);assert.equal(r.standard.complete,true);
  assert.equal(resultValidationError(r),undefined);
  delete overrides['zhuj.management.cashier.annualCost'];
  assert.equal(calc(overrides).standard.complete,false);
});
test('marble crystallization uses confirmed material area, not the entire lobby',()=>{
  assert.equal(action(calc(),'cleaning-27').standardStatus,'pending');
  const r=calc({'zhuj.lobbyMarbleArea':100});
  assert.equal(action(r,'cleaning-27').quantity,100);
  assert.equal(action(calc({'zhuj.lobbyMarbleArea':0}),'cleaning-27').standardStatus,'excluded');
});
test('replacement fire tasks cannot revive old aggregate costs through stale overrides',()=>{
  const r=calc({'工程常规!D8':5000,'工程常规!L8':365});
  assert.equal(action(r,'engineering-routine-8').standardStatus,'excluded');
  assert.equal(action(r,'engineering-routine-8').annualCost,0);
});
