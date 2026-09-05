import { ASSISTANCE_RULES } from './rules/assistance-rules.mjs';
import { CLEANING_RULES } from './rules/cleaning-rules.mjs';
import {
  ASSISTANCE_MONTHLY_RATE,
  ASSISTANCE_BUDGET_FACTOR,
  CLEANING_DAILY_RATE,
  FULL_MODEL_COST_FACTORS,
  GRADE_CORRECTION,
  GREENING_DAILY_RATE,
  SERVICE_ANNUAL_HOURS,
  SERVICE_HOURLY_RATE,
  WORKDAY_HOURS,
  WORKDAYS_PER_YEAR,
} from './rules/constants.mjs';
import { GREENING_RULES } from './rules/greening-rules.mjs';
import { SERVICE_RULES } from './rules/service-rules.mjs';

const CATEGORY_TITLES = Object.freeze({ service: '服务', cleaning: '清洁', greening: '绿化', assistance: '客助' });
const CATEGORIES = Object.freeze(Object.keys(CATEGORY_TITLES));

function finiteNonNegative(value, label) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) throw new Error(`${label}必须为非负数`);
  return numeric;
}

function wholeNonNegative(value, label) {
  const numeric = finiteNonNegative(value, label);
  if (!Number.isInteger(numeric)) throw new Error(`${label}必须为整数`);
  return numeric;
}

function assertAdjustments(adjustments) {
  if (!adjustments || adjustments.version !== 1 || !adjustments.overrides || !Array.isArray(adjustments.customActions)) {
    throw new Error('服务动作调整数据无效');
  }
}

function serviceHoursPerFrequency(actionId, grade) {
  const rule = SERVICE_RULES.find((item) => item.id === actionId);
  if (!rule) throw new Error(`服务动作 ${actionId} 不存在`);
  if (rule.unitHours.type === 'fixed') return rule.unitHours.value;
  if (rule.unitHours.type === 'grade-adjusted') return GRADE_CORRECTION[grade] * rule.unitHours.base + rule.unitHours.additional;
  throw new Error(`服务动作 ${actionId} 的工时规则无效`);
}

function areaHoursPerFrequency(action, grade, rules) {
  const rule = rules.find((item) => item.id === action.id);
  if (!rule) throw new Error(`服务动作 ${action.id} 不存在`);
  const quantity = Number(action.quantity ?? 0);
  return quantity * rule.baseUnitHours * (rule.unitHoursScale ?? 1) * GRADE_CORRECTION[grade];
}

function hoursPerFrequency(action, grade) {
  if (action.category === 'service') return serviceHoursPerFrequency(action.id, grade);
  if (action.category === 'cleaning') return areaHoursPerFrequency(action, grade, CLEANING_RULES);
  if (action.category === 'greening') return areaHoursPerFrequency(action, grade, GREENING_RULES);
  throw new Error('客助动作不按年频次计算工时');
}

function hourlyRate(category, grade) {
  if (category === 'service') return SERVICE_HOURLY_RATE;
  if (category === 'cleaning') return CLEANING_DAILY_RATE[grade] / WORKDAY_HOURS;
  if (category === 'greening') return GREENING_DAILY_RATE[grade] / WORKDAY_HOURS;
  throw new Error(`未知服务分类：${category}`);
}

function actionCost(action, grade, factor) {
  if (action.category === 'assistance') return Number(action.headcount ?? 0) * ASSISTANCE_MONTHLY_RATE * 12 * ASSISTANCE_BUDGET_FACTOR * factor;
  return Number(action.annualHours ?? 0) * hourlyRate(action.category, grade) * factor;
}

function applyOverride(action, override, grade, factor) {
  if (override.disabled) {
    return { ...action, source: 'baseline', enabled: false, annualFrequency: 0, annualHours: 0, headcount: 0, annualCost: 0 };
  }

  const next = { ...action, source: 'baseline', enabled: true };
  if (action.category === 'assistance') {
    if (override.annualFrequency !== undefined || override.annualHours !== undefined) throw new Error('客助动作只能调整配置人数');
    if (override.headcount !== undefined) next.headcount = wholeNonNegative(override.headcount, '配置人数');
  } else {
    if (override.headcount !== undefined) throw new Error('服务、清洁和绿化动作只能调整年频次或年工时');
    if (override.annualFrequency !== undefined) {
      next.annualFrequency = finiteNonNegative(override.annualFrequency, '年频次');
      next.frequency = `${next.annualFrequency}次/年`;
      next.annualHours = next.annualFrequency * hoursPerFrequency(action, grade);
    }
    if (override.annualHours !== undefined) next.annualHours = finiteNonNegative(override.annualHours, '年工时');
    next.headcount = Number(next.annualHours ?? 0) / SERVICE_ANNUAL_HOURS;
  }
  next.annualCost = actionCost(next, grade, factor);
  return next;
}

