const INVALID_CONTEXT = /历史|失效|作废|废止|无关数据/;
const MISSING_VALUE = /^(?:原表未提供|未提供|暂无|无|不适用|—|-)$/;
const UNIT_VALUE = /^(?:㎡|平方米|户|套|个|栋|层|%|元(?:\/㎡(?:·月)?)?)$/;
const META_LABEL = /^(?:状态|单位|备注|口径说明|版本|数据年度)$/;

const FIELD_ALIASES = {
  projectName: ['项目/楼盘名称', '项目名称', '项目案名', '楼盘名称', '案名'],
  region: ['所在行政区划', '完整行政区划', '所在区域', '项目区域', '省市区'],
  city: ['核算城市', '所在城市', '项目城市', '城市'],
  serviceGrade: ['拟采用服务档次', '拟定服务标准', '服务等级', '服务档次', '服务标准', '服务级别'],
  totalBuildingArea: ['项目总建筑规模', '规划总建面', '总建筑面积', '建筑面积合计'],
  residentialChargeArea: ['住宅管理费计费面积', '可计费住宅面积', '住宅收费面积', '住宅计费面积', '住宅管理面积'],
  deliveredHouseholds: ['已交付房源总套数', '累计交付套数', '已交付户数', '交付户数', '已交付套数'],
  receivedHouseholds: ['现行办理收楼户数', '已办理收楼户数', '已收楼户数', '收楼户数'],
  occupiedHouseholds: ['长期实际居住户数', '实际常住户', '常住户数', '入住户数', '实际居住户数'],
  perimeterEntrances: ['出入口及外围服务面积', '外围出入口服务面积', '外围及出入口面积', '出入口外围'],
  gatehouses: ['门楼/门岗数量', '门岗数量', '门楼数量', '门楼数', '门岗数'],
  pavedRoadArea: ['园区道路及硬质地面', '园路及硬质铺装', '道路铺装面积', '园路面积', '硬质铺装面积'],
  greenArea: ['园林绿地（含草坪）', '景观绿地总面积', '绿化面积', '园林面积', '绿地面积'],
  lawnRatio: ['草坪覆盖率(%)', '草地所占比例', '草坪比例', '草坪占比'],
  seasonalFlowerArea: ['季节花卉摆放面积', '时令花卉布置面积', '时花面积', '时令花卉面积', '季节花卉面积'],
  winterProtectionArea: ['冬季植物防护面积', '冬季防寒覆盖面积', '防寒面积', '冬季防护面积'],
  garageFloorArea: ['单层地下停车库建筑面积', '车库单层建筑面积', '单层车库面积', '车库单层面积'],
  garageFloors: ['地下车库层数', '地下层数', '车库层数'],
};

const BUILDING_FIELD_ALIASES = {
  buildingCount: ['楼栋数量', '栋数'],
  lobbyElevatorCount: ['大堂及电梯点位', '大堂及电梯数', '大堂/电梯点位', '大堂及电梯'],
  stiltFloorArea: ['架空层面积', '架空层'],
  totalFloors: ['合计楼层', '楼层合计', '总楼层'],
  standardLobbyArea: ['标准前厅面积', '标准前厅', '大堂面积'],
  evacuationStairArea: ['疏散楼梯面积', '疏散楼梯'],
  rooftopArea: ['屋面可达面积', '天台面积', '屋面面积', '天台'],
};

function normalized(value) {
  return String(value ?? '').toLowerCase().replace(/[\s｜|/\\()（）【】\[\]·:：、，,._-]/g, '');
}

function aliasMatch(value, aliases) {
  const source = normalized(value);
  if (!source || INVALID_CONTEXT.test(source)) return null;
  let best = null;
  for (const alias of aliases) {
    const target = normalized(alias);
    if (source === target) best = Math.max(best ?? 0, 0.99);
    else if (source.includes(target) || target.includes(source)) best = Math.max(best ?? 0, 0.9);
  }
  return best;
}

function isKnownLabel(value) {
  return [...Object.values(FIELD_ALIASES), ...Object.values(BUILDING_FIELD_ALIASES)]
    .some((aliases) => aliasMatch(value, aliases) !== null);
}

function isUsableValue(value) {
  const text = String(value ?? '').trim();
  return text && !MISSING_VALUE.test(text) && !UNIT_VALUE.test(text) && !META_LABEL.test(text) && !isKnownLabel(text);
}

