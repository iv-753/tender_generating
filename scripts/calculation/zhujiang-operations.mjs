import { FREQUENCY_RULES, sourceCell, gradeValue, ruleSource } from './zhujiang-rules.mjs';
import { SERVICE_RULES } from './rules/service-rules.mjs';
import { CLEANING_RULES } from './rules/cleaning-rules.mjs';
import { GREENING_RULES } from './rules/greening-rules.mjs';
import { ENGINEERING_ROUTINE_RULES } from './rules/engineering-routine-rules.mjs';
import { ENGINEERING_OUTSOURCED_RULES } from './rules/engineering-outsourced-rules.mjs';

// A policy classifies a legacy cost row; it is not a claim that every sentence in
// the source is a separately billable task. Response deadlines and quality targets
// remain requirements, never fabricated work durations or extra annual charges.
export const ACTION_POLICIES = new Map();
const put=(ids,sheet,row,kind,note,values)=>ids.forEach(id=>ACTION_POLICIES.set(id,{id,sheet,row,kind,note,values}));
const rows=(prefix,ns)=>ns.map(n=>`${prefix}-${n}`);
for(const a of SERVICE_RULES) put([a.id],'综合管理服务',72,'demand','按实际年度业务件数计工时；响应时限不等于每件处理工时。');
for(const [row,source] of [[5,72],[6,77],[7,72],[8,116],[9,99],[10,89],[11,80],[12,95],[13,140],[14,136],[17,13],[18,99],[19,137],[20,77],[21,86]]) {
  put([`service-${row}`],'综合管理服务',source,'demand',row===13?'仅开展助老服务的项目填写年度探访次数；善享原稿未要求，填0确认不开展。':'珠江规定服务责任，未给出固定业务发生次数；请填写全年实际或预测件数，0表示本期没有。');
}
put(['service-14'],'环境管理',235,'optional','受业主委托的植物照护，是否开展及全年次数由项目确定，不能强加到基础服务。');
put(['service-15'],'社区文化',7,'optional','珠江明确的宣传、见面会、开放日和节日布置已分别计算；这里只填写不重复的额外活动。');
for(const a of CLEANING_RULES) put([a.id],'环境管理',17,'plan','原成本表的细分工序在珠江没有独立频次；按实际清洁计划填写，已包含在其他动作内则填0，避免重复。');
put(rows('cleaning',[5,6,7,8,9,10,11,12,13,14,15,16]),'环境管理',26,'plan','室外范围按项目清洁计划确定；深度清洁、墙顶面与常规清扫不能重复计同一作业。');
put(rows('cleaning',[17,18,19,20,21,22,23,24]),'环境管理',19,'plan','架空层是否按楼道、室外或独立计划执行，由实际材质和用途确认，原稿未单列其频次。');
put(rows('cleaning',[32,33,34,35,36,37,38,39,40,41,42,43]),'环境管理',19,'plan','楼道墙面与天花未列独立清洁频次；不得把扶手、窗台擦拭次数直接套到整面墙上。');
put(rows('cleaning',[44,45,46]),'环境管理',24,'plan','屋面按规定巡查，发现杂物再清理；巡查与全面清扫不是同一工序。');
put(rows('cleaning',[47,48,49,50,51,52]),'环境管理',99,'plan','原稿车库条款规定通风和照明，没有给出地下车库清洁频次；请填写实际清洁计划，未承担服务时排除车库。');
for(const a of GREENING_RULES) put([a.id],'环境管理',150,'plan','按植物、季节和现场养护计划填写年作业次数；天气触发的作业不能照搬原表固定次数。');
put(rows('greening',[12,21,41,51]),'环境管理',53,'fixed','每年四次预防性处理；实际病虫害追加次数由项目调整。',[4,4,4,4]);
// Row 32 is the second area's lawn pest treatment (not row 41's groundcover).
put(['greening-32'],'环境管理',53,'fixed','每年四次预防性处理，与分区公共卫生消杀区分范围。',[4,4,4,4]);
put(['greening-47'],'环境管理',152,'replaced','原行混合乔木和灌木，频次不同，已拆为珠江乔木施肥和灌木施肥，旧合并行不再计价。');
for(const a of ENGINEERING_ROUTINE_RULES) put([a.id],'工程管理',22,'plan','按设备维保规程和项目年度计划确定本工序频次；原稿未独立量化的细分检测、保养不能统一套每日巡检。');
for(const a of ENGINEERING_OUTSOURCED_RULES) put([a.id],'综合管理服务',143,'contract','专业作业按实际合同范围和年次数填写；全年合同总额填入后替代全部委外动作估价，不叠加。');
for(const r of FREQUENCY_RULES) ACTION_POLICIES.set(r.id,{...r,kind:'fixed',note:r.note||'按珠江所选档次的固定频次，使用原成本模型同类动作的参考工时。',originalRule:true});
const fixed=(ns,row,values,note)=>put(rows('engineering-routine',ns),'工程管理',row,'fixed',note,values);
put(['engineering-routine-6'],'工程管理',72,'replaced','防火卷帘联动检查已纳入新增消防联动测试，旧合并巡查不再重复计价。');
fixed([9],85,[52,52,52,52],'监控图像每周检查；摄像机季度保养另列合同或计划。');
fixed([10,212],27,[12,6,4,4],'标识检查采用专门条款，覆盖一般巡查频次。');
fixed([14,98,135],35,[365,52,24,12],'楼梯共用部位检查采用房屋设施条款。');
fixed([15],69,[1095,365,104,52],'地下室普通照明按室内照明口径；应急照明另行列项。');
fixed([19],87,[52,52,24,12],'停车控制系统巡检，实际管理设备数量决定适用范围。');
fixed([21],66,[24,24,24,24],'发电机每月试运行两次；15分钟是运行时间，不直接充当全部人工工时。');
fixed([24],63,[2190,2190,1460,1460],'供配电设备巡检；专业试验和保养不能并入此巡检工时。');
fixed([28,46,129],35,[12,12,12,4],'电表、电信等设备间共用部位检查；专用设备有更具体规则时优先采用。');
fixed([32],51,[1,1,1,1],'水泵年度维护一次；润滑、巡查与年度维护为不同工序。');
fixed([38],71,[365,365,365,365],'消防水泵日常状态检查。');
fixed([42],64,[365,52,12,4],'低压配电柜检查；原行按柜室整组工时参考，项目需确认实际作业边界。');
fixed([230],64,[52,24,12,4],'低压配电箱和线路检查，区别于低压配电柜频次。');
fixed([44],64,[2,2,1,1],'低压配电柜年度维护次数。');
fixed([232],64,[2,1,1,1],'低压配电箱和线路年度维护次数。');
fixed([50,52,54,115],75,[2,2,1,1],'原行仅为风机巡查，原稿此处量化的是全面保养，不直接沿用巡查工时。');
// Do not relabel fan inspections as full maintenance: an explicit maintenance
// action below owns this requirement; legacy inspection remains a project plan.
put(rows('engineering-routine',[50,52,54,115]),'工程管理',75,'plan','全面风机保养另列珠江动作；此巡查行仅填写保养之外的实际巡检计划。');
fixed([65,69,85,93,152,154,157,159],85,[4,4,4,4],'门禁设备季度检查，不等同于门窗五金保养。');
fixed([153,158],87,[52,52,24,12],'车辆道闸按停车控制系统频次检查。');
fixed([116,119,122,142],33,[2,2,1,1],'外墙/屋面相关部位定期检查；发现问题的修缮另按实际计划。');
fixed([164,201,203],44,[52,26,12,12],'园林构筑物按专门条款检查。');
fixed([182],95,[365,365,365,365],'儿童游乐设施每日安全检查，不能仅套普通设施月巡查。');
fixed([185],46,[12,12,12,12],'健身器材每月检查。');
fixed([204],69,[156,156,52,52],'室外照明每周检查三次/一次。');
fixed([219],42,[52,26,12,12],'围墙、栅栏检查；年度油漆养护另按实际数量和工时。');
put(['engineering-routine-30'],'工程管理',49,'conflict','工程管理49要求泵房每日6/4次，89要求每日2/1次；由项目确认采用年频次，同一次巡查只计一遍。');
put(rows('engineering-routine',[220,222]),'工程管理',40,'scope','原行混合隔油池、化粪池、污水池和雨水调蓄池；珠江按对象分别规定。需确认本行对象及计划，不能把化粪池频次套给全部池体。');
put(rows('engineering-routine',[225,228]),'工程管理',40,'scope','原表通用保养不能直接视为疏通或清掏；请确认实际工序及年度计划，同次作业只计一次。');
put(rows('engineering-routine',[221,224,227]),'工程管理',40,'plan','原表独立检测工序未被珠江单独量化，保留原表参考计划；不同于例行巡查和清掏，若实际已被其他作业覆盖应填0。');
put(['engineering-routine-223'],'环境管理',54,'fixed','共用雨污水管道每季度检查一次；每年汛前疏通为另一工序，不与季度巡查重复相加。',[4,4,4,4]);
put(['engineering-routine-226'],'工程管理',40,'conflict','工程管理40雨污水井巡查为每两周/每月/每季度/每半年；环境管理54统一每月检查。需确认同一井体采用的计划，不能相加。');
// Composite room rows include fire, architectural and equipment checks with
// different requirements. A single multiplied daily frequency would overprice all.
put(rows('engineering-routine',[81,94,105]),'工程管理',35,'plan','原动作把机房基础、消防及专用设备混为一项；请填实际综合巡查次数和合并工时，已分项计费的部分不要重复。');
for(const a of ENGINEERING_ROUTINE_RULES.filter(a=>/消防设施/.test(a.action))) {
  if(!ACTION_POLICIES.get(a.id)?.values) put([a.id],'工程管理',71,'plan','消防条款按日查、月试、季度联动分对象规定；该行混合多项设施，需填写对应年度检查计划，不能全部套每日。');
}
for(const a of ENGINEERING_ROUTINE_RULES.filter(a=>/消防末端巡查|(?:层|厅|梯|走廊)消防设施巡查/.test(a.action))) {
  put([a.id],'工程管理',71,'replaced','旧行将不同消防末端混合，已由珠江日检、月检、联动测试按设备对象分项替代，不重复计算。');
}
put(rows('engineering-outsourced',[66,67,68,69,70,71]),'工程管理',77,'contract','电梯外包至少每15天维保、每年年检；井道/轿厢/机房属于同一合同作业，优先填合同总额，不能把一次完整维保重复算三遍。');
// Original seven pest rows were a display split of ONE aggregate, not seven
// independently costed tasks. Replace the entire aggregate with zone-specific work.
put(rows('pest-control',[5,6,7,8,9,10,11]),'环境管理',46,'replaced','旧表七行共用一组消杀工作量，已由珠江分区、分季节动作替代，不再重复计价。');

