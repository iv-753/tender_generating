import { resultValidationError } from '../../api/_lib/result-validation.mjs';

const ACTION_CODE = /^[A-Z]+-[A-Z]+-\d+\s+/;

function formatNumber(value, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('zh-CN', {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(Number(value));
}

function formatWholeNumber(value) {
  return formatNumber(Math.round(Number(value)), 0);
}

function cleanActionName(value) {
  return String(value ?? '').replace(ACTION_CODE, '').trim();
}

function compactBasis(value) {
  return String(value ?? '')
    .replaceAll('+', '＋')
    .replace(/\s+/g, '')
    .trim();
}

function compactFrequency(value) {
  return String(value ?? '')
    .replace('，48小时完成处理', '，48小时完成')
    .replace('建筑面积10万方配1人', '每10万㎡配1人')
    .replace(/\s+/g, '')
    .trim();
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

function staffingCount(value) {
  return `${Math.ceil(Number(value || 0))}人`;
}

function compactArea(value) {
  return `${formatWholeNumber(value)}㎡`;
}

function projectStage(project) {
  if (project.deliveredHouseholds > 0) return '已交付运营';
  return '前期筹备';
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

export function buildPresentationBindings(result, generatedAt = new Date()) {
  const validationError = resultValidationError(result);
  if (validationError) throw new Error(validationError);
  const project = result.project;
  const service = findCategory(result, 'service');
  const cleaning = findCategory(result, 'cleaning');
  const greening = findCategory(result, 'greening');
  const assistance = findCategory(result, 'assistance');
  const pestControl = findCategory(result, 'pestControl');
  const engineeringOutsourced = findCategory(result, 'engineeringOutsourced');
  const engineeringRoutine = findCategory(result, 'engineeringRoutine');

  const totalBuildings = project.buildings.reduce((sum, building) => sum + building.buildingCount, 0);
  const totalLobbyArea = project.buildings.reduce(
    (sum, building) => sum + building.buildingCount * building.standardLobbyArea,
    0,
  );
  const garageTotalArea = project.garageFloorArea * project.garageFloors;
  const unitPrice = project.residentialChargeArea > 0
    ? result.annualCost / project.residentialChargeArea / 12
    : 0;

  const complaint = findAction(result, 'service-12');
  const renovation = findAction(result, 'service-9');
  const report = findAction(result, 'service-17');
  const request = findAction(result, 'service-10');
  const gate = findAction(result, 'assistance-4');
  const publicPatrol = findAction(result, 'service-18');
  const patrolPost = findAction(result, 'assistance-8');
  const emergency = findAction(result, 'service-21');
  const lobbySweep = findAction(result, 'cleaning-25');
  const roadSweep = findAction(result, 'cleaning-14');
  const garageSweep = findAction(result, 'cleaning-47');
  const entranceSweep = findAction(result, 'cleaning-6');
  const lawnTrimA = findAction(result, 'greening-8');
  const lawnTrimB = findAction(result, 'greening-28');
  const treeTrim = findAction(result, 'greening-48');
  const shrubTrim = findAction(result, 'greening-49');
  const pestActions = ['greening-12', 'greening-21', 'greening-32', 'greening-41', 'greening-51']
    .map((id) => findAction(result, id));
  pestActions.forEach(Boolean);

  const cards = [
    {
      title: cleanActionName(complaint.action),
      scope: compactBasis(complaint.basis),
      frequency: compactFrequency(complaint.frequency),
    },
    {
      title: cleanActionName(renovation.action),
      scope: `已收未住${formatNumber(project.receivedHouseholds - project.occupiedHouseholds, 0)}户/常住${formatNumber(project.occupiedHouseholds, 0)}户`,
      frequency: compactFrequency(renovation.frequency),
    },
    {
      title: cleanActionName(report.action),
      scope: `已交付${formatNumber(project.deliveredHouseholds, 0)}户`,
      frequency: compactFrequency(report.frequency),
    },
    {
      title: cleanActionName(request.action),
      scope: `常住${formatNumber(project.occupiedHouseholds, 0)}户`,
      frequency: `即时受理·年均3次/户`,
    },
    {
      title: cleanActionName(gate.action),
      scope: `门岗${formatNumber(gate.quantity, 0)}个`,
      frequency: compactFrequency(gate.frequency),
    },
    {
      title: cleanActionName(publicPatrol.action),
      scope: '园区公共区域',
      frequency: compactFrequency(publicPatrol.frequency),
    },
    {
      title: cleanActionName(patrolPost.action),
      scope: compactArea(project.totalBuildingArea),
      frequency: '1人/10万㎡',
    },
    {
      title: cleanActionName(emergency.action),
      scope: '全项目',
      frequency: compactFrequency(emergency.frequency),
    },
    {
      title: '大堂及电梯厅巡扫',
      scope: compactArea(lobbySweep.quantity),
      frequency: compactFrequency(lobbySweep.frequency),
    },
    {
      title: '园区道路清扫',
      scope: compactArea(roadSweep.quantity),
      frequency: compactFrequency(roadSweep.frequency),
    },
    {
      title: '地下车库巡扫',
      scope: compactArea(garageSweep.quantity),
      frequency: compactFrequency(garageSweep.frequency),
    },
    {
      title: '出入口大门清扫',
      scope: compactArea(entranceSweep.quantity),
      frequency: compactFrequency(entranceSweep.frequency),
    },
    {
      title: '草坪修剪',
      scope: compactArea(lawnTrimA.quantity + lawnTrimB.quantity),
      frequency: compactFrequency(lawnTrimA.frequency),
    },
    {
      title: '乔灌木整形修剪',
      scope: `${formatNumber(treeTrim.quantity, 0)}株`,
      frequency: `乔木${compactFrequency(treeTrim.frequency)}·灌木${compactFrequency(shrubTrim.frequency)}`,
    },
    {
      title: '绿化浇灌',
      scope: compactArea(project.greenArea),
      frequency: '2次/周',
    },
    {
      title: '绿化病虫防制',
      scope: '草坪/地被/乔灌木',
      frequency: '草坪/地被2次/年\n乔灌木1次/年',
    },
  ];

  return {
    named: {
      'project-name-field': project.projectName,
      'proposal-date-field': dateLabel(generatedAt),
      'field-project-name-15': project.projectName,
      'field-project-region-15': project.region,
      'field-total-area': formatWholeNumber(project.totalBuildingArea),
      'field-charge-area': formatWholeNumber(project.residentialChargeArea),
      'field-delivered': formatWholeNumber(project.deliveredHouseholds),
      'field-handover': formatWholeNumber(project.receivedHouseholds),
      'field-occupied': formatWholeNumber(project.occupiedHouseholds),
      'field-project-0-0': formatWholeNumber(project.perimeterEntrances),
      'field-project-0-1': formatWholeNumber(project.pavedRoadArea),
      'field-project-0-2': formatWholeNumber(project.greenArea),
      'field-project-0-3': `${formatNumber(project.lawnRatio * 100)}%`,
      'field-project-1-0': formatWholeNumber(totalBuildings),
      'field-project-1-1': formatWholeNumber(project.buildings.length),
      'field-project-1-2': formatWholeNumber(project.gatehouses),
      'field-project-1-3': formatWholeNumber(totalLobbyArea),
      'field-project-2-0': formatWholeNumber(project.garageFloorArea),
      'field-project-2-1': formatWholeNumber(project.garageFloors),
      'field-project-2-2': formatWholeNumber(garageTotalArea),
      'field-project-2-3': projectStage(project),
      'field-service-grade': `${project.serviceGrade}级`,
      'field-cost-band': `${project.city.replace(/市$/, '')}地区基准`,
      'field-unit-price': unitPrice.toFixed(2),
      'field-annual-cost': (result.annualCost / 10000).toFixed(2),
      'field-headcount': String(Math.ceil(result.totalHeadcount)),
      'field-action-count': String(result.standardActionCount),
      'field-staffing-summary': `配置8类人员，共${staffingCount(result.totalHeadcount)}。`,
      'field-staffing-management': result.management.roles
        .map((role) => `${role.title}${staffingCount(role.headcount)}`)
        .join('、'),
      'field-staffing-customer': `客户服务${staffingCount(service.headcount)}、客助服务${staffingCount(assistance.headcount)}`,
      'field-staffing-environment': `环境清洁${staffingCount(cleaning.headcount)}、绿化养护${staffingCount(greening.headcount)}、四害消杀${staffingCount(pestControl.headcount)}`,
      'field-staffing-engineering': `工程委外${staffingCount(engineeringOutsourced.headcount)}、工程常规${staffingCount(engineeringRoutine.headcount)}`,
    },
    cards,
    summary: {
      annualCost: result.annualCost,
      unitPrice,
      headcount: result.totalHeadcount,
      actionCount: result.standardActionCount,
    },
  };
}
