import { CATEGORY_CONFIG } from './category-config.mjs';
import {
  ASSISTANCE_BUDGET_FACTOR,
  ASSISTANCE_MONTHLY_RATE,
  CLEANING_DAILY_RATE,
  ENGINEERING_ANNUAL_CAPACITY_HOURS,
  ENGINEERING_BUDGET_FACTOR,
  ENGINEERING_OUTSOURCED_MONTHLY_RATE,
  ENGINEERING_ROUTINE_MONTHLY_RATE,
  GREENING_DAILY_RATE,
  PEST_WORKDAY_RATE,
  SERVICE_ANNUAL_HOURS,
  SERVICE_HOURLY_RATE,
  WORKDAY_HOURS,
  WORKDAYS_PER_YEAR,
} from './rules/constants.mjs';

const INTEGER_SNAP_TOLERANCE = 1e-12;
const PEST_WORKDAYS_PER_STAFF_YEAR = 12 * 30;
const CONFIG_BY_CATEGORY = new Map(CATEGORY_CONFIG.map((item) => [item.category, item]));

function finiteNonNegative(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`${label}必须为有限非负数`);
  }
  return value;
}

function configFor(category) {
  const config = CONFIG_BY_CATEGORY.get(category);
  if (!config) throw new Error(`未知服务分类：${category}`);
  return config;
}

function ceilWithTolerance(value) {
  const nearestInteger = Math.round(value);
  const tolerance = INTEGER_SNAP_TOLERANCE * Math.max(1, Math.abs(value));
  return Math.ceil(Math.abs(value - nearestInteger) <= tolerance ? nearestInteger : value);
}

export function defaultActionHourlyRate(category, grade, costFactor) {
  finiteNonNegative(costFactor, `${category}.costFactor`);
  switch (configFor(category).costModel) {
    case 'rounded-service-staffing': return SERVICE_HOURLY_RATE * costFactor;
    case 'rounded-daily-staffing': {
      const dailyRate = category === 'cleaning' ? CLEANING_DAILY_RATE[grade] : GREENING_DAILY_RATE[grade];
      return finiteNonNegative(dailyRate, `${category}.dailyRate`) / WORKDAY_HOURS * costFactor;
    }
    case 'pest-workdays': return PEST_WORKDAY_RATE / WORKDAY_HOURS * costFactor;
    case 'rounded-outsourced-staffing': return ENGINEERING_OUTSOURCED_MONTHLY_RATE / 30 / WORKDAY_HOURS * costFactor;
    case 'rounded-routine-staffing': return ENGINEERING_ROUTINE_MONTHLY_RATE / 30 / WORKDAY_HOURS * costFactor;
    default: throw new Error(`${category}动作不按工时核算成本`);
  }
}

export function summarizeCategory(category, actions, grade, costFactor) {
  const config = configFor(category);
  const active = actions.filter((item) => item.category === category && item.enabled !== false);
  const workloadAnnualCost = finiteNonNegative(
    active.reduce((sum, item) => sum + Number(item.annualCost ?? 0), 0),
    `${category}.workloadAnnualCost`,
  );
  const common = { category, title: config.title, actionCount: active.length, workloadAnnualCost };

  if (config.costModel === 'dedicated-posts') {
    const headcount = finiteNonNegative(
      active.reduce((sum, item) => sum + Number(item.headcount ?? 0), 0),
      `${category}.headcount`,
    );
    return {
      ...common,
      headcount,
      annualCost: headcount * ASSISTANCE_MONTHLY_RATE * 12 * ASSISTANCE_BUDGET_FACTOR * costFactor,
      workloadEquivalentHeadcount: headcount,
    };
  }

  const annualHours = finiteNonNegative(
    active.reduce((sum, item) => sum + Number(item.annualHours ?? 0), 0),
    `${category}.annualHours`,
  );
  if (config.costModel === 'pest-workdays') {
    const annualWorkdays = annualHours / WORKDAY_HOURS;
    const headcount = annualWorkdays / PEST_WORKDAYS_PER_STAFF_YEAR;
    return {
      ...common,
      annualHours,
      annualWorkdays,
      headcount,
      annualCost: headcount * PEST_WORKDAY_RATE * WORKDAYS_PER_YEAR * costFactor,
      workloadEquivalentHeadcount: headcount,
    };
  }

  let workloadEquivalentHeadcount;
  let annualCost;
  if (config.costModel === 'rounded-service-staffing') {
    workloadEquivalentHeadcount = annualHours / SERVICE_ANNUAL_HOURS;
    annualCost = ceilWithTolerance(workloadEquivalentHeadcount) * SERVICE_HOURLY_RATE * WORKDAY_HOURS * WORKDAYS_PER_YEAR * costFactor;
  } else if (config.costModel === 'rounded-daily-staffing') {
    workloadEquivalentHeadcount = annualHours / WORKDAY_HOURS / WORKDAYS_PER_YEAR;
    const dailyRate = category === 'cleaning' ? CLEANING_DAILY_RATE[grade] : GREENING_DAILY_RATE[grade];
    annualCost = finiteNonNegative(dailyRate, `${category}.dailyRate`) * ceilWithTolerance(workloadEquivalentHeadcount) * WORKDAYS_PER_YEAR * costFactor;
  } else if (config.costModel === 'rounded-outsourced-staffing' || config.costModel === 'rounded-routine-staffing') {
    workloadEquivalentHeadcount = annualHours / ENGINEERING_ANNUAL_CAPACITY_HOURS;
    const monthlyRate = config.costModel === 'rounded-outsourced-staffing'
      ? ENGINEERING_OUTSOURCED_MONTHLY_RATE
      : ENGINEERING_ROUTINE_MONTHLY_RATE;
    annualCost = ceilWithTolerance(workloadEquivalentHeadcount) * monthlyRate * 12 * ENGINEERING_BUDGET_FACTOR * costFactor;
  } else {
    throw new Error(`未知分类成本模型：${config.costModel}`);
  }
  return {
    ...common,
    ...(config.costModel.startsWith('rounded-') && category.startsWith('engineering') ? { annualHours } : {}),
    headcount: ceilWithTolerance(workloadEquivalentHeadcount),
    annualCost: finiteNonNegative(annualCost, `${category}.annualCost`),
    workloadEquivalentHeadcount,
  };
}
