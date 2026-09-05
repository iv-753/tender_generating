import { expect, test } from 'vitest';
import {
  CITY_CATALOG_VERSION,
  allowedCostBands,
  cityOptions,
  formatProjectLocation,
  getCityRecommendation,
  isAllowedCostBand,
  normalizeProjectLocation,
  provinceOptions,
} from './cityCatalog';

test('exposes all mainland provinces and their prefecture-level locations', () => {
  expect(provinceOptions).toHaveLength(31);
  expect(cityOptions('广东省').map((option) => option.label)).toContain('广州市');
  expect(cityOptions('不存在')).toEqual([]);
});

test('recommends Guangzhou as high and only permits a one-band adjustment', () => {
  expect(CITY_CATALOG_VERSION).toBe('2025-wage-2026-09');
  expect(getCityRecommendation('广东省', '广州市')).toBe('high');
  expect(getCityRecommendation('湖南省', '广州市')).toBeUndefined();
  expect(allowedCostBands('high')).toEqual(['high', 'upper']);
  expect(allowedCostBands('upper')).toEqual(['high', 'upper', 'standard']);
  expect(allowedCostBands('standard')).toEqual(['upper', 'standard', 'base']);
  expect(allowedCostBands('base')).toEqual(['standard', 'base']);
  expect(isAllowedCostBand('high', 'upper')).toBe(true);
  expect(isAllowedCostBand('high', 'standard')).toBe(false);
});

test('normalizes a legacy city without suffix while preserving a legal override', () => {
  expect(normalizeProjectLocation({ region: '广东省广州市增城区', city: '广州', costBand: 'upper' }))
    .toMatchObject({
      region: '广东省',
      city: '广州市',
      recommendedCostBand: 'high',
      costBand: 'upper',
      costBandSourceVersion: '2025-wage-2026-09',
    });
});

test('resets an illegal legacy override and formats a canonical location', () => {
  const normalized = normalizeProjectLocation({ region: '广东省广州市增城区', city: '广州', costBand: 'base' });
  expect(normalized.costBand).toBe('high');
  expect(formatProjectLocation(normalized)).toBe('广东省 · 广州市');
});
