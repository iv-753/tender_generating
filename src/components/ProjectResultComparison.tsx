import { projectActualEvidence, projectActionInventory } from '../data/projectActualEvidence';
import { Collapse, Table, Tabs } from 'antd';
import type { ReactNode } from 'react';
import { calculateRevenueScenario, emptyRevenueScenario } from '../../scripts/calculation/revenue-scenario.mjs';
import { gradeLabel, staffingPresentation } from '../calculation';
import type { CalculationResult } from '../types';
import standards from '../data/huacheng-review-standards.json';

export const ZHUJIANG_GRADES = { A: '御服务', B: '雅服务', C: '悦服务', D: '善服务' };
const format = (value: number | null, digits = 2) => value === null || !Number.isFinite(value) ? '待补充' : value.toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export function ProjectResultComparison({ result, importControl }: { result: CalculationResult; importControl?: ReactNode }) {
  const scenario = { ...emptyRevenueScenario(), ...result.project.revenueScenario };
  const prediction = calculateRevenueScenario(result.annualCost, result.project.residentialChargeArea, scenario, { allowMissingIncome: true });
  const staffing = staffingPresentation(result);
  const evidence = projectActualEvidence(result.project);
  const inventory = projectActionInventory(result);
  const rows = [
    { key: 'price', label: '住宅单价', unit: '元/㎡·月', actual: evidence.rate, model: prediction.breakEvenRate, comparable: evidence.rateComparable, digits: 2, actualNote: '', modelNote: '', reason: evidence.rateReason },
    { key: 'people', label: '配置人员', unit: '人', actual: evidence.people, model: staffing.headcount, comparable: evidence.peopleComparable && result.staffingScope === 'onsite', digits: 0, actualNote: evidence.peopleLabel, modelNote: result.staffingScope === 'onsite' ? '模型驻场配置' : '模型配置／折算用工', reason: evidence.peopleReason },
    { key: 'items', label: '服务动作数量', unit: '条', actual: inventory.count, model: inventory.count, comparable: inventory.count !== null, digits: 0, actualNote: '', modelNote: '', reason: '两列共用本项目服务动作清单，数量一致，不代表实际执行情况已核验。' },
    { key: 'cost', label: '成本', unit: '万元', actual: evidence.cost === null ? null : evidence.cost / 10000, model: prediction.totalCost === null ? null : prediction.totalCost / 10000, comparable: evidence.costComparable, digits: 2, actualNote: evidence.costLabel, modelNote: '标准测算 · 12个月服务成本及补充费用', reason: evidence.finance },
  ];
  const comparable = (row: typeof rows[number]) => row.comparable && row.actual !== null && row.model !== null;
  const cell = (row: typeof rows[number], kind: 'actual' | 'model') => {
    const value = row[kind];
    const max = Math.max(row.actual ?? 0, row.model ?? 0);
    return <div className={'result-comparison-value'+(value===null?' is-missing':'')} title={value===null?'资料未提供':row.key==='cost'?((value*10000).toLocaleString('zh-CN',{maximumFractionDigits:2})+' 元'):undefined}><span>{format(value,row.digits)}</span>{comparable(row) && max>0 && <span className="result-value-track" aria-hidden="true"><i className={kind} style={{width:Math.max(0,value!)/max*100+'%'}} /></span>}</div>;
  };
  return <section className="hc-comparison" aria-labelledby="hc-comparison-title">
    <div className="hc-section-heading"><h2 id="hc-comparison-title">实际与标准测算对比</h2><span className="hc-legend"><i />项目实际<b />标准测算</span></div>
    {importControl}
    <Table rowKey="key" pagination={false} size="middle" dataSource={rows} scroll={{x:650}} columns={[
      {title:'指标',key:'label',width:'22%',render:(_,row)=><><strong>{row.label}</strong><small className="hc-unit">{row.unit}</small></>},
      {title:'项目实际',key:'actual',width:'27%',align:'right',render:(_,row)=><>{cell(row,'actual')}{row.actual!==null && row.actualNote && <small className="hc-unit" style={{display:'block'}}>{row.actualNote}</small>}</>},
      {title:'标准测算',key:'model',width:'27%',align:'right',render:(_,row)=><>{cell(row,'model')}{row.model!==null && row.modelNote && <small className="hc-unit" style={{display:'block'}}>{row.modelNote}</small>}</>},
      {title:'差值',key:'delta',align:'right',render:(_,row)=>{const delta=comparable(row)?row.model!-row.actual!:null;return <span className={delta===null?'is-missing':''} title={row.reason}>{delta!==null&&delta>0?'+':''}{delta===null && row.actual!==null && row.model!==null ? '口径待核' : format(delta,row.digits)}</span>;}},
    ]}/>
    <div className="comparison-footnote">差值＝测算－实际；范围、期间或数据性质不同则显示“口径待核”。两列共用本项目服务动作清单，数量一致，不代表实际执行情况已核验。</div>
    <Collapse ghost items={[{key:'sources',label:'数据来源与口径',children:<div className="hc-source-notes">
      <p>期间：{evidence.period}。{evidence.source}</p><p>{evidence.finance}</p>{evidence.annualized && <p>年化估算：原金额 {evidence.originalCost?.toLocaleString('zh-CN',{maximumFractionDigits:2})} 元 ÷ {evidence.annualizationMonths} 个月 × 12 = {evidence.cost?.toLocaleString('zh-CN',{maximumFractionDigits:2})} 元。保留原统计期间，不作为全年已发生实际成本。</p>}
      <p>住宅单价：实际为现行收费，测算为抵扣已知其他收入后的保本价。只有已核对相同项目、面积和期间的数据才展示差值与对比条。</p>
      <p>人员：{result.staffingScope==='onsite'?'模型为驻场人数，不含共享会计及工程外包折算用工。':'模型人数范围尚需与驻场口径对齐。'}{staffing.sharedText}实际在岗时点未核实时不计算差值。</p>
      <p>服务动作：{inventory.source}。{inventory.details}</p>
      <p>成本：模型为12个月已计服务费用及补充费用。不足12个月且期间明确时，按已填金额÷月份数×12换算为全年参考值，标注“年化估算”并保留原金额，不作为全年已发生实际；费用范围或性质待核时不计算差值。</p><p>{evidence.data?.personnel && <>自有人员 {evidence.data.personnel.own.value ?? '待补充'} 人，外包人员 {evidence.data.personnel.outsourced.value ?? '待补充'} 人。{evidence.peopleReason}</>}</p>{evidence.data?.cost && <details><summary>查看费用原值与来源</summary><p>{evidence.data.cost.own.method}；{evidence.data.cost.outsourced.method}</p>{[...evidence.data.cost.own.sources,...evidence.data.cost.outsourced.sources].map((source,i)=><p key={i}>{source.fileName} · {source.sheet}!{source.cell}：{String(source.raw ?? '待补充')} {i<evidence.data!.cost!.own.sources.length?evidence.data!.cost!.own.rawUnit:evidence.data!.cost!.outsourced.rawUnit}</p>)}</details>}
    </div>}]} />
  </section>;
}

