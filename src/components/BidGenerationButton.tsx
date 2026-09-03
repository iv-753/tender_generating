import { FileTextOutlined, LoadingOutlined } from '@ant-design/icons';
import { Button, Modal, Progress, Result, Space, Steps, Typography } from 'antd';
import { useState } from 'react';
import { storage } from '../storage';
import type { CalculationResult } from '../types';

const stages = [
  { key: 'validating', title: '分析项目数据', description: '确认项目资料与服务动作完整' },
  { key: 'preparing', title: '整理服务方案', description: '汇总项目指标与服务标准' },
  { key: 'binding', title: '编排投标内容', description: '组织项目方案与人员配置' },
  { key: 'exporting', title: '生成投标文件', description: '导出可继续编辑的投标文件' },
] as const;

type Stage = (typeof stages)[number]['key'] | 'complete';
type Job = {
  jobId?: string;
  status: 'idle' | 'running' | 'complete' | 'error';
  stage: Stage;
  fileName?: string;
  actionCount?: number;
  downloadUrl?: string;
  error?: string;
};

function customerFacingError(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  return /模板|占位符|绑定|python/i.test(message) ? '投标文件生成失败，请检查项目资料后重试' : message || '投标文件生成失败，请稍后重试';
}

export default function BidGenerationButton({ result, label = '生成投标标书', onComplete }: { result: CalculationResult; label?: string; onComplete?: () => void }) {
  const [open, setOpen] = useState(false);
  const [job, setJob] = useState<Job>({ status: 'idle', stage: 'validating' });

  const generate = async () => {
    setOpen(true);
    setJob({ status: 'running', stage: 'validating' });
    try {
      const createdResponse = await fetch('/api/bid/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result) });
      const created = await createdResponse.json() as Job;
      if (!createdResponse.ok || !created.jobId) throw new Error(created.error || '无法开始生成投标文件');
      setJob(created);
      let latest = created;
      while (latest.status === 'running') {
        const response = await fetch(`/api/bid/jobs/${created.jobId}`);
        latest = await response.json() as Job;
        if (!response.ok) throw new Error(latest.error || '无法获取生成进度');
        setJob(latest);
        if (latest.status === 'running') await new Promise((resolve) => window.setTimeout(resolve, 500));
      }
      if (latest.status === 'complete' && latest.fileName && latest.downloadUrl) {
        const projectId = storage.getActiveProjectId();
        if (projectId) storage.markBidDocumentGenerated(projectId, {
          fileName: latest.fileName,
          actionCount: latest.actionCount ?? result.totalActionCount,
          downloadUrl: latest.downloadUrl,
          generatedAt: new Date().toISOString(),
        });
        onComplete?.();
      }
    } catch (error) {
      setJob((current) => ({ ...current, status: 'error', error: customerFacingError(error) }));
    }
  };

  const currentStage = job.status === 'complete' ? stages.length : Math.max(0, stages.findIndex((item) => item.key === job.stage));
  return <>
    <Button type="primary" icon={<FileTextOutlined />} loading={job.status === 'running'} onClick={generate}>{label}</Button>
    <Modal className="generation-modal" open={open} title={job.status === 'complete' ? undefined : job.status === 'error' ? '投标文件生成未完成' : '正在生成投标标书'} width={620} centered closable={job.status !== 'running'} mask={{ closable: job.status !== 'running' }} onCancel={() => setOpen(false)} footer={job.status === 'complete' ? <Space><Button onClick={() => setOpen(false)}>返回项目</Button><Button type="primary" icon={<FileTextOutlined />} href={job.downloadUrl} download={job.fileName}>下载标书</Button></Space> : job.status === 'error' ? <Space><Button onClick={() => setOpen(false)}>关闭</Button><Button type="primary" onClick={generate}>重新生成</Button></Space> : null}>
      {job.status === 'complete' ? <Result status="success" title="投标标书已生成" subTitle={<span className="generated-file"><strong>{job.fileName}</strong><span>项目服务方案已整理</span></span>} /> : job.status === 'error' ? <Result status="error" title="生成失败" subTitle={job.error} /> : <div className="generation-progress"><Typography.Paragraph type="secondary">{result.project.projectName}</Typography.Paragraph><Progress percent={currentStage * 25} showInfo={false} strokeColor="#2f7d73" railColor="#e4ecef" /><Steps orientation="vertical" current={currentStage} items={stages.map((item, index) => ({ title: item.title, content: item.description, icon: index === currentStage ? <LoadingOutlined /> : undefined }))} /></div>}
    </Modal>
  </>;
}
