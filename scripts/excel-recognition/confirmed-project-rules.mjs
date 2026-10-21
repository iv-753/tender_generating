import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { toBuildingTotalProject } from '../calculation/building-area-basis.mjs';
import { normalizeReviewValue, resolveImportIssue } from '../calculation/import-review.mjs';
const rules = JSON.parse(readFileSync(new URL('./confirmed-project-rules.json', import.meta.url), 'utf8'));
export function applyConfirmedProjectRule(workbook, result) {
  if (workbook.truncated) return result;
  // Fingerprint source facts, never the filename or a project-name substring.
  // Financial updates do not alter a previously confirmed operating plan.
  const facts = workbook.sheets.filter(s => !/财务报表/.test(s.name)).map(s => [s.name, s.rows.map(r => [r.row,
    [...r.cells].sort((a,b) => a.address.localeCompare(b.address)).map(c => [c.address,c.value])])]);
  const fingerprint = createHash('sha256').update(JSON.stringify(facts)).digest('hex');
  const sourceValue=(sheet,cell)=>workbook.sheets.find(s=>s.name===sheet)?.rows.flatMap(r=>r.cells).find(c=>c.address===cell)?.value??null;
  const same=ref=>normalizeReviewValue(sourceValue(ref.sheet,ref.cell))===normalizeReviewValue(ref.raw);
  const rule = rules.find(r => r.fingerprint === fingerprint || r.identity?.length && r.identity.every(same));
  if (!rule) return result;
  const valid=key=>rule.fingerprint===fingerprint || rule.dependencies?.[key]?.length && rule.dependencies[key].every(id=>{const at=id.lastIndexOf('!');return same({sheet:id.slice(0,at),cell:id.slice(at+1),raw:rule.sourceValues[id]});});
  const basic=Object.fromEntries(Object.entries(rule.basic).filter(([key])=>valid(key)));
  const overrides=Object.fromEntries(Object.entries(rule.overrides).filter(([key])=>valid(key)));
  let project = toBuildingTotalProject({ ...result.project, ...basic, calculationModel:'zhujiang-v1', budgetBasis:'standard',
    workbookOverrides:{...result.project.workbookOverrides,...overrides}, importReviewIssues:result.issues });
  // These two source-bound group-total conventions were verified for this project;
  // never infer them merely because two candidate sums happen to match.
  for(const mapping of rule.buildingGroupTotals??[]) {
    if(!valid(mapping.key)) continue;
    project.buildings=project.buildings.map((building,index)=>({...building,
      [mapping.field]:Number(sourceValue(mapping.sheet,mapping.cells[index]))/building.buildingCount}));
    result.recognition.buildings.forEach(item=>{if(item.fields[mapping.field])item.fields[mapping.field].note='已按该项目确认的楼栋组汇总口径换算为每栋面积，未重复乘楼层或栋数。';});
  }
  for (const item of rule.decisions) {
    if (valid(item.key) && project.importReviewIssues.some(i => i.key === item.key)) project = resolveImportIssue(project,item.key,item.decision,item.value);
  }
  project.confirmedConfiguration = { sourceId:rule.fingerprint, sourceVersion:fingerprint, ruleId:rule.id, staffing:rule.staffing, notes:rule.notes };
  result.project = project;
  result.issues = project.importReviewIssues;
  for (const key of Object.keys(basic)) {
    if (result.recognition.fields[key]) result.recognition.fields[key] = { ...result.recognition.fields[key],status:'derived',note:'采用与源表内容指纹绑定的已确认项目规则；'+rule.notes };
  }
  result.missingFields = result.missingFields.filter(k => project[k] == null);
  result.warnings.push('采用已确认项目规则：'+rule.notes+' 仅复用来源、单位及范围未变化的项目确认；变化事项需重新核对。');
  return result;
}
