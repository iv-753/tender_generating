import { calculateWorkbookProject, getWorkbookInputs, validateWorkbookOverrides, GUANGDONG_LOCATIONS } from './workbook-model.mjs';
import { INPUT_DEFINITIONS } from './workbook-data.mjs';
import { ADVANCED_PARAMETER_DEFINITIONS } from './rules/advanced-parameter-definitions.mjs';
import { ENGINEERING_ROUTINE_RULES } from './rules/engineering-routine-rules.mjs';
import { ENGINEERING_OUTSOURCED_RULES } from './rules/engineering-outsourced-rules.mjs';
import { ZHUJIANG_VERSION, ZHUJIANG_GRADES, STANDARD_SOURCE, STAFFING_RANGES, FREQUENCY_RULES, EXTRA_ACTION_IDS, gradeValue, midpoint, sourceCell, ruleSource } from './zhujiang-rules.mjs';
import { ACTION_POLICIES, policyFor, ZHUJIANG_TASKS, taskSource, taskFrequency } from './zhujiang-operations.mjs';

const has = (value,key) => Object.hasOwn(value,key);
const sum = (items) => items.reduce((a,b)=>a+b,0);
const originalKeys = new Set(INPUT_DEFINITIONS.map(item=>item.key));
const superseded = new Set(['客助!C4','客助!C5','客助!C6','客助!N4','客助!N5','客助!N6','客助!C7','客助!N7','客助!N10']);
const definitions = [];
const parameter = (key,label,unit,defaultFor,extra={}) => definitions.push({key:`zhuj.${key}`,label,unit,defaultFor,type:'number',min:0,group:'珠江·项目及配置',...extra});
parameter('garageIncluded','车库服务范围','',()=>1,{integer:true,max:1,note:'整体交由他方管理且本项目不承担车库服务时选“不纳入”；只外包部分作业不等于不承担服务。此项不计算车库收入，也不自动扣减物业管理面积。'});
const geometry = {
  'basement.parkingArea':p=>p.garageFloorArea*p.garageFloors,
  'building.groundFloorLobbyArea':p=>sum(p.buildings.map(b=>b.buildingCount*b.lobbyElevatorCount)),
  'building.stiltFloorArea':p=>sum(p.buildings.map(b=>b.buildingCount*b.stiltFloorArea)),
  'building.standardFloorArea':p=>sum(p.buildings.map(b=>b.totalFloors*b.standardLobbyArea)),
  'building.roofArea':p=>sum(p.buildings.map(b=>b.buildingCount*b.rooftopArea)),
  'building.buildingCount':p=>sum(p.buildings.map(b=>b.buildingCount)),
  'building.evacuationStairArea':p=>sum(p.buildings.map(b=>b.totalFloors*b.evacuationStairArea)),
  'grounds.entrancePlazaArea':p=>p.perimeterEntrances,
  'grounds.zoneArea':p=>p.greenArea,
  'grounds.roadArea':p=>p.pavedRoadArea,
};
for(const asset of ADVANCED_PARAMETER_DEFINITIONS) parameter(`asset.${asset.key}`,asset.label,asset.unit,p=>p.advancedParameterOverrides?.[asset.key]??geometry[asset.key]?.(p)??null,{group:'珠江·设备及场地',note:geometry[asset.key]?'默认由项目基础数据计算，可按实际服务范围覆盖。':'请填项目实际数量；未知留空、没有填0。旧项目模板数量不参与计算。'});
for(const [key,label] of [['service','客服'],['cleaning','保洁'],['greening','绿化'],['assistance','安保'],['engineeringRoutine','工程']]) parameter(`annualCost.${key}`,`${label}全年人均费用（含全部人工附加）`,'元/人·年',()=>null,{group:'珠江·全年人工费用',note:'可填工资、社保福利合计或同类外包年费用÷人数。填写后不再乘12或附加系数；留空使用原模型参考工资，保洁绿化按12个月预算。'});
parameter('engineeringContractAnnualCost','工程委外全年合同费用','元/年',()=>null,{group:'珠江·全年人工费用',note:'填写后替代工程委外动作估价，不重复相加；不含自有工程人员。未知留空，确认无需委外才填0。'});
for(const [i,label] of ['项目经理','管家主任','工程主任','安保主任'].entries()) parameter(`managementAnnualCost.${i}`,`${label}全年人均费用（含全部人工附加）`,'元/人·年',()=>null,{group:'珠江·全年人工费用',note:'填写后直接乘配置人数，不再增加1.06比例；人数仍在管理模块填写。留空使用原模型参考工资及比例。'});
parameter('lobbyMarbleArea','大堂实际大理石晶面养护面积','㎡',()=>null,{group:'珠江·保洁动作',sheet:'环境管理',row:43,note:'按实际材质填写，不能默认把全部大堂当成大理石；无大理石养护填0。花岗石护理须另按项目计划。'});
parameter('managementArea','物业管理面积','㎡',p=>p.totalBuildingArea,{note:'暂用总建筑面积，按实际纳入管理范围调整，不等同于住宅收费面积。'});
parameter('multiStoreyHouseholds','多层住宅户数','户',()=>0,{note:'按实际户数填写；未分类的已交付户数暂计入高层。'});
parameter('villaHouseholds','别墅户数','户',()=>0);
for(const [name,label,unit,sheet,row] of [
  ['cleaning','保洁人员管理面积','㎡/人','环境管理',4],['greening','绿化人员管理面积','㎡/人','环境管理',5],
  ['highRise','高层管家服务户数','户/人','综合管理服务',43],['multiStorey','多层管家服务户数','户/人','综合管理服务',44],['villa','别墅管家服务户数','户/人','综合管理服务',45],
  ['electrician','水电工管理面积','㎡/人','工程管理',4],['general','综合工管理面积','㎡/人','工程管理',6],
]) parameter(`${name}AreaPerPerson`,label,unit,p=>midpoint(gradeValue(STAFFING_RANGES[name],p.serviceGrade)),{min:0.000001,sheet,row,rangeName:name,group:'珠江·人员配比'});
parameter('mainEntrances','主出入口数量','个',p=>p.gatehouses>0?1:0,{integer:true,note:'按现有岗亭暂分主次入口，需要项目确认，不能用出入口清扫面积代替。'});
parameter('secondaryEntrances','次出入口数量','个',p=>Math.max(0,p.gatehouses-1),{integer:true,note:'暂按剩余岗亭数量填写，可与实际点位不同。'});
parameter('securityDailyHours','安保每人每日计岗工时','小时/人·天',()=>8,{min:0.01,max:24,note:'沿用成本模型8小时工日，用于将值守覆盖时长折算岗位；不是珠江规定班制。'});
parameter('mainDayHours','主入口白班时长','小时/天',()=>12,{max:24,sheet:'安全管理',row:29});
parameter('mainNightHours','主入口夜班时长','小时/天',()=>11.5,{max:24,sheet:'安全管理',row:29,note:'原稿20:00—07:30为11.5小时，与白班之间有半小时空档，须项目核实补齐；善享按24小时基础值守另算。'});
parameter('peakWeekdays','全年工作日高峰天数','天/年',()=>260,{max:366,note:'周一至周五按52周折算，未扣除法定假日，可按项目调整。'});
parameter('monitorPosts','消防安防合用监控中心数量','个',()=>1,{integer:true,sheet:'安全管理',row:52,note:'默认合用监控中心1处，请按项目实际调整。'});
parameter('monitorStaff','每班监控中心人员','人/班',()=>2,{integer:true,sheet:'安全管理',row:52,note:'原稿1—2人/班，中值1.5人向上取整为2；分设中心须另核，不能替代属地要求确认。'});
parameter('securityLeaders','安保班长人数','人',()=>3,{integer:true,sheet:'安全管理',row:3,note:'原稿2—3人，中值2.5人向上取整为3。'});
parameter('outdoorPatrolMinutes','园区每轮巡逻总工时','人·分钟/轮',()=>null,{sheet:'安全管理',row:44,note:'珠江只规定频次，未规定耗时；请填实际路线人时。未填不计价，明确没有此服务范围才填0。'});
parameter('indoorPatrolMinutes','楼内每层每轮巡逻工时','人·分钟/层·轮',()=>null,{sheet:'安全管理',row:46,note:'珠江只规定频次，未规定耗时；请按实际路线填写，未填写不代表零工时。'});
parameter('priorityPatrolMinutes','重点部位额外巡逻每日总工时','人·分钟/天',()=>null,{sheet:'安全管理',row:44,note:'重点部位另有每1/2/3小时巡查要求；填写常规路线尚未覆盖部分的额外日工时，避免重复计算。常规路线已全部覆盖时可明确填0。'});
parameter('paidEngineeringStaff','有偿维修专职人员','人',()=>0,{integer:true,sheet:'工程管理',row:6,note:'有偿服务另列，按开展情况配置，避免未经确认计入基础物业服务预算。'});
parameter('elevatorAdministrators','电梯专职管理员','人',()=>0,{integer:true,sheet:'工程管理',row:5,note:'原稿高层约15部/人、多层约20部/人，可外包；先核实电梯台数和是否包含在外包费中。'});
parameter('otherEngineeringStaff','高压值班及其他工程增配','人',()=>0,{integer:true,sheet:'工程管理',row:5,note:'需高压值班时原稿要求不低于2人，按实际值班安排填写。'});
parameter('securityAdditionalStaff','停车场、礼宾及其他独立安保岗位人数','人',()=>null,{integer:true,sheet:'安全管理',row:3,note:'填按班次及替休核算后的净增人员，已计主次门岗、监控、巡逻的不重复填；没有填0。'});
parameter('reserveAdditionalStaff','备勤要求产生的净增人数','人',p=>['A','B'].includes(p.serviceGrade)?null:0,{integer:true,sheet:'安全管理',row:17,note:'御享/雅享分别要求24小时备勤人数不少于保安总数30%/20%。先核实休班人员能否满足，仅填写排班后仍须增配人数，避免与5.2替班重复；已满足填0。'});
parameter('managerConcurrentRole','项目经理兼任主任','',p=>(p.workbookOverrides?.['zhuj.managementArea']??p.totalBuildingArea)<150000?null:0,{integer:true,max:3,sheet:'综合管理服务',row:33,note:'0不兼任，1管家主任，2工程主任，3安保主任；小于15万㎡须确认兼岗，兼任后对应主任减少1人，经理工资只计一次。'});
for(const [key,label,count,sheet,row] of [['accountant','共享会计',.4,'综合管理服务',47],['cashier','出纳',1,'综合管理服务',48],['warehouse','仓管',null,'综合管理服务',49],['environmentHead','环境主管',0,'环境管理',3],['deputy','项目副经理',0,'综合管理服务',34],['support','会所、泳池及食堂等支持人员',0,'综合管理服务',50]]) {
  parameter(`management.${key}.count`,`${label}净配置人数`,'人',p=>key==='warehouse'?((p.workbookOverrides?.['zhuj.managementArea']??p.totalBuildingArea)<=100000?0:count):count,{sheet,row,note:key==='accountant'?'每2—3个项目共享1人，默认按2.5个项目分摊0.4人；不是每个项目各配1人。':key==='warehouse'?'10万㎡及以下由工程主任兼任，以上按实际确认专人或共享。':'只填兼岗、共享抵扣后的净配置；可选岗位按实际经营情况设置。'});
  parameter(`management.${key}.annualCost`,`${label}全年人均费用`,'元/人·年',()=>null,{group:'珠江·全年人工费用',note:'含全部人工附加；净配置为0时无需填写，未知不按0元工资处理。'});
}
for(const task of ZHUJIANG_TASKS) {
  const meta={sheet:task.sheet,row:task.row,group:`珠江·${{service:'客服动作',cleaning:'保洁动作',greening:'绿化动作',pestControl:'分区消杀',engineeringRoutine:'工程动作',engineeringOutsourced:'委外动作'}[task.category]}`,taskKey:task.key};
  const quantityDefault=p=>task.key==='lobby-mop'?geometry['building.groundFloorLobbyArea'](p):task.key==='building-structure'?geometry['building.buildingCount'](p):task.key==='lift-clean'?(p.workbookOverrides?.['zhuj.asset.building.elevatorCount']??p.advancedParameterOverrides?.['building.elevatorCount']??null):null;
  parameter(`task.${task.key}.quantity`,`${task.label} · 适用数量`,task.unit,quantityDefault,{...meta,note:'填实际作业范围；没有该设施或服务填0，未知留空。大堂清拖面积、栋数及电梯门清洁台数可随基础数据联动。'+(task.note??'')});
  parameter(`task.${task.key}.frequency`,`${task.label} · ${task.seasonal?'运行日频次':'年频次'}`,task.seasonal?'次/运行日':'次/年',p=>taskFrequency(task,p.serviceGrade),{...meta,note:task.note??'珠江固定频次；可按项目调整，0表示停用。'});
  parameter(`task.${task.key}.hours`,`${task.label} · 单位作业工时`,`人·小时/${task.unit}·次`,()=>null,{...meta,note:'填写单个单位一次作业的全部人时（含必要在途）；不复制其他工序工时，不填设备运行时间。'});
  if(task.seasonal) parameter(`task.${task.key}.days`,`${task.label} · 年运行天数`,'天/年',()=>null,{...meta,max:366});
}
parameter('specialistHourlyRate','新增工程委外参考工时单价','元/人·小时',()=>null,{group:'珠江·委外动作',note:'只有没有填写全年委外合同总额、需要按动作估价时才填写；不套用自有工程人员工资。'});
const communityActions = [
  [EXTRA_ACTION_IDS[0],'社区主题宣传',7,[4,3,2,2]],
  [EXTRA_ACTION_IDS[1],'业主见面会',79,[4,4,4,4]],
  [EXTRA_ACTION_IDS[2],'管理处开放日',80,[2,2,2,1]],
  [EXTRA_ACTION_IDS[3],'管务及宣传栏内容更新',94,[12,12,6,4]],
];
for (const [id,label,row,frequencies] of communityActions) {
  parameter(`${id}.frequency`,`${label}年频次`,'次/年',p=>gradeValue(frequencies,p.serviceGrade),{sheet:'社区文化',row,group:'珠江·社区文化'});
  parameter(`${id}.hours`,`${label}单次作业工时`,'人·小时/次',()=>null,{group:'珠江·社区文化',note:'未填时列为待确认，不计价；请按实际执行人数×时长填写，避免重复套用原模型活动工时。'});
}
const definitionMap = new Map(definitions.map(item=>[item.key,item]));

