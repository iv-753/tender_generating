import { BankOutlined, ClockCircleOutlined, FileTextOutlined, MoreOutlined, PlusOutlined, RightOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Dropdown, Empty, Input, message, Modal, Space, Table } from 'antd';
import { useState } from 'react';
import { gradeLabel } from '../calculation';
import { storage } from '../storage';
import type { ProjectData, ProjectRecord } from '../types';
import grades from '../data/zhujiang-grades.json';
import standards from '../data/huacheng-review-standards.json';
import './ProjectCenterPage.css';

type Props = { onNew: () => void; onResume: () => void; onOpen: (id: string) => void; onEdit: (id: string) => void; onResult: (id: string) => void };
type Row = { id: string; project: ProjectData; record?: ProjectRecord; pending: boolean; reason: string };
const gradeKeys = ['D', 'C', 'B', 'A'] as const;
const dateTime = new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });

export default function ProjectCenterPage({ onNew, onResume, onOpen, onEdit, onResult }: Props) {
  const [projects, setProjects] = useState(() => storage.loadProjects());
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [standardGrade, setStandardGrade] = useState<keyof typeof grades | null>(null);
  const draft = !storage.getActiveProjectId() ? storage.loadDraft() : null;
  const rows: Row[] = projects.map(record => {
    const result = record.result;
    const missing = result.missingInputs ?? [];
    const pending = missing.length > 0 || result.standard?.complete === false || result.actions.some(action => action.standardStatus === 'pending');
    return { id: record.id, record, project: result.project, pending, reason: missing.length ? '待补充：' + missing.slice(0, 2).map(item => item.label).join('、') + (missing.length > 2 ? '等' : '') : '服务标准或费用资料尚未齐全，请核对后测算。' };
  });
  if (draft?.projectName) rows.unshift({ id: 'unsaved-draft', project: draft, pending: true, reason: '当前草稿尚未完成测算，请继续完善项目资料。' });
  const pendingRows = rows.filter(row => row.pending);
  const filtered = rows.filter(row => (filter === 'all' || (filter === 'pending' ? row.pending : !row.pending)) && [row.project.projectName, row.project.region, row.project.city].some(value => value?.toLowerCase().includes(query.trim().toLowerCase())));
  const active = projects.find(item => item.id === storage.getActiveProjectId());
  const edit = (row: Row) => row.record ? onEdit(row.id) : onResume();
  const open = (row: Row) => row.record ? onResult(row.id) : onResume();
  const grade = (row: Row) => row.project.calculationModel === 'zhujiang-v1' || row.record?.result.calculationModel === 'zhujiang-v1' ? grades[row.project.serviceGrade]?.sourceLabel ?? '待确认' : gradeLabel(row.project.serviceGrade, row.record?.result.calculationModel);
  const duplicate = (id: string) => { if (storage.duplicateProject(id)) { setProjects(storage.loadProjects()); message.success('已复制项目'); } };
  const remove = (id: string) => Modal.confirm({ title: '删除这个项目？', content: '删除后无法恢复。', okText: '确认删除', cancelText: '取消', okButtonProps: { danger: true }, onOk: () => { storage.deleteProject(id); setProjects(storage.loadProjects()); } });
  return <>
<main className="workbench-home-content">
      <div className="workbench-title"><div><h1>项目工作台</h1><span>{new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long' }).format(new Date())}</span></div><Space><Button icon={<UploadOutlined />} onClick={onNew}>导入项目资料</Button><Button type="primary" icon={<PlusOutlined />} onClick={onNew}>新建测算</Button></Space></div>
      <section className="workbench-banner"><img src="/pearl-river-day.png" alt="广州珠江日景天际线" /><div><h2>从项目资料到经营决策</h2><p>统一服务标准，核对人员成本。</p></div></section>
      <section className="workbench-stats" aria-label="项目统计"><div>项目<strong>{rows.length}<small>个</small></strong></div><div>已完成测算<strong>{rows.filter(row => !row.pending).length}<small>个</small></strong></div><div>资料待补<strong>{pendingRows.length}<small>个</small></strong></div></section>
      <div className="workbench-grid"><section className="workbench-card workbench-projects">
        <div className="workbench-list-heading"><h2>项目列表</h2><Input aria-label="搜索项目名称" placeholder="搜索项目名称" prefix={<SearchOutlined />} allowClear value={query} onChange={event => setQuery(event.target.value)} /><div className="workbench-filters">{[['all', '全部项目'], ['complete', '已测算'], ['pending', '待补资料']].map(([key, label]) => <Button key={key} type={filter === key ? 'primary' : 'default'} onClick={() => setFilter(key)}>{label}</Button>)}</div></div>
        <Table<Row> rowKey="id" size="middle" dataSource={filtered} pagination={filtered.length > 8 ? { pageSize: 8, showSizeChanger: false } : false} rowClassName={row => row.id === active?.id ? 'workbench-selected-row' : ''} locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={rows.length ? '没有匹配的项目' : '暂无项目，导入资料或新建测算后将在这里展示。'} /> }} columns={[
          { title: '项目名称', key: 'name', render: (_, row) => <button className="project-name-link" onClick={() => open(row)}>{row.project.projectName}</button> },
          { title: '服务档位', key: 'grade', width: 76, render: (_, row) => grade(row) },
          { title: '状态', key: 'status', width: 88, render: (_, row) => <span className={'workbench-status ' + (row.pending ? 'pending' : '')}><i />{row.pending ? '待补资料' : '已测算'}</span> },
          { title: '最近更新', key: 'updated', width: 84, render: (_, row) => row.record ? dateTime.format(new Date(row.record.updatedAt)) : '未保存草稿' },
          { title: '操作', key: 'actions', width: 122, render: (_, row) => <Space size={0}><Button type="link" onClick={() => open(row)}>{row.record ? '查看结果' : '继续录入'}<RightOutlined /></Button>{row.record && <Dropdown menu={{ items: [{ key: 'open', label: '进入项目', onClick: () => onOpen(row.id) }, { key: 'edit', label: '继续编辑', onClick: () => onEdit(row.id) }, { key: 'copy', label: '复制项目', onClick: () => duplicate(row.id) }, { key: 'delete', label: '删除项目', danger: true, onClick: () => remove(row.id) }] }}><Button type="text" aria-label={row.project.projectName + '更多操作'} icon={<MoreOutlined />} /></Dropdown>}</Space> },
        ]} />
      </section><div className="workbench-right"><section className="workbench-card workbench-reminders"><h2>待处理</h2>{pendingRows.length ? pendingRows.slice(0, 3).map(row => <button key={row.id} onClick={() => edit(row)}><FileTextOutlined /><span><strong>{row.project.projectName}：补充项目资料</strong><small>{row.reason}</small></span><RightOutlined /></button>) : <div className="workbench-empty-note">{rows.length ? '暂无待补资料提醒' : '暂无项目，待处理事项将在录入后显示。'}</div>}{pendingRows.length > 3 && <Button type="link" onClick={() => setFilter('pending')}>查看全部 {pendingRows.length} 个待补项目</Button>}</section>
        <section className="workbench-card workbench-standards"><div><h2>服务标准</h2></div><div className="workbench-grade-grid">{gradeKeys.map(key => <button key={key} onClick={() => setStandardGrade(key)}><strong>{grades[key].sourceLabel}</strong></button>)}</div><p>查看各档服务内容与频次</p></section>
      </div></div>
      <section className="workbench-recent"><ClockCircleOutlined /><strong>最近打开</strong>{active ? <button onClick={() => onResult(active.id)}><span className="workbench-project-thumb" aria-label="暂无项目图片"><BankOutlined /></span><span>{active.result.project.projectName}</span><small>继续查看测算结果</small><RightOutlined /></button> : <span className="workbench-empty-note">暂无打开记录</span>}</section>
    </main>
    <Modal title={'珠江四级服务标准 · ' + (standardGrade ? grades[standardGrade].sourceLabel : '')} open={!!standardGrade} onCancel={() => setStandardGrade(null)} footer={null} width={900}><Table rowKey="id" size="small" dataSource={standards} pagination={{ pageSize: 8, showSizeChanger: false }} columns={[{ title: '服务类别', dataIndex: 'category', width: 130 }, { title: '服务项', dataIndex: 'item', width: 180 }, { title: '服务内容及频次', key: 'standard', render: (_, item) => standardGrade ? item[standardGrade] || '待补充' : '' }]} /></Modal>
  </>;
}
