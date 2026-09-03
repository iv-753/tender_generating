import { CheckCircleFilled, FilePptOutlined, FileWordOutlined } from '@ant-design/icons';
import { Card, Tag, Typography } from 'antd';

export default function TemplateManagementPage() {
  return <main className="workspace-page">
    <div className="page-heading blueprint-rule"><div><Typography.Text className="eyebrow">TEMPLATE LIBRARY</Typography.Text><Typography.Title level={2}>模板管理</Typography.Title><Typography.Paragraph type="secondary">管理企业统一使用的路演与投标文件版式。</Typography.Paragraph></div></div>
    <section className="template-grid">
      <Card className="template-card" bordered={false}><div className="template-mark ppt"><FilePptOutlined /></div><div className="template-copy"><div className="template-title"><Typography.Title level={4}>住宅物业路演方案</Typography.Title><Tag color="success"><CheckCircleFilled /> 启用中</Tag></div><Typography.Paragraph type="secondary">24页标准路演结构，自动写入项目概况、测算指标与服务方案。</Typography.Paragraph><dl><div><dt>输出格式</dt><dd>PowerPoint</dd></div><div><dt>适用业务</dt><dd>住宅物业竞标路演</dd></div></dl></div></Card>
      <Card className="template-card" bordered={false}><div className="template-mark word"><FileWordOutlined /></div><div className="template-copy"><div className="template-title"><Typography.Title level={4}>住宅物业投标方案</Typography.Title><Tag color="gold">待校验</Tag></div><Typography.Paragraph type="secondary">保留企业通用章节，按项目测算结果编排服务方案与人员配置。</Typography.Paragraph><dl><div><dt>输出格式</dt><dd>Word</dd></div><div><dt>适用业务</dt><dd>住宅物业投标文件</dd></div></dl></div></Card>
    </section>
  </main>;
}
