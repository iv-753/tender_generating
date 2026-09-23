import { ArrowLeftOutlined, CloseOutlined, EditOutlined, FilePptOutlined, InfoCircleOutlined, LoadingOutlined, ReloadOutlined, SaveOutlined, SearchOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Checkbox, Collapse, Empty, Input, Modal, Result, Space, Statistic, Table, Tabs, Tag, Tooltip, Typography, message } from 'antd';
import { useEffect, useMemo, useRef, useState } from 'react';

import { calculateAdjustedProject } from '../adjustedCalculator';
import ActionEditor from '../components/ActionEditor';
import BidGenerationButton from '../components/BidGenerationButton';
import GenerationProgress from '../components/GenerationProgress';
import WorkbookParametersDrawer from '../components/WorkbookParametersDrawer';
import { calculateProject, previewWorkbookInputs } from '../workbookCalculator';
import { CATEGORY_ORDER, COST_BAND_LABELS, displayActionName, displayQuantity, displayStaffingCount, gradeLabel, isCompleteModel, showsActionHeadcount } from '../calculation';
import { formatProjectLocation } from '../cityCatalog';
import { storage } from '../storage';
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
  return summary.category === 'assistance' ? '安保' : summary.title;
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
    if (zhujiang && item.standardStatus === 'pending') return true;
    if (item.enabled === false) return showZeroValues && zhujiang;
    return showZeroValues || hasWorkloadOrCost(item);
  });
  const standardActionCount = result.version === 2 ? result.standardActionCount : result.totalActionCount;
  const activeActionCount = result.version === 2 ? result.activeActionCount : result.actions.filter((item) => item.enabled !== false).length;
  const customActionCount = result.actions.filter((item) => item.source === 'custom').length;
  const activeStandardActionCount = result.actions.filter((item) => item.source !== 'custom' && item.enabled !== false).length;
  const disabledActionCount = Math.max(0, standardActionCount - activeStandardActionCount);
  const totalStaffingCount = displayStaffingCount(result.totalHeadcount, result.calculationModel);
  const rawServiceCostPerSqmMonth = result.project.residentialChargeArea > 0 ? result.annualCost / result.project.residentialChargeArea / 12 : null;
  const serviceCostPerSqmMonth = rawServiceCostPerSqmMonth === null ? null : Math.round((rawServiceCostPerSqmMonth + Number.EPSILON) * 100) / 100;
  const currentWorkloadCost = workloadCost(result);
  const savedWorkloadCost = workloadCost(savedResult);
  const workloadDelta = currentWorkloadCost - savedWorkloadCost;
  const budgetDelta = result.annualCost - savedResult.annualCost;
  const workloadEquivalentHeadcount = categoryWorkloadHeadcount(summary, result.actions);
  const columns = [
    { title: '动作', dataIndex: 'action', key: 'action', fixed: 'left' as const, width: 180, render: (value: string) => displayActionName(value) },
    ...(zhujiang ? [{ title: '规则与数据状态', key: 'standard', width: 210, render: (_: unknown, item: ServiceActionResult) => <><Tooltip title={<>{item.standardSource}<br />{item.standardText}<br />{item.standardNote}</>}><Tag color={item.standardStatus === 'pending' ? 'orange' : item.standardStatus === 'excluded' ? 'default' : item.standardStatus === 'manual' ? 'gold' : 'blue'}>{item.standardStatus === 'pending' ? '待补数据' : item.standardStatus === 'covered' ? '合同已覆盖' : item.standardStatus === 'excluded' ? '不计入' : item.standardStatus === 'reference' ? '参考参数' : item.standardStatus === 'manual' ? '项目调整' : '珠江规则'}</Tag></Tooltip><div style={{fontSize:12,color:'#667085'}}>{({fixed:'固定频次',plan:'年度计划',demand:'按需发生',contract:'专业合同',conflict:'原稿冲突',optional:'可选服务',replaced:'已由分项替代',staffing:'岗位排班',unreviewed:'待审核'} as const)[item.ruleKind??'unreviewed']}</div>{item.standardStatus==='pending' && <Button size="small" type="link" onClick={()=>openParameters(result.missingInputs?.find(x=>x.actionIds.includes(item.id))?.key)}>补充数据</Button>}</> }] : []),
    { title: '属性', dataIndex: 'property', key: 'property', width: 120, render: show },
    { title: '适用数量 / 依据', key: 'applicable', width: 180, render: (_: unknown, item: ServiceActionResult) => item.basis || displayQuantity(item.quantity, item.unit) },
    { title: '频次', dataIndex: 'frequency', key: 'frequency', width: 190, render: show },
    ...(showsActionHeadcount(category)
      ? [{ title: '配置人数', dataIndex: 'headcount', key: 'headcount', width: 100, render: (value: number) => value === undefined ? '—' : displayStaffingCount(value) }]
      : [
          { title: '年频次', dataIndex: 'annualFrequency', key: 'annualFrequency', width: 90, render: (value: number | undefined, item: ServiceActionResult) => item.standardStatus === 'pending' || value === undefined ? '—' : (restored ? preciseNumber : wholeNumber).format(value) },
          { title: '年工时', dataIndex: 'annualHours', key: 'annualHours', width: 100, render: (value: number | undefined, item: ServiceActionResult) => item.standardStatus === 'pending' || value === undefined ? '—' : decimalNumber.format(value) },
        ]),
    {
      title: explainedTitle(category === 'assistance' ? '年岗位成本' : '年工作量成本', category === 'assistance'
        ? '本项配置人数按对应岗位人工单价折算。'
        : '本项年工时按对应人工单价折算，修改年频次或年工时后立即变化。'),
      dataIndex: 'annualCost', key: 'annualCost', width: 150, align: 'right' as const, render: (value: number, item: ServiceActionResult) => item.standardStatus === 'pending' ? '待计价' : category === 'assistance' ? currency.format(value) : workloadCurrency.format(value),
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
      <div className="result-heading blueprint-rule"><div><Typography.Title level={2}>{result.project.projectName}</Typography.Title><Typography.Paragraph type="secondary">{formatProjectLocation(result.project)} · {gradeLabel(result.project.serviceGrade, result.calculationModel)} · {zhujiang ? '珠江分级标准 · 区级参考单价' : restored ? '原表完整算法 · 区级单价' : COST_BAND_LABELS[result.project.costBand]}</Typography.Paragraph></div><Space wrap>
        <Button icon={<ArrowLeftOutlined />} onClick={onNavigate}>返回修改</Button>
        {editing ? <>
          <Button icon={<CloseOutlined />} onClick={cancelEditing}>取消调整</Button>
          <Button type="primary" icon={<SaveOutlined />} disabled={recalculation.loading || Boolean(recalculation.error)} onClick={saveEditing}>保存调整</Button>
        </> : <>
          <Button disabled={parametersLoading} icon={<EditOutlined />} onClick={()=>restored ? openParameters() : enterEditing()}>{restored ? '调整项目参数' : '调整服务方案'}</Button>
          <BidGenerationButton result={savedResult} />
          <Button type="primary" icon={<FilePptOutlined />} loading={generation.status === 'running'} onClick={generatePresentation}>生成路演PPT</Button>
        </>}
      </Space></div>
      {restored && <Alert type="info" showIcon title={zhujiang ? result.standard?.complete ? '当前服务成本已量化 · 非收费报价' : '珠江服务成本小计 · 项目数据待补' : '按原表计算的服务预算'} description={zhujiang ? `两套预算独立，不取高、不相加。已分类核对${result.standard?.reviewedActionCount??0}项动作，按固定频次、实际业务、年度计划或合同计算；${result.standard?.pendingActionCount??0}项动作仍待项目数据。费用未计入完整经营开支及其他收入，不能作为盈亏平衡收费价。` : '保留原表的岗位折算、取整和附加比例。服务成本单价不代表完整经营盈亏平衡价；模板数量与历史价格请按项目实际核实。'} style={{ marginBottom: 16 }} />}
      {zhujiang && !result.standard?.revision && <Alert type="warning" showIcon title="这是修正前的历史结果，请打开调整项目参数并应用，重新测算。" style={{ marginBottom: 16 }} />}
      {zhujiang && !!result.missingInputs?.length && <Collapse style={{marginBottom:16}} items={[{key:'missing',label:`待补项目数据 ${result.missingInputs.length} 项 · 点击可定位填写`,children:<Table rowKey="key" size="small" dataSource={result.missingInputs} pagination={{pageSize:8,showSizeChanger:false}} columns={[
        {title:'缺少的数据',dataIndex:'label',key:'label'},
        {title:'原因',dataIndex:'reason',key:'reason'},
        {title:'影响',key:'impact',render:(_,row)=>`${row.actionIds.length} 项动作/配置`},
        {title:'填写',key:'edit',render:(_,row)=><Button type="link" onClick={()=>openParameters(row.key)}>定位参数</Button>},
      ]}/>}]} />}
      {restored && !!result.warnings?.length && <Collapse style={{ marginBottom: 16 }} items={[{ key: 'basis', label: zhujiang ? '标准来源、参考参数与待核实项' : '原表口径与差异说明', children: result.warnings.map((item) => <p key={item}>{item}</p>) }]} />}
      {zhujiang && result.budgetComparison && <Card title="两种预算口径对比" style={{ marginBottom: 16 }}>
        <Alert type="warning" showIcon title="所需物业收费单价：待补充收入及成本分摊" description="下表仅折算服务支出。车库、增值服务等可用于补贴住宅的净收益，以及住宅应承担的成本尚未确认，暂不计算盈亏平衡收费单价。" style={{ marginBottom: 12 }} />
        <Typography.Paragraph type="secondary">配比口径按面积、户数配置人员；工时口径按动作、频次与耗时折算人员。安保值守、外包及管理等共同费用在两套预算中各计一次。下方汇总随所选口径切换并保存。</Typography.Paragraph>
        <Table rowKey="basis" size="small" pagination={false} scroll={{ x: 640 }} dataSource={(['standard', 'workload'] as const).map(basis => ({ basis, ...result.budgetComparison![basis] }))} columns={[
          { title: '预算口径', key: 'basis', render: (_, row) => row.basis === 'standard' ? '珠江配比口径' : '服务工时口径' },
          { title: '配置及分摊人数', key: 'headcount', render: (_, row) => `${displayStaffingCount(row.headcount, result.calculationModel)} 人` },
          { title: '已量化年度费用', key: 'annualCost', render: (_, row) => currency.format(row.annualCost) },
          { title: '小计折算单价', key: 'unitPrice', render: (_, row) => row.unitPrice === null ? '—' : `${decimalNumber.format(row.unitPrice)} 元/㎡·月` },
          { title: '当前采用', key: 'selected', render: (_, row) => <Button type={result.budgetBasis === row.basis ? 'primary' : 'default'} disabled={parametersLoading || result.budgetBasis === row.basis} onClick={() => switchBudget(row.basis)}>{result.budgetBasis === row.basis ? '已采用' : `采用${row.basis === 'standard' ? '配比' : '工时'}口径`}</Button> },
        ]} />
        <Typography.Paragraph style={{ marginTop: 12, marginBottom: 0 }}>工时预算比配比预算{result.budgetComparison.workload.annualCost >= result.budgetComparison.standard.annualCost ? '高' : '低'} {currency.format(Math.abs(result.budgetComparison.workload.annualCost - result.budgetComparison.standard.annualCost))} / 年；差异仅供核对，不直接判定哪套配置正确。</Typography.Paragraph>
      </Card>}
      <section className="metrics-grid">
        <Card className="action-library-card"><Statistic title={zhujiang ? "可核对动作库" : "标准动作库"} value={standardActionCount} suffix="项" /><small>当前启用 {activeActionCount} 项{disabledActionCount > 0 ? ` · ${zhujiang ? '待确认或不适用' : '停用'} ${disabledActionCount} 项` : ''}{customActionCount > 0 ? ` · 自定义 ${customActionCount} 项` : ''}</small></Card>
        <Card><Statistic title={zhujiang ? '配置及分摊人数' : '配置总人数'} value={totalStaffingCount} suffix="人" /></Card>
        <Card className="cost-card"><Statistic title={explainedTitle(zhujiang ? result.standard?.complete ? '年度服务成本' : '年度费用小计（待补数据）' : '项目年度用工预算', zhujiang ? '采用当前所选预算口径，包含管理成本；两套预算不相加。' : restored ? '按原表各分类的工时、人员折算、取整和附加比例汇总。' : '汇总工作量后按完整岗位人数向上取整，小幅调整时预算可能暂时不变。')} value={result.annualCost} formatter={(value) => wholeNumber.format(Number(value))} prefix="¥" /></Card>
        <Card><Statistic title={explainedTitle(zhujiang ? '小计折算单价（非报价）' : '服务成本单价', '当前年度费用除以住宅收费面积和12个月；未计项和其他收入尚未补全。')} value={serviceCostPerSqmMonth ?? '—'} precision={serviceCostPerSqmMonth === null ? undefined : 2} suffix={serviceCostPerSqmMonth === null ? undefined : '元/㎡·月'} /></Card>
      </section>
      {result.version === 2 && <Card className="management-cost-card" size="small"><div><strong>管理人员成本</strong><small>{zhujiang ? '共享会计按比例分摊；兼岗人员不重复计费' : '单独计入项目总人数和年度用工预算'}</small></div><span><strong>{displayStaffingCount(result.management.headcount, result.calculationModel)}人</strong><small>配置人数</small></span><span><strong>{currency.format(result.management.annualCost)}</strong><small>年度成本</small></span></Card>}
      <div className="workload-cost-strip">
        <div><strong>工作量折算成本</strong><Tooltip title="全部有效动作的年工作量成本合计，修改动作后立即变化。"><InfoCircleOutlined aria-label="工作量折算成本说明" /></Tooltip></div>
        <span>{currency.format(currentWorkloadCost)}</span>
        <small>{zhujiang ? '这是动作明细成本合计；上方工时预算还包含岗位取整及管理等费用，两者含义不同。' : restored ? '用于观察作业量；项目预算按原表分类汇总，未纳入费用不能视为零。' : '用于观察服务动作调整幅度；最终报价仍以项目年度用工预算为准。'}</small>
      </div>
      {editing && Math.abs(workloadDelta) > 0.01 && <Alert className="cost-change-alert" type={budgetDelta === 0 ? 'info' : 'success'} showIcon message={budgetDelta === 0
        ? '工作量折算成本' + workloadDirection + ' ' + currency.format(Math.abs(workloadDelta)) + '；完整岗位人数未变化，项目年度用工预算暂未变化。'
        : '工作量折算成本' + workloadDirection + ' ' + currency.format(Math.abs(workloadDelta)) + '；项目年度用工预算同步' + budgetDirection + ' ' + currency.format(Math.abs(budgetDelta)) + '。'} />}
      {recalculation.error && <Alert className="cost-change-alert" type="error" showIcon message={recalculation.error} />}
      <Card className="result-table-card" variant="borderless">
        <div className="table-toolbar"><Tabs activeKey={category} onChange={(key) => { setCategory(key as ActionCategory); setPage(1); }} items={availableCategories.map((key) => { const item = result.categories.find((entry) => entry.category === key)!; return { key, label: displayCategoryTitle(item) + ' ' + item.actionCount }; })} /></div>
        <div className="result-filters"><Space wrap>
          <Checkbox checked={showZeroValues} onChange={(event) => { setShowZeroValues(event.target.checked); setPage(1); }}>显示零值</Checkbox>
          {!restored && <Checkbox checked={adjustedOnly} onChange={(event) => { setAdjustedOnly(event.target.checked); setDisabledOrCustomOnly(false); setPage(1); }}>只看已调整</Checkbox>}
          {!restored && <Checkbox checked={disabledOrCustomOnly} onChange={(event) => { setDisabledOrCustomOnly(event.target.checked); setAdjustedOnly(false); setPage(1); }}>只看已停用/自定义</Checkbox>}
          {editing && <Button icon={<ReloadOutlined />} onClick={() => setDraftAdjustments(structuredClone(EMPTY_ADJUSTMENTS))}>恢复原测算</Button>}
        </Space><Input allowClear prefix={<SearchOutlined />} placeholder="搜索动作、属性、依据或频次" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></div>
        <div className="category-summary"><span>{displayCategoryTitle(summary)}{zhujiang ? '已计入' : '共'} <strong>{summary.actionCount}</strong> 项{zhujiang ? `，待确认 ${categoryActions.filter(a => a.standardStatus === 'pending').length} 项` : ''}</span>{zhujiang && category !== 'pestControl' ? <span>{summary.staffingSource}：配比口径 <strong>{summary.standardHeadcount}</strong> 人 / 工时口径 <strong>{summary.workloadHeadcount}</strong> 人，当前预算 <strong>{summary.headcount}</strong> 人</span> : restored && category === 'pestControl' ? <span>折算兼职 <strong>{preciseNumber.format(summary.headcount)}</strong> 人，不计入配置总人数</span> : <span>工作量相当于 <strong>{workloadEquivalentHeadcount.toFixed(1)}</strong> 人，实际配置 <strong>{displayStaffingCount(summary.headcount)}</strong> 人</span>}<span>年工作量成本 <strong>{currency.format(summary.workloadAnnualCost ?? categoryActions.filter((item) => item.enabled !== false).reduce((sum, item) => sum + item.annualCost, 0))}</strong></span><span>用工预算 <strong>{currency.format(summary.annualCost)}</strong></span></div>
        {category !== 'assistance' && <div className="cost-basis-note">{zhujiang ? '动作明细按工时计价；配比预算按人数计价。不能用明细成本相加替代所选预算。' : restored ? '动作成本用于逐项核算；分类预算按原表工时折算、取整和附加比例计算，可能不同于明细成本之和。' : '动作工作量成本用于逐项核算；分类取整用工预算按汇总工时折算完整岗位，不能用表内行成本相加替代。'}{category === 'pestControl' && categoryActions.some(hasSharedWorkloadGroup) ? '四害消杀的共享工作量已按动作分摊。' : ''}</div>}
        {recalculation.loading && <div className="recalculation-state"><LoadingOutlined /> 正在重算</div>}
        {editing
          ? <ActionEditor key={`${category}-${showZeroValues}-${adjustedOnly}-${disabledOrCustomOnly}-${query}`} category={category} actions={actions} adjustments={draftAdjustments} onChange={setDraftAdjustments} />
          : <Table<ServiceActionResult> rowKey="id" size="middle" columns={columns} dataSource={actions} pagination={{ current: page, pageSize: 12, showSizeChanger: false, showTotal: (total) => '共 ' + total + ' 项', onChange: setPage }} scroll={{ x: 1100 }} locale={{ emptyText: '没有匹配的动作' }} />}
      </Card>
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
