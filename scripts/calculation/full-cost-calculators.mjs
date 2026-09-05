import { ENGINEERING_OUTSOURCED_RULES } from './rules/engineering-outsourced-rules.mjs';
import { ENGINEERING_ROUTINE_RULES } from './rules/engineering-routine-rules.mjs';
import { PEST_CONTROL_RULES } from './rules/pest-control-rules.mjs';
import {
  ENGINEERING_ANNUAL_CAPACITY_HOURS,
  ENGINEERING_BUDGET_FACTOR,
  ENGINEERING_OUTSOURCED_MONTHLY_RATE,
  ENGINEERING_ROUTINE_MONTHLY_RATE,
  FULL_MODEL_COST_FACTORS,
  MANAGEMENT_BUDGET_FACTOR,
  PEST_WORKDAY_RATE,
  WORKDAY_HOURS,
  WORKDAYS_PER_YEAR,
} from './rules/constants.mjs';

const GRADES = new Set(['A', 'B', 'C', 'D']);
const PEST_WORKDAYS_PER_STAFF_YEAR = 12 * 30;
const MANAGEMENT_ROLES = Object.freeze([
  Object.freeze({ title: '项目经理', monthlyRate: 18000, headcount: 1 }),
  Object.freeze({ title: '管家主任', monthlyRate: 10000, headcount: 1 }),
  Object.freeze({ title: '工程主任', monthlyRate: 10000, headcount: 1 }),
  Object.freeze({ title: '客助主任', monthlyRate: 10000, headcount: 1 }),
]);

function finiteNonNegative(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`${label}必须为有限非负数`);
  }
  return value;
}

function requiredGradeValue(values, grade, label) {
  if (!values || !Object.hasOwn(values, grade)) throw new Error(`${label}缺失`);
  return finiteNonNegative(values[grade], label);
}

function quantityFor(rule, parameters) {
  if (!parameters || typeof parameters !== 'object' || Array.isArray(parameters)) {
    throw new Error('高级参数必须为对象');
  }
  if (!Object.hasOwn(parameters, rule.quantityParameterKey)) {
    throw new Error(`${rule.id}参数缺失：${rule.quantityParameterKey}`);
  }
  return finiteNonNegative(parameters[rule.quantityParameterKey], `${rule.id}.quantity`);
}

function workloadAction(rule, category, grade, quantity, hourlyRate) {
  const annualFrequency = requiredGradeValue(
    rule.annualFrequency,
    grade,
    `${rule.id}.annualFrequency`,
  );
  const unitHours = requiredGradeValue(rule.unitHours, grade, `${rule.id}.unitHours`);
  const rate = finiteNonNegative(hourlyRate, `${rule.id}.hourlyRate`);
  if (!rule.frequency || !Object.hasOwn(rule.frequency, grade)) {
    throw new Error(`${rule.id}.frequency缺失`);
  }
  const annualHours = finiteNonNegative(
    quantity * unitHours * annualFrequency,
    `${rule.id}.annualHours`,
  );
  return {
    id: rule.id,
    category,
    action: rule.action,
    property: rule.property,
    unit: rule.unit,
    quantity,
    frequency: String(rule.frequency[grade]),
    annualFrequency,
    annualHours,
    annualCost: finiteNonNegative(annualHours * rate, `${rule.id}.annualCost`),
  };
}

function calculateActions(rules, category, grade, parameters, hourlyRateFor, costFactor) {
  return rules.map((rule) => workloadAction(
    rule,
    category,
    grade,
    quantityFor(rule, parameters),
    finiteNonNegative(hourlyRateFor(rule), `${rule.id}.baseHourlyRate`) * costFactor,
  ));
}

function engineeringSummary(category, title, actions, monthlyRate, costFactor) {
  const annualHours = finiteNonNegative(
    actions.reduce((sum, item) => sum + item.annualHours, 0),
    `${category}.annualHours`,
  );
  const workloadEquivalentHeadcount = finiteNonNegative(
    annualHours / ENGINEERING_ANNUAL_CAPACITY_HOURS,
    `${category}.workloadEquivalentHeadcount`,
  );
  const headcount = Math.ceil(workloadEquivalentHeadcount);
  return {
    category,
    title,
    actionCount: actions.length,
    annualHours,
    headcount,
    annualCost: finiteNonNegative(
      headcount * monthlyRate * 12 * ENGINEERING_BUDGET_FACTOR * costFactor,
      `${category}.annualCost`,
    ),
    workloadAnnualCost: finiteNonNegative(
      actions.reduce((sum, item) => sum + item.annualCost, 0),
      `${category}.workloadAnnualCost`,
    ),
    workloadEquivalentHeadcount,
  };
}

