import { createModelRules, MODEL_DEFAULTS, INPUT_DEFINITIONS, GUANGDONG_LOCATIONS } from './workbook-data.mjs';
import { SERVICE_RULES } from './rules/service-rules.mjs';
import { CLEANING_RULES } from './rules/cleaning-rules.mjs';
import { GREENING_RULES } from './rules/greening-rules.mjs';
import { ENGINEERING_OUTSOURCED_RULES } from './rules/engineering-outsourced-rules.mjs';
import { ENGINEERING_ROUTINE_RULES } from './rules/engineering-routine-rules.mjs';
import { PEST_CONTROL_RULES } from './rules/pest-control-rules.mjs';
import { GRADE_LABELS } from './rules/constants.mjs';
import { ADVANCED_PARAMETER_VERSION, resolveAdvancedParameters } from './advanced-parameters.mjs';

export { GUANGDONG_LOCATIONS };
export const WORKBOOK_MODEL_VERSION = 'workbook-v3';
const definitions = new Map(INPUT_DEFINITIONS.map((definition) => [definition.key, definition]));
const has = (object, key) => Object.hasOwn(object, key);
const n = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  const result = Number(value);
  if (!Number.isFinite(result)) throw new Error(`计算输入不是有限数值：${String(value)}`);
  return result;
};
// Excel distinguishes literal zero from an empty string, while an empty cell compares to either.
const eq = (a, b) => a == null || b == null
  ? (a == null ? b == null || b === '' || b === 0 : a === '' || a === 0)
  : typeof a === typeof b ? a === b : false;
const sum = (items) => items.flat(Infinity).reduce((total, item) => total + (typeof item === 'number' ? item : 0), 0);
const roundup = (value, digits = 0) => {
  const scale = 10 ** n(digits); const scaled = n(value) * scale;
  const nearest = Math.round(scaled);
  return Math.sign(scaled) * Math.ceil(Math.abs(scaled - nearest) < 1e-12 * Math.max(1, Math.abs(scaled)) ? Math.abs(nearest) : Math.abs(scaled)) / scale;
};
const text = (value) => value == null ? '' : String(value);

export function validateWorkbookOverrides(project) {
  if (!project || typeof project !== 'object' || Array.isArray(project)) return '项目数据无效';
  if (!GRADE_LABELS[project.serviceGrade]) return '服务等级必须为 A、B、C 或 D';
  if (project.calculationModel !== undefined && project.calculationModel !== WORKBOOK_MODEL_VERSION) return '测算模型无效';
  const overrides = project.workbookOverrides ?? {};
  if (project.workbookOverrides === null || typeof overrides !== 'object' || Array.isArray(overrides)) return '模型参数覆盖必须为对象';
  for (const [key, value] of Object.entries(overrides)) {
    const definition = definitions.get(key);
    if (!definition) return `模型参数不允许修改：${key}`;
    if (definition.type === 'select') {
      if (!definition.options.includes(value)) return `${definition.label}选项无效`;
    } else if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || (definition.exclusiveMin && value === 0)) {
      return `${definition.label}必须为${definition.exclusiveMin ? '大于零的' : '非负'}有限数值`;
    } else if (definition.max !== undefined && value > definition.max) return `${definition.label}不能超过${definition.max}`;
  }
  const region = String(project.region ?? '').replace(/省$/, '');
  const city = String(project.city ?? '').replace(/市$/, '') + '市';
  if (region !== '广东') return '当前原模型价格库仅支持广东已收录区域';
  const choices = GUANGDONG_LOCATIONS.filter((item) => item.city === city);
  if (!choices.length) return `原模型未收录${city}价格，不能自动套用其他城市`;
  if (!project.district || typeof project.district !== 'string') return '请选择原模型价格库中的区县';
  if (project.district && !choices.some((item) => item.district === project.district)) return `原模型未收录${city}${project.district}价格`;
}

