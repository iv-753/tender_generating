import { BankOutlined, FileDoneOutlined, FolderOpenOutlined, SnippetsOutlined } from '@ant-design/icons';
import { Card, Descriptions, Typography } from 'antd';
import { storage } from '../storage';

export default function SystemSettingsPage() {
  const company = storage.loadCompanyProfile();
  const projects = storage.loadProjects();
  const deliverables = projects.reduce((count, item) => count + Number(Boolean(item.presentation)) + Number(Boolean(item.bidDocument)), 0);
  return <main className="workspace-page">
    <div className="page-heading blueprint-rule"><div><Typography.Title level={2}>管理中心</Typography.Title><Typography.Paragraph type="secondary">查看组织资料、项目资产与交付能力。</Typography.Paragraph></div></div>
    <Card className="enterprise-card system-card" bordered={false} title={<span><BankOutlined /> 组织与资产概况</span>}>
      <Descriptions column={{ xs: 1, sm: 2 }} bordered items={[
        { key: 'company', label: '组织名称', children: company?.companyName || '尚未完善' },
        { key: 'profile', label: '企业资料', children: company?.companyName ? '已完善' : '待完善' },
        { key: 'projects', label: '项目档案', children: `${projects.length}个` },
        { key: 'deliverables', label: '交付成果', children: `${deliverables}份` },
        { key: 'standards', label: '方案标准', children: '2套' },
        { key: 'role', label: '管理身份', children: '企业管理员' },
      ]} />
    </Card>
    <section className="management-grid">
      <Card bordered={false}><BankOutlined /><strong>组织资料</strong><span>维护企业基础信息与投标主体资料</span></Card>
      <Card bordered={false}><FolderOpenOutlined /><strong>项目档案</strong><span>{projects.length}个项目集中管理</span></Card>
      <Card bordered={false}><SnippetsOutlined /><strong>方案资产</strong><span>路演与投标两类方案标准</span></Card>
      <Card bordered={false}><FileDoneOutlined /><strong>交付成果</strong><span>{deliverables}份成果文件已生成</span></Card>
    </section>
  </main>;
}
