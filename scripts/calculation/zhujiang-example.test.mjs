import test from 'node:test';
import assert from 'node:assert/strict';
import { createZhujiangExampleProject, EXAMPLE_PROJECT, updateExampleGradePlans } from '../../src/exampleProject.ts';
import { calculateZhujiangProject, getZhujiangInputs } from './zhujiang-model.mjs';

test('loading the example supplies equipment and a complete project scenario for every Zhujiang grade',()=>{
  const example=createZhujiangExampleProject();
  assert.equal(getZhujiangInputs(example).find(x=>x.key==='zhuj.asset.building.elevatorCount').value,28);
  for(const serviceGrade of ['A','B','C','D']) {
    const r=calculateZhujiangProject(createZhujiangExampleProject(serviceGrade));
    assert.deepEqual(r.missingInputs.map(x=>x.key),[],serviceGrade);
    assert.equal(r.standard.pendingActionCount,0);
    assert.ok(r.activeActionCount>150);
    assert.ok(Number.isFinite(r.unitPrice)&&r.unitPrice>0);
  }
});

test('sample facts do not become calculation defaults or alter Zhujiang grade ratios',()=>{
  const real={...EXAMPLE_PROJECT,calculationModel:'zhujiang-v1',district:'增城区'};
  assert.equal(getZhujiangInputs(real).find(x=>x.key==='zhuj.asset.building.elevatorCount').value,null);
  const example=createZhujiangExampleProject();
  assert.equal(example.workbookOverrides?.['zhuj.cleaningAreaPerPerson'],undefined);
  example.workbookOverrides['zhuj.asset.building.elevatorCount']=6;
  const calculated=calculateZhujiangProject(example);
  assert.equal(calculated.actions.find(x=>x.id==='zhuj-lift-clean').quantity,6);
  assert.equal(getZhujiangInputs(createZhujiangExampleProject()).find(x=>x.key==='zhuj.asset.building.elevatorCount').value,28);
});

test('switching sample grades preserves fixed Zhujiang frequencies and user edits',()=>{
  let project=createZhujiangExampleProject('C');
  for(const grade of ['A','B','D','C']) {
    const overrides=updateExampleGradePlans(project.workbookOverrides,project.serviceGrade,grade);
    project={...project,serviceGrade:grade,workbookOverrides:overrides};
    assert.deepEqual(calculateZhujiangProject(project).missingInputs,[]);
    if(['A','B'].includes(grade)) assert.equal(overrides['zhuj.task.floor-trash.frequency'],undefined);
    if(['B','D'].includes(grade)) assert.equal(overrides['zhuj.task.fans-maintenance.frequency'],undefined);
    if(['C','D'].includes(grade)) assert.equal(overrides['zhuj.task.customer-visit.frequency'],undefined);
  }
  const edited={...project.workbookOverrides,'zhuj.task.floor-trash.frequency':500,'zhuj.asset.building.elevatorCount':6};
  const switched=updateExampleGradePlans(edited,'C','A');
  assert.equal(switched['zhuj.task.floor-trash.frequency'],500);
  assert.equal(switched['zhuj.asset.building.elevatorCount'],6);
});