export function ProjectResultBasis({result,children,personnel}:{result:CalculationResult;children:ReactNode;personnel?:ReactNode}) {
  const zhujiang=result.calculationModel==='zhujiang-v1';
  return <details className="pricing-basis"><summary>查看详细依据<span>服务标准、人员与成本、服务明细</span></summary><div className="pricing-basis-content"><Tabs defaultActiveKey="standards" items={[
    {key:'standards',label:'服务标准',children:<>
      <p className="hc-muted">当前档位：{gradeLabel(result.project.serviceGrade,result.calculationModel)}。{zhujiang?'标准调整建议暂未纳入本次测算。':'使用当前项目模型的服务标准，具体要求见服务明细。'}</p>
      {zhujiang && <Table rowKey="id" size="middle" dataSource={standards} pagination={{pageSize:8,showSizeChanger:false}} scroll={{x:1050}} columns={[
        {title:'类别',dataIndex:'category',width:110,filters:[...new Set(standards.map(row=>row.category))].map(value=>({text:value,value})),onFilter:(value,row)=>row.category===value},
        {title:'服务项目',dataIndex:'item',width:160},
        ...(['D','C','B','A'] as const).map(grade=>({title:ZHUJIANG_GRADES[grade],dataIndex:grade,width:200})),
      ]}/>}
    </>},
    {key:'personnel',label:'人员与成本',children:<>
      <p className="hc-muted">{result.staffingScope==='onsite'?'驻场配置':'模型配置'} {staffingPresentation(result).headcount} 人。分类人数含相应折算用工，不直接加总作为驻场人数。{staffingPresentation(result).sharedText}</p>
      <Table rowKey="category" pagination={false} dataSource={result.categories} columns={[
        {title:'成本分类',dataIndex:'title'},
        {title:'配置人数／折算用工',dataIndex:'headcount',align:'right',render:value=>format(value)},
        {title:'模型年度成本（元）',dataIndex:'annualCost',align:'right',render:value=>format(value)},
      ]}/>{personnel}
    </>},
    {key:'services',label:'服务明细',children},
  ]}/></div></details>;
}