function calculatePest(grade, parameters, costFactor) {
  const actions = calculateActions(
    PEST_CONTROL_RULES,
    'pestControl',
    grade,
    parameters,
    () => PEST_WORKDAY_RATE / WORKDAY_HOURS,
    costFactor,
  );

  // The workbook stores one shared workload across the seven labels in a merged range.
  const annualHours = actions[0]?.annualHours ?? 0;
  const annualWorkdays = finiteNonNegative(
    annualHours / WORKDAY_HOURS,
    'pestControl.annualWorkdays',
  );
  const headcount = finiteNonNegative(
    annualWorkdays / PEST_WORKDAYS_PER_STAFF_YEAR,
    'pestControl.headcount',
  );
  return {
    actions,
    summary: {
      category: 'pestControl',
      title: '四害消杀',
      actionCount: actions.length,
      annualHours,
      annualWorkdays,
      headcount,
      annualCost: finiteNonNegative(
        headcount * PEST_WORKDAY_RATE * WORKDAYS_PER_YEAR * costFactor,
        'pestControl.annualCost',
      ),
      workloadAnnualCost: finiteNonNegative(
        annualHours * (PEST_WORKDAY_RATE / WORKDAY_HOURS) * costFactor,
        'pestControl.workloadAnnualCost',
      ),
      workloadEquivalentHeadcount: headcount,
    },
  };
}

function calculateEngineering({
  rules,
  category,
  title,
  grade,
  parameters,
  workloadMonthlyRateFor,
  budgetMonthlyRate,
  costFactor,
}) {
  const actions = calculateActions(
    rules,
    category,
    grade,
    parameters,
    (rule) => finiteNonNegative(
      workloadMonthlyRateFor(rule),
      `${rule.id}.monthlyRate`,
    ) / 30 / WORKDAY_HOURS,
    costFactor,
  );
  return {
    actions,
    summary: engineeringSummary(category, title, actions, budgetMonthlyRate, costFactor),
  };
}

function calculateManagement(costFactor) {
  const headcount = MANAGEMENT_ROLES.reduce((sum, role) => sum + role.headcount, 0);
  const monthlyCost = MANAGEMENT_ROLES.reduce(
    (sum, role) => sum + role.monthlyRate * role.headcount,
    0,
  );
  return {
    category: 'management',
    title: '管理人员',
    roles: MANAGEMENT_ROLES.map((role) => ({ ...role })),
    headcount,
    annualCost: finiteNonNegative(
      monthlyCost * 12 * MANAGEMENT_BUDGET_FACTOR * costFactor,
      'management.annualCost',
    ),
  };
}

export function calculateFullCostModules(project, parameters) {
  if (!project || typeof project !== 'object' || Array.isArray(project)) {
    throw new Error('项目数据无效');
  }
  const grade = project.serviceGrade;
  if (!GRADES.has(grade)) throw new Error(`未知服务等级：${String(grade)}`);
  if (!Object.hasOwn(FULL_MODEL_COST_FACTORS, project.costBand)) {
    throw new Error(`未知城市成本档位：${String(project.costBand)}`);
  }
  const costFactor = finiteNonNegative(
    FULL_MODEL_COST_FACTORS[project.costBand],
    `${project.costBand}.costFactor`,
  );
  const groups = [
    calculatePest(grade, parameters, costFactor),
    calculateEngineering({
      rules: ENGINEERING_OUTSOURCED_RULES,
      category: 'engineeringOutsourced',
      title: '工程委外',
      grade,
      parameters,
      workloadMonthlyRateFor: (rule) => rule.monthlyRate,
      budgetMonthlyRate: ENGINEERING_OUTSOURCED_MONTHLY_RATE,
      costFactor,
    }),
    calculateEngineering({
      rules: ENGINEERING_ROUTINE_RULES,
      category: 'engineeringRoutine',
      title: '工程常规',
      grade,
      parameters,
      workloadMonthlyRateFor: () => ENGINEERING_ROUTINE_MONTHLY_RATE,
      budgetMonthlyRate: ENGINEERING_ROUTINE_MONTHLY_RATE,
      costFactor,
    }),
  ];
  return { groups, management: calculateManagement(costFactor) };
}
