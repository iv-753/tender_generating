import { Alert, Button, Modal, Upload, message } from 'antd';
import { useState } from 'react';
import { recognizeExcelFile } from '../excelRecognition';
import { storage } from '../storage';
import type { CalculationResult, ExcelRecognitionResult } from '../types';

export default function ComparisonDataImport({ result, disabled, onSaved }: { result: CalculationResult; disabled?: boolean; onSaved: (result: CalculationResult) => void }) {
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState<{ value: ExcelRecognitionResult; projectId: string | null }>();
  const [error, setError] = useState('');
  const data = review?.value.project.comparisonData;
  async function read(file: File) {
    const projectId = storage.getActiveProjectId();
    setLoading(true); setError('');
    try {
      const value = await recognizeExcelFile(file);
      if (!value.project.comparisonData) throw new Error('未识别到可保存的对比资料。');
      setReview({ value, projectId });
    } catch (e) { message.error(e instanceof Error ? e.message : '对比资料读取失败'); }
    finally { setLoading(false); }
    return false;
  }
  function save() {
    if (!data || !review) return;
    try {
      // A comparison-only upload must not silently apply a new service plan.
      const actions = result.project.comparisonData?.actions ?? (data.actions ? { ...data.actions, confirmed: false } : null);
      const next = storage.saveComparisonData({ ...data, actions }, review.projectId);
      onSaved(next); setReview(undefined); message.success('对比资料已保存，测算参数与结果保持不变');
    } catch (e) { setError(e instanceof Error ? e.message : '保存失败'); }
  }
  if (result.project.exampleDataVersion) return null;
  return <>
    <Upload accept=".xlsx" showUploadList={false} beforeUpload={read} disabled={disabled || loading}>
      <Button size="small" loading={loading} disabled={disabled}>{result.project.comparisonData ? '更新对比资料' : '补充对比资料'}</Button>
    </Upload>
    {!result.project.comparisonData && <p className="hc-muted">此历史结果未保存人数及费用来源，请上传原项目资料表补齐；无需重新测算。</p>}
    <Modal title="确认当前项目的对比资料" open={!!review} onCancel={() => setReview(undefined)} onOk={save} okText="保存到当前项目" cancelText="取消">
      <p>当前项目：{result.project.projectName}</p><p>上传表项目：{review?.value.project.projectName ?? '未识别，请核对文件归属'}</p>
      <p>来源：{data?.fileName}；期间：{data?.period.label}</p>
      <p>自有人员：{data?.personnel?.own.value ?? '待补充'} 人；外包人员：{data?.personnel?.outsourced.value ?? '待补充'} 人；已填合计：{data?.personnel?.total ?? '待补充'} 人。</p>
      <p>{data?.personnel?.kind}</p>
      <p>费用原金额：{data?.cost?.amount == null ? '待补充' : (data.cost.amount / 10000).toFixed(2) + ' 万元'}；{data?.cost?.kind === 'actual' ? '实际发生' : data?.cost?.kind === 'budget' ? '预算' : '项目填报'}。不足全年时按有效月份年化展示，保留原金额。</p>
      <p>请确认文件属于当前项目。保存只更新对比资料，不修改人员配置、收入、服务参数或模型成本；服务动作沿用本次测算清单。</p>
      {error && <Alert type="error" title={error} />}
    </Modal>
  </>;
}