function createContext(project) {
  const error = validateWorkbookOverrides(project);
  if (error) throw new Error(error);
  const overrides = project.workbookOverrides ?? {};
  const injected = Object.create(null);
  const set = (sheet, address, value) => { injected[`${sheet}!${address}`] = value; };
  const s = (address, value) => set('总-汇总表', address, value);
  const city = String(project.city).replace(/市$/, '') + '市';
  const location = GUANGDONG_LOCATIONS.find((item) => item.city === city && (!project.district || item.district === project.district));
  s('B3', '广东'); s('C3', city); s('D3', location.district); s('B6', GRADE_LABELS[project.serviceGrade]);
  ['totalBuildingArea','residentialChargeArea','deliveredHouseholds','receivedHouseholds','occupiedHouseholds'].forEach((key,index) => s(`${'GHIJK'[index]}19`,n(project[key])));
  ['perimeterEntrances','gatehouses','pavedRoadArea','greenArea','lawnRatio','seasonalFlowerArea','winterProtectionArea'].forEach((key,index) => s(`${'GHIJKLM'[index]}24`,n(project[key])));
  for (let index=0;index<5;index+=1) {
    const building = project.buildings?.[index] ?? {};
    ['buildingCount','lobbyElevatorCount','stiltFloorArea','totalFloors','standardLobbyArea','evacuationStairArea','rooftopArea'].forEach((key,column) => s(`${'HIJKLMN'[column]}${29+index}`,n(building[key])));
  }
  s('G37',n(project.garageFloorArea)); s('H37',n(project.garageFloors));
  for (let row=12;row<=45;row+=1) s(`C${row}`,null);
  s('C12','否');

  // Preserve compatibility with explicit legacy quantity overrides; do not apply its
  // inferred scaling defaults to the source model's original independent quantities.
  const advancedParameters = resolveAdvancedParameters(project);
  for (const rule of [...ENGINEERING_OUTSOURCED_RULES,...ENGINEERING_ROUTINE_RULES,...PEST_CONTROL_RULES]) {
    if (!has(project.advancedParameterOverrides ?? {},rule.quantityParameterKey)) continue;
    const [sheet,row] = rule.source.split(':');
    const parameter = advancedParameters.find((item) => item.key === rule.quantityParameterKey);
    set(sheet,sheet==='四害消杀'?'C5':`D${row}`,parameter.value);
  }
  const cache = new Map(); const evaluating = new Set();
  let rules;
  const r = (key) => {
    if (has(overrides,key)) return overrides[key];
    if (has(injected,key)) return injected[key];
    if (cache.has(key)) return cache.get(key);
    if (evaluating.has(key)) throw new Error(`模型存在循环引用：${key}`);
    evaluating.add(key);
    let value;
    try {
      if (has(rules,key)) value = rules[key]();
      else if (has(MODEL_DEFAULTS,key)) value = MODEL_DEFAULTS[key];
      else throw new Error(`模型引用未定义：${key}`);
      if (typeof value === 'number' && !Number.isFinite(value)) throw new Error(`模型计算结果无效：${key}，请检查配置标准和单价`);
      cache.set(key,value);
      return value;
    } finally { evaluating.delete(key); }
  };
  const price = (category) => location[`${category}Monthly`][project.serviceGrade]/26;
  rules = createModelRules({r,n,eq,sum,roundup,price});
  // Audited input-link repairs: all defaults are numerically unchanged.
  rules['客助!P13'] = () => n(r('客助!P11')) * n(r('客助!P12')) * 12;
  // Each staffing standard is independent. The original shared C43 reference is not exposed.
  for (let row=4;row<=10;row+=1) {
    const standardColumn = {A:'F',B:'H',C:'J',D:'L'}[project.serviceGrade];
    rules[`客助!N${row}`] = () => n(r(`客助!${standardColumn}${row}`));
  }
  for (let row=5;row<=52;row+=1) {
    rules[`清洁!I${row}`] = () => n(r(`清洁!F${row}`))*.1;
    rules[`清洁!K${row}`] = () => has(overrides,`清洁!G${row}`)
      ? n(r(`清洁!G${row}`))+n(r(`清洁!I${row}`))
      : n(r(`清洁!F${row}`))*.9+n(r(`清洁!I${row}`));
  }
  for (let row=5;row<=55;row+=1) {
    rules[`绿化!G${row}`] = () => n(r(`绿化!D${row}`))*60*.1;
    rules[`绿化!I${row}`] = () => has(overrides,`绿化!E${row}`)
      ? n(r(`绿化!E${row}`))+n(r(`绿化!G${row}`))
      : n(r(`绿化!D${row}`))*60*.9+n(r(`绿化!G${row}`));
  }
  // Routine salaries previously had 228 copied values disconnected from the common rate.
  // A common salary edit must affect cost, while staffing continues to follow workload.
  for (let row=5;row<=232;row+=1) {
    rules[`工程常规!P${row}`] = () => n(r('工程常规!P3'));
  }
  const warnings = [
    '沿用原模型365天预算、26天折算日薪及管理/客助1.06预算系数；未叠加城市成本档位。',
    '替班岗按原公式5.2人配1人；向日葵原说明写7，与公式不一致，本次保留5.2。',
    '已修复原模型中客助工资硬编码、常规工程工资复制值、清洁/绿化在途工时不参与总工时，以及中控岗与巡逻岗共用输入的问题；默认结果保持原口径。',
    '消杀为折算兼职人数，原表不计入配置总人数；费用仍计入总预算。四害消杀7个动作共用原模型一组工作量，动作明细均分展示；服务发生系数按原公式，原文字说明不一致时以公式为准。',
  ];
  return {r,advancedParameters,warnings,location};
}

