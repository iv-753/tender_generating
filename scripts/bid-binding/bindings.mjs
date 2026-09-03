const range = (start, end) => Array.from({ length: end - start + 1 }, (_, index) => start + index);

export const ACTION_ROW_IDS = [
  ...range(5, 21).map((row) => `service-${row}`),
  ...range(5, 52).map((row) => `cleaning-${row}`),
  ...range(5, 15).map((row) => `greening-${row}`),
  ...range(17, 21).map((row) => `greening-${row}`),
  ...range(23, 35).map((row) => `greening-${row}`),
  ...range(37, 41).map((row) => `greening-${row}`),
  ...range(43, 52).map((row) => `greening-${row}`),
];

export const STAFFING_ROW_IDS = [4, 5, 7, 8, 9, 10].map((row) => `assistance-${row}`);

const ACTION_CODE = /^[A-Z]+-[A-Z]+-\d+\s+/;

function cleanActionName(value) {
  return String(value ?? '').replace(ACTION_CODE, '').trim();
}

function formatNumber(value, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(Number(value));
}

function formatQuantity(value, unit) {
  if (value === undefined || value === null || value === '') return '—';
  const normalizedUnit = String(unit ?? '').trim().toLowerCase() === 'm2' ? '平方米' : String(unit ?? '').trim();
  return `${formatNumber(value)}${normalizedUnit}`;
}

function dateLabel(date) {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}年${values.month}月${values.day}日`;
}

function findAction(result, id) {
  const item = result.actions.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`缺少测算动作 ${id}`);
  return item;
}

function findCategory(result, category) {
  const item = result.categories.find((candidate) => candidate.category === category);
  if (!item) throw new Error(`缺少测算分类 ${category}`);
  return item;
}

function actionTitle(item) {
  if (item.category !== 'cleaning') return cleanActionName(item.action);
  const location = String(item.basis ?? '').replace(/[\s/]+/g, '');
  return `${location}${cleanActionName(item.action)}`;
}

function actionScope(item) {
  if (item.category === 'service') return String(item.basis || '—').trim();
  return formatQuantity(item.quantity, item.unit);
}

function percent(part, total) {
  if (!Number.isFinite(total) || total <= 0) return '0.0%';
  return `${((part / total) * 100).toFixed(1)}%`;
}

export function buildBidBindings(result, generatedAt = new Date(), supplemental = {}) {
  if (!result?.project || !Array.isArray(result.actions)) {
    throw new Error('标书生成需要完整的122项测算结果');
  }
  if (!Number.isFinite(result.annualCost) || result.annualCost < 0) throw new Error('测算结果缺少有效年成本');

  const project = result.project;
  const service = findCategory(result, 'service');
  const cleaning = findCategory(result, 'cleaning');
  const greening = findCategory(result, 'greening');
  const assistance = findCategory(result, 'assistance');
  const totalBuildings = project.buildings.reduce((sum, item) => sum + Number(item.buildingCount || 0), 0);
  const garageArea = Number(project.garageFloorArea || 0) * Number(project.garageFloors || 0);
  const unitPrice = project.residentialChargeArea > 0
    ? result.annualCost / project.residentialChargeArea / 12
    : 0;

  const named = {
    '项目名称': project.projectName,
    '项目所在地': project.region,
    '所在城市': project.city,
    '服务等级': `${project.serviceGrade}级`,
    '编制日期': dateLabel(generatedAt),
    '物业类型': supplemental.propertyType,
    '项目负责人': supplemental.projectManager,
    '服务期限': supplemental.servicePeriod,
    '总建筑面积': formatNumber(project.totalBuildingArea),
    '计费面积': formatNumber(project.residentialChargeArea),
    '总户数': formatNumber(project.deliveredHouseholds, 0),
    '已交付户数': formatNumber(project.deliveredHouseholds, 0),
    '常住户数': formatNumber(project.occupiedHouseholds, 0),
    '楼栋数量': formatNumber(totalBuildings, 0),
    '出入口数量': formatNumber(project.gatehouses, 0),
    '绿化面积': formatNumber(project.greenArea),
    '车库面积': formatNumber(garageArea),
    '绿化养护面积': formatNumber(project.greenArea),
    '年度运营成本': (result.annualCost / 10000).toFixed(2),
    '综合单价': unitPrice.toFixed(2),
    '客户服务人数': String(Math.ceil(service.headcount)),
    '客助服务人数': String(Math.ceil(assistance.headcount)),
    '环境清洁人数': String(Math.ceil(cleaning.headcount)),
    '绿化养护人数': String(Math.ceil(greening.headcount)),
    '人员总数': String(Math.ceil(result.totalHeadcount)),
    '客户服务成本': (service.annualCost / 10000).toFixed(2),
    '客户服务占比': percent(service.annualCost, result.annualCost),
    '客助服务成本': (assistance.annualCost / 10000).toFixed(2),
    '客助服务占比': percent(assistance.annualCost, result.annualCost),
    '环境清洁成本': (cleaning.annualCost / 10000).toFixed(2),
    '环境清洁占比': percent(cleaning.annualCost, result.annualCost),
    '绿化养护成本': (greening.annualCost / 10000).toFixed(2),
    '绿化养护占比': percent(greening.annualCost, result.annualCost),
    ...supplemental.named,
  };

  const bindings = {
    named: Object.fromEntries(Object.entries(named).filter(([, value]) => value !== undefined && value !== null)),
    actionRows: ACTION_ROW_IDS.map((id) => {
      const item = findAction(result, id);
      return {
        id,
        expectedTitle: actionTitle(item),
        scope: actionScope(item),
        frequency: String(item.frequency || '不设置').trim(),
      };
    }),
    staffingRows: STAFFING_ROW_IDS.map((id) => {
      const item = findAction(result, id);
      return {
        id,
        expectedTitle: cleanActionName(item.action),
        basis: formatQuantity(item.quantity, item.unit),
        standard: String(item.frequency || '不设置').trim(),
        headcount: String(Math.ceil(Number(item.headcount || 0))),
      };
    }),
  };
  if (result.totalActionCount !== 122 || result.actions.length !== 122) {
    throw new Error('标书生成需要完整的122项测算结果');
  }
  return bindings;
}
