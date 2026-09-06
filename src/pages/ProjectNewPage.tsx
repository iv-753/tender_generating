import { ArrowLeftOutlined, ArrowRightOutlined, DeleteOutlined, FileProtectOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Col, Divider, Form, Input, InputNumber, message, Modal, Row, Select, Space, Steps, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { COST_BAND_LABELS, gradeLabel, validateProjectData } from '../calculation';
import { CITY_CATALOG_VERSION, allowedCostBands, cityOptions, getCityRecommendation, normalizeProjectLocation, provinceOptions } from '../cityCatalog';
import ExcelImportPanel from '../components/ExcelImportPanel';
import AdvancedParametersDrawer from '../components/AdvancedParametersDrawer';
import GenerationProgress from '../components/GenerationProgress';
import { EXAMPLE_PROJECT } from '../exampleProject';
import { storage } from '../storage';
import type { AdvancedParameterSnapshot, BuildingTypeInput, ExcelRecognitionResult, ProjectData, ServiceGrade } from '../types';
import { calculateProject, previewAdvancedParameters } from '../workbookCalculator';
import { CALCULATION_MINIMUM_MS, waitForMinimumDuration } from '../progressTiming';

type ProjectNewPageProps = { onNavigate: () => void };
const steps = ['项目概况', '园林概况', '楼栋概况', '地库概况', '测算参数'];
const calculationStages = [
  { title: '校验项目参数', description: '核对面积、户数与服务等级' },
  { title: '匹配服务规则', description: '匹配项目适用的服务动作' },
  { title: '核算人员与成本', description: '汇总工时、岗位与年度预算' },
  { title: '生成测算方案', description: '整理项目测算结果' },
] as const;
const emptyBuilding: BuildingTypeInput = { buildingCount: 0, lobbyElevatorCount: 0, stiltFloorArea: 0, totalFloors: 0, standardLobbyArea: 0, evacuationStairArea: 0, rooftopArea: 0 };
const numberRules = [{ required: true, message: '请填写数值' }, { type: 'number' as const, min: 0, message: '不能小于 0' }];
const fieldSteps: Record<string, number> = {
  projectName: 0, region: 0, city: 0, totalBuildingArea: 0, residentialChargeArea: 0, deliveredHouseholds: 0, receivedHouseholds: 0, occupiedHouseholds: 0,
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
  const draft = useMemo(() => normalizeProjectLocation(storage.loadDraft() ?? EXAMPLE_PROJECT), []);
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
  const watched = Form.useWatch([], form) as Partial<ProjectData> | undefined;
  const province = Form.useWatch('region', form);
  const city = Form.useWatch('city', form);
  const selectedCostBand = Form.useWatch('costBand', form);
  const recommendedCostBand = getCityRecommendation(province, city);
  const costBandOptions = allowedCostBands(recommendedCostBand).map((value) => ({ value, label: COST_BAND_LABELS[value] }));

  const getValidProject = async () => {
    const values = await form.validateFields();
    const project = {
      ...values,
      advancedParameterOverrides: Object.keys(advancedParameterOverrides).length ? advancedParameterOverrides : undefined,
    };
    const errors = validateProjectData(project);
    if (errors.length) throw new Error(errors[0]);
    return project;
  };

  const openAdvancedParameters = async () => {
    setError('');
    setAdvancedError('');
    let drawerOpened = false;
    try {
      const project = await getValidProject();
      setAdvancedOpen(true);
      drawerOpened = true;
      setPreviewingAdvanced(true);
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
      const values = await getValidProject();
      storage.saveDraft(values);
      message.success('草稿已保存');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '请检查输入');
    }
  };

  const startCalculation = async () => {
    setError('');
    const startedAt = Date.now();
    try {
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
      const text = reason instanceof Error ? reason.message : '测算失败，请稍后重试';
      setError(text);
      message.error(text);
    }
  };

  const applyRecognition = (result: ExcelRecognitionResult) => {
    form.setFieldsValue(result.project as unknown as ProjectData);
    const missingStep = firstMissingStep(result.missingFields);
    if (missingStep !== undefined) setCurrentStep(missingStep);
    setError('');
    message.success(result.missingFields.length ? '识别结果已写入，请补充缺失字段' : '识别结果已写入，请核对后开始测算');
  };

  return (
    <main className="workspace-page">
      <div className="page-heading blueprint-rule">
        <div><Typography.Title level={2}>新建物业测算项目</Typography.Title><Typography.Paragraph type="secondary">录入项目基础信息，生成服务方案、人员配置与成本测算。</Typography.Paragraph></div>
      </div>
      <ExcelImportPanel onApply={applyRecognition} />
        <div className="input-workspace">
          <aside className="step-rail"><Typography.Text className="panel-kicker">录入进度</Typography.Text><Steps direction="vertical" current={currentStep} items={steps.map((title) => ({ title }))} onChange={setCurrentStep} /></aside>
          <Card className="form-panel" bordered={false}>
            {error && <Alert className="form-alert" type="error" showIcon message={error} closable onClose={() => setError('')} />}
            <Form<ProjectData> form={form} layout="vertical" initialValues={draft} requiredMark="optional">
              <section className={currentStep === 0 ? 'form-section' : 'form-section is-hidden'}>
                <Typography.Title level={4}>01 / 项目概况</Typography.Title>
                <Row gutter={16}>
                  <Col xs={24} md={12}><Form.Item name="projectName" label="项目名称" rules={[{ required: true, whitespace: true, message: '请填写项目名称' }]}><Input placeholder="例如：滨江花园" /></Form.Item></Col>
                  <Col xs={24} md={12}><Form.Item name="region" label="省份" rules={[{ required: true, message: '请选择省份' }]}><Select showSearch optionFilterProp="label" placeholder="请选择省份" options={provinceOptions} onChange={() => form.setFieldsValue({ city: undefined, costBand: undefined, recommendedCostBand: undefined, costBandSourceVersion: undefined })} /></Form.Item></Col>
                  <Col xs={24} md={8}><Form.Item name="city" label="城市" rules={[{ required: true, message: '请选择城市' }]}><Select showSearch optionFilterProp="label" placeholder={province ? '请选择城市' : '请先选择省份'} disabled={!province} options={cityOptions(province)} onChange={(nextCity) => { const next = getCityRecommendation(province, nextCity); form.setFieldsValue({ costBand: next, recommendedCostBand: next, costBandSourceVersion: CITY_CATALOG_VERSION }); }} /></Form.Item></Col>
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
                <div className="section-title-row"><Typography.Title level={4}>03 / 楼栋概况</Typography.Title><Typography.Text type="secondary">最多 5 类</Typography.Text></div>
                <Form.List name="buildings" rules={[{ validator: async (_, value) => { if (!value?.length || value.length > 5) throw new Error('楼栋类型必须为 1—5 类'); } }]}>
                  {(fields, { add, remove }, { errors }) => <>{fields.map((field, index) => <div className="building-block" key={field.key}>
                    <div className="building-heading"><strong>楼栋类型 {index + 1}</strong>{fields.length > 1 && <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(field.name)}>删除</Button>}</div>
                    <Row gutter={12}><Col xs={12} md={6}><NumberField name={[field.name, 'buildingCount']} label="楼栋数" suffix="栋" /></Col><Col xs={12} md={6}><NumberField name={[field.name, 'lobbyElevatorCount']} label="大堂/电梯" /></Col><Col xs={12} md={6}><NumberField name={[field.name, 'stiltFloorArea']} label="架空层" suffix="㎡" /></Col><Col xs={12} md={6}><NumberField name={[field.name, 'totalFloors']} label="楼层总数" suffix="层" /></Col><Col xs={12} md={8}><NumberField name={[field.name, 'standardLobbyArea']} label="标准前厅" suffix="㎡" /></Col><Col xs={12} md={8}><NumberField name={[field.name, 'evacuationStairArea']} label="疏散楼梯" suffix="㎡" /></Col><Col xs={12} md={8}><NumberField name={[field.name, 'rooftopArea']} label="天台" suffix="㎡" /></Col></Row>
                  </div>)}<Form.ErrorList errors={errors} />{fields.length < 5 && <Button block type="dashed" icon={<PlusOutlined />} onClick={() => add({ ...emptyBuilding })}>添加楼栋类型</Button>}</>}
                </Form.List>
              </section>
              <section className={currentStep === 3 ? 'form-section' : 'form-section is-hidden'}><Typography.Title level={4}>04 / 地库概况</Typography.Title><Row gutter={16}><Col xs={24} md={12}><NumberField name="garageFloorArea" label="单层车库面积" suffix="㎡" /></Col><Col xs={24} md={12}><NumberField name="garageFloors" label="车库层数" suffix="层" /></Col></Row></section>
              <section className={currentStep === 4 ? 'form-section' : 'form-section is-hidden'}>
                <Typography.Title level={4}>05 / 测算参数</Typography.Title>
                <Form.Item name="serviceGrade" label="服务等级" rules={[{ required: true, message: '请选择服务等级' }]}><Select options={(Object.keys({ A: 1, B: 1, C: 1, D: 1 }) as ServiceGrade[]).map((value) => ({ value, label: gradeLabel(value) }))} /></Form.Item>
                <Form.Item name="costBand" label="城市成本档位" rules={[{ required: true, message: '请选择城市成本档位' }]} extra={recommendedCostBand && selectedCostBand ? `系统建议：${COST_BAND_LABELS[recommendedCostBand]}；当前采用：${COST_BAND_LABELS[selectedCostBand]}${selectedCostBand !== recommendedCostBand ? '（已手动调整）' : ''}` : '请先选择省份和城市'}><Select disabled={!recommendedCostBand} options={costBandOptions} /></Form.Item>
                <Form.Item name="recommendedCostBand" hidden><Input /></Form.Item>
                <Form.Item name="costBandSourceVersion" hidden><Input /></Form.Item>
              </section>
              <Divider />
              <div className="form-footer"><Space><Button icon={<ArrowLeftOutlined />} disabled={currentStep === 0} onClick={() => setCurrentStep((value) => value - 1)}>上一步</Button><Button disabled={currentStep === 4} onClick={() => setCurrentStep((value) => value + 1)}>下一步 <ArrowRightOutlined /></Button></Space><Space wrap><Button onClick={saveDraft}>保存草稿</Button><Button loading={previewingAdvanced} onClick={openAdvancedParameters}>高级参数（可选，系统已估算）</Button><Button type="primary" loading={calculating} onClick={startCalculation}>开始测算</Button></Space></div>
            </Form>
          </Card>
          <aside className="profile-panel"><div className="profile-icon"><FileProtectOutlined /></div><Typography.Text className="panel-kicker">实时项目档案</Typography.Text><Typography.Title level={4}>{watched?.projectName || '未命名项目'}</Typography.Title><Typography.Text type="secondary">{watched?.region || '等待录入地区'}</Typography.Text><Divider /><dl className="profile-list"><div><dt>服务等级</dt><dd>{watched?.serviceGrade ? gradeLabel(watched.serviceGrade) : '—'}</dd></div><div><dt>成本档位</dt><dd>{watched?.costBand ? COST_BAND_LABELS[watched.costBand] : '待选择'}</dd></div><div><dt>总建筑面积</dt><dd>{profileNumber(watched?.totalBuildingArea)} ㎡</dd></div><div><dt>楼栋类型</dt><dd>{watched?.buildings?.length ?? 0} 类</dd></div><div><dt>常住户数</dt><dd>{profileNumber(watched?.occupiedHouseholds)} 户</dd></div></dl></aside>
        </div>
      <AdvancedParametersDrawer open={advancedOpen} loading={previewingAdvanced} error={advancedError} parameters={advancedParameters} overrides={advancedParameterOverrides} onClose={closeAdvancedParameters} onChange={changeAdvancedParameters} />
      <Modal className="generation-modal" open={calculating} title="正在生成测算方案" width={620} centered closable={false} mask={{ closable: false }} footer={null}>
        <GenerationProgress startedAt={calculationStartedAt} durationMs={CALCULATION_MINIMUM_MS} stages={calculationStages} subtitle={watched?.projectName || '当前项目'} />
      </Modal>
    </main>
  );
}
