import { CopyOutlined, DeleteOutlined, EditOutlined, FileTextOutlined, FolderOpenOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Input, message, Popconfirm, Space, Table, Tag, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { displayStaffingCount, gradeLabel } from '../calculation';
import { formatProjectLocation } from '../cityCatalog';
import { storage } from '../storage';
import type { ProjectRecord } from '../types';

type ProjectCenterPageProps = {
  onNew: () => void;
  onOpen: (id: string) => void;
  onEdit: (id: string) => void;
};

const currency = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 });
const number = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });

export default function ProjectCenterPage({ onNew, onOpen, onEdit }: ProjectCenterPageProps) {
  const [projects, setProjects] = useState(() => storage.loadProjects());
  const [query, setQuery] = useState('');
  const keyword = query.trim().toLowerCase();
  const filteredProjects = useMemo(() => projects.filter((item) => {
    if (!keyword) return true;
    return [item.result.project.projectName, item.result.project.region, item.result.project.city]
      .some((value) => value.toLowerCase().includes(keyword));
  }), [keyword, projects]);

  const duplicate = (id: string) => {
    const copy = storage.duplicateProject(id);
    if (!copy) return;
    setProjects(storage.loadProjects());
    message.success(`已复制“${copy.result.project.projectName}”`);
  };

  const remove = (id: string) => {
    if (!storage.deleteProject(id)) return;
    setProjects(storage.loadProjects());
    message.success('项目已删除');
  };

  const columns = [
    {
      title: '项目档案',
      key: 'project',
      width: 280,
      render: (_: unknown, item: ProjectRecord) => (
        <div className="project-identity">
          <strong>{item.result.project.projectName}</strong>
          <span>{formatProjectLocation(item.result.project)}</span>
        </div>
      ),
    },
    { title: '服务等级', key: 'grade', width: 150, render: (_: unknown, item: ProjectRecord) => gradeLabel(item.result.project.serviceGrade) },
    { title: '收费面积', key: 'area', width: 130, align: 'right' as const, render: (_: unknown, item: ProjectRecord) => `${number.format(item.result.project.residentialChargeArea)} ㎡` },
    { title: '配置人数', key: 'staffing', width: 100, align: 'right' as const, render: (_: unknown, item: ProjectRecord) => `${displayStaffingCount(item.result.totalHeadcount)} 人` },
    { title: '年成本', key: 'cost', width: 130, align: 'right' as const, render: (_: unknown, item: ProjectRecord) => <strong className="project-cost">{currency.format(item.result.annualCost)}</strong> },
    {
      title: '交付成果',
      key: 'deliverables',
      width: 190,
      render: (_: unknown, item: ProjectRecord) => <Space size={4} wrap><Tag color={item.presentation ? 'success' : 'default'}>路演 {item.presentation ? '已生成' : '待生成'}</Tag><Tag color={item.bidDocument ? 'success' : 'default'}>标书 {item.bidDocument ? '已生成' : '待生成'}</Tag></Space>,
    },
    { title: '最近更新', key: 'updatedAt', width: 130, render: (_: unknown, item: ProjectRecord) => dateTime.format(new Date(item.updatedAt)) },
    {
      title: '操作',
      key: 'actions',
      width: 310,
      render: (_: unknown, item: ProjectRecord) => (
        <Space size={2}>
          <Button type="link" icon={<FolderOpenOutlined />} onClick={() => onOpen(item.id)}>进入项目</Button>
          <Button type="text" icon={<EditOutlined />} onClick={() => onEdit(item.id)}>继续编辑</Button>
          <Button type="text" icon={<CopyOutlined />} onClick={() => duplicate(item.id)}>复制</Button>
          <Popconfirm
            title="删除这个项目？"
            description="删除后无法恢复。"
            okText="确认删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            onConfirm={() => remove(item.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <main className="workspace-page project-center-page">
      <div className="page-heading blueprint-rule">
        <div>
          <Typography.Title level={2}>项目中心</Typography.Title>
          <Typography.Paragraph type="secondary">集中管理项目测算、方案编制与交付成果。</Typography.Paragraph>
        </div>
        <Button type="primary" size="large" icon={<PlusOutlined />} onClick={onNew}>新建项目</Button>
      </div>

      <Card className="project-ledger" variant="borderless">
        <div className="project-ledger-toolbar">
          <div className="ledger-summary">
            <span className="ledger-icon"><FileTextOutlined /></span>
            <span><strong>{projects.length}</strong> 个项目档案</span>
          </div>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索项目名称或地区"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        {projects.length ? (
          <Table<ProjectRecord>
            rowKey="id"
            columns={columns}
            dataSource={filteredProjects}
            pagination={false}
            scroll={{ x: 1360 }}
            locale={{ emptyText: '没有匹配的项目' }}
          />
        ) : (
          <Empty className="project-empty" image={Empty.PRESENTED_IMAGE_SIMPLE} description="还没有保存的项目">
            <Button type="primary" icon={<PlusOutlined />} onClick={onNew}>新建第一个项目</Button>
          </Empty>
        )}
      </Card>
    </main>
  );
}
