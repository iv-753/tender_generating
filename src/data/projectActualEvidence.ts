import type { CalculationResult, ProjectData } from '../types';

const known = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
export function projectActualEvidence(project: ProjectData) {
  const data = project.exampleDataVersion ? undefined : project.comparisonData;
  const income = project.revenueScenario;
  const rate = !project.exampleDataVersion && known(income?.currentResidentialRate) ? income.currentResidentialRate : data?.rate?.value ?? null;
  const sourceArea = data?.rate?.area ?? income?.sourceResidentialArea;
  const areaMatches = known(sourceArea) && Math.abs(sourceArea - project.residentialChargeArea) <= 0.01;
  const rateComparable = rate !== null && project.residentialChargeArea > 0 && areaMatches && !!data?.rate?.period.year;
  const people = data?.personnel?.total ?? null;
  const sources = data?.personnel?.sources ?? [];
  const source = data ? [data.fileName, ...new Set(sources.map(s=>s.sheet+'!'+s.cell))].join(' · ')
    : project.exampleDataVersion ? '示例输入不作为真实项目数据。'
    : '历史记录未保存人数及费用来源，请重新导入项目资料；未从旧记录恢复实际数据。';
  const cost = data?.cost;
  const months = cost?.period.months;
  const annualized = !!cost && cost.amount !== null && typeof months === 'number' && months > 0 && months < 12;
  const annualCost = cost?.amount == null ? null : annualized ? cost.amount / months! * 12 : cost.amount;
  const costKind = cost?.kind === 'actual' ? cost.period.annual ? '全年实际' : '截至'+(cost.period.endMonth??'待核')+'月实际'
    : cost?.kind === 'budget' ? cost.period.annual ? '全年预算' : '期间预算' : '项目填报';
  return {
    rate, rateComparable, rateReason: rate===null?'未提供住宅收费':!areaMatches?'收费面积范围待核':!data?.rate?.period.year?'收费期间待核':'同项目、同收费面积的住宅收费与保本价对比',
    people, peopleComparable: !!data?.personnel?.scopeVerified && !!data?.personnel?.periodVerified,
    peopleLabel: data?.personnel ? [data.personnel.kind,data.personnel.period.label,(!data.personnel.own.complete||!data.personnel.outsourced.complete)?'已填合计':''].filter(Boolean).join(' · ') : '',
    peopleReason: data?.personnel ? [data.personnel.scope,...data.personnel.notes].join('；') : '人数未提供',
    period: data?.period.label ?? '待补充', source,
    finance: cost ? [costKind,cost.period.label,cost.scope,...cost.notes].join('；') : '费用及其来源未保存，请重新导入；不以预测或预算替代实际。',
    cost: annualCost, costKind, costLabel: cost ? annualized ? `${costKind} · 按${months}个月年化估算（原金额${((cost.amount ?? 0)/10000).toFixed(2)}万元）` : costKind+' · '+cost.period.label : '',
    annualized, originalCost: cost?.amount ?? null, annualizationMonths: annualized ? months : null,
    costComparable: cost?.kind==='actual' && (cost.period.annual && cost.periodVerified || annualized) && cost.scopeVerified,
    data,
  };
}

export function projectActionInventory(result: CalculationResult) {
  // The contract-frequency worksheet supplements the full applicable model list.
  // Confirmed project rules use that full list, including pending/covered actions.
  const imported=result.project.confirmedConfiguration ? null : result.project.comparisonData?.actions;
  if(imported?.confirmed && imported.items.some(item=>item.mappingKeys.length)) {
    const used=imported.items.filter(item=>item.mappingKeys.length && item.applicable);
    const unique=[...new Map(used.map(item=>[item.label.replace(/\s/g,''),item])).values()];
    return {count:unique.length,source:'上传后确认并用于本次测算的服务动作清单',details:unique.map(item=>item.source.fileName+' · '+item.source.sheet+'!'+item.source.cell).join('；')};
  }
  const actions=result.actions?.filter(item=>item.action?.trim() && item.standardStatus!=='excluded'
    && (item.enabled!==false || item.standardStatus==='pending' || item.standardStatus==='covered')
    && item.quantity!==0 && !/^(标题|小计|合计|总计)$/.test(item.action.trim()));
  if(!actions?.length)return {count:null,source:'未提供可用项目服务动作清单',details:''};
  const unique=new Map(actions.map(item=>[item.id||item.category+'|'+item.action,item]));
  return {count:unique.size,source:'当前项目所选档位下适用的测算动作清单（含待补工时、单价及合同覆盖动作）',details:'按动作标识去重，排除明确不适用项，不按年度执行次数计数。'};
}