export function policyFor(id,grade) {
  const p=ACTION_POLICIES.get(id); if(!p)return null;
  const ref=p.originalRule?ruleSource(p,grade):sourceCell(p.sheet,p.row,grade);
  return {...p,...ref,note:p.note};
}

// New operations use explicit quantity and person-hours per unit. Unlike the old
// workbook, no example geometry or unrelated operation's effort is copied in.
export const ZHUJIANG_TASKS=[];
const task=(key,category,label,sheet,row,values,unit='项',extra={})=>ZHUJIANG_TASKS.push({key,id:`zhuj-${key}`,category,label,sheet,row,values,unit,...extra});
const clean=(key,label,row,values,unit='㎡',extra={})=>task(key,'cleaning',label,'环境管理',row,values,unit,extra);
clean('lobby-mop','大堂地面清拖',17,[365,365,156,104]);
clean('lobby-facilities','大堂设施擦拭',17,[365,156,104,52],'组');
clean('corridor-fixtures','楼道扶手、窗台及消防箱外表擦拭',19,[365,24,6,4],'组');
clean('corridor-lights','楼道灯具清洁',19,[4,2,2,1],'个');
clean('lift-clean','电梯门及按钮清洁',22,[730,365,365,365],'部');
clean('lift-floor','电梯轿厢地面清拖',22,[1095,730,365,365]);
clean('lift-steel','电梯不锈钢护理',22,[52,24,12,12]);
clean('high-lights','室外高位灯具清洁',26,[12,12,4,6],'个');
clean('outdoor-furniture','室外休闲及游乐设施擦拭',26,[365,365,365,365],'组');
clean('outdoor-disinfect','室外休闲及游乐设施消毒',26,[24,12,6,4],'组');
clean('canopy','雨棚及门头清洁',26,[12,6,4,4]);
clean('glass-low','低于2.5米公共玻璃清洁',30,[52,24,12,6]);
clean('glass-high','高于2.5米公共玻璃清洁',30,[12,6,4,2]);
clean('water-skim','水景运行期水面清杂',28,[2.5,1,2/7,1/7], '㎡',{seasonal:true,note:'频次按运行日折算；御享2—3次/日取2.5，运行天数由项目填写。'});
clean('water-bottom','水景池底清洁',28,[12,6,4,2]);
clean('facade-wash','外墙清洗',36,[.5,1/3,1/3,.2]);
clean('toilet-clean','公共卫生间清洁',113,[730,730,730,365],'间',{sourceRows:{A:115,B:113,C:113,D:113}});
clean('entrance-trash','入口垃圾收集',59,[1460,1095,730,365],'组');
clean('grounds-trash','园区垃圾收集',59,[730,730,730,365],'组');
clean('floor-trash','楼层垃圾收集',58,[912.5,912.5,null,null],'组',{note:'御享/雅享每日2—3次取中值；悦享/善享按当地垃圾投放安排填写。'});
clean('trash-wash','垃圾容器清洗',52,null,'组',{kind:'conflict',note:'环境管理52、60对垃圾容器清洗频次有差异；确认一套全年计划，不重复计费。'});
task('tree-fertilize','greening','乔木施肥','环境管理',152,[1.5,1,.75,.5],'棵',{sourceRows:{A:154,B:152,C:152,D:152}});
task('shrub-fertilize','greening','灌木施肥','环境管理',152,[3.5,2.5,1.5,1],'㎡',{sourceRows:{A:154,B:152,C:152,D:152}});
task('hedge-cut','greening','绿篱修剪','环境管理',166,[6,5,4,3],'㎡',{sourceRows:{A:166,B:166,C:156,D:158}});
task('green-inspection','greening','生长期病虫害检查','环境管理',154,null,'区域',{sourceRows:{A:157,B:154,C:154,D:155},note:'检查频次按植物生长期确认：雅享每月4次、悦享每月3次、善享每两周1次；御享未量化。预防性喷药另算。'});
task('water-tank','engineeringOutsourced','生活水箱清洗、消毒及水质检测','工程管理',50,[2,2,2,2],'个',{note:'同时覆盖环境管理64的同一要求，只计一项；填总合同额时包含在合同内。'});
task('fans-maintenance','engineeringRoutine','通风及防排烟风机全面保养','工程管理',75,[null,2,null,1],'台',{note:'原稿明确雅享2次/年、善享1次/年；御享/悦享对应未合并空格，不自动继承邻档，请确认频次。'});
task('building-structure','engineeringRoutine','房屋结构年度检查','工程管理',29,[1,1,1,1],'栋');
task('meter-calibration','engineeringOutsourced','工程计量仪表校验','工程管理',98,[1,1,1,1],'件');
task('fire-training','engineeringRoutine','员工消防培训','工程管理',73,[4,3,2,2],'场',{sourceRows:{A:73,B:73,C:72,D:72},note:'单次工时填写授课及组织人员总工时；若已含在岗位班次内，填0避免重复增员。'});
task('owner-fire-training','service','业主消防培训','工程管理',73,[2,2,1,1],'场',{sourceRows:{A:73,B:73,C:72,D:72}});
task('flood-exercise','engineeringRoutine','防洪排涝演练','工程管理',92,[1,1,1,1],'场');
task('emergency-exercise','engineeringRoutine','设备事故应急演练','工程管理',19,[4,2,1,1],'场');
task('customer-visit','service','新入住业主年度走访','综合管理服务',102,[null,null,.2,.2],'户',{note:'适用数量填当年新入住户数。善享/悦享覆盖不少于20%；御享/雅享该位置未合并空白，请确认适用要求，不自动继承邻档。'});
task('owner-survey','service','业主意见征询','综合管理服务',118,[1,1,1,1],'场');
task('free-repair-callback','service','无偿维修回访','综合管理服务',111,[.5,.4,.3,.2],'件',{note:'适用数量填全年无偿维修完成件数；回访抽样率折为每件年频次。'});
task('paid-repair-callback','service','有偿维修回访','综合管理服务',111,[1,1,1,1],'件');
task('decoration-check','engineeringRoutine','装修施工期间检查','工程管理',103,[1,1,.5,1/3],'户·施工日',{note:'数量填各装修户有效施工天数之和；每户每1/2/3天检查一次，不能按全年户数×365重复放大。'});
task('fire-alarm-daily','engineeringRoutine','火灾报警状态日检','工程管理',71,[365,365,365,365],'组');
task('fire-doors-daily','engineeringRoutine','疏散防火门状态日检','工程管理',71,[365,365,365,365],'樘');
task('fire-monthly','engineeringRoutine','消防水泵、水箱及室内消防设施月检','工程管理',71,[12,12,12,12],'组',{note:'每组包含约定的一套泵、水箱及消防设施；填写全组工时，不得同时启用旧行计同一工作。'});
task('fire-linkage','engineeringRoutine','消防联动及功能定期试验','工程管理',72,[6,6,4,4],'系统',{note:'包括声光、电源切换、消防电梯、喷淋水流及防火卷帘联动等。若合同已覆盖且不需自有人员操作，数量填0。'});
task('fire-detector','engineeringRoutine','火灾探测器年度试验','工程管理',73,[1,1,0,0],'个');
task('emergency-light','engineeringRoutine','应急照明检查','工程管理',69,[365,365,365,52],'组');
task('high-voltage-test','engineeringOutsourced','变压器及高压开关专业试验','工程管理',63,[.5,.5,1/3,1/3],'组');
task('alarm-host','engineeringRoutine','安防报警主机检查','工程管理',85,[156,156,156,156],'台');
task('infrared','engineeringRoutine','红外对射运行测试','工程管理',85,[26,26,26,26],'对');
task('camera','engineeringRoutine','摄像头检查及调校','工程管理',85,[4,4,4,4],'台');
task('intercom','engineeringRoutine','楼宇对讲功能检查','工程管理',85,[4,4,4,4],'组');
task('safety-tools','engineeringOutsourced','绝缘靴手套及高压验电工具校验','工程管理',98,[2,2,2,2],'件');
task('grounding-tools','engineeringOutsourced','接地工具校验','工程管理',98,[1,1,1,1],'件');

