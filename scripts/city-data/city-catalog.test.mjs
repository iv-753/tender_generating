import assert from 'node:assert/strict';
import test from 'node:test';
import catalog from '../../src/data/city-cost-bands.json' with { type: 'json' };

test('covers mainland provinces and prefecture-level locations', () => {
  assert.equal(catalog.version, '2025-wage-2026-09');
  assert.equal(catalog.provinces.length, 31);
  const cities = catalog.provinces.flatMap((province) => province.cities);
  assert.equal(cities.length, 337);
  assert.equal(new Set(cities.map((city) => city.code)).size, cities.length);
  assert.ok(catalog.provinces.every((province) => province.cities.length > 0));
  assert.ok(cities.every((city) => ['high', 'upper', 'standard', 'base'].includes(city.recommendedBand)));
});

test('keeps the agreed flagship defaults', () => {
  const cities = catalog.provinces.flatMap((province) => province.cities);
  for (const name of ['北京市', '上海市', '广州市', '深圳市']) {
    assert.equal(cities.find((city) => city.name === name)?.recommendedBand, 'high');
  }
});
