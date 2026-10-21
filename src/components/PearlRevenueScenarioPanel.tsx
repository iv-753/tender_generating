import { useState, type ReactNode } from 'react';
import { UploadOutlined } from '@ant-design/icons';
import { recognizeExcelFile } from '../excelRecognition';
import { Alert, Button, Collapse, InputNumber, Modal, Space, Tooltip, Upload, message } from 'antd';
import { InfoCircleOutlined, SlidersOutlined } from '@ant-design/icons';
import { calculateRevenueScenario, emptyRevenueScenario, REVENUE_FIELDS } from '../../scripts/calculation/revenue-scenario.mjs';
import type { CalculationResult, RevenueScenario } from '../types';
import './pearl-pricing-results.css';
const money = (n: number | null) => n === null ? '待补充' : new Intl.NumberFormat('zh-CN',{maximumFractionDigits:2}).format(n);
function Metric({value,unit,testId}:{value:number|null;unit:string;testId?:string}) { const known=value!==null && Number.isFinite(value); return <div className={'pricing-number'+(known?'':' is-missing')} data-testid={testId}><strong>{known?value.toFixed(2):'—'}</strong><small>{known?unit:'未填写'}</small></div>; }
const wan = (n: number | null) => n === null ? '待补充' : (n / 10000).toFixed(2);
type Props = { children?: ReactNode; result: CalculationResult; disabled?: boolean; onChange: (s: RevenueScenario) => void };
export default function PearlRevenueScenarioPanel({result,disabled,onChange,children}:Props) {
 const s={...emptyRevenueScenario(),...result.project.revenueScenario};
 const c=calculateRevenueScenario(result.annualCost,result.project.residentialChargeArea,s,{allowMissingIncome:true});
 const provisional=result.standard?.complete === false || !!result.missingInputs?.length || result.actions.some(a=>a.standardStatus==='pending') || c.missingIncome.length>0;
  const [uploading, setUploading] = useState(false);
  const [candidate, setCandidate] = useState<RevenueScenario | null>(null);
  const [fileName, setFileName] = useState('');
  const pending = result.actions.filter(a => a.standardStatus === 'pending').length;
  const update = (key: keyof RevenueScenario, value: number | null) => onChange({ ...s, [key]: value,
    sources: { ...s.sources, [key]: s.sources[key]?.startsWith('手动调整') ? s.sources[key] : `手动调整${s.sources[key] ? `；原来源：${s.sources[key]}` : ''}` } });
  const importFile = async (file: File) => {
    setUploading(true);
    try {
      const recognized = await recognizeExcelFile(file);
      if (!recognized.project.revenueScenario) throw new Error('没有识别到表6“项目收入”，请手动填写年度收入。');
      setCandidate(recognized.project.revenueScenario); setFileName(file.name);
    } catch (e) { message.error(e instanceof Error ? e.message : '收入读取失败'); }
    finally { setUploading(false); }
    return false;
  };
  const applyIncome = () => {
    if (!candidate) return;
    onChange({ ...candidate, otherAnnual: s.otherAnnual, targetMargin: s.targetMargin,
      collectionRate: s.collectionRate, additionalAnnualCost: s.additionalAnnualCost });
    setCandidate(null); message.success('收入已保存，收费试算已更新');
  };
  const sourceAreaMismatch = s.sourceResidentialArea !== undefined && Math.abs(s.sourceResidentialArea - result.project.residentialChargeArea) > 0.01;

 const fields: Array<['commercialAnnual'|'parkingAnnual'|'valueAddedAnnual'|'nonContractAnnual'|'otherAnnual'|'additionalAnnualCost'|'collectionRate', string, string]> = [...REVENUE_FIELDS.map(([key,label]) => [key,label,'元/年'] as ['commercialAnnual'|'parkingAnnual'|'valueAddedAnnual'|'nonContractAnnual'|'otherAnnual',string,string]), ['additionalAnnualCost','补充年度费用','元/年'],['collectionRate','住宅收缴率','%']];
 const profit=c.currentAnnualProfit;
 const deficit=profit!==null&&profit<0;

 return <div className="pricing-results" id="revenue-scenario">
  <section className="pricing-summary pricing-surface" aria-labelledby="pricing-title">
   <div className="pricing-title-row"><h2 id="pricing-title">经营测算结果</h2></div>
   <div className="pricing-metrics">
    <div><span>现行住宅收费</span><Metric value={s.currentResidentialRate} unit="元/㎡·月" /></div>
    <div><span>测算保本单价{provisional && <small className="pricing-estimate">暂估</small>}</span><Metric value={c.breakEvenRate} unit="元/㎡·月" testId="break-even" /></div>
    <div className={deficit ? 'pricing-deficit' : 'pricing-surplus'}><span>预计年度结余／缺口</span><Metric value={profit === null ? null : Math.abs(profit)/10000} unit="万元" testId="current-profit" /></div>
   </div>
   <div className="pricing-status-line"><span>按现行收费及已录入收支估算{provisional ? ' · 资料待补' : ''}</span>{c.breakEvenRate !== null && s.currentResidentialRate !== null && <span className="pricing-unit-gap">单价差额 <b>{c.breakEvenRate-s.currentResidentialRate>0?'+':''}{(c.breakEvenRate-s.currentResidentialRate).toFixed(2)}</b> 元/㎡·月</span>}</div>
   {c.errors.length>0 && <Alert type="error" showIcon title="资料无效，暂不显示测算结果" description={c.errors.join('；')}/>}
  </section>
  <section className="pricing-quote pricing-surface" aria-labelledby="quote-title">
   <div className="pricing-quote-heading"><h2 id="quote-title">调价与报价参考</h2></div>
   <div className="pricing-quote-body"><div><label htmlFor="revenue-margin">目标利润率 <Tooltip title="利润 ÷ 总收入"><InfoCircleOutlined tabIndex={0} aria-label="目标利润率计算口径" /></Tooltip></label><Space><InputNumber id="revenue-margin" aria-label="目标利润率" min={0} max={99} precision={1} value={s.targetMargin} disabled={disabled} onChange={v=>update('targetMargin',v)}/><span>%</span></Space></div><div><div className="pricing-quote-value"><span>目标参考单价</span><Metric value={c.chargeRate} unit="元/㎡·月" testId="target-charge" /></div></div></div>
  </section>
  <Collapse className="pricing-conditions" expandIconPlacement="end" items={[{key:'conditions',label:<div className="pricing-disclosure-label"><SlidersOutlined/><strong>调整测算条件</strong><span>{[s.commercialAnnual !== null ? `商业收入${wan(s.commercialAnnual)}万元/年` : null, s.parkingAnnual !== null ? `停车收入${wan(s.parkingAnnual)}万元/年` : null, c.missingIncome.length ? '收入资料待补' : null, s.collectionRate !== null ? `收缴率${money(s.collectionRate)}%` : null].filter(Boolean).join(' · ')}</span></div>,children:<>
   <Upload accept=".xlsx" showUploadList={false} beforeUpload={importFile} disabled={disabled || uploading}><Button icon={<UploadOutlined />} loading={uploading} disabled={disabled}>导入表6收入</Button></Upload>
   {sourceAreaMismatch && <p role="alert">表6住宅收费面积与当前项目不同，请核对。</p>}
   <div className="pricing-input-grid">{fields.map(([key,label,unit])=><div className="revenue-input-row" key={key}><label htmlFor={'revenue-'+key}>{label} <small>{unit}</small>{key==='additionalAnnualCost'&&<Tooltip title="仅填服务成本未包含的支出，避免重复计费。"><InfoCircleOutlined tabIndex={0} aria-label="补充费用填写说明" style={{marginLeft:6}}/></Tooltip>}</label><InputNumber id={'revenue-'+key} aria-label={label} value={s[key]} min={key==='collectionRate'?0.01:0} max={key==='collectionRate'?100:undefined} precision={2} placeholder="未知留空，没有填0" disabled={disabled} onChange={v=>update(key,v)}/></div>)}
   <div className="revenue-input-row"><label htmlFor="revenue-current-rate">现行住宅单价 <small>元/㎡·月</small></label><InputNumber id="revenue-current-rate" aria-label="现行住宅单价" min={0} value={s.currentResidentialRate} disabled={disabled} onChange={v=>update('currentResidentialRate',v)}/></div></div>
   <Collapse ghost items={[{key:'formula',label:'查看测算说明与来源',children:<>
    <p>{pending > 0 && `${pending}条服务动作待补资料。`}{c.missingIncome.length > 0 && `${c.missingIncome.join('、')}尚未计入。`}</p>
    <p>收入处理口径：商业物业费、车位管理费、增值服务、非合同及其他收入均按已填写的全年金额计入；未知收入保留空值，暂未抵扣。</p>
    <p>保本参考单价＝max(0,〔服务成本＋补充年度费用－已知其他年度收入〕÷住宅收费面积÷12÷住宅收缴率)。利润率＝利润÷项目全部收入。</p>
    <p>报价参考按目标利润率计算并按分向上取整。调整利润目标不改变保本价和按现行收费计算的结余；这不是完整经营净利润。</p>
    <p>年度成本 ¥{money(c.totalCost)}；已知其他收入 ¥{money(c.otherIncome)}；住宅收费面积 {money(result.project.residentialChargeArea)}㎡。</p>
    {fields.map(([key,label])=><p key={key}>{label}：{s.sources[key] || (key === 'otherAnnual' || key === 'additionalAnnualCost' || key === 'collectionRate' ? '现有测算默认设置，可调整；非财务实绩。' : '待补充')}</p>)}
    <p>住宅单价：{s.sources.currentResidentialRate || '待补充'}</p>{s.notes.map((n,i)=><p key={i}>{n}</p>)}
   </>}]} />
  </>}]} />
  {children}
    <Modal title="核对本次收入导入" open={candidate !== null} onCancel={()=>setCandidate(null)} onOk={applyIncome} okText="采用这些收入" cancelText="取消">
      <p>{fileName} · {candidate?.sourceProjectName || '未识别项目名称'}</p>
      {candidate?.sourceProjectName && candidate.sourceProjectName !== result.project.projectName && <Alert type="warning" showIcon title="文件中的项目名称与当前项目不同，请确认是否采用。" />}
      {candidate?.sourceResidentialArea !== undefined && Math.abs(candidate.sourceResidentialArea-result.project.residentialChargeArea)>0.01 && <Alert type="warning" title="文件住宅收费面积与当前项目不同，本次不会覆盖项目面积。" />}
      {REVENUE_FIELDS.filter(([key])=>key!=='otherAnnual').map(([key,label])=><p key={key}>{label}：<strong>{money(candidate?.[key] ?? null)}</strong> 元/年</p>)}
      <p>现行住宅单价：{money(candidate?.currentResidentialRate ?? null)} 元/㎡·月</p>
      {candidate?.notes.map((n,i)=><p className="revenue-hint" key={i}>{n}</p>)}
      <p>仅更新以上收入和现行单价，保留已设置的目标利润率、收缴率、其他收入和补充费用。</p>
    </Modal>
 </div>;
}