const engineeringRules=[...ENGINEERING_ROUTINE_RULES,...ENGINEERING_OUTSOURCED_RULES];
const engineeringById=new Map(engineeringRules.map(a=>[a.id,a]));
const frequencyKey=id=>{const row=id.split('-').at(-1);return id.startsWith('cleaning-')?`清洁!X${row}`:id.startsWith('greening-')?`绿化!U${row}`:id.startsWith('service-')?`服务!P${row}`:id.startsWith('pest-')?'四害消杀!K5':`${id.startsWith('engineering-outsourced')?'工程委外':'工程常规'}!L${row}`;};
const frequencyDefinitions=INPUT_DEFINITIONS.filter(x=>/^(服务!P\d+|清洁!X\d+|绿化!U\d+|工程(?:常规|委外)!L\d+|四害消杀!K5)$/.test(x.key));
const needsNewEffort=new Set(['cleaning-16','cleaning-34','cleaning-40','cleaning-44']);
const garageAssets=new Set(['basement.parkingArea','basement.fireShutterCount','basement.parkingSurveillanceCount','basement.vehicleEntranceEquipmentCount','basement.vehicleEntranceArea','basement.chargingMeterRoomCount']);

function originalProject(project) {
  return {...project,calculationModel:'workbook-v3',serviceGrade:'D',workbookOverrides:Object.fromEntries(Object.entries(project.workbookOverrides??{}).filter(([key])=>!key.startsWith('zhuj.')))};
}
export function validateZhujiangProject(project) {
  if (!project || typeof project!=='object' || Array.isArray(project)) return '项目数据无效';
  if (!ZHUJIANG_GRADES[project.serviceGrade]) return '请选择珠江服务档次';
  if (project.budgetBasis!==undefined && !['standard','workload'].includes(project.budgetBasis)) return '请选择珠江配比或服务工时口径';
  const overrides=project.workbookOverrides??{};
  if (project.workbookOverrides===null || typeof overrides!=='object' || Array.isArray(overrides)) return '模型参数覆盖必须为对象';
  for(const [key,value] of Object.entries(overrides)) {
    const def=definitionMap.get(key);
    if (!def) { if (!originalKeys.has(key)||superseded.has(key)) return `模型参数不允许修改：${key}`; continue; }
    if (typeof value!=='number'||!Number.isFinite(value)||value<def.min||(def.max!==undefined&&value>def.max)||(def.integer&&!Number.isInteger(value))) return `${def.label}请输入有效${def.integer?'整数':'数值'}，最小值${def.min}`;
  }
  const baseError=validateWorkbookOverrides(originalProject(project));
  if (baseError) return baseError;
  if ((overrides['zhuj.multiStoreyHouseholds']??0)+(overrides['zhuj.villaHouseholds']??0)>project.deliveredHouseholds) return '多层和别墅户数合计不能超过已交付户数';
}

