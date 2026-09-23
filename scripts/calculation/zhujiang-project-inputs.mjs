import { calculateZhujiangProject, getZhujiangInputs } from './zhujiang-model.mjs';
import { ACTION_POLICIES, ZHUJIANG_TASKS, taskFrequency } from './zhujiang-operations.mjs';
import { ENGINEERING_ROUTINE_RULES } from './rules/engineering-routine-rules.mjs';
import { ENGINEERING_OUTSOURCED_RULES } from './rules/engineering-outsourced-rules.mjs';

const frequencyKey = id => {
  const row = id.split('-').at(-1);
  return id.startsWith('cleaning-') ? `清洁!X${row}` : id.startsWith('greening-') ? `绿化!U${row}` : id.startsWith('service-') ? `服务!P${row}` : `${id.startsWith('engineering-outsourced') ? '工程委外' : '工程常规'}!L${row}`;
};
const businessName = label => label.replace(/^[A-Z]-[A-Z]+-\d+\s*/, '');
const engineering = [...ENGINEERING_ROUTINE_RULES, ...ENGINEERING_OUTSOURCED_RULES];

// A presentation contract, separate from the complete calculation/audit inputs.
// Fixed standards and workbook coefficients remain inside the engine.
export function getZhujiangProjectInputs(project) {
  const inputs = getZhujiangInputs(project);
  const result = calculateZhujiangProject(project);
  const byKey = new Map(inputs.map(input => [input.key, input]));
  const missing = new Set(result.missingInputs.map(input => input.key));
  const contractCovered = project.workbookOverrides?.['zhuj.engineeringContractAnnualCost'] != null;
  const assets = new Set(engineering.filter(rule => ACTION_POLICIES.get(rule.id)?.kind !== 'replaced' && !(contractCovered && rule.id.startsWith('engineering-outsourced'))).map(rule => `zhuj.asset.${rule.quantityParameterKey}`));
  // The shared lift count also feeds the separate lift-cleaning task.
  assets.add('zhuj.asset.building.elevatorCount');
  const fields = [];
  for (const input of inputs.filter(input => input.key.startsWith('zhuj.'))) {
    if (input.key.startsWith('zhuj.asset.') && !assets.has(input.key)) continue;
    if (input.key === 'zhuj.specialistHourlyRate' && contractCovered) continue;
    if (/^zhuj\.zhuj-.+\.frequency$/.test(input.key)) continue;
    const taskMatch = input.key.match(/^zhuj\.task\.(.+)\.(quantity|frequency|hours|days)$/);
    let visibleWhen;
    let note = input.note;
    if (taskMatch) {
      const task = ZHUJIANG_TASKS.find(task => task.key === taskMatch[1]);
      if (contractCovered && task.category === 'engineeringOutsourced') continue;
      if (taskMatch[2] === 'frequency' && taskFrequency(task, project.serviceGrade) !== null) continue;
      if (taskMatch[2] !== 'quantity') visibleWhen = `zhuj.task.${task.key}.quantity`;
      const frequency = taskFrequency(task, project.serviceGrade);
      if (taskMatch[2] === 'quantity' && frequency !== null) note = `${note ?? ''} 所选珠江档次频次：${Number(frequency.toFixed(3))}次/${task.seasonal ? '运行日' : '年'}，自动带入。`;
    }
    const roleCost = input.key.match(/^zhuj\.management\.(.+)\.annualCost$/);
    if (roleCost) visibleWhen = `zhuj.management.${roleCost[1]}.count`;
    if (/^zhuj\.zhuj-.+\.hours$/.test(input.key)) {
      const frequency = byKey.get(input.key.replace(/hours$/, 'frequency'))?.value;
      note = `${note ?? ''} 所选珠江档次频次：${frequency}次/年，自动带入。`;
    }
    const isRatio = input.group === '珠江·人员配比';
    const isStandardChoice = ['zhuj.monitorStaff', 'zhuj.securityLeaders', 'zhuj.mainDayHours', 'zhuj.mainNightHours', 'zhuj.management.accountant.count', 'zhuj.management.cashier.count'].includes(input.key);
    const defaultLabel = isRatio ? '珠江配比取值' : isStandardChoice ? '珠江标准取值' : input.defaultValue === null ? '待项目确认' : '项目暂定值';
    fields.push({...input, visibleWhen, note, defaultLabel});
  }
  for (const action of result.actions) {
    const policy = ACTION_POLICIES.get(action.id);
    if (!policy || policy.kind === 'replaced' || action.standardStatus === 'covered') continue;
    const key = frequencyKey(action.id);
    // Unknown equipment scope is confirmed once through its shared quantity.
    // Keep zero plans editable so the project can enable them again.
    if (!policy.values && (action.quantity > 0 || missing.has(key))) {
      const input = byKey.get(key);
      if (input) fields.push({...input, label: `${businessName(action.action)} · 年度计划次数`, defaultLabel: policy.kind === 'conflict' ? '原稿冲突待确认' : '项目年度计划'});
    }
    const effortKey = `清洁!F${action.id.split('-').at(-1)}`;
    if (['cleaning-16', 'cleaning-34', 'cleaning-40', 'cleaning-44'].includes(action.id) && (action.quantity > 0 || missing.has(effortKey))) {
      const input = byKey.get(effortKey);
      if (input) fields.push({...input, label: `${businessName(action.action)} · 单位作业工时`, defaultLabel: '项目实际工时'});
    }
  }
  for (const [index, title] of ['项目经理', '管家主任', '工程主任', '安保主任'].entries()) {
    const input = byKey.get(`管理模块!C${index + 4}`);
    fields.push({...input, label: `${title}配置人数（兼岗抵扣前）`, group: '珠江·项目及配置', defaultLabel: '珠江配置取值', sourceRef: undefined, note: '按项目实际配置；经理兼任主任时由系统抵扣对应主任1人，不要再次手动扣减。'});
  }
  const pestRate = byKey.get('四害消杀!O17');
  fields.push({...pestRate, label: '分区消杀作业人工日单价', group: '珠江·分区消杀', defaultLabel: '原模型参考价', sourceRef: undefined, note: '按实际采购或外包人工日单价调整；留用参考值不代表珠江实际合同价。'});
  const groups = {服务: '项目·客服计划', 清洁: '项目·保洁计划', 绿化: '项目·绿化计划', 工程常规: '项目·工程计划', 工程委外: '项目·委外计划'};
  for (const field of fields) field.group = groups[field.group] ?? field.group;
  return fields;
}
