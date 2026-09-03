import { CheckCircleFilled, ClockCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import { Button, Card, Tag, Typography } from 'antd';
import { storage } from '../storage';

export default function ProjectBidPage() {
  const record = storage.loadActiveProject();
  const profile = storage.loadCompanyProfile();
  return <main className="workspace-page"><div className="page-heading blueprint-rule"><div><Typography.Text className="eyebrow">BID DOCUMENT</Typography.Text><Typography.Title level={2}>投标标书</Typography.Title><Typography.Paragraph type="secondary">{record?.result.project.projectName ?? '当前项目'} · 汇总企业资料与项目服务方案。</Typography.Paragraph></div><Tag icon={<ClockCircleOutlined />}>待生成</Tag></div>
    <Card className="enterprise-card bid-readiness" bordered={false} title={<span><FileTextOutlined /> 生成准备</span>}>
      <div><span><CheckCircleFilled /></span><strong>项目测算数据</strong><small>{record ? `${record.result.totalActionCount}项服务动作已就绪` : '请先选择项目'}</small></div>
      <div className={profile?.companyName ? '' : 'is-pending'}><span>{profile?.companyName ? <CheckCircleFilled /> : <ClockCircleOutlined />}</span><strong>企业通用资料</strong><small>{profile?.companyName ? `${profile.companyName}资料已保存` : '请先完善企业资料'}</small></div>
      <div className="is-pending"><span><ClockCircleOutlined /></span><strong>标书模板校验</strong><small>标准模板待校验</small></div>
      <Button type="primary" disabled>生成标书</Button>
    </Card>
  </main>;
}
