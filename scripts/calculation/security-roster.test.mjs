import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateZhujiangProject, getZhujiangInputs } from './zhujiang-model.mjs';
import { PARITY_PROJECTS } from './fixtures/parity-projects.mjs';
import { dailyCoverageHours, readSecurityPosts, importedSecurityRoster } from './security-roster.mjs';
import { resultValidationError } from '../../api/_lib/result-validation.mjs';

const issue = (name, row, time, note) => ({ key: `posts.${name}`, kind: 'conflict', sources: [
  { sheet: '3 固定值守点', cell: `B${row}`, raw: 1 },
  { sheet: '3 固定值守点', cell: `E${row}`, raw: time },
  { sheet: '3 固定值守点', cell: `F${row}`, raw: note },
], resolution: { decision: 'covered' } });
const project = { ...PARITY_PROJECTS[0], calculationModel: 'zhujiang-v1', region: '广东省', city: '广州市', district: '越秀区', serviceGrade: 'C', totalBuildingArea: 56423, gatehouses: 2,
  workbookOverrides: { 'zhuj.monitorPosts': 1, 'zhuj.monitorStaff': 1 },
  importReviewIssues: [issue('服务处前台', 10, 'A更：8：00-16：00 B更：16：00-24：00', '南北塔门岗'), issue('其他固定位置', 8, 'A更：8：00-16：00', '巡逻岗，包含在表五10名安保编制内')] };
const calc = overrides => calculateZhujiangProject({ ...project, workbookOverrides: { ...project.workbookOverrides, 'zhuj.securityRosterMode': 1, 'zhuj.securityLeaderConcurrent': 1, ...overrides } });
const security = r => r.categories.find(c => c.category === 'assistance');

test('header-based schedules preserve included relief and keep the manager out of frontline payroll', () => {
  const cells = (row,values)=>({row,cells:values.map((value,i)=>({address:String.fromCharCode(65+i)+row,value}))});
  // Deliberately put time before count and move notes ahead of the shift count.
  const sheet={name:'3 固定值守点',rows:[cells(1,['值守位置','值守时间','有几个点位','备注','每天几班','每班每个点位几人','例休几人','合计人数']),
    ...[['大门',6,1,2,14],['车场出入口',7,1,2,16],['巡逻',3,2,1,13],['中控室',3,2,2,14],['保安带班',3,1,1,7],['保安经理',1,1,0,1]].map(([label,count,people,relief,total],i)=>cells(i+2,[label,label==='保安经理'?'09:00:00-18:00':'24小时',count,'',label==='保安经理'?1:2,people,relief,total])),
    cells(9,['服务处前台','09:00:00-18:00',3,'客服中心',1,5,0,15])]};
  const importedSecurityPosts=readSecurityPosts(sheet);
  const p={...project,projectName:'任意项目',importedSecurityPosts,workbookOverrides:{...project.workbookOverrides,'zhuj.securityRosterMode':2}};
  assert.equal(importedSecurityRoster(p).total,65);
  const result=calculateZhujiangProject(p);
  assert.equal(security(result).headcount,64);
  assert.equal(result.management.roles[3].headcount,1);
  assert.equal(result.actions.find(a=>a.id==='assistance-9').headcount,0);
  assert.equal(result.actions.find(a=>a.id==='assistance-10').headcount,7);
  assert.equal(result.securityRosterMode,'project');
  const malformed=structuredClone(sheet);malformed.rows[1].cells[7].value=99;
  assert.equal(importedSecurityRoster({...p,importedSecurityPosts:readSecurityPosts(malformed)}),null);
});

test('imported covered assignments use daily coverage, preserve relief, and share leaders explicitly', () => {
  const result = calc({});
  assert.equal(security(result).headcount, 10);
  assert.equal(result.actions.find(a => a.id === 'assistance-4').headcount, 4);
  assert.equal(result.actions.find(a => a.id === 'assistance-7').headcount, 3);
  assert.equal(result.actions.find(a => a.id === 'assistance-8').headcount, 1);
  assert.equal(result.actions.find(a => a.id === 'assistance-9').headcount, 2);
  assert.equal(result.actions.find(a => a.id === 'assistance-10').headcount, 0);
  assert.ok(result.warnings.some(w => w.startsWith('试算假设：') && w.includes('两处')));
  assert.ok(result.warnings.some(w => w.startsWith('试算假设：') && w.includes('班长')));
  assert.equal(calc({ 'zhuj.securityRosterMode': 0 }).categories.find(c => c.category === 'assistance').headcount, 18);
});