// Source season: April–October (7 months, 214 days); November–March
// (5 months, 151 days). Monthly and weekly periods retain their own units.
const season=(peak,off)=>214*peak+151*off;
const pest=(key,label,row,values)=>task(key,'pestControl',label,'环境管理',row,values,'㎡',{note:'旺季4—10月按214天/7个月，淡季11—3月按151天/5个月年化；填写各区域实际处理面积，区域不重复。'});
pest('pest-common','公共区域蚊蝇蟑螂防治',46,[season(1/7,1/14),214/7+5,214/7+5,7+2.5]);
pest('pest-toilet','卫生间蚊蝇蟑螂防治',46,[season(2/7,1/7),season(1/7,1/14),season(1/7,1/14),season(1/7,1/14)]);
pest('pest-drains','排污管沟蚊蝇蟑螂防治',46,[season(2/7,1/7),214/7+10,214/7+5,14+5]);
pest('pest-trash','垃圾点病媒防治',47,[season(1,2/7),season(1,2/7),season(.5,1/7),season(.5,1/7)]);
pest('pest-rat','灭鼠处理',48,[2,2,2,2]);
pest('disinfect-common','公共区域卫生消毒',49,[season(2,1),season(1,2/7),season(2/7,2/7),season(2/7,1/7)]);
pest('disinfect-toilet','卫生间卫生消毒',49,[season(1,3/7),season(1,2/7),season(1,1/7),214*2/7+10]);
pest('disinfect-trash','垃圾点卫生消毒',49,[season(1,3/7),season(1,2/7),season(.5,1/7),season(1/3,1/7)]);
pest('disinfect-drains','排污管沟卫生消毒',49,[season(.5,1/7),214*2/7+10,214/7+10,214/7+5]);
pest('larvicide','蚊虫孳生地生物灭幼',50,[season(1/7,1/14),214/7+5,14+2.5,7+5/3]);
for(const t of ZHUJIANG_TASKS.filter(t=>['pest-toilet','disinfect-toilet'].includes(t.key))) {
  t.values=null; t.kind='conflict';
  t.note='环境管理46、49的分区规则与115/119/120的卫生间专章频次不一致，且后者未拆分防治和消毒。请确认一次实际年度计划；若同次联合作业，只在其中一项计工时，另一项填0。';
}

// Reuse only identical objects and units. Public-area pest and disinfection
// scopes are deliberately separate: the source's listed areas differ.
const sharedQuantities={
  'lift-clean':'zhuj.asset.building.elevatorCount',
  'outdoor-disinfect':'zhuj.task.outdoor-furniture.quantity',
  'disinfect-toilet':'zhuj.task.pest-toilet.quantity',
  'disinfect-drains':'zhuj.task.pest-drains.quantity',
  'disinfect-trash':'zhuj.task.pest-trash.quantity',
};
for(const task of ZHUJIANG_TASKS) {
  task.quantityInputKey=sharedQuantities[task.key];
  task.projectPlan=['fire-training','owner-fire-training','flood-exercise','emergency-exercise','owner-survey'].includes(task.key);
  if(task.projectPlan) task.note=[task.note,'频次已是全项目全年次数，单次填写全部组织作业人时，不再乘另一份场次数量；若同次见面会、宣传或培训已在其他动作计入，仅计未覆盖部分。'].filter(Boolean).join(' ');
}

export function taskSource(task,grade) {
  return sourceCell(task.sheet,task.sourceRows?.[grade]??task.row,grade);
}
export function taskFrequency(task,grade) {
  return task.values?gradeValue(task.values,grade):null;
}
