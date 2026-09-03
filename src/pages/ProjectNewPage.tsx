import { ArrowLeftOutlined, ArrowRightOutlined, DeleteOutlined, FileProtectOutlined, PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Col, Divider, Form, Input, InputNumber, message, Row, Select, Space, Spin, Steps, Typography } from 'antd';
import { useMemo, useState } from 'react';
import { COST_BAND_LABELS, gradeLabel, inferCostBand, validateProjectData } from '../calculation';
import { EXAMPLE_PROJECT } from '../exampleProject';
import { storage } from '../storage';
import type { BuildingTypeInput, CostBand, ProjectData, ServiceGrade } from '../types';
import { calculateProject } from '../workbookCalculator';

type ProjectNewPageProps = { onNavigate: () => void };
const steps = ['项目概况', '园林概况', '楼栋概况', '地库概况', '测算参数'];
const emptyBuilding: BuildingTypeInput = { buildingCount: 0, lobbyElevatorCount: 0, stiltFloorArea: 0, totalFloors: 0, standardLobbyArea: 0, evacuationStairArea: 0, rooftopArea: 0 };
const numberRules = [{ required: true, message: '请填写数值' }, { type: 'number' as const, min: 0, message: '不能小于 0' }];

function NumberField({ name, label, suffix }: { name: string | number | (string | number)[]; label: string; suffix?: string }) {
  return <Form.Item name={name} label={label} rules={numberRules}><InputNumber min={0} precision={2} addonAfter={suffix} style={{ width: '100%' }} /></Form.Item>;
}

function profileNumber(value?: number) {
  return value === undefined || value === null ? '—' : value.toLocaleString('zh-CN');
}

export default function ProjectNewPage({ onNavigate }: ProjectNewPageProps) {
  const [form] = Form.useForm<ProjectData>();
  const [currentStep, setCurrentStep] = useState(0);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState('');
  const draft = useMemo(() => storage.loadDraft() ?? EXAMPLE_PROJECT, []);
  const watched = Form.useWatch([], form) as Partial<ProjectData> | undefined;

  const fillExample = () => {
    form.setFieldsValue(structuredClone(EXAMPLE_PROJECT));
    setError('');
    message.success('已填入当前模型示例数据');
  };

  const getValidProject = async () => {
    const values = await form.validateFields();
    const errors = validateProjectData(values);
    if (errors.length) throw new Error(errors[0]);
    return values;
  };

  const saveDraft = async () => {
    try {
      const values = await getValidProject();
      storage.saveDraft(values);
      message.success('草稿已保存到当前浏览器');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '请检查输入');
    }
  };

  const startCalculation = async () => {
    setError('');
    try {
      const values = await getValidProject();
      setCalculating(true);
      storage.saveDraft(values);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      storage.saveCalculatedProject(await calculateProject(values));
      onNavigate();
    } catch (reason) {
      const text = reason instanceof Error ? reason.message : '测算失败，请稍后重试';
      setError(text);
      message.error(text);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <main className="workspace-page">
      <div className="page-heading blueprint-rule">
        <div><Typography.Text className="eyebrow">PROPERTY COSTING / V1</Typography.Text><Typography.Title level={2}>新建物业测算项目</Typography.Title><Typography.Paragraph type="secondary">录入项目边界，调用本地模型生成 122 项服务动作测算。</Typography.Paragraph></div>
        <div className="status-chip"><span />模型就绪</div>
      </div>
      <Spin spinning={calculating} tip="正在浏览器内重算模型，请稍候…" size="large">
        <div className="input-workspace">
          <aside className="step-rail"><Typography.Text className="panel-kicker">录入进度</Typography.Text><Steps direction="vertical" current={currentStep} items={steps.map((title) => ({ title }))} onChange={setCurrentStep} /></aside>
          <Card className="form-panel" bordered={false}>
            {error && <Alert className="form-alert" type="error" showIcon message={error} closable onClose={() => setError('')} />}
            <Form<ProjectData> form={form} layout="vertical" initialValues={draft} requiredMark="optional" onValuesChange={(changed) => { if ('city' in changed) form.setFieldValue('costBand', inferCostBand(String(changed.city ?? ''))); }}>
              <section className={currentStep === 0 ? 'form-section' : 'form-section is-hidden'}>
                <Typography.Title level={4}>01 / 项目概况</Typography.Title>
                <Row gutter={16}>
                  <Col xs={24} md={12}><Form.Item name="projectName" label="项目名称" rules={[{ required: true, whitespace: true, message: '请填写项目名称' }]}><Input placeholder="例如：滨江花园" /></Form.Item></Col>
                  <Col xs={24} md={12}><Form.Item name="region" label="项目地区" rules={[{ required: true, whitespace: true, message: '请填写项目地区' }]}><Input placeholder="省 / 市 / 区" /></Form.Item></Col>
                  <Col xs={24} md={8}><Form.Item name="city" label="成本城市" rules={[{ required: true, whitespace: true, message: '请填写城市' }]}><Input placeholder="例如：广州" /></Form.Item></Col>
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
                <Form.Item name="costBand" label="城市成本档位" rules={[{ required: true, message: '未知城市必须手动选择成本档位' }]}><Select placeholder="未知城市请手动选择" options={(Object.keys(COST_BAND_LABELS) as CostBand[]).map((value) => ({ value, label: COST_BAND_LABELS[value] }))} /></Form.Item>
              </section>
              <Divider />
              <div className="form-footer"><Space><Button icon={<ArrowLeftOutlined />} disabled={currentStep === 0} onClick={() => setCurrentStep((value) => value - 1)}>上一步</Button><Button disabled={currentStep === 4} onClick={() => setCurrentStep((value) => value + 1)}>下一步 <ArrowRightOutlined /></Button></Space><Space wrap><Button onClick={fillExample}>填入示例数据</Button><Button onClick={saveDraft}>保存草稿</Button><Button type="primary" loading={calculating} onClick={startCalculation}>开始测算</Button></Space></div>
            </Form>
          </Card>
          <aside className="profile-panel"><div className="profile-icon"><FileProtectOutlined /></div><Typography.Text className="panel-kicker">实时项目档案</Typography.Text><Typography.Title level={4}>{watched?.projectName || '未命名项目'}</Typography.Title><Typography.Text type="secondary">{watched?.region || '等待录入地区'}</Typography.Text><Divider /><dl className="profile-list"><div><dt>服务等级</dt><dd>{watched?.serviceGrade ? gradeLabel(watched.serviceGrade) : '—'}</dd></div><div><dt>成本档位</dt><dd>{watched?.costBand ? COST_BAND_LABELS[watched.costBand] : '待选择'}</dd></div><div><dt>总建筑面积</dt><dd>{profileNumber(watched?.totalBuildingArea)} ㎡</dd></div><div><dt>楼栋类型</dt><dd>{watched?.buildings?.length ?? 0} 类</dd></div><div><dt>常住户数</dt><dd>{profileNumber(watched?.occupiedHouseholds)} 户</dd></div></dl></aside>
        </div>
      </Spin>
    </main>
  );
}
