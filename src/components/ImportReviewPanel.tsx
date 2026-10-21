import { Alert, Button, Collapse, Drawer, InputNumber, Space, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { reviewChangeReason, reviewField, unresolvedImportIssues } from '../../scripts/calculation/import-review.mjs';
import type { ReviewDecision } from '../../scripts/calculation/import-review.mjs';
import type { ImportReviewIssue, ProjectData } from '../types';

type Props = {
  project: ProjectData;
  open?: boolean; onOpen?: () => void; onClose?: () => void; errors?: string[];
  onResolve: (key: string, decision: ReviewDecision, value?: number | string) => void;
  onLocate: (key: string, basic: boolean) => void;
};

function ReviewCard({ issue, project, onResolve, onLocate, pending }: Props & { issue: ImportReviewIssue; pending: boolean }) {
  const field = reviewField(issue, project);
  const [value, setValue] = useState<number | null>(typeof field.current === 'number' ? field.current : null);
  useEffect(() => { setValue(typeof field.current === 'number' ? field.current : null); }, [field.current]);
  const invalid = value === null || !Number.isFinite(value) || value < 0 || (field.integer && !Number.isInteger(value));
  const confirm = (decision: ReviewDecision) => onResolve(issue.key, decision, value ?? undefined);
  const numeric = <Space wrap><InputNumber aria-label={`${issue.label}确认值`} value={value} min={0} max={field.max} precision={field.integer ? 0 : undefined} placeholder="填写核实后的数值" onChange={setValue} /><span>{field.unit}</span></Space>;
  return <section className={`import-review-card${pending ? '' : ' is-reviewed'}`} aria-label={issue.label}>
    <div className="import-review-heading"><strong>{issue.label}</strong><Tag color={pending ? 'orange' : 'green'}>{pending ? issue.classification==='conflict'?'确有数值矛盾':issue.kind==='missing'?'必要数据缺失':field.kind==='unsupported'?'暂不支持':'需确认口径' : '已核对'}</Tag></div>
    {issue.sources.length === 1 && <p className="import-review-original">原表填写：<strong>{issue.sources[0].raw == null || issue.sources[0].raw === '' ? '空白' : String(issue.sources[0].raw)}</strong></p>}
    <p>{issue.message}</p>{pending && reviewChangeReason(issue,project) && <p role="alert">{reviewChangeReason(issue,project)}</p>}
    {!!issue.sources.length && <details className="import-review-sources"><summary>查看原表位置与内容（{issue.sources.length} 处）</summary>{issue.sources.map((s, i) => <div key={i}><span>{s.sheet} · {s.cell}</span>：{s.raw == null || s.raw === '' ? '空白' : String(s.raw)}</div>)}</details>}
    {field.kind === 'number' && <><p className="import-review-current">{field.current == null ? <strong>尚未采用数值，需先确认上述内容</strong> : <>当前采用：<strong>{field.current} {field.unit}</strong></>}{field.derived !== undefined && <>；基础资料合计：{Number(field.derived.toFixed(4))} {field.unit}</>}</p>{field.derived !== undefined && <p className="import-review-help">此处确认设备维护的服务范围；若与楼栋资料不同，请按实际范围填写。</p>}<Space wrap>{numeric}<Button type="primary" disabled={invalid} onClick={() => confirm('value')}>采用此值并确认</Button>{field.derived !== undefined && <Button onClick={() => onResolve(issue.key, 'value', field.derived)}>采用基础资料合计</Button>}<Button type="link" onClick={() => onLocate(field.key, false)}>定位到参数</Button></Space></>}
    {field.kind==='coverage' && <Button onClick={()=>confirm('covered')}>已由对应电气设施服务覆盖，不重复计费</Button>}
    {field.kind === 'activity' && <><p className="import-review-help">请确认这些活动是否已包含在所选档位的宣传、见面会等活动中，避免重复计费。</p><Button onClick={() => confirm('covered')}>已包含在标准活动中，不另加</Button><p>如果是标准以外的活动，请填写额外全年次数：</p><Space wrap>{numeric}<Button type="primary" disabled={invalid} onClick={() => confirm('extra')}>确认额外次数</Button></Space></>}
    {field.kind === 'post' && <><p className="import-review-help">若实际属于门岗、监控或巡逻，确认由对应岗位测算；表五的现有编制只用于对比。</p><Button onClick={() => confirm('covered')}>归入门岗／监控／巡逻，不重复增员</Button><p>确需另增人员时，填写<strong>全项目其他独立安保岗位合计净增人数</strong>（含本项及替休）：</p><Space wrap>{numeric}<Button type="primary" disabled={invalid} onClick={() => confirm('extra')}>确认独立岗位合计</Button><Button type="link" onClick={() => onLocate(field.key, false)}>检查安保参数</Button></Space></>}
    {field.kind === 'basic' && <><p>{field.current == null || field.current === '' ? <strong>尚未采用数值，需先确认上述内容</strong> : <>当前填写：<strong>{field.current} {field.unit === '%' ? '（0—1 比例）' : field.unit}</strong></>}</p><Space wrap><Button onClick={() => onLocate(issue.key, true)}>修改基础参数</Button><Button type="primary" disabled={field.current == null || field.current === ''} onClick={() => onResolve(issue.key, 'value', field.current ?? undefined)}>确认当前填写值</Button></Space></>}
    {field.kind === 'unsupported' && (issue.kind === 'unmatched' && !issue.required ? <><p>如需参与测算，请在原表改为对应字段名称后重新导入；确认只是说明或实际结果时，可以排除。</p><Button onClick={() => confirm('ignore')}>确认不参与本次测算</Button></> : <Typography.Text type="danger">请按以上原因修正原表后重新上传，此项无法直接确认。</Typography.Text>)}
    {!pending && <div className="import-review-confirmed" role="status">已保存核对结果{field.kind === 'post' && issue.resolution?.decision === 'covered' ? '：不另增人员' : field.kind === 'unsupported' ? '：不参与测算' : field.current != null ? `：${field.current} ${field.unit}` : ''}。相关参数改变后会重新提示核对。</div>}
  </section>;
}

export default function ImportReviewPanel(props: Props) {
  const issues=props.project.importReviewIssues??[];
  const pending=unresolvedImportIssues(props.project);
  const keys=new Set(pending.map(i=>i.key));
  const reviewed=issues.filter(i=>!keys.has(i.key));
  const group=(i:ImportReviewIssue)=>i.key.startsWith('posts.')?'人员安排':i.key.startsWith('服务!')||/^[清洁绿化]/.test(i.key)?'服务计划':'面积口径与设备';
  if(!issues.length&&!props.errors?.length) return null;
  return <section id="import-review" aria-label="导入资料核对">
    <Space wrap><Typography.Text>{pending.length ? `${pending.length}项待核对` : props.errors?.length ? '资料待核对' : '资料已核对'}</Typography.Text><Button onClick={props.onOpen}>核对资料</Button></Space>
    <Drawer title="核对资料" width="min(960px, calc(100vw - 48px))" open={props.open} afterOpenChange={open=>{if(open)document.querySelector('.ant-drawer-body .import-review-card:not(.is-reviewed)')?.scrollIntoView({block:'start'});}} onClose={props.onClose}>
      {!!props.errors?.length && <Alert type="warning" title="请处理以下问题" description={props.errors.map((e,i)=><div key={i}>{e}</div>)} />}
      {['面积口径与设备','人员安排','服务计划'].map(label=>{const rows=pending.filter(i=>group(i)===label);return rows.length?<div key={label}><Typography.Title level={5}>{label}</Typography.Title>{rows.map(issue=><ReviewCard {...props} key={issue.key} issue={issue} pending />)}</div>:null;})}
      {!pending.length&&!props.errors?.length && <Typography.Paragraph>当前没有未解决的核对事项。</Typography.Paragraph>}
      {!!reviewed.length&&<Collapse items={[{key:'reviewed',label:`已核对（${reviewed.length}）`,children:reviewed.map(issue=><ReviewCard {...props} key={issue.key} issue={issue} pending={false}/>)}]} />}
    </Drawer>
  </section>;
}
