import { CheckCircleFilled, FilePptOutlined, FileWordOutlined } from '@ant-design/icons';
import { Card, Tag, Typography } from 'antd';

export default function TemplateManagementPage() {
  return <main className="workspace-page">
    <div className="page-heading blueprint-rule"><div><Typography.Title level={2}>方案资产</Typography.Title><Typography.Paragraph type="secondary">统一管理企业方案标准与交付规范。</Typography.Paragraph></div></div>
    <section className="template-grid">
      <Card className="template-card" bordered={false}><div className="template-mark ppt"><FilePptOutlined /></div><div className="template-copy"><div className="template-title"><Typography.Title level={4}>住宅物业路演方案标准</Typography.Title><Tag color="success"><CheckCircleFilled /> 已启用</Tag></div><Typography.Paragraph type="secondary">用于住宅物业竞标路演，统一项目分析、服务方案与成果表达。</Typography.Paragraph><dl><div><dt>适用场景</dt><dd>住宅物业竞标路演</dd></div><div><dt>内容范围</dt><dd>项目概况、服务方案、成本配置</dd></div></dl></div></Card>
      <Card className="template-card" bordered={false}><div className="template-mark word"><FileWordOutlined /></div><div className="template-copy"><div className="template-title"><Typography.Title level={4}>住宅物业投标方案标准</Typography.Title><Tag color="success"><CheckCircleFilled /> 已启用</Tag></div><Typography.Paragraph type="secondary">用于住宅物业投标交付，统一服务标准、岗位配置与实施方案。</Typography.Paragraph><dl><div><dt>适用场景</dt><dd>住宅物业投标文件</dd></div><div><dt>内容范围</dt><dd>服务标准、人员配置、实施方案</dd></div></dl></div></Card>
    </section>
  </main>;
}
