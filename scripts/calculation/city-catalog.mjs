import catalog from '../../src/data/city-cost-bands.json' with { type: 'json' };

const bands = ['high', 'upper', 'standard', 'base'];

function withoutCitySuffix(value) {
  return String(value ?? '').trim().replace(/(?:自治州|地区|盟|市)$/, '');
}

function findProvince(region) {
  const value = String(region ?? '').trim();
  if (!value) return undefined;
  return catalog.provinces.find((province) => value === province.name || value.includes(province.name));
}

function findCityInProvince(province, city) {
  const value = String(city ?? '').trim();
  if (!province || !value) return undefined;
  const normalized = withoutCitySuffix(value);
  return province.cities.find((item) => item.name === value || withoutCitySuffix(item.name) === normalized);
}

export function normalizeCityLocation(region, city) {
  const explicitProvince = findProvince(region);
  const explicitCity = findCityInProvince(explicitProvince, city);
  if (explicitProvince && explicitCity) {
    return { region: explicitProvince.name, city: explicitCity.name, recommendedCostBand: explicitCity.recommendedBand };
  }
  if (explicitProvince || !String(city ?? '').trim()) return undefined;
  const normalized = withoutCitySuffix(city);
  for (const province of catalog.provinces) {
    const matched = province.cities.find((item) => withoutCitySuffix(item.name) === normalized);
    if (matched) return { region: province.name, city: matched.name, recommendedCostBand: matched.recommendedBand };
  }
}

export function recommendCostBand(region, city) {
  return normalizeCityLocation(region, city)?.recommendedCostBand;
}

export function validateCityCostBand(project) {
  const recommended = recommendCostBand(project?.region, project?.city);
  if (!recommended) return '请选择有效的省份和城市';
  if (project.recommendedCostBand && project.recommendedCostBand !== recommended) return '城市成本档位建议值已更新，请重新选择城市';
  const expectedIndex = bands.indexOf(recommended);
  const actualIndex = bands.indexOf(project.costBand);
  if (actualIndex < 0 || Math.abs(actualIndex - expectedIndex) > 1) return '城市成本档位只能上下调整一级';
}

export const CITY_CATALOG_VERSION = catalog.version;