test('roster remains editable, independent leaders and net extra staff are not discounted', () => {
  assert.equal(security(calc({ 'zhuj.projectGatePosts': 1 })).headcount, 8);
  assert.equal(security(calc({ 'zhuj.securityLeaderConcurrent': 0 })).headcount, 13);
  assert.equal(security(calc({ 'zhuj.securityAdditionalStaff': 2 })).headcount, 12);
  assert.equal(security(calc({ 'zhuj.projectGateDailyHours': 24 })).headcount, 12);
});

test('missing or ambiguous schedules keep reference staffing instead of treating gaps as zero', () => {
  const ambiguous = { ...project, importReviewIssues: project.importReviewIssues.map(i => ({ ...i, sources: i.sources.map(s => s.cell.startsWith('E') ? { ...s, raw: '轮班，待定' } : s) })) };
  assert.equal(getZhujiangInputs(ambiguous).find(i => i.key === 'zhuj.securityRosterMode').value, 0);
  const incomplete = calculateZhujiangProject({ ...ambiguous, workbookOverrides: { ...project.workbookOverrides, 'zhuj.securityRosterMode': 1 } });
  assert.equal(security(incomplete).headcount, 18);
  assert.ok(incomplete.missingInputs.some(i => i.key === 'zhuj.projectGateDailyHours'));
});

test('engineering vendor equivalents are excluded from onsite staffing without removing vendor cost', () => {
  const r = calc({});
  assert.equal(r.staffingScope, 'onsite');
  const onsite = r.categories.filter(c => !['pestControl', 'engineeringOutsourced'].includes(c.category));
  assert.equal(r.totalHeadcount, onsite.reduce((s, c) => s + c.headcount, 0) + r.management.headcount);
  assert.equal(r.annualCost, r.categories.reduce((s, c) => s + c.annualCost, 0) + r.management.annualCost);
  assert.equal(resultValidationError(r), undefined);
  assert.match(resultValidationError({ ...r, totalHeadcount: r.totalHeadcount + 1 }), /人数/);
});

test('generic manual schedules work without this workbook, project name or imported notes', () => {
  const generic = { ...project, projectName: '另一项目', totalBuildingArea: 300000, importReviewIssues: [], workbookOverrides: {
    'zhuj.monitorPosts': 1, 'zhuj.monitorStaff': 1, 'zhuj.securityRosterMode': 1, 'zhuj.securityLeaderConcurrent': 1,
    'zhuj.projectGatePosts': 3, 'zhuj.projectGateDailyHours': 12, 'zhuj.projectGatePeople': 2, 'zhuj.projectPatrolDailyHours': 16,
  } };
  // 9 gate + 3 control + 2 patrol + 3 relief, with leaders inside these posts.
  assert.equal(security(calculateZhujiangProject(generic)).headcount, 17);
  const defaults = getZhujiangInputs({ ...generic, workbookOverrides: {} });
  assert.equal(defaults.find(i => i.key === 'zhuj.securityRosterMode').value, 0);
  assert.equal(defaults.find(i => i.key === 'zhuj.securityLeaderConcurrent').value, 0);
});

test('clock ranges handle overnight shifts and reject ambiguous or overlapping coverage', () => {
  assert.equal(dailyCoverageHours('8：00-16：00 16:00-24:00'), 16);
  assert.equal(dailyCoverageHours('20:00-8:00'), 12);
  assert.equal(dailyCoverageHours('8:00-20:00 20:00-8:00'), 24);
  assert.equal(dailyCoverageHours('8:00-16:00 15:00-20:00'), null);
  assert.equal(dailyCoverageHours('25:00-26:00'), null);
  assert.equal(dailyCoverageHours('轮班，待定'), null);
  assert.equal(dailyCoverageHours('8:00-16:00，晚班另定'), null);
});
