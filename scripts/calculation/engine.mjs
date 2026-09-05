import { deriveMetrics } from './derived-metrics.mjs';
import {
  ADVANCED_PARAMETER_VERSION,
  parameterValues,
  resolveAdvancedParameters,
} from './advanced-parameters.mjs';
import { CATEGORY_CONFIG, STANDARD_ACTION_COUNT } from './category-config.mjs';
import { calculateFullCostModules } from './full-cost-calculators.mjs';
import { ASSISTANCE_RULES } from './rules/assistance-rules.mjs';
import { CLEANING_RULES } from './rules/cleaning-rules.mjs';
import {
  ASSISTANCE_MONTHLY_RATE,
  CLEANING_DAILY_RATE,
  ASSISTANCE_BUDGET_FACTOR,
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

const text = (value) => value === null || value === undefined || value === '' ? '' : String(value);

function assertRuleCatalog() {
  const catalogs = [
    ['服务', SERVICE_RULES, 17],
    ['清洁', CLEANING_RULES, 48],
    ['绿化', GREENING_RULES, 51],
    ['客助', ASSISTANCE_RULES, 6],
  ];
  const ids = new Set();
  for (const [name, rules, expected] of catalogs) {
    if (rules.length !== expected) throw new Error(`${name}规则数量必须为 ${expected}`);
    for (const rule of rules) {
      if (!rule.id || ids.has(rule.id)) throw new Error(`动作编号重复或缺失：${rule.id ?? ''}`);
      ids.add(rule.id);
    }
  }
}

assertRuleCatalog();

function finite(value, name) {
  if (!Number.isFinite(value) || value < 0) throw new Error(`计算结果异常：${name}`);
  return value;
}

const linearDemand = (terms, metrics) => Object.entries(terms).reduce((sum, [source, coefficient]) => sum + metrics[source] * coefficient, 0);

function serviceDemand(rule, metrics, grade) {
  switch (rule.demand.type) {
    case 'constant': return rule.demand.value;
    case 'linear': return linearDemand(rule.demand.terms, metrics);
    case 'grade-linear': return linearDemand(rule.demand.terms, metrics) * rule.demand.gradeFactors[grade];
    case 'grade-constant': return rule.demand.values[grade];
    default: throw new Error(`未知服务工作量规则：${rule.demand.type}`);
  }
}

function serviceUnitHours(rule, grade) {
  switch (rule.unitHours.type) {
    case 'fixed': return rule.unitHours.value;
    case 'grade-adjusted': return GRADE_CORRECTION[grade] * rule.unitHours.base + rule.unitHours.additional;
    default: throw new Error(`未知服务工时规则：${rule.unitHours.type}`);
  }
}

function calculateService(metrics, grade, factor) {
  const actions = SERVICE_RULES.map((rule) => {
    const annualFrequency = finite(serviceDemand(rule, metrics, grade), `${rule.id}.annualFrequency`);
    const annualHours = finite(annualFrequency * serviceUnitHours(rule, grade), `${rule.id}.annualHours`);
    return { id: rule.id, category: 'service', action: rule.action, property: rule.property, basis: rule.basis, frequency: text(rule.frequency[grade] ?? 0), annualFrequency, annualHours, headcount: annualHours / SERVICE_ANNUAL_HOURS, annualCost: annualHours * SERVICE_HOURLY_RATE * factor };
  });
  const workloadEquivalentHeadcount = actions.reduce((sum, item) => sum + item.headcount, 0);
  const headcount = Math.ceil(workloadEquivalentHeadcount);
  return { actions, summary: {
    category: 'service',
    title: '服务',
    actionCount: 17,
    headcount,
    annualCost: headcount * SERVICE_HOURLY_RATE * WORKDAY_HOURS * WORKDAYS_PER_YEAR * factor,
    workloadAnnualCost: actions.reduce((sum, item) => sum + item.annualCost, 0),
    workloadEquivalentHeadcount,
  } };
}

function quantityFor(rule, metrics) {
  if (!(rule.quantitySource in metrics)) throw new Error(`未知数量来源：${rule.quantitySource}`);
  return finite(metrics[rule.quantitySource] * (rule.quantityScale ?? 1), `${rule.id}.quantity`);
}

function calculateAreaCategory({ rules, category, title, metrics, grade, factor, dailyRate }) {
  const actions = rules.map((rule) => {
    const calculationQuantity = quantityFor(rule, metrics);
    const quantity = rule.quantitySource === 'zero' ? undefined : calculationQuantity;
    const annualFrequency = finite(rule.annualFrequency[grade] ?? 0, `${rule.id}.annualFrequency`);
    const annualHours = finite(calculationQuantity * rule.baseUnitHours * (rule.unitHoursScale ?? 1) * GRADE_CORRECTION[grade] * annualFrequency, `${rule.id}.annualHours`);
    return {
      id: rule.id, category, action: rule.action, property: rule.property, unit: rule.unit, quantity,
      ...(rule.basis === undefined ? {} : { basis: rule.basis }),
      frequency: text(rule.frequency[grade] ?? 0), annualFrequency, annualHours,
      annualCost: annualHours * (dailyRate / WORKDAY_HOURS) * factor,
    };
  });
  const totalAnnualHours = actions.reduce((sum, item) => sum + item.annualHours, 0);
  const workloadEquivalentHeadcount = totalAnnualHours / WORKDAY_HOURS / WORKDAYS_PER_YEAR;
  const headcount = Math.ceil(workloadEquivalentHeadcount);
  return { actions, summary: {
    category,
    title,
    actionCount: rules.length,
    headcount,
    annualCost: dailyRate * headcount * WORKDAYS_PER_YEAR * factor,
    workloadAnnualCost: actions.reduce((sum, item) => sum + item.annualCost, 0),
    workloadEquivalentHeadcount,
  } };
}

function calculateAssistance(metrics, grade, factor) {
  let assistanceBaseRaw = 0;
  let assistanceWithReliefRaw = 0;
  const actions = ASSISTANCE_RULES.map((rule) => {
    const sources = { ...metrics, assistanceBaseRaw, assistanceWithReliefRaw };
    if (!(rule.quantitySource in sources)) throw new Error(`未知数量来源：${rule.quantitySource}`);
    const quantity = finite(sources[rule.quantitySource], `${rule.id}.quantity`);
    const standard = rule.standards[grade];
    let rawHeadcount;
    if (rule.type === 'multiply') rawHeadcount = quantity * standard;
    else if (rule.type === 'divide') rawHeadcount = standard === 0 ? 0 : quantity / standard;
    else throw new Error(`未知客助配人规则：${rule.type}`);
    rawHeadcount = finite(rawHeadcount, `${rule.id}.rawHeadcount`);
    if (['assistance-4', 'assistance-5', 'assistance-7', 'assistance-8'].includes(rule.id)) assistanceBaseRaw += rawHeadcount;
    if (rule.id === 'assistance-9') assistanceWithReliefRaw = assistanceBaseRaw + rawHeadcount;
    const headcount = Math.ceil(rawHeadcount);
    return { id: rule.id, category: 'assistance', action: rule.action, property: rule.property, unit: rule.unit, quantity, frequency: text(rule.frequency[grade]), headcount, annualCost: headcount * ASSISTANCE_MONTHLY_RATE * 12 * ASSISTANCE_BUDGET_FACTOR * factor };
  });
  const headcount = actions.reduce((sum, item) => sum + item.headcount, 0);
  const annualCost = headcount * ASSISTANCE_MONTHLY_RATE * 12 * ASSISTANCE_BUDGET_FACTOR * factor;
  return { actions, summary: {
    category: 'assistance',
    title: '客助',
    actionCount: 6,
    headcount,
    annualCost,
    workloadAnnualCost: annualCost,
    workloadEquivalentHeadcount: headcount,
  } };
}

export function calculateProject(project) {
  const grade = project.serviceGrade;
  const factor = FULL_MODEL_COST_FACTORS[project.costBand];
  if (factor === undefined) throw new Error(`未知城市成本档位：${String(project.costBand)}`);
  const advancedParameters = resolveAdvancedParameters(project);
  const parameters = parameterValues(advancedParameters);
  const metrics = deriveMetrics(project);
  const legacyGroups = [
    calculateService(metrics, grade, factor),
    calculateAreaCategory({ rules: CLEANING_RULES, category: 'cleaning', title: '清洁', metrics, grade, factor, dailyRate: CLEANING_DAILY_RATE[grade] }),
    calculateAreaCategory({ rules: GREENING_RULES, category: 'greening', title: '绿化', metrics, grade, factor, dailyRate: GREENING_DAILY_RATE[grade] }),
    calculateAssistance(metrics, grade, factor),
  ];
  const full = calculateFullCostModules(project, parameters);
  const groups = [...legacyGroups, ...full.groups];
  for (let index = 0; index < CATEGORY_CONFIG.length; index += 1) {
    const expected = CATEGORY_CONFIG[index];
    const current = groups[index];
    if (current?.summary.category !== expected.category) {
      throw new Error(`测算分类顺序异常：第 ${index + 1} 类应为 ${expected.category}`);
    }
    if (current.actions.length !== expected.expectedCount || current.summary.actionCount !== expected.expectedCount) {
      throw new Error(`${expected.title}测算结果数量异常：应为 ${expected.expectedCount} 项，实际为 ${current.actions.length} 项`);
    }
  }
  const categories = groups.map(({ summary }) => summary);
  const actions = groups.flatMap(({ actions: items }) => items).map((action) => ({
    ...action,
    source: 'baseline',
    enabled: true,
  }));
  const uniqueIds = new Set(actions.map(({ id }) => id));
  if (actions.length !== STANDARD_ACTION_COUNT || uniqueIds.size !== STANDARD_ACTION_COUNT) {
    throw new Error(`测算结果数量异常：应为 ${STANDARD_ACTION_COUNT} 项，实际为 ${actions.length} 项，唯一编号 ${uniqueIds.size} 项`);
  }
  const activeActionCount = actions.filter(({ enabled }) => enabled !== false).length;
  return {
    version: 2,
    calculatedAt: new Date().toISOString(),
    project,
    advancedParameterVersion: ADVANCED_PARAMETER_VERSION,
    advancedParameters,
    standardActionCount: STANDARD_ACTION_COUNT,
    activeActionCount,
    totalActionCount: activeActionCount,
    totalHeadcount: categories.reduce((sum, item) => sum + item.headcount, 0) + full.management.headcount,
    annualCost: categories.reduce((sum, item) => sum + item.annualCost, 0) + full.management.annualCost,
    workloadAnnualCost: categories.reduce((sum, item) => sum + item.workloadAnnualCost, 0),
    management: full.management,
    categories,
    actions,
  };
}
