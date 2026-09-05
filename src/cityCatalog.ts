import catalog from './data/city-cost-bands.json';
import type { CostBand, ProjectData } from './types';

type CityRecord = { code: string; name: string; recommendedBand: CostBand };
type ProvinceRecord = { code: string; name: string; cities: CityRecord[] };
type LocationInput = Pick<Partial<ProjectData>, 'region' | 'city' | 'costBand' | 'recommendedCostBand' | 'costBandSourceVersion'>;

const provinces = catalog.provinces as ProvinceRecord[];
const bandOrder: CostBand[] = ['high', 'upper', 'standard', 'base'];

export const CITY_CATALOG_VERSION = catalog.version;
export const provinceOptions = provinces.map((province) => ({ value: province.name, label: province.name }));

function withoutCitySuffix(value: string) {
  return value.trim().replace(/(?:自治州|地区|盟|市)$/, '');
}

function findProvince(region?: string) {
  const value = region?.trim();
  if (!value) return undefined;
  return provinces.find((province) => value === province.name || value.includes(province.name));
}

function findCityInProvince(province: ProvinceRecord | undefined, city?: string) {
  const value = city?.trim();
  if (!province || !value) return undefined;
  const normalized = withoutCitySuffix(value);
  return province.cities.find((item) => item.name === value || withoutCitySuffix(item.name) === normalized);
}

function findLocation(region?: string, city?: string) {
  const explicitProvince = findProvince(region);
  const explicitCity = findCityInProvince(explicitProvince, city);
  if (explicitProvince && explicitCity) return { province: explicitProvince, city: explicitCity };
  if (explicitProvince) return undefined;
  if (!city?.trim()) return undefined;
  const normalized = withoutCitySuffix(city);
  for (const province of provinces) {
    const matched = province.cities.find((item) => withoutCitySuffix(item.name) === normalized);
    if (matched) return { province, city: matched };
  }
  return undefined;
}

export function cityOptions(region?: string) {
  return (findProvince(region)?.cities ?? []).map((city) => ({ value: city.name, label: city.name }));
}

export function getCityRecommendation(region?: string, city?: string): CostBand | undefined {
  return findLocation(region, city)?.city.recommendedBand;
}

export function getCityRecommendationByName(city?: string): CostBand | undefined {
  return findLocation(undefined, city)?.city.recommendedBand;
}

export function allowedCostBands(recommendation?: CostBand): CostBand[] {
  const index = recommendation ? bandOrder.indexOf(recommendation) : -1;
  if (index < 0) return [];
  return bandOrder.filter((_, candidateIndex) => Math.abs(candidateIndex - index) <= 1);
}

export function isAllowedCostBand(recommendation?: CostBand, actual?: CostBand) {
  return Boolean(actual && allowedCostBands(recommendation).includes(actual));
}

export function normalizeProjectLocation<T extends LocationInput>(project: T): T & LocationInput {
  const location = findLocation(project.region, project.city);
  if (!location) return { ...project };
  const recommendedCostBand = location.city.recommendedBand;
  const costBand = isAllowedCostBand(recommendedCostBand, project.costBand) ? project.costBand : recommendedCostBand;
  return {
    ...project,
    region: location.province.name,
    city: location.city.name,
    recommendedCostBand,
    costBand,
    costBandSourceVersion: CITY_CATALOG_VERSION,
  };
}

export function formatProjectLocation(project: Pick<ProjectData, 'region' | 'city'>) {
  const region = project.region?.trim();
  const city = project.city?.trim();
  if (!region) return city || '—';
  if (!city || region.includes(city)) return region;
  return `${region} · ${city}`;
}
