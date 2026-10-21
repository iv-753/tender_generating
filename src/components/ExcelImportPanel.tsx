import { CheckCircleOutlined, FileExcelOutlined, LoadingOutlined, RobotOutlined } from '@ant-design/icons';
import { Alert, Button, Collapse, Modal, Table, Tag, Typography, Upload } from 'antd';
import { useMemo, useState } from 'react';
import { COST_BAND_LABELS, gradeLabel } from '../calculation';
import { recognizeExcelFile } from '../excelRecognition';
import { REVENUE_FIELDS } from '../../scripts/calculation/revenue-scenario.mjs';
import { toBuildingTotalProject } from '../../scripts/calculation/building-area-basis.mjs';
import type { CostBand, ExcelRecognitionResult, RecognitionEvidence, RecognizedParameter, ProjectData, ServiceGrade } from '../types';
import GenerationProgress from './GenerationProgress';
import RecognitionIssues from './RecognitionIssues';
import { reuseImportReview, unresolvedImportIssues } from '../../scripts/calculation/import-review.mjs';

type ImportStatus = 'idle' | 'recognizing' | 'review' | 'error' | 'applied';
type Props = { currentProject?: ProjectData; onApply: (result: ExcelRecognitionResult) => void };
type FieldDefinition = { key: string; label: string; unit?: string; format?: 'ratio' | 'grade' | 'costBand' };

const groups: Array<{ title: string; fields: FieldDefinition[] }> = [
  { title: '项目概况', fields: [
    { key: 'projectName', label: '项目名称' }, { key: 'region', label: '省份' }, { key: 'city', label: '城市' }, { key: 'district', label: '区县' },
    { key: 'totalBuildingArea', label: '总建筑面积', unit: '㎡' }, { key: 'residentialChargeArea', label: '住宅收费面积', unit: '㎡' },
    { key: 'deliveredHouseholds', label: '已交付户数', unit: '户' }, { key: 'receivedHouseholds', label: '已收楼户数', unit: '户' }, { key: 'occupiedHouseholds', label: '常住户数', unit: '户' },
  ] },
  { title: '园林概况', fields: [
    { key: 'perimeterEntrances', label: '出入口外围', unit: '㎡' }, { key: 'gatehouses', label: '门楼数', unit: '个' },
    { key: 'pavedRoadArea', label: '道路铺装面积', unit: '㎡' }, { key: 'greenArea', label: '绿化面积', unit: '㎡' },
    { key: 'lawnRatio', label: '草坪比例', format: 'ratio' }, { key: 'seasonalFlowerArea', label: '时花面积', unit: '㎡' }, { key: 'winterProtectionArea', label: '防寒面积', unit: '㎡' },
  ] },
  { title: '地库与测算参数', fields: [
    { key: 'garageFloorArea', label: '单层车库面积', unit: '㎡' }, { key: 'garageFloors', label: '车库层数', unit: '层' },
    { key: 'serviceGrade', label: '服务等级', format: 'grade' }, { key: 'costBand', label: '城市成本档位', format: 'costBand' },
  ] },
];

const buildingFields: FieldDefinition[] = [
  { key: 'buildingCount', label: '楼栋数', unit: '栋' }, { key: 'lobbyElevatorCount', label: '大堂及电梯厅（每栋）', unit: '㎡' },
  { key: 'stiltFloorArea', label: '架空层（每栋）', unit: '㎡' }, { key: 'totalFloors', label: '楼层总数（本组）', unit: '层' },
  { key: 'standardLobbyArea', label: '标准前厅（每层）', unit: '㎡' }, { key: 'evacuationStairArea', label: '疏散楼梯（每栋合计）', unit: '㎡' }, { key: 'rooftopArea', label: '天台（每栋）', unit: '㎡' },
];
const recognitionStages = [
  { title: '读取工作表', description: '解析工作簿内容' },
  { title: '识别项目字段', description: '匹配项目基础信息' },
  { title: '核对单位与口径', description: '检查面积与数量单位' },
  { title: '整理待确认结果', description: '汇总识别结果' },
] as const;

function displayValue(value: unknown, field: FieldDefinition) {
  if (value === null || value === undefined || value === '') return '待补充';
  if (field.format === 'ratio' && typeof value === 'number') return `${new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(value * 100)}%`;
  if (field.format === 'grade') return gradeLabel(value as ServiceGrade);
  if (field.format === 'costBand') return COST_BAND_LABELS[value as CostBand] || '待补充';
  const text = typeof value === 'number' ? new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 2 }).format(value) : String(value);
  return field.unit ? `${text} ${field.unit}` : text;
}

