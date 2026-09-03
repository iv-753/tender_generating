import { CheckCircleFilled, DatabaseOutlined, DeploymentUnitOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { Card, Descriptions, Tag, Typography } from 'antd';

export default function SystemSettingsPage() {
  return <main className="workspace-page">
    <div className="page-heading blueprint-rule"><div><Typography.Text className="eyebrow">SYSTEM</Typography.Text><Typography.Title level={2}>系统设置</Typography.Title><Typography.Paragraph type="secondary">查看当前部署、数据与计算环境。</Typography.Paragraph></div><Tag color="success"><CheckCircleFilled /> 运行正常</Tag></div>
    <Card className="enterprise-card system-card" bordered={false} title={<span><DeploymentUnitOutlined /> 运行环境</span>}>
      <Descriptions column={{ xs: 1, sm: 2 }} bordered items={[
        { key: 'deploy', label: '部署方式', children: '企业内网本地部署' },
        { key: 'storage', label: '数据存储', children: <span><DatabaseOutlined /> 当前设备</span> },
        { key: 'save', label: '项目保存', children: '自动归档至项目中心' },
        { key: 'safety', label: '删除保护', children: <span><SafetyCertificateOutlined /> 二次确认</span> },
        { key: 'model', label: '测算模型', children: '已启用' },
        { key: 'office', label: '输出文件', children: 'PowerPoint / Word' },
      ]} />
    </Card>
  </main>;
}
