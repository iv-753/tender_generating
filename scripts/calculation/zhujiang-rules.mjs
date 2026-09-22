import source from './zhujiang-source.json' with { type: 'json' };
import grades from '../../src/data/zhujiang-grades.json' with { type: 'json' };
import { ENGINEERING_ROUTINE_RULES } from './rules/engineering-routine-rules.mjs';

export const ZHUJIANG_VERSION = 'zhujiang-v1';
export const ZHUJIANG_GRADES = grades;
export const STANDARD_SOURCE = { file: source.file, sha256: source.sha256, version: '分级标准（待完善）· 首版', rangePolicy: '区间中值，人数向上取整' };
export const gradeValue = (values, grade) => values['ABCD'.indexOf(grade)];
export function sourceCell(sheet, row, grade) {
  const column = sheet === '社区文化' ? grades[grade].communityColumn : grades[grade].column;
  const requested = `${sheet}!${column}${row}`;
  const cell = source.aliases[requested] ?? requested;
  return { sourceRef: cell, sourceText: source.cells[cell] ?? '', sourceFile: source.file };
}

// Values are ordered 御享、雅享、悦享、善享. Rates are annualized with
// 365 days / 52 weeks / 12 months; these conversion conventions are disclosed.
const rules = [];
const add = (ids, sheet, row, values, label, note = '') => {
  for (const id of ids) rules.push({ id, sheet, row, values, label, note });
};
add(['cleaning-5','cleaning-13'], '环境管理', 26, [1460,1095,730,730], '室外地面循环保洁');
add(['cleaning-6','cleaning-14'], '环境管理', 26, [365,365,365,365], '室外地面清扫');
add(['cleaning-16'], '环境管理', 26, [104,52,12,6], '低位公共灯具及设备箱清洁', '高灯另有频次，不能将本规则套用于高灯。');
add(['cleaning-25'], '环境管理', 17, [1095,730,365,182.5], '大堂及一层候梯厅循环保洁');
add(['cleaning-26'], '环境管理', 17, [365,365,365,365], '大堂及一层候梯厅地面清扫');
add(['cleaning-27'], '环境管理', 43, [2,2,1,.5], '大堂大理石晶面养护', '按大理石口径；花岗石、立面护理及翻新不能共用此频次。');
// The draft is NOT monotonic here: 御服务 monthly, 雅/悦服务 twice monthly.
add(['cleaning-30'], '环境管理', 17, [12,24,24,12], '大堂及候梯厅墙面擦拭', '原稿御享每月一次、雅享每半月一次，保留原文差异，待珠江核实。');
add(['cleaning-32','cleaning-38'], '环境管理', 19, [730,730,365,182.5], '楼道及楼梯循环保洁');
add(['cleaning-33','cleaning-39'], '环境管理', 19, [365,365,365,182.5], '楼道及楼梯地面清扫');
add(['cleaning-34','cleaning-40'], '环境管理', 19, [365,104,52,52], '楼道及楼梯地面清拖', '沿用原模型对应清洁工时作为参考，可按项目修正。');
add(['cleaning-44'], '环境管理', 24, [156,104,52,24], '天台及屋面巡查清杂');
add(['greening-7','greening-15','greening-27','greening-35'], '环境管理', 152, [4.5,3.5,2.5,1.5], '草坪及地被施肥', '区间取中值；御享对应同表F154，善享接C153。');
add(['greening-8','greening-28'], '环境管理', 166, [30,15,12,10], '草坪年度修剪', '年度最低次数；夏季每月下限还须由现场排班满足。善享C157:C158、悦享D156。');
add(['greening-11','greening-20','greening-31','greening-40'], '环境管理', 168, [5,4,3,2], '全年全面除草', '重点绿地追加次数另由项目填写；善享C166、悦享D167。');
add(['greening-48'], '环境管理', 166, [2,1.5,1,.5], '乔木修剪', '雅享区间取中值，善享每两年一次；对应E156、D156、C157。');
add(['greening-49'], '环境管理', 166, [3,2,2,1], '灌木修剪', '对应F166、E156:E166、D156、C157。');
// Public notification is a separate action: never replace statutory/property
// service reports with noticeboard updates just because both mention 公示.
add(['service-16'], '社区文化', 96, [6,5,5,5], '节日环境布置', '按原文列举节日折为年度次数。');

// Only map like-for-like engineering inspections. Maintenance, tests and
// statutory specialist services keep their original reference parameters.
for (const action of ENGINEERING_ROUTINE_RULES) {
  if (!action.action.endsWith('巡查')) continue;
  const name = action.action;
  if (/消防|防火|强电|变配电|供配电|配电|给水|供水|污水|雨水|废水|化粪|水箱|水泵|电梯|弱电|安防|监控|机房|泵房|电房|风机|报警|充电|门禁|闸机|电井|水井|照明|排水|排污|取水|设备设施|设施设备|设施\/设备/.test(name)) continue;
  add([action.id], '工程管理', 23, [730,365,52,24], '共用部位及配套设施巡检', '重点部位、设备机房及专用设备应按各自更具体条款，不能套用普通巡检。');
}

// Elevator daily inspection is separate from the external maintenance contract.
for (const action of ENGINEERING_ROUTINE_RULES.filter(a => a.id === 'engineering-routine-104')) {
  add([action.id], '工程管理', 77, [365,365,365,365], '电梯日常巡查');
}
export const FREQUENCY_RULES = Object.freeze(rules);
export function ruleSource(rule, grade) {
  let row = rule.row;
  if (rule.sheet === '环境管理') {
    if (rule.row === 152 && grade === 'A') row = 154;
    if (rule.label === '草坪年度修剪') row = {A:166,B:166,C:156,D:158}[grade];
    if (rule.label === '全年全面除草') row = {A:168,B:168,C:167,D:166}[grade];
    if (rule.label === '乔木修剪' || rule.label === '灌木修剪') row = {A:166,B:156,C:156,D:157}[grade];
  }
  return { ...sourceCell(rule.sheet,row,grade), note: rule.note };
}

export const STAFFING_RANGES = {
  cleaning: [[4000,6000],[6000,8000],[8000,9000],[10000,10000]],
  greening: [[3000,3000],[4000,4000],[5000,5000],[6000,6000]],
  highRise: [[300,400],[350,450],[400,600],[500,700]],
  multiStorey: [[200,350],[300,400],[300,500],[400,600]],
  villa: [[100,100],[150,150],[200,200],[200,200]],
  electrician: [[30000,30000],[30000,30000],[50000,50000],[50000,50000]],
  general: [[80000,80000],[80000,80000],[100000,100000],[100000,100000]],
};
export const midpoint = (range) => (range[0]+range[1])/2;
export const EXTRA_ACTION_IDS = ['zhuj-theme-publicity','zhuj-owner-meeting','zhuj-open-day','zhuj-noticeboard'];
