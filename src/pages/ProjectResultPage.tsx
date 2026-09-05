import { ArrowLeftOutlined, CloseOutlined, EditOutlined, FilePptOutlined, InfoCircleOutlined, LoadingOutlined, ReloadOutlined, SaveOutlined, SearchOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Checkbox, Empty, Input, Modal, Progress, Result, Space, Statistic, Steps, Table, Tabs, Tooltip, Typography } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';

import { calculateAdjustedProject } from '../adjustedCalculator';
import ActionEditor from '../components/ActionEditor';
import BidGenerationButton from '../components/BidGenerationButton';
import { CATEGORY_ORDER, COST_BAND_LABELS, displayActionName, displayQuantity, displayStaffingCount, gradeLabel, showsActionHeadcount } from '../calculation';
import { formatProjectLocation } from '../cityCatalog';
import { storage } from '../storage';
import type { ActionCategory, CalculationAdjustments, CalculationResult, CategorySummary, ServiceActionResult } from '../types';

type ProjectResultPageProps = { onNavigate: () => void };
const categoryOrder = CATEGORY_ORDER;
const currency = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 });
const workloadCurrency = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const wholeNumber = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 });
const decimalNumber = new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const EMPTY_ADJUSTMENTS: CalculationAdjustments = { version: 1, overrides: {}, customActions: [] };
const generationStages = [
  { key: 'validating', title: '校验项目数据', description: '确认项目资料与测算结果完整' },
  { key: 'preparing', title: '整理服务方案', description: '提取项目指标与重点服务动作' },
  { key: 'binding', title: '编排路演内容', description: '组织项目方案与核心服务内容' },
  { key: 'exporting', title: '导出演示文件', description: '生成可直接路演的PPT文件' },
] as const;
type GenerationStage = (typeof generationStages)[number]['key'] | 'complete';
type GenerationJob = {
  jobId?: string;
  status: 'idle' | 'running' | 'complete' | 'error';
  stage: GenerationStage;
  fileName?: string;
  slides?: number;
  actionCount?: number;
  downloadUrl?: string;
  error?: string;
};

function show(value: unknown) {
  return value === undefined || value === null || value === '' ? '—' : String(value);
}

function workloadCost(result: CalculationResult) {
  return result.workloadAnnualCost ?? result.actions.filter((item) => item.enabled !== false).reduce((sum, item) => sum + item.annualCost, 0);
}

function hasAdjustments(value: CalculationAdjustments) {
  return Object.keys(value.overrides).length > 0 || value.customActions.length > 0;
}

function hasWorkloadOrCost(item: ServiceActionResult) {
  return Number(item.annualHours ?? 0) > 0
    || Number(item.headcount ?? 0) > 0
    || Number(item.annualCost ?? 0) > 0;
}

function isAdjustedAction(item: ServiceActionResult, adjustments: CalculationAdjustments) {
  return item.source === 'custom' || item.enabled === false || Object.hasOwn(adjustments.overrides, item.id);
}

function isDisabledOrCustom(item: ServiceActionResult) {
  return item.enabled === false || item.source === 'custom';
}

function hasSharedWorkloadGroup(item: ServiceActionResult) {
  return Boolean((item as ServiceActionResult & { sharedWorkloadGroup?: string }).sharedWorkloadGroup);
}

function categoryWorkloadHeadcount(summary: CategorySummary, actions: ServiceActionResult[]) {
  if (summary.workloadEquivalentHeadcount !== undefined) return summary.workloadEquivalentHeadcount;
  const active = actions.filter((item) => item.category === summary.category && item.enabled !== false);
  if (summary.category === 'assistance') return active.reduce((sum, item) => sum + Number(item.headcount ?? 0), 0);
  const hours = active.reduce((sum, item) => sum + Number(item.annualHours ?? 0), 0);
  return hours / (summary.category === 'service' ? 2304 : 2920);
}

