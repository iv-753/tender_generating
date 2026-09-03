import test from 'node:test';
import assert from 'node:assert/strict';

import { buildPresentationBindings } from './bindings.mjs';

const project = {
  projectName: '增城示范花园',
  region: '广东省广州市增城区',
  city: '广州',
  serviceGrade: 'C',
  costBand: 'upper',
  totalBuildingArea: 252480.75,
  residentialChargeArea: 149904,
  deliveredHouseholds: 2256,
  receivedHouseholds: 1608,
  occupiedHouseholds: 1200,
  perimeterEntrances: 500,
  gatehouses: 2,
  pavedRoadArea: 26896,
  greenArea: 26353,
  lawnRatio: 0.5,
  seasonalFlowerArea: 0,
  winterProtectionArea: 0,
  buildings: [
    { buildingCount: 8, lobbyElevatorCount: 53.28, stiltFloorArea: 260, totalFloors: 232, standardLobbyArea: 37.82, evacuationStairArea: 17.62, rooftopArea: 400 },
    { buildingCount: 4, lobbyElevatorCount: 64, stiltFloorArea: 178, totalFloors: 152, standardLobbyArea: 44, evacuationStairArea: 17, rooftopArea: 450 },
  ],
  garageFloorArea: 40060.27,
  garageFloors: 2,
};

const action = (id, category, name, frequency, extra = {}) => ({
  id,
  category,
  action: name,
  property: '基础',
  frequency,
  annualCost: 1,
  ...extra,
});

const actions = [
  action('service-9', 'service', 'A-FW-57 装修备案业务办理', '即时', { basis: '已收未住每年0.5次+常住户每年0.1次' }),
  action('service-10', 'service', 'A-FW-59 客户报事处理', '即时', { basis: '常住1户一年处理3次' }),
  action('service-12', 'service', 'A-FW-59 客户投诉处理', '13分钟响应，48小时完成处理', { basis: '已收未住5%+常住户数20%' }),
  action('service-17', 'service', 'A-FW-64 物业服务报告公示', '1次/季'),
  action('service-18', 'service', '公共区域巡视', '2次/天'),
  action('service-21', 'service', '突发事件处理', '即时'),
  action('cleaning-6', 'cleaning', '清扫', '2次/月', { basis: '出入口大门 / 地面', quantity: 500, unit: '平方米' }),
  action('cleaning-14', 'cleaning', '清扫', '1次/周', { basis: '园区 / 地面', quantity: 26896, unit: '平方米' }),
  action('cleaning-25', 'cleaning', '巡扫', '1次/天', { basis: '大堂\n（含电梯） / 地面', quantity: 682.24, unit: '平方米' }),
  action('cleaning-47', 'cleaning', '巡扫', '1次/天', { basis: '车库 / 地面', quantity: 80120.54, unit: '平方米' }),
  action('greening-8', 'greening', 'A-LH-04 园林出入口广场草坪修剪', '6次/年', { quantity: 3294.125, unit: '平方米' }),
  action('greening-12', 'greening', 'A-LH-08 园林出入口广场草坪病虫防制', '2次/年'),
  action('greening-21', 'greening', 'A-LH-08 园林出入口广场地被病虫防制', '2次/年'),
  action('greening-28', 'greening', 'A-LH-04 园林分区草坪修剪', '6次/年', { quantity: 9882.375, unit: '平方米' }),
  action('greening-32', 'greening', 'A-LH-08 园林分区草坪病虫防制', '2次/年'),
  action('greening-41', 'greening', 'A-LH-08 园林分区地被病虫防制', '2次/年'),
  action('greening-48', 'greening', 'A-LH-04 园林总区乔木修剪', '1次/年', { quantity: 908.724, unit: '株' }),
  action('greening-49', 'greening', 'A-LH-04 园林总区灌木修剪', '2次/年', { quantity: 908.724, unit: '株' }),
  action('greening-51', 'greening', 'B-LH-08 园林总区乔灌木病虫防制', '1次/年'),
  action('assistance-4', 'assistance', '大门配人岗', '2人/岗', { quantity: 1, unit: '个', headcount: 2 }),
  action('assistance-8', 'assistance', '巡逻岗', '建筑面积10万方配1人', { quantity: 252480.75, unit: 'm2', headcount: 3 }),
];

const result = {
  project,
  totalActionCount: 122,
  totalHeadcount: 33.2,
  annualCost: 2685755,
  categories: [],
  actions,
};

test('生成完整项目与测算绑定', () => {
  const bindings = buildPresentationBindings(result, new Date('2026-09-03T00:00:00+08:00'));
  assert.equal(bindings.named['project-name-field'], '增城示范花园');
  assert.equal(bindings.named['field-project-region-15'], '广东省广州市增城区');
  assert.equal(bindings.named['field-unit-price'], '1.49');
  assert.equal(bindings.named['field-cost-band'], '广州地区基准');
  assert.equal(bindings.named['field-annual-cost'], '268.58');
  assert.equal(bindings.named['field-headcount'], '34');
  assert.equal(bindings.named['field-action-count'], '122');
  assert.equal(bindings.named['field-project-1-0'], '12');
  assert.equal(bindings.named['field-total-area'], '252,481');
  assert.equal(bindings.named['field-project-2-2'], '80,121');
  assert.equal(bindings.cards.length, 16);
  assert.deepEqual(bindings.cards[0], {
    title: '客户投诉处理',
    scope: '已收未住5%＋常住户数20%',
    frequency: '13分钟响应，48小时完成',
  });
  assert.equal(bindings.cards[10].scope, '80,121㎡');
  assert.equal(bindings.cards[12].scope, '13,177㎡');
  assert.equal(bindings.cards[13].scope, '909株');
  assert.equal(bindings.cards[13].frequency, '乔木1次/年·灌木2次/年');
  assert.equal(bindings.cards[15].frequency, '草坪/地被2次/年\n乔灌木1次/年');
});

test('缺失被引用的模型动作时直接报错', () => {
  assert.throws(
    () => buildPresentationBindings({ ...result, actions: actions.filter((item) => item.id !== 'service-12') }),
    /缺少测算动作 service-12/,
  );
});
