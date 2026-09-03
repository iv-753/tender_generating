import { describe, expect, test } from 'vitest';
import {
  ACTION_COUNTS,
  COST_BAND_FACTORS,
  gradeLabel,
  inferCostBand,
  validateProjectData,
} from './calculation';
import { EXAMPLE_PROJECT } from './exampleProject';

describe('property calculation rules', () => {
  test('keeps the frozen service-grade display mapping outside the UI', () => {
    expect(gradeLabel('A')).toBe('A 级｜最高服务档次');
    expect(gradeLabel('D')).toBe('D 级｜基础服务');
    expect(gradeLabel('A')).not.toContain('紫荆花');
  });

  test('maps known cities to demonstration cost bands', () => {
    expect(inferCostBand('深圳')).toBe('high');
    expect(inferCostBand('成都市')).toBe('upper');
    expect(inferCostBand('东莞')).toBe('standard');
    expect(inferCostBand('云浮市')).toBe('base');
    expect(inferCostBand('西安')).toBeUndefined();
    expect(COST_BAND_FACTORS.high).toBe(1.2);
  });

  test('locks the result inventory to exactly 122 actions', () => {
    expect(ACTION_COUNTS).toEqual({ service: 17, cleaning: 48, greening: 51, assistance: 6 });
    expect(Object.values(ACTION_COUNTS).reduce((sum, count) => sum + count, 0)).toBe(122);
  });

  test('accepts the workbook example and rejects delivery-order violations', () => {
    expect(validateProjectData(EXAMPLE_PROJECT)).toEqual([]);
    expect(
      validateProjectData({
        ...EXAMPLE_PROJECT,
        occupiedHouseholds: EXAMPLE_PROJECT.receivedHouseholds + 1,
      }),
    ).toContain('常住户数不能大于已收楼户数');
  });
});
