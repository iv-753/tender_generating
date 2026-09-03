import { CalculatorOutlined, FilePptOutlined, FileTextOutlined } from '@ant-design/icons';
import { Card, Empty, Timeline, Typography } from 'antd';
import { storage } from '../storage';

const dateTime = new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' });

export default function ProjectHistoryPage() {
  const record = storage.loadActiveProject();
  if (!record) return <main className="workspace-page"><Card><Empty description="请先从项目中心选择项目" /></Card></main>;
  const items = [
    ...(record.bidDocument ? [{ dot: <FileTextOutlined />, children: <><strong>生成投标标书</strong><p>{record.bidDocument.fileName} · {dateTime.format(new Date(record.bidDocument.generatedAt))}</p></> }] : []),
    ...(record.presentation ? [{ dot: <FilePptOutlined />, children: <><strong>生成路演PPT</strong><p>{record.presentation.fileName} · {dateTime.format(new Date(record.presentation.generatedAt))}</p></> }] : []),
    { dot: <CalculatorOutlined />, children: <><strong>完成项目测算</strong><p>{record.result.totalActionCount}项服务动作 · {dateTime.format(new Date(record.result.calculatedAt))}</p></> },
  ];
  return <main className="workspace-page"><div className="page-heading blueprint-rule"><div><Typography.Title level={2}>生成记录</Typography.Title><Typography.Paragraph type="secondary">{record.result.project.projectName} 的测算与文件生成轨迹。</Typography.Paragraph></div></div><Card className="enterprise-card history-card" bordered={false}><Timeline items={items} /></Card></main>;
}
