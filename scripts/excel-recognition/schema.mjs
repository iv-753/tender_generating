export const FIELD_DEFINITIONS = {
  projectName: ['项目名称/案名/楼盘名称', 'text'],
  region: ['完整行政区划或项目所在区域', 'text'],
  city: ['用于成本档位的城市；没有独立城市字段时可引用行政区划', 'city'],
  serviceGrade: ['拟采用服务等级，只接受 A/B/C/D', 'grade'],
  totalBuildingArea: ['总建筑面积，平方米', 'number'],
  residentialChargeArea: ['住宅收费/计费面积，平方米', 'number'],
  deliveredHouseholds: ['已交付户数/套数', 'number'],
  receivedHouseholds: ['已收楼户数', 'number'],
  occupiedHouseholds: ['实际常住户数', 'number'],
  perimeterEntrances: ['出入口及外围服务面积，平方米', 'number'],
  gatehouses: ['门岗/门楼数量', 'number'],
  pavedRoadArea: ['园路及硬质铺装面积，平方米', 'number'],
  greenArea: ['绿化/园林绿地面积，平方米', 'number'],
  lawnRatio: ['草坪占绿化面积比例，0—1', 'ratio'],
  seasonalFlowerArea: ['时令/季节花卉面积，平方米', 'number'],
  winterProtectionArea: ['冬季防寒/植物防护面积，平方米', 'number'],
  garageFloorArea: ['车库单层面积，平方米', 'number'],
  garageFloors: ['地下车库层数', 'number'],
};

export const BUILDING_FIELD_DEFINITIONS = {
  buildingCount: ['楼栋数量', 'number'],
  lobbyElevatorCount: ['大堂及电梯点位数量', 'number'],
  stiltFloorArea: ['架空层面积，平方米', 'number'],
  totalFloors: ['该类型楼层总数', 'number'],
  standardLobbyArea: ['标准前厅/大堂面积，平方米', 'number'],
  evacuationStairArea: ['疏散楼梯面积，平方米', 'number'],
  rooftopArea: ['天台/屋面面积，平方米', 'number'],
};

const nullableString = { anyOf: [{ type: 'string' }, { type: 'null' }] };
const sourceReferenceSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    sheet: nullableString,
    cell: nullableString,
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    note: { type: 'string' },
  },
  required: ['sheet', 'cell', 'confidence', 'note'],
};

export const RECOGNITION_JSON_SCHEMA = {
  name: 'property_excel_field_mapping',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      fields: {
        type: 'object',
        additionalProperties: false,
        properties: Object.fromEntries(Object.keys(FIELD_DEFINITIONS).map((field) => [field, sourceReferenceSchema])),
        required: Object.keys(FIELD_DEFINITIONS),
      },
      buildings: {
        type: 'array',
        minItems: 0,
        maxItems: 5,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            label: { type: 'string' },
            fields: {
              type: 'object',
              additionalProperties: false,
              properties: Object.fromEntries(Object.keys(BUILDING_FIELD_DEFINITIONS).map((field) => [field, sourceReferenceSchema])),
              required: Object.keys(BUILDING_FIELD_DEFINITIONS),
            },
          },
          required: ['label', 'fields'],
        },
      },
    },
    required: ['fields', 'buildings'],
  },
};

export function recognitionPrompt(workbookText) {
  const scalarFields = Object.entries(FIELD_DEFINITIONS).map(([key, [label]]) => `${key}: ${label}`).join('\n');
  const buildingFields = Object.entries(BUILDING_FIELD_DEFINITIONS).map(([key, [label]]) => `${key}: ${label}`).join('\n');
  return `请把工作簿中的物业项目数据映射到标准字段。只返回字段来源，不要自行计算或改写原值。\n\n标准字段：\n${scalarFields}\n\n每种楼栋类型字段：\n${buildingFields}\n\n规则：\n1. sheet 必须使用原工作表名，cell 必须使用原 A1 地址。\n2. 找不到就把 sheet、cell 设为 null，confidence 设为 0；绝不猜测或补默认值。\n3. 当前有效口径优先；明确标注历史、失效、预算、参考或无关的数据不得采用。\n4. city 没有独立字段时，可引用 region 的单元格。\n5. 楼栋类型按原表有效数据行输出，最多 5 类。\n6. confidence 表示语义匹配把握，note 简述判断依据。\n\n工作簿内容：\n${workbookText}`;
}
