import { useState } from 'react';
import { Alert, Button, Card, Collapse, InputNumber, Modal, Space, Tag, Typography, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { calculateRevenueScenario, emptyRevenueScenario, REVENUE_FIELDS } from '../../scripts/calculation/revenue-scenario.mjs';
import { recognizeExcelFile } from '../excelRecognition';
import type { CalculationResult, RevenueScenario } from '../types';

const money = (n: number | null) => n === null ? '—' : new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(n);
const rate = (n: number | null, digits = 2) => n === null ? '—' : n.toFixed(digits);
type Props = { result: CalculationResult; disabled?: boolean; onChange: (scenario: RevenueScenario) => void };

export default function RevenueScenarioPanel({ result, disabled, onChange }: Props) {
  const s = { ...emptyRevenueScenario(), ...result.project.revenueScenario };
  const [uploading, setUploading] = useState(false);
  const [candidate, setCandidate] = useState<RevenueScenario | null>(null);
  const [fileName, setFileName] = useState('');
  const calc = calculateRevenueScenario(result.annualCost, result.project.residentialChargeArea, s, { allowMissingIncome: true });
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

  return <Card className="revenue-panel" id="revenue-scenario">
    <div className="revenue-heading"><div><Typography.Title level={3}>住宅收费与利润试算</Typography.Title><p>结合其他收入，测算住宅物业费的收支平衡水平。</p></div>
      <Upload accept=".xlsx" showUploadList={false} beforeUpload={importFile} disabled={disabled || uploading}>
        <Button icon={<UploadOutlined />} loading={uploading} disabled={disabled}>导入表6收入</Button>
      </Upload>
    </div>
    <div className="revenue-definition"><strong>利润率口径：利润 ÷ 项目全部收入</strong><span>利润＝项目全部收入－纳入测算的年度成本。全部收入包含住宅物业费、商业物业费、车位管理费、增值及其他收入；不是成本加价率。</span></div>
    <div className="revenue-layout">
      <div className="revenue-inputs">
        <div className="revenue-section-title"><strong>其他年度收入</strong><span>元/年 · 仅填物业公司可取得的收入</span></div>
        {REVENUE_FIELDS.map(([key, label]) => <div className="revenue-input-row" key={key}>
          <label htmlFor={`revenue-${key}`}>{label}</label>
          <InputNumber id={`revenue-${key}`} aria-label={`${label}年度金额`} min={0} precision={2} value={s[key]} placeholder="没有填0，未知留空" disabled={disabled} onChange={v=>update(key,v)} />
        </div>)}
        <div className="revenue-total"><span>其他年度收入合计</span><strong data-testid="other-income">¥ {money(calc.otherIncome)}</strong></div>
        <div className="revenue-input-row"><label htmlFor="revenue-additional">补充年度费用 <small>元/年</small></label><InputNumber id="revenue-additional" aria-label="补充年度费用" min={0} precision={2} value={s.additionalAnnualCost} disabled={disabled} onChange={v=>update('additionalAnnualCost',v)} /></div>
        <p className="revenue-hint">只补充上方成本未包含的费用，如其他收入对应的支出、税费等，避免重复计入。默认尚未补充。</p>
        <div className="revenue-input-row"><label htmlFor="revenue-collection">住宅收缴率 <small>%</small></label><InputNumber id="revenue-collection" aria-label="住宅收缴率" min={0.01} max={100} precision={2} value={s.collectionRate} disabled={disabled} onChange={v=>update('collectionRate',v)} /></div>
        <p className="revenue-hint">默认100%收缴；其他收入请直接填写预计可实现的全年金额。</p>
      </div>
      <div className="revenue-outcomes">
        <div className="revenue-break-even"><span>住宅物业费盈亏平衡点 <Tag>{calc.missingIncome.length ? '暂估 · 仅计已知收入' : '当前口径'}</Tag></span><div><strong data-testid="break-even">{rate(calc.breakEvenRate)}</strong><span>元/㎡·月</span></div><small>年度成本 ¥{money(calc.totalCost)} − 其他收入 ¥{money(calc.otherIncome)}<br />再除以住宅收费面积 {money(result.project.residentialChargeArea)} ㎡ × 12个月 × 收缴率 {money(s.collectionRate)}%</small></div>
        <div className="revenue-margin-control"><label htmlFor="revenue-margin">目标利润率 <small>占项目全部收入</small></label><Space><InputNumber id="revenue-margin" aria-label="目标利润率" min={0} max={99} precision={1} value={s.targetMargin} disabled={disabled} onChange={v=>update('targetMargin',v)} /><span>%</span></Space></div>
        <div className="revenue-presets">{[0,10,15].map(m => {
          const item = calculateRevenueScenario(result.annualCost, result.project.residentialChargeArea, { ...s, targetMargin: m }, { allowMissingIncome: true });
          return <button type="button" key={m} aria-pressed={s.targetMargin === m} disabled={disabled} onClick={()=>update('targetMargin',m)}>
            <span>{m === 0 ? '收支平衡 · 0%' : `利润率 ${m}%`}</span><strong>{rate(item.chargeRate)}<small> 元/㎡·月</small></strong>
          </button>;
        })}</div>
        <div className="revenue-target"><span>所选目标对应的试算收费</span><strong data-testid="target-charge">{rate(calc.chargeRate)} <small>元/㎡·月</small></strong><p>理论值 {rate(calc.targetRate,4)}；按分收费向上取整，避免舍入后低于目标。</p></div>
        <div className="revenue-profit-line"><span>对应全年收入 <strong>¥{money(calc.targetAnnualIncome)}</strong></span><span>对应全年利润 <strong>¥{money(calc.targetAnnualProfit)}</strong></span></div>
        <div className="revenue-current"><div className="revenue-input-row"><label htmlFor="revenue-current-rate">现行住宅单价 <small>元/㎡·月</small></label><InputNumber id="revenue-current-rate" aria-label="现行住宅单价" min={0} precision={2} value={s.currentResidentialRate} disabled={disabled} onChange={v=>update('currentResidentialRate',v)} /></div>
          <p data-testid="current-profit">按现行收费，预计全年{(calc.currentAnnualProfit ?? 0) < 0 ? '亏损' : '利润'} <strong>¥{money(calc.currentAnnualProfit === null ? null : Math.abs(calc.currentAnnualProfit))}</strong>；利润率 <strong>{rate(calc.currentMargin)}%</strong></p>
        </div>
      </div>
    </div>
    {calc.missingIncome.length > 0 && <Alert type="info" showIcon title="已按已知收入显示暂估结果" description={`${calc.missingIncome.join('、')}尚未填写，暂未计入收入；没有这项收入可填0，有收入时补充后会自动重算。空白原值已保留。`} />}
    {calc.errors.length > 0 && <Alert type="info" showIcon title="请修正以下数据后显示结果" description={calc.errors.join('；')} />}
    <Alert type="warning" showIcon title="这是当前已计费用口径下的试算，尚非完整经营净利润" description={`${pending ? `还有${pending}条服务待补资料。` : ''}未纳入的经营费用、税费及收入配套成本，需在补充年度费用中计入；新增费用后平衡价会变化。`} />
    {sourceAreaMismatch && <Alert type="warning" showIcon title={`表6住宅收费面积为${money(s.sourceResidentialArea!)}㎡，本页采用项目当前面积${money(result.project.residentialChargeArea)}㎡，请核对差异。`} />}
    <Collapse ghost items={[{ key:'source', label:'查看收入来源、计算公式与口径说明', children:<>
      <p>目标住宅单价＝max(0,〔年度总成本÷（1－目标利润率）－其他年度收入〕÷住宅收费面积÷12÷住宅收缴率)。年度总成本＝上方测算费用＋补充年度费用。</p>
      <p>收入超过所需总收入时，住宅试算收费最低为0；这里的利润率仅反映已纳入的收入和费用，不代表税后净利率。</p>
      {REVENUE_FIELDS.map(([key,label])=><p key={key}><strong>{label}：</strong>{s.sources[key] || (key==='otherAnnual' ? '项目试算默认0，可自行补充。' : '尚未导入，可手动填写。')}</p>)}
      {s.notes.map((n,i)=><p key={i}>{n}</p>)}
    </> }]} />
    <p className="revenue-save-note">修改自动保存在当前项目；收入调整只影响收费试算，不改变服务配置和上方服务成本。</p>
    <Modal title="核对本次收入导入" open={candidate !== null} onCancel={()=>setCandidate(null)} onOk={applyIncome} okText="采用这些收入" cancelText="取消">
      <p>{fileName} · {candidate?.sourceProjectName || '未识别项目名称'}</p>
      {candidate?.sourceProjectName && candidate.sourceProjectName !== result.project.projectName && <Alert type="warning" showIcon title="文件中的项目名称与当前项目不同，请确认是否采用。" />}
      {candidate?.sourceResidentialArea !== undefined && Math.abs(candidate.sourceResidentialArea-result.project.residentialChargeArea)>0.01 && <Alert type="warning" title="文件住宅收费面积与当前项目不同，本次不会覆盖项目面积。" />}
      {REVENUE_FIELDS.filter(([key])=>key!=='otherAnnual').map(([key,label])=><p key={key}>{label}：<strong>{money(candidate?.[key] ?? null)}</strong> 元/年</p>)}
      <p>现行住宅单价：{money(candidate?.currentResidentialRate ?? null)} 元/㎡·月</p>
      {candidate?.notes.map((n,i)=><p className="revenue-hint" key={i}>{n}</p>)}
      <p>仅更新以上收入和现行单价，保留已设置的目标利润率、收缴率、其他收入和补充费用。</p>
    </Modal>
  </Card>;
}
