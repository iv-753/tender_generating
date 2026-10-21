// Separate staffing proposal. Never an input to the cost calculation.
export const FLOWER_SOURCE_ID = '8108240a9303573d92b9c3c8d8a9f380e854e9efe0168f9eb09eaa07cbb746e7';
export const FLOWER_RULE_ID = 'confirmed-project-2-20261021';
const BASELINE = 'bbd49f86ae7a5d14';
const stable = value => JSON.stringify(value, (_, item) => item && typeof item === 'object' && !Array.isArray(item)
  ? Object.fromEntries(Object.keys(item).sort().map(key => [key,item[key]])) : item);
export function staffingBaseline(result) {
  const text = stable({model:result.calculationModel,version:result.version,standard:result.standard,
    identity:[result.project.projectName,result.project.region,result.project.city,result.project.district,result.project.residentialChargeArea],
    categories:result.categories,actions:result.actions,management:result.management,
    annualCost:result.annualCost,totalHeadcount:result.totalHeadcount,budgetBasis:result.budgetBasis});
  let a=2166136261,b=5381;
  for(let i=0;i<text.length;i++){a=Math.imul(a^text.charCodeAt(i),16777619);b=Math.imul(b,33)^text.charCodeAt(i);}
  return (a>>>0).toString(16).padStart(8,'0')+(b>>>0).toString(16).padStart(8,'0');
}
export function staffingPlanFor(result) {
  const identity=result.project.confirmedConfiguration;
  if(result.project.exampleDataVersion || identity?.sourceId!==FLOWER_SOURCE_ID || identity?.ruleId!==FLOWER_RULE_ID || staffingBaseline(result)!==BASELINE) return null;
  const categories=result.categories.filter(c=>!['engineeringOutsourced','pestControl'].includes(c.category))
    .map(c=>({category:c.category,title:c.title,headcount:c.category==='cleaning'?58:c.headcount}));
  const roles=(result.management?.roles??[]).filter(r=>Number.isInteger(r.headcount)&&!r.title.includes('共享'));
  const management=roles.reduce((sum,r)=>sum+r.headcount,0);
  return {id:'flower-staffing-20261021',sourceId:FLOWER_SOURCE_ID,baseline:BASELINE,
    categories:[...categories,{category:'management',title:'管理人员',headcount:management}],
    totalHeadcount:categories.reduce((sum,c)=>sum+c.headcount,management)};
}
