import init, { Workbook } from 'formualizer';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ADVANCED_PARAMETER_VERSION, resolveAdvancedParameters } from './advanced-parameters.mjs';
import { STANDARD_ACTION_COUNT } from './category-config.mjs';
import { ENGINEERING_OUTSOURCED_RULES } from './rules/engineering-outsourced-rules.mjs';
import { ENGINEERING_ROUTINE_RULES } from './rules/engineering-routine-rules.mjs';
import { PEST_CONTROL_RULES } from './rules/pest-control-rules.mjs';
import {
  ASSISTANCE_BUDGET_FACTOR,
  FULL_MODEL_COST_FACTORS,
  MANAGEMENT_BUDGET_FACTOR,
  SERVICE_ANNUAL_HOURS,
  WORKDAY_HOURS,
  WORKDAYS_PER_YEAR,
} from './rules/constants.mjs';

const WORKBOOK_FILE_NAME = '动态成本分析模型.xlsx';

export async function resolveWorkbookModelPath({ env = process.env, startUrl = import.meta.url } = {}) {
  const explicit = env.FULL_MODEL_WORKBOOK_PATH;
  if (explicit) {
    const resolved = path.resolve(explicit);
    try {
      await access(resolved);
      return resolved;
    } catch {
      throw new Error(`FULL_MODEL_WORKBOOK_PATH 指向的工作簿不存在：${resolved}`);
    }
  }

  let directory = path.dirname(fileURLToPath(startUrl));
  while (true) {
    const candidate = path.join(directory, WORKBOOK_FILE_NAME);
    try {
      await access(candidate);
      return candidate;
    } catch {
      const parent = path.dirname(directory);
      if (parent === directory) break;
      directory = parent;
    }
  }
  throw new Error(`无法从 ${fileURLToPath(startUrl)} 向上定位 ${WORKBOOK_FILE_NAME}；可设置 FULL_MODEL_WORKBOOK_PATH`);
}

const ACTION_COUNTS = {
  service: 17,
  cleaning: 48,
  greening: 51,
  assistance: 6,
  pestControl: 7,
  engineeringOutsourced: 95,
  engineeringRoutine: 228,
};
const GRADES = { A: '紫荆花', B: '金百合', C: '郁金香', D: '向日葵' };
const GRADE_COLUMNS = { A: 5, B: 7, C: 9, D: 11 };
const ASSISTANCE_ROWS = [4, 5, 7, 8, 9, 10];

const text = (value) => value === null || value === undefined || value === '' ? '' : String(value);
const number = (value) => typeof value === 'number' && Number.isFinite(value) ? value : Number(value) || 0;
const optionalNumber = (value) => value === null || value === undefined || value === '' ? undefined : number(value);
const safeValue = (value) => ['string', 'number', 'boolean'].includes(typeof value) ? value : undefined;

function writeInputs(workbook, project) {
  const sheet = workbook.sheet('总-汇总表');
  sheet.setValue(6, 2, GRADES[project.serviceGrade]);
  sheet.setValues(19, 7, [[project.totalBuildingArea, project.residentialChargeArea, project.deliveredHouseholds, project.receivedHouseholds, project.occupiedHouseholds]]);
  sheet.setValues(24, 7, [[project.perimeterEntrances, project.gatehouses, project.pavedRoadArea, project.greenArea, project.lawnRatio, project.seasonalFlowerArea, project.winterProtectionArea]]);
  for (let row = 12; row <= 44; row += 1) sheet.setValue(row, 3, null);
  for (let index = 0; index < 5; index += 1) {
    const item = project.buildings[index];
    sheet.setValues(29 + index, 8, [[...(item ? [item.buildingCount, item.lobbyElevatorCount, item.stiltFloorArea, item.totalFloors, item.standardLobbyArea, item.evacuationStairArea, item.rooftopArea] : [null, null, null, null, null, null, null])]]);
  }
  sheet.setValues(37, 7, [[project.garageFloorArea, project.garageFloors]]);
}

function readService(workbook, factor) {
  const sheet = workbook.sheet('服务');
  return Array.from({ length: ACTION_COUNTS.service }, (_, index) => {
    const row = index + 5;
    return { id: `service-${row}`, category: 'service', action: text(sheet.getValue(row, 1)), property: text(sheet.getValue(row, 8)), basis: text(sheet.getValue(row, 15)), frequency: text(sheet.getValue(row, 13)), annualFrequency: optionalNumber(sheet.getValue(row, 16)), annualHours: optionalNumber(sheet.getValue(row, 17)), headcount: optionalNumber(sheet.getValue(row, 20)), annualCost: number(sheet.getValue(row, 19)) * factor };
  });
}

