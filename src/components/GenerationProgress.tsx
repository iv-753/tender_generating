import { LoadingOutlined } from '@ant-design/icons';
import { Progress, Steps, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';

import { progressSnapshot } from '../progressTiming';

export type GenerationStage = { title: string; description: string };

type Props = {
  startedAt: number;
  durationMs: number;
  stages: readonly GenerationStage[];
  subtitle?: string;
  slowAfterMs?: number;
  slowMessage?: string;
  compact?: boolean;
};

export default function GenerationProgress({ startedAt, durationMs, stages, subtitle, slowAfterMs, slowMessage, compact = false }: Props) {
  const [elapsedMs, setElapsedMs] = useState(() => Math.max(0, Date.now() - startedAt));

  useEffect(() => {
    const update = () => setElapsedMs(Math.max(0, Date.now() - startedAt));
    update();
    const timer = globalThis.setInterval(update, 100);
    return () => globalThis.clearInterval(timer);
  }, [startedAt]);

  const snapshot = useMemo(() => progressSnapshot(elapsedMs, durationMs, stages.length), [durationMs, elapsedMs, stages.length]);
  const activeStage = stages[snapshot.stage];
  const showSlowMessage = slowAfterMs !== undefined && elapsedMs >= slowAfterMs && slowMessage;

  return <div className={`generation-progress${compact ? ' is-compact' : ''}`} aria-live="polite">
    {subtitle && <Typography.Paragraph type="secondary">{subtitle}</Typography.Paragraph>}
    <Progress percent={snapshot.percent} showInfo={false} status="active" strokeColor="#2f7d73" railColor="#e4ecef" />
    {compact ? <div className="compact-progress-stage" key={snapshot.stage}>
      <LoadingOutlined />
      <span><strong>{activeStage.title}</strong><small>{activeStage.description}</small></span>
    </div> : <Steps
      orientation="vertical"
      current={snapshot.stage}
      items={stages.map((item) => ({ title: item.title, content: item.description }))}
    />}
    {showSlowMessage && <div className="generation-slow-message">{slowMessage}</div>}
  </div>;
}
