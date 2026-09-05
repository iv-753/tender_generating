// Generated once from the audited internal workbook; production never reads it.
function deepFreeze(value) {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const nested of Object.values(value)) deepFreeze(nested);
    Object.freeze(value);
  }
  return value;
}

export const ASSISTANCE_RULES = deepFreeze([
  {
    "id": "assistance-4",
    "action": "大门配人岗",
    "property": "基础",
    "unit": "个",
    "frequency": {
      "A": "3人/岗",
      "B": "2人/岗",
      "C": "2人/岗",
      "D": "2人/岗"
    },
    "type": "multiply",
    "quantitySource": "one",
    "standards": {
      "A": 3,
      "B": 2,
      "C": 2,
      "D": 2
    }
  },
  {
    "id": "assistance-5",
    "action": "车场配人岗",
    "property": "可选",
    "unit": "个",
    "frequency": {
      "A": null,
      "B": null,
      "C": null,
      "D": null
    },
    "type": "multiply",
    "quantitySource": "one",
    "standards": {
      "A": 0,
      "B": 0,
      "C": 0,
      "D": 0
    }
  },
  {
    "id": "assistance-7",
    "action": "中控岗",
    "property": "固定",
    "unit": "个",
    "frequency": {
      "A": "2人/岗",
      "B": "2人/岗",
      "C": "2人/岗",
      "D": "2人/岗"
    },
    "type": "multiply",
    "quantitySource": "one",
    "standards": {
      "A": 2,
      "B": 2,
      "C": 2,
      "D": 2
    }
  },
  {
    "id": "assistance-8",
    "action": "巡逻岗",
    "property": "可选",
    "unit": "m2",
    "frequency": {
      "A": "建筑面积8万方配1人",
      "B": "建筑面积10万方配1人",
      "C": "建筑面积10万方配1人",
      "D": "建筑面积15万方配1人"
    },
    "type": "divide",
    "quantitySource": "totalBuildingArea",
    "standards": {
      "A": 80000,
      "B": 100000,
      "C": 100000,
      "D": 150000
    }
  },
  {
    "id": "assistance-9",
    "action": "机动岗",
    "property": "固定",
    "unit": "个",
    "frequency": {
      "A": "休息替换，每5.2人设1个",
      "B": "休息替换，每5.2人设1个",
      "C": "休息替换，每5.2人设1个",
      "D": "休息替换，每7人设1个"
    },
    "type": "divide",
    "quantitySource": "assistanceBaseRaw",
    "standards": {
      "A": 5.2,
      "B": 5.2,
      "C": 5.2,
      "D": 5.2
    }
  },
  {
    "id": "assistance-10",
    "action": "领班",
    "property": "固定",
    "unit": "个",
    "frequency": {
      "A": "每4人设1个领班",
      "B": "每4人设1个领班",
      "C": "每4人设1个领班",
      "D": "每8人设1个领班"
    },
    "type": "divide",
    "quantitySource": "assistanceWithReliefRaw",
    "standards": {
      "A": 4,
      "B": 4,
      "C": 4,
      "D": 8
    }
  }
]);
