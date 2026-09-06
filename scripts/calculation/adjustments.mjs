import { CATEGORY_CONFIG } from './category-config.mjs';
import { defaultActionHourlyRate, summarizeCategory } from './category-cost-model.mjs';
import {
  ASSISTANCE_BUDGET_FACTOR,
  ASSISTANCE_MONTHLY_RATE,
  FULL_MODEL_COST_FACTORS,
} from './rules/constants.mjs';

const CATEGORIES = Object.freeze(CATEGORY_CONFIG.map(({ category }) => category));
const CATEGORY_SET = new Set(CATEGORIES);

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

const decimalNonNegative = (value, label) => Math.round((finiteNonNegative(value, label) + Number.EPSILON) * 100) / 100;

function assertAdjustments(adjustments) {
  if (!adjustments || adjustments.version !== 1 || !adjustments.overrides || !Array.isArray(adjustments.customActions)) {
    throw new Error('服务动作调整数据无效');
  }
}

function sourceHoursPerFrequency(action) {
  const explicit = Number(action.hoursPerFrequency);
  if (Number.isFinite(explicit) && explicit >= 0) return explicit;
  const frequency = Number(action.annualFrequency);
  const hours = Number(action.annualHours);
  if (Number.isFinite(frequency) && frequency > 0 && Number.isFinite(hours) && hours >= 0) return hours / frequency;
  throw new Error(`${action.id}缺少单次工时，需同时填写年工时`);
}

function sourceHourlyRate(action, grade, factor) {
  const hours = Number(action.annualHours);
  const cost = Number(action.annualCost);
  if (Number.isFinite(hours) && hours > 0 && Number.isFinite(cost) && cost >= 0) return cost / hours;
  return defaultActionHourlyRate(action.category, grade, factor);
}

function assistanceCost(headcount, factor) {
  return headcount * ASSISTANCE_MONTHLY_RATE * 12 * ASSISTANCE_BUDGET_FACTOR * factor;
}

function applyOverride(action, override, grade, factor) {
  if (override.disabled) {
    return { ...action, source: 'baseline', enabled: false, annualFrequency: 0, annualHours: 0, headcount: 0, annualCost: 0 };
  }

  const next = { ...action, source: 'baseline', enabled: true };
  if (action.category === 'assistance') {
    if (override.annualFrequency !== undefined || override.annualHours !== undefined || override.annualCost !== undefined) {
      throw new Error('客助动作只能调整配置人数');
    }
    if (override.headcount !== undefined) next.headcount = wholeNonNegative(override.headcount, '配置人数');
    next.annualCost = assistanceCost(Number(next.headcount ?? 0), factor);
    return next;
  }

  if (override.headcount !== undefined) throw new Error('工作量动作只能调整年频次或年工时');
  if (override.annualFrequency !== undefined) {
    next.annualFrequency = wholeNonNegative(override.annualFrequency, '年频次');
    next.frequency = `${next.annualFrequency}次/年`;
    next.annualHours = decimalNonNegative(next.annualFrequency * sourceHoursPerFrequency(action), '年工时');
  }
  if (override.annualHours !== undefined) next.annualHours = decimalNonNegative(override.annualHours, '年工时');
  next.annualCost = Number(next.annualHours ?? 0) * sourceHourlyRate(action, grade, factor);
  return next;
}

function customAction(input, grade, factor, ids) {
  if (!input || !CATEGORY_SET.has(input.category)) throw new Error('自定义动作分类无效');
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
    if (input.annualFrequency !== undefined || input.annualHours !== undefined || input.annualCost !== undefined) {
      throw new Error('客助动作只能填写配置人数');
    }
    const headcount = wholeNonNegative(input.headcount ?? 0, '配置人数');
    return { ...base, frequency: input.frequency ? String(input.frequency) : '自定义配置', headcount, annualCost: assistanceCost(headcount, factor) };
  }
  if (input.headcount !== undefined) throw new Error('工作量动作不能填写配置人数');
  const annualFrequency = wholeNonNegative(input.annualFrequency ?? 0, '年频次');
  const annualHours = decimalNonNegative(input.annualHours ?? 0, '年工时');
  const annualCost = annualHours * defaultActionHourlyRate(input.category, grade, factor);
  return {
    ...base,
    frequency: input.frequency ? String(input.frequency) : `${annualFrequency}次/年`,
    annualFrequency,
    annualHours,
    annualCost,
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
  if (!grade || factor === undefined) throw new Error('项目服务等级或城市成本档位无效');

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
    if (!CATEGORY_SET.has(action.category)) throw new Error(`${action.category}动作调整尚未开放`);
    return applyOverride(action, override, grade, factor);
  });
  const ids = new Set(baselineIds);
  for (const input of adjustments.customActions) {
    const item = customAction(input, grade, factor, ids);
    ids.add(item.id);
    actions.push(item);
  }

  const adjustedCategories = new Map(
    CATEGORIES.map((category) => [category, summarizeCategory(category, actions, grade, factor)]),
  );
  const categories = baseline.categories.map((summary) => adjustedCategories.get(summary.category) ?? summary);
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
    workloadAnnualCost: categories.reduce((sum, item) => sum + item.workloadAnnualCost, 0),
    categories,
    actions,
  };
}
