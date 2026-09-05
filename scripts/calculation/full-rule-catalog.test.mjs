import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { ADVANCED_PARAMETER_DEFINITIONS } from './rules/advanced-parameter-definitions.mjs';
import { PEST_CONTROL_RULES } from './rules/pest-control-rules.mjs';
import { ENGINEERING_OUTSOURCED_RULES } from './rules/engineering-outsourced-rules.mjs';
import { ENGINEERING_ROUTINE_RULES } from './rules/engineering-routine-rules.mjs';

const RULE_SETS = [
  ['四害消杀', PEST_CONTROL_RULES, 5, 11],
  ['工程委外', ENGINEERING_OUTSOURCED_RULES, 5, 99],
  ['工程常规', ENGINEERING_ROUTINE_RULES, 5, 232],
];
const ALL_RULES = RULE_SETS.flatMap(([, rules]) => rules);
const PARAMETER_KEYS = new Set(ADVANCED_PARAMETER_DEFINITIONS.map(({ key }) => key));

test('完整动作目录包含工作簿的全部 330 个来源行', () => {
  assert.equal(PEST_CONTROL_RULES.length, 7);
  assert.equal(ENGINEERING_OUTSOURCED_RULES.length, 95);
  assert.equal(ENGINEERING_ROUTINE_RULES.length, 228);
  assert.equal(ALL_RULES.length, 330);

  for (const [sheet, rules, firstRow, lastRow] of RULE_SETS) {
    assert.deepEqual(
      rules.map(({ source }) => source).sort(),
      Array.from({ length: lastRow - firstRow + 1 }, (_, index) => `${sheet}:${firstRow + index}`).sort(),
    );
  }
});

test('每个动作有唯一 id、动作名和有效高级参数引用', () => {
  assert.equal(new Set(ALL_RULES.map(({ id }) => id)).size, 330);
  for (const rule of ALL_RULES) {
    assert.equal(typeof rule.id, 'string');
    assert.ok(rule.id.length > 0);
    assert.equal(typeof rule.action, 'string');
    assert.ok(rule.action.trim().length > 0);
    assert.equal(typeof rule.quantityParameterKey, 'string');
    assert.ok(PARAMETER_KEYS.has(rule.quantityParameterKey), `${rule.source} 引用了未定义参数 ${rule.quantityParameterKey}`);
    assert.ok(['基础', '可选'].includes(rule.property));
    assert.equal(typeof rule.unit, 'string');
    assert.ok(rule.unit.length > 0);
    assert.ok(Number.isFinite(rule.templateQuantity) && rule.templateQuantity >= 0);
    assert.deepEqual(Object.keys(rule.unitHours), ['A', 'B', 'C', 'D']);
    assert.ok(Object.values(rule.unitHours).every((value) => Number.isFinite(value) && value > 0));
    assert.ok(Object.values(rule.annualFrequency).every((value) => Number.isFinite(value) && value >= 0));
    assert.ok(Number.isFinite(rule.monthlyRate) && rule.monthlyRate >= 0);
  }
});

test('高级参数定义数量合理、key 唯一且反向关联完整', () => {
  assert.equal(ADVANCED_PARAMETER_DEFINITIONS.length, 90);
  assert.equal(PARAMETER_KEYS.size, ADVANCED_PARAMETER_DEFINITIONS.length);

  const referencedByKey = Map.groupBy(ALL_RULES, ({ quantityParameterKey }) => quantityParameterKey);
  for (const parameter of ADVANCED_PARAMETER_DEFINITIONS) {
    assert.match(parameter.key, /^[a-z][a-zA-Z0-9]*(?:\.[a-z][a-zA-Z0-9]*)+$/);
    assert.ok(['basement', 'building', 'grounds', 'staffingCost'].includes(parameter.group));
    assert.equal(typeof parameter.label, 'string');
    assert.ok(parameter.label.trim().length > 0);
    assert.equal(typeof parameter.unit, 'string');
    assert.ok(Object.hasOwn(parameter, 'templateValue'));
    assert.deepEqual(
      [...parameter.affectedActionIds].sort(),
      (referencedByKey.get(parameter.key) ?? []).map(({ id }) => id).sort(),
      `${parameter.key} 的 affectedActionIds 与规则引用不一致`,
    );
  }
});

test('不同设施不因类型或模板数量接近而共用参数', () => {
  const keyBySource = new Map(ALL_RULES.map(({ source, quantityParameterKey }) => [source, quantityParameterKey]));
  for (const [left, right] of [
    ['工程常规:81', '工程常规:148'],
    ['工程常规:129', '工程常规:132'],
    ['工程常规:136', '工程常规:137'],
    ['工程常规:152', '工程常规:157'],
    ['工程常规:153', '工程常规:158'],
    ['工程常规:161', '工程常规:172'],
    ['工程常规:164', '工程常规:203'],
    ['工程常规:165', '工程常规:209'],
    ['工程常规:182', '工程常规:183'],
    ['工程常规:183', '工程常规:185'],
  ]) {
    assert.notEqual(keyBySource.get(left), keyBySource.get(right), `${left} 与 ${right} 不应联动`);
  }

  const definitionsByKey = new Map(ADVANCED_PARAMETER_DEFINITIONS.map((item) => [item.key, item]));
  for (const rule of ALL_RULES) {
    assert.equal(definitionsByKey.get(rule.quantityParameterKey).templateValue, rule.templateQuantity);
  }
});

test('四档工时同时保留公式倍率、比例在途和固定在途口径', () => {
  assert.deepEqual(PEST_CONTROL_RULES[0].unitHours, {
    A: 0.000053142381600000006,
    B: 0.00004871384980000001,
    C: 0.00004649958390000001,
    D: 0.000044285318000000004,
  });
  assert.deepEqual(ENGINEERING_OUTSOURCED_RULES[0].unitHours, {
    A: 0.132,
    B: 0.12100000000000002,
    C: 0.11550000000000002,
    D: 0.11000000000000001,
  });
  assert.deepEqual(ENGINEERING_OUTSOURCED_RULES[61].unitHours, {
    A: 0.41,
    B: 0.38,
    C: 0.365,
    D: 0.35,
  });
  assert.deepEqual(ENGINEERING_ROUTINE_RULES[0].unitHours, {
    A: 0.000132,
    B: 0.00012100000000000003,
    C: 0.00011550000000000002,
    D: 0.00011000000000000002,
  });
});

test('330 行参数映射完整且静态目录不泄漏公式或工作簿路径', async () => {
  const mapUrl = new URL('./migration/full-model-parameter-map.json', import.meta.url);
  const mapping = JSON.parse(await readFile(mapUrl, 'utf8'));
  assert.equal(mapping.version, '2026-09-full-model-v1');
  assert.equal(Object.keys(mapping.rows).length, 330);

  const expectedSources = new Set(ALL_RULES.map(({ source }) => source));
  assert.deepEqual(new Set(Object.keys(mapping.rows)), expectedSources);
  for (const rule of ALL_RULES) assert.equal(mapping.rows[rule.source], rule.quantityParameterKey);

  const serialized = JSON.stringify({ definitions: ADVANCED_PARAMETER_DEFINITIONS, rules: ALL_RULES });
  assert.ok(!serialized.includes('动态成本分析模型.xlsx'));
  assert.ok(!serialized.includes('.xlsx'));
  assert.ok(!/"[^"\\]*(?:\\.[^"\\]*)*"\s*:\s*"=/.test(serialized));
});
