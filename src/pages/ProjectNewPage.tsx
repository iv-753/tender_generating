import { ArrowLeftOutlined, ArrowRightOutlined, DeleteOutlined, FileProtectOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Col, Divider, Form, Input, InputNumber, message, Modal, Row, Select, Space, Steps, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { COST_BAND_LABELS, gradeLabel, isCompleteModel, validateProjectData } from '../calculation';
import { CITY_CATALOG_VERSION, allowedCostBands, cityOptions, getCityRecommendation, normalizeProjectLocation, provinceOptions } from '../cityCatalog';
import ExcelImportPanel from '../components/ExcelImportPanel';
import ImportReviewPanel from '../components/ImportReviewPanel';
import { resolveImportIssue, unresolvedImportIssues } from '../../scripts/calculation/import-review.mjs';
import { toBuildingTotalProject } from '../../scripts/calculation/building-area-basis.mjs';
import type { ReviewDecision } from '../../scripts/calculation/import-review.mjs';
import AdvancedParametersDrawer from '../components/AdvancedParametersDrawer';
import WorkbookParametersDrawer from '../components/WorkbookParametersDrawer';
import { workbookCities, workbookDistricts } from '../workbookLocation';
import GenerationProgress from '../components/GenerationProgress';
import { createZhujiangExampleProject, updateExampleGradePlans } from '../exampleProject';
import { storage } from '../storage';
import type { AdvancedParameterSnapshot, BuildingTypeInput, ExcelRecognitionResult, ProjectData, ServiceGrade, WorkbookInput } from '../types';
import { calculateProject, previewAdvancedParameters, previewWorkbookInputs } from '../workbookCalculator';
import { CALCULATION_MINIMUM_MS, waitForMinimumDuration } from '../progressTiming';

type ProjectNewPageProps = { onNavigate: () => void };
const steps = ['项目概况', '园林概况', '楼栋概况', '地库概况', '测算参数'];
const calculationStages = [
  { title: '校验项目参数', description: '核对面积、户数与服务等级' },
  { title: '匹配服务规则', description: '匹配项目适用的服务动作' },
  { title: '核算人员与成本', description: '汇总工时、岗位与年度预算' },
  { title: '汇总测算结果', description: '整理项目测算结果' },
] as const;
const emptyBuilding: BuildingTypeInput = { buildingCount: 0, lobbyElevatorCount: 0, stiltFloorArea: 0, totalFloors: 0, standardLobbyArea: 0, evacuationStairArea: 0, rooftopArea: 0 };
const numberRules = [{ required: true, message: '请填写数值' }, { type: 'number' as const, min: 0, message: '不能小于 0' }];
const fieldSteps: Record<string, number> = {
  projectName: 0, region: 0, city: 0, district: 0, totalBuildingArea: 0, residentialChargeArea: 0, deliveredHouseholds: 0, receivedHouseholds: 0, occupiedHouseholds: 0,
  perimeterEntrances: 1, gatehouses: 1, pavedRoadArea: 1, greenArea: 1, lawnRatio: 1, seasonalFlowerArea: 1, winterProtectionArea: 1,
  buildings: 2, garageFloorArea: 3, garageFloors: 3, serviceGrade: 4, costBand: 4,
};

function firstMissingStep(fields: string[]) {
  const steps = fields.map((field) => fieldSteps[field.split('[')[0]]).filter((step) => step !== undefined);
  return steps.length ? Math.min(...steps) : undefined;
}

function NumberField({ name, label, suffix }: { name: string | number | (string | number)[]; label: string; suffix?: string }) {
  return <Form.Item name={name} label={label} rules={numberRules}><InputNumber min={0} precision={2} addonAfter={suffix} style={{ width: '100%' }} /></Form.Item>;
}

function profileNumber(value?: number) {
  return value === undefined || value === null ? '—' : value.toLocaleString('zh-CN');
}

export default function ProjectNewPage({ onNavigate }: ProjectNewPageProps) {
  const [form] = Form.useForm<ProjectData>();
  const savedDraft = useMemo(() => storage.loadDraft(), []);
  const draft = useMemo(() => toBuildingTotalProject({ ...normalizeProjectLocation(savedDraft ?? createZhujiangExampleProject()), calculationModel: 'zhujiang-v1' as const }), [savedDraft]);
  const [legacyStairs, setLegacyStairs] = useState(!!savedDraft && !savedDraft.exampleDataVersion && savedDraft.stairAreaBasis !== 'per-building' && savedDraft.buildings.some(b => b.evacuationStairArea > 0));
  const [exampleDataVersion, setExampleDataVersion] = useState(draft.exampleDataVersion);
  const [exampleGrade, setExampleGrade] = useState(draft.serviceGrade);
  const [currentStep, setCurrentStep] = useState(0);
  const [calculating, setCalculating] = useState(false);
  const [calculationStartedAt, setCalculationStartedAt] = useState(0);
  const [error, setError] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [previewingAdvanced, setPreviewingAdvanced] = useState(false);
  const [advancedError, setAdvancedError] = useState('');
  const [advancedParameters, setAdvancedParameters] = useState<AdvancedParameterSnapshot[]>([]);
  const [advancedParameterOverrides, setAdvancedParameterOverrides] = useState<Record<string, number>>(draft.advancedParameterOverrides ?? {});
  const [advancedDirty, setAdvancedDirty] = useState(false);
  const [workbookInputs, setWorkbookInputs] = useState<WorkbookInput[]>([]);
  const [workbookOverrides, setWorkbookOverrides] = useState<Record<string, number | string>>(draft.workbookOverrides ?? {});
  const [importReviewIssues, setImportReviewIssues] = useState(draft.importReviewIssues ?? []);
  const [importedSecurityPosts, setImportedSecurityPosts] = useState(draft.importedSecurityPosts);
  const [comparisonData, setComparisonData] = useState(draft.comparisonData);
  const [confirmedConfiguration,setConfirmedConfiguration] = useState(draft.confirmedConfiguration);
  const [revenueScenario, setRevenueScenario] = useState(draft.revenueScenario);
  const [parameterFocus, setParameterFocus] = useState<string>();
  const watched = Form.useWatch([], form) as Partial<ProjectData> | undefined;
  const reviewProject = { ...draft, ...watched, workbookOverrides, importReviewIssues, revenueScenario, comparisonData, confirmedConfiguration, importedSecurityPosts } as ProjectData;

  const pendingReview = unresolvedImportIssues(reviewProject).filter(issue => issue.kind !== 'missing');
  const province = Form.useWatch('region', form);
  const city = Form.useWatch('city', form);
  const selectedCostBand = Form.useWatch('costBand', form);
  const model = 'zhujiang-v1';
  const restored = isCompleteModel(model);
  const recommendedCostBand = getCityRecommendation(province, city);
  const costBandOptions = allowedCostBands(recommendedCostBand).map((value) => ({ value, label: COST_BAND_LABELS[value] }));

  const getValidProject = async () => {
    const values = await form.validateFields();
    const project = {
      ...values,
      exampleDataVersion,
      calculationModel: 'zhujiang-v1' as const,
      budgetBasis: draft.budgetBasis ?? 'standard',
      workbookOverrides,
      importReviewIssues,
      importedSecurityPosts,
      revenueScenario,
      comparisonData,
      confirmedConfiguration,
      advancedParameterOverrides: Object.keys(advancedParameterOverrides).length ? advancedParameterOverrides : undefined,
    };
    const errors = validateProjectData(project);
    if (errors.length) throw new Error(errors[0]);
    return project;
  };

  const openAdvancedParameters = async (focusKey?: string) => {
    setParameterFocus(focusKey);
    setError('');
    setAdvancedError('');
    let drawerOpened = false;
    try {
      const project = await getValidProject();
      setAdvancedOpen(true);
      drawerOpened = true;
      setPreviewingAdvanced(true);
      if (isCompleteModel(project.calculationModel)) {
        setWorkbookInputs(await previewWorkbookInputs(project));
        return;
      }
      let parameters = await previewAdvancedParameters(project);
      const nextOverrides = Object.fromEntries(Object.entries(advancedParameterOverrides).filter(([key, value]) => {
        const parameter = parameters.find((item) => item.key === key);
        return parameter && Number.isFinite(value) && value >= 0 && value !== parameter.defaultValue;
      }));
      if (Object.keys(nextOverrides).length !== Object.keys(advancedParameterOverrides).length) {
        parameters = await previewAdvancedParameters({ ...project, advancedParameterOverrides: Object.keys(nextOverrides).length ? nextOverrides : undefined });
      }
      setAdvancedParameterOverrides(nextOverrides);
      setAdvancedParameters(parameters);
      setAdvancedDirty(false);
    } catch (reason) {
      const text = reason instanceof Error ? reason.message : '高级参数暂时无法估算，请稍后重试';
      if (drawerOpened) setAdvancedError(text);
      else {
        setError(text);
        message.error(text);
      }
    } finally {
      setPreviewingAdvanced(false);
    }
  };

  const locateReview = (key: string, basic: boolean) => {
    if (!basic) { void openAdvancedParameters(key || undefined); return; }
    setCurrentStep(firstMissingStep([key]) ?? 0);
    const building = key.match(/^buildings\[(\d+)\]\.(\w+)$/);
    requestAnimationFrame(() => form.scrollToField(building ? ['buildings', Number(building[1]), building[2]] : key, { focus: true, block: 'center' }));
  };

  const confirmReview = (key: string, decision: ReviewDecision, value?: number | string) => {
    try {
      const current = { ...reviewProject, ...form.getFieldsValue(true), workbookOverrides, importReviewIssues, importedSecurityPosts };
      const next = resolveImportIssue(current, key, decision, value);
      setWorkbookOverrides(next.workbookOverrides ?? {});
      setImportReviewIssues(next.importReviewIssues ?? []);
      storage.saveDraft({ ...next, exampleDataVersion });
      setError('');
      message.success('已保存本项核对结果');
    } catch (reason) { message.error(reason instanceof Error ? reason.message : '请核对填写值'); }
  };

  const changeAdvancedParameters = (next: Record<string, number>) => {
    setAdvancedParameterOverrides(next);
    setAdvancedDirty(true);
  };


  const closeAdvancedParameters = () => {
    setAdvancedOpen(false);
    if (advancedDirty) message.success('高级参数调整已保存，将用于正式测算');
    setAdvancedDirty(false);
  };

  const saveDraft = async () => {
    try {
      const values = { ...reviewProject, ...form.getFieldsValue(true), workbookOverrides, importReviewIssues, importedSecurityPosts, revenueScenario, comparisonData, confirmedConfiguration, advancedParameterOverrides, exampleDataVersion };
      storage.saveDraft(values);
      message.success('草稿已保存');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '请检查输入');
    }
  };

  const startCalculation = async () => {
    setError('');
    // Preserve partial input and confirmations even when validation fails.
    storage.saveDraft({ ...reviewProject, ...form.getFieldsValue(true), workbookOverrides, importReviewIssues, importedSecurityPosts, revenueScenario, comparisonData, confirmedConfiguration, advancedParameterOverrides, exampleDataVersion });
    const startedAt = Date.now();
    try {
      const pending = unresolvedImportIssues({ ...reviewProject, ...form.getFieldsValue(true), workbookOverrides, importReviewIssues, importedSecurityPosts }).filter(i => i.kind !== 'missing');
      if (pending.length) {
        document.getElementById('import-review')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        throw new Error(`还有 ${pending.length} 项待核对，请在上方逐项修改或确认。`);
      }
      const values = await getValidProject();
      setCalculationStartedAt(startedAt);
      setCalculating(true);
      storage.saveDraft(values);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const result = await calculateProject(values);
      await waitForMinimumDuration(startedAt, CALCULATION_MINIMUM_MS);
      storage.saveCalculatedProject(result);
      setCalculating(false);
      onNavigate();
    } catch (reason) {
      setCalculating(false);
      const fields = (reason as { errorFields?: { name: (string | number)[]; errors: string[] }[] })?.errorFields;
      if (fields?.length) {
        setCurrentStep(firstMissingStep(fields.map(field => String(field.name[0]))) ?? 0);
        requestAnimationFrame(() => form.scrollToField(fields[0].name, { focus: true, block: 'center' }));
      }
      const text = fields?.length ? `还有 ${fields.length} 项基础资料需要补充，已定位到缺项；已填内容和核对结果已保存。` : reason instanceof Error ? reason.message : '测算失败，请稍后重试';
      setError(text);
      message.error(text);
    }
  };

  const applyRecognition = (result: ExcelRecognitionResult) => {
    setConfirmedConfiguration(result.project.confirmedConfiguration ?? undefined);
    setComparisonData(result.project.comparisonData ? { ...result.project.comparisonData, actions: result.project.comparisonData.actions ? {...result.project.comparisonData.actions, confirmed:true} : null } : undefined);
    setImportedSecurityPosts(result.project.importedSecurityPosts ?? undefined);
    form.setFieldsValue(toBuildingTotalProject({ ...result.project, district: result.project.district ?? undefined, calculationModel: 'zhujiang-v1' } as ProjectData));
    setLegacyStairs(false);
    // Importing a real project must not retain hidden demonstration facts or costs.
    setWorkbookOverrides(result.project.workbookOverrides ?? {});
    setRevenueScenario(result.project.revenueScenario);
    setAdvancedParameterOverrides(result.project.advancedParameterOverrides ?? {});
    setExampleDataVersion(undefined);
    setWorkbookInputs([]);
    setImportReviewIssues(result.issues?.filter(issue => issue.kind !== 'missing') ?? []);
    const missingStep = firstMissingStep(result.missingFields);
    if (missingStep !== undefined) setCurrentStep(missingStep);
    setError('');
    message.success(result.missingFields.length ? '识别结果已写入，请补充缺失字段' : '识别结果已写入，请核对后开始测算');
  };

  const loadExample = () => {
    const example = toBuildingTotalProject(createZhujiangExampleProject(form.getFieldValue('serviceGrade') ?? draft.serviceGrade));
    setLegacyStairs(false);
    form.resetFields();
    form.setFieldsValue(example);
    setWorkbookOverrides(example.workbookOverrides ?? {});
    setRevenueScenario(undefined);
    setComparisonData(undefined);
    setConfirmedConfiguration(undefined);
    setAdvancedParameterOverrides({});
    setExampleDataVersion(example.exampleDataVersion);
    setExampleGrade(example.serviceGrade);
    setWorkbookInputs([]);
    setImportReviewIssues([]);
    setImportedSecurityPosts(undefined);
    setError('');
    setAdvancedError('');
    setCurrentStep(0);
    message.success('已载入示例设备、面积、作业用时及费用，可直接测算');
  };

  return (
    <main className="workspace-page">
      {model === 'zhujiang-v1' && <Alert type="info" showIcon title={exampleDataVersion ? '当前为示例数据，仅供体验，请替换为项目实际资料。' : '珠江四档测算 · 请核实项目数据'} description={exampleDataVersion ? undefined : '先填基础资料，再确认设备数量、服务范围、作业时间和人工费用。服务次数按珠江标准带入；也可载入示例数据体验。'} style={{ marginBottom: 16 }} />}
      <div className="page-heading blueprint-rule">
        <div><Typography.Title level={2}>新建物业测算项目</Typography.Title></div>
        <Button onClick={loadExample} disabled={calculating || previewingAdvanced}>载入示例数据</Button>
      </div>
      <ExcelImportPanel onApply={applyRecognition} />
      <ImportReviewPanel project={reviewProject} onResolve={confirmReview} onLocate={locateReview} />
        <div className="input-workspace">
          <aside className="step-rail"><Typography.Text className="panel-kicker">录入进度</Typography.Text><Steps direction="vertical" current={currentStep} items={steps.map((title) => ({ title }))} onChange={setCurrentStep} /></aside>
          <Card className="form-panel" bordered={false}>
            {error && <Alert className="form-alert" type="error" showIcon message={error} closable onClose={() => setError('')} />}
            <Form<ProjectData> form={form} layout="vertical" initialValues={draft} requiredMark="optional" onValuesChange={(changed: Partial<ProjectData>) => {
              if (exampleDataVersion && changed.serviceGrade) {
                const nextGrade = changed.serviceGrade;
                setWorkbookOverrides(current => updateExampleGradePlans(current, exampleGrade, nextGrade));
                setExampleGrade(nextGrade);
              }
            }}>
              <Form.Item name="calculationModel" hidden><Input /></Form.Item>
              <Form.Item name="stairAreaBasis" hidden><Input /></Form.Item>

              <section className={currentStep === 0 ? 'form-section' : 'form-section is-hidden'}>
                <Typography.Title level={4}>01 / 项目概况</Typography.Title>
                <Row gutter={16}>
                  <Col xs={24} md={12}><Form.Item name="projectName" label="项目名称" rules={[{ required: true, whitespace: true, message: '请填写项目名称' }]}><Input placeholder="例如：滨江花园" /></Form.Item></Col>
                  <Col xs={24} md={12}><Form.Item name="region" label="省份" rules={[{ required: true, message: '请选择省份' }]}><Select showSearch optionFilterProp="label" placeholder="请选择省份" options={restored ? [{ value: '广东省', label: '广东省' }] : provinceOptions} disabled={restored} onChange={() => form.setFieldsValue({ city: undefined, costBand: undefined, recommendedCostBand: undefined, costBandSourceVersion: undefined })} /></Form.Item></Col>
                  <Col xs={24} md={8}><Form.Item name="city" label="城市" rules={[{ required: true, message: '请选择城市' }]}><Select showSearch optionFilterProp="label" placeholder={province ? '请选择城市' : '请先选择省份'} disabled={!province} options={restored ? workbookCities : cityOptions(province)} onChange={(nextCity) => { const next = getCityRecommendation(province, nextCity); form.setFieldsValue({ district: undefined, costBand: next, recommendedCostBand: next, costBandSourceVersion: CITY_CATALOG_VERSION }); }} /></Form.Item></Col>
                  {restored && <Col xs={24} md={8}><Form.Item name="district" label="区县" rules={[{ required: true, message: '请选择区县' }]}><Select showSearch optionFilterProp="label" options={workbookDistricts(city)} placeholder="请选择区县" /></Form.Item></Col>}
                  <Col xs={24} md={8}><NumberField name="totalBuildingArea" label="总建筑面积" suffix="㎡" /></Col>
                  <Col xs={24} md={8}><NumberField name="residentialChargeArea" label="住宅收费面积" suffix="㎡" /></Col>
                  <Col xs={24} md={8}><NumberField name="deliveredHouseholds" label="已交付户数" suffix="户" /></Col>
                  <Col xs={24} md={8}><NumberField name="receivedHouseholds" label="已收楼户数" suffix="户" /></Col>
                  <Col xs={24} md={8}><NumberField name="occupiedHouseholds" label="常住户数" suffix="户" /></Col>
                </Row>
              </section>
              <section className={currentStep === 1 ? 'form-section' : 'form-section is-hidden'}>
                <Typography.Title level={4}>02 / 园林概况</Typography.Title>
                <Row gutter={16}>
                  <Col xs={24} md={12}><NumberField name="perimeterEntrances" label="出入口外围" suffix="㎡" /></Col><Col xs={24} md={12}><NumberField name="gatehouses" label="门楼数" suffix="个" /></Col>
                  <Col xs={24} md={12}><NumberField name="pavedRoadArea" label="道路铺装面积" suffix="㎡" /></Col><Col xs={24} md={12}><NumberField name="greenArea" label="绿化面积" suffix="㎡" /></Col>
                  <Col xs={24} md={8}><Form.Item name="lawnRatio" label="草坪比例" rules={[{ required: true, message: '请填写草坪比例' }, { validator: (_, value) => value >= 0 && value <= 1 ? Promise.resolve() : Promise.reject(new Error('请输入 0%—100%')) }]} getValueProps={(value?: number) => ({ value: value === undefined ? undefined : value * 100 })} normalize={(value?: number) => value === undefined || value === null ? value : value / 100}><InputNumber min={0} max={100} addonAfter="%" style={{ width: '100%' }} /></Form.Item></Col>
                  <Col xs={24} md={8}><NumberField name="seasonalFlowerArea" label="时花面积" suffix="㎡" /></Col><Col xs={24} md={8}><NumberField name="winterProtectionArea" label="防寒面积" suffix="㎡" /></Col>
                </Row>
              </section>
              <section className={currentStep === 2 ? 'form-section' : 'form-section is-hidden'}>
                <div className="section-title-row"><Typography.Title level={4}>03 / 楼栋概况</Typography.Title><Typography.Text type="secondary">最多 50 类</Typography.Text></div>
                <Alert type="info" showIcon title="楼梯填写每栋整栋合计面积" description="例如一栋29层楼的楼梯合计1200㎡，直接填1200，不用除以29。本组楼层总数为各栋层数相加；同组楼栋面积不同时请分组填写。" style={{ marginBottom: 16 }} />
                {legacyStairs && <Alert type="warning" showIcon title="旧草稿楼梯面积已按原来的每层口径换算" description={<><p>若你之前填的已经是整栋合计（如1200、1240），请沿用原值，修正重复乘楼层的问题。</p><Space wrap><Button onClick={() => {
                  form.setFieldsValue({ buildings: form.getFieldValue('buildings').map((b: BuildingTypeInput, i: number) => ({ ...b, evacuationStairArea: savedDraft?.buildings[i]?.evacuationStairArea ?? b.evacuationStairArea })) });
                  setLegacyStairs(false);
                  message.success('已沿用原数值作为每栋整栋合计面积，请保存并重新测算');
                }}>原来填的就是整栋合计，沿用原值</Button><Button type="text" onClick={() => setLegacyStairs(false)}>原来填的是每层，保留换算值</Button></Space></>} style={{ marginBottom: 16 }} />}
                <Form.List name="buildings" rules={[{ validator: async (_, value) => { if (!value?.length || value.length > 50) throw new Error('楼栋类型必须为 1—50 类'); } }]}>
                  {(fields, { add, remove }, { errors }) => <>{fields.map((field, index) => <div className="building-block" key={field.key}>
                    <div className="building-heading"><strong>楼栋类型 {index + 1}</strong>{fields.length > 1 && <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(field.name)}>删除</Button>}</div>
                    <Row gutter={12}><Col xs={12} md={6}><NumberField name={[field.name, 'buildingCount']} label="楼栋数" suffix="栋" /></Col><Col xs={12} md={6}><NumberField name={[field.name, 'lobbyElevatorCount']} label="大堂/电梯厅（每栋）" suffix="㎡" /></Col><Col xs={12} md={6}><NumberField name={[field.name, 'stiltFloorArea']} label="架空层（每栋）" suffix="㎡" /></Col><Col xs={12} md={6}><NumberField name={[field.name, 'totalFloors']} label="楼层总数（本组）" suffix="层" /></Col><Col xs={12} md={8}><NumberField name={[field.name, 'standardLobbyArea']} label="标准前厅（每层）" suffix="㎡" /></Col><Col xs={12} md={8}><NumberField name={[field.name, 'evacuationStairArea']} label="疏散楼梯（每栋合计）" suffix="㎡" /></Col><Col xs={12} md={8}><NumberField name={[field.name, 'rooftopArea']} label="天台（每栋）" suffix="㎡" /></Col></Row>
                  </div>)}<Form.ErrorList errors={errors} />{fields.length < 50 && <Button block type="dashed" icon={<PlusOutlined />} onClick={() => add({ ...emptyBuilding })}>添加楼栋类型</Button>}</>}
                </Form.List>
              </section>
              <section className={currentStep === 3 ? 'form-section' : 'form-section is-hidden'}><Typography.Title level={4}>04 / 地库概况</Typography.Title><Row gutter={16}><Col xs={24} md={12}><NumberField name="garageFloorArea" label="单层车库面积" suffix="㎡" /></Col><Col xs={24} md={12}><NumberField name="garageFloors" label="车库层数" suffix="层" /></Col></Row></section>
              <section className={currentStep === 4 ? 'form-section' : 'form-section is-hidden'}>
                <Typography.Title level={4}>05 / 测算参数</Typography.Title>
                <Form.Item name="serviceGrade" label="服务等级" rules={[{ required: true, message: '请选择服务等级' }]}><Select options={(Object.keys({ A: 1, B: 1, C: 1, D: 1 }) as ServiceGrade[]).map((value) => ({ value, label: gradeLabel(value, model) }))} /></Form.Item>
                <Form.Item name="costBand" hidden={restored} label="城市成本档位" rules={[{ required: true, message: '请选择城市成本档位' }]} extra={recommendedCostBand && selectedCostBand ? `系统建议：${COST_BAND_LABELS[recommendedCostBand]}；当前采用：${COST_BAND_LABELS[selectedCostBand]}${selectedCostBand !== recommendedCostBand ? '（已手动调整）' : ''}` : '请先选择省份和城市'}><Select disabled={!recommendedCostBand} options={costBandOptions} /></Form.Item>
                <Form.Item name="recommendedCostBand" hidden><Input /></Form.Item>
                <Form.Item name="costBandSourceVersion" hidden><Input /></Form.Item>
              </section>
              <Divider />
              <div className="form-footer"><Space><Button icon={<ArrowLeftOutlined />} disabled={currentStep === 0} onClick={() => setCurrentStep((value) => value - 1)}>上一步</Button><Button disabled={currentStep === 4} onClick={() => setCurrentStep((value) => value + 1)}>下一步 <ArrowRightOutlined /></Button></Space><Space wrap><Button onClick={saveDraft}>保存草稿</Button><Button loading={previewingAdvanced} onClick={() => void openAdvancedParameters()}>{restored ? '项目服务设置' : '高级参数（可选，系统已估算）'}</Button><Button type="primary" loading={calculating} onClick={startCalculation}>开始测算</Button></Space></div>
            </Form>
          </Card>
          <aside className="profile-panel"><div className="profile-icon"><FileProtectOutlined /></div><Typography.Text className="panel-kicker">实时项目档案</Typography.Text><Typography.Title level={4}>{watched?.projectName || '未命名项目'}</Typography.Title><Typography.Text type="secondary">{[watched?.region, watched?.city, restored ? watched?.district : undefined].filter(Boolean).join(' / ') || '等待录入地区'}</Typography.Text><Divider /><dl className="profile-list"><div><dt>服务等级</dt><dd>{watched?.serviceGrade ? gradeLabel(watched.serviceGrade, model) : '—'}</dd></div><div><dt>{restored ? '采用单价' : '成本档位'}</dt><dd>{restored ? '项目所在地人工参考价' : watched?.costBand ? COST_BAND_LABELS[watched.costBand] : '待选择'}</dd></div><div><dt>总建筑面积</dt><dd>{profileNumber(watched?.totalBuildingArea)} ㎡</dd></div><div><dt>楼栋类型</dt><dd>{watched?.buildings?.length ?? 0} 类</dd></div><div><dt>常住户数</dt><dd>{profileNumber(watched?.occupiedHouseholds)} 户</dd></div></dl></aside>
        </div>
      {restored ? <WorkbookParametersDrawer zhujiang={model === 'zhujiang-v1'} open={advancedOpen} loading={previewingAdvanced} error={advancedError} parameters={workbookInputs} overrides={workbookOverrides} focusKey={parameterFocus} reviewCount={pendingReview.length} onReview={() => { setAdvancedOpen(false); document.getElementById('import-review')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} onClose={() => setAdvancedOpen(false)} onSave={(next) => { setWorkbookOverrides(next); setAdvancedOpen(false); setError(''); storage.saveDraft({ ...reviewProject, ...form.getFieldsValue(true), workbookOverrides: next, importReviewIssues, importedSecurityPosts, comparisonData, exampleDataVersion }); message.success('计算参数已保存，将用于正式测算'); }} /> : <AdvancedParametersDrawer open={advancedOpen} loading={previewingAdvanced} error={advancedError} parameters={advancedParameters} overrides={advancedParameterOverrides} onClose={closeAdvancedParameters} onChange={changeAdvancedParameters} />}
      <Modal className="generation-modal" open={calculating} title="正在生成测算方案" width={620} centered closable={false} mask={{ closable: false }} footer={null}>
        <GenerationProgress startedAt={calculationStartedAt} durationMs={CALCULATION_MINIMUM_MS} stages={calculationStages} subtitle={watched?.projectName || '当前项目'} />
      </Modal>
    </main>
  );
}
