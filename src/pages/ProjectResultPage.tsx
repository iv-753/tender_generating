import { ArrowLeftOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Input, Statistic, Table, Tabs, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { COST_BAND_LABELS, displayActionName, displayStaffingCount, gradeLabel, showsActionHeadcount } from '../calculation';
import { storage } from '../storage';
import type { ActionCategory, ServiceActionResult } from '../types';

type ProjectResultPageProps = { onNavigate: () => void };
const categoryOrder: ActionCategory[] = ['service', 'cleaning', 'greening', 'assistance'];
const currency = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 });

function show(value: unknown) {
  return value === undefined || value === null || value === '' ? '—' : String(value);
}

export default function ProjectResultPage({ onNavigate }: ProjectResultPageProps) {
  const result = useMemo(() => storage.loadResult(), []);
  const [category, setCategory] = useState<ActionCategory>('service');
  const [query, setQuery] = useState('');

  if (!result) return <main className="workspace-page"><Card><Empty description="暂无测算结果"><Button type="primary" onClick={onNavigate}>返回填写项目</Button></Empty></Card></main>;

  const summary = result.categories.find((item) => item.category === category)!;
  const keyword = query.trim().toLowerCase();
  const actions = result.actions.filter((item) => item.category === category && (!keyword || [item.action, item.property, item.basis, item.frequency].some((value) => String(value ?? '').toLowerCase().includes(keyword))));
  const totalStaffingCount = result.categories.reduce((sum, item) => sum + displayStaffingCount(item.headcount), 0);
  const rawServiceCostPerSqmMonth = result.annualCost / result.project.residentialChargeArea / 12;
  const serviceCostPerSqmMonth = Math.round((rawServiceCostPerSqmMonth + Number.EPSILON) * 100) / 100;
  const columns = [
    { title: '动作', dataIndex: 'action', key: 'action', fixed: 'left' as const, width: 180, render: (value: string) => displayActionName(value) },
    { title: '属性', dataIndex: 'property', key: 'property', width: 120, render: show },
    { title: '适用数量 / 依据', key: 'applicable', width: 180, render: (_: unknown, item: ServiceActionResult) => item.basis || [show(item.quantity), item.unit].filter((value) => value && value !== '—').join(' ') || '—' },
    { title: '频次', dataIndex: 'frequency', key: 'frequency', width: 190, render: show },
    { title: '年频次', dataIndex: 'annualFrequency', key: 'annualFrequency', width: 90, render: (value: number) => value === undefined ? '—' : decimal.format(value) },
    { title: '年工时', dataIndex: 'annualHours', key: 'annualHours', width: 100, render: (value: number) => value === undefined ? '—' : decimal.format(value) },
    ...(showsActionHeadcount(category) ? [{ title: '配置人数', dataIndex: 'headcount', key: 'headcount', width: 100, render: (value: number) => value === undefined ? '—' : displayStaffingCount(value) }] : []),
    { title: '年成本', dataIndex: 'annualCost', key: 'annualCost', width: 130, align: 'right' as const, render: (value: number) => currency.format(value) },
  ];

  return (
    <main className="workspace-page">
      <div className="result-heading blueprint-rule"><div><Typography.Text className="eyebrow">CALCULATION RESULT</Typography.Text><Typography.Title level={2}>{result.project.projectName}</Typography.Title><Typography.Paragraph type="secondary">{result.project.region} · {gradeLabel(result.project.serviceGrade)} · {COST_BAND_LABELS[result.project.costBand]}</Typography.Paragraph></div><Button icon={<ArrowLeftOutlined />} onClick={onNavigate}>返回修改</Button></div>
      <section className="metrics-grid"><Card><Statistic title="动作总数" value={result.totalActionCount} suffix="项" /></Card><Card><Statistic title="配置总人数" value={totalStaffingCount} precision={0} suffix="人" /></Card><Card className="cost-card"><Statistic title="年成本" value={result.annualCost} precision={0} prefix="¥" /></Card><Card><Statistic title="服务成本单价" value={serviceCostPerSqmMonth} precision={2} suffix="元/㎡·月" /></Card></section>
      <Card className="result-table-card" bordered={false}>
        <div className="table-toolbar"><Tabs activeKey={category} onChange={(key) => setCategory(key as ActionCategory)} items={categoryOrder.map((key) => { const item = result.categories.find((entry) => entry.category === key)!; return { key, label: `${item.title} ${item.actionCount}` }; })} /><Input allowClear prefix={<SearchOutlined />} placeholder="搜索动作、属性、依据或频次" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <div className="category-summary"><span>{summary.title}共 <strong>{summary.actionCount}</strong> 项</span><span>配置 <strong>{displayStaffingCount(summary.headcount)}</strong> 人</span><span>年成本 <strong>{currency.format(summary.annualCost)}</strong></span></div>
        <Table<ServiceActionResult> rowKey="id" size="middle" columns={columns} dataSource={actions} pagination={{ pageSize: 12, showSizeChanger: false, showTotal: (total) => `共 ${total} 项` }} scroll={{ x: 1100 }} locale={{ emptyText: '没有匹配的动作' }} />
      </Card>
    </main>
  );
}
