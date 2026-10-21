import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { toBuildingTotalProject } from '../calculation/building-area-basis.mjs';
import { resolveImportIssue } from '../calculation/import-review.mjs';
const rules = JSON.parse(readFileSync(new URL('./confirmed-project-rules.json', import.meta.url), 'utf8'));
export function applyConfirmedProjectRule(workbook, result) {
  if (workbook.truncated) return result;
  // Fingerprint source facts, never the filename or a project-name substring.
  // Financial updates do not alter a previously confirmed operating plan.
  const facts = workbook.sheets.filter(s => !/财务报表/.test(s.name)).map(s => [s.name, s.rows.map(r => [r.row,
    [...r.cells].sort((a,b) => a.address.localeCompare(b.address)).map(c => [c.address,c.value])])]);
  const fingerprint = createHash('sha256').update(JSON.stringify(facts)).digest('hex');
  const rule = rules.find(r => r.fingerprint === fingerprint);
  if (!rule) return result;
  let project = toBuildingTotalProject({ ...result.project, ...rule.basic, calculationModel:'zhujiang-v1', budgetBasis:'standard',
    workbookOverrides:{...result.project.workbookOverrides,...rule.overrides}, importReviewIssues:result.issues });
  for (const item of rule.decisions) {
    if (project.importReviewIssues.some(i => i.key === item.key)) project = resolveImportIssue(project,item.key,item.decision,item.value);
  }
  project.confirmedConfiguration = { sourceId:fingerprint, ruleId:rule.id, staffing:rule.staffing, notes:rule.notes };
  result.project = project;
  result.issues = project.importReviewIssues;
  for (const key of Object.keys(rule.basic)) {
    if (result.recognition.fields[key]) result.recognition.fields[key] = { ...result.recognition.fields[key],status:'derived',note:'采用与源表内容指纹绑定的已确认项目规则；'+rule.notes };
  }
  result.missingFields = result.missingFields.filter(k => project[k] == null);
  result.warnings.push('采用已确认项目规则：'+rule.notes+' 如源表内容改变，将重新核对，不自动套用旧规则。');
  return result;
}