function readCleaning(workbook, factor) {
  const sheet = workbook.sheet('清洁');
  let surface = '';
  let location = '';
  return Array.from({ length: ACTION_COUNTS.cleaning }, (_, index) => {
    const row = index + 5;
    surface = text(sheet.getValue(row, 1)) || surface;
    location = text(sheet.getValue(row, 2)) || location;
    const annualHours = number(sheet.getValue(row, 25));
    return { id: `cleaning-${row}`, category: 'cleaning', action: text(sheet.getValue(row, 3)), property: text(sheet.getValue(row, 13)), unit: text(sheet.getValue(row, 4)), quantity: safeValue(sheet.getValue(row, 5)), basis: [surface, location].filter(Boolean).join(' / '), frequency: text(sheet.getValue(row, 22)), annualFrequency: optionalNumber(sheet.getValue(row, 24)), annualHours: optionalNumber(sheet.getValue(row, 25)), annualCost: annualHours * number(sheet.getValue(row, 27)) * factor };
  });
}

function readGreening(workbook, factor) {
  const sheet = workbook.sheet('绿化');
  return Array.from({ length: ACTION_COUNTS.greening }, (_, index) => {
    const row = index + 5;
    return { id: `greening-${row}`, category: 'greening', action: text(sheet.getValue(row, 1)), property: text(sheet.getValue(row, 10)), unit: text(sheet.getValue(row, 2)), quantity: safeValue(sheet.getValue(row, 3)), frequency: text(sheet.getValue(row, 19)), annualFrequency: optionalNumber(sheet.getValue(row, 21)), annualHours: optionalNumber(sheet.getValue(row, 22)), annualCost: number(sheet.getValue(row, 25)) * factor };
  });
}

function readAssistance(workbook, project, factor) {
  const sheet = workbook.sheet('客助');
  const monthlyPrice = number(sheet.getValue(12, 16));
  return ASSISTANCE_ROWS.map((row) => {
    const headcount = number(sheet.getValue(row, 16));
    return { id: `assistance-${row}`, category: 'assistance', action: text(sheet.getValue(row, 1)), property: text(sheet.getValue(row, 4)), unit: text(sheet.getValue(row, 2)), quantity: safeValue(sheet.getValue(row, 3)), frequency: text(sheet.getValue(row, GRADE_COLUMNS[project.serviceGrade])), headcount, annualCost: headcount * monthlyPrice * 12 * ASSISTANCE_BUDGET_FACTOR * factor };
  });
}

function readSummaries(workbook, project, factor) {
  const definitions = [
    ['service', '服务', 17, 26, 20, 27, 20],
    ['cleaning', '清洁', 48, 58, 28, 60, 27],
    ['greening', '绿化', 51, 59, 26, 61, 26],
    ['assistance', '客助', 6, 11, 16, 13, 16],
  ];
  return definitions.map(([category, title, actionCount, headRow, headColumn, costRow, costColumn]) => {
    const sheet = workbook.sheet(title);
    const actions = category === 'service' ? readService(workbook, factor)
      : category === 'cleaning' ? readCleaning(workbook, factor)
        : category === 'greening' ? readGreening(workbook, factor)
          : readAssistance(workbook, project, factor);
    const annualHours = actions.reduce((sum, item) => sum + number(item.annualHours), 0);
    const headcount = number(sheet.getValue(headRow, headColumn));
    const assistanceFactor = category === 'assistance' ? ASSISTANCE_BUDGET_FACTOR : 1;
    return {
      category,
      title,
      actionCount,
      headcount,
      annualCost: number(sheet.getValue(costRow, costColumn)) * assistanceFactor * factor,
      workloadAnnualCost: actions.reduce((sum, item) => sum + item.annualCost, 0),
      workloadEquivalentHeadcount: category === 'assistance'
        ? headcount
        : annualHours / (category === 'service' ? SERVICE_ANNUAL_HOURS : WORKDAY_HOURS * WORKDAYS_PER_YEAR),
    };
  });
}

function readPest(workbook, factor) {
  const sheet = workbook.sheet('四害消杀');
  const sharedQuantity = number(sheet.getValue(5, 3));
  const sharedUnitHours = number(sheet.getValue(5, 8));
  const annualFrequency = number(sheet.getValue(5, 11));
  const sharedAnnualHours = number(sheet.getValue(5, 12));
  const sharedAnnualCost = number(sheet.getValue(5, 14)) * factor;
  const actions = PEST_CONTROL_RULES.map((rule) => ({
    id: rule.id,
    category: 'pestControl',
    action: text(sheet.getValue(Number(rule.source.split(':')[1]), 1)),
    property: rule.property,
    unit: rule.unit,
    quantity: sharedQuantity,
    frequency: text(sheet.getValue(5, 10)),
    annualFrequency,
    unitHours: sharedUnitHours / ACTION_COUNTS.pestControl,
    annualHours: sharedAnnualHours / ACTION_COUNTS.pestControl,
    annualCost: sharedAnnualCost / ACTION_COUNTS.pestControl,
    sourceSharedUnitHours: sharedUnitHours,
    sharedWorkloadGroup: 'pest-control',
    allocationRatio: 1 / ACTION_COUNTS.pestControl,
  }));
  const headcount = number(sheet.getValue(14, 15));
  return {
    actions,
    summary: {
      category: 'pestControl',
      title: '四害消杀',
      actionCount: actions.length,
      annualHours: sharedAnnualHours,
      annualWorkdays: sharedAnnualHours / WORKDAY_HOURS,
      headcount,
      annualCost: number(sheet.getValue(18, 15)) * factor,
      workloadAnnualCost: sharedAnnualCost,
      workloadEquivalentHeadcount: headcount,
    },
  };
}

