import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { calculateWorkbookProject, getWorkbookInputs, GUANGDONG_LOCATIONS, validateWorkbookOverrides } from './workbook-model.mjs';
import { createCalculator, validateProject } from './calculator.mjs';
import { PARITY_PROJECTS } from './fixtures/parity-projects.mjs';

const project = {...PARITY_PROJECTS[0],calculationModel:'workbook-v3',region:'广东',city:'广州市',district:'白云区',costBand:'upper',serviceGrade:'B'};
const calculate = (overrides={}, extra={}) => calculateWorkbookProject({...project,...extra,workbookOverrides:overrides});
const action = (result,id) => result.actions.find((item)=>item.id===id);
const category = (result,id) => result.categories.find((item)=>item.category===id);
const close = (actual,expected,label='') => assert.ok(Math.abs(actual-expected)<=1e-7*Math.max(1,Math.abs(expected)),`${label}: ${actual} != ${expected}`);

test('standalone model has 453 actions, 2308 typed input controls and balanced totals',()=>{
  const result=calculate();
  assert.equal(result.version,2); assert.equal(result.calculationModel,'workbook-v3');
  assert.equal(result.actions.length,453); assert.equal(result.standardActionCount,453);
  assert.equal(new Set(result.actions.map((item)=>item.id)).size,453);
  assert.equal(getWorkbookInputs(project).length,2308);
  assert.equal(result.workbookInputs,undefined);
  assert.equal(result.annualCost,result.management.annualCost+result.categories.reduce((total,item)=>total+item.annualCost,0));
  for (const item of result.categories) close(item.workloadAnnualCost,result.actions.filter((a)=>a.category===item.category).reduce((total,a)=>total+a.annualCost,0),item.category);
  assert.equal(validateProject(project),undefined);
  assert.equal(createCalculator()(project).calculationModel,'workbook-v3');
  assert.equal(createCalculator()(PARITY_PROJECTS[0]).standardActionCount,452);
  assert.ok(result.warnings.some((message)=>message.includes('5.2')&&message.includes('7')));
});

test('district prices use the original 26-day rates and 365-day budgets, without a second city factor',()=>{
  const baiyun=calculate({}, {serviceGrade:'A'});
  const conghua=calculate({}, {serviceGrade:'A',district:'从化区'});
  const sanshui=calculate({}, {serviceGrade:'A',city:'佛山市',district:'三水区'});
  close(category(baiyun,'cleaning').annualCost/category(baiyun,'cleaning').headcount,4200/26*365);
  close(category(conghua,'cleaning').annualCost/category(conghua,'cleaning').headcount,4000/26*365);
  close(category(sanshui,'cleaning').annualCost/category(sanshui,'cleaning').headcount,3800/26*365);
  assert.equal(calculate({}, {costBand:'high'}).annualCost,calculate({}, {costBand:'base'}).annualCost);
  assert.equal(GUANGDONG_LOCATIONS.length,30);
  assert.throws(()=>calculate({}, {city:'深圳市'}),/未收录/);
  assert.throws(()=>calculate({}, {district:'不存在区'}),/未收录/);
  assert.throws(()=>calculate({}, {district:''}),/请选择.*区县/);
});

test('management salary and added staff use the source 1.06 budget factor',()=>{
  const baseline=calculate(); const changed=calculate({'管理模块!B4':20000,'管理模块!D4':2});
  assert.equal(changed.management.headcount,baseline.management.headcount+2);
  close(changed.management.annualCost-baseline.management.annualCost,(20000*3-18000)*12*1.06);
  close(changed.annualCost-baseline.annualCost,changed.management.annualCost-baseline.management.annualCost);
});

test('other fixed posts feed relief and leader staffing, and assistance salary really changes the budget',()=>{
  const base=calculate(); const changed=calculate({'客助!C6':3,'客助!N6':2,'客助!P12':9000});
  assert.equal(action(changed,'assistance-6').headcount,6);
  close(action(changed,'assistance-9').quantity,action(base,'assistance-9').quantity+6);
  assert.equal(action(changed,'assistance-9').headcount,Math.ceil(action(changed,'assistance-9').quantity/5.2));
  close(category(changed,'assistance').annualCost,category(changed,'assistance').headcount*9000*12*1.06);
  const patrol=calculate({'客助!N8':50000});
  assert.equal(action(patrol,'assistance-7').headcount,action(base,'assistance-7').headcount);
  assert.ok(action(patrol,'assistance-8').headcount>action(base,'assistance-8').headcount);
});

test('fractional annual frequencies, occurrence coefficients, standard and travel times recalculate costs',()=>{
  const base=calculate();
  const changed=calculate({'清洁!X5':.5,'清洁!E5':100,'清洁!F5':.02,'清洁!I5':.01,'服务!P5.probability1':.75,'服务!F5':1});
  close(action(changed,'cleaning-5').annualHours,100*(.02*.9+.01)*.5);
  assert.equal(action(changed,'cleaning-5').frequency,'0.5次/年');
  close(action(changed,'service-5').annualFrequency,project.occupiedHouseholds*.75);
  close(action(changed,'service-5').unitHours,action(base,'service-5').unitHours+1);
  const green=calculate({'绿化!C5':100,'绿化!D5':.1,'绿化!G5':2,'绿化!U5':.5});
  close(action(green,'greening-5').annualHours,100*(.1*60*.9+2)/60*.5);
  const standard=calculate({'清洁!G5':.1,'清洁!I5':.2});
  close(action(standard,'cleaning-5').unitHours,.3);
});