function snapshot(project, context) {
  return INPUT_DEFINITIONS.map((definition) => {
    const raw = context.r(definition.key);
    let defaultRaw = raw;
    if (has(project.workbookOverrides ?? {},definition.key)) {
      const remaining = {...project.workbookOverrides}; delete remaining[definition.key];
      defaultRaw = createContext({...project,workbookOverrides:remaining}).r(definition.key);
    }
    return {...definition,value:definition.type==='select'?(raw || '否'):n(raw),defaultValue:definition.type==='select'?(defaultRaw || '否'):n(defaultRaw),source:has(project.workbookOverrides ?? {},definition.key)?'manual':'model'};
  });
}

export function getWorkbookInputs(project) {
  const context = createContext(project);
  return snapshot(project,context);
}

export function calculateWorkbookProject(project) {
  const context = createContext(project); const {r,warnings,advancedParameters} = context;
  const num = (sheet,address) => n(r(`${sheet}!${address}`));
  const str = (sheet,address) => text(r(`${sheet}!${address}`));
  const actions = [];
  const push = (action) => actions.push({...action,source:'baseline',enabled:true});
  for (const rule of SERVICE_RULES) {
    const row = Number(rule.id.split('-').at(-1)); const annualFrequency = num('服务',`P${row}`);
    push({id:rule.id,category:'service',action:rule.action,property:rule.property,basis:rule.basis,frequency:has(project.workbookOverrides ?? {},`服务!P${row}`)?`${annualFrequency}次/年`:str('服务',`M${row}`),annualFrequency,unitHours:num('服务',`G${row}`),hoursPerFrequency:num('服务',`G${row}`),annualHours:num('服务',`Q${row}`),headcount:num('服务',`T${row}`),annualCost:num('服务',`S${row}`)});
  }
  for (const [catalog,category,sheet,quantityCol,hoursCol,frequencyCol,displayCol,totalCol,costCol] of [
    [CLEANING_RULES,'cleaning','清洁','E','K','X','V','Y','AA'],
    [GREENING_RULES,'greening','绿化','C','I','U','S','V','Y'],
    [ENGINEERING_OUTSOURCED_RULES,'engineeringOutsourced','工程委外','D','I','N','K','O','S'],
    [ENGINEERING_ROUTINE_RULES,'engineeringRoutine','工程常规','D','I','N','K','O','R'],
  ]) {
    for (const rule of catalog) {
      const row = Number(rule.id.split('-').at(-1)); const quantity = num(sheet,`${quantityCol}${row}`);
      const unitHours = num(sheet,`${hoursCol}${row}`)/(category==='greening'?60:1);
      const annualFrequency = num(sheet,`${frequencyCol}${row}`); const annualHours = num(sheet,`${totalCol}${row}`);
      const frequencyEdited = has(project.workbookOverrides ?? {},`${sheet}!${frequencyCol}${row}`) || (category.startsWith('engineering') && ['L','M'].some((col) => has(project.workbookOverrides ?? {},`${sheet}!${col}${row}`)));
      push({id:rule.id,category,action:rule.action,property:rule.property,unit:rule.unit,quantity,...(rule.basis?{basis:rule.basis}:{}),frequency:frequencyEdited?`${annualFrequency}次/年`:str(sheet,`${displayCol}${row}`),annualFrequency,unitHours,hoursPerFrequency:quantity*unitHours,annualHours,annualCost:category==='cleaning'?annualHours*num(sheet,`${costCol}${row}`):num(sheet,`${costCol}${row}`)});
    }
  }
  const assistanceNames = ['大门车行岗','大门人行岗','其他固定岗','中控岗','巡逻岗','替班岗','班长'];
  for (let row=4;row<=10;row+=1) {
    const headcount=num('客助',`P${row}`); const standard=num('客助',`N${row}`);
    push({id:`assistance-${row}`,category:'assistance',action:assistanceNames[row-4],property:row===4?'基础':row===7||row===9?'固定':'可选',unit:row===8?'m2':'个',quantity:num('客助',`C${row}`),frequency:row>=8?`${standard}${row===8?'平方米/人':row===9?'人/替班':'人/班长'}`:`${standard}人/岗`,headcount,annualCost:headcount*num('客助','P12')*12*1.06});
  }
  for (const rule of PEST_CONTROL_RULES) {
    const quantity=num('四害消杀','C5'); const unitHours=num('四害消杀','H5')/7;
    push({id:rule.id,category:'pestControl',action:rule.action,property:rule.property,unit:rule.unit,quantity,frequency:has(project.workbookOverrides ?? {},'四害消杀!K5')?`${num('四害消杀','K5')}次/年`:str('四害消杀','J5'),annualFrequency:num('四害消杀','K5'),unitHours,hoursPerFrequency:quantity*unitHours,annualHours:num('四害消杀','L5')/7,annualCost:num('四害消杀','N5')/7,sourceSharedUnitHours:num('四害消杀','H5'),sharedWorkloadGroup:'pest-control',allocationRatio:1/7});
  }
  const configs = [
    ['service','服务','T26','T27','T22',1],['cleaning','清洁','AB58','AA60','AB56',1],['greening','绿化','Z59','Z61','Z58',1],['assistance','客助','P11','P13','P11',1.06],['pestControl','四害消杀','O14','O18','O14',1],['engineeringOutsourced','工程委外','T104','T106','T103',1],['engineeringRoutine','工程常规','S237','S239','S236',1],
  ];
  const categories = configs.map(([category,title,head,cost,equivalent,factor]) => {
    const items=actions.filter((item)=>item.category===category);
    return {category,title,actionCount:items.length,headcount:num(title,head),annualCost:num(title,cost)*factor,workloadAnnualCost:sum(items.map((item)=>item.annualCost)),workloadEquivalentHeadcount:num(title,equivalent),annualHours:sum(items.map((item)=>item.annualHours)),...(category==='pestControl'?{annualWorkdays:sum(items.map((item)=>item.annualHours))/8}:{})};
  });
  actions.sort((a,b)=>configs.findIndex((item)=>item[0]===a.category)-configs.findIndex((item)=>item[0]===b.category));
  const management={category:'management',title:'管理人员',roles:['项目经理','管家主任','工程主任','客助主任'].map((title,index)=>({title,monthlyRate:num('管理模块',`B${index+4}`),headcount:num('管理模块',`E${index+4}`)})),headcount:num('管理模块','E8'),annualCost:num('管理模块','G8')*1.06};
  for (const item of [...actions,...categories,management]) {
    for (const key of ['annualCost','annualHours','headcount','quantity']) {
      if (item[key]!==undefined && (!Number.isFinite(item[key]) || item[key]<0)) throw new Error(`计算结果异常：${item.id ?? item.title}.${key}`);
    }
  }
  const annualCost=sum(categories.map((item)=>item.annualCost))+management.annualCost;
  const sourceTotal=num('总-汇总表','B7');
  if (Math.abs(annualCost-sourceTotal)>1e-6*Math.max(1,annualCost)) throw new Error('成本汇总与模型总额不一致');
  const area=n(project.residentialChargeArea);
  if (!area) warnings.push('住宅收费面积为0，物业费单价暂不计算。');
  return {version:2,calculationModel:WORKBOOK_MODEL_VERSION,calculatedAt:new Date().toISOString(),project,advancedParameterVersion:ADVANCED_PARAMETER_VERSION,advancedParameters,warnings,standardActionCount:actions.length,activeActionCount:actions.length,totalActionCount:actions.length,totalHeadcount:sum(categories.filter((item)=>item.category!=='pestControl').map((item)=>item.headcount))+management.headcount,annualCost,workloadAnnualCost:sum(categories.map((item)=>item.workloadAnnualCost)),unitPrice:area?annualCost/area/12:0,management,categories,actions};
}
