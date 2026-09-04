function text(value) {
  return value === null || value === undefined ? '' : String(value);
}

export function resultValidationError(result) {
  if (!result || typeof result !== 'object') return '测算结果无效';
  if (!text(result.project?.projectName).trim()) return '测算结果缺少项目名称';
  if (result.totalActionCount !== 122 || !Array.isArray(result.actions) || result.actions.length !== 122) return '服务动作数据不完整，请重新测算';
  const categories = ['service', 'cleaning', 'greening', 'assistance'];
  if (!Array.isArray(result.categories) || !categories.every((category) => result.categories.some((item) => item.category === category))) return '服务分类数据不完整，请重新测算';
}

export function safeFileName(value) {
  return text(value).trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').replace(/[. ]+$/g, '').slice(0, 80) || '物业项目';
}
