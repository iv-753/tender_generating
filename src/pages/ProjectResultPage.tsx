import { ArrowLeftOutlined, CloseOutlined, EditOutlined, FilePptOutlined, InfoCircleOutlined, LoadingOutlined, ReloadOutlined, SaveOutlined, SearchOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Checkbox, Collapse, Empty, Input, Modal, Result, Space, Statistic, Table, Tabs, Tag, Tooltip, Typography, message } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';

import { calculateAdjustedProject } from '../adjustedCalculator';
import ActionEditor from '../components/ActionEditor';
import BidGenerationButton from '../components/BidGenerationButton';
import GenerationProgress from '../components/GenerationProgress';
import WorkbookParametersDrawer from '../components/WorkbookParametersDrawer';
import { calculateProject, previewWorkbookInputs } from '../workbookCalculator';
import { CATEGORY_ORDER, COST_BAND_LABELS, displayQuantity, displayStaffingCount, staffingPresentation, gradeLabel, isCompleteModel, showsActionHeadcount } from '../calculation';
import { formatProjectLocation } from '../cityCatalog';
import { storage } from '../storage';
import { customerLabel, customerMissingReason, estimateName } from '../customerLanguage';
import { ARTIFACT_MINIMUM_MS, waitForMinimumDuration } from '../progressTiming';
import type { ActionCategory, CalculationAdjustments, CalculationResult, CategorySummary, ServiceActionResult, WorkbookInput } from '../types';

type ProjectResultPageProps = { onNavigate: () => void };
const categoryOrder = CATEGORY_ORDER;
const currency = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 });
const workloadCurrency = new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', minimumFractionDigits: 2, maximumFractionDigits: 2 });
const wholeNumber = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 });
const preciseNumber = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 4 });
const decimalNumber = new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const EMPTY_ADJUSTMENTS: CalculationAdjustments = { version: 1, overrides: {}, customActions: [] };
const EMPTY_WORKBOOK_OVERRIDES: Record<string, number | string> = {};
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

