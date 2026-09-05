import { afterEach, expect, test, vi } from 'vitest';

import { calculateAdjustedProject } from './adjustedCalculator';
import { EXAMPLE_PROJECT } from './exampleProject';

afterEach(() => vi.unstubAllGlobals());

test('posts project adjustments and returns the recalculated result', async () => {
  const result = { version: 1, project: EXAMPLE_PROJECT, actions: [], categories: [], totalActionCount: 0, totalHeadcount: 0, annualCost: 0 };
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(result), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  const adjustments = { version: 1 as const, overrides: { 'service-5': { annualHours: 100 } }, customActions: [] };

  await expect(calculateAdjustedProject(EXAMPLE_PROJECT, adjustments)).resolves.toEqual(result);
  expect(fetchMock).toHaveBeenCalledWith('/api/calculate-adjusted', expect.objectContaining({ method: 'POST' }));
  expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ project: EXAMPLE_PROJECT, adjustments });
});

test('exposes a readable recalculation error', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: '年工时必须为非负数' }), { status: 500 })));
  await expect(calculateAdjustedProject(EXAMPLE_PROJECT, { version: 1, overrides: {}, customActions: [] })).rejects.toThrow('年工时必须为非负数');
});