function configuration(project) {
  const error=validateZhujiangProject(project); if(error) throw new Error(error);
  const manual=project.workbookOverrides??{};
  const value=(key)=>has(manual,`zhuj.${key}`)?manual[`zhuj.${key}`]:definitionMap.get(`zhuj.${key}`).defaultFor(project);
  const grade=project.serviceGrade;
  const location=GUANGDONG_LOCATIONS.find(l=>l.city===String(project.city).replace(/市$/,'')+'市'&&l.district===project.district);
  // A common reference wage across all four tiers. Qualification requirements
  // do not provide a numeric salary premium, so never invent one from A/B/C/D.
  const defaults={'清洁!Z3':location.cleaningMonthly.C/26,'绿化!W3':location.greeningMonthly.C/26,'客助!C6':0};
  const pendingKeys=new Set();
  for(const def of frequencyDefinitions) { defaults[def.key]=0; pendingKeys.add(def.key); }
  const mapped=new Map();
  for(const rule of ACTION_POLICIES.values()) {
    if(!rule.values) continue;
    const row=Number(rule.id.split('-').at(-1));
    const key=frequencyKey(rule.id);
    defaults[key]=gradeValue(rule.values,grade);
    pendingKeys.delete(key);
    if(rule.id.startsWith('engineering-')) defaults[`工程常规!M${row}`]=1;
    mapped.set(rule.id,{...policyFor(rule.id,grade),key});
  }
  const baseProject=originalProject(project);
  // The source specifies one manager, one engineering head and one security head.
  // It does not prescribe an additional full-time customer head for every site.
  Object.assign(defaults,{'管理模块!C4':1,'管理模块!C5':0,'管理模块!C6':1,'管理模块!C7':1});
  for(let row=4;row<=7;row++) defaults[`管理模块!D${row}`]=0;
  for(const policy of ACTION_POLICIES.values()) if(policy.kind==='replaced') {
    const key=frequencyKey(policy.id); defaults[key]=0; pendingKeys.delete(key);
    delete baseProject.workbookOverrides[key];
  }
  if(value('garageIncluded')===0) { baseProject.garageFloorArea=0; baseProject.garageFloors=0; }
  const quantityValues=new Map();
  for(const rule of engineeringRules) {
    const [sheet,row]=rule.source.split(':');const key=`${sheet}!D${row}`;
    const excluded=value('garageIncluded')===0&&garageAssets.has(rule.quantityParameterKey);
    const quantity=excluded?0:(manual[key]??value(`asset.${rule.quantityParameterKey}`));
    quantityValues.set(rule.id,quantity);
    defaults[key]=quantity??0;
    defaults[`${sheet}!M${row}`]=1;
    if(quantity===null) pendingKeys.add(key);
    if(excluded) { delete baseProject.workbookOverrides[key]; defaults[`${sheet}!L${row}`]=0; delete baseProject.workbookOverrides[`${sheet}!L${row}`]; }
  }
  defaults['四害消杀!C5']=value('asset.pest.treatmentArea')??0;
  defaults['清洁!E27']=value('lobbyMarbleArea')??0;
  if(value('asset.pest.treatmentArea')===null) pendingKeys.add('四害消杀!C5');
  for(const id of needsNewEffort) {
    const row=id.split('-').at(-1);
    if(!has(manual,`清洁!F${row}`)&&!has(manual,`清洁!G${row}`)) {
      defaults[frequencyKey(id)]=0;
      // Do not reinterpret old deep-cleaning effort as routine mopping/inspection.
      pendingKeys.add(`清洁!F${row}`);
      delete baseProject.workbookOverrides[frequencyKey(id)];
    }
  }
  return {value,defaults,mapped,manual,baseProject,pendingKeys,quantityValues};
}

