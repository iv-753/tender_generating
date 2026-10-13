import { ADVANCED_PARAMETER_DEFINITIONS } from '../calculation/rules/advanced-parameter-definitions.mjs';

export const normalizeLabel = value => String(value ?? '').trim().replace(/（[^）]*）|\([^)]*\)/g, '').replace(/[\s／/·：:、，,%％]/g, '');
const base = (key, label, unit = '', extra = {}) => ({ key, label, unit, target: 'project', section: '基础资料', ...extra });
export const BASIC_IMPORT_FIELDS = [
  base('projectName', '项目名称', '', { type: 'text' }), base('region', '省份', '', { type: 'text' }),
  base('city', '城市', '', { type: 'text' }), base('district', '区／县', '', { type: 'text', aliases: ['区县', '行政区'] }),
  base('serviceGrade', '服务档位', '', { type: 'grade', aliases: ['服务等级', '服务档次'] }),
  base('totalBuildingArea', '总建筑面积', '㎡'), base('residentialChargeArea', '住宅收费面积', '㎡'),
  base('deliveredHouseholds', '已交付户数', '户', { integer: true }), base('receivedHouseholds', '已收楼户数', '户', { integer: true }),
  base('occupiedHouseholds', '常住户数', '户', { integer: true }), base('perimeterEntrances', '出入口及外围面积', '㎡'),
  base('gatehouses', '门楼数量', '个', { integer: true }), base('pavedRoadArea', '道路铺装面积', '㎡'),
  base('greenArea', '绿化面积', '㎡'), base('lawnRatio', '草坪占绿化面积比例', '%', { type: 'ratio', aliases: ['草坪比例'] }),
  base('seasonalFlowerArea', '时花面积', '㎡'), base('winterProtectionArea', '植物防寒面积', '㎡', { aliases: ['防寒面积'] }),
  base('garageFloorArea', '单层车库面积', '㎡'), base('garageFloors', '车库层数', '层', { integer: true }),
];
export const BUILDING_IMPORT_FIELDS = [
  base('buildingCount', '楼栋数量', '栋', { integer: true }), base('lobbyElevatorCount', '大堂及电梯厅面积', '㎡'),
  base('stiltFloorArea', '架空层面积', '㎡'), base('totalFloors', '楼层总数', '层', { integer: true }),
  base('standardLobbyArea', '标准前厅面积', '㎡'), base('evacuationStairArea', '疏散楼梯面积', '㎡'), base('rooftopArea', '天台面积', '㎡'),
];
export const ASSET_IMPORT_FIELDS = ADVANCED_PARAMETER_DEFINITIONS.map(x => ({
  key: `zhuj.asset.${x.key}`, label: x.label, unit: x.unit === '平方米' ? '㎡' : x.unit,
  integer: x.round === 'integer', target: 'override', section: '设备和场地',
}));
const plan = (label, key, extra = {}) => ({ label, key, target: 'override', section: '合同服务计划', type: 'frequency', unit: '次/年', ...extra });
export const PLAN_IMPORT_FIELDS = [
  plan('邮包、快递外卖代收', '服务!P8', { eventCount: true }),
  plan('空巢老人拜访', '服务!P13', { eventCount: true }),
  plan('社区文化活动举办', '服务!P15', { confirmScope: '需区分总活动次数与标准中已列的宣传、见面会等，不能重复计入其他社区活动。' }),
  plan('节日装饰', '服务!P16'),
  ...[['出入口大门地面深度清扫', 7], ['出入口大门墙面深度清扫', 10], ['园区地面深度清扫', 15],
    ['架空层地面大理石保养', 19], ['架空层地面深度清洁', 20], ['大堂电梯地面大理石保养', 27],
    ['大堂电梯地面深度清洁', 28], ['楼层地面深度清洁', 34], ['疏散楼梯地面深度清洁', 40], ['车库地面深度清洁', 49]]
    .map(([label, row]) => plan(label, `清洁!X${row}`)),
  ...[['出入口广场草坪打孔', 6], ['出入口广场草坪土壤改良', 10], ['出入口广场地被松土', 14],
    ['出入口广场地被时花维护', 16], ['出入口广场地被防寒', 22], ['园区内草坪打孔', 26],
    ['园区内草坪土壤改良', 30], ['园区内地被松土', 34], ['园区内地被时花维护', 36],
    ['园区内地被防寒', 42], ['园区内乔灌木松土', 46], ['园区内乔灌木土壤改良', 50],
    ['园区内乔木大修剪', 53], ['园区内乔灌木防寒刷白', 54], ['园区内乔灌木防寒缠干', 55]]
    .map(([label, row]) => plan(label, `绿化!U${row}`)),
];
export const SUPPLEMENT_FIELDS = [...BASIC_IMPORT_FIELDS, ...ASSET_IMPORT_FIELDS, ...PLAN_IMPORT_FIELDS];
export const GARAGE_ASSET_KEYS = new Set(['basement.parkingArea', 'basement.fireShutterCount', 'basement.parkingSurveillanceCount',
  'basement.vehicleEntranceEquipmentCount', 'basement.vehicleEntranceArea', 'basement.chargingMeterRoomCount'].map(k => `zhuj.asset.${k}`));
