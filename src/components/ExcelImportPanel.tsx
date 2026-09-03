import { CheckCircleOutlined, FileExcelOutlined, LoadingOutlined, RobotOutlined } from '@ant-design/icons';
import { Alert, Button, Modal, Progress, Tag, Typography, Upload } from 'antd';
import { useMemo, useState } from 'react';
import { COST_BAND_LABELS, gradeLabel } from '../calculation';
import { recognizeExcelFile } from '../excelRecognition';
import type { CostBand, ExcelRecognitionResult, RecognitionEvidence, ServiceGrade } from '../types';

type ImportStatus = 'idle' | 'recognizing' | 'review' | 'error' | 'applied';
type Props = { onApply: (result: ExcelRecognitionResult) => void };
type FieldDefinition = { key: string; label: string; unit?: string; format?: 'ratio' | 'grade' | 'costBand' };

const groups: Array<{ title: string; fields: FieldDefinition[] }> = [
  { title: '项目概况', fields: [
    { key: 'projectName', label: '项目名称' }, { key: 'region', label: '项目地区' }, { key: 'city', label: '成本城市' },
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
  { key: 'buildingCount', label: '楼栋数', unit: '栋' }, { key: 'lobbyElevatorCount', label: '大堂/电梯' },
  { key: 'stiltFloorArea', label: '架空层', unit: '㎡' }, { key: 'totalFloors', label: '楼层总数', unit: '层' },
  { key: 'standardLobbyArea', label: '标准前厅', unit: '㎡' }, { key: 'evacuationStairArea', label: '疏散楼梯', unit: '㎡' }, { key: 'rooftopArea', label: '天台', unit: '㎡' },
];

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

export default function ExcelImportPanel({ onApply }: Props) {
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [result, setResult] = useState<ExcelRecognitionResult>();
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const recognizedCount = useMemo(() => {
    if (!result) return 0;
    const fields = Object.values(result.recognition.fields);
    const buildings = result.recognition.buildings.flatMap((building) => Object.values(building.fields));
    return [...fields, ...buildings].filter((item) => item.status !== 'missing').length;
  }, [result]);

  const startRecognition = async (file: File) => {
    setFileName(file.name);
    setError('');
    setStatus('recognizing');
    try {
      const next = await recognizeExcelFile(file);
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
          ? <><strong>正在识别项目数据</strong><span>正在核对工作表与字段口径，通常需要约 1 分钟。</span></>
          : status === 'applied'
            ? <><strong>{fileName}</strong><span>识别结果已写入表单，请核对后开始测算。</span></>
            : <span>上传已有项目资料，自动识别不同表头与数据口径；你也可以继续手动填写。</span>}
      </div>
      <div className="excel-import-action">
        {status === 'recognizing' && <Progress percent={100} showInfo={false} status="active" />}
        <Upload.Dragger
          accept=".xlsx"
          disabled={status === 'recognizing'}
          maxCount={1}
          showUploadList={false}
          beforeUpload={(file) => { void startRecognition(file as File); return Upload.LIST_IGNORE; }}
        >
          <FileExcelOutlined />
          <span>{status === 'applied' || status === 'error' ? '重新上传 Excel' : '选择或拖入 Excel'}</span>
          <small>.xlsx，最大 10MB</small>
        </Upload.Dragger>
      </div>
    </section>
    {status === 'error' && <Alert className="excel-import-error" type="error" showIcon title={error} />}
    <Modal
      className="recognition-review-modal"
      width={920}
      open={status === 'review'}
      title="识别结果确认"
      transitionName=""
      maskTransitionName=""
      onCancel={() => setStatus('idle')}
      footer={<><Button onClick={() => setStatus('idle')}>取消</Button><Button type="primary" onClick={applyResult}>采用识别结果</Button></>}
    >
      {result && <div className="recognition-review">
        <div className="recognition-summary"><div><FileExcelOutlined /><span><strong>{fileName}</strong><small>请确认以下数据，再写入测算表单</small></span></div><div><strong>{recognizedCount}</strong> 项已识别</div><div className={result.missingFields.length ? 'has-missing' : ''}><strong>{result.missingFields.length}</strong> 项待补充</div></div>
        {result.warnings.map((warning) => <Alert key={warning} type="warning" showIcon title={warning} />)}
        {groups.map((group) => <section className="recognition-group" key={group.title}><h3>{group.title}</h3><dl>{group.fields.map((field) => {
          const evidence = result.recognition.fields[field.key];
          const value = result.project[field.key as keyof typeof result.project];
          return <div key={field.key}><dt>{field.label}{fieldTag(evidence)}</dt><dd className={value === null ? 'is-missing' : ''}>{displayValue(value, field)}</dd><small>{evidence?.source ? `来源：${evidence.source.sheet}` : '原表未提供'}</small></div>;
        })}</dl></section>)}
        {result.project.buildings.length > 0 && <section className="recognition-group"><h3>楼栋概况</h3>{result.project.buildings.map((building, index) => <div className="recognition-building" key={index}><strong>{result.recognition.buildings[index]?.label || `楼栋类型 ${index + 1}`}</strong><dl>{buildingFields.map((field) => {
          const evidence = result.recognition.buildings[index]?.fields[field.key];
          const value = building[field.key as keyof typeof building];
          return <div key={field.key}><dt>{field.label}{fieldTag(evidence)}</dt><dd className={value === null ? 'is-missing' : ''}>{displayValue(value, field)}</dd></div>;
        })}</dl></div>)}</section>}
      </div>}
    </Modal>
  </>;
}