function customAction(input, grade, factor, ids) {
  if (!input || !CATEGORIES.includes(input.category)) throw new Error('自定义动作分类无效');
  const id = String(input.id ?? '').trim();
  if (!id || ids.has(id)) throw new Error(`自定义动作编号重复或无效：${id}`);
  const action = String(input.action ?? '').trim();
  if (!action) throw new Error('自定义动作名称不能为空');
  const base = {
    id,
    category: input.category,
    action,
    property: String(input.property ?? '自定义').trim() || '自定义',
    ...(input.basis ? { basis: String(input.basis) } : {}),
    source: 'custom',
    enabled: true,
  };
  if (input.category === 'assistance') {
    const headcount = wholeNonNegative(input.headcount ?? 0, '配置人数');
    return { ...base, frequency: input.frequency ? String(input.frequency) : '自定义配置', headcount, annualCost: headcount * ASSISTANCE_MONTHLY_RATE * 12 * ASSISTANCE_BUDGET_FACTOR * factor };
  }
  const annualFrequency = finiteNonNegative(input.annualFrequency ?? 0, '年频次');
  const annualHours = finiteNonNegative(input.annualHours ?? 0, '年工时');
  return {
    ...base,
    frequency: input.frequency ? String(input.frequency) : `${annualFrequency}次/年`,
    annualFrequency,
    annualHours,
    headcount: annualHours / SERVICE_ANNUAL_HOURS,
    annualCost: annualHours * hourlyRate(input.category, grade) * factor,
  };
}

function summarize(category, actions, grade, factor) {
  const active = actions.filter((item) => item.category === category && item.enabled !== false);
  const workloadAnnualCost = active.reduce((sum, item) => sum + item.annualCost, 0);
  let workloadEquivalentHeadcount;
  let headcount;
  let annualCost;

  if (category === 'assistance') {
    workloadEquivalentHeadcount = active.reduce((sum, item) => sum + Number(item.headcount ?? 0), 0);
    headcount = workloadEquivalentHeadcount;
    annualCost = headcount * ASSISTANCE_MONTHLY_RATE * 12 * ASSISTANCE_BUDGET_FACTOR * factor;
  } else {
    const annualHours = active.reduce((sum, item) => sum + Number(item.annualHours ?? 0), 0);
    const annualCapacity = category === 'service' ? SERVICE_ANNUAL_HOURS : WORKDAY_HOURS * WORKDAYS_PER_YEAR;
    workloadEquivalentHeadcount = annualHours / annualCapacity;
    headcount = Math.ceil(workloadEquivalentHeadcount);
    if (category === 'service') annualCost = headcount * SERVICE_HOURLY_RATE * WORKDAY_HOURS * WORKDAYS_PER_YEAR * factor;
    else if (category === 'cleaning') annualCost = CLEANING_DAILY_RATE[grade] * headcount * WORKDAYS_PER_YEAR * factor;
    else annualCost = GREENING_DAILY_RATE[grade] * headcount * WORKDAYS_PER_YEAR * factor;
  }

  return {
    category,
    title: CATEGORY_TITLES[category],
    actionCount: active.length,
    headcount,
    annualCost,
    workloadAnnualCost,
    workloadEquivalentHeadcount,
  };
}

export function applyAdjustments(baseline, adjustments) {
  assertAdjustments(adjustments);
  if (!baseline?.project || !Array.isArray(baseline.actions)) throw new Error('基准测算结果无效');
  if (baseline.version === 2 && (!baseline.management
    || !Number.isFinite(baseline.management.headcount)
    || baseline.management.headcount < 0
    || !Number.isFinite(baseline.management.annualCost)
    || baseline.management.annualCost < 0)) {
    throw new Error('V2 基准测算缺少管理成本');
  }
  const grade = baseline.project.serviceGrade;
  const factor = FULL_MODEL_COST_FACTORS[baseline.project.costBand];
  if (!grade || !factor) throw new Error('项目服务等级或城市成本档位无效');

  const baselineIds = new Set(baseline.actions.map((item) => item.id));
  for (const id of Object.keys(adjustments.overrides)) {
    if (!baselineIds.has(id)) throw new Error(`服务动作 ${id} 不存在`);
  }
  if (Object.keys(adjustments.overrides).length === 0 && adjustments.customActions.length === 0) {
    return { ...baseline, calculatedAt: new Date().toISOString() };
  }
  const actions = baseline.actions.map((action) => {
    const override = adjustments.overrides[action.id];
    if (override === undefined) return action;
    if (!CATEGORIES.includes(action.category)) {
      throw new Error(`${CATEGORY_TITLES[action.category] ?? action.category}动作调整尚未开放`);
    }
    return applyOverride(action, override, grade, factor);
  });
  const ids = new Set(baselineIds);
  for (const input of adjustments.customActions) {
    const item = customAction(input, grade, factor, ids);
    ids.add(item.id);
    actions.push(item);
  }

  const adjustedCategories = new Map(
    CATEGORIES.map((category) => [category, summarize(category, actions, grade, factor)]),
  );
  const categories = baseline.categories.map((summary) => (
    adjustedCategories.get(summary.category) ?? summary
  ));
  const activeActionCount = actions.filter((item) => item.enabled !== false).length;
  const managementHeadcount = baseline.version === 2 ? baseline.management.headcount : 0;
  const managementAnnualCost = baseline.version === 2 ? baseline.management.annualCost : 0;
  return {
    ...baseline,
    calculatedAt: new Date().toISOString(),
    ...(baseline.version === 2 ? { activeActionCount } : {}),
    totalActionCount: actions.length,
    totalHeadcount: categories.reduce((sum, item) => sum + item.headcount, 0) + managementHeadcount,
    annualCost: categories.reduce((sum, item) => sum + item.annualCost, 0) + managementAnnualCost,
    workloadAnnualCost: actions.filter((item) => item.enabled !== false).reduce((sum, item) => sum + item.annualCost, 0),
    categories,
    actions,
  };
}
