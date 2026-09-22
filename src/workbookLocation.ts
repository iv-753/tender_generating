import locations from './data/workbook-guangdong.json';
import type { ProjectData } from './types';

export const workbookCities = [...new Set(locations.map((item) => item.city))].map((value) => ({ value, label: value }));
export function workbookDistricts(city?: string) {
  return locations.filter((item) => item.city === city).map((item) => ({ value: item.district, label: item.district }));
}
export function isWorkbookLocation(project: Pick<ProjectData, 'region' | 'city' | 'district'>) {
  return ['广东', '广东省'].includes(project.region) && locations.some((item) => item.city === project.city && item.district === project.district);
}
