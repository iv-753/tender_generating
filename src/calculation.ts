import type { ActionCategory, CostBand, ProjectData, ServiceGrade } from './types';

export const ACTION_COUNTS = {
  service: 17,
  cleaning: 48,
  greening: 51,
  assistance: 6,
} as const;

export const COST_BAND_FACTORS: Record<CostBand, number> = {
  high: 1.2,
  upper: 1.1,
  standard: 1,
  base: 0.9,
};

export const COST_BAND_LABELS: Record<CostBand, string> = {
  high: '高成本城市',
  upper: '较高成本城市',
  standard: '标准成本城市',
  base: '基础成本城市',
};

const GRADE_LABELS: Record<ServiceGrade, string> = {
  A: 'A 级｜最高服务档次',
  B: 'B 级｜高档服务',
  C: 'C 级｜标准服务',
  D: 'D 级｜基础服务',
};

export const WORKBOOK_GRADE_VALUES: Record<ServiceGrade, string> = {
  A: '紫荆花',
  B: '金百合',
  C: '郁金香',
  D: '向日葵',
};

const CITY_BANDS: Record<CostBand, string[]> = {
  high: ['北京', '上海', '深圳', '杭州'],
  upper: ['广州', '苏州', '南京', '成都', '武汉'],
  standard: ['东莞', '佛山', '长沙', '重庆', '昆山'],
  base: ['肇庆', '云浮'],
};

export function gradeLabel(grade: ServiceGrade) {
  return GRADE_LABELS[grade];
}

export function displayActionName(action: string) {
  return action.replace(/^[A-Z]+-[A-Z]+-\d+\s+/, '');
}

export function displayQuantity(value: unknown, unit?: string) {
  if (value === undefined || value === null || value === '') return '—';
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '—';
  const formatted = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 }).format(numeric);
  return unit ? `${formatted} ${unit}` : formatted;
}

export function displayStaffingCount(headcount: number) {
  return Math.ceil(headcount);
}

export function showsActionHeadcount(category: ActionCategory) {
  return category === 'assistance';
}

export function inferCostBand(city: string): CostBand | undefined {
  const normalized = city.trim().replace(/市$/, '');
  return (Object.keys(CITY_BANDS) as CostBand[]).find((band) =>
    CITY_BANDS[band].includes(normalized),
  );
}

export function validateProjectData(data: ProjectData): string[] {
  const errors: string[] = [];
  if (!data.projectName.trim()) errors.push('请填写项目名称');
  if (!data.region.trim() || !data.city.trim()) errors.push('请填写项目地区和城市');
  if (data.occupiedHouseholds > data.receivedHouseholds) errors.push('常住户数不能大于已收楼户数');
  if (data.receivedHouseholds > data.deliveredHouseholds) errors.push('已收楼户数不能大于已交付户数');
  if (data.lawnRatio < 0 || data.lawnRatio > 1) errors.push('草坪比例必须在 0%—100% 之间');
  if (data.buildings.length < 1 || data.buildings.length > 5) errors.push('楼栋类型必须为 1—5 类');

  const numericValues = [
    data.totalBuildingArea,
    data.residentialChargeArea,
    data.deliveredHouseholds,
    data.receivedHouseholds,
    data.occupiedHouseholds,
    data.perimeterEntrances,
    data.gatehouses,
    data.pavedRoadArea,
    data.greenArea,
    data.lawnRatio,
    data.seasonalFlowerArea,
    data.winterProtectionArea,
    data.garageFloorArea,
    data.garageFloors,
    ...data.buildings.flatMap((building) => Object.values(building)),
  ];
  if (numericValues.some((value) => !Number.isFinite(value) || value < 0)) errors.push('所有数值必须为非负数');
  return [...new Set(errors)];
}
