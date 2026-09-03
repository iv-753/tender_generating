import { ArrowLeftOutlined, FilePptOutlined, LoadingOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Empty, Input, Modal, Progress, Result, Space, Statistic, Steps, Table, Tabs, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { COST_BAND_LABELS, displayActionName, displayQuantity, displayStaffingCount, gradeLabel, showsActionHeadcount } from '../calculation';
import { storage } from '../storage';
import type { ActionCategory, ServiceActionResult } from '../types';

type ProjectResultPageProps = { onNavigate: () => void };
const categoryOrder: ActionCategory[] = ['service', 'cleaning', 'greening', 'assistance'];
const currency = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 });
const generationStages = [
  { key: 'validating', title: '校验项目数据', description: '确认项目资料与测算结果完整' },
  { key: 'preparing', title: '整理服务方案', description: '提取项目指标与重点服务动作' },
  { key: 'binding', title: '套用路演模板', description: '将项目内容写入24页标准模板' },
  { key: 'exporting', title: '导出演示文件', description: '生成可直接路演的PPT文件' },
] as const;
type GenerationStage = (typeof generationStages)[number]['key'] | 'complete';
type GenerationJob = {
  jobId?: string;
  status: 'idle' | 'running' | 'complete' | 'error';
  stage: GenerationStage;
  fileName?: string;
  slides?: number;
  downloadUrl?: string;
  error?: string;
};

function show(value: unknown) {
  return value === undefined || value === null || value === '' ? '—' : String(value);
}

