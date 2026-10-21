import { describe, expect, it } from 'vitest';
import { EXAMPLE_PROJECT, createZhujiangExampleProject } from '../exampleProject';
import { projectActualEvidence, projectActionInventory } from './projectActualEvidence';
import type { ProjectComparisonData, CalculationResult } from '../types';
const period={label:'2026年1月至9月',year:2026,startMonth:1,endMonth:9,endYear:2026,months:9,annual:false};
const aggregate={value:null,complete:false,sources:[],rawUnit:'元',method:'',missing:[]};
const data:ProjectComparisonData={version:1,fileName:'测试.xlsx',importedAt:'',period,warnings:[],personnel:null,actions:null,rate:null,cost:{amount:1374751.51,currency:'元',own:aggregate,outsourced:aggregate,kind:'reported',scope:'人员费用',scopeVerified:false,periodVerified:false,period,notes:[],sources:[]}};
describe('current project comparison evidence',()=>{
 it('annualizes nine months without changing original source or claiming actual',()=>{
 const e=projectActualEvidence({...EXAMPLE_PROJECT,comparisonData:data});expect(e.cost).toBeCloseTo(1833002.013333);expect(e.originalCost).toBe(1374751.51);expect(e.costLabel).toContain('按9个月年化估算');expect(e.costKind).toBe('项目填报');expect(e.costComparable).toBe(false);expect(data.cost?.amount).toBe(1374751.51);
 });
 it('does not annualize a full year or unknown period',()=>{for(const months of [12,null]){const d={...data,cost:{...data.cost!,period:{...period,months}}};expect(projectActualEvidence({...EXAMPLE_PROJECT,comparisonData:d}).cost).toBe(1374751.51);}});
 it('keeps missing values and explicit zero separate',()=>{for(const amount of [null,0])expect(projectActualEvidence({...EXAMPLE_PROJECT,comparisonData:{...data,cost:{...data.cost!,amount}}}).cost).toBe(amount);});
 it('does not infer actuals from project names or examples',()=>{
 const e=projectActualEvidence({...EXAMPLE_PROJECT,projectName:'珠江花城'});expect(e.people).toBeNull();expect(e.cost).toBeNull();expect(e.source).toContain('重新导入');expect(projectActualEvidence({...createZhujiangExampleProject(),comparisonData:data}).cost).toBeNull();
 });
 it('requires scope verification for annualized actual comparison',()=>{const p={...EXAMPLE_PROJECT,comparisonData:{...data,cost:{...data.cost!,kind:'actual' as const}}};expect(projectActualEvidence(p).costComparable).toBe(false);p.comparisonData.cost.scopeVerified=true;expect(projectActualEvidence(p).costComparable).toBe(true);});
 it('counts applicable actions even when labor or prices are missing, and deduplicates',()=>{
 const r={project:EXAMPLE_PROJECT,actions:[{id:'a',action:'清扫',standardStatus:'pending',enabled:false},{id:'a',action:'清扫',standardStatus:'pending',enabled:false},{id:'b',action:'绿化',standardStatus:'excluded'}]} as unknown as CalculationResult;
 expect(projectActionInventory(r).count).toBe(1);expect(projectActionInventory({...r,actions:[]}).count).toBeNull();
 });
});