test('engineering salary edits change cost without changing workload staffing and work cycles permit decimals',()=>{
  const base=calculate(); const changed=calculate({'工程常规!P3':10000,'工程常规!L5':.5,'工程常规!M5':1});
  close(action(changed,'engineering-routine-5').annualFrequency,.5);
  const salaryOnly=calculate({'工程常规!P3':10000});
  assert.equal(category(salaryOnly,'engineeringRoutine').headcount,category(base,'engineeringRoutine').headcount);
  close(category(salaryOnly,'engineeringRoutine').annualCost,category(base,'engineeringRoutine').headcount*10000*12*1.2);
  const input=getWorkbookInputs({...project,workbookOverrides:{'清洁!F5':.1,'清洁!G5':.2}}).find((item)=>item.key==='清洁!G5');
  close(input.defaultValue,.09);
});

test('backend whitelist rejects formula outputs, strings, negatives, non-finite values and zero divisors',()=>{
  for(const overrides of [{'总-汇总表!B7':1},{'清洁!X5':'0.5'},{'清洁!X5':-1},{'清洁!X5':Infinity},{'清洁!X5':NaN},{'客助!N9':0},{'服务!N8':'=HYPERLINK("bad")'}]) {
    assert.ok(validateWorkbookOverrides({...project,workbookOverrides:overrides}));
    assert.throws(()=>calculate(overrides));
  }
  assert.ok(validateWorkbookOverrides({...project,workbookOverrides:null}));
  assert.equal(action(calculate({'清洁!X5':0}),'cleaning-5').annualHours,0);
  assert.equal(action(calculate({'服务!N8':'是'}),'service-8').annualFrequency,project.occupiedHouseholds*12);
});

test('all action hours, costs and category budgets agree with an independently evaluated source for A-D',async(t)=>{
  let bytes;
  try { bytes=await readFile(new URL('../../../动态成本分析模型.xlsx',import.meta.url)); }
  catch { t.skip('Local audited workbook absent; production calculator needs no workbook'); return; }
  const {default:init,Workbook}=await import('formualizer'); await init();
  for(const grade of ['A','B','C','D']) {
    const p={...project,serviceGrade:grade}; const actual=calculate({},p); const wb=Workbook.fromXlsxBytes(new Uint8Array(bytes));
    const summary=wb.sheet('总-汇总表'); summary.setValue(6,2,{A:'紫荆花',B:'金百合',C:'郁金香',D:'向日葵'}[grade]);
    summary.setValues(3,2,[['广东','广州市','白云区']]);
    summary.setValues(19,7,[[p.totalBuildingArea,p.residentialChargeArea,p.deliveredHouseholds,p.receivedHouseholds,p.occupiedHouseholds]]);
    summary.setValues(24,7,[[p.perimeterEntrances,p.gatehouses,p.pavedRoadArea,p.greenArea,p.lawnRatio,p.seasonalFlowerArea,p.winterProtectionArea]]);
    for(let row=12;row<=45;row++) summary.setValue(row,3,null);
    for(let i=0;i<5;i++) {const b=p.buildings[i];summary.setValues(29+i,8,[b?[b.buildingCount,b.lobbyElevatorCount,b.stiltFloorArea,b.totalFloors,b.standardLobbyArea,b.evacuationStairArea,b.rooftopArea]:[0,0,0,0,0,0,0]]);}
    summary.setValues(37,7,[[p.garageFloorArea,p.garageFloors]]);
    wb.evaluateAll();
    close(actual.totalHeadcount,summary.getValue(8,8),`${grade} totalHeadcount excludes part-time pest control`);
    close(actual.annualCost,summary.getValue(7,2),`${grade} annualCost`);
    const mapping={service:['服务',17,19],cleaning:['清洁',25,null],greening:['绿化',22,25],engineeringOutsourced:['工程委外',15,19],engineeringRoutine:['工程常规',15,18],pestControl:['四害消杀',12,14]};
    for(const item of actual.actions) {
      if(item.category==='assistance') {close(item.headcount,wb.sheet('客助').getValue(Number(item.id.split('-').at(-1)),16),item.id);continue;}
      const [sheet,hours,cost]=mapping[item.category]; const row=item.category==='pestControl'?5:Number(item.id.split('-').at(-1));const divisor=item.category==='pestControl'?7:1;
      close(item.annualHours,Number(wb.sheet(sheet).getValue(row,hours))/divisor,`${grade} ${item.id} hours`);
      close(item.annualCost,cost?Number(wb.sheet(sheet).getValue(row,cost))/divisor:Number(wb.sheet(sheet).getValue(row,25))*Number(wb.sheet(sheet).getValue(row,27)),`${grade} ${item.id} cost`);
    }
  }
});
