import { CheckCircleFilled, ClockCircleOutlined, DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Space, Tag, Typography } from 'antd';
import { useState } from 'react';
import BidGenerationButton from '../components/BidGenerationButton';
import { displayStaffingCount } from '../calculation';
import { storage } from '../storage';

const currency = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' });

export default function ProjectBidPage() {
  const [record, setRecord] = useState(() => storage.loadActiveProject());
  if (!record) return <main className="workspace-page"><Card><Empty description="请先从项目中心选择项目" /></Card></main>;
  const { result, bidDocument } = record;
  const refresh = () => setRecord(storage.loadActiveProject());

  return <main className="workspace-page">
    <div className="page-heading blueprint-rule"><div><Typography.Title level={2}>投标标书</Typography.Title><Typography.Paragraph type="secondary">{result.project.projectName} · 汇总项目服务方案、岗位配置与成本测算。</Typography.Paragraph></div><Tag color={bidDocument ? 'success' : 'default'} icon={bidDocument ? <CheckCircleFilled /> : <ClockCircleOutlined />}>{bidDocument ? '已生成' : '待生成'}</Tag></div>
    <Card className="enterprise-card bid-readiness" bordered={false} title={<span><FileTextOutlined /> 项目方案准备</span>}>
      <div><span><CheckCircleFilled /></span><strong>项目资料</strong><small>{result.project.projectName}已归档</small></div>
      <div><span><CheckCircleFilled /></span><strong>服务方案</strong><small>{result.totalActionCount}项服务动作已完成</small></div>
      <div><span><CheckCircleFilled /></span><strong>人员与成本</strong><small>{displayStaffingCount(result.totalHeadcount)}人 · {currency.format(result.annualCost)}</small></div>
      <BidGenerationButton result={result} label={bidDocument ? '重新生成投标标书' : '生成投标标书'} onComplete={refresh} />
    </Card>
    {bidDocument && <Card className="enterprise-card generated-artifact" bordered={false} title="最新投标文件" extra={<Tag color="success">可交付</Tag>}>
      <div><FileTextOutlined /><span><strong>{bidDocument.fileName}</strong><small>生成于 {dateTime.format(new Date(bidDocument.generatedAt))}</small></span></div>
      <Space><Button icon={<DownloadOutlined />} href={bidDocument.downloadUrl} download={bidDocument.fileName}>下载标书</Button></Space>
    </Card>}
  </main>;
}
