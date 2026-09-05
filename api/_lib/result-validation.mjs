const CATEGORY_ACTION_IDS = Object.freeze({
  service: Array.from({ length: 17 }, (_, index) => `service-${index + 5}`),
  cleaning: Array.from({ length: 48 }, (_, index) => `cleaning-${index + 5}`),
  greening: Array.from({ length: 51 }, (_, index) => `greening-${index + 5}`),
  assistance: [4, 5, 7, 8, 9, 10].map((row) => `assistance-${row}`),
  pestControl: Array.from({ length: 7 }, (_, index) => `pest-control-${index + 5}`),
  engineeringOutsourced: Array.from({ length: 95 }, (_, index) => `engineering-outsourced-${index + 5}`),
  engineeringRoutine: Array.from({ length: 228 }, (_, index) => `engineering-routine-${index + 5}`),
});

const CATEGORY_NAMES = Object.keys(CATEGORY_ACTION_IDS);
const EXPECTED_STANDARD_IDS = new Map(
  Object.entries(CATEGORY_ACTION_IDS).flatMap(([category, ids]) => ids.map((id) => [id, category])),
);
const ADVANCED_PARAMETER_SOURCES = new Set(['derived', 'estimated', 'template', 'manual']);

function text(value) {
  return value === null || value === undefined ? '' : String(value);
}

function finiteNonNegative(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function nearlyEqual(left, right) {
  return Math.abs(left - right) <= 1e-7 * Math.max(1, Math.abs(left), Math.abs(right));
}

function advancedParameterError(result) {
  if (!text(result.advancedParameterVersion).trim()) return '测算结果缺少高级参数版本';
  if (!Array.isArray(result.advancedParameters) || result.advancedParameters.length === 0) return '测算结果缺少高级参数快照';
  const keys = new Set();
  for (const item of result.advancedParameters) {
    const key = text(item?.key).trim();
    if (!key) return '高级参数快照缺少参数编号';
    if (keys.has(key)) return `高级参数编号重复：${key}`;
    keys.add(key);
    if (!text(item.label).trim() || !text(item.group).trim() || !text(item.unit).trim()
      || !finiteNonNegative(item.defaultValue) || !finiteNonNegative(item.value)
      || !ADVANCED_PARAMETER_SOURCES.has(item.source)
      || !Array.isArray(item.affectedActionIds)
      || item.affectedActionIds.some((id) => !text(id).trim())) {
      return `高级参数快照值无效：${key}`;
    }
  }
}

export function resultValidationError(result) {
  if (!result || typeof result !== 'object') return '测算结果无效';
  if (result.version !== 2) return '测算结果版本必须为 2，请重新测算';
  if (!text(result.project?.projectName).trim()) return '测算结果缺少项目名称';
  if (result.standardActionCount !== 452) return '标准动作数必须为 452 项，请重新测算';

  const parameterError = advancedParameterError(result);
  if (parameterError) return parameterError;
  if (!result.management || !finiteNonNegative(result.management.headcount) || !finiteNonNegative(result.management.annualCost)) {
    return '测算结果缺少有效管理成本';
  }
  if (!Array.isArray(result.actions)) return '测算结果缺少服务动作数据';

  const standardActions = result.actions.filter((item) => item?.source !== 'custom');
  if (standardActions.length !== 452) return `标准动作必须完整包含 452 项，当前为 ${standardActions.length} 项`;
  const standardIds = new Set();
  for (const item of standardActions) {
    const id = text(item?.id).trim();
    if (!id || standardIds.has(id)) return `标准动作编号必须唯一：${id || '空编号'}`;
    standardIds.add(id);
    if (EXPECTED_STANDARD_IDS.get(id) !== item.category) return `标准动作编号或分类不稳定：${id}`;
  }
  for (const id of EXPECTED_STANDARD_IDS.keys()) {
    if (!standardIds.has(id)) return `标准动作缺失：${id}`;
  }

  const allIds = new Set();
  for (const item of result.actions) {
    const id = text(item?.id).trim();
    if (!id || allIds.has(id)) return `服务动作编号必须唯一：${id || '空编号'}`;
    allIds.add(id);
    if (!CATEGORY_NAMES.includes(item.category)) return `服务动作分类无效：${text(item.category) || '空分类'}`;
    if (!finiteNonNegative(item.annualCost)) return `服务动作年度成本无效：${id}`;
    if (item.enabled !== undefined && typeof item.enabled !== 'boolean') return `服务动作启用状态无效：${id}`;
  }

  if (!Array.isArray(result.categories) || result.categories.length !== CATEGORY_NAMES.length) return '服务分类必须完整包含 7 类';
  const summaries = new Map();
  for (const summary of result.categories) {
    if (!summary || !CATEGORY_NAMES.includes(summary.category) || summaries.has(summary.category)) return '服务分类必须完整包含 7 类且编号唯一';
    if (!Number.isInteger(summary.actionCount) || summary.actionCount < 0
      || !finiteNonNegative(summary.headcount) || !finiteNonNegative(summary.annualCost)
      || (summary.workloadAnnualCost !== undefined && !finiteNonNegative(summary.workloadAnnualCost))) {
      return `服务分类汇总值无效：${summary.category}`;
    }
    summaries.set(summary.category, summary);
  }
  for (const category of CATEGORY_NAMES) {
    const summary = summaries.get(category);
    if (!summary) return `服务分类缺失：${category}`;
    const activeCount = result.actions.filter((item) => item.category === category && item.enabled !== false).length;
    if (summary.actionCount !== activeCount) return `服务分类动作数量不一致：${category}`;
  }

  const activeActionCount = result.actions.filter((item) => item.enabled !== false).length;
  if (result.totalActionCount !== result.actions.length) return '动作总数与动作明细不一致';
  if (result.activeActionCount !== activeActionCount) return '当前启用动作数与动作明细不一致';
  if (!finiteNonNegative(result.totalHeadcount)) return '项目总人数无效';
  if (!finiteNonNegative(result.annualCost)) return '项目年度总成本无效';
  const expectedHeadcount = result.categories.reduce((sum, item) => sum + item.headcount, 0) + result.management.headcount;
  const expectedAnnualCost = result.categories.reduce((sum, item) => sum + item.annualCost, 0) + result.management.annualCost;
  if (!nearlyEqual(result.totalHeadcount, expectedHeadcount)) return '项目总人数与分类及管理人数不一致';
  if (!nearlyEqual(result.annualCost, expectedAnnualCost)) return '年度总成本与分类及管理成本不一致';
  if (result.workloadAnnualCost !== undefined) {
    const workloadAnnualCost = result.categories.reduce((sum, item) => sum + (item.workloadAnnualCost ?? 0), 0);
    if (!finiteNonNegative(result.workloadAnnualCost) || !nearlyEqual(result.workloadAnnualCost, workloadAnnualCost)) {
      return '年度工作量成本与分类汇总不一致';
    }
  }
}

export function safeFileName(value) {
  return text(value).trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').replace(/[. ]+$/g, '').slice(0, 80) || '物业项目';
}