function sourceColumn(address) {
  const letters = String(address).match(/^[A-Z]+/)?.[0] ?? '';
  return [...letters].reduce((sum, character) => sum * 26 + character.charCodeAt(0) - 64, 0);
}

function candidateValue(rowCells, labelIndex) {
  for (let index = labelIndex + 1; index < rowCells.length; index += 1) {
    if (isUsableValue(rowCells[index].value)) return rowCells[index];
  }
  return null;
}

function findScalarCandidates(workbook) {
  const result = Object.fromEntries(Object.keys(FIELD_ALIASES).map((field) => [field, []]));
  for (const sheet of workbook.sheets) {
    if (INVALID_CONTEXT.test(normalized(sheet.name))) continue;
    for (const row of sheet.rows) {
      const cells = [...row.cells].sort((left, right) => sourceColumn(left.address) - sourceColumn(right.address));
      cells.forEach((labelCell, labelIndex) => {
        for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
          const score = aliasMatch(labelCell.value, aliases);
          if (score === null) continue;
          const valueCell = candidateValue(cells, labelIndex);
          if (!valueCell) continue;
          result[field].push({
            sheet: sheet.name,
            cell: valueCell.address,
            labelCell: labelCell.address,
            score,
            reason: `表头“${String(labelCell.value)}”命中字段别名`,
          });
        }
      });
    }
  }
  if (result.city.length === 0 && result.region.length > 0) {
    result.city.push({ ...result.region[0], score: 0.82, reason: '城市可从完整行政区划中提取' });
  }
  for (const candidates of Object.values(result)) {
    candidates.sort((left, right) => right.score - left.score);
    const seen = new Set();
    const unique = candidates.filter((item) => {
      const key = `${item.sheet}!${item.cell}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    candidates.splice(0, candidates.length, ...unique.slice(0, 3));
  }
  return result;
}

function findHeaderFields(cells) {
  const fields = {};
  for (const cell of cells) {
    for (const [field, aliases] of Object.entries(BUILDING_FIELD_ALIASES)) {
      const score = aliasMatch(cell.value, aliases);
      if (score !== null && (!fields[field] || score > fields[field].score)) fields[field] = { cell, score };
    }
  }
  return fields;
}

function findBuildingTables(workbook) {
  const buildings = [];
  for (const sheet of workbook.sheets) {
    if (INVALID_CONTEXT.test(normalized(sheet.name))) continue;
    for (let rowIndex = 0; rowIndex < sheet.rows.length; rowIndex += 1) {
      const headerRow = sheet.rows[rowIndex];
      const headers = findHeaderFields(headerRow.cells);
      if (Object.keys(headers).length < 3) continue;
      const minimumHeaderColumn = Math.min(...Object.values(headers).map(({ cell }) => sourceColumn(cell.address)));
      for (const dataRow of sheet.rows.slice(rowIndex + 1)) {
        if (buildings.length >= 5 || dataRow.row > headerRow.row + 5) break;
        const cellByColumn = new Map(dataRow.cells.map((cell) => [sourceColumn(cell.address), cell]));
        const labelCell = [...dataRow.cells]
          .filter((cell) => sourceColumn(cell.address) < minimumHeaderColumn && isUsableValue(cell.value))
          .sort((left, right) => sourceColumn(right.address) - sourceColumn(left.address))[0];
        if (!labelCell) continue;
        const fields = {};
        for (const [field, { cell: headerCell, score }] of Object.entries(headers)) {
          const valueCell = cellByColumn.get(sourceColumn(headerCell.address));
          fields[field] = valueCell && isUsableValue(valueCell.value) ? [{
            sheet: sheet.name,
            cell: valueCell.address,
            labelCell: headerCell.address,
            score,
            reason: `楼栋表头“${String(headerCell.value)}”对应数据列`,
          }] : [];
        }
        buildings.push({ label: String(labelCell.value), sheet: sheet.name, row: dataRow.row, fields });
      }
    }
  }
  return buildings;
}

export function buildRuleCandidates(workbook) {
  const fields = findScalarCandidates(workbook);
  const buildings = findBuildingTables(workbook);
  const conflicts = Object.entries(fields).filter(([, candidates]) => candidates.length > 1).map(([field]) => field);
  return { fields, buildings, conflicts };
}
