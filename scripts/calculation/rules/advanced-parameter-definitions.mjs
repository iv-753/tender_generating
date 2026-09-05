// Generated once from the audited internal workbook; production never reads it.
import { ADVANCED_PARAMETER_DEFAULT_RULES } from './advanced-parameter-default-rules.mjs';

function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}

const GENERATED_ADVANCED_PARAMETER_DEFINITIONS = [
  {
    "key": "pest.treatmentArea",
    "label": "四害消杀面积",
    "group": "grounds",
    "unit": "平方米",
    "templateValue": 322906.05,
    "templateValues": [
      322906.05
    ],
    "defaultRule": {
      "type": "template",
      "value": 322906.05,
      "source": "template"
    },
    "round": "none",
    "affectedActionIds": [
      "pest-control-5",
      "pest-control-6",
      "pest-control-7",
      "pest-control-8",
      "pest-control-9",
      "pest-control-10",
      "pest-control-11"
    ]
  },
  {
    "key": "basement.fireShutterCount",
    "label": "地下停车区防火卷帘数量",
    "group": "basement",
    "unit": "个",
    "templateValue": 252.0,
    "templateValues": [
      252.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 252.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-outsourced-5",
      "engineering-routine-6"
    ]
  },
  {
    "key": "basement.parkingArea",
    "label": "地下停车区面积",
    "group": "basement",
    "unit": "平方米",
    "templateValue": 62460.0,
    "templateValues": [
      62460.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 62460.0,
      "source": "template"
    },
    "round": "none",
    "affectedActionIds": [
      "engineering-outsourced-6",
      "engineering-outsourced-7",
      "engineering-outsourced-24",
      "engineering-outsourced-25",
      "engineering-routine-5",
      "engineering-routine-7",
      "engineering-routine-8",
      "engineering-routine-10",
      "engineering-routine-15",
      "engineering-routine-16",
      "engineering-routine-17",
      "engineering-routine-39"
    ]
  },
  {
    "key": "basement.parkingSurveillanceCount",
    "label": "地下停车区监控设施数量",
    "group": "basement",
    "unit": "个",
    "templateValue": 48.0,
    "templateValues": [
      48.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 48.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-outsourced-8",
      "engineering-outsourced-9",
      "engineering-routine-9"
    ]
  },
  {
    "key": "basement.vehicleEntranceEquipmentCount",
    "label": "地下车道出入口设备数量",
    "group": "basement",
    "unit": "个",
    "templateValue": 262.0,
    "templateValues": [
      262.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 262.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-outsourced-10",
      "engineering-outsourced-11",
      "engineering-routine-19"
    ]
  },
  {
    "key": "basement.generatorRoomCount",
    "label": "地下发电机房数量",
    "group": "basement",
    "unit": "个",
    "templateValue": 2.0,
    "templateValues": [
      2.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 2.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-outsourced-12",
      "engineering-outsourced-13",
      "engineering-routine-20",
      "engineering-routine-21",
      "engineering-routine-22",
      "engineering-routine-23"
    ]
  },
  {
    "key": "basement.transformerRoomCount",
    "label": "地下专变电房数量",
    "group": "basement",
    "unit": "个",
    "templateValue": 3.0,
    "templateValues": [
      3.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 3.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-outsourced-14",
      "engineering-outsourced-15",
      "engineering-routine-24",
      "engineering-routine-25",
      "engineering-routine-26",
      "engineering-routine-27"
    ]
  },
  {
    "key": "basement.telecomRoomCount",
    "label": "地下电信机房数量",
    "group": "basement",
    "unit": "个",
    "templateValue": 0.0,
    "templateValues": [
      0.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 0.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-outsourced-16",
      "engineering-outsourced-17",
      "engineering-outsourced-18",
      "engineering-outsourced-19",
      "engineering-routine-28",
      "engineering-routine-29"
    ]
  },
  {
    "key": "basement.domesticWaterPumpRoomCount",
    "label": "地下生活给水泵房数量",
    "group": "basement",
    "unit": "个",
    "templateValue": 2.0,
    "templateValues": [
      2.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 2.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-outsourced-20",
      "engineering-outsourced-21",
      "engineering-routine-30",
      "engineering-routine-31",
      "engineering-routine-32",
      "engineering-routine-33"
    ]
  },
  {
    "key": "basement.poolPumpRoomCount",
    "label": "地下泳池泵房数量",
    "group": "basement",
    "unit": "个",
    "templateValue": 1.0,
    "templateValues": [
      1.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 1.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-outsourced-22",
      "engineering-outsourced-23",
      "engineering-routine-34",
      "engineering-routine-35",
      "engineering-routine-36",
      "engineering-routine-37"
    ]
  },
  {
    "key": "basement.wetAlarmValveRoomCount",
    "label": "地下湿式报警阀间数量",
    "group": "basement",
    "unit": "个",
    "templateValue": 3.0,
    "templateValues": [
      3.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 3.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-outsourced-26",
      "engineering-outsourced-27",
      "engineering-routine-40",
      "engineering-routine-41"
    ]
  },
  {
    "key": "basement.powerDistributionRoomCount",
    "label": "地下配电间数量",
    "group": "basement",
    "unit": "个",
    "templateValue": 33.0,
    "templateValues": [
      33.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 33.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-outsourced-28",
      "engineering-outsourced-29",
      "engineering-routine-42",
      "engineering-routine-43",
      "engineering-routine-44",
      "engineering-routine-45"
    ]
  },
  {
    "key": "basement.chargingMeterRoomCount",
    "label": "地下充电桩电表间数量",
    "group": "basement",
    "unit": "个",
    "templateValue": 5.0,
    "templateValues": [
      5.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 5.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-outsourced-30",
      "engineering-outsourced-31",
      "engineering-routine-46",
      "engineering-routine-47",
      "engineering-routine-48",
      "engineering-routine-49"
    ]
  },
  {
    "key": "basement.pressurizationFanRoomCount",
    "label": "地下加压风机房数量",
    "group": "basement",
    "unit": "个",
    "templateValue": 17.0,
    "templateValues": [
      17.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 17.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-outsourced-32",
      "engineering-outsourced-33",
      "engineering-routine-50",
      "engineering-routine-51"
    ]
  },
  {
    "key": "basement.smokeExhaustFanRoomCount",
    "label": "地下排烟风机房数量",
    "group": "basement",
    "unit": "个",
    "templateValue": 45.0,
    "templateValues": [
      45.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 45.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-outsourced-34",
      "engineering-outsourced-35",
      "engineering-routine-52",
      "engineering-routine-53"
    ]
  },
  {
    "key": "basement.supplyAirFanRoomCount",
    "label": "地下送风风机房数量",
    "group": "basement",
    "unit": "个",
    "templateValue": 45.0,
    "templateValues": [
      45.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 45.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-outsourced-36",
      "engineering-outsourced-37",
      "engineering-routine-54",
      "engineering-routine-55"
    ]
  },
  {
    "key": "basement.sewageTreatmentRoomCount",
    "label": "地下污水处理机房数量",
    "group": "basement",
    "unit": "个",
    "templateValue": 0.0,
    "templateValues": [
      0.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 0.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-outsourced-38",
      "engineering-outsourced-39",
      "engineering-routine-56",
      "engineering-routine-57",
      "engineering-routine-58",
      "engineering-routine-59"
    ]
  },
  {
    "key": "basement.rainwaterStorageRoomCount",
    "label": "地下雨水调蓄机房数量",
    "group": "basement",
    "unit": "个",
    "templateValue": 0.0,
    "templateValues": [
      0.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 0.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-outsourced-40",
      "engineering-outsourced-41",
      "engineering-routine-60",
      "engineering-routine-61",
      "engineering-routine-62",
      "engineering-routine-63"
    ]
  },
  {
    "key": "basement.lobbyAccessControlCount",
    "label": "地下大堂门禁设备数量",
    "group": "basement",
    "unit": "个",
    "templateValue": 92.0,
    "templateValues": [
      92.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 92.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-outsourced-42",
      "engineering-outsourced-43",
      "engineering-routine-65"
    ]
  },
  {
    "key": "basement.lobbyArea",
    "label": "地下大堂面积",
    "group": "basement",
    "unit": "平方米",
    "templateValue": 1368.68,
    "templateValues": [
      1368.68
    ],
    "defaultRule": {
      "type": "template",
      "value": 1368.68,
      "source": "template"
    },
    "round": "none",
    "affectedActionIds": [
      "engineering-outsourced-44",
      "engineering-outsourced-45",
      "engineering-routine-64",
      "engineering-routine-67"
    ]
  },
  {
    "key": "building.groundFloorLobbyAccessControlCount",
    "label": "首层大堂门禁设备数量",
    "group": "building",
    "unit": "个",
    "templateValue": 12.0,
    "templateValues": [
      12.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 12.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-outsourced-46",
      "engineering-outsourced-47",
      "engineering-routine-69"
    ]
  },
  {
    "key": "building.groundFloorLobbyArea",
    "label": "首层大堂面积",
    "group": "building",
    "unit": "平方米",
    "templateValue": 623.64,
    "templateValues": [
      623.64
    ],
    "defaultRule": {
      "type": "template",
      "value": 623.64,
      "source": "template"
    },
    "round": "none",
    "affectedActionIds": [
      "engineering-outsourced-48",
      "engineering-outsourced-49",
      "engineering-routine-68",
      "engineering-routine-70"
    ]
  },
  {
    "key": "building.stiltFloorArea",
    "label": "首层架空层面积",
    "group": "building",
    "unit": "平方米",
    "templateValue": 2800.7,
    "templateValues": [
      2800.7
    ],
    "defaultRule": {
      "type": "template",
      "value": 2800.7,
      "source": "template"
    },
    "round": "none",
    "affectedActionIds": [
      "engineering-outsourced-50",
      "engineering-outsourced-51",
      "engineering-routine-71",
      "engineering-routine-72",
      "engineering-routine-73",
      "engineering-routine-74"
    ]
  },
  {
    "key": "building.clubhouseCount",
    "label": "首层泛会所数量",
    "group": "building",
    "unit": "个",
    "templateValue": 0.0,
    "templateValues": [
      0.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 0.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-outsourced-52",
      "engineering-outsourced-53",
      "engineering-routine-75",
      "engineering-routine-76",
      "engineering-routine-77",
      "engineering-routine-78"
    ]
  },
  {
    "key": "building.securityControlRoomCount",
    "label": "安防控制室数量",
    "group": "building",
    "unit": "个",
    "templateValue": 1.0,
    "templateValues": [
      1.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 1.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-outsourced-54",
      "engineering-outsourced-55",
      "engineering-routine-79",
      "engineering-routine-80"
    ]
  },
  {
    "key": "building.groundFloorElectricalRoomCount",
    "label": "首层电房数量",
    "group": "building",
    "unit": "个",
    "templateValue": 1.0,
    "templateValues": [
      1.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 1.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-outsourced-56",
      "engineering-outsourced-57",
      "engineering-routine-81",
      "engineering-routine-82",
      "engineering-routine-83"
    ]
  },
  {
    "key": "building.standardFloorArea",
    "label": "标准层公区面积",
    "group": "building",
    "unit": "平方米",
    "templateValue": 15421.2,
    "templateValues": [
      15421.2
    ],
    "defaultRule": {
      "type": "template",
      "value": 15421.2,
      "source": "template"
    },
    "round": "none",
    "affectedActionIds": [
      "engineering-outsourced-58",
      "engineering-outsourced-59",
      "engineering-routine-84",
      "engineering-routine-85",
      "engineering-routine-86",
      "engineering-routine-87",
      "engineering-routine-88"
    ]
  },
  {
    "key": "building.roofArea",
    "label": "屋面层面积",
    "group": "building",
    "unit": "平方米",
    "templateValue": 4261.2,
    "templateValues": [
      4261.2
    ],
    "defaultRule": {
      "type": "template",
      "value": 4261.2,
      "source": "template"
    },
    "round": "none",
    "affectedActionIds": [
      "engineering-outsourced-60",
      "engineering-outsourced-61",
      "engineering-routine-89",
      "engineering-routine-90",
      "engineering-routine-91",
      "engineering-routine-92",
      "engineering-routine-93"
    ]
  },
  {
    "key": "building.buildingCount",
    "label": "楼栋数量",
    "group": "building",
    "unit": "个",
    "templateValue": 12.0,
    "templateValues": [
      12.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 12.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-outsourced-62",
      "engineering-outsourced-63",
      "engineering-outsourced-72",
      "engineering-outsourced-73",
      "engineering-routine-94",
      "engineering-routine-105"
    ]
  },
  {
    "key": "building.evacuationStairArea",
    "label": "楼栋疏散楼梯面积",
    "group": "building",
    "unit": "平方米",
    "templateValue": 189.8,
    "templateValues": [
      189.8
    ],
    "defaultRule": {
      "type": "template",
      "value": 189.8,
      "source": "template"
    },
    "round": "none",
    "affectedActionIds": [
      "engineering-outsourced-64",
      "engineering-outsourced-65",
      "engineering-routine-98",
      "engineering-routine-99",
      "engineering-routine-100",
      "engineering-routine-101"
    ]
  },
  {
    "key": "building.elevatorCount",
    "label": "电梯数量",
    "group": "building",
    "unit": "台",
    "templateValue": 28.0,
    "templateValues": [
      28.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 28.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-outsourced-66",
      "engineering-outsourced-67",
      "engineering-outsourced-68",
      "engineering-outsourced-69",
      "engineering-outsourced-70",
      "engineering-outsourced-71",
      "engineering-routine-102",
      "engineering-routine-103",
      "engineering-routine-104"
    ]
  },
  {
    "key": "building.refugeFloorArea",
    "label": "避难层面积",
    "group": "building",
    "unit": "平方米",
    "templateValue": 5356.72,
    "templateValues": [
      5356.72
    ],
    "defaultRule": {
      "type": "template",
      "value": 5356.72,
      "source": "template"
    },
    "round": "none",
    "affectedActionIds": [
      "engineering-outsourced-74",
      "engineering-outsourced-75",
      "engineering-outsourced-76",
      "engineering-outsourced-77",
      "engineering-routine-106",
      "engineering-routine-107",
      "engineering-routine-108",
      "engineering-routine-109",
      "engineering-routine-110",
      "engineering-routine-111",
      "engineering-routine-112",
      "engineering-routine-113"
    ]
  },
  {
    "key": "building.refugeWetAlarmRoomCount",
    "label": "避难层湿式报警间数量",
    "group": "building",
    "unit": "个",
    "templateValue": 8.0,
    "templateValues": [
      8.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 8.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-outsourced-78",
      "engineering-outsourced-79",
      "engineering-routine-114"
    ]
  },
  {
    "key": "building.refugePressurizationFanRoomCount",
    "label": "避难层加压风机房数量",
    "group": "building",
    "unit": "个",
    "templateValue": 16.0,
    "templateValues": [
      16.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 16.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-outsourced-80",
      "engineering-outsourced-81",
      "engineering-routine-115"
    ]
  },
  {
    "key": "building.commercialCorridorArea",
    "label": "商业公区走廊面积",
    "group": "building",
    "unit": "平方米",
    "templateValue": 0.0,
    "templateValues": [
      0.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 0.0,
      "source": "template"
    },
    "round": "none",
    "affectedActionIds": [
      "engineering-outsourced-82",
      "engineering-outsourced-83",
      "engineering-routine-125",
      "engineering-routine-126",
      "engineering-routine-127",
      "engineering-routine-128"
    ]
  },
  {
    "key": "building.commercialEvacuationStairArea",
    "label": "商业公区疏散楼梯面积",
    "group": "building",
    "unit": "平方米",
    "templateValue": 2.0,
    "templateValues": [
      2.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 2.0,
      "source": "template"
    },
    "round": "none",
    "affectedActionIds": [
      "engineering-outsourced-84",
      "engineering-outsourced-85",
      "engineering-routine-135",
      "engineering-routine-136",
      "engineering-routine-138"
    ]
  },
  {
    "key": "grounds.gatedEntrancePedestrianGateCount",
    "label": "有门楼出入口人行闸机数量",
    "group": "grounds",
    "unit": "台",
    "templateValue": 2.0,
    "templateValues": [
      2.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 2.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-outsourced-86",
      "engineering-outsourced-87",
      "engineering-routine-152"
    ]
  },
  {
    "key": "grounds.gatedEntranceVehicleGateCount",
    "label": "有门楼出入口车行闸机数量",
    "group": "grounds",
    "unit": "台",
    "templateValue": 0.0,
    "templateValues": [
      0.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 0.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-outsourced-88",
      "engineering-outsourced-89",
      "engineering-routine-153"
    ]
  },
  {
    "key": "grounds.ungatedEntrancePedestrianGateCount",
    "label": "无门楼出入口人行闸机数量",
    "group": "grounds",
    "unit": "台",
    "templateValue": 4.0,
    "templateValues": [
      4.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 4.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-outsourced-90",
      "engineering-outsourced-91",
      "engineering-routine-157"
    ]
  },
  {
    "key": "grounds.ungatedEntranceVehicleGateCount",
    "label": "无门楼出入口车行闸机数量",
    "group": "grounds",
    "unit": "台",
    "templateValue": 8.0,
    "templateValues": [
      8.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 8.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-outsourced-92",
      "engineering-outsourced-93",
      "engineering-routine-158"
    ]
  },
  {
    "key": "grounds.ungatedEntranceAccessGateCount",
    "label": "无门楼出入口通行门数量",
    "group": "grounds",
    "unit": "台",
    "templateValue": 0.0,
    "templateValues": [
      0.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 0.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-outsourced-94",
      "engineering-outsourced-95",
      "engineering-routine-159"
    ]
  },
  {
    "key": "grounds.securityAudioLineLength",
    "label": "园区安防及背景音箱线路长度",
    "group": "grounds",
    "unit": "米",
    "templateValue": 696.0,
    "templateValues": [
      696.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 696.0,
      "source": "template"
    },
    "round": "none",
    "affectedActionIds": [
      "engineering-outsourced-96",
      "engineering-outsourced-97",
      "engineering-routine-202"
    ]
  },
  {
    "key": "grounds.fireWaterPointCount",
    "label": "园区消防取水设施数量",
    "group": "grounds",
    "unit": "个",
    "templateValue": 4.0,
    "templateValues": [
      4.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 4.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-outsourced-98",
      "engineering-outsourced-99",
      "engineering-routine-229"
    ]
  },
  {
    "key": "basement.drainageEquipmentCount",
    "label": "地下排水排污设备数量",
    "group": "basement",
    "unit": "个",
    "templateValue": 58.0,
    "templateValues": [
      58.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 58.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-routine-11",
      "engineering-routine-12",
      "engineering-routine-13"
    ]
  },
  {
    "key": "basement.evacuationStairArea",
    "label": "地下疏散楼梯面积",
    "group": "basement",
    "unit": "平方米",
    "templateValue": 189.8,
    "templateValues": [
      189.8
    ],
    "defaultRule": {
      "type": "template",
      "value": 189.8,
      "source": "template"
    },
    "round": "none",
    "affectedActionIds": [
      "engineering-routine-14"
    ]
  },
  {
    "key": "basement.vehicleEntranceArea",
    "label": "地下车道出入口面积",
    "group": "basement",
    "unit": "平方米",
    "templateValue": 1416.0,
    "templateValues": [
      1416.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 1416.0,
      "source": "template"
    },
    "round": "none",
    "affectedActionIds": [
      "engineering-routine-18"
    ]
  },
  {
    "key": "basement.firePumpRoomCount",
    "label": "地下消防水泵房数量",
    "group": "basement",
    "unit": "个",
    "templateValue": 3.0,
    "templateValues": [
      3.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 3.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-routine-38"
    ]
  },
  {
    "key": "basement.lobbyEquipmentCount",
    "label": "地下大堂设备数量",
    "group": "basement",
    "unit": "个",
    "templateValue": 48.0,
    "templateValues": [
      48.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 48.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-routine-66"
    ]
  },
  {
    "key": "building.shaftCount",
    "label": "楼栋管井数量",
    "group": "building",
    "unit": "个",
    "templateValue": 840.0,
    "templateValues": [
      840.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 840.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-routine-95",
      "engineering-routine-96",
      "engineering-routine-97"
    ]
  },
  {
    "key": "building.facadeBaseArea",
    "label": "外立面基座层面积",
    "group": "building",
    "unit": "平方米",
    "templateValue": 17589.16,
    "templateValues": [
      17589.16
    ],
    "defaultRule": {
      "type": "template",
      "value": 17589.16,
      "source": "template"
    },
    "round": "none",
    "affectedActionIds": [
      "engineering-routine-116",
      "engineering-routine-117",
      "engineering-routine-118"
    ]
  },
  {
    "key": "building.facadeStandardArea",
    "label": "外立面标准层面积",
    "group": "building",
    "unit": "平方米",
    "templateValue": 191513.8,
    "templateValues": [
      191513.8
    ],
    "defaultRule": {
      "type": "template",
      "value": 191513.8,
      "source": "template"
    },
    "round": "none",
    "affectedActionIds": [
      "engineering-routine-119",
      "engineering-routine-120",
      "engineering-routine-121"
    ]
  },
  {
    "key": "building.facadeRoofParapetArea",
    "label": "外立面屋顶女儿墙面积",
    "group": "building",
    "unit": "平方米",
    "templateValue": 2656.0,
    "templateValues": [
      2656.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 2656.0,
      "source": "template"
    },
    "round": "none",
    "affectedActionIds": [
      "engineering-routine-122",
      "engineering-routine-123",
      "engineering-routine-124"
    ]
  },
  {
    "key": "building.commercialElectricalShaftCount",
    "label": "商业公区电井数量",
    "group": "building",
    "unit": "个",
    "templateValue": 2.0,
    "templateValues": [
      2.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 2.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-routine-129",
      "engineering-routine-130",
      "engineering-routine-131"
    ]
  },
  {
    "key": "building.commercialWaterShaftCount",
    "label": "商业公区水井数量",
    "group": "building",
    "unit": "个",
    "templateValue": 2.0,
    "templateValues": [
      2.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 2.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-routine-132",
      "engineering-routine-133",
      "engineering-routine-134"
    ]
  },
  {
    "key": "building.commercialEvacuationStairMaintenanceArea",
    "label": "商业公区疏散楼梯保养面积",
    "group": "building",
    "unit": "平方米",
    "templateValue": 20.0,
    "templateValues": [
      20.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 20.0,
      "source": "template"
    },
    "round": "none",
    "affectedActionIds": [
      "engineering-routine-137"
    ]
  },
  {
    "key": "building.commercialRoofArea",
    "label": "商业公区屋面面积",
    "group": "building",
    "unit": "平方米",
    "templateValue": 941.21,
    "templateValues": [
      941.21
    ],
    "defaultRule": {
      "type": "template",
      "value": 941.21,
      "source": "template"
    },
    "round": "none",
    "affectedActionIds": [
      "engineering-routine-139",
      "engineering-routine-140",
      "engineering-routine-141"
    ]
  },
  {
    "key": "building.commercialFacadeArea",
    "label": "商业外立面面积",
    "group": "building",
    "unit": "平方米",
    "templateValue": 374.56,
    "templateValues": [
      374.56
    ],
    "defaultRule": {
      "type": "template",
      "value": 374.56,
      "source": "template"
    },
    "round": "none",
    "affectedActionIds": [
      "engineering-routine-142",
      "engineering-routine-143",
      "engineering-routine-144"
    ]
  },
  {
    "key": "building.garbageTransferStationCount",
    "label": "垃圾中转站数量",
    "group": "building",
    "unit": "个",
    "templateValue": 0.0,
    "templateValues": [
      0.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 0.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-routine-145",
      "engineering-routine-146",
      "engineering-routine-147"
    ]
  },
  {
    "key": "building.detachedElectricalRoomCount",
    "label": "独立配套用房电房数量",
    "group": "building",
    "unit": "个",
    "templateValue": 0.0,
    "templateValues": [
      0.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 0.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-routine-148",
      "engineering-routine-149",
      "engineering-routine-150"
    ]
  },
  {
    "key": "grounds.entranceGuardhouseArea",
    "label": "出入口门岗及廊架面积",
    "group": "grounds",
    "unit": "平方米",
    "templateValue": 794.0,
    "templateValues": [
      794.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 794.0,
      "source": "template"
    },
    "round": "none",
    "affectedActionIds": [
      "engineering-routine-151"
    ]
  },
  {
    "key": "grounds.gatedEntranceAccessGateCount",
    "label": "有门楼出入口通行门数量",
    "group": "grounds",
    "unit": "个",
    "templateValue": 2.0,
    "templateValues": [
      2.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 2.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-routine-154",
      "engineering-routine-155",
      "engineering-routine-156"
    ]
  },
  {
    "key": "grounds.entrancePlazaArea",
    "label": "出入口及广场面积",
    "group": "grounds",
    "unit": "平方米",
    "templateValue": 4858.77,
    "templateValues": [
      4858.77
    ],
    "defaultRule": {
      "type": "template",
      "value": 4858.77,
      "source": "template"
    },
    "round": "none",
    "affectedActionIds": [
      "engineering-routine-160",
      "engineering-routine-168",
      "engineering-routine-169",
      "engineering-routine-170"
    ]
  },
  {
    "key": "grounds.entranceWaterFeatureCount",
    "label": "出入口及广场水景数量",
    "group": "grounds",
    "unit": "个",
    "templateValue": 1.0,
    "templateValues": [
      1.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 1.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-routine-161",
      "engineering-routine-162",
      "engineering-routine-163"
    ]
  },
  {
    "key": "grounds.entranceArtworkCount",
    "label": "出入口及广场艺术雕塑数量",
    "group": "grounds",
    "unit": "个",
    "templateValue": 1.0,
    "templateValues": [
      1.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 1.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-routine-164"
    ]
  },
  {
    "key": "grounds.entranceBicycleShelterCount",
    "label": "出入口及广场非机动车棚数量",
    "group": "grounds",
    "unit": "个",
    "templateValue": 0.0,
    "templateValues": [
      0.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 0.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-routine-165",
      "engineering-routine-166",
      "engineering-routine-167"
    ]
  },
  {
    "key": "grounds.zoneArea",
    "label": "园林分区面积",
    "group": "grounds",
    "unit": "平方米",
    "templateValue": 9820.01,
    "templateValues": [
      9820.01
    ],
    "defaultRule": {
      "type": "template",
      "value": 9820.01,
      "source": "template"
    },
    "round": "none",
    "affectedActionIds": [
      "engineering-routine-171",
      "engineering-routine-204",
      "engineering-routine-205",
      "engineering-routine-206"
    ]
  },
  {
    "key": "grounds.landscapeWaterFeatureCount",
    "label": "园林水景数量",
    "group": "grounds",
    "unit": "个",
    "templateValue": 4.0,
    "templateValues": [
      4.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 4.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-routine-172",
      "engineering-routine-173",
      "engineering-routine-174"
    ]
  },
  {
    "key": "grounds.poolPergolaArea",
    "label": "泳池廊架及地面面积",
    "group": "grounds",
    "unit": "平方米",
    "templateValue": 199.73,
    "templateValues": [
      199.73
    ],
    "defaultRule": {
      "type": "template",
      "value": 199.73,
      "source": "template"
    },
    "round": "none",
    "affectedActionIds": [
      "engineering-routine-175",
      "engineering-routine-176",
      "engineering-routine-177"
    ]
  },
  {
    "key": "grounds.poolEquipmentCount",
    "label": "泳池设备数量",
    "group": "grounds",
    "unit": "个",
    "templateValue": 1.0,
    "templateValues": [
      1.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 1.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-routine-178",
      "engineering-routine-179",
      "engineering-routine-180"
    ]
  },
  {
    "key": "grounds.poolFacilityRoomCount",
    "label": "泳池功能房数量",
    "group": "grounds",
    "unit": "个",
    "templateValue": 7.0,
    "templateValues": [
      7.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 7.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-routine-181"
    ]
  },
  {
    "key": "grounds.childrenActivityArea",
    "label": "儿童活动场地面积",
    "group": "grounds",
    "unit": "平方米",
    "templateValue": 804.14,
    "templateValues": [
      804.14
    ],
    "defaultRule": {
      "type": "template",
      "value": 804.14,
      "source": "template"
    },
    "round": "none",
    "affectedActionIds": [
      "engineering-routine-182"
    ]
  },
  {
    "key": "grounds.activityFacilityArea",
    "label": "儿童及健身活动设施面积",
    "group": "grounds",
    "unit": "平方米",
    "templateValue": 942.27,
    "templateValues": [
      942.27
    ],
    "defaultRule": {
      "type": "template",
      "value": 942.27,
      "source": "template"
    },
    "round": "none",
    "affectedActionIds": [
      "engineering-routine-183",
      "engineering-routine-184"
    ]
  },
  {
    "key": "grounds.fitnessActivityArea",
    "label": "全民健身活动场地面积",
    "group": "grounds",
    "unit": "平方米",
    "templateValue": 138.13,
    "templateValues": [
      138.13
    ],
    "defaultRule": {
      "type": "template",
      "value": 138.13,
      "source": "template"
    },
    "round": "none",
    "affectedActionIds": [
      "engineering-routine-185"
    ]
  },
  {
    "key": "grounds.badmintonCourtCount",
    "label": "羽毛球场数量",
    "group": "grounds",
    "unit": "个",
    "templateValue": 1.0,
    "templateValues": [
      1.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 1.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-routine-186",
      "engineering-routine-187",
      "engineering-routine-188"
    ]
  },
  {
    "key": "grounds.basketballCourtCount",
    "label": "篮球场数量",
    "group": "grounds",
    "unit": "个",
    "templateValue": 1.0,
    "templateValues": [
      1.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 1.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-routine-189",
      "engineering-routine-190",
      "engineering-routine-191"
    ]
  },
  {
    "key": "grounds.tennisCourtCount",
    "label": "网球场数量",
    "group": "grounds",
    "unit": "个",
    "templateValue": 0.0,
    "templateValues": [
      0.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 0.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-routine-192",
      "engineering-routine-193",
      "engineering-routine-194"
    ]
  },
  {
    "key": "grounds.footballFieldCount",
    "label": "足球场数量",
    "group": "grounds",
    "unit": "个",
    "templateValue": 0.0,
    "templateValues": [
      0.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 0.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-routine-195",
      "engineering-routine-196",
      "engineering-routine-197"
    ]
  },
  {
    "key": "grounds.vehicleParkingArea",
    "label": "园区机动车停车场面积",
    "group": "grounds",
    "unit": "平方米",
    "templateValue": 357.5,
    "templateValues": [
      357.5
    ],
    "defaultRule": {
      "type": "template",
      "value": 357.5,
      "source": "template"
    },
    "round": "none",
    "affectedActionIds": [
      "engineering-routine-198",
      "engineering-routine-199",
      "engineering-routine-200"
    ]
  },
  {
    "key": "grounds.pergolaPlatformArea",
    "label": "园区廊架平台面积",
    "group": "grounds",
    "unit": "平方米",
    "templateValue": 106.56,
    "templateValues": [
      106.56
    ],
    "defaultRule": {
      "type": "template",
      "value": 106.56,
      "source": "template"
    },
    "round": "none",
    "affectedActionIds": [
      "engineering-routine-201"
    ]
  },
  {
    "key": "grounds.landscapeArtworkCount",
    "label": "园林设施艺术雕塑数量",
    "group": "grounds",
    "unit": "个",
    "templateValue": 1.0,
    "templateValues": [
      1.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 1.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-routine-203"
    ]
  },
  {
    "key": "grounds.waterOutletCount",
    "label": "园区取水栓及排水口数量",
    "group": "grounds",
    "unit": "个",
    "templateValue": 4.0,
    "templateValues": [
      4.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 4.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-routine-207"
    ]
  },
  {
    "key": "grounds.wasteCollectionPointCount",
    "label": "园区垃圾收集点数量",
    "group": "grounds",
    "unit": "个",
    "templateValue": 1.0,
    "templateValues": [
      1.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 1.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-routine-208"
    ]
  },
  {
    "key": "grounds.landscapeBicycleShelterCount",
    "label": "园林设施非机动车棚数量",
    "group": "grounds",
    "unit": "个",
    "templateValue": 1.0,
    "templateValues": [
      1.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 1.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-routine-209",
      "engineering-routine-210",
      "engineering-routine-211"
    ]
  },
  {
    "key": "grounds.signageCount",
    "label": "园区标识标牌及宣传栏数量",
    "group": "grounds",
    "unit": "个",
    "templateValue": 2.0,
    "templateValues": [
      2.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 2.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-routine-212",
      "engineering-routine-213",
      "engineering-routine-214"
    ]
  },
  {
    "key": "grounds.roadArea",
    "label": "园区道路面积",
    "group": "grounds",
    "unit": "平方米",
    "templateValue": 8576.73,
    "templateValues": [
      8576.73
    ],
    "defaultRule": {
      "type": "template",
      "value": 8576.73,
      "source": "template"
    },
    "round": "none",
    "affectedActionIds": [
      "engineering-routine-215",
      "engineering-routine-216",
      "engineering-routine-217",
      "engineering-routine-218"
    ]
  },
  {
    "key": "grounds.wallLength",
    "label": "园区围墙长度",
    "group": "grounds",
    "unit": "米",
    "templateValue": 696.0,
    "templateValues": [
      696.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 696.0,
      "source": "template"
    },
    "round": "none",
    "affectedActionIds": [
      "engineering-routine-219"
    ]
  },
  {
    "key": "grounds.tankCount",
    "label": "园区池体数量",
    "group": "grounds",
    "unit": "个",
    "templateValue": 3.0,
    "templateValues": [
      3.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 3.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-routine-220",
      "engineering-routine-221",
      "engineering-routine-222"
    ]
  },
  {
    "key": "grounds.drainagePipelineLength",
    "label": "园区排水主管长度",
    "group": "grounds",
    "unit": "米",
    "templateValue": 5649.3,
    "templateValues": [
      5649.3
    ],
    "defaultRule": {
      "type": "template",
      "value": 5649.3,
      "source": "template"
    },
    "round": "none",
    "affectedActionIds": [
      "engineering-routine-223",
      "engineering-routine-224",
      "engineering-routine-225"
    ]
  },
  {
    "key": "grounds.drainageWellCount",
    "label": "园区排水井数量",
    "group": "grounds",
    "unit": "个",
    "templateValue": 329.0,
    "templateValues": [
      329.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 329.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-routine-226",
      "engineering-routine-227",
      "engineering-routine-228"
    ]
  },
  {
    "key": "grounds.distributionBoxCount",
    "label": "园林配电箱数量",
    "group": "grounds",
    "unit": "个",
    "templateValue": 3.0,
    "templateValues": [
      3.0
    ],
    "defaultRule": {
      "type": "template",
      "value": 3.0,
      "source": "template"
    },
    "round": "integer",
    "affectedActionIds": [
      "engineering-routine-230",
      "engineering-routine-231",
      "engineering-routine-232"
    ]
  }
];

const generatedKeys = new Set(GENERATED_ADVANCED_PARAMETER_DEFINITIONS.map(({ key }) => key));
const unknownDefaultRuleKeys = Object.keys(ADVANCED_PARAMETER_DEFAULT_RULES)
  .filter((key) => !generatedKeys.has(key));
if (unknownDefaultRuleKeys.length > 0) {
  throw new Error(`高级参数默认规则存在未知编号：${unknownDefaultRuleKeys.join('、')}`);
}

export const ADVANCED_PARAMETER_DEFINITIONS = deepFreeze(
  GENERATED_ADVANCED_PARAMETER_DEFINITIONS.map((definition) => ({
    ...definition,
    defaultRule: ADVANCED_PARAMETER_DEFAULT_RULES[definition.key] ?? definition.defaultRule,
  })),
);
