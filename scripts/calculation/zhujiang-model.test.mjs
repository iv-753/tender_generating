import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateZhujiangProject, getZhujiangInputs, validateZhujiangProject } from './zhujiang-model.mjs';
import { PARITY_PROJECTS } from './fixtures/parity-projects.mjs';
import { sourceCell } from './zhujiang-rules.mjs';

const project = {...PARITY_PROJECTS[0], calculationModel:'zhujiang-v1', region:'广东省', city:'广州市', district:'增城区', totalBuildingArea:200000, greenArea:12000, serviceGrade:'A'};
const calc = (workbookOverrides={}, extra={}) => calculateZhujiangProject({...project,...extra,workbookOverrides});
const category = (r,key) => r.categories.find(c=>c.category===key);
const close = (a,b) => assert.ok(Math.abs(a-b)<1e-7*Math.max(1,Math.abs(b)),`${a} != ${b}`);

test('four Zhujiang grades use their actual staffing ranges and preserve both budgets',()=>{
  for(const [index,grade] of [...'ABCD'].entries()) {
    const r=calc({}, {serviceGrade:grade});
    assert.equal(category(r,'cleaning').standardHeadcount,[40,29,24,20][index]);
    assert.equal(category(r,'greening').standardHeadcount,[4,3,3,2][index]);
    assert.equal(r.standard.label,['御享','雅享','悦享','善享'][index]);
    for (const action of r.actions.filter(x=>x.standardStatus==='mapped')) assert.ok(action.standardText,`${grade} ${action.id} must cite an actual source clause`);
    close(r.annualCost,r.budgetComparison.standard.annualCost);
    close(r.budgetComparison.standard.annualCost,r.categories.reduce((s,c)=>s+c.standardAnnualCost,0)+r.management.annualCost);
    close(r.budgetComparison.workload.annualCost,r.categories.reduce((s,c)=>s+c.workloadBudgetAnnualCost,0)+r.management.annualCost);
  }
});

test('patrol requires complete route effort including priority sites, and dedicated extra posts affect both budgets',()=>{
  const partial=calc({'zhuj.outdoorPatrolMinutes':60});
  assert.equal(partial.standard.patrolReady,false);
  const r=calc({'zhuj.outdoorPatrolMinutes':60,'zhuj.indoorPatrolMinutes':2,'zhuj.priorityPatrolMinutes':480});
  const expected=Math.ceil((12*60+6*project.buildings.reduce((s,b)=>s+b.totalFloors,0)*2+480)/60/8);
  assert.equal(r.actions.find(x=>x.id==='assistance-8').headcount,expected);
  assert.equal(r.standard.patrolReady,true);
  const base=calc(),extra=calc({'zhuj.otherEngineeringStaff':2});
  for(const field of ['standardHeadcount','workloadHeadcount']) assert.equal(category(extra,'engineeringRoutine')[field]-category(base,'engineeringRoutine')[field],2);
});

test('community activities accept independent hours and frequencies without reusing fixed publicity costs',()=>{
  const base=calc(),r=calc({'zhuj.zhuj-owner-meeting.frequency':6,'zhuj.zhuj-owner-meeting.hours':10});
  const meeting=r.actions.find(x=>x.id==='zhuj-owner-meeting');
  assert.equal(meeting.annualHours,60);
  assert.equal(meeting.standardStatus,'manual');
  close(r.budgetComparison.standard.annualCost,base.budgetComparison.standard.annualCost);
  assert.equal(r.actions.find(x=>x.id==='engineering-routine-6').standardStatus,'pending');
  assert.ok(validateZhujiangProject({...project,workbookOverrides:{'客助!C4':1}}));
});
test('5000 or 4000 sqm/person changes the ratio budget, not the independent workload budget',()=>{
  const a=calc(),b=calc({'zhuj.cleaningAreaPerPerson':4000});
  assert.equal(category(a,'cleaning').standardHeadcount,40);
  assert.equal(category(b,'cleaning').standardHeadcount,50);
  assert.ok(b.budgetComparison.standard.annualCost>a.budgetComparison.standard.annualCost);
  close(a.budgetComparison.workload.annualCost,b.budgetComparison.workload.annualCost);
  const c=calc({'zhuj.cleaningAreaPerPerson':4000},{budgetBasis:'workload'});
  close(c.annualCost,c.budgetComparison.workload.annualCost);
  assert.equal(c.totalHeadcount,c.budgetComparison.workload.headcount);
});
test('grass cutting and wall wiping follow the draft, including non-monotonic frequencies',()=>{
  const a=calc(),b=calc({}, {serviceGrade:'B'}),d=calc({}, {serviceGrade:'D'});
  const get=(r,id)=>r.actions.find(x=>x.id===id);
  assert.equal(get(a,'greening-8').annualFrequency,30);
  assert.equal(get(d,'greening-8').annualFrequency,10);
  close(get(a,'greening-8').annualHours/get(d,'greening-8').annualHours,3);
  assert.equal(get(a,'cleaning-30').annualFrequency,12);
  assert.equal(get(b,'cleaning-30').annualFrequency,24);
  assert.equal(get(a,'service-5').unitHours,get(d,'service-5').unitHours);
  assert.match(get(a,'cleaning-30').standardSource,/环境管理!F17/);
  assert.ok(a.warnings.some(w=>w.includes('原稿')&&w.includes('差异')));
});
test('parameter reset restores selected-grade defaults and source ranges are not discarded',()=>{
  const inputs=getZhujiangInputs({...project,workbookOverrides:{'zhuj.cleaningAreaPerPerson':4000,'绿化!U8':31}});
  const density=inputs.find(x=>x.key==='zhuj.cleaningAreaPerPerson');
  assert.equal(density.value,4000);assert.equal(density.defaultValue,5000);
  assert.match(density.note,/4000.*6000/);
  const freq=inputs.find(x=>x.key==='绿化!U8');
  assert.equal(freq.value,31);assert.equal(freq.defaultValue,30);
  assert.equal(sourceCell('工程管理',4,'B').sourceRef,'工程管理!E4');
});
test('manual payroll flows through both budgets and invalid input is rejected',()=>{
  const a=calc(),b=calc({'客助!P12':7000});
  const diff=category(a,'assistance').headcount*1000*12*1.06;
  close(a.annualCost-b.annualCost,diff);
  for(const extra of [{workbookOverrides:{'zhuj.cleaningAreaPerPerson':0}},{workbookOverrides:{'zhuj.cleaningAreaPerPerson':-1}},{workbookOverrides:{'fake.key':2}},{budgetBasis:'max'},{district:''}]) assert.ok(validateZhujiangProject({...project,...extra}));
});
