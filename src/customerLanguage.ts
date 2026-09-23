import type { WorkbookInput } from './types';

export const estimateName = (basis?: string) => basis === 'workload' ? '按已录入工作量估算' : '按珠江服务标准配置';

export function customerLabel(value: string) {
  return value.replace(/^[A-Z]+-[A-Z]+-\d+\s*/, '').replace(/共享会计/g, '会计')
    .replace(/净配置人数/g, '实际增配人数').replace(/全年人均费用/g, '每人全年用工费用')
    .replace(/工程委外/g, '工程外包').replace(/工程常规/g, '工程维护')
    .replace(/适用数量/g, '服务数量').replace(/单位作业工时/g, '每次作业用时');
}

export function customerParameterNote(item: WorkbookInput) {
  const range = item.note?.match(/珠江原区间：([^。]+)/)?.[1];
  if (range) return `珠江标准范围：${range}。可按本项目实际情况调整。`;
  if (item.key === 'zhuj.management.accountant.count') return '珠江规定每2～3个项目配1名会计；初始参考比例为40%，请按实际分工调整。';
  if (item.key === 'zhuj.managerConcurrentRole') return '项目经理兼任其他岗位时，只计算一次人员和费用。';
  if (item.key === 'zhuj.garageIncluded') return '本项目仍承担车库服务时选择纳入；全部由其他单位负责时选择不纳入。';
  if (/annualCost|AnnualCost/.test(item.key)) return item.key.includes('Contract') ? '填写全年外包合同费用，合同内的服务不再重复收费。' : '填写每人全年工资、社保和福利等费用的合计。';
  if (item.key.includes('.hours') || /^清洁!F/.test(item.key)) return '按所示单位填写每次作业所需的总人工时间，包含必要往返时间；已由其他服务承担的部分不重复填写。';
  if (item.key.includes('.asset.') || item.key.endsWith('.quantity')) return item.visibleWhen ? '已带入对应区域的数量，仅服务范围不同时调整。' : '填写本项目实际数量或面积；没有填0，暂不清楚可留空。相关服务会共用这项数据。';
  if (item.key.endsWith('.count') || item.integer && item.unit === '人') return '填写本项目实际增加的人员数量，兼任人员不要重复计算。';
  if (item.key.endsWith('.frequency') || item.label.includes('年度计划次数')) return '填写本项目全年开展次数，同一次作业不要在不同服务中重复计算。';
  if (item.key.endsWith('Minutes')) return '填写完成一次巡逻的总人工时间；只填写尚未被其他巡逻任务覆盖的部分。';
  return '根据本项目实际服务安排填写；服务标准可查看对应说明。';
}

export function customerMissingReason(key: string, reason: string) {
  if (key === '工程常规!L30') return '泵房巡查在不同条款中要求的次数不同，请确认项目执行计划。';
  if (key === '工程常规!L226') return '雨污水井检查在不同条款中要求的次数不同，请确认项目执行计划。';
  if (/^工程常规!L(220|222|225|228)$/.test(key)) return '请确认具体设施和作业内容，巡查、保养、疏通及清掏不能混为同一项。';
  if (key.endsWith('.hours') || /^清洁!F/.test(key)) return '请补充每次作业所需的人工时间。';
  if (key.endsWith('.frequency')) return '请确认本项目执行的年度服务次数。';
  return customerLabel(reason).replace(/原表|原模型|旧表|动态成本表/g, '参考数据');
}