export function getZhujiangInputs(project) {
  const {value,defaults,mapped,manual,baseProject,pendingKeys}=configuration(project);
  const extra=definitions.map(({defaultFor,rangeName,sheet,row,...def})=>{
    const range=rangeName?gradeValue(STAFFING_RANGES[rangeName],project.serviceGrade):null;
    const sourceRow=def.key==='zhuj.zhuj-noticeboard.frequency'&&['A','B'].includes(project.serviceGrade)?95:row;
    const task=def.taskKey?ZHUJIANG_TASKS.find(t=>t.key===def.taskKey):null;
    const provenance=task?taskSource(task,project.serviceGrade):sheet?sourceCell(sheet,sourceRow,project.serviceGrade):{};
    return {...def,...provenance,value:value(def.key.slice(5)),defaultValue:defaultFor(project),source:has(manual,def.key)?'manual':'model',note:[range?`珠江原区间：${range[0]}—${range[1]}${def.unit}；默认取中值。`:'',def.note].filter(Boolean).join(' '),defaultLabel:sheet?'珠江标准 / 测算取值':'项目参考值'};
  });
  const byKey=new Map([...mapped.values()].map(item=>[item.key,item]));
  // These old controls are replaced by explicit Zhujiang post and staffing rules.
  const policiesByKey=new Map([...ACTION_POLICIES.values()].map(p=>[frequencyKey(p.id),policyFor(p.id,project.serviceGrade)]));
  const base=getWorkbookInputs(baseProject,defaults).filter(item=>!superseded.has(item.key)&&(!item.key.startsWith('四害消杀!') || item.key==='四害消杀!O17')).filter(item=>policiesByKey.get(item.key)?.kind!=='replaced').map(item=>{
    const rule=byKey.get(item.key);
    const waiting=pendingKeys.has(item.key);
    const frequency=frequencyDefinitions.some(d=>d.key===item.key);
    const policy=policiesByKey.get(item.key);
    return {...item,label:item.label.replace('客助主任','安保主任'),...(rule?{value:manual[item.key]??gradeValue(rule.values,project.serviceGrade),defaultValue:gradeValue(rule.values,project.serviceGrade),sourceRef:rule.sourceRef,sourceText:rule.sourceText,note:rule.note,defaultLabel:'珠江分级标准'}:{defaultLabel:'原模型参考参数'}),...(waiting?{value:manual[item.key]??null,defaultValue:null,defaultLabel:policy?.kind==='conflict'?'原稿冲突待确认':'待项目数据',sourceRef:policy?.sourceRef,sourceText:policy?.sourceText,note:frequency?policy?.note??'按项目确认年度计划。':'未核实，不采用旧项目数值。请填写实际数量或对应作业耗时。'}:{}),...(frequency&&/^工程/.test(item.key)?{label:item.label.replace('每周期次数','年作业频次'),unit:'次/年'}:{}),...(item.key==='服务!P15'?{label:'其他社区文化活动 · 年作业频次'}:{})};
  });
  return [...extra,...base];
}