export default function ProjectResultPage({ onNavigate }: ProjectResultPageProps) {
  const result = useMemo(() => storage.loadResult(), []);
  const [category, setCategory] = useState<ActionCategory>('service');
  const [query, setQuery] = useState('');
  const [generationOpen, setGenerationOpen] = useState(false);
  const [generation, setGeneration] = useState<GenerationJob>({ status: 'idle', stage: 'validating' });

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
    { title: '适用数量 / 依据', key: 'applicable', width: 180, render: (_: unknown, item: ServiceActionResult) => item.basis || displayQuantity(item.quantity, item.unit) },
    { title: '频次', dataIndex: 'frequency', key: 'frequency', width: 190, render: show },
    { title: '年频次', dataIndex: 'annualFrequency', key: 'annualFrequency', width: 90, render: (value: number) => displayQuantity(value) },
    { title: '年工时', dataIndex: 'annualHours', key: 'annualHours', width: 100, render: (value: number) => displayQuantity(value) },
    ...(showsActionHeadcount(category) ? [{ title: '配置人数', dataIndex: 'headcount', key: 'headcount', width: 100, render: (value: number) => value === undefined ? '—' : displayStaffingCount(value) }] : []),
    { title: '年成本', dataIndex: 'annualCost', key: 'annualCost', width: 130, align: 'right' as const, render: (value: number) => currency.format(value) },
  ];

  const generatePresentation = async () => {
    setGenerationOpen(true);
    setGeneration({ status: 'running', stage: 'validating' });
    try {
      const createdResponse = await fetch('/api/presentation/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      });
      const created = await createdResponse.json() as GenerationJob;
      if (!createdResponse.ok || !created.jobId) throw new Error(created.error || '无法开始生成PPT');
      setGeneration(created);

      let latest = created;
      while (latest.status === 'running') {
        const response = await fetch(`/api/presentation/jobs/${created.jobId}`);
        latest = await response.json() as GenerationJob;
        if (!response.ok) throw new Error(latest.error || '无法获取生成进度');
        setGeneration(latest);
        if (latest.status === 'complete' && latest.fileName && latest.slides) {
          const projectId = storage.getActiveProjectId();
          if (projectId) storage.markPresentationGenerated(projectId, {
            fileName: latest.fileName,
            slides: latest.slides,
            generatedAt: new Date().toISOString(),
          });
        }
        if (latest.status === 'running') await new Promise((resolve) => window.setTimeout(resolve, 500));
      }
    } catch (error) {
      setGeneration((current) => ({ ...current, status: 'error', error: error instanceof Error ? error.message : 'PPT生成失败' }));
    }
  };

  const currentStage = generation.status === 'complete'
    ? generationStages.length
    : Math.max(0, generationStages.findIndex((item) => item.key === generation.stage));
  const progress = generation.status === 'complete' ? 100 : currentStage * 25;

  return (
    <main className="workspace-page">
      <div className="result-heading blueprint-rule"><div><Typography.Text className="eyebrow">CALCULATION RESULT</Typography.Text><Typography.Title level={2}>{result.project.projectName}</Typography.Title><Typography.Paragraph type="secondary">{result.project.region} · {gradeLabel(result.project.serviceGrade)} · {COST_BAND_LABELS[result.project.costBand]}</Typography.Paragraph></div><Space wrap><Button icon={<ArrowLeftOutlined />} onClick={onNavigate}>返回修改</Button><Button type="primary" icon={<FilePptOutlined />} loading={generation.status === 'running'} onClick={generatePresentation}>生成路演PPT</Button></Space></div>
      <section className="metrics-grid"><Card><Statistic title="动作总数" value={result.totalActionCount} suffix="项" /></Card><Card><Statistic title="配置总人数" value={totalStaffingCount} precision={0} suffix="人" /></Card><Card className="cost-card"><Statistic title="年成本" value={result.annualCost} precision={0} prefix="¥" /></Card><Card><Statistic title="服务成本单价" value={serviceCostPerSqmMonth} precision={2} suffix="元/㎡·月" /></Card></section>
      <Card className="result-table-card" bordered={false}>
        <div className="table-toolbar"><Tabs activeKey={category} onChange={(key) => setCategory(key as ActionCategory)} items={categoryOrder.map((key) => { const item = result.categories.find((entry) => entry.category === key)!; return { key, label: `${item.title} ${item.actionCount}` }; })} /><Input allowClear prefix={<SearchOutlined />} placeholder="搜索动作、属性、依据或频次" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <div className="category-summary"><span>{summary.title}共 <strong>{summary.actionCount}</strong> 项</span><span>配置 <strong>{displayStaffingCount(summary.headcount)}</strong> 人</span><span>年成本 <strong>{currency.format(summary.annualCost)}</strong></span></div>
        <Table<ServiceActionResult> rowKey="id" size="middle" columns={columns} dataSource={actions} pagination={{ pageSize: 12, showSizeChanger: false, showTotal: (total) => `共 ${total} 项` }} scroll={{ x: 1100 }} locale={{ emptyText: '没有匹配的动作' }} />
      </Card>
      <Modal
        className="generation-modal"
        open={generationOpen}
        title={generation.status === 'complete' ? undefined : generation.status === 'error' ? 'PPT生成未完成' : '正在生成路演PPT'}
        width={620}
        centered
        closable={generation.status !== 'running'}
        mask={{ closable: generation.status !== 'running' }}
        onCancel={() => setGenerationOpen(false)}
        footer={generation.status === 'complete' ? (
          <Space><Button onClick={() => setGenerationOpen(false)}>返回测算结果</Button><Button type="primary" icon={<FilePptOutlined />} href={generation.downloadUrl} download={generation.fileName}>下载PPT</Button></Space>
        ) : generation.status === 'error' ? (
          <Space><Button onClick={() => setGenerationOpen(false)}>关闭</Button><Button type="primary" onClick={generatePresentation}>重新生成</Button></Space>
        ) : null}
      >
        {generation.status === 'complete' ? (
          <Result
            status="success"
            title="路演PPT已生成"
            subTitle={<span className="generated-file"><strong>{generation.fileName}</strong><span>共 {generation.slides} 页</span></span>}
          />
        ) : generation.status === 'error' ? (
          <Result status="error" title="生成失败" subTitle={generation.error || '请检查后重新生成'} />
        ) : (
          <div className="generation-progress">
            <Typography.Paragraph type="secondary">{result.project.projectName}</Typography.Paragraph>
            <Progress percent={progress} showInfo={false} strokeColor="#2f7d73" railColor="#e4ecef" />
            <Steps
              orientation="vertical"
              current={currentStage}
              items={generationStages.map((item, index) => ({
                title: item.title,
                content: item.description,
                icon: index === currentStage ? <LoadingOutlined /> : undefined,
              }))}
            />
          </div>
        )}
      </Modal>
    </main>
  );
}
