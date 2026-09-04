import init, { Workbook } from 'formualizer';

const ACTION_COUNTS = { service: 17, cleaning: 48, greening: 51, assistance: 6 };
const FACTORS = { high: 1.2, upper: 1.1, standard: 1, base: 0.9 };
const GRADES = { A: '紫荆花', B: '金百合', C: '郁金香', D: '向日葵' };
const GRADE_COLUMNS = { A: 5, B: 7, C: 9, D: 11 };
const ASSISTANCE_ROWS = [4, 5, 7, 8, 9, 10];

function text(value) {
  return value === null || value === undefined || value === '' ? '' : String(value);
}

function number(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function optionalNumber(value) {
  return value === null || value === undefined || value === '' ? undefined : number(value);
}

function safeValue(value) {
  return ['string', 'number', 'boolean'].includes(typeof value) ? value : undefined;
}

export function validateProject(project) {
  if (!project || typeof project !== 'object') return '项目数据无效';
  if (!text(project.projectName).trim()) return '请填写项目名称';
  if (!text(project.region).trim() || !text(project.city).trim()) return '请填写项目地区和城市';
  if (!GRADES[project.serviceGrade] || !FACTORS[project.costBand]) return '测算参数无效';
  if (number(project.occupiedHouseholds) > number(project.receivedHouseholds)) return '常住户数不能大于已收楼户数';
  if (number(project.receivedHouseholds) > number(project.deliveredHouseholds)) return '已收楼户数不能大于已交付户数';
  if (number(project.lawnRatio) < 0 || number(project.lawnRatio) > 1) return '草坪比例必须在 0%—100% 之间';
  if (!Array.isArray(project.buildings) || project.buildings.length < 1 || project.buildings.length > 5) return '楼栋类型必须为 1—5 类';
  const numbers = [project.totalBuildingArea, project.residentialChargeArea, project.deliveredHouseholds, project.receivedHouseholds, project.occupiedHouseholds, project.perimeterEntrances, project.gatehouses, project.pavedRoadArea, project.greenArea, project.lawnRatio, project.seasonalFlowerArea, project.winterProtectionArea, project.garageFloorArea, project.garageFloors, ...project.buildings.flatMap((item) => Object.values(item))];
  if (numbers.some((value) => typeof value !== 'number' || !Number.isFinite(value) || value < 0)) return '所有数值必须为非负数';
}

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
    return { id: `assistance-${row}`, category: 'assistance', action: text(sheet.getValue(row, 1)), property: text(sheet.getValue(row, 4)), unit: text(sheet.getValue(row, 2)), quantity: safeValue(sheet.getValue(row, 3)), frequency: text(sheet.getValue(row, GRADE_COLUMNS[project.serviceGrade])), headcount, annualCost: headcount * monthlyPrice * 12 * factor };
  });
}

function readSummaries(workbook, factor) {
  const definitions = [
    ['service', '服务', 17, 26, 20, 27, 20],
    ['cleaning', '清洁', 48, 58, 28, 60, 27],
    ['greening', '绿化', 51, 59, 26, 61, 26],
    ['assistance', '客助', 6, 11, 16, 13, 16],
  ];
  return definitions.map(([category, title, actionCount, headRow, headColumn, costRow, costColumn]) => {
    const sheet = workbook.sheet(title);
    return { category, title, actionCount, headcount: number(sheet.getValue(headRow, headColumn)), annualCost: number(sheet.getValue(costRow, costColumn)) * factor };
  });
}

export async function createCalculator(modelBytes) {
  await init();
  const bytes = modelBytes instanceof Uint8Array ? modelBytes : new Uint8Array(modelBytes);
  return function calculate(project) {
    const workbook = Workbook.fromXlsxBytes(bytes);
    writeInputs(workbook, project);
    workbook.evaluateAll();
    const factor = FACTORS[project.costBand];
    const actions = [...readService(workbook, factor), ...readCleaning(workbook, factor), ...readGreening(workbook, factor), ...readAssistance(workbook, project, factor)];
    if (actions.length !== 122) throw new Error(`测算结果数量异常：应为 122 项，实际为 ${actions.length} 项`);
    const categories = readSummaries(workbook, factor);
    return { version: 1, calculatedAt: new Date().toISOString(), project, totalActionCount: actions.length, totalHeadcount: categories.reduce((sum, item) => sum + item.headcount, 0), annualCost: categories.reduce((sum, item) => sum + item.annualCost, 0), categories, actions };
  };
}
