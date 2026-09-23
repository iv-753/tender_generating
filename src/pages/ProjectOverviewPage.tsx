import { ArrowRightOutlined, CheckOutlined, FilePptOutlined, FileTextOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Statistic, Typography } from 'antd';
import { COST_BAND_LABELS, staffingPresentation, gradeLabel } from '../calculation';
import { formatProjectLocation } from '../cityCatalog';
import { storage } from '../storage';
import { estimateName } from '../customerLanguage';
import type { ProjectWorkspacePath } from '../components/ProjectWorkspaceNav';

const currency = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 });
const number = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 });

export default function ProjectOverviewPage({ onNavigate }: { onNavigate: (path: ProjectWorkspacePath) => void }) {
  const record = storage.loadActiveProject();
  if (!record) return <main className="workspace-page"><Card><Empty description="请先从项目中心选择项目" /></Card></main>;
  const { result } = record;
  const calculatedDetails = result.version === 2 ? result.activeActionCount : result.actions.filter(item=>item.enabled!==false).length;
  const stages = [
    { title: '项目资料', status: '已归档' }, { title: '智能测算', status: result.calculationModel === 'zhujiang-v1' ? result.standard?.complete ? '已生成费用估算' : '待补项目数据' : '已完成' },
    { title: '路演PPT', status: record.presentation ? '已生成' : '待生成' }, { title: '投标标书', status: record.bidDocument ? '已生成' : '待生成' },
  ];
  return <main className="workspace-page">
    <div className="result-heading blueprint-rule"><div><Typography.Title level={2}>{result.project.projectName}</Typography.Title><Typography.Paragraph type="secondary">{formatProjectLocation(result.project)} · {gradeLabel(result.project.serviceGrade, result.calculationModel)} · {result.calculationModel === 'zhujiang-v1' ? estimateName(result.budgetBasis) : result.calculationModel === 'workbook-v3' ? '原表完整算法 · 区级单价' : COST_BAND_LABELS[result.project.costBand]}</Typography.Paragraph></div><Button onClick={() => onNavigate('/project/result')}>查看测算结果 <ArrowRightOutlined /></Button></div>
    <section className="project-stage-rail">{stages.map((stage, index) => <div className={stage.status.startsWith('已') ? 'is-complete' : ''} key={stage.title}><span className="stage-index">{stage.status.startsWith('已') ? <CheckOutlined /> : index + 1}</span><strong>{stage.title}</strong><small>{stage.status}</small></div>)}</section>
    <section className="metrics-grid overview-metrics"><Card><Statistic title="住宅收费面积" value={result.project.residentialChargeArea} formatter={(value) => number.format(Number(value))} suffix="㎡" /></Card><Card><Statistic title="已测算服务明细" value={calculatedDetails} suffix="条" /></Card><Card><Statistic title="配置人数" value={staffingPresentation(result).headcount} suffix="人" /><small>{staffingPresentation(result).sharedText}</small></Card><Card className="cost-card"><Statistic title={result.calculationModel === 'zhujiang-v1' ? result.standard?.complete ? '年度服务成本' : '费用小计（待补数据）' : '年成本'} value={result.annualCost} formatter={(value) => currency.format(Number(value))} /></Card></section>
    <section className="artifact-grid"><Card bordered={false} title={<span><FilePptOutlined /> 路演PPT</span>} extra={record.presentation ? '已生成' : '待生成'}><Typography.Paragraph type="secondary">根据项目测算与服务方案生成完整路演材料。</Typography.Paragraph><Button type="primary" onClick={() => onNavigate(record.presentation ? '/project/presentation' : '/project/result')}>{record.presentation ? '查看文件' : '前往生成'}</Button></Card><Card bordered={false} title={<span><FileTextOutlined /> 投标标书</span>} extra={record.bidDocument ? '已生成' : '待生成'}><Typography.Paragraph type="secondary">将企业资料、服务方案与人员配置编制为投标文件。</Typography.Paragraph><Button onClick={() => onNavigate('/project/bid')}>{record.bidDocument ? '查看文件' : '前往生成'}</Button></Card></section>
  </main>;
}