function readEngineering(workbook, {
  sheetName,
  rules,
  category,
  title,
  summaryRow,
  equivalentHeadcountRow,
  roundedHeadcountRow,
  budgetRow,
  factor,
}) {
  const sheet = workbook.sheet(sheetName);
  const actions = rules.map((rule) => {
    const row = Number(rule.source.split(':')[1]);
    return {
      id: rule.id,
      category,
      action: text(sheet.getValue(row, 1)),
      property: rule.property,
      unit: text(sheet.getValue(row, 3)),
      quantity: number(sheet.getValue(row, 4)),
      frequency: text(sheet.getValue(row, 11)),
      annualFrequency: number(sheet.getValue(row, 14)),
      unitHours: number(sheet.getValue(row, 9)),
      annualHours: number(sheet.getValue(row, 15)),
      annualCost: number(sheet.getValue(row, category === 'engineeringOutsourced' ? 19 : 18)) * factor,
    };
  });
  const summaryCostColumn = category === 'engineeringOutsourced' ? 19 : 18;
  const headcountColumn = category === 'engineeringOutsourced' ? 20 : 19;
  return {
    actions,
    summary: {
      category,
      title,
      actionCount: actions.length,
      annualHours: actions.reduce((sum, item) => sum + item.annualHours, 0),
      headcount: number(sheet.getValue(roundedHeadcountRow, headcountColumn)),
      annualCost: number(sheet.getValue(budgetRow, headcountColumn)) * factor,
      workloadAnnualCost: number(sheet.getValue(summaryRow, summaryCostColumn)) * factor,
      workloadEquivalentHeadcount: number(sheet.getValue(equivalentHeadcountRow, headcountColumn)),
    },
  };
}

function readManagement(workbook, factor) {
  const sheet = workbook.sheet('管理模块');
  const roles = Array.from({ length: 4 }, (_, index) => {
    const row = index + 4;
    return {
      title: text(sheet.getValue(row, 1)),
      monthlyRate: number(sheet.getValue(row, 2)),
      headcount: number(sheet.getValue(row, 5)),
    };
  });
  return {
    category: 'management',
    title: '管理人员',
    roles,
    headcount: number(sheet.getValue(8, 5)),
    annualCost: number(sheet.getValue(8, 7)) * MANAGEMENT_BUDGET_FACTOR * factor,
  };
}

export async function createWorkbookOracle(modelBytes) {
  await init();
  const bytes = modelBytes instanceof Uint8Array ? modelBytes : new Uint8Array(modelBytes);
  return function calculate(project) {
    const workbook = Workbook.fromXlsxBytes(bytes);
    writeInputs(workbook, project);
    workbook.evaluateAll();
    const factor = FULL_MODEL_COST_FACTORS[project.costBand];
    if (factor === undefined) throw new Error(`未知城市成本档位：${String(project.costBand)}`);
    const legacyActions = [
      ...readService(workbook, factor),
      ...readCleaning(workbook, factor),
      ...readGreening(workbook, factor),
      ...readAssistance(workbook, project, factor),
    ];
    const legacyCategories = readSummaries(workbook, project, factor);
    const pest = readPest(workbook, factor);
    const outsourced = readEngineering(workbook, {
      sheetName: '工程委外', rules: ENGINEERING_OUTSOURCED_RULES,
      category: 'engineeringOutsourced', title: '工程委外',
      summaryRow: 100, equivalentHeadcountRow: 103, roundedHeadcountRow: 104, budgetRow: 106, factor,
    });
    const routine = readEngineering(workbook, {
      sheetName: '工程常规', rules: ENGINEERING_ROUTINE_RULES,
      category: 'engineeringRoutine', title: '工程常规',
      summaryRow: 233, equivalentHeadcountRow: 236, roundedHeadcountRow: 237, budgetRow: 239, factor,
    });
    const groups = [pest, outsourced, routine];
    const categories = [...legacyCategories, ...groups.map(({ summary }) => summary)];
    const actions = [...legacyActions, ...groups.flatMap(({ actions: items }) => items)];
    const management = readManagement(workbook, factor);
    const advancedParameters = resolveAdvancedParameters(project);
    const annualCost = categories.reduce((sum, item) => sum + item.annualCost, 0) + management.annualCost;
    return {
      version: 2,
      calculatedAt: new Date().toISOString(),
      project,
      advancedParameterVersion: ADVANCED_PARAMETER_VERSION,
      advancedParameters,
      standardActionCount: STANDARD_ACTION_COUNT,
      activeActionCount: actions.length,
      totalActionCount: actions.length,
      totalHeadcount: categories.reduce((sum, item) => sum + item.headcount, 0) + management.headcount,
      annualCost,
      workloadAnnualCost: categories.reduce((sum, item) => sum + item.workloadAnnualCost, 0),
      unitPrice: number(workbook.sheet('总-汇总表').getValue(8, 2)) * factor,
      management,
      categories,
      actions,
    };
  };
}
