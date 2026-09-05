import { calculateProject } from './engine.mjs';
import { validateCityCostBand } from './city-catalog.mjs';
import { ADVANCED_PARAMETER_DEFINITIONS } from './rules/advanced-parameter-definitions.mjs';
import { COST_BAND_FACTORS, GRADE_LABELS } from './rules/constants.mjs';

const text = (value) => value === null || value === undefined || value === '' ? '' : String(value);
const number = (value) => typeof value === 'number' && Number.isFinite(value) ? value : Number(value) || 0;
const advancedParametersByKey = new Map(
  ADVANCED_PARAMETER_DEFINITIONS.map((definition) => [definition.key, definition]),
);

export function validateProject(project) {
  if (!project || typeof project !== 'object') return '项目数据无效';
  if (!text(project.projectName).trim()) return '请填写项目名称';
  if (!text(project.region).trim() || !text(project.city).trim()) return '请填写项目地区和城市';
  if (!GRADE_LABELS[project.serviceGrade] || !COST_BAND_FACTORS[project.costBand]) return '测算参数无效';
  const cityValidationError = validateCityCostBand(project);
  if (cityValidationError) return cityValidationError;
  if (number(project.occupiedHouseholds) > number(project.receivedHouseholds)) return '常住户数不能大于已收楼户数';
  if (number(project.receivedHouseholds) > number(project.deliveredHouseholds)) return '已收楼户数不能大于已交付户数';
  if (number(project.lawnRatio) < 0 || number(project.lawnRatio) > 1) return '草坪比例必须在 0%—100% 之间';
  if (!Array.isArray(project.buildings) || project.buildings.length < 1 || project.buildings.length > 5) return '楼栋类型必须为 1—5 类';
  const numbers = [project.totalBuildingArea, project.residentialChargeArea, project.deliveredHouseholds, project.receivedHouseholds, project.occupiedHouseholds, project.perimeterEntrances, project.gatehouses, project.pavedRoadArea, project.greenArea, project.lawnRatio, project.seasonalFlowerArea, project.winterProtectionArea, project.garageFloorArea, project.garageFloors, ...project.buildings.flatMap((item) => Object.values(item))];
  if (numbers.some((value) => typeof value !== 'number' || !Number.isFinite(value) || value < 0)) return '所有数值必须为非负数';
  const overrides = project.advancedParameterOverrides === undefined
    ? {}
    : project.advancedParameterOverrides;
  if (overrides === null || typeof overrides !== 'object' || Array.isArray(overrides)) {
    return '高级参数覆盖必须为对象';
  }
  for (const [key, value] of Object.entries(overrides)) {
    const definition = advancedParametersByKey.get(key);
    if (!definition) return `高级参数不存在：${key}`;
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      return `${definition.label}必须为非负数`;
    }
  }
}

export function createCalculator() {
  return calculateProject;
}
