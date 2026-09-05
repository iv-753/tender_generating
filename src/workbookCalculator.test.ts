import { afterEach, expect, test, vi } from 'vitest';

import { EXAMPLE_PROJECT } from './exampleProject';
import { previewAdvancedParameters } from './workbookCalculator';

afterEach(() => vi.unstubAllGlobals());

test('previews only advanced parameters through the existing calculation service', async () => {
  const advancedParameters = [{ key: 'basement.fireShutterCount', label: '地下停车区防火卷帘数量', group: 'basement' as const, unit: '个', defaultValue: 252, value: 252, source: 'template' as const, affectedActionIds: ['engineering-routine-6'] }];
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
    version: 2,
    calculatedAt: '2026-09-05T00:00:00.000Z',
    project: EXAMPLE_PROJECT,
    totalActionCount: 452,
    totalHeadcount: 1,
    annualCost: 1,
    categories: [],
    actions: [],
    advancedParameterVersion: 'test',
    advancedParameters,
    standardActionCount: 452,
    activeActionCount: 452,
    management: { headcount: 1, annualCost: 1 },
  }), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);

  await expect(previewAdvancedParameters(EXAMPLE_PROJECT)).resolves.toEqual(advancedParameters);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(fetchMock.mock.calls[0][0]).toBe('/api/calculate');
});
