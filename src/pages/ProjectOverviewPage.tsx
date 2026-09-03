import { ArrowRightOutlined, CheckOutlined, FilePptOutlined, FileTextOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Statistic, Typography } from 'antd';
import { COST_BAND_LABELS, displayStaffingCount, gradeLabel } from '../calculation';
import { storage } from '../storage';
import type { ProjectWorkspacePath } from '../components/ProjectWorkspaceNav';

const currency = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 });
const number = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 });

export default function ProjectOverviewPage({ onNavigate }: { onNavigate: (path: ProjectWorkspacePath) => void }) {
  const record = storage.loadActiveProject();
  if (!record) return <main className="workspace-page"><Card><Empty description="请先从项目中心选择项目" /></Card></main>;
  const { result } = record;
  const stages = [
    { title: '项目资料', status: '已归档' }, { title: '智能测算', status: '已完成' },
    { title: '路演PPT', status: record.presentation ? '已生成' : '待生成' }, { title: '投标标书', status: '待生成' },
  ];
  return <main className="workspace-page">
    <div className="result-heading blueprint-rule"><div><Typography.Text className="eyebrow">PROJECT WORKSPACE</Typography.Text><Typography.Title level={2}>{result.project.projectName}</Typography.Title><Typography.Paragraph type="secondary">{result.project.region} · {gradeLabel(result.project.serviceGrade)} · {COST_BAND_LABELS[result.project.costBand]}</Typography.Paragraph></div><Button onClick={() => onNavigate('/project/result')}>查看测算结果 <ArrowRightOutlined /></Button></div>
    <section className="project-stage-rail">{stages.map((stage, index) => <div className={stage.status.startsWith('已') ? 'is-complete' : ''} key={stage.title}><span className="stage-index">{stage.status.startsWith('已') ? <CheckOutlined /> : index + 1}</span><strong>{stage.title}</strong><small>{stage.status}</small></div>)}</section>
    <section className="metrics-grid overview-metrics"><Card><Statistic title="住宅收费面积" value={result.project.residentialChargeArea} formatter={(value) => number.format(Number(value))} suffix="㎡" /></Card><Card><Statistic title="服务动作" value={result.totalActionCount} suffix="项" /></Card><Card><Statistic title="配置总人数" value={displayStaffingCount(result.totalHeadcount)} suffix="人" /></Card><Card className="cost-card"><Statistic title="年成本" value={result.annualCost} formatter={(value) => currency.format(Number(value))} /></Card></section>
    <section className="artifact-grid"><Card bordered={false} title={<span><FilePptOutlined /> 路演PPT</span>} extra={record.presentation ? '已生成' : '待生成'}><Typography.Paragraph type="secondary">基于标准24页模板生成项目路演材料。</Typography.Paragraph><Button type="primary" onClick={() => onNavigate(record.presentation ? '/project/presentation' : '/project/result')}>{record.presentation ? '查看文件' : '前往生成'}</Button></Card><Card bordered={false} title={<span><FileTextOutlined /> 投标标书</span>} extra="待生成"><Typography.Paragraph type="secondary">将企业通用资料与项目服务方案合成为投标文件。</Typography.Paragraph><Button onClick={() => onNavigate('/project/bid')}>查看标书准备</Button></Card></section>
  </main>;
}
