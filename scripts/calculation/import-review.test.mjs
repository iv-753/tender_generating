import test from 'node:test';
import assert from 'node:assert/strict';
import { EXAMPLE_PROJECT } from '../../src/exampleProject.ts';
import { unresolvedImportIssues, resolveImportIssue, reviewField } from './import-review.mjs';

const issue = (key, label = key) => ({ key, label, kind: 'conflict', message: '需确认', sources: [] });
const project = () => ({ ...EXAMPLE_PROJECT, district: '增城区', calculationModel: 'zhujiang-v1', workbookOverrides: {} });

test('confirming an area uses current values and changes later reopen the review', () => {
  let p = { ...project(), importReviewIssues: [issue('zhuj.asset.building.stiltFloorArea')] };
  p = resolveImportIssue(p, p.importReviewIssues[0].key, 'value', 1700);
  assert.equal(p.workbookOverrides['zhuj.asset.building.stiltFloorArea'], 1700);
  assert.equal(unresolvedImportIssues(p).length, 0);
  assert.equal(unresolvedImportIssues({ ...p, workbookOverrides: { ...p.workbookOverrides, 'zhuj.asset.building.stiltFloorArea': 100 } }).length, 1);
  assert.equal(unresolvedImportIssues({ ...p, buildings: p.buildings.map(b => ({ ...b, stiltFloorArea: 300 })) }).length, 1);
  assert.equal(reviewField(p.importReviewIssues[0], p).unit, '㎡');
});

test('activity and staffing choices avoid duplicate headcount and persist through JSON', () => {
  let p = { ...project(), importReviewIssues: [issue('服务!P15'), issue('posts.其他固定位置'), issue('posts.服务处前台')] };
  p = resolveImportIssue(p, '服务!P15', 'covered');
  assert.equal(p.workbookOverrides['服务!P15'], 0);
  p = resolveImportIssue(p, 'posts.其他固定位置', 'covered');
  assert.equal(p.workbookOverrides['zhuj.securityAdditionalStaff'], undefined);
  p = resolveImportIssue(p, 'posts.服务处前台', 'extra', 2);
  assert.equal(p.workbookOverrides['zhuj.securityAdditionalStaff'], 2);
  // Updating the aggregate requires reconfirming earlier staffing decisions.
  p = resolveImportIssue(p, 'posts.其他固定位置', 'covered');
  assert.deepEqual(unresolvedImportIssues(JSON.parse(JSON.stringify(p))), []);
});

test('negative and fractional counts cannot be confirmed and missing base fields clear after entry', () => {
  const p = { ...project(), importReviewIssues: [issue('zhuj.asset.building.elevatorCount')] };
  for (const value of [-1, 1.5, NaN]) assert.throws(() => resolveImportIssue(p, 'zhuj.asset.building.elevatorCount', 'value', value));
  assert.equal(unresolvedImportIssues({ ...project(), greenArea: 0, importReviewIssues: [{ ...issue('greenArea'), kind: 'missing' }] }).length, 0);
  assert.equal(unresolvedImportIssues({ ...project(), greenArea: null, importReviewIssues: [{ ...issue('greenArea'), kind: 'missing' }] }).length, 1);
});

test('reviewing base fields preserves their path and changing grade reopens scope decisions', () => {
  let p = { ...project(), importReviewIssues: [issue('buildings[0].stiltFloorArea'), issue('服务!P15')] };
  p = resolveImportIssue(p, 'buildings[0].stiltFloorArea', 'value', 850);
  assert.equal(p.buildings[0].stiltFloorArea, 850);
  assert.equal(p.stiltFloorArea, undefined);
  p = resolveImportIssue(p, '服务!P15', 'covered');
  assert.equal(unresolvedImportIssues(p).length, 0);
  assert.equal(unresolvedImportIssues({ ...p, serviceGrade: p.serviceGrade === 'A' ? 'B' : 'A' }).length, 1);
  assert.throws(() => resolveImportIssue({ ...project(), importReviewIssues: [issue('workbook')] }, 'workbook', 'ignore'));
});
