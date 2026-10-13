import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateZhujiangProject, getZhujiangInputs } from './zhujiang-model.mjs';
import { PARITY_PROJECTS } from './fixtures/parity-projects.mjs';
import { toBuildingTotalProject, toPerFloorProject } from './building-area-basis.mjs';

const project = { ...PARITY_PROJECTS[0], calculationModel: 'zhujiang-v1', region: '广东省', city: '广州市', district: '越秀区', totalBuildingArea: 56423, serviceGrade: 'C',
  buildings: [29, 28].map((floors, i) => ({ ...PARITY_PROJECTS[0].buildings[0], buildingCount: 1, totalFloors: floors, evacuationStairArea: [1200, 1240][i] })) };
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, `${a} != ${b}`);

test('whole-building stairs are counted once and the saved project retains its input basis', () => {
  const p = { ...project, stairAreaBasis: 'per-building' };
  const expected = calculateZhujiangProject({ ...project, buildings: project.buildings.map(b => ({ ...b, evacuationStairArea: b.evacuationStairArea / b.totalFloors })) });
  const actual = calculateZhujiangProject(p);
  close(getZhujiangInputs(p).find(i => i.key === 'zhuj.asset.building.evacuationStairArea').value, 2440);
  close(actual.annualCost, expected.annualCost);
  assert.deepEqual(actual.project, p);
});

test('whole-building stairs multiply by building count, not total floors', () => {
  const p = { ...project, stairAreaBasis: 'per-building', buildings: [{ ...project.buildings[0], buildingCount: 8, totalFloors: 232 }] };
  close(getZhujiangInputs(p).find(i => i.key === 'zhuj.asset.building.evacuationStairArea').value, 9600);
});

test('stair cleaning uses measured totals without adding five fictitious floors to the first two groups', () => {
  const p = { ...project, stairAreaBasis: 'per-building' };
  const result = calculateZhujiangProject(p);
  close(result.actions.find(a => a.id === 'cleaning-38').quantity, 2440);
  close(result.actions.find(a => a.id === 'cleaning-41').quantity, 2440 * 3);
});

test('legacy and imported per-floor values convert once; missing values remain missing', () => {
  const legacy = { ...project, buildings: project.buildings.map(b => ({ ...b, evacuationStairArea: b.evacuationStairArea / b.totalFloors })) };
  const converted = toBuildingTotalProject(legacy);
  close(converted.buildings[0].evacuationStairArea, 1200);
  assert.deepEqual(toBuildingTotalProject(converted), converted);
  close(toPerFloorProject(converted).buildings[0].evacuationStairArea, legacy.buildings[0].evacuationStairArea);
  assert.equal(toBuildingTotalProject({ ...legacy, buildings: [{ ...legacy.buildings[0], evacuationStairArea: null }] }).buildings[0].evacuationStairArea, null);
  assert.throws(() => calculateZhujiangProject({ ...project, stairAreaBasis: 'per-building', buildings: [{ ...project.buildings[0], totalFloors: 0 }] }), /楼层总数/);
});

test('small-project trial explicitly deducts the concurrent engineering chief and respects manual choice', () => {
  const automatic = calculateZhujiangProject(project);
  const separate = calculateZhujiangProject({ ...project, workbookOverrides: { 'zhuj.managerConcurrentRole': 0 } });
  const concurrent = calculateZhujiangProject({ ...project, workbookOverrides: { 'zhuj.managerConcurrentRole': 2 } });
  close(automatic.annualCost, concurrent.annualCost);
  close(separate.management.annualCost - automatic.management.annualCost, 127200);
  assert.ok(automatic.warnings.some(w => w.startsWith('试算假设：') && w.includes('兼工程主任')));
  assert.ok(!separate.warnings.some(w => w.startsWith('试算假设：')));
  assert.equal(getZhujiangInputs({ ...project, totalBuildingArea: 150000 }).find(i => i.key === 'zhuj.managerConcurrentRole').value, 0);
});
