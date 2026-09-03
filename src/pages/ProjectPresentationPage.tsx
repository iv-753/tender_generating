import { FilePptOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Tag, Typography } from 'antd';
import { storage } from '../storage';

const dateTime = new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' });

export default function ProjectPresentationPage({ onGenerate }: { onGenerate: () => void }) {
  const record = storage.loadActiveProject();
  if (!record) return <main className="workspace-page"><Card><Empty description="请先从项目中心选择项目" /></Card></main>;
  return <main className="workspace-page"><div className="page-heading blueprint-rule"><div><Typography.Text className="eyebrow">PRESENTATION</Typography.Text><Typography.Title level={2}>路演PPT</Typography.Title><Typography.Paragraph type="secondary">{record.result.project.projectName} · 标准24页住宅物业路演方案</Typography.Paragraph></div></div>
    <Card className="artifact-detail-card" bordered={false}>{record.presentation ? <><div className="artifact-file-icon"><FilePptOutlined /></div><div><Typography.Title level={4}>{record.presentation.fileName}</Typography.Title><Typography.Paragraph type="secondary">{record.presentation.slides} 页 · {dateTime.format(new Date(record.presentation.generatedAt))}</Typography.Paragraph><Tag color="success">已生成</Tag></div></> : <Empty image={<FilePptOutlined className="empty-artifact-icon" />} description="该项目尚未生成路演PPT"><Button type="primary" onClick={onGenerate}>前往生成</Button></Empty>}</Card>
  </main>;
}
