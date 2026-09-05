import { describe, expect, test } from 'vitest';
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

  test('locks the complete result inventory to exactly 452 standard actions', () => {
    expect(ACTION_COUNTS).toEqual({
      service: 17,
      cleaning: 48,
      greening: 51,
      assistance: 6,
      pestControl: 7,
      engineeringOutsourced: 95,
      engineeringRoutine: 228,
    });
    expect(Object.values(ACTION_COUNTS).reduce((sum, count) => sum + count, 0)).toBe(452);
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
