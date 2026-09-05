import type { AdvancedParameterSnapshot, CalculationResult, ProjectData } from './types';

export async function calculateProject(project: ProjectData): Promise<CalculationResult> {
  const response = await fetch('/api/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  });
  const payload = await response.json().catch(() => null) as CalculationResult | { error?: string } | null;
  if (!response.ok) {
    throw new Error(payload && 'error' in payload && payload.error ? payload.error : '测算服务暂不可用，请稍后重试');
  }
  if (!payload || !('totalActionCount' in payload)) throw new Error('测算服务返回了无效结果');
  return payload;
}

export async function previewAdvancedParameters(project: ProjectData): Promise<AdvancedParameterSnapshot[]> {
  const result = await calculateProject(project);
  if (result.version !== 2) throw new Error('当前测算服务暂不支持高级参数');
  return result.advancedParameters;
}
