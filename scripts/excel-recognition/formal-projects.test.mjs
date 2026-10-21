import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {recognizeExcelLocally} from './recognize-excel.mjs';
import {extractWorkbook} from './extract-workbook.mjs';
import {recognizeComparisonData} from './comparison-import.mjs';
import {applyConfirmedProjectRule} from './confirmed-project-rules.mjs';
import {calculateZhujiangProject} from '../calculation/zhujiang-model.mjs';
import {unresolvedImportIssues} from '../calculation/import-review.mjs';
import {staffingPlanFor} from '../calculation/staffing-plan.mjs';
const directory=process.env.FORMAL_PROJECT_DIRECTORY;
for(const [name,expected,actual,people] of [['麓湖阁',1975383.8931811084,2003161.506666667,22.4],['珠江花城',15679281.767161015,15612681.73333333,214.4]]){
 test(`${name}: source import reproduces confirmed costs without changing other calculations`,{skip:!directory},async()=>{
  const file=`${directory}/${name}项目资料收集表（含财务报表）.xlsx`,bytes=fs.readFileSync(file);
  const r=await recognizeExcelLocally(bytes),w=await extractWorkbook(bytes);
  assert.equal(w.truncated,false);assert.ok(r.project.confirmedConfiguration);assert.deepEqual(unresolvedImportIssues(r.project),[]);
  const d=recognizeComparisonData(w,{fileName:file,recognition:r});const value=calculateZhujiangProject(r.project);
  assert.ok(Math.abs(value.annualCost-expected)<1e-6);assert.equal(value.totalHeadcount,people);
  if(name==='珠江花城') {
   assert.equal(value.staffingPlan?.totalHeadcount,174);
   assert.equal(value.staffingPlan.categories.find(c=>c.category==='cleaning').headcount,58);
   assert.equal(value.staffingPlan.categories.reduce((n,c)=>n+c.headcount,0),174);
   assert.equal(value.categories.find(c=>c.category==='cleaning').headcount,98);
   assert.deepEqual(staffingPlanFor(JSON.parse(JSON.stringify(value))),value.staffingPlan);
   assert.equal(staffingPlanFor({...value,annualCost:value.annualCost+1}),null);
   assert.equal(staffingPlanFor({...value,project:{...value.project,exampleDataVersion:'test'}}),null);
   assert.equal(staffingPlanFor({...value,project:{...value.project,confirmedConfiguration:undefined}}),null);
   assert.equal(staffingPlanFor({...value,project:{...value.project,projectName:'另一个项目'}}),null);
  } else assert.equal(value.staffingPlan,undefined);
  assert.ok(Math.abs(d.financial.cost/d.financial.period.months*12-actual)<1e-6);
  const again=await recognizeExcelLocally(bytes);assert.equal(calculateZhujiangProject(again.project).annualCost,value.annualCost);
  assert.deepEqual(calculateZhujiangProject(again.project).staffingPlan,value.staffingPlan);
  if(name==='麓湖阁'){
   const baseline=calculateZhujiangProject({...r.project,confirmedConfiguration:undefined});
   assert.ok(Math.abs(baseline.annualCost-value.annualCost-144000)<1e-6);
   assert.deepEqual(baseline.actions,value.actions);assert.deepEqual(baseline.management,value.management);
  }
  const modified=structuredClone(w);modified.sheets[0].rows[0].cells[0].value='modified source';
  const unmatched={project:{},issues:[]};assert.equal(applyConfirmedProjectRule(modified,unmatched).project.confirmedConfiguration,undefined);
 });
}
