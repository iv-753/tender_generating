import type { CalculationAdjustments, CalculationResult, ProjectData } from './types';

export async function calculateAdjustedProject(
  project: ProjectData,
  adjustments: CalculationAdjustments,
): Promise<CalculationResult> {
  const response = await fetch('/api/calculate-adjusted', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project, adjustments }),
  });
  const payload = await response.json().catch(() => null) as CalculationResult | { error?: string } | null;
  if (!response.ok || !payload || !('version' in payload)) {
    throw new Error(payload && 'error' in payload && payload.error ? payload.error : '调整方案重算失败');
  }
  return payload;
}
