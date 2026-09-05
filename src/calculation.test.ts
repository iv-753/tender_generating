import { describe, expect, test } from 'vitest';
// @ts-expect-error Runtime ESM config is exercised directly without duplicating its contract.
import { CATEGORY_CONFIG, CATEGORY_TITLES, STANDARD_ACTION_COUNT } from '../scripts/calculation/category-config.mjs';
import {
  ACTION_COUNTS,
  COST_BAND_FACTORS,
  displayActionName,
  displayQuantity,
  displayStaffingCount,
  gradeLabel,
  inferCostBand,
  showsActionHeadcount,
  validateProjectData,
} from './calculation';
import { EXAMPLE_PROJECT } from './exampleProject';

describe('property calculation rules', () => {
  test('keeps the frozen service-grade display mapping outside the UI', () => {
    expect(gradeLabel('A')).toBe('A 级｜最高服务档次');
    expect(gradeLabel('D')).toBe('D 级｜基础服务');
    expect(gradeLabel('A')).not.toContain('紫荆花');
  });

  test('maps nationwide cities to the versioned cost bands', () => {
    expect(inferCostBand('深圳')).toBe('high');
    expect(inferCostBand('成都市')).toBe('upper');
    expect(inferCostBand('东莞')).toBe('upper');
    expect(inferCostBand('云浮市')).toBe('base');
    expect(inferCostBand('西安')).toBe('upper');
    expect(COST_BAND_FACTORS.high).toBe(1.2);
  });

  test('locks the complete category configuration to exactly 452 standard actions', () => {
    expect(CATEGORY_CONFIG).toEqual([
      { category: 'service', title: '服务', expectedCount: 17, costModel: 'rounded-service-staffing' },
      { category: 'cleaning', title: '清洁', expectedCount: 48, costModel: 'rounded-daily-staffing' },
      { category: 'greening', title: '绿化', expectedCount: 51, costModel: 'rounded-daily-staffing' },
      { category: 'assistance', title: '客助', expectedCount: 6, costModel: 'dedicated-posts' },
      { category: 'pestControl', title: '四害消杀', expectedCount: 7, costModel: 'pest-workdays' },
      { category: 'engineeringOutsourced', title: '工程委外', expectedCount: 95, costModel: 'rounded-outsourced-staffing' },
      { category: 'engineeringRoutine', title: '工程常规', expectedCount: 228, costModel: 'rounded-routine-staffing' },
    ]);
    expect(CATEGORY_TITLES).toEqual({
      service: '服务',
      cleaning: '清洁',
      greening: '绿化',
      assistance: '客助',
      pestControl: '四害消杀',
      engineeringOutsourced: '工程委外',
      engineeringRoutine: '工程常规',
    });
    expect(STANDARD_ACTION_COUNT).toBe(452);
    expect(ACTION_COUNTS).toEqual(Object.fromEntries(
      CATEGORY_CONFIG.map((item: { category: string; expectedCount: number }) => [item.category, item.expectedCount]),
    ));
    expect(Object.isFrozen(CATEGORY_CONFIG)).toBe(true);
    expect(CATEGORY_CONFIG.every(Object.isFrozen)).toBe(true);
  });

  test('hides internal service codes from action names', () => {
    expect(displayActionName('A-FW-57 车行相关业务办理')).toBe('车行相关业务办理');
    expect(displayActionName('B-LH-02 园林出入口广场草坪打孔')).toBe('园林出入口广场草坪打孔');
    expect(displayActionName('企微客户信息处理')).toBe('企微客户信息处理');
  });

  test('shows staffing as whole people only', () => {
    expect(displayStaffingCount(0)).toBe(0);
    expect(displayStaffingCount(4.01)).toBe(5);
    expect(displayStaffingCount(5)).toBe(5);
  });

  test('shows customer-facing quantities as rounded whole numbers', () => {
    expect(displayQuantity(9882.375, '平方米')).toBe('9,882 平方米');
    expect(displayQuantity(908.72, '株')).toBe('909 株');
    expect(displayQuantity(undefined, '平方米')).toBe('—');
  });

  test('shows per-action headcount only for dedicated assistance posts', () => {
    expect(showsActionHeadcount('assistance')).toBe(true);
    expect(showsActionHeadcount('service')).toBe(false);
    expect(showsActionHeadcount('cleaning')).toBe(false);
    expect(showsActionHeadcount('greening')).toBe(false);
  });

  test('accepts the workbook example and rejects delivery-order violations', () => {
    expect(validateProjectData(EXAMPLE_PROJECT)).toEqual([]);
    expect(
      validateProjectData({
        ...EXAMPLE_PROJECT,
        occupiedHouseholds: EXAMPLE_PROJECT.receivedHouseholds + 1,
      }),
    ).toContain('常住户数不能大于已收楼户数');
    expect(validateProjectData({ ...EXAMPLE_PROJECT, costBand: 'standard' }))
      .toContain('城市成本档位只能上下调整一级');
  });
});