function displayCategoryTitle(summary: CategorySummary) {
  return summary.category === 'assistance' ? '安保' : customerLabel(summary.title);
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
  const [generationStartedAt, setGenerationStartedAt] = useState(0);
  const [parametersOpen, setParametersOpen] = useState(false);
  const [dataReviewOpen,setDataReviewOpen]=useState(false);
  const [showPending,setShowPending]=useState(false);
  const [parametersLoading, setParametersLoading] = useState(false);
  const [parametersError, setParametersError] = useState('');
  const [workbookInputs, setWorkbookInputs] = useState<WorkbookInput[]>([]);
  const [parameterFocus,setParameterFocus]=useState<string>();

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
  const restored = isCompleteModel(result.calculationModel);
  const zhujiang = result.calculationModel === 'zhujiang-v1';
  const openParameters = async (focusKey?: string) => {
    setParameterFocus(focusKey);
    setParametersOpen(true); setParametersLoading(true); setParametersError('');
    try { setWorkbookInputs(await previewWorkbookInputs(savedResult.project)); }
    catch (reason) { setParametersError(reason instanceof Error ? reason.message : '计算参数读取失败'); }
    finally { setParametersLoading(false); }
  };
  const applyParameters = async (workbookOverrides: Record<string, number | string>) => {
    setParametersLoading(true); setParametersError('');
    try {
      const next = await calculateProject({ ...savedResult.project, workbookOverrides });
      storage.saveCalculatedProject(next); setSavedResult(next); setPreviewResult(next);
      setParametersOpen(false); message.success('已重新计算并保存');
    } catch (reason) { setParametersError(reason instanceof Error ? reason.message : '重新计算失败'); }
    finally { setParametersLoading(false); }
  };
  const switchBudget = async (budgetBasis: 'standard' | 'workload') => {
    setParametersLoading(true);
    try {
      const next = await calculateProject({ ...savedResult.project, budgetBasis });
      storage.saveCalculatedProject(next); setSavedResult(next); setPreviewResult(next);
    } catch (reason) { message.error(reason instanceof Error ? reason.message : '切换预算失败'); }
    finally { setParametersLoading(false); }
  };
  const availableCategories = categoryOrder.filter((key) => result.categories.some((item) => item.category === key));
  const summary = result.categories.find((item) => item.category === category)!;
  const keyword = query.trim().toLowerCase();
  const categoryActions = result.actions.filter((item) => item.category === category);
  const actions = categoryActions.filter((item) => {
    if (keyword && ![item.action, item.property, item.basis, item.frequency].some((value) => String(value ?? '').toLowerCase().includes(keyword))) return false;
    if (disabledOrCustomOnly) return isDisabledOrCustom(item);
    if (adjustedOnly) return isAdjustedAction(item, draftAdjustments);
    if (zhujiang && item.standardStatus === 'pending') return showPending;
    if (item.enabled === false) return showZeroValues && zhujiang;
    return showZeroValues || hasWorkloadOrCost(item);
  });
  const standardActionCount = result.version === 2 ? result.standardActionCount : result.totalActionCount;
  const activeActionCount = result.version === 2 ? result.activeActionCount : result.actions.filter((item) => item.enabled !== false).length;
  const customActionCount = result.actions.filter((item) => item.source === 'custom').length;
  const activeStandardActionCount = result.actions.filter((item) => item.source !== 'custom' && item.enabled !== false).length;
  const disabledActionCount = Math.max(0, standardActionCount - activeStandardActionCount);
  const staffing = staffingPresentation(result);
  const totalStaffingCount = staffing.headcount;
  const rawServiceCostPerSqmMonth = result.project.residentialChargeArea > 0 ? result.annualCost / result.project.residentialChargeArea / 12 : null;
  const serviceCostPerSqmMonth = rawServiceCostPerSqmMonth === null ? null : Math.round((rawServiceCostPerSqmMonth + Number.EPSILON) * 100) / 100;
  const currentWorkloadCost = workloadCost(result);
  const savedWorkloadCost = workloadCost(savedResult);
  const workloadDelta = currentWorkloadCost - savedWorkloadCost;
  const budgetDelta = result.annualCost - savedResult.annualCost;
  const workloadEquivalentHeadcount = categoryWorkloadHeadcount(summary, result.actions);
  const columns = [
    { title: '服务内容', dataIndex: 'action', key: 'action', fixed: 'left' as const, width: 180, render: (value: string) => customerLabel(value) },
    ...(zhujiang ? [{ title: '服务要求', key: 'standard', width: 130, render: (_: unknown, item: ServiceActionResult) => <><Tooltip title={item.standardText || '使用参考值，可按本项目实际服务安排调整。'}><Tag color={item.standardStatus === 'pending' ? 'orange' : item.standardStatus === 'excluded' ? 'default' : item.standardStatus === 'manual' ? 'gold' : 'blue'}>{item.standardStatus === 'pending' ? '待补资料' : item.standardStatus === 'covered' ? '已含在合同内' : item.standardStatus === 'excluded' ? '未计入' : item.standardStatus === 'reference' ? '参考服务安排' : item.standardStatus === 'manual' ? '项目设置' : '珠江标准'}</Tag></Tooltip>{item.standardStatus==='pending' && <Button size="small" type="link" onClick={()=>openParameters(result.missingInputs?.find(x=>x.actionIds.includes(item.id))?.key)}>补充资料</Button>}</> }] : []),
    { title: '属性', dataIndex: 'property', key: 'property', width: 120, render: show },
    { title: '服务数量 / 范围', key: 'applicable', width: 180, render: (_: unknown, item: ServiceActionResult) => item.basis || displayQuantity(item.quantity, item.unit) },
    { title: '服务次数', dataIndex: 'frequency', key: 'frequency', width: 190, render: show },
    ...(showsActionHeadcount(category)
      ? [{ title: '配置人数', dataIndex: 'headcount', key: 'headcount', width: 100, render: (value: number) => value === undefined ? '—' : displayStaffingCount(value) }]
      : [
          { title: '全年次数', dataIndex: 'annualFrequency', key: 'annualFrequency', width: 90, render: (value: number | undefined, item: ServiceActionResult) => item.standardStatus === 'pending' || value === undefined ? '—' : (restored ? preciseNumber : wholeNumber).format(value) },
          { title: '全年服务用时', dataIndex: 'annualHours', key: 'annualHours', width: 100, render: (value: number | undefined, item: ServiceActionResult) => item.standardStatus === 'pending' || value === undefined ? '—' : decimalNumber.format(value) },
        ]),
    {
      title: explainedTitle(category === 'assistance' ? '岗位年度费用' : '单项年度费用参考', category === 'assistance'
        ? '本项配置人数按对应岗位人工单价折算。'
        : '本项年工时按对应人工单价折算，修改年频次或年工时后立即变化。'),
      dataIndex: 'annualCost', key: 'annualCost', width: 150, align: 'right' as const, render: (value: number, item: ServiceActionResult) => item.standardStatus === 'pending' ? '待补资料' : category === 'assistance' ? currency.format(value) : workloadCurrency.format(value),
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
    const startedAt = Date.now();
    setGenerationStartedAt(startedAt);
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
      if (created.status !== 'complete') setGeneration(created);

      let latest = created;
      while (latest.status === 'running') {
        const response = await fetch('/api/presentation/jobs/' + created.jobId);
        latest = await response.json() as GenerationJob;
        if (!response.ok) throw new Error(latest.error || '无法获取生成进度');
        if (latest.status === 'running') {
          setGeneration(latest);
          await new Promise((resolve) => window.setTimeout(resolve, 500));
        }
      }
      if (latest.status === 'complete' && latest.fileName && latest.slides) {
        await waitForMinimumDuration(startedAt, ARTIFACT_MINIMUM_MS);
        setGeneration(latest);
        const projectId = storage.getActiveProjectId();
        if (projectId) storage.markPresentationGenerated(projectId, {
          fileName: latest.fileName,
          slides: latest.slides,
          generatedAt: new Date().toISOString(),
        });
      } else setGeneration(latest);
    } catch (error) {
      setGeneration((current) => ({ ...current, status: 'error', error: error instanceof Error ? error.message : 'PPT生成失败' }));
    }
  };

  const workloadDirection = workloadDelta < 0 ? '减少' : '增加';
  const budgetDirection = budgetDelta < 0 ? '减少' : '增加';
  return (
    <main className="workspace-page">
      <div className="result-heading blueprint-rule"><div><Typography.Title level={2}>{result.project.projectName}</Typography.Title><Typography.Paragraph type="secondary">{formatProjectLocation(result.project)} · {gradeLabel(result.project.serviceGrade, result.calculationModel)} · {zhujiang ? '珠江服务标准' : restored ? '原表完整算法 · 区级单价' : COST_BAND_LABELS[result.project.costBand]}</Typography.Paragraph></div><Space wrap>
        <Button icon={<ArrowLeftOutlined />} onClick={onNavigate}>返回修改</Button>
        {editing ? <>
          <Button icon={<CloseOutlined />} onClick={cancelEditing}>取消调整</Button>
          <Button type="primary" icon={<SaveOutlined />} disabled={recalculation.loading || Boolean(recalculation.error)} onClick={saveEditing}>保存调整</Button>
        </> : <>
          <Button disabled={parametersLoading} icon={<EditOutlined />} onClick={()=>restored ? openParameters() : enterEditing()}>{restored ? '调整项目资料' : '调整服务方案'}</Button>
          <BidGenerationButton result={savedResult} />
          <Button type="primary" icon={<FilePptOutlined />} loading={generation.status === 'running'} onClick={generatePresentation}>生成路演PPT</Button>
        </>}
      </Space></div>
      {zhujiang && <Alert type="info" showIcon title={result.standard?.complete ? '费用按已填写资料估算，尚未扣除停车等其他收入。' : '部分项目资料和服务用时尚未填写，以下费用尚不完整。'} action={<Button size="small" onClick={()=>setDataReviewOpen(true)}>查看待补资料</Button>} style={{marginBottom:16}} />}
      {zhujiang && <Typography.Paragraph type="secondary">当前结果：{estimateName(result.budgetBasis)}{result.budgetBasis==='workload'&&!result.standard?.complete?'（数据未齐，仅供参考）':''}</Typography.Paragraph>}
      <section className="metrics-grid">
        <Card className="action-library-card"><Statistic title={zhujiang ? "已测算服务明细" : "标准动作库"} value={zhujiang ? activeActionCount : standardActionCount} suffix={zhujiang?'条':'项'} /><small>{zhujiang ? `另有 ${result.actions.filter(item=>item.standardStatus==='pending').length} 条待补资料` : `当前启用 ${activeActionCount} 项 · 停用 ${disabledActionCount} 项`}{customActionCount > 0 ? ` · 自定义 ${customActionCount} 项` : ''}</small></Card>
        <Card><Statistic title="配置人数" value={totalStaffingCount} suffix="人" />{staffing.sharedText && <small>{staffing.sharedText}</small>}</Card>
        <Card className="cost-card"><Statistic title={explainedTitle(zhujiang ? result.standard?.complete ? '预计年度费用' : '已估算年度费用' : '项目年度用工预算', zhujiang ? '包含当前可计算的人员及服务费用。待补资料涉及的费用尚未完整计入。' : restored ? '按原表各分类的工时、人员折算、取整和附加比例汇总。' : '汇总工作量后按完整岗位人数向上取整，小幅调整时预算可能暂时不变。')} value={result.annualCost} formatter={(value) => wholeNumber.format(Number(value))} prefix="¥" /></Card>
        <Card><Statistic title={explainedTitle('服务成本单价', '当前年度费用除以住宅收费面积和12个月；未计项和其他收入尚未补全。')} value={serviceCostPerSqmMonth ?? '—'} precision={serviceCostPerSqmMonth === null ? undefined : 2} suffix={serviceCostPerSqmMonth === null ? undefined : '元/㎡·月'} /></Card>
      </section>
      {result.version === 2 && <Card className="management-cost-card" size="small"><div><strong>管理人员成本</strong><small>{zhujiang ? staffing.sharedText || '兼岗人员不重复计费' : '单独计入项目总人数和年度用工预算'}</small></div><span><strong>{staffingPresentation(result,result.management.headcount).headcount}人</strong><small>配置人数</small></span><span><strong>{currency.format(result.management.annualCost)}</strong><small>年度成本</small></span></Card>}
      {!zhujiang && <div className="workload-cost-strip">
        <div><strong>工作量折算成本</strong><Tooltip title="全部有效动作的年工作量成本合计，修改动作后立即变化。"><InfoCircleOutlined aria-label="工作量折算成本说明" /></Tooltip></div>
        <span>{currency.format(currentWorkloadCost)}</span>
        <small>{zhujiang ? '动作工时折算费用，供核对服务工作量。' : restored ? '用于观察作业量；项目预算按原表分类汇总，未纳入费用不能视为零。' : '用于观察服务动作调整幅度；最终报价仍以项目年度用工预算为准。'}</small>
      </div>}
      {editing && Math.abs(workloadDelta) > 0.01 && <Alert className="cost-change-alert" type={budgetDelta === 0 ? 'info' : 'success'} showIcon message={budgetDelta === 0
        ? '工作量折算成本' + workloadDirection + ' ' + currency.format(Math.abs(workloadDelta)) + '；完整岗位人数未变化，项目年度用工预算暂未变化。'
        : '工作量折算成本' + workloadDirection + ' ' + currency.format(Math.abs(workloadDelta)) + '；项目年度用工预算同步' + budgetDirection + ' ' + currency.format(Math.abs(budgetDelta)) + '。'} />}
      {recalculation.error && <Alert className="cost-change-alert" type="error" showIcon message={recalculation.error} />}
      <Card className="result-table-card" variant="borderless">
        <div className="table-toolbar"><Tabs activeKey={category} onChange={(key) => { setCategory(key as ActionCategory); setPage(1); }} items={availableCategories.map((key) => { const item = result.categories.find((entry) => entry.category === key)!; return { key, label: displayCategoryTitle(item) + ' ' + item.actionCount }; })} /></div>
        <div className="result-filters"><Space wrap>
          {zhujiang && <Checkbox checked={showPending} onChange={event=>{setShowPending(event.target.checked);setPage(1);}}>查看待补资料的服务</Checkbox>}<Checkbox checked={showZeroValues} onChange={(event) => { setShowZeroValues(event.target.checked); setPage(1); }}>{zhujiang?'查看其他未计费服务':'显示零值'}</Checkbox>
          {!restored && <Checkbox checked={adjustedOnly} onChange={(event) => { setAdjustedOnly(event.target.checked); setDisabledOrCustomOnly(false); setPage(1); }}>只看已调整</Checkbox>}
          {!restored && <Checkbox checked={disabledOrCustomOnly} onChange={(event) => { setDisabledOrCustomOnly(event.target.checked); setAdjustedOnly(false); setPage(1); }}>只看已停用/自定义</Checkbox>}
          {editing && <Button icon={<ReloadOutlined />} onClick={() => setDraftAdjustments(structuredClone(EMPTY_ADJUSTMENTS))}>恢复原测算</Button>}
        </Space><Input allowClear prefix={<SearchOutlined />} placeholder="搜索服务内容或服务次数" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></div>
        <div className="category-summary"><span>{displayCategoryTitle(summary)}已计入 <strong>{summary.actionCount}</strong> 项</span><span>{category==='pestControl'||category==='engineeringOutsourced' ? '专业作业费用单列' : <>配置 <strong>{displayStaffingCount(summary.headcount)}</strong> 人</>}</span><span>年度预算 <strong>{currency.format(summary.annualCost)}</strong></span></div>
        {category !== 'assistance' && <div className="cost-basis-note">{zhujiang ? '下表费用按各项服务用时估算；配置人员的全年费用还涉及完整岗位安排，可能与明细合计不同。' : restored ? '动作成本用于逐项核算；分类预算按原表工时折算、取整和附加比例计算，可能不同于明细成本之和。' : '动作工作量成本用于逐项核算；分类取整用工预算按汇总工时折算完整岗位，不能用表内行成本相加替代。'}{category === 'pestControl' && categoryActions.some(hasSharedWorkloadGroup) ? '四害消杀的共享工作量已按动作分摊。' : ''}</div>}
        {recalculation.loading && <div className="recalculation-state"><LoadingOutlined /> 正在重算</div>}
        {editing
          ? <ActionEditor key={`${category}-${showZeroValues}-${adjustedOnly}-${disabledOrCustomOnly}-${query}`} category={category} actions={actions} adjustments={draftAdjustments} onChange={setDraftAdjustments} />
          : <Table<ServiceActionResult> rowKey="id" size="middle" columns={columns} dataSource={actions} pagination={{ current: page, pageSize: 12, showSizeChanger: false, showTotal: (total) => '共 ' + total + ' 项', onChange: setPage }} scroll={{ x: 1100 }} locale={{ emptyText: '没有匹配的动作' }} />}
      </Card>
      {zhujiang && result.budgetComparison && <Collapse style={{marginTop:16}} items={[{key:'comparison',label:'查看人员配置参考',children:<>
        <Typography.Paragraph>两种估算均采用珠江服务要求：前者按服务面积、户数和岗位要求配置人员；后者按各项服务所需时间估算人员。{!result.standard?.complete&&'目前部分服务资料和用时缺失，按工作量估算的结果尚不完整，不能据此判断可以减少人员或降低收费。'}</Typography.Paragraph>
        <Table rowKey="basis" size="small" pagination={false} scroll={{ x: 640 }} dataSource={(['standard', 'workload'] as const).map(basis => ({ basis, ...result.budgetComparison![basis] }))} columns={[
          { title: '估算依据', key: 'basis', render: (_, row) => <>{estimateName(row.basis)}{row.basis==='workload'&&!result.standard?.complete&&<div><Tag>数据未齐，仅供参考</Tag></div>}</> },
          { title: '预计人数', key: 'headcount', render: (_, row) => `${staffingPresentation(result,row.headcount).headcount} 人` },
          { title: '已估算年度费用', key: 'annualCost', render: (_, row) => currency.format(row.annualCost) },
          { title: '每月每平方米成本', key: 'unitPrice', render: (_, row) => row.unitPrice === null ? '—' : `${decimalNumber.format(row.unitPrice)} 元/㎡·月` },
          { title: '查看结果', key: 'selected', render: (_, row) => <Button type={result.budgetBasis === row.basis ? 'primary' : 'default'} disabled={parametersLoading || result.budgetBasis === row.basis} onClick={() => switchBudget(row.basis)}>{result.budgetBasis === row.basis ? '当前展示' : '查看此结果'}</Button> },
        ]} />
        <Typography.Text type="secondary">两个结果用于比较，费用不相加，均尚未扣除停车等其他收入。</Typography.Text></>}]} />}
      <Modal title="待补资料与费用说明" open={dataReviewOpen} onCancel={()=>setDataReviewOpen(false)} footer={<Button onClick={()=>setDataReviewOpen(false)}>关闭</Button>} width={900}>
        <Typography.Paragraph>服务清单包含不同设施和细分作业，共{standardActionCount}条明细；目前已测算{activeActionCount}条，{result.actions.filter(item=>item.standardStatus==='pending').length}条待补资料，其余为不适用、未开展、已由其他服务或合同承担等情况。明细条数不代表服务档次，也不等于珠江标准条款数。</Typography.Paragraph>
        <Typography.Paragraph>请补充实际数量、作业用时和费用；同一数据只需填一次。确认服务范围后，可能还需补充对应作业时间。</Typography.Paragraph>
        {!!result.missingInputs?.length && <Table rowKey="key" size="small" dataSource={result.missingInputs} pagination={{pageSize:8,showSizeChanger:false}} columns={[
          {title:'需确认内容',dataIndex:'label',render:(value:string)=>customerLabel(value)},
          {title:'填写说明',render:(_,row)=>customerMissingReason(row.key,row.reason)},
          {title:'操作',render:(_,row)=><Button type="link" onClick={()=>{setDataReviewOpen(false);openParameters(row.key);}}>填写</Button>},
        ]} />}
        <Typography.Paragraph type="secondary">珠江要求每2～3个项目配1名会计，费用由各项目分摊。分摊比例可在项目服务设置中调整，会计全年用工费用需填写后才能计入。</Typography.Paragraph>
      </Modal>
      {restored && <WorkbookParametersDrawer focusKey={parameterFocus} missingKeys={result.missingInputs?.map(x=>x.key)} zhujiang={zhujiang} open={parametersOpen} parameters={workbookInputs} overrides={savedResult.project.workbookOverrides ?? EMPTY_WORKBOOK_OVERRIDES} loading={parametersLoading} error={parametersError} onClose={() => { if (!parametersLoading) setParametersOpen(false); }} onSave={applyParameters} />}
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
          <GenerationProgress startedAt={generationStartedAt} durationMs={ARTIFACT_MINIMUM_MS} stages={generationStages} subtitle={savedResult.project.projectName} />
        )}
      </Modal>
    </main>
  );
}
