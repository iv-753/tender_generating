import { deriveMetrics } from './derived-metrics.mjs';
import { ADVANCED_PARAMETER_DEFINITIONS } from './rules/advanced-parameter-definitions.mjs';

export const ADVANCED_PARAMETER_VERSION = '2026-09-full-model-v1';

const DEFINITIONS_BY_KEY = new Map(
  ADVANCED_PARAMETER_DEFINITIONS.map((definition) => [definition.key, definition]),
);

function finiteNonNegative(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`${label}必须为非负数`);
  }
  return value;
}

function resolveDefault(definition, metrics) {
  const rule = definition.defaultRule;
  if (rule.type === 'metric') return metrics[rule.metric] * (rule.scale ?? 1);
  if (rule.type === 'scaled-template') {
    if (rule.baselineMetric === 0) return rule.templateValue;
    if (metrics[rule.metric] === rule.baselineMetric) return rule.templateValue;
    return rule.templateValue * metrics[rule.metric] / rule.baselineMetric;
  }
  if (rule.type === 'template') return rule.value;
  throw new Error(`未知高级参数默认规则：${rule.type}`);
}

function rounded(value, mode) {
  if (mode === 'integer') return Math.round(value);
  return value;
}

function validateOverrides(overrides) {
  if (overrides === null || typeof overrides !== 'object' || Array.isArray(overrides)) {
    throw new Error('高级参数覆盖必须为对象');
  }
  for (const [key, value] of Object.entries(overrides)) {
    const definition = DEFINITIONS_BY_KEY.get(key);
    if (!definition) throw new Error(`高级参数不存在：${key}`);
    finiteNonNegative(value, definition.label);
  }
}

export function resolveAdvancedParameters(project) {
  const metrics = deriveMetrics(project);
  const overrides = project.advancedParameterOverrides === undefined
    ? {}
    : project.advancedParameterOverrides;
  validateOverrides(overrides);

  return ADVANCED_PARAMETER_DEFINITIONS.map((definition) => {
    const defaultValue = rounded(
      finiteNonNegative(resolveDefault(definition, metrics), definition.label),
      definition.round,
    );
    const manual = Object.hasOwn(overrides, definition.key);
    const value = manual
      ? rounded(finiteNonNegative(overrides[definition.key], definition.label), definition.round)
      : defaultValue;
    return {
      key: definition.key,
      label: definition.label,
      group: definition.group,
      unit: definition.unit,
      defaultValue,
      value,
      source: manual ? 'manual' : definition.defaultRule.source,
      affectedActionIds: definition.affectedActionIds,
    };
  });
}

export function parameterValues(snapshot) {
  return Object.fromEntries(snapshot.map(({ key, value }) => [key, value]));
}