function explainedTitle(label: string, explanation: string) {
  return <Space size={5}><span>{label}</span><Tooltip title={explanation}><InfoCircleOutlined aria-label={label + '说明'} /></Tooltip></Space>;
}

export default function ProjectResultPage({ onNavigate }: ProjectResultPageProps) {
  const initialResult = useMemo(() => storage.loadResult(), []);
  const [savedResult, setSavedResult] = useState<CalculationResult | null>(initialResult);
  const [previewResult, setPreviewResult] = useState<CalculationResult | null>(initialResult);
  const [editing, setEditing] = useState(false);
  const [draftAdjustments, setDraftAdjustments] = useState<CalculationAdjustments>(() => storage.loadActiveAdjustments() ?? structuredClone(EMPTY_ADJUSTMENTS));
  const [recalculation, setRecalculation] = useState<{ loading: boolean; error?: string }>({ loading: false });
  const recalculationSequence = useRef(0);
  const [category, setCategory] = useState<ActionCategory>('service');
  const [query, setQuery] = useState('');
  const [showZeroValues, setShowZeroValues] = useState(false);
  const [adjustedOnly, setAdjustedOnly] = useState(false);
  const [disabledOrCustomOnly, setDisabledOrCustomOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [generationOpen, setGenerationOpen] = useState(false);
  const [generation, setGeneration] = useState<GenerationJob>({ status: 'idle', stage: 'validating' });

  useEffect(() => {
    if (!editing || !savedResult) return;
    const sequence = ++recalculationSequence.current;
    setRecalculation({ loading: true });
    const timer = window.setTimeout(() => {
      calculateAdjustedProject(savedResult.project, draftAdjustments)
        .then((result) => {
          if (sequence !== recalculationSequence.current) return;
          setPreviewResult(result);
          setRecalculation({ loading: false });
        })
        .catch((error) => {
          if (sequence !== recalculationSequence.current) return;
          setRecalculation({ loading: false, error: error instanceof Error ? error.message : '调整方案重算失败' });
        });
    }, 200);
    return () => window.clearTimeout(timer);
  }, [draftAdjustments, editing, savedResult]);

  if (!savedResult || !previewResult) return <main className="workspace-page"><Card><Empty description="暂无测算结果"><Button type="primary" onClick={onNavigate}>返回填写项目</Button></Empty></Card></main>;

  const result = previewResult;
  const availableCategories = categoryOrder.filter((key) => result.categories.some((item) => item.category === key));
  const summary = result.categories.find((item) => item.category === category)!;
  const keyword = query.trim().toLowerCase();
  const categoryActions = result.actions.filter((item) => item.category === category);
  const actions = categoryActions.filter((item) => {
    if (keyword && ![item.action, item.property, item.basis, item.frequency].some((value) => String(value ?? '').toLowerCase().includes(keyword))) return false;
    if (disabledOrCustomOnly) return isDisabledOrCustom(item);
    if (adjustedOnly) return isAdjustedAction(item, draftAdjustments);
    if (item.enabled === false) return false;
    return showZeroValues || hasWorkloadOrCost(item);
  });
  const standardActionCount = result.version === 2 ? result.standardActionCount : result.totalActionCount;
  const activeActionCount = result.version === 2 ? result.activeActionCount : result.actions.filter((item) => item.enabled !== false).length;
  const customActionCount = result.actions.filter((item) => item.source === 'custom').length;
  const activeStandardActionCount = result.actions.filter((item) => item.source !== 'custom' && item.enabled !== false).length;
  const disabledActionCount = Math.max(0, standardActionCount - activeStandardActionCount);
  const totalStaffingCount = displayStaffingCount(result.totalHeadcount);
  const rawServiceCostPerSqmMonth = result.project.residentialChargeArea > 0 ? result.annualCost / result.project.residentialChargeArea / 12 : null;
  const serviceCostPerSqmMonth = rawServiceCostPerSqmMonth === null ? null : Math.round((rawServiceCostPerSqmMonth + Number.EPSILON) * 100) / 100;
  const currentWorkloadCost = workloadCost(result);
  const savedWorkloadCost = workloadCost(savedResult);
  const workloadDelta = currentWorkloadCost - savedWorkloadCost;
  const budgetDelta = result.annualCost - savedResult.annualCost;
  const workloadEquivalentHeadcount = categoryWorkloadHeadcount(summary, result.actions);
  const columns = [
    { title: '动作', dataIndex: 'action', key: 'action', fixed: 'left' as const, width: 180, render: (value: string) => displayActionName(value) },
    { title: '属性', dataIndex: 'property', key: 'property', width: 120, render: show },
    { title: '适用数量 / 依据', key: 'applicable', width: 180, render: (_: unknown, item: ServiceActionResult) => item.basis || displayQuantity(item.quantity, item.unit) },
    { title: '频次', dataIndex: 'frequency', key: 'frequency', width: 190, render: show },
    ...(showsActionHeadcount(category)
      ? [{ title: '配置人数', dataIndex: 'headcount', key: 'headcount', width: 100, render: (value: number) => value === undefined ? '—' : displayStaffingCount(value) }]
      : [
          { title: '年频次', dataIndex: 'annualFrequency', key: 'annualFrequency', width: 90, render: (value: number | undefined) => value === undefined ? '—' : wholeNumber.format(value) },
          { title: '年工时', dataIndex: 'annualHours', key: 'annualHours', width: 100, render: (value: number | undefined) => value === undefined ? '—' : decimalNumber.format(value) },
        ]),
    {
      title: explainedTitle(category === 'assistance' ? '年岗位成本' : '年工作量成本', category === 'assistance'
        ? '本项配置人数按对应岗位人工单价折算。'
        : '本项年工时按对应人工单价折算，修改年频次或年工时后立即变化。'),
      dataIndex: 'annualCost', key: 'annualCost', width: 150, align: 'right' as const, render: (value: number) => category === 'assistance' ? currency.format(value) : workloadCurrency.format(value),
    },
  ];

  const enterEditing = () => {
    setDraftAdjustments(storage.loadActiveAdjustments() ?? structuredClone(EMPTY_ADJUSTMENTS));
    setPreviewResult(savedResult);
    setRecalculation({ loading: false });
    setEditing(true);
  };

  const cancelEditing = () => {
    recalculationSequence.current += 1;
    setPreviewResult(savedResult);
    setDraftAdjustments(storage.loadActiveAdjustments() ?? structuredClone(EMPTY_ADJUSTMENTS));
    setRecalculation({ loading: false });
    setEditing(false);
  };

  const saveEditing = () => {
    const projectId = storage.getActiveProjectId();
    if (projectId) {
      if (hasAdjustments(draftAdjustments)) storage.saveProjectAdjustments(projectId, draftAdjustments, result);
      else storage.clearProjectAdjustments(projectId, result);
    } else {
      storage.saveResult(result);
    }
    setSavedResult(result);
    setEditing(false);
  };

  const generatePresentation = async () => {
    setGenerationOpen(true);
    setGeneration({ status: 'running', stage: 'validating' });
    try {
      const createdResponse = await fetch('/api/presentation/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savedResult),
      });
      const created = await createdResponse.json() as GenerationJob;
      if (!createdResponse.ok || !created.jobId) throw new Error(created.error || '无法开始生成PPT');
      setGeneration(created);

      let latest = created;
      while (latest.status === 'running') {
        const response = await fetch('/api/presentation/jobs/' + created.jobId);
        latest = await response.json() as GenerationJob;
        if (!response.ok) throw new Error(latest.error || '无法获取生成进度');
        setGeneration(latest);
        if (latest.status === 'running') await new Promise((resolve) => window.setTimeout(resolve, 500));
      }
      if (latest.status === 'complete' && latest.fileName && latest.slides) {
        const projectId = storage.getActiveProjectId();
        if (projectId) storage.markPresentationGenerated(projectId, {
          fileName: latest.fileName,
          slides: latest.slides,
          generatedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      setGeneration((current) => ({ ...current, status: 'error', error: error instanceof Error ? error.message : 'PPT生成失败' }));
    }
  };

  const currentStage = generation.status === 'complete'
    ? generationStages.length
    : Math.max(0, generationStages.findIndex((item) => item.key === generation.stage));
  const progress = generation.status === 'complete' ? 100 : currentStage * 25;
  const workloadDirection = workloadDelta < 0 ? '减少' : '增加';
  const budgetDirection = budgetDelta < 0 ? '减少' : '增加';
  return (
    <main className="workspace-page">
      <div className="result-heading blueprint-rule"><div><Typography.Title level={2}>{result.project.projectName}</Typography.Title><Typography.Paragraph type="secondary">{formatProjectLocation(result.project)} · {gradeLabel(result.project.serviceGrade)} · {COST_BAND_LABELS[result.project.costBand]}</Typography.Paragraph></div><Space wrap>
        <Button icon={<ArrowLeftOutlined />} onClick={onNavigate}>返回修改</Button>
        {editing ? <>
          <Button icon={<CloseOutlined />} onClick={cancelEditing}>取消调整</Button>
          <Button type="primary" icon={<SaveOutlined />} disabled={recalculation.loading || Boolean(recalculation.error)} onClick={saveEditing}>保存调整</Button>
        </> : <>
          <Button icon={<EditOutlined />} onClick={enterEditing}>调整服务方案</Button>
          <BidGenerationButton result={savedResult} />
          <Button type="primary" icon={<FilePptOutlined />} loading={generation.status === 'running'} onClick={generatePresentation}>生成路演PPT</Button>
        </>}
      </Space></div>
      <section className="metrics-grid">
        <Card className="action-library-card"><Statistic title="标准动作库" value={standardActionCount} suffix="项" /><small>当前启用 {activeActionCount} 项{disabledActionCount > 0 ? ` · 停用 ${disabledActionCount} 项` : ''}{customActionCount > 0 ? ` · 自定义 ${customActionCount} 项` : ''}</small></Card>
        <Card><Statistic title="配置总人数" value={totalStaffingCount} precision={0} suffix="人" /></Card>
        <Card className="cost-card"><Statistic title={explainedTitle('项目年度用工预算', '汇总工作量后按完整岗位人数向上取整，小幅调整时预算可能暂时不变。')} value={result.annualCost} formatter={(value) => wholeNumber.format(Number(value))} prefix="¥" /></Card>
        <Card><Statistic title={explainedTitle('服务成本单价', '项目年度用工预算除以住宅收费面积和12个月。')} value={serviceCostPerSqmMonth ?? '—'} precision={serviceCostPerSqmMonth === null ? undefined : 2} suffix={serviceCostPerSqmMonth === null ? undefined : '元/㎡·月'} /></Card>
      </section>
      {result.version === 2 && <Card className="management-cost-card" size="small"><div><strong>管理人员成本</strong><small>单独计入项目总人数和年度用工预算</small></div><span><strong>{displayStaffingCount(result.management.headcount)}人</strong><small>配置人数</small></span><span><strong>{currency.format(result.management.annualCost)}</strong><small>年度成本</small></span></Card>}
      <div className="workload-cost-strip">
        <div><strong>工作量折算成本</strong><Tooltip title="全部有效动作的年工作量成本合计，修改动作后立即变化。"><InfoCircleOutlined aria-label="工作量折算成本说明" /></Tooltip></div>
        <span>{currency.format(currentWorkloadCost)}</span>
        <small>用于观察服务动作调整幅度；最终报价仍以项目年度用工预算为准。</small>
      </div>
      {editing && Math.abs(workloadDelta) > 0.01 && <Alert className="cost-change-alert" type={budgetDelta === 0 ? 'info' : 'success'} showIcon message={budgetDelta === 0
        ? '工作量折算成本' + workloadDirection + ' ' + currency.format(Math.abs(workloadDelta)) + '；完整岗位人数未变化，项目年度用工预算暂未变化。'
        : '工作量折算成本' + workloadDirection + ' ' + currency.format(Math.abs(workloadDelta)) + '；项目年度用工预算同步' + budgetDirection + ' ' + currency.format(Math.abs(budgetDelta)) + '。'} />}
      {recalculation.error && <Alert className="cost-change-alert" type="error" showIcon message={recalculation.error} />}
      <Card className="result-table-card" variant="borderless">
        <div className="table-toolbar"><Tabs activeKey={category} onChange={(key) => { setCategory(key as ActionCategory); setPage(1); }} items={availableCategories.map((key) => { const item = result.categories.find((entry) => entry.category === key)!; return { key, label: item.title + ' ' + item.actionCount }; })} /></div>
        <div className="result-filters"><Space wrap>
          <Checkbox checked={showZeroValues} onChange={(event) => { setShowZeroValues(event.target.checked); setPage(1); }}>显示零值</Checkbox>
          <Checkbox checked={adjustedOnly} onChange={(event) => { setAdjustedOnly(event.target.checked); setDisabledOrCustomOnly(false); setPage(1); }}>只看已调整</Checkbox>
          <Checkbox checked={disabledOrCustomOnly} onChange={(event) => { setDisabledOrCustomOnly(event.target.checked); setAdjustedOnly(false); setPage(1); }}>只看已停用/自定义</Checkbox>
          {editing && <Button icon={<ReloadOutlined />} onClick={() => setDraftAdjustments(structuredClone(EMPTY_ADJUSTMENTS))}>恢复原测算</Button>}
        </Space><Input allowClear prefix={<SearchOutlined />} placeholder="搜索动作、属性、依据或频次" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></div>
        <div className="category-summary"><span>{summary.title}共 <strong>{summary.actionCount}</strong> 项</span><span>工作量相当于 <strong>{workloadEquivalentHeadcount.toFixed(1)}</strong> 人，实际配置 <strong>{displayStaffingCount(summary.headcount)}</strong> 人</span><span>年工作量成本 <strong>{currency.format(summary.workloadAnnualCost ?? categoryActions.filter((item) => item.enabled !== false).reduce((sum, item) => sum + item.annualCost, 0))}</strong></span><span>用工预算 <strong>{currency.format(summary.annualCost)}</strong></span></div>
        {category !== 'assistance' && <div className="cost-basis-note">动作工作量成本用于逐项核算；分类取整用工预算按汇总工时折算完整岗位，不能用表内行成本相加替代。{category === 'pestControl' && categoryActions.some(hasSharedWorkloadGroup) ? '四害消杀的共享工作量已按动作分摊。' : ''}</div>}
        {recalculation.loading && <div className="recalculation-state"><LoadingOutlined /> 正在重算</div>}
        {editing
          ? <ActionEditor key={`${category}-${showZeroValues}-${adjustedOnly}-${disabledOrCustomOnly}-${query}`} category={category} actions={actions} adjustments={draftAdjustments} onChange={setDraftAdjustments} />
          : <Table<ServiceActionResult> rowKey="id" size="middle" columns={columns} dataSource={actions} pagination={{ current: page, pageSize: 12, showSizeChanger: false, showTotal: (total) => '共 ' + total + ' 项', onChange: setPage }} scroll={{ x: 1100 }} locale={{ emptyText: '没有匹配的动作' }} />}
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
            <Typography.Paragraph type="secondary">{savedResult.project.projectName}</Typography.Paragraph>
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