export function calculateZhujiangProject(project) {
  const {value,defaults,mapped,manual,baseProject,pendingKeys,quantityValues}=configuration(project);
  const base=calculateWorkbookProject(baseProject,defaults);
  const missing=new Map();
  const need=(key,reason,id)=>{
    if(!missing.has(key)) { const def=definitionMap.get(key)??INPUT_DEFINITIONS.find(d=>d.key===key); missing.set(key,{key,label:def?.label??key,group:def?.group??'项目参数',reason,actionIds:[]}); }
    if(!missing.get(key).actionIds.includes(id)) missing.get(key).actionIds.push(id);
  };
  const concurrent=value('managerConcurrentRole');
  if(concurrent===null) need('zhuj.managerConcurrentRole','小于15万㎡项目需确认经理兼任哪个专业主任，避免重复配置。','management');
  if(concurrent>0) base.management.roles[concurrent].headcount=Math.max(0,base.management.roles[concurrent].headcount-1);
  base.management.roles[3].title='安保主任';
  base.management.roles.forEach((role,i)=>role.annualCost=role.headcount*(value(`managementAnnualCost.${i}`)??role.monthlyRate*12*1.06));
  for(const [key,title] of [['accountant','共享会计'],['cashier','出纳'],['warehouse','仓管'],['environmentHead','环境主管'],['deputy','项目副经理'],['support','运营支持人员']]) {
    const count=value(`management.${key}.count`),rate=value(`management.${key}.annualCost`);
    if(count===null) need(`zhuj.management.${key}.count`,'需确认净配置人数（扣除共享或兼岗）。','management');
    if(count>0&&rate===null) need(`zhuj.management.${key}.annualCost`,'已有岗位人数，尚缺全年人均费用。','management');
    base.management.roles.push({title,headcount:count??0,annualCost:(count??0)*(rate??0),monthlyRate:(rate??0)/12});
  }
  base.management.annualCost=sum(base.management.roles.map(r=>r.annualCost));
  base.management.headcount=sum(base.management.roles.map(r=>r.headcount));
  const grade=project.serviceGrade;
  const inputMap=new Map(getWorkbookInputs(baseProject,defaults).map(x=>[x.key,x.value]));
  const param=(key)=>Number(inputMap.get(key));
  const annualRates={service:param('服务!T23')*8*26*12,cleaning:param('清洁!Z3')*26*12,greening:param('绿化!W3')*26*12,engineeringRoutine:param('工程常规!P3')*12*1.2,assistance:param('客助!P12')*12*1.06};
  const referenceAnnualRates={...annualRates};
  for(const key of Object.keys(annualRates)) annualRates[key]=value(`annualCost.${key}`)??annualRates[key];
  const actions=base.actions.map(item=>{
    const rule=mapped.get(item.id);
    const policy=policyFor(item.id,project.serviceGrade);
    if(item.category==='assistance') return {...item,ruleKind:'staffing',standardStatus:'reference',standardSource:'岗位配置参考',standardNote:'按覆盖时段与排班折算，工资按全年人均费用计入。'};
    const key=frequencyKey(item.id),eng=engineeringById.get(item.id);
    const quantity=item.id==='cleaning-27'?value('lobbyMarbleArea'):eng?quantityValues.get(item.id):item.category==='pestControl'?(manual['四害消杀!C5']??value('asset.pest.treatmentArea')):item.quantity;
    const outOfScope=value('garageIncluded')===0&&((eng&&garageAssets.has(eng.quantityParameterKey))||/^cleaning-(47|48|49|50|51|52)$/.test(item.id));
    const excluded=outOfScope||quantity===0||policy?.kind==='replaced'||(has(manual,key)&&manual[key]===0);
    const effortMissing=needsNewEffort.has(item.id)&&pendingKeys.has(`清洁!F${item.id.split('-').at(-1)}`);
    const covered=item.category==='engineeringOutsourced'&&value('engineeringContractAnnualCost')!==null&&!excluded;
    const pending=!excluded&&!covered&&(quantity===null||(!rule&&!has(manual,key))||effortMissing);
    if(pending) {
      if(quantity===null&&eng) need(`zhuj.asset.${eng.quantityParameterKey}`,'缺少项目设备/场地实际数量。',item.id);
      if(item.id==='cleaning-27'&&quantity===null) need('zhuj.lobbyMarbleArea','需按大堂实际材质确认晶面养护面积。',item.id);
      if(quantity!==null&&!rule&&!has(manual,key)) need(key,policy?.note??'需确认项目年频次。',item.id);
      if(quantity!==null&&effortMissing) need(`清洁!F${item.id.split('-').at(-1)}`,'清拖/巡查不能直接使用旧深度清洁工时。',item.id);
    }
    const note=outOfScope?'已排除本项目车库服务范围。':covered?'已由全年工程委外合同总额覆盖；不重复累计动作估价。':policy?.note??'需审核动作规则。';
    return {...item,...(rule?.label&&!rule.id.startsWith('engineering-')?{action:rule.label}:{}),standardSource:policy?.sourceRef??'待审核',standardText:policy?.sourceText??'',standardNote:note,ruleKind:policy?.kind??'unreviewed',standardStatus:excluded?'excluded':covered?'covered':pending?'pending':has(manual,key)?'manual':'mapped',enabled:!pending&&!excluded&&!covered,...(pending||excluded||covered?{annualCost:0,annualHours:0,headcount:0,frequency:excluded?'不纳入 / 已由新动作替代':covered?'合同总额覆盖':'待项目数据，未计入工时预算'}:{frequency:`${item.annualFrequency}次/年`})};
  });
  for(const [id,action,row] of communityActions) {
    const hours=value(`${id}.hours`)??0;
    const annualFrequency=value(`${id}.frequency`),annualHours=annualFrequency*hours;
    const ref=sourceCell('社区文化',id==='zhuj-noticeboard'&&['A','B'].includes(grade)?95:row,grade);
    const ready=value(`${id}.hours`)!==null||annualFrequency===0;
    if(!ready) need(`zhuj.${id}.hours`,'缺少活动单次总人时。',id);
    actions.push({id,category:'service',action,property:'珠江标准',ruleKind:'fixed',frequency:`${annualFrequency}次/年`,annualFrequency,unitHours:hours,hoursPerFrequency:hours,annualHours,annualCost:annualHours*param('服务!T23'),enabled:ready&&annualFrequency>0,source:'baseline',standardStatus:annualFrequency===0?'excluded':!ready?'pending':has(manual,`zhuj.${id}.frequency`)?'manual':'mapped',standardSource:ref.sourceRef,standardText:ref.sourceText,standardNote:'默认频次来自珠江；请填写独立单次人时。未填写的动作尚未计价。'});
  }

  for(const task of ZHUJIANG_TASKS) {
    const prefix=`task.${task.key}`,quantity=value(`${prefix}.quantity`),frequency=value(`${prefix}.frequency`),hours=value(`${prefix}.hours`),days=task.seasonal?value(`${prefix}.days`):1;
    const excluded=quantity===0||frequency===0||days===0;
    const covered=!excluded&&task.category==='engineeringOutsourced'&&value('engineeringContractAnnualCost')!==null;
    const hourly=task.category==='pestControl'?param('四害消杀!O17')/8:task.category==='engineeringOutsourced'?value('specialistHourlyRate'):referenceAnnualRates[task.category]/({service:2496,cleaning:2496,greening:2496,engineeringRoutine:2880}[task.category]);
    const pending=!excluded&&!covered&&(quantity===null||frequency===null||hours===null||days===null||hourly===null);
    if(pending) {
      if(quantity===null) need(`zhuj.${prefix}.quantity`,'先确认实际服务范围；没有填0，确认纳入后再补工时和计划。',task.id);
      else {
        for(const [field,v,label] of [['frequency',frequency,'年频次'],['hours',hours,'单位作业人时'],['days',days,'运行天数']]) if(v===null) need(`zhuj.${prefix}.${field}`,`缺少${label}。${task.note??''}`,task.id);
        if(hourly===null) need('zhuj.specialistHourlyRate','缺少专业委外工时单价，也可直接填写全年工程委外合同总额。',task.id);
      }
    }
    const annualFrequency=(frequency??0)*(days??0),annualHours=pending||excluded||covered?0:quantity*annualFrequency*hours;
    const ref=taskSource(task,grade);
    actions.push({id:task.id,category:task.category,action:task.label,property:'珠江补充动作',unit:task.unit,quantity:quantity??undefined,annualFrequency,frequency:frequency===null?'按年度计划确认':`${Number(annualFrequency.toFixed(4))}次/年`,unitHours:hours??0,hoursPerFrequency:(quantity??0)*(hours??0),annualHours,annualCost:annualHours*(hourly??0),enabled:!pending&&!excluded&&!covered,source:'baseline',ruleKind:task.kind??(task.values?'fixed':'plan'),standardStatus:excluded?'excluded':covered?'covered':pending?'pending':Object.keys(manual).some(k=>k.startsWith(`zhuj.${prefix}.`))?'manual':'mapped',standardSource:ref.sourceRef,standardText:ref.sourceText,standardNote:covered?'由全年工程委外合同总额覆盖，不另计动作估价。':task.note??'珠江频次×实际数量×单位人时，未填数据不计入已量化小计。'});
  }

  // Match work-unit costs and whole-position budgets to the same annual payroll
  // and productive capacity. In particular, an all-in engineer rate must not lose
  // 1/1.2 of its cost merely because the old worksheet added that factor later.
  const capacities={service:2304,cleaning:2496,greening:2496,engineeringRoutine:2880};
  for(const action of actions) if(has(capacities,action.category)) action.annualCost=(action.annualHours??0)*annualRates[action.category]/capacities[action.category];
  const area=value('managementArea');
  const highRise=project.deliveredHouseholds-value('multiStoreyHouseholds')-value('villaHouseholds');
  const staff={
    service:Math.ceil(highRise/value('highRiseAreaPerPerson'))+Math.ceil(value('multiStoreyHouseholds')/value('multiStoreyAreaPerPerson'))+Math.ceil(value('villaHouseholds')/value('villaAreaPerPerson')),
    cleaning:Math.ceil(area/value('cleaningAreaPerPerson')),
    greening:Math.ceil(project.greenArea/value('greeningAreaPerPerson')),
    engineeringRoutine:Math.ceil(area/value('electricianAreaPerPerson'))+Math.ceil(area/value('generalAreaPerPerson'))+value('paidEngineeringStaff')+value('elevatorAdministrators')+value('otherEngineeringStaff'),
  };

  const security=actions.filter(a=>a.category==='assistance');
  const post=(id,headcount,basis,sourceRow)=>{
    const a=security.find(x=>x.id===id);Object.assign(a,{headcount,annualCost:headcount*annualRates.assistance,basis,enabled:headcount>0,standardStatus:headcount===0?'excluded':'mapped',standardSource:sourceCell('安全管理',sourceRow,grade).sourceRef,standardText:sourceCell('安全管理',sourceRow,grade).sourceText,frequency:basis});
  };
  const workingHours=value('securityDailyHours');
  const mainCoverage=grade==='D'?24+5*value('peakWeekdays')/365:value('mainDayHours')*2+value('mainNightHours');
  const secondaryCoverage=grade==='D'?5*value('peakWeekdays')/365:24;
  post('assistance-4',Math.ceil(value('mainEntrances')*mainCoverage/workingHours),'主出入口值守覆盖工时÷每人计岗工时',29);
  post('assistance-5',Math.ceil(value('secondaryEntrances')*secondaryCoverage/workingHours),'次出入口值守覆盖工时÷每人计岗工时',29);
  security.find(x=>x.id==='assistance-4').action='主出入口值守';
  security.find(x=>x.id==='assistance-5').action='次出入口值守';
  post('assistance-7',Math.ceil(value('monitorPosts')*value('monitorStaff')*24/workingHours),'合用监控中心按24小时覆盖折算',52);
  const outdoorRounds=gradeValue([12,9,9,6],grade),indoorRounds=gradeValue([6,4,2,1],grade);
  const patrolReady=value('outdoorPatrolMinutes')!==null&&value('indoorPatrolMinutes')!==null&&value('priorityPatrolMinutes')!==null;
  if(patrolReady) {
    const floors=sum(project.buildings.map(x=>x.totalFloors));
    post('assistance-8',Math.ceil((outdoorRounds*value('outdoorPatrolMinutes')+indoorRounds*floors*value('indoorPatrolMinutes')+value('priorityPatrolMinutes'))/60/workingHours),`园区${outdoorRounds}轮/天，楼内${indoorRounds}轮/天，加重点部位补充巡逻；按实际路线工时折算`,44);
  } else {
    const patrol=security.find(x=>x.id==='assistance-8');
    Object.assign(patrol,{headcount:0,annualCost:0,enabled:false,frequency:`园区${outdoorRounds}轮/天；楼内${indoorRounds}轮/天`,standardStatus:'pending',standardSource:`安全管理!${ZHUJIANG_GRADES[grade].column}44、46`,standardNote:'巡逻路线工时未填齐，未计入人数及费用；不能视为不需要巡逻。'});
    for(const key of ['outdoorPatrolMinutes','indoorPatrolMinutes','priorityPatrolMinutes']) if(value(key)===null) need(`zhuj.${key}`,'缺少巡逻路线实际工时。','assistance-8');
  }
  const basicSecurity=sum(security.filter(a=>![9,10].includes(Number(a.id.split('-').at(-1)))).map(a=>a.headcount));
  post('assistance-9',Math.ceil(basicSecurity/param('客助!N9')),'替班沿用已确认的5.2人配1人，可按项目修改','3');
  security.find(a=>a.id==='assistance-9').standardStatus='reference';
  security.find(a=>a.id==='assistance-9').standardSource='原模型替班参数（非珠江规定）';
  post('assistance-10',value('securityLeaders'),'班长按珠江2—3人区间取值',3);
  // Additional staff inputs already include their roster/relief. Add them AFTER
  // the regular relief calculation, so reserve and optional posts get no second relief.
  const extras=['securityAdditionalStaff','reserveAdditionalStaff'];
  post('assistance-6',sum(extras.map(k=>value(k)??0)),'独立岗及备勤净增人数，已含对应排班替休',3);
  security.find(a=>a.id==='assistance-6').action='其他独立岗及备勤增配';
  if(extras.some(k=>value(k)===null)) {
    const a=security.find(a=>a.id==='assistance-6'); a.standardStatus='pending';
    for(const key of extras) if(value(key)===null) need(`zhuj.${key}`,'需确认独立岗位/备勤是否由现有排班覆盖；没有额外人员填0。','assistance-6');
  }

  const categories=base.categories.map(c=>{
    const items=actions.filter(a=>a.category===c.category&&a.enabled);
    const annualHours=sum(items.map(a=>a.annualHours??0));
    let workloadHeadcount=c.headcount;
    if(c.category==='service') workloadHeadcount=Math.ceil(annualHours/2304);
    if(['cleaning','greening'].includes(c.category)) workloadHeadcount=Math.ceil(annualHours/(8*26*12));
    if(c.category==='engineeringRoutine') workloadHeadcount=Math.ceil(annualHours/(8*30*12));
    if(c.category==='engineeringOutsourced') workloadHeadcount=Math.ceil(annualHours/2880);
    if(c.category==='pestControl') workloadHeadcount=annualHours/2496;
    if(c.category==='assistance') workloadHeadcount=sum(items.map(a=>a.headcount));
    if(c.category==='engineeringRoutine') workloadHeadcount+=value('paidEngineeringStaff')+value('elevatorAdministrators')+value('otherEngineeringStaff');
    const standardHeadcount=staff[c.category]??workloadHeadcount;
    const annualRate=annualRates[c.category];
    const otherCost=c.category==='engineeringOutsourced'?(value('engineeringContractAnnualCost')??sum(items.map(a=>a.annualCost))):sum(items.map(a=>a.annualCost));
    const workloadBudgetAnnualCost=annualRate===undefined?otherCost:workloadHeadcount*annualRate;
    const standardAnnualCost=annualRate===undefined?otherCost:standardHeadcount*annualRate;
    const selected=project.budgetBasis==='workload';
    return {...c,actionCount:items.length,annualHours,workloadEquivalentHeadcount:annualHours/(c.category==='service'?2304:['cleaning','greening','pestControl'].includes(c.category)?2496:2880),workloadAnnualCost:sum(items.map(a=>a.annualCost)),standardHeadcount,workloadHeadcount,standardAnnualCost,workloadBudgetAnnualCost,headcount:selected?workloadHeadcount:standardHeadcount,annualCost:selected?workloadBudgetAnnualCost:standardAnnualCost,staffingSource:staff[c.category]!==undefined?'珠江配比':c.category==='assistance'?'值守排班与已确认巡逻':c.category==='engineeringOutsourced'&&value('engineeringContractAnnualCost')!==null?'全年委外合同总额':'专业作业工时估价'};
  });
  const comparison=Object.fromEntries(['standard','workload'].map(basis=>{
    const annualCost=sum(categories.map(c=>basis==='standard'?c.standardAnnualCost:c.workloadBudgetAnnualCost))+base.management.annualCost;
    const headcount=sum(categories.filter(c=>c.category!=='pestControl').map(c=>basis==='standard'?c.standardHeadcount:c.workloadHeadcount))+base.management.headcount;
    return [basis,{annualCost,headcount,unitPrice:project.residentialChargeArea>0?annualCost/project.residentialChargeArea/12:null}];
  }));
  const chosen=comparison[project.budgetBasis??'standard'];
  if (Object.values(comparison).some(budget=>Object.values(budget).some(n=>n!==null&&(!Number.isFinite(n)||n<0)))) throw new Error('测算数值超出有效范围，请核实面积、人数及单价');
  const mappedCount=actions.filter(a=>a.standardStatus==='mapped'||a.standardStatus==='manual').length;
  const pendingCount=actions.filter(a=>a.standardStatus==='pending').length;
  const warnings=[
    '两种预算独立计算：配比口径采用所选面积/户数配比；工时口径采用作业量和工时。两者不取高、不相加，差异不自动改变配置。',
    '四档使用同一参考工资，不再套原A/B/C/D工时系数。人员配比与工资可分别调整；全年人均费用填入后不再叠加福利比例。已量化动作的单次工时仍需项目核实。',
    '日/周/月频次分别按365天、52周、12个月年化；管家暂按已交付户数计算，未分类户数暂计高层。原稿入伙年限对应高配/低配建议，请通过户/人参数调整。',
    '客服、保洁、绿化预算按12个月人工费用；保洁/绿化用26个计薪工作日×12个月×8小时折算全年人时，避免按365天产能却只计12个月工资。客服2304小时、工程2880小时沿用原表；实际班制及有效作业时间需核实。管理、安保1.06及工程1.2仅在参考工资估算时保留，非珠江规定。',
    '原稿有口径差异：御享大堂墙面每月擦拭1次、雅享每半月1次，按原稿保留；污水井/化粪池及水泵巡检在不同章节存在冲突，列为待确认，不自动计价。',
    '原稿主入口夜班20:00—07:30与白班间有半小时空档，须按现场值守安排确认；物业管理面积及主次入口数量是项目输入，不由服务档次自动确定。',
    '管理岗位按经理、工程主任、安保主任设置；15万㎡以下经理兼任专业主任须确认并扣除重叠岗位。会计按2—3项目共享、出纳及仓管按实际配置和全年费用单列。',
    '固定频次、按需业务、项目计划、专业合同、原稿冲突分别处理。旧消杀共享估算与乔灌木合并施肥已停用，由珠江分项替代。新增动作缺数量或工时仍会待填写，不等于无需服务。',
    '所示单价只是当前服务支出÷住宅收费面积÷12；尚未扣除车库等收入、分摊非住宅成本，也未计入完整经营费用，不能作为盈亏平衡价或报价。',
  ];
  if(!patrolReady) warnings.unshift('待确认：请填写园区每轮、楼内每层每轮及重点部位额外巡逻工时；巡逻人员及对应替班费用尚未计入。');
  if(value('garageIncluded')===0) warnings.unshift('车库停车区域已排除服务范围；共用泵房、电房等不自动排除。物业管理面积、设备实际归属及车库收入须另行确认。');
  const perHousehold=project.deliveredHouseholds>0?project.residentialChargeArea/project.deliveredHouseholds:null;
  if(perHousehold!==null&&(perHousehold<35||perHousehold>300)) warnings.unshift(`收费面积平均每户${perHousehold.toFixed(1)}㎡，请核实收费范围和面积单位；此为异常提示，不自动更改数据。`);
  for(const [i,b] of project.buildings.entries()) if(b.evacuationStairArea>200&&b.totalFloors>1) warnings.unshift(`第${i+1}组每层楼梯面积为${b.evacuationStairArea}㎡，可能填入了整栋面积，请核实，模型未擅自改数。`);
  for(const def of definitions.filter(x=>x.rangeName)) {
    const range=gradeValue(STAFFING_RANGES[def.rangeName],grade),actual=value(def.key.slice(5));
    if(actual<range[0]||actual>range[1]) warnings.push(`${def.label}手动采用${actual}${def.unit}，已超出珠江原区间${range.join('—')}，属于项目调整。`);
  }
  const missingInputs=[...missing.values()];
  const unreviewedActionCount=actions.filter(a=>a.ruleKind==='unreviewed').length;
  return {...base,calculationModel:ZHUJIANG_VERSION,project,missingInputs,standard:{...STANDARD_SOURCE,revision:'2026-09-22-operations',label:ZHUJIANG_GRADES[grade].label,mappedActionCount:mappedCount,referenceActionCount:actions.filter(a=>a.standardStatus==='reference').length,pendingActionCount:pendingCount,unreviewedActionCount,reviewedActionCount:actions.length-unreviewedActionCount,complete:missingInputs.length===0&&unreviewedActionCount===0,patrolReady},budgetComparison:comparison,budgetBasis:project.budgetBasis??'standard',categories,actions,warnings,totalActionCount:actions.length,standardActionCount:actions.length,activeActionCount:actions.filter(a=>a.enabled).length,totalHeadcount:chosen.headcount,annualCost:chosen.annualCost,unitPrice:chosen.unitPrice,workloadAnnualCost:sum(categories.map(c=>c.workloadAnnualCost))};
}