function fieldTag(evidence?: RecognitionEvidence) {
  if (!evidence || evidence.status === 'missing') return <Tag color="gold">待补充</Tag>;
  if (evidence.status === 'needs_confirmation') return <Tag color="orange">请核对</Tag>;
  if (evidence.status === 'derived') return <Tag color="blue">已匹配</Tag>;
  return <Tag color="green">已识别</Tag>;
}

export default function ExcelImportPanel({ onApply, currentProject }: Props) {
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [result, setResult] = useState<ExcelRecognitionResult>();
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [recognitionStartedAt, setRecognitionStartedAt] = useState(0);
  const pendingIssues = result ? unresolvedImportIssues({...result.project,importReviewIssues:result.issues??[]} as ProjectData) : [];
  const recognizedCount = useMemo(() => {
    if (!result) return 0;
    const fields = Object.values(result.recognition.fields);
    const buildings = result.recognition.buildings.flatMap((building) => Object.values(building.fields));
    return [...fields, ...buildings, ...(result.recognition.parameters ?? [])].filter((item) => item.status === 'recognized' || item.status === 'derived').length;
  }, [result]);

  const startRecognition = async (file: File) => {
    setRecognitionStartedAt(Date.now());
    setFileName(file.name);
    setError('');
    setStatus('recognizing');
    try {
      const next = await recognizeExcelFile(file);
      if(currentProject) {
        const project=reuseImportReview(currentProject,toBuildingTotalProject({...next.project,importReviewIssues:next.issues??[]} as ProjectData));
        next.project=project as ExcelRecognitionResult['project'];next.issues=project.importReviewIssues;
      }
      setResult(next);
      setStatus('review');
    } catch (reason) {
      setStatus('error');
      setError(reason instanceof Error ? reason.message : 'Excel识别失败，请重新上传');
    }
  };

  const applyResult = () => {
    if (!result) return;
    onApply(result);
    setStatus('applied');
  };

  return <>
    <section className={`excel-import-panel is-${status}`} aria-label="Excel智能导入">
      <div className="excel-import-mark">{status === 'recognizing' ? <LoadingOutlined spin /> : status === 'applied' ? <CheckCircleOutlined /> : <RobotOutlined />}</div>
      <div className="excel-import-copy">
        <Typography.Text className="panel-kicker">智能录入</Typography.Text>
        <Typography.Title level={4}>Excel 智能导入</Typography.Title>
        {status === 'recognizing'
          ? <><strong>正在识别项目数据</strong><span>先按字段规则匹配，仅未匹配内容交由智能识别。</span></>
          : status === 'applied'
            ? <><strong>{fileName}</strong><span>识别结果已写入表单，请核对后开始测算。</span></>
            : <span>识别项目资料、服务计划、填报人数与费用；对比数据单独保存，不覆盖测算参数。</span>}
      </div>
      <div className="excel-import-action">
        {status === 'recognizing' ? <GenerationProgress
          compact
          startedAt={recognitionStartedAt}
          durationMs={40_000}
          stages={recognitionStages}
          slowAfterMs={30_000}
          slowMessage="表格内容较多，正在继续核对"
        /> : <Upload.Dragger
          accept=".xlsx"
          maxCount={1}
          showUploadList={false}
          beforeUpload={(file) => { void startRecognition(file as File); return Upload.LIST_IGNORE; }}
        >
          <FileExcelOutlined />
          <span>{status === 'applied' || status === 'error' ? '重新上传 Excel' : '选择或拖入 Excel'}</span>
          <small>.xlsx，最大 4MB</small>
        </Upload.Dragger>}
      </div>
    </section>
    {status === 'error' && <Alert className="excel-import-error" type="error" showIcon title={error} />}
    <Modal
      className="recognition-review-modal"
      width={920}
      styles={{ body: { maxHeight: '68vh', overflowY: 'auto', overflowX: 'hidden' } }}
      open={status === 'review'}
      title="识别结果确认"
      transitionName=""
      maskTransitionName=""
      onCancel={() => setStatus('idle')}
      footer={<><Button onClick={() => setStatus('idle')}>取消</Button><Button type="primary" onClick={applyResult}>采用识别结果</Button></>}
    >
      {result && <div className="recognition-review">
        <div className="recognition-summary"><div><FileExcelOutlined /><span><strong>{fileName}</strong><small>{result.provider === 'local-rules' ? '字段规则识别完成' : '字段规则与智能识别完成'}，请确认后写入测算表单</small></span></div><div><strong>{recognizedCount}</strong> 项已识别</div><div className={result.missingFields.length ? 'has-missing' : ''}><strong>{result.missingFields.length}</strong> 项待补充</div></div>
        {result.project.comparisonData && <Collapse items={[{key:'comparison',label:'项目填报人数、费用及服务动作 · 仅用于对比',children:<><p>自有人员：{result.project.comparisonData.personnel?.own.value ?? '待补充'} 人；外包人员：{result.project.comparisonData.personnel?.outsourced.value ?? '待补充'} 人；已填合计：{result.project.comparisonData.personnel?.total ?? '待补充'} 人。</p><p>{result.project.comparisonData.personnel?.kind} · {result.project.comparisonData.period.label}</p><p>费用已填合计：{result.project.comparisonData.cost?.amount == null ? '待补充' : (result.project.comparisonData.cost.amount/10000).toFixed(2)+' 万元'}；{result.project.comparisonData.cost?.kind === 'actual' ? '实际发生' : result.project.comparisonData.cost?.kind === 'budget' ? '预算' : '项目填报'}。原金额与期间随项目保存，结果页按有效月份数展示年化估算。</p><p>采用识别结果即确认本次已映射的服务动作清单；明确不适用项不计入。两列共用清单，不代表实际执行已核验。</p></>}]} />}
        {result.project.revenueScenario && <Collapse items={[{ key: 'revenue', label: '表6收入已识别 · 用于结果页收费试算', children: <div>
          {REVENUE_FIELDS.filter(([key])=>key!=='otherAnnual').map(([key,label])=><p key={key}>{label}：{result.project.revenueScenario?.[key] ?? '待填写'} 元/年</p>)}
          <Typography.Text type="secondary">收入单独用于抵扣和利润试算，不会改变服务成本；可在测算结果页修改。</Typography.Text>
        </div> }]} />}
        {result.warnings.map((warning) => <Alert key={warning} type="warning" showIcon title={warning} />)}
        {!!pendingIssues.length && <section className="recognition-group"><h3>待处理事项（{pendingIssues.length} 项）</h3><Typography.Paragraph type="secondary">采用识别结果后，可在页面中补充缺项、修改数值并确认服务范围；原表位置会保留供核对。</Typography.Paragraph><RecognitionIssues issues={pendingIssues} /></section>}
        {!!result.ignoredSheets?.length && <Typography.Paragraph type="secondary">已忽略：{result.ignoredSheets.join('、')}。{result.ignoredFields?.length ? `另有 ${result.ignoredFields.length} 项不属于本次测算输入或已排除服务范围。` : ''}</Typography.Paragraph>}
        {!!result.recognition.parameters?.length && <Collapse items={[...new Set(result.recognition.parameters.map(p => p.group))].map(group => ({
          key: group, label: `${group}（${result.recognition.parameters!.filter(p => p.group === group).length} 项）`,
          children: <Table<RecognizedParameter> size="small" rowKey="key" pagination={false} scroll={{ x: 600 }} dataSource={result.recognition.parameters!.filter(p => p.group === group)} columns={[
            { title: '测算参数', dataIndex: 'label', width: 210 },
            { title: '采用值', key: 'value', width: 140, render: (_, p) => displayValue(p.value, { key: p.key, label: p.label, unit: p.unit }) },
            { title: '状态', key: 'status', width: 90, render: (_, p) => fieldTag(p) },
            { title: '来源', key: 'source', render: (_, p) => <><div>{p.source ? `${p.source.sheet} · ${p.source.cell}` : '原表未提供'}</div>{p.note && <small>{p.note}</small>}</> },
          ]} />,
        }))} />}
        {groups.map((group) => <section className="recognition-group" key={group.title}><h3>{group.title}</h3><dl>{group.fields.map((field) => {
          const evidence = result.recognition.fields[field.key];
          const value = result.project[field.key as keyof typeof result.project];
          return <div key={field.key}><dt>{field.label}{fieldTag(evidence)}</dt><dd className={value === null ? 'is-missing' : ''}>{displayValue(value, field)}</dd><small>{evidence?.source ? `来源：${evidence.source.sheet}` : '原表未提供'}</small></div>;
        })}</dl></section>)}
        {result.project.buildings.length > 0 && <section className="recognition-group"><h3>楼栋概况</h3>{toBuildingTotalProject(result.project).buildings.map((building, index) => <div className="recognition-building" key={index}><strong>{result.recognition.buildings[index]?.label || `楼栋类型 ${index + 1}`}</strong><dl>{buildingFields.map((field) => {
          const evidence = result.recognition.buildings[index]?.fields[field.key];
          const value = building[field.key as keyof typeof building];
          return <div key={field.key}><dt>{field.label}{fieldTag(evidence)}</dt><dd className={value === null ? 'is-missing' : ''}>{displayValue(value, field)}</dd></div>;
        })}</dl></div>)}</section>}
      </div>}
    </Modal>
  </>;
}
