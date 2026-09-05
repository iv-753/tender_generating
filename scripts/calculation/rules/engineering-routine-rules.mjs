// Generated once from the audited internal workbook; production never reads it.
function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}

export const ENGINEERING_ROUTINE_RULES = deepFreeze([
  {
    "id": "engineering-routine-5",
    "source": "工程常规:5",
    "action": "B-SS-50 地下层停车区天花/地面/墙身/各类门巡查",
    "system": "地下室",
    "property": "可选",
    "unit": "平方米",
    "quantityParameterKey": "basement.parkingArea",
    "templateQuantity": 62460.0,
    "unitHours": {
      "A": 0.000132,
      "B": 0.00012100000000000003,
      "C": 0.00011550000000000002,
      "D": 0.00011000000000000002
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-6",
    "source": "工程常规:6",
    "action": "A-SS-50 地下层停车区防火卷帘/设备巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.fireShutterCount",
    "templateQuantity": 252.0,
    "unitHours": {
      "A": 0.006600000000000001,
      "B": 0.006050000000000001,
      "C": 0.005775000000000001,
      "D": 0.0055000000000000005
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-7",
    "source": "工程常规:7",
    "action": "B-SS-50 地下层停车区消防管线巡查",
    "system": "消防系统",
    "property": "可选",
    "unit": "平方米",
    "quantityParameterKey": "basement.parkingArea",
    "templateQuantity": 62460.0,
    "unitHours": {
      "A": 0.000132,
      "B": 0.00012100000000000003,
      "C": 0.00011550000000000002,
      "D": 0.00011000000000000002
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-8",
    "source": "工程常规:8",
    "action": "A-SS-50 地下层停车区消防末端巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "basement.parkingArea",
    "templateQuantity": 62460.0,
    "unitHours": {
      "A": 0.000132,
      "B": 0.00012100000000000003,
      "C": 0.00011550000000000002,
      "D": 0.00011000000000000002
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-9",
    "source": "工程常规:9",
    "action": "A-SS-50 地下层停车区监控设施/线路/末端巡查",
    "system": "智能化系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.parkingSurveillanceCount",
    "templateQuantity": 48.0,
    "unitHours": {
      "A": 0.10560000000000001,
      "B": 0.09680000000000001,
      "C": 0.09240000000000001,
      "D": 0.08800000000000001
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-10",
    "source": "工程常规:10",
    "action": "B-SS-50 地下层停车区标识标牌防撞巡查",
    "system": "地下室",
    "property": "可选",
    "unit": "平方米",
    "quantityParameterKey": "basement.parkingArea",
    "templateQuantity": 62460.0,
    "unitHours": {
      "A": 0.000132,
      "B": 0.00012100000000000003,
      "C": 0.00011550000000000002,
      "D": 0.00011000000000000002
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-11",
    "source": "工程常规:11",
    "action": "B-SS-50 地下层排水排污设施设备巡查",
    "system": "给排水系统",
    "property": "可选",
    "unit": "个",
    "quantityParameterKey": "basement.drainageEquipmentCount",
    "templateQuantity": 58.0,
    "unitHours": {
      "A": 0.066,
      "B": 0.06050000000000001,
      "C": 0.05775000000000001,
      "D": 0.05500000000000001
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-12",
    "source": "工程常规:12",
    "action": "A-SS-54 地下层排水排污设施设备检测",
    "system": "给排水系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.drainageEquipmentCount",
    "templateQuantity": 58.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-13",
    "source": "工程常规:13",
    "action": "A-SS-55 地下层排水排污设施设备保养",
    "system": "给排水系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.drainageEquipmentCount",
    "templateQuantity": 58.0,
    "unitHours": {
      "A": 0.66,
      "B": 0.6050000000000001,
      "C": 0.5775000000000001,
      "D": 0.55
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-14",
    "source": "工程常规:14",
    "action": "B-SS-50 地下层疏散楼梯天花/地面/墙身/窗/栏杆巡查",
    "system": "地下室",
    "property": "可选",
    "unit": "平方米",
    "quantityParameterKey": "basement.evacuationStairArea",
    "templateQuantity": 189.8,
    "unitHours": {
      "A": 0.026400000000000003,
      "B": 0.024200000000000003,
      "C": 0.023100000000000002,
      "D": 0.022000000000000002
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-15",
    "source": "工程常规:15",
    "action": "B-SS-50 地下层照明线路/末端巡查",
    "system": "供配电系统",
    "property": "可选",
    "unit": "平方米",
    "quantityParameterKey": "basement.parkingArea",
    "templateQuantity": 62460.0,
    "unitHours": {
      "A": 0.000132,
      "B": 0.00012100000000000003,
      "C": 0.00011550000000000002,
      "D": 0.00011000000000000002
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-16",
    "source": "工程常规:16",
    "action": "A-SS-54 地下层照明线路/末端检测",
    "system": "供配电系统",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "basement.parkingArea",
    "templateQuantity": 62460.0,
    "unitHours": {
      "A": 0.000132,
      "B": 0.00012100000000000003,
      "C": 0.00011550000000000002,
      "D": 0.00011000000000000002
    },
    "frequency": {
      "A": "每年2次",
      "B": "每年2次",
      "C": "每年2次",
      "D": "每年2次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-17",
    "source": "工程常规:17",
    "action": "A-SS-55 地下层照明线路/末端保养",
    "system": "供配电系统",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "basement.parkingArea",
    "templateQuantity": 62460.0,
    "unitHours": {
      "A": 0.00132,
      "B": 0.0012100000000000001,
      "C": 0.0011550000000000002,
      "D": 0.0011
    },
    "frequency": {
      "A": "每年2次",
      "B": "每年2次",
      "C": "每年2次",
      "D": "每年2次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-18",
    "source": "工程常规:18",
    "action": "B-SS-50 地下层车道出入口天花/地面/墙身巡查",
    "system": "地下室",
    "property": "可选",
    "unit": "平方米",
    "quantityParameterKey": "basement.vehicleEntranceArea",
    "templateQuantity": 1416.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-19",
    "source": "工程常规:19",
    "action": "B-SS-50 地下层车道出入口设备设施巡查",
    "system": "智能化系统",
    "property": "可选",
    "unit": "个",
    "quantityParameterKey": "basement.vehicleEntranceEquipmentCount",
    "templateQuantity": 262.0,
    "unitHours": {
      "A": 0.00132,
      "B": 0.0012100000000000001,
      "C": 0.0011550000000000002,
      "D": 0.0011
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-20",
    "source": "工程常规:20",
    "action": "A-SS-50 地下层设备房发电机房设施/设备巡查",
    "system": "供配电系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.generatorRoomCount",
    "templateQuantity": 2.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每日1次",
      "B": "每日1次",
      "C": "每日1次",
      "D": "每日1次"
    },
    "annualFrequency": {
      "A": 365.0,
      "B": 365.0,
      "C": 365.0,
      "D": 365.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-21",
    "source": "工程常规:21",
    "action": "A-SS-54 地下层设备房发电机房设施/设备检测",
    "system": "供配电系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.generatorRoomCount",
    "templateQuantity": 2.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每月2次",
      "B": "每月2次",
      "C": "每月2次",
      "D": "每月2次"
    },
    "annualFrequency": {
      "A": 24.0,
      "B": 24.0,
      "C": 24.0,
      "D": 24.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-22",
    "source": "工程常规:22",
    "action": "A-SS-55 地下层设备房发电机房设施/设备保养",
    "system": "供配电系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.generatorRoomCount",
    "templateQuantity": 2.0,
    "unitHours": {
      "A": 2.64,
      "B": 2.4200000000000004,
      "C": 2.3100000000000005,
      "D": 2.2
    },
    "frequency": {
      "A": "每月2次",
      "B": "每月2次",
      "C": "每月2次",
      "D": "每月2次"
    },
    "annualFrequency": {
      "A": 24.0,
      "B": 24.0,
      "C": 24.0,
      "D": 24.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-23",
    "source": "工程常规:23",
    "action": "A-SS-50 地下层设备房发电机房消防末端巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.generatorRoomCount",
    "templateQuantity": 2.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-24",
    "source": "工程常规:24",
    "action": "A-SS-50 地下层设备房专变电房设施/设备巡查",
    "system": "供配电系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.transformerRoomCount",
    "templateQuantity": 3.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每日1次",
      "B": "每日1次",
      "C": "每日1次",
      "D": "每日1次"
    },
    "annualFrequency": {
      "A": 365.0,
      "B": 365.0,
      "C": 365.0,
      "D": 365.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-25",
    "source": "工程常规:25",
    "action": "A-SS-54 地下层设备房专变电房设施/设备检测",
    "system": "供配电系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.transformerRoomCount",
    "templateQuantity": 3.0,
    "unitHours": {
      "A": 0.66,
      "B": 0.6050000000000001,
      "C": 0.5775000000000001,
      "D": 0.55
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-26",
    "source": "工程常规:26",
    "action": "A-SS-55 地下层设备房专变电房设施/设备保养",
    "system": "供配电系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.transformerRoomCount",
    "templateQuantity": 3.0,
    "unitHours": {
      "A": 10.56,
      "B": 9.680000000000001,
      "C": 9.240000000000002,
      "D": 8.8
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-27",
    "source": "工程常规:27",
    "action": "A-SS-50 地下层设备房专变房消防末端巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.transformerRoomCount",
    "templateQuantity": 3.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-28",
    "source": "工程常规:28",
    "action": "B-SS-50 地下层电信机房设施/设备巡查",
    "system": "智能化系统",
    "property": "可选",
    "unit": "个",
    "quantityParameterKey": "basement.telecomRoomCount",
    "templateQuantity": 0.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-29",
    "source": "工程常规:29",
    "action": "A-SS-50 地下层电信机房消防末端巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.telecomRoomCount",
    "templateQuantity": 0.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-30",
    "source": "工程常规:30",
    "action": "A-SS-50 地下层生活给水泵房设施/设备巡查",
    "system": "给排水系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.domesticWaterPumpRoomCount",
    "templateQuantity": 2.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每日1次",
      "B": "每日1次",
      "C": "每日1次",
      "D": "每日1次"
    },
    "annualFrequency": {
      "A": 365.0,
      "B": 365.0,
      "C": 365.0,
      "D": 365.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-31",
    "source": "工程常规:31",
    "action": "A-SS-54 地下层生活给水泵房设施/设备检测",
    "system": "给排水系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.domesticWaterPumpRoomCount",
    "templateQuantity": 2.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-32",
    "source": "工程常规:32",
    "action": "A-SS-55 地下层生活给水泵房设施/设备保养",
    "system": "给排水系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.domesticWaterPumpRoomCount",
    "templateQuantity": 2.0,
    "unitHours": {
      "A": 5.28,
      "B": 4.840000000000001,
      "C": 4.620000000000001,
      "D": 4.4
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-33",
    "source": "工程常规:33",
    "action": "A-SS-50 地下层生活给水泵房消防末端巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.domesticWaterPumpRoomCount",
    "templateQuantity": 2.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-34",
    "source": "工程常规:34",
    "action": "B-SS-50 地下层泳池泵房设施/设备巡查",
    "system": "给排水系统",
    "property": "可选",
    "unit": "个",
    "quantityParameterKey": "basement.poolPumpRoomCount",
    "templateQuantity": 1.0,
    "unitHours": {
      "A": 0.264,
      "B": 0.24200000000000005,
      "C": 0.23100000000000004,
      "D": 0.22000000000000003
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-35",
    "source": "工程常规:35",
    "action": "A-SS-54 地下层泳池泵房设施/设备检测",
    "system": "给排水系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.poolPumpRoomCount",
    "templateQuantity": 1.0,
    "unitHours": {
      "A": 0.264,
      "B": 0.24200000000000005,
      "C": 0.23100000000000004,
      "D": 0.22000000000000003
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-36",
    "source": "工程常规:36",
    "action": "A-SS-55 地下层泳池泵房设施/设备保养",
    "system": "给排水系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.poolPumpRoomCount",
    "templateQuantity": 1.0,
    "unitHours": {
      "A": 2.64,
      "B": 2.4200000000000004,
      "C": 2.3100000000000005,
      "D": 2.2
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-37",
    "source": "工程常规:37",
    "action": "A-SS-50 地下层泳池泵房消防末端巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.poolPumpRoomCount",
    "templateQuantity": 1.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-38",
    "source": "工程常规:38",
    "action": "A-SS-50 地下层室内消防水泵房设施/设备巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.firePumpRoomCount",
    "templateQuantity": 3.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每日1次",
      "B": "每日1次",
      "C": "每日1次",
      "D": "每日1次"
    },
    "annualFrequency": {
      "A": 365.0,
      "B": 365.0,
      "C": 365.0,
      "D": 365.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-39",
    "source": "工程常规:39",
    "action": "A-SS-50 地下层室内消防水泵消防末端巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "basement.parkingArea",
    "templateQuantity": 62460.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-40",
    "source": "工程常规:40",
    "action": "A-SS-50 地下层湿式报警阀间设施/设备巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.wetAlarmValveRoomCount",
    "templateQuantity": 3.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-41",
    "source": "工程常规:41",
    "action": "A-SS-50 地下层湿式报警阀间消防末端巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.wetAlarmValveRoomCount",
    "templateQuantity": 3.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-42",
    "source": "工程常规:42",
    "action": "A-SS-50 地下层配电间设施/设备巡查",
    "system": "供配电系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.powerDistributionRoomCount",
    "templateQuantity": 33.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-43",
    "source": "工程常规:43",
    "action": "A-SS-54 地下层配电间设施/设备检测",
    "system": "供配电系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.powerDistributionRoomCount",
    "templateQuantity": 33.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-44",
    "source": "工程常规:44",
    "action": "A-SS-55 地下层配电间设施/设备保养",
    "system": "供配电系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.powerDistributionRoomCount",
    "templateQuantity": 33.0,
    "unitHours": {
      "A": 0.66,
      "B": 0.6050000000000001,
      "C": 0.5775000000000001,
      "D": 0.55
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-45",
    "source": "工程常规:45",
    "action": "A-SS-50 地下层配电间消防末端巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.powerDistributionRoomCount",
    "templateQuantity": 33.0,
    "unitHours": {
      "A": 0.0198,
      "B": 0.018150000000000003,
      "C": 0.017325,
      "D": 0.0165
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-46",
    "source": "工程常规:46",
    "action": "A-SS-50 地下层充电桩电表间设施/设备巡查",
    "system": "供配电系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.chargingMeterRoomCount",
    "templateQuantity": 5.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每日1次",
      "B": "每日1次",
      "C": "每日1次",
      "D": "每日1次"
    },
    "annualFrequency": {
      "A": 365.0,
      "B": 365.0,
      "C": 365.0,
      "D": 365.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-47",
    "source": "工程常规:47",
    "action": "A-SS-54 地下层充电桩电表间设施/设备检测",
    "system": "供配电系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.chargingMeterRoomCount",
    "templateQuantity": 5.0,
    "unitHours": {
      "A": 0.066,
      "B": 0.06050000000000001,
      "C": 0.05775000000000001,
      "D": 0.05500000000000001
    },
    "frequency": {
      "A": "每年2次",
      "B": "每年2次",
      "C": "每年2次",
      "D": "每年2次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-48",
    "source": "工程常规:48",
    "action": "A-SS-55 地下层充电桩电表间设施/设备保养",
    "system": "供配电系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.chargingMeterRoomCount",
    "templateQuantity": 5.0,
    "unitHours": {
      "A": 0.66,
      "B": 0.6050000000000001,
      "C": 0.5775000000000001,
      "D": 0.55
    },
    "frequency": {
      "A": "每年2次",
      "B": "每年2次",
      "C": "每年2次",
      "D": "每年2次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-49",
    "source": "工程常规:49",
    "action": "A-SS-50 地下层充电桩电表间消防末端巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.chargingMeterRoomCount",
    "templateQuantity": 5.0,
    "unitHours": {
      "A": 0.026400000000000003,
      "B": 0.024200000000000003,
      "C": 0.023100000000000002,
      "D": 0.022000000000000002
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-50",
    "source": "工程常规:50",
    "action": "A-SS-50 地下层加压风机房设施/设备巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.pressurizationFanRoomCount",
    "templateQuantity": 17.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-51",
    "source": "工程常规:51",
    "action": "A-SS-50 地下层加压风机房消防末端巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.pressurizationFanRoomCount",
    "templateQuantity": 17.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-52",
    "source": "工程常规:52",
    "action": "A-SS-50 地下层排烟风机房设施/设备巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.smokeExhaustFanRoomCount",
    "templateQuantity": 45.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-53",
    "source": "工程常规:53",
    "action": "A-SS-50 地下层排烟风机房消防末端巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.smokeExhaustFanRoomCount",
    "templateQuantity": 45.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-54",
    "source": "工程常规:54",
    "action": "A-SS-50 地下层送风风机房设施/设备巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.supplyAirFanRoomCount",
    "templateQuantity": 45.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-55",
    "source": "工程常规:55",
    "action": "A-SS-50 地下层送风风机房消防末端巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.supplyAirFanRoomCount",
    "templateQuantity": 45.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-56",
    "source": "工程常规:56",
    "action": "A-SS-50 地下层污水处理机房设施/设备巡查",
    "system": "给排水系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.sewageTreatmentRoomCount",
    "templateQuantity": 0.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-57",
    "source": "工程常规:57",
    "action": "A-SS-54 地下层污水处理机房设施/设备检测",
    "system": "给排水系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.sewageTreatmentRoomCount",
    "templateQuantity": 0.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-58",
    "source": "工程常规:58",
    "action": "A-SS-55 地下层污水处理机房设施/设备保养",
    "system": "给排水系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.sewageTreatmentRoomCount",
    "templateQuantity": 0.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-59",
    "source": "工程常规:59",
    "action": "A-SS-50 地下层污水处理机房消防末端巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.sewageTreatmentRoomCount",
    "templateQuantity": 0.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-60",
    "source": "工程常规:60",
    "action": "B-SS-50 地下层雨水调蓄机房设施/设备巡查",
    "system": "给排水系统",
    "property": "可选",
    "unit": "个",
    "quantityParameterKey": "basement.rainwaterStorageRoomCount",
    "templateQuantity": 0.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-61",
    "source": "工程常规:61",
    "action": "A-SS-54 地下层雨水调蓄机房设施/设备检测",
    "system": "给排水系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.rainwaterStorageRoomCount",
    "templateQuantity": 0.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-62",
    "source": "工程常规:62",
    "action": "A-SS-55 地下层雨水调蓄机房设施/设备保养",
    "system": "给排水系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.rainwaterStorageRoomCount",
    "templateQuantity": 0.0,
    "unitHours": {
      "A": 2.64,
      "B": 2.4200000000000004,
      "C": 2.3100000000000005,
      "D": 2.2
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-63",
    "source": "工程常规:63",
    "action": "A-SS-50 地下层雨水调蓄机房消防末端巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.rainwaterStorageRoomCount",
    "templateQuantity": 0.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-64",
    "source": "工程常规:64",
    "action": "B-SS-50 地下层大堂天花/地面/墙身/软装巡查",
    "system": "地下室",
    "property": "可选",
    "unit": "平方米",
    "quantityParameterKey": "basement.lobbyArea",
    "templateQuantity": 1368.68,
    "unitHours": {
      "A": 0.00264,
      "B": 0.0024200000000000003,
      "C": 0.0023100000000000004,
      "D": 0.0022
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-65",
    "source": "工程常规:65",
    "action": "B-SS-50 地下层大堂门及门禁巡查",
    "system": "智能化系统",
    "property": "可选",
    "unit": "个",
    "quantityParameterKey": "basement.lobbyAccessControlCount",
    "templateQuantity": 92.0,
    "unitHours": {
      "A": 0.00264,
      "B": 0.0024200000000000003,
      "C": 0.0023100000000000004,
      "D": 0.0022
    },
    "frequency": {
      "A": "每日1次",
      "B": "每日1次",
      "C": "每日1次",
      "D": "每日1次"
    },
    "annualFrequency": {
      "A": 365.0,
      "B": 365.0,
      "C": 365.0,
      "D": 365.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-66",
    "source": "工程常规:66",
    "action": "A-SS-50 地下层大堂设备设施巡查",
    "system": "智能化系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "basement.lobbyEquipmentCount",
    "templateQuantity": 48.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-67",
    "source": "工程常规:67",
    "action": "A-SS-50 地下层大堂消防末端巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "basement.lobbyArea",
    "templateQuantity": 1368.68,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-68",
    "source": "工程常规:68",
    "action": "B-SS-50 建筑物首层大堂天花/地面/墙身/软装巡查",
    "system": "建筑物",
    "property": "可选",
    "unit": "平方米",
    "quantityParameterKey": "building.groundFloorLobbyArea",
    "templateQuantity": 623.64,
    "unitHours": {
      "A": 0.00528,
      "B": 0.0048400000000000006,
      "C": 0.004620000000000001,
      "D": 0.0044
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-69",
    "source": "工程常规:69",
    "action": "A-SS-50 建筑物首层大堂门窗及门禁/设备设施巡查",
    "system": "智能化系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "building.groundFloorLobbyAccessControlCount",
    "templateQuantity": 12.0,
    "unitHours": {
      "A": 0.0198,
      "B": 0.018150000000000003,
      "C": 0.017325,
      "D": 0.0165
    },
    "frequency": {
      "A": "每日1次",
      "B": "每日1次",
      "C": "每日1次",
      "D": "每日1次"
    },
    "annualFrequency": {
      "A": 365.0,
      "B": 365.0,
      "C": 365.0,
      "D": 365.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-70",
    "source": "工程常规:70",
    "action": "A-SS-50 建筑物首层大堂消防末端巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "building.groundFloorLobbyArea",
    "templateQuantity": 623.64,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-71",
    "source": "工程常规:71",
    "action": "B-SS-50 建筑物首层架空层天花/地面/墙面/设备设施巡查",
    "system": "供配电系统",
    "property": "可选",
    "unit": "平方米",
    "quantityParameterKey": "building.stiltFloorArea",
    "templateQuantity": 2800.7,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-72",
    "source": "工程常规:72",
    "action": "A-SS-54 建筑物首层架空层设备设施检测",
    "system": "供配电系统",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "building.stiltFloorArea",
    "templateQuantity": 2800.7,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-73",
    "source": "工程常规:73",
    "action": "A-SS-55 建筑物首层架空层设备设施保养",
    "system": "供配电系统",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "building.stiltFloorArea",
    "templateQuantity": 2800.7,
    "unitHours": {
      "A": 0.013200000000000002,
      "B": 0.012100000000000001,
      "C": 0.011550000000000001,
      "D": 0.011000000000000001
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-74",
    "source": "工程常规:74",
    "action": "A-SS-50 建筑物首层架空层消防末端巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "building.stiltFloorArea",
    "templateQuantity": 2800.7,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-75",
    "source": "工程常规:75",
    "action": "B-SS-50 建筑物首层泛会所天花/地面/墙面/设备设施巡查",
    "system": "供配电系统",
    "property": "可选",
    "unit": "个",
    "quantityParameterKey": "building.clubhouseCount",
    "templateQuantity": 0.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-76",
    "source": "工程常规:76",
    "action": "A-SS-54 建筑物首层泛会所设备设施检测",
    "system": "供配电系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "building.clubhouseCount",
    "templateQuantity": 0.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-77",
    "source": "工程常规:77",
    "action": "A-SS-55 建筑物首层泛会所设备设施保养",
    "system": "供配电系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "building.clubhouseCount",
    "templateQuantity": 0.0,
    "unitHours": {
      "A": 0.66,
      "B": 0.6050000000000001,
      "C": 0.5775000000000001,
      "D": 0.55
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-78",
    "source": "工程常规:78",
    "action": "A-SS-50 建筑物首层泛会所消防末端巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "building.clubhouseCount",
    "templateQuantity": 0.0,
    "unitHours": {
      "A": 0.066,
      "B": 0.06050000000000001,
      "C": 0.05775000000000001,
      "D": 0.05500000000000001
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-79",
    "source": "工程常规:79",
    "action": "B-SS-50 建筑物首层安防控制室门窗/基础设施巡查",
    "system": "建筑物",
    "property": "可选",
    "unit": "个",
    "quantityParameterKey": "building.securityControlRoomCount",
    "templateQuantity": 1.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-80",
    "source": "工程常规:80",
    "action": "A-SS-50 建筑物首层安防控制室消防设施/功能设施巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "building.securityControlRoomCount",
    "templateQuantity": 1.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每日1次",
      "B": "每日1次",
      "C": "每日1次",
      "D": "每日1次"
    },
    "annualFrequency": {
      "A": 365.0,
      "B": 365.0,
      "C": 365.0,
      "D": 365.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-81",
    "source": "工程常规:81",
    "action": "A-SS-50 建筑物首层电房基础设施/消防设施/功能设施巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "building.groundFloorElectricalRoomCount",
    "templateQuantity": 1.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-82",
    "source": "工程常规:82",
    "action": "A-SS-54 建筑物首层电房基础设施/功能设施检测",
    "system": "供配电系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "building.groundFloorElectricalRoomCount",
    "templateQuantity": 1.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-83",
    "source": "工程常规:83",
    "action": "A-SS-55 建筑物首层电房基础设施/功能设施保养",
    "system": "供配电系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "building.groundFloorElectricalRoomCount",
    "templateQuantity": 1.0,
    "unitHours": {
      "A": 10.56,
      "B": 9.680000000000001,
      "C": 9.240000000000002,
      "D": 8.8
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-84",
    "source": "工程常规:84",
    "action": "B-SS-50 建筑物标准层天花/地面/墙面巡查",
    "system": "建筑物",
    "property": "可选",
    "unit": "平方米",
    "quantityParameterKey": "building.standardFloorArea",
    "templateQuantity": 15421.2,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-85",
    "source": "工程常规:85",
    "action": "B-SS-50 建筑物标准层各类门窗/基础设施巡查",
    "system": "建筑物",
    "property": "可选",
    "unit": "平方米",
    "quantityParameterKey": "building.standardFloorArea",
    "templateQuantity": 15421.2,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-86",
    "source": "工程常规:86",
    "action": "A-SS-54 建筑物标准层各类门窗/基础设施检测",
    "system": "建筑物",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "building.standardFloorArea",
    "templateQuantity": 15421.2,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每年2次",
      "B": "每年2次",
      "C": "每年2次",
      "D": "每年2次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-87",
    "source": "工程常规:87",
    "action": "A-SS-55 建筑物标准层各类门窗/基础设施保养",
    "system": "建筑物",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "building.standardFloorArea",
    "templateQuantity": 15421.2,
    "unitHours": {
      "A": 0.006600000000000001,
      "B": 0.006050000000000001,
      "C": 0.005775000000000001,
      "D": 0.0055000000000000005
    },
    "frequency": {
      "A": "每年2次",
      "B": "每年2次",
      "C": "每年2次",
      "D": "每年2次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-88",
    "source": "工程常规:88",
    "action": "A-SS-50 建筑物标准层消防设施巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "building.standardFloorArea",
    "templateQuantity": 15421.2,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-89",
    "source": "工程常规:89",
    "action": "B-SS-50 建筑物屋面层屋顶构架/基础设施/通气设施巡查",
    "system": "建筑物",
    "property": "可选",
    "unit": "平方米",
    "quantityParameterKey": "building.roofArea",
    "templateQuantity": 4261.2,
    "unitHours": {
      "A": 0.006600000000000001,
      "B": 0.006050000000000001,
      "C": 0.005775000000000001,
      "D": 0.0055000000000000005
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-90",
    "source": "工程常规:90",
    "action": "B-SS-54 建筑物屋面层屋顶构架/基础设施/通气设施检测",
    "system": "建筑物",
    "property": "可选",
    "unit": "平方米",
    "quantityParameterKey": "building.roofArea",
    "templateQuantity": 4261.2,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每年1次",
      "B": "每年1次",
      "C": "每年1次",
      "D": "每年1次"
    },
    "annualFrequency": {
      "A": 1.0,
      "B": 1.0,
      "C": 1.0,
      "D": 1.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-91",
    "source": "工程常规:91",
    "action": "B-SS-55 建筑物屋面层屋顶构架/基础设施/通气设施保养",
    "system": "建筑物",
    "property": "可选",
    "unit": "平方米",
    "quantityParameterKey": "building.roofArea",
    "templateQuantity": 4261.2,
    "unitHours": {
      "A": 0.006600000000000001,
      "B": 0.006050000000000001,
      "C": 0.005775000000000001,
      "D": 0.0055000000000000005
    },
    "frequency": {
      "A": "每年1次",
      "B": "每年1次",
      "C": "每年1次",
      "D": "每年1次"
    },
    "annualFrequency": {
      "A": 1.0,
      "B": 1.0,
      "C": 1.0,
      "D": 1.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-92",
    "source": "工程常规:92",
    "action": "A-SS-50 建筑物屋面层消防设施/通气设施巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "building.roofArea",
    "templateQuantity": 4261.2,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-93",
    "source": "工程常规:93",
    "action": "B-SS-50 建筑物屋面层门窗巡查",
    "system": "建筑物",
    "property": "可选",
    "unit": "平方米",
    "quantityParameterKey": "building.roofArea",
    "templateQuantity": 4261.2,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每日1次",
      "B": "每日1次",
      "C": "每日1次",
      "D": "每日1次"
    },
    "annualFrequency": {
      "A": 365.0,
      "B": 365.0,
      "C": 365.0,
      "D": 365.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-94",
    "source": "工程常规:94",
    "action": "A-SS-50 建筑物屋面层风机房基础设施/消防设施/功能设施巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "building.buildingCount",
    "templateQuantity": 12.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-95",
    "source": "工程常规:95",
    "action": "B-SS-50 建筑物电井基础设施/水井基础设施巡查",
    "system": "建筑物",
    "property": "可选",
    "unit": "个",
    "quantityParameterKey": "building.shaftCount",
    "templateQuantity": 840.0,
    "unitHours": {
      "A": 0.00132,
      "B": 0.0012100000000000001,
      "C": 0.0011550000000000002,
      "D": 0.0011
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-96",
    "source": "工程常规:96",
    "action": "A-SS-54 建筑物电井基础设施/水井基础设施检测",
    "system": "建筑物",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "building.shaftCount",
    "templateQuantity": 840.0,
    "unitHours": {
      "A": 0.006600000000000001,
      "B": 0.006050000000000001,
      "C": 0.005775000000000001,
      "D": 0.0055000000000000005
    },
    "frequency": {
      "A": "每年2次",
      "B": "每年2次",
      "C": "每年2次",
      "D": "每年2次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-97",
    "source": "工程常规:97",
    "action": "A-SS-55 建筑物电井基础设施/水井基础设施保养",
    "system": "建筑物",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "building.shaftCount",
    "templateQuantity": 840.0,
    "unitHours": {
      "A": 0.013200000000000002,
      "B": 0.012100000000000001,
      "C": 0.011550000000000001,
      "D": 0.011000000000000001
    },
    "frequency": {
      "A": "每年2次",
      "B": "每年2次",
      "C": "每年2次",
      "D": "每年2次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-98",
    "source": "工程常规:98",
    "action": "B-SS-50 建筑物疏散楼梯天花/地面/墙面/窗/基础设施巡查",
    "system": "建筑物",
    "property": "可选",
    "unit": "平方米",
    "quantityParameterKey": "building.evacuationStairArea",
    "templateQuantity": 189.8,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-99",
    "source": "工程常规:99",
    "action": "A-SS-54 建筑物疏散楼梯基础设施检测",
    "system": "建筑物",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "building.evacuationStairArea",
    "templateQuantity": 189.8,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每年2次",
      "B": "每年2次",
      "C": "每年2次",
      "D": "每年2次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-100",
    "source": "工程常规:100",
    "action": "A-SS-55 建筑物疏散楼梯基础设施保养",
    "system": "建筑物",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "building.evacuationStairArea",
    "templateQuantity": 189.8,
    "unitHours": {
      "A": 0.006600000000000001,
      "B": 0.006050000000000001,
      "C": 0.005775000000000001,
      "D": 0.0055000000000000005
    },
    "frequency": {
      "A": "每年2次",
      "B": "每年2次",
      "C": "每年2次",
      "D": "每年2次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-101",
    "source": "工程常规:101",
    "action": "A-SS-50 建筑物疏散楼梯消防设施巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "building.evacuationStairArea",
    "templateQuantity": 189.8,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-102",
    "source": "工程常规:102",
    "action": "B-SS-50 建筑物电梯井道巡查",
    "system": "电梯系统",
    "property": "可选",
    "unit": "台",
    "quantityParameterKey": "building.elevatorCount",
    "templateQuantity": 28.0,
    "unitHours": {
      "A": 0.00264,
      "B": 0.0024200000000000003,
      "C": 0.0023100000000000004,
      "D": 0.0022
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-103",
    "source": "工程常规:103",
    "action": "B-SS-50 建筑物电梯轿厢天花/地面/墙面巡查",
    "system": "电梯系统",
    "property": "可选",
    "unit": "台",
    "quantityParameterKey": "building.elevatorCount",
    "templateQuantity": 28.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每日1次",
      "B": "每日1次",
      "C": "每日1次",
      "D": "每日1次"
    },
    "annualFrequency": {
      "A": 365.0,
      "B": 365.0,
      "C": 365.0,
      "D": 365.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-104",
    "source": "工程常规:104",
    "action": "B-SS-50 建筑物电梯轿厢设施/门/空调/公示栏巡查",
    "system": "电梯系统",
    "property": "可选",
    "unit": "台",
    "quantityParameterKey": "building.elevatorCount",
    "templateQuantity": 28.0,
    "unitHours": {
      "A": 0.00264,
      "B": 0.0024200000000000003,
      "C": 0.0023100000000000004,
      "D": 0.0022
    },
    "frequency": {
      "A": "每日1次",
      "B": "每日1次",
      "C": "每日1次",
      "D": "每日1次"
    },
    "annualFrequency": {
      "A": 365.0,
      "B": 365.0,
      "C": 365.0,
      "D": 365.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-105",
    "source": "工程常规:105",
    "action": "A-SS-50 建筑物电梯机房基础设施/消防设施/功能设施巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "building.buildingCount",
    "templateQuantity": 12.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-106",
    "source": "工程常规:106",
    "action": "B-SS-50 建筑物避难层电梯厅天花/地面/墙面/各类门窗/基础设施巡查",
    "system": "建筑物",
    "property": "可选",
    "unit": "平方米",
    "quantityParameterKey": "building.refugeFloorArea",
    "templateQuantity": 5356.72,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-107",
    "source": "工程常规:107",
    "action": "A-SS-54 建筑物避难层电梯厅基础设施检测",
    "system": "建筑物",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "building.refugeFloorArea",
    "templateQuantity": 5356.72,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每年2次",
      "B": "每年2次",
      "C": "每年2次",
      "D": "每年2次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-108",
    "source": "工程常规:108",
    "action": "A-SS-55 建筑物避难层电梯厅基础设施保养",
    "system": "建筑物",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "building.refugeFloorArea",
    "templateQuantity": 5356.72,
    "unitHours": {
      "A": 0.006600000000000001,
      "B": 0.006050000000000001,
      "C": 0.005775000000000001,
      "D": 0.0055000000000000005
    },
    "frequency": {
      "A": "每年2次",
      "B": "每年2次",
      "C": "每年2次",
      "D": "每年2次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-109",
    "source": "工程常规:109",
    "action": "A-SS-50 建筑物避难层电梯厅消防设施巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "building.refugeFloorArea",
    "templateQuantity": 5356.72,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-110",
    "source": "工程常规:110",
    "action": "B-SS-50 建筑物避难层天花/地面/墙面/各类门窗/基础设施巡查",
    "system": "建筑物",
    "property": "可选",
    "unit": "平方米",
    "quantityParameterKey": "building.refugeFloorArea",
    "templateQuantity": 5356.72,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-111",
    "source": "工程常规:111",
    "action": "A-SS-54 建筑物避难层基础设施检测",
    "system": "建筑物",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "building.refugeFloorArea",
    "templateQuantity": 5356.72,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每年2次",
      "B": "每年2次",
      "C": "每年2次",
      "D": "每年2次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-112",
    "source": "工程常规:112",
    "action": "A-SS-55 建筑物避难层基础设施保养",
    "system": "建筑物",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "building.refugeFloorArea",
    "templateQuantity": 5356.72,
    "unitHours": {
      "A": 0.006600000000000001,
      "B": 0.006050000000000001,
      "C": 0.005775000000000001,
      "D": 0.0055000000000000005
    },
    "frequency": {
      "A": "每年2次",
      "B": "每年2次",
      "C": "每年2次",
      "D": "每年2次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-113",
    "source": "工程常规:113",
    "action": "A-SS-50 建筑物避难层消防设施巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "building.refugeFloorArea",
    "templateQuantity": 5356.72,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-114",
    "source": "工程常规:114",
    "action": "A-SS-50 建筑物避难层湿式报警间基础设施/消防设施/功能设施巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "building.refugeWetAlarmRoomCount",
    "templateQuantity": 8.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-115",
    "source": "工程常规:115",
    "action": "A-SS-50 建筑物避难层加压风机房基础设施/消防设施/功能设施巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "building.refugePressurizationFanRoomCount",
    "templateQuantity": 16.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-116",
    "source": "工程常规:116",
    "action": "B-SS-50 建筑外立面基座层墙身/窗/阳台栏杆/外空调及百叶/雨棚/标识巡查",
    "system": "建筑物",
    "property": "可选",
    "unit": "平方米",
    "quantityParameterKey": "building.facadeBaseArea",
    "templateQuantity": 17589.16,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-117",
    "source": "工程常规:117",
    "action": "A-SS-54 建筑外立面基座层墙身/窗/阳台栏杆/外空调及百叶/雨棚检测",
    "system": "建筑物",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "building.facadeBaseArea",
    "templateQuantity": 17589.16,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每年1次",
      "B": "每年1次",
      "C": "每年1次",
      "D": "每年1次"
    },
    "annualFrequency": {
      "A": 1.0,
      "B": 1.0,
      "C": 1.0,
      "D": 1.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-118",
    "source": "工程常规:118",
    "action": "A-SS-55 建筑外立面基座层墙身/窗/阳台栏杆/外空调及百叶/雨棚保养",
    "system": "建筑物",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "building.facadeBaseArea",
    "templateQuantity": 17589.16,
    "unitHours": {
      "A": 0.006600000000000001,
      "B": 0.006050000000000001,
      "C": 0.005775000000000001,
      "D": 0.0055000000000000005
    },
    "frequency": {
      "A": "每年1次",
      "B": "每年1次",
      "C": "每年1次",
      "D": "每年1次"
    },
    "annualFrequency": {
      "A": 1.0,
      "B": 1.0,
      "C": 1.0,
      "D": 1.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-119",
    "source": "工程常规:119",
    "action": "B-SS-50 建筑外立面标准层墙身/窗/阳台栏杆/外空调及百叶巡查",
    "system": "建筑物",
    "property": "可选",
    "unit": "平方米",
    "quantityParameterKey": "building.facadeStandardArea",
    "templateQuantity": 191513.8,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-120",
    "source": "工程常规:120",
    "action": "A-SS-54 建筑外立面标准层墙身/窗/阳台栏杆/外空调及百叶检测",
    "system": "建筑物",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "building.facadeStandardArea",
    "templateQuantity": 191513.8,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每年1次",
      "B": "每年1次",
      "C": "每年1次",
      "D": "每年1次"
    },
    "annualFrequency": {
      "A": 1.0,
      "B": 1.0,
      "C": 1.0,
      "D": 1.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-121",
    "source": "工程常规:121",
    "action": "A-SS-55 建筑外立面标准层墙身/窗/阳台栏杆/外空调及百叶保养",
    "system": "建筑物",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "building.facadeStandardArea",
    "templateQuantity": 191513.8,
    "unitHours": {
      "A": 0.013200000000000002,
      "B": 0.012100000000000001,
      "C": 0.011550000000000001,
      "D": 0.011000000000000001
    },
    "frequency": {
      "A": "每年1次",
      "B": "每年1次",
      "C": "每年1次",
      "D": "每年1次"
    },
    "annualFrequency": {
      "A": 1.0,
      "B": 1.0,
      "C": 1.0,
      "D": 1.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-122",
    "source": "工程常规:122",
    "action": "B-SS-50 建筑外立面屋顶层女儿墙/楼梯标识巡查",
    "system": "建筑物",
    "property": "可选",
    "unit": "平方米",
    "quantityParameterKey": "building.facadeRoofParapetArea",
    "templateQuantity": 2656.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-123",
    "source": "工程常规:123",
    "action": "A-SS-54 建筑外立面屋顶层女儿墙检测",
    "system": "建筑物",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "building.facadeRoofParapetArea",
    "templateQuantity": 2656.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每年1次",
      "B": "每年1次",
      "C": "每年1次",
      "D": "每年1次"
    },
    "annualFrequency": {
      "A": 1.0,
      "B": 1.0,
      "C": 1.0,
      "D": 1.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-124",
    "source": "工程常规:124",
    "action": "A-SS-55 建筑外立面屋顶层女儿墙保养",
    "system": "建筑物",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "building.facadeRoofParapetArea",
    "templateQuantity": 2656.0,
    "unitHours": {
      "A": 0.006600000000000001,
      "B": 0.006050000000000001,
      "C": 0.005775000000000001,
      "D": 0.0055000000000000005
    },
    "frequency": {
      "A": "每年1次",
      "B": "每年1次",
      "C": "每年1次",
      "D": "每年1次"
    },
    "annualFrequency": {
      "A": 1.0,
      "B": 1.0,
      "C": 1.0,
      "D": 1.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-125",
    "source": "工程常规:125",
    "action": "B-SS-50 建筑商业公区走廊天花/地面/墙身/基础设施巡查",
    "system": "建筑物",
    "property": "可选",
    "unit": "平方米",
    "quantityParameterKey": "building.commercialCorridorArea",
    "templateQuantity": 0.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-126",
    "source": "工程常规:126",
    "action": "A-SS-54 建筑商业公区走廊基础设施检测",
    "system": "建筑物",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "building.commercialCorridorArea",
    "templateQuantity": 0.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每年2次",
      "B": "每年2次",
      "C": "每年2次",
      "D": "每年2次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-127",
    "source": "工程常规:127",
    "action": "A-SS-55 建筑商业公区走廊基础设施保养",
    "system": "建筑物",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "building.commercialCorridorArea",
    "templateQuantity": 0.0,
    "unitHours": {
      "A": 0.013200000000000002,
      "B": 0.012100000000000001,
      "C": 0.011550000000000001,
      "D": 0.011000000000000001
    },
    "frequency": {
      "A": "每年2次",
      "B": "每年2次",
      "C": "每年2次",
      "D": "每年2次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-128",
    "source": "工程常规:128",
    "action": "A-SS-50 建筑商业公区走廊消防设施巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "building.commercialCorridorArea",
    "templateQuantity": 0.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-129",
    "source": "工程常规:129",
    "action": "A-SS-50 建筑商业公区电井基础设施/功能设施巡查",
    "system": "建筑物",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "building.commercialElectricalShaftCount",
    "templateQuantity": 2.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-130",
    "source": "工程常规:130",
    "action": "A-SS-54 建筑商业公区电井基础设施/功能设施检测",
    "system": "建筑物",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "building.commercialElectricalShaftCount",
    "templateQuantity": 2.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每年2次",
      "B": "每年2次",
      "C": "每年2次",
      "D": "每年2次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-131",
    "source": "工程常规:131",
    "action": "A-SS-55 建筑商业公区电井基础设施/功能设施保养",
    "system": "建筑物",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "building.commercialElectricalShaftCount",
    "templateQuantity": 2.0,
    "unitHours": {
      "A": 0.013200000000000002,
      "B": 0.012100000000000001,
      "C": 0.011550000000000001,
      "D": 0.011000000000000001
    },
    "frequency": {
      "A": "每年2次",
      "B": "每年2次",
      "C": "每年2次",
      "D": "每年2次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-132",
    "source": "工程常规:132",
    "action": "B-SS-50 建筑商业公区水井基础设施/功能设施巡查",
    "system": "建筑物",
    "property": "可选",
    "unit": "个",
    "quantityParameterKey": "building.commercialWaterShaftCount",
    "templateQuantity": 2.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-133",
    "source": "工程常规:133",
    "action": "A-SS-54 建筑商业公区水井基础设施/功能设施检测",
    "system": "建筑物",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "building.commercialWaterShaftCount",
    "templateQuantity": 2.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每年2次",
      "B": "每年2次",
      "C": "每年2次",
      "D": "每年2次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-134",
    "source": "工程常规:134",
    "action": "A-SS-55 建筑商业公区水井基础设施/功能设施保养",
    "system": "建筑物",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "building.commercialWaterShaftCount",
    "templateQuantity": 2.0,
    "unitHours": {
      "A": 0.013200000000000002,
      "B": 0.012100000000000001,
      "C": 0.011550000000000001,
      "D": 0.011000000000000001
    },
    "frequency": {
      "A": "每年2次",
      "B": "每年2次",
      "C": "每年2次",
      "D": "每年2次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-135",
    "source": "工程常规:135",
    "action": "B-SS-50 建筑商业公区疏散楼梯天花/地面/墙面/窗户/基础设施巡查",
    "system": "建筑物",
    "property": "可选",
    "unit": "平方米",
    "quantityParameterKey": "building.commercialEvacuationStairArea",
    "templateQuantity": 2.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-136",
    "source": "工程常规:136",
    "action": "A-SS-54 建筑商业公区疏散楼梯基础设施检测",
    "system": "建筑物",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "building.commercialEvacuationStairArea",
    "templateQuantity": 2.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每年2次",
      "B": "每年2次",
      "C": "每年2次",
      "D": "每年2次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-137",
    "source": "工程常规:137",
    "action": "A-SS-55 建筑商业公区疏散楼梯基础设施保养",
    "system": "建筑物",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "building.commercialEvacuationStairMaintenanceArea",
    "templateQuantity": 20.0,
    "unitHours": {
      "A": 0.006600000000000001,
      "B": 0.006050000000000001,
      "C": 0.005775000000000001,
      "D": 0.0055000000000000005
    },
    "frequency": {
      "A": "每年2次",
      "B": "每年2次",
      "C": "每年2次",
      "D": "每年2次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-138",
    "source": "工程常规:138",
    "action": "A-SS-50 建筑商业公区疏散楼梯消防设施巡查",
    "system": "消防系统",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "building.commercialEvacuationStairArea",
    "templateQuantity": 2.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-139",
    "source": "工程常规:139",
    "action": "B-SS-50 建筑商业公区屋面地面巡查",
    "system": "建筑物",
    "property": "可选",
    "unit": "平方米",
    "quantityParameterKey": "building.commercialRoofArea",
    "templateQuantity": 941.21,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-140",
    "source": "工程常规:140",
    "action": "A-SS-54 建筑商业公区屋面地面检测",
    "system": "建筑物",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "building.commercialRoofArea",
    "templateQuantity": 941.21,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每年1次",
      "B": "每年1次",
      "C": "每年1次",
      "D": "每年1次"
    },
    "annualFrequency": {
      "A": 1.0,
      "B": 1.0,
      "C": 1.0,
      "D": 1.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-141",
    "source": "工程常规:141",
    "action": "A-SS-55 建筑商业公区屋面地面保养",
    "system": "建筑物",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "building.commercialRoofArea",
    "templateQuantity": 941.21,
    "unitHours": {
      "A": 0.006600000000000001,
      "B": 0.006050000000000001,
      "C": 0.005775000000000001,
      "D": 0.0055000000000000005
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-142",
    "source": "工程常规:142",
    "action": "B-SS-50 建筑商业外立面正立面/山墙面/背立面巡查",
    "system": "建筑物",
    "property": "可选",
    "unit": "平方米",
    "quantityParameterKey": "building.commercialFacadeArea",
    "templateQuantity": 374.56,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-143",
    "source": "工程常规:143",
    "action": "A-SS-54 建筑商业外立面正立面/山墙面/背立面检测",
    "system": "建筑物",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "building.commercialFacadeArea",
    "templateQuantity": 374.56,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每年1次",
      "B": "每年1次",
      "C": "每年1次",
      "D": "每年1次"
    },
    "annualFrequency": {
      "A": 1.0,
      "B": 1.0,
      "C": 1.0,
      "D": 1.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-144",
    "source": "工程常规:144",
    "action": "A-SS-55 建筑商业外立面正立面/山墙面/背立面保养",
    "system": "建筑物",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "building.commercialFacadeArea",
    "templateQuantity": 374.56,
    "unitHours": {
      "A": 0.006600000000000001,
      "B": 0.006050000000000001,
      "C": 0.005775000000000001,
      "D": 0.0055000000000000005
    },
    "frequency": {
      "A": "每年1次",
      "B": "每年1次",
      "C": "每年1次",
      "D": "每年1次"
    },
    "annualFrequency": {
      "A": 1.0,
      "B": 1.0,
      "C": 1.0,
      "D": 1.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-145",
    "source": "工程常规:145",
    "action": "B-SS-50 建筑独立配套用房垃圾中转站门窗/设备设施/垃圾桶/外墙面/天面/立面设施巡查",
    "system": "建筑物",
    "property": "可选",
    "unit": "个",
    "quantityParameterKey": "building.garbageTransferStationCount",
    "templateQuantity": 0.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-146",
    "source": "工程常规:146",
    "action": "A-SS-54 建筑独立配套用房垃圾中转站设备设施/外墙面/外天面/外立面设施检测",
    "system": "建筑物",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "building.garbageTransferStationCount",
    "templateQuantity": 0.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每年1次",
      "B": "每年1次",
      "C": "每年1次",
      "D": "每年1次"
    },
    "annualFrequency": {
      "A": 1.0,
      "B": 1.0,
      "C": 1.0,
      "D": 1.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-147",
    "source": "工程常规:147",
    "action": "A-SS-55 建筑独立配套用房垃圾中转站设备设施/外墙面/外天面/外立面设施保养",
    "system": "建筑物",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "building.garbageTransferStationCount",
    "templateQuantity": 0.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每年1次",
      "B": "每年1次",
      "C": "每年1次",
      "D": "每年1次"
    },
    "annualFrequency": {
      "A": 1.0,
      "B": 1.0,
      "C": 1.0,
      "D": 1.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-148",
    "source": "工程常规:148",
    "action": "B-SS-50 建筑独立配套用房电房外立面墙面/天面/设施巡查",
    "system": "建筑物",
    "property": "可选",
    "unit": "个",
    "quantityParameterKey": "building.detachedElectricalRoomCount",
    "templateQuantity": 0.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-149",
    "source": "工程常规:149",
    "action": "A-SS-54 建筑独立配套用房电房外立面墙面/天面/设施检测",
    "system": "建筑物",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "building.detachedElectricalRoomCount",
    "templateQuantity": 0.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每年1次",
      "B": "每年1次",
      "C": "每年1次",
      "D": "每年1次"
    },
    "annualFrequency": {
      "A": 1.0,
      "B": 1.0,
      "C": 1.0,
      "D": 1.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-150",
    "source": "工程常规:150",
    "action": "A-SS-55 建筑独立配套用房电房外立面墙面/天面/设施保养",
    "system": "建筑物",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "building.detachedElectricalRoomCount",
    "templateQuantity": 0.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每年1次",
      "B": "每年1次",
      "C": "每年1次",
      "D": "每年1次"
    },
    "annualFrequency": {
      "A": 1.0,
      "B": 1.0,
      "C": 1.0,
      "D": 1.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-151",
    "source": "工程常规:151",
    "action": "B-SS-50 园林小区出入口门岗室/门楼廊架天地墙面巡查",
    "system": "园林",
    "property": "可选",
    "unit": "平方米",
    "quantityParameterKey": "grounds.entranceGuardhouseArea",
    "templateQuantity": 794.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-152",
    "source": "工程常规:152",
    "action": "B-SS-50 园林小区出入口门楼廊架人行闸机巡查",
    "system": "智能化系统",
    "property": "可选",
    "unit": "台",
    "quantityParameterKey": "grounds.gatedEntrancePedestrianGateCount",
    "templateQuantity": 2.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-153",
    "source": "工程常规:153",
    "action": "B-SS-50 园林小区出入口门楼廊架车行闸机巡查",
    "system": "智能化系统",
    "property": "可选",
    "unit": "台",
    "quantityParameterKey": "grounds.gatedEntranceVehicleGateCount",
    "templateQuantity": 0.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-154",
    "source": "工程常规:154",
    "action": "B-SS-50 园林小区出入口门楼廊架通行门/设备设施巡查",
    "system": "园林",
    "property": "可选",
    "unit": "个",
    "quantityParameterKey": "grounds.gatedEntranceAccessGateCount",
    "templateQuantity": 2.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-155",
    "source": "工程常规:155",
    "action": "A-SS-54 园林小区出入口门楼廊架通行门/设备设施检测",
    "system": "园林",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "grounds.gatedEntranceAccessGateCount",
    "templateQuantity": 2.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-156",
    "source": "工程常规:156",
    "action": "A-SS-55 园林小区出入口门楼廊架通行门/设备设施保养",
    "system": "园林",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "grounds.gatedEntranceAccessGateCount",
    "templateQuantity": 2.0,
    "unitHours": {
      "A": 1.32,
      "B": 1.2100000000000002,
      "C": 1.1550000000000002,
      "D": 1.1
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-157",
    "source": "工程常规:157",
    "action": "B-SS-50 园林小区出入口无门楼廊架人行闸机巡查",
    "system": "智能化系统",
    "property": "可选",
    "unit": "台",
    "quantityParameterKey": "grounds.ungatedEntrancePedestrianGateCount",
    "templateQuantity": 4.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-158",
    "source": "工程常规:158",
    "action": "B-SS-50 园林小区出入口无门楼廊架车行闸机巡查",
    "system": "智能化系统",
    "property": "可选",
    "unit": "台",
    "quantityParameterKey": "grounds.ungatedEntranceVehicleGateCount",
    "templateQuantity": 8.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-159",
    "source": "工程常规:159",
    "action": "B-SS-50 园林小区出入口无门楼廊架通行门/设备设施巡查",
    "system": "智能化系统",
    "property": "可选",
    "unit": "台",
    "quantityParameterKey": "grounds.ungatedEntranceAccessGateCount",
    "templateQuantity": 0.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-160",
    "source": "工程常规:160",
    "action": "B-SS-50 园林小区出入口及广场地面巡查",
    "system": "园林",
    "property": "可选",
    "unit": "平方米",
    "quantityParameterKey": "grounds.entrancePlazaArea",
    "templateQuantity": 4858.77,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-161",
    "source": "工程常规:161",
    "action": "B-SS-50 园林小区出入口及广场水景饰面/辅助设施巡查",
    "system": "给排水系统",
    "property": "可选",
    "unit": "个",
    "quantityParameterKey": "grounds.entranceWaterFeatureCount",
    "templateQuantity": 1.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-162",
    "source": "工程常规:162",
    "action": "A-SS-54 园林小区出入口及广场水景辅助设施检测",
    "system": "给排水系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "grounds.entranceWaterFeatureCount",
    "templateQuantity": 1.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-163",
    "source": "工程常规:163",
    "action": "A-SS-55 园林小区出入口及广场水景辅助设施保养",
    "system": "给排水系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "grounds.entranceWaterFeatureCount",
    "templateQuantity": 1.0,
    "unitHours": {
      "A": 1.32,
      "B": 1.2100000000000002,
      "C": 1.1550000000000002,
      "D": 1.1
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-164",
    "source": "工程常规:164",
    "action": "B-SS-50 园林小区出入口及广场户外家具/艺术雕塑巡查",
    "system": "园林",
    "property": "可选",
    "unit": "个",
    "quantityParameterKey": "grounds.entranceArtworkCount",
    "templateQuantity": 1.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-165",
    "source": "工程常规:165",
    "action": "B-SS-50 园林小区出入口及广场非机动车停车棚巡查",
    "system": "园林",
    "property": "可选",
    "unit": "个",
    "quantityParameterKey": "grounds.entranceBicycleShelterCount",
    "templateQuantity": 0.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-166",
    "source": "工程常规:166",
    "action": "A-SS-54 园林小区出入口及广场非机动车停车棚检测",
    "system": "园林",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "grounds.entranceBicycleShelterCount",
    "templateQuantity": 0.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-167",
    "source": "工程常规:167",
    "action": "A-SS-55 园林小区出入口及广场非机动车停车棚保养",
    "system": "园林",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "grounds.entranceBicycleShelterCount",
    "templateQuantity": 0.0,
    "unitHours": {
      "A": 2.64,
      "B": 2.4200000000000004,
      "C": 2.3100000000000005,
      "D": 2.2
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-168",
    "source": "工程常规:168",
    "action": "B-SS-50 园林小区出入口及广场设备设施巡查",
    "system": "供配电系统",
    "property": "可选",
    "unit": "平方米",
    "quantityParameterKey": "grounds.entrancePlazaArea",
    "templateQuantity": 4858.77,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-169",
    "source": "工程常规:169",
    "action": "A-SS-54 园林小区出入口及广场设备设施检测",
    "system": "供配电系统",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "grounds.entrancePlazaArea",
    "templateQuantity": 4858.77,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-170",
    "source": "工程常规:170",
    "action": "A-SS-55 园林小区出入口及广场设备设施保养",
    "system": "供配电系统",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "grounds.entrancePlazaArea",
    "templateQuantity": 4858.77,
    "unitHours": {
      "A": 0.00264,
      "B": 0.0024200000000000003,
      "C": 0.0023100000000000004,
      "D": 0.0022
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-171",
    "source": "工程常规:171",
    "action": "B-SS-50 园林分区地面巡查",
    "system": "园林",
    "property": "可选",
    "unit": "平方米",
    "quantityParameterKey": "grounds.zoneArea",
    "templateQuantity": 9820.01,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-172",
    "source": "工程常规:172",
    "action": "B-SS-50 园林水景饰面/辅助设施巡查",
    "system": "给排水系统",
    "property": "可选",
    "unit": "个",
    "quantityParameterKey": "grounds.landscapeWaterFeatureCount",
    "templateQuantity": 4.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-173",
    "source": "工程常规:173",
    "action": "A-SS-54 园林水景辅助设施检测",
    "system": "给排水系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "grounds.landscapeWaterFeatureCount",
    "templateQuantity": 4.0,
    "unitHours": {
      "A": 0.066,
      "B": 0.06050000000000001,
      "C": 0.05775000000000001,
      "D": 0.05500000000000001
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-174",
    "source": "工程常规:174",
    "action": "A-SS-55 园林水景辅助设施保养",
    "system": "给排水系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "grounds.landscapeWaterFeatureCount",
    "templateQuantity": 4.0,
    "unitHours": {
      "A": 0.66,
      "B": 0.6050000000000001,
      "C": 0.5775000000000001,
      "D": 0.55
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-175",
    "source": "工程常规:175",
    "action": "B-SS-50 园林泳池建筑廊架设施/地面巡查",
    "system": "园林",
    "property": "可选",
    "unit": "平方米",
    "quantityParameterKey": "grounds.poolPergolaArea",
    "templateQuantity": 199.73,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-176",
    "source": "工程常规:176",
    "action": "A-SS-54 园林泳池建筑廊架设施检测",
    "system": "园林",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "grounds.poolPergolaArea",
    "templateQuantity": 199.73,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-177",
    "source": "工程常规:177",
    "action": "A-SS-55 园林泳池建筑廊架设施保养",
    "system": "园林",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "grounds.poolPergolaArea",
    "templateQuantity": 199.73,
    "unitHours": {
      "A": 0.066,
      "B": 0.06050000000000001,
      "C": 0.05775000000000001,
      "D": 0.05500000000000001
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-178",
    "source": "工程常规:178",
    "action": "B-SS-50 园林泳池设备设施巡查",
    "system": "给排水系统",
    "property": "可选",
    "unit": "个",
    "quantityParameterKey": "grounds.poolEquipmentCount",
    "templateQuantity": 1.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-179",
    "source": "工程常规:179",
    "action": "A-SS-54 园林泳池设备设施检测",
    "system": "给排水系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "grounds.poolEquipmentCount",
    "templateQuantity": 1.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-180",
    "source": "工程常规:180",
    "action": "A-SS-55 园林泳池设备设施保养",
    "system": "给排水系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "grounds.poolEquipmentCount",
    "templateQuantity": 1.0,
    "unitHours": {
      "A": 2.64,
      "B": 2.4200000000000004,
      "C": 2.3100000000000005,
      "D": 2.2
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-181",
    "source": "工程常规:181",
    "action": "B-SS-50 园林泳池功能房更衣室/淋浴间/卫生间/急救室/休息平台巡查",
    "system": "园林",
    "property": "可选",
    "unit": "个",
    "quantityParameterKey": "grounds.poolFacilityRoomCount",
    "templateQuantity": 7.0,
    "unitHours": {
      "A": 0.198,
      "B": 0.18150000000000002,
      "C": 0.17325000000000002,
      "D": 0.165
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-182",
    "source": "工程常规:182",
    "action": "B-SS-50 园林儿童活动场地地面/活动设施巡查",
    "system": "园林",
    "property": "可选",
    "unit": "平方米",
    "quantityParameterKey": "grounds.childrenActivityArea",
    "templateQuantity": 804.14,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每日1次",
      "B": "每日1次",
      "C": "每日1次",
      "D": "每日1次"
    },
    "annualFrequency": {
      "A": 365.0,
      "B": 365.0,
      "C": 365.0,
      "D": 365.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-183",
    "source": "工程常规:183",
    "action": "A-SS-54 园林儿童活动场地活动设施/全民健身场地活动设施检测",
    "system": "园林",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "grounds.activityFacilityArea",
    "templateQuantity": 942.27,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-184",
    "source": "工程常规:184",
    "action": "A-SS-55 园林儿童活动场地活动设施/全民健身场地活动设施保养",
    "system": "园林",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "grounds.activityFacilityArea",
    "templateQuantity": 942.27,
    "unitHours": {
      "A": 0.013200000000000002,
      "B": 0.012100000000000001,
      "C": 0.011550000000000001,
      "D": 0.011000000000000001
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-185",
    "source": "工程常规:185",
    "action": "B-SS-50 园林全民健身场地地面/活动设施巡查",
    "system": "园林",
    "property": "可选",
    "unit": "平方米",
    "quantityParameterKey": "grounds.fitnessActivityArea",
    "templateQuantity": 138.13,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每日1次",
      "B": "每日1次",
      "C": "每日1次",
      "D": "每日1次"
    },
    "annualFrequency": {
      "A": 365.0,
      "B": 365.0,
      "C": 365.0,
      "D": 365.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-186",
    "source": "工程常规:186",
    "action": "B-SS-50 园林羽毛球场地面/设施巡查",
    "system": "园林",
    "property": "可选",
    "unit": "个",
    "quantityParameterKey": "grounds.badmintonCourtCount",
    "templateQuantity": 1.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每日1次",
      "B": "每日1次",
      "C": "每日1次",
      "D": "每日1次"
    },
    "annualFrequency": {
      "A": 365.0,
      "B": 365.0,
      "C": 365.0,
      "D": 365.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-187",
    "source": "工程常规:187",
    "action": "A-SS-54 园林羽毛球场设施检测",
    "system": "园林",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "grounds.badmintonCourtCount",
    "templateQuantity": 1.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-188",
    "source": "工程常规:188",
    "action": "A-SS-55 园林羽毛球场设施保养",
    "system": "园林",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "grounds.badmintonCourtCount",
    "templateQuantity": 1.0,
    "unitHours": {
      "A": 0.66,
      "B": 0.6050000000000001,
      "C": 0.5775000000000001,
      "D": 0.55
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-189",
    "source": "工程常规:189",
    "action": "B-SS-50 园林篮球场地面/设施巡查",
    "system": "园林",
    "property": "可选",
    "unit": "个",
    "quantityParameterKey": "grounds.basketballCourtCount",
    "templateQuantity": 1.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每日1次",
      "B": "每日1次",
      "C": "每日1次",
      "D": "每日1次"
    },
    "annualFrequency": {
      "A": 365.0,
      "B": 365.0,
      "C": 365.0,
      "D": 365.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-190",
    "source": "工程常规:190",
    "action": "A-SS-54 园林篮球场设施检测",
    "system": "园林",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "grounds.basketballCourtCount",
    "templateQuantity": 1.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-191",
    "source": "工程常规:191",
    "action": "A-SS-55 园林篮球场设施保养",
    "system": "园林",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "grounds.basketballCourtCount",
    "templateQuantity": 1.0,
    "unitHours": {
      "A": 1.32,
      "B": 1.2100000000000002,
      "C": 1.1550000000000002,
      "D": 1.1
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-192",
    "source": "工程常规:192",
    "action": "B-SS-50 园林网球场地面/设施巡查",
    "system": "园林",
    "property": "可选",
    "unit": "个",
    "quantityParameterKey": "grounds.tennisCourtCount",
    "templateQuantity": 0.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每日1次",
      "B": "每日1次",
      "C": "每日1次",
      "D": "每日1次"
    },
    "annualFrequency": {
      "A": 365.0,
      "B": 365.0,
      "C": 365.0,
      "D": 365.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-193",
    "source": "工程常规:193",
    "action": "A-SS-54 园林网球场设施检测",
    "system": "园林",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "grounds.tennisCourtCount",
    "templateQuantity": 0.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-194",
    "source": "工程常规:194",
    "action": "A-SS-55 园林网球场设施保养",
    "system": "园林",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "grounds.tennisCourtCount",
    "templateQuantity": 0.0,
    "unitHours": {
      "A": 1.32,
      "B": 1.2100000000000002,
      "C": 1.1550000000000002,
      "D": 1.1
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-195",
    "source": "工程常规:195",
    "action": "B-SS-50 园林足球场地面/设施巡查",
    "system": "园林",
    "property": "可选",
    "unit": "个",
    "quantityParameterKey": "grounds.footballFieldCount",
    "templateQuantity": 0.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每日1次",
      "B": "每日1次",
      "C": "每日1次",
      "D": "每日1次"
    },
    "annualFrequency": {
      "A": 365.0,
      "B": 365.0,
      "C": 365.0,
      "D": 365.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-196",
    "source": "工程常规:196",
    "action": "A-SS-54 园林足球场设施检测",
    "system": "园林",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "grounds.footballFieldCount",
    "templateQuantity": 0.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-197",
    "source": "工程常规:197",
    "action": "A-SS-55 园林足球场设施保养",
    "system": "园林",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "grounds.footballFieldCount",
    "templateQuantity": 0.0,
    "unitHours": {
      "A": 2.64,
      "B": 2.4200000000000004,
      "C": 2.3100000000000005,
      "D": 2.2
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-198",
    "source": "工程常规:198",
    "action": "B-SS-50 园林机动车停车场地面/设施巡查",
    "system": "园林",
    "property": "可选",
    "unit": "平方米",
    "quantityParameterKey": "grounds.vehicleParkingArea",
    "templateQuantity": 357.5,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-199",
    "source": "工程常规:199",
    "action": "A-SS-54 园林机动车停车场设施检测",
    "system": "园林",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "grounds.vehicleParkingArea",
    "templateQuantity": 357.5,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-200",
    "source": "工程常规:200",
    "action": "A-SS-55 园林机动车停车场设施保养",
    "system": "园林",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "grounds.vehicleParkingArea",
    "templateQuantity": 357.5,
    "unitHours": {
      "A": 0.026400000000000003,
      "B": 0.024200000000000003,
      "C": 0.023100000000000002,
      "D": 0.022000000000000002
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-201",
    "source": "工程常规:201",
    "action": "B-SS-50 园林廊架平台巡查",
    "system": "园林",
    "property": "可选",
    "unit": "平方米",
    "quantityParameterKey": "grounds.pergolaPlatformArea",
    "templateQuantity": 106.56,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-202",
    "source": "工程常规:202",
    "action": "A-SS-50 园林设施设备安防设施/背景音箱巡查",
    "system": "智能化系统",
    "property": "基础",
    "unit": "米",
    "quantityParameterKey": "grounds.securityAudioLineLength",
    "templateQuantity": 696.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-203",
    "source": "工程常规:203",
    "action": "B-SS-50 园林设施设备艺术雕塑巡查",
    "system": "园林",
    "property": "可选",
    "unit": "个",
    "quantityParameterKey": "grounds.landscapeArtworkCount",
    "templateQuantity": 1.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-204",
    "source": "工程常规:204",
    "action": "B-SS-50 园林设施设备照明设施巡查",
    "system": "供配电系统",
    "property": "可选",
    "unit": "平方米",
    "quantityParameterKey": "grounds.zoneArea",
    "templateQuantity": 9820.01,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-205",
    "source": "工程常规:205",
    "action": "A-SS-54 园林设施设备照明设施检测",
    "system": "供配电系统",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "grounds.zoneArea",
    "templateQuantity": 9820.01,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-206",
    "source": "工程常规:206",
    "action": "A-SS-55 园林设施设备照明设施保养",
    "system": "供配电系统",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "grounds.zoneArea",
    "templateQuantity": 9820.01,
    "unitHours": {
      "A": 0.00198,
      "B": 0.0018150000000000004,
      "C": 0.0017325,
      "D": 0.0016500000000000002
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-207",
    "source": "工程常规:207",
    "action": "B-SS-50 园林设施设备取水栓/排水口巡查",
    "system": "给排水系统",
    "property": "可选",
    "unit": "个",
    "quantityParameterKey": "grounds.waterOutletCount",
    "templateQuantity": 4.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-208",
    "source": "工程常规:208",
    "action": "B-SS-50 园林设施设备垃圾收集点巡查",
    "system": "园林",
    "property": "可选",
    "unit": "个",
    "quantityParameterKey": "grounds.wasteCollectionPointCount",
    "templateQuantity": 1.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-209",
    "source": "工程常规:209",
    "action": "B-SS-50 园林设施设备非机动车棚巡查",
    "system": "园林",
    "property": "可选",
    "unit": "个",
    "quantityParameterKey": "grounds.landscapeBicycleShelterCount",
    "templateQuantity": 1.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-210",
    "source": "工程常规:210",
    "action": "A-SS-54 园林设施设备非机动车棚检测",
    "system": "园林",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "grounds.landscapeBicycleShelterCount",
    "templateQuantity": 1.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-211",
    "source": "工程常规:211",
    "action": "A-SS-55 园林设施设备非机动车棚保养",
    "system": "园林",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "grounds.landscapeBicycleShelterCount",
    "templateQuantity": 1.0,
    "unitHours": {
      "A": 1.32,
      "B": 1.2100000000000002,
      "C": 1.1550000000000002,
      "D": 1.1
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-212",
    "source": "工程常规:212",
    "action": "B-SS-50 园林设施设备标识标牌宣传栏巡查",
    "system": "园林",
    "property": "可选",
    "unit": "个",
    "quantityParameterKey": "grounds.signageCount",
    "templateQuantity": 2.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-213",
    "source": "工程常规:213",
    "action": "A-SS-54 园林设施设备标识标牌宣传栏检测",
    "system": "园林",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "grounds.signageCount",
    "templateQuantity": 2.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每年2次",
      "B": "每年2次",
      "C": "每年2次",
      "D": "每年2次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-214",
    "source": "工程常规:214",
    "action": "A-SS-55 园林设施设备标识标牌宣传栏保养",
    "system": "园林",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "grounds.signageCount",
    "templateQuantity": 2.0,
    "unitHours": {
      "A": 0.264,
      "B": 0.24200000000000005,
      "C": 0.23100000000000004,
      "D": 0.22000000000000003
    },
    "frequency": {
      "A": "每年2次",
      "B": "每年2次",
      "C": "每年2次",
      "D": "每年2次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-215",
    "source": "工程常规:215",
    "action": "B-SS-50 园林道路地面及附属巡查",
    "system": "园林",
    "property": "可选",
    "unit": "平方米",
    "quantityParameterKey": "grounds.roadArea",
    "templateQuantity": 8576.73,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-216",
    "source": "工程常规:216",
    "action": "B-SS-50 园林道路设备设施巡查",
    "system": "园林",
    "property": "可选",
    "unit": "平方米",
    "quantityParameterKey": "grounds.roadArea",
    "templateQuantity": 8576.73,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-217",
    "source": "工程常规:217",
    "action": "A-SS-54 园林道路设备设施/围墙设备设施检测",
    "system": "园林",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "grounds.roadArea",
    "templateQuantity": 8576.73,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-218",
    "source": "工程常规:218",
    "action": "A-SS-55 园林道路设备设施/围墙设备设施保养",
    "system": "园林",
    "property": "基础",
    "unit": "平方米",
    "quantityParameterKey": "grounds.roadArea",
    "templateQuantity": 8576.73,
    "unitHours": {
      "A": 0.00264,
      "B": 0.0024200000000000003,
      "C": 0.0023100000000000004,
      "D": 0.0022
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-219",
    "source": "工程常规:219",
    "action": "B-SS-50 园林围墙/设备设施巡查",
    "system": "园林",
    "property": "可选",
    "unit": "米",
    "quantityParameterKey": "grounds.wallLength",
    "templateQuantity": 696.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-220",
    "source": "工程常规:220",
    "action": "B-SS-50 园林设备管网隔油池/化粪池/污水池/雨水调蓄池巡查",
    "system": "给排水系统",
    "property": "可选",
    "unit": "个",
    "quantityParameterKey": "grounds.tankCount",
    "templateQuantity": 3.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-221",
    "source": "工程常规:221",
    "action": "A-SS-54 园林设备管网隔油池/化粪池/污水池/雨水调蓄池检测",
    "system": "给排水系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "grounds.tankCount",
    "templateQuantity": 3.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-222",
    "source": "工程常规:222",
    "action": "A-SS-55 园林设备管网隔油池/化粪池/污水池/雨水调蓄池保养",
    "system": "给排水系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "grounds.tankCount",
    "templateQuantity": 3.0,
    "unitHours": {
      "A": 1.32,
      "B": 1.2100000000000002,
      "C": 1.1550000000000002,
      "D": 1.1
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-223",
    "source": "工程常规:223",
    "action": "B-SS-50 园林设备管网污水主管/废水主管/雨水主管巡查",
    "system": "给排水系统",
    "property": "可选",
    "unit": "米",
    "quantityParameterKey": "grounds.drainagePipelineLength",
    "templateQuantity": 5649.3,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-224",
    "source": "工程常规:224",
    "action": "A-SS-54 园林设备管网污水主管/废水主管/雨水主管检测",
    "system": "给排水系统",
    "property": "基础",
    "unit": "米",
    "quantityParameterKey": "grounds.drainagePipelineLength",
    "templateQuantity": 5649.3,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-225",
    "source": "工程常规:225",
    "action": "A-SS-55 园林设备管网污水主管/废水主管/雨水主管保养",
    "system": "给排水系统",
    "property": "基础",
    "unit": "米",
    "quantityParameterKey": "grounds.drainagePipelineLength",
    "templateQuantity": 5649.3,
    "unitHours": {
      "A": 0.006600000000000001,
      "B": 0.006050000000000001,
      "C": 0.005775000000000001,
      "D": 0.0055000000000000005
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-226",
    "source": "工程常规:226",
    "action": "B-SS-50 园林设备管网雨水井/污水井/废水井巡查",
    "system": "给排水系统",
    "property": "可选",
    "unit": "个",
    "quantityParameterKey": "grounds.drainageWellCount",
    "templateQuantity": 329.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-227",
    "source": "工程常规:227",
    "action": "A-SS-54 园林设备管网雨水井/污水井/废水井检测",
    "system": "给排水系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "grounds.drainageWellCount",
    "templateQuantity": 329.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-228",
    "source": "工程常规:228",
    "action": "A-SS-55 园林设备管网雨水井/污水井/废水井保养",
    "system": "给排水系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "grounds.drainageWellCount",
    "templateQuantity": 329.0,
    "unitHours": {
      "A": 0.066,
      "B": 0.06050000000000001,
      "C": 0.05775000000000001,
      "D": 0.05500000000000001
    },
    "frequency": {
      "A": "每季度1次",
      "B": "每季度1次",
      "C": "每季度1次",
      "D": "每季度1次"
    },
    "annualFrequency": {
      "A": 4.0,
      "B": 4.0,
      "C": 4.0,
      "D": 4.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-229",
    "source": "工程常规:229",
    "action": "B-SS-50 园林设备管网消防取水口/水泵接合器/室外消火栓巡查",
    "system": "消防系统",
    "property": "可选",
    "unit": "个",
    "quantityParameterKey": "grounds.fireWaterPointCount",
    "templateQuantity": 4.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-230",
    "source": "工程常规:230",
    "action": "B-SS-50 园林设备管网园林配电箱巡查",
    "system": "供配电系统",
    "property": "可选",
    "unit": "个",
    "quantityParameterKey": "grounds.distributionBoxCount",
    "templateQuantity": 3.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-231",
    "source": "工程常规:231",
    "action": "A-SS-54 园林设备管网园林配电箱检测",
    "system": "供配电系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "grounds.distributionBoxCount",
    "templateQuantity": 3.0,
    "unitHours": {
      "A": 0.000264,
      "B": 0.00024200000000000005,
      "C": 0.00023100000000000003,
      "D": 0.00022000000000000003
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  },
  {
    "id": "engineering-routine-232",
    "source": "工程常规:232",
    "action": "A-SS-55 园林设备管网园林配电箱保养",
    "system": "供配电系统",
    "property": "基础",
    "unit": "个",
    "quantityParameterKey": "grounds.distributionBoxCount",
    "templateQuantity": 3.0,
    "unitHours": {
      "A": 0.66,
      "B": 0.6050000000000001,
      "C": 0.5775000000000001,
      "D": 0.55
    },
    "frequency": {
      "A": "每月1次",
      "B": "每月1次",
      "C": "每月1次",
      "D": "每月1次"
    },
    "annualFrequency": {
      "A": 12.0,
      "B": 12.0,
      "C": 12.0,
      "D": 12.0
    },
    "monthlyRate": 6666.66666666667
  }
]);
