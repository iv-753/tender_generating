import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ADVANCED_PARAMETER_VERSION,
  parameterValues,
  resolveAdvancedParameters,
} from './advanced-parameters.mjs';
import { validateProject } from './calculator.mjs';
import { PARITY_PROJECTS } from './fixtures/parity-projects.mjs';
import { ADVANCED_PARAMETER_DEFINITIONS } from './rules/advanced-parameter-definitions.mjs';

const baseProject = PARITY_PROJECTS[0];
const byKey = (snapshot, key) => snapshot.find((item) => item.key === key);

test('resolves the exact 90 workbook defaults without customer input', () => {
  const result = resolveAdvancedParameters(baseProject);
  const templateValues = Object.fromEntries(
    ADVANCED_PARAMETER_DEFINITIONS.map(({ key, templateValue }) => [key, templateValue]),
  );

  assert.equal(ADVANCED_PARAMETER_VERSION, '2026-09-full-model-v1');
  assert.equal(result.length, 90);
  assert.deepEqual(parameterValues(result), templateValues);
  assert.ok(result.every(({ value, defaultValue }) => (
    Number.isFinite(value) && value >= 0 && Number.isFinite(defaultValue) && defaultValue >= 0
  )));
  assert.ok(result.every(({ source }) => source !== 'manual'));
  assert.equal(Object.keys(parameterValues(result)).length, 90);
});

test('keeps a manual override and returns to the latest generated default when removed', () => {
  const overridden = resolveAdvancedParameters({
    ...baseProject,
    advancedParameterOverrides: { 'basement.fireShutterCount': 300 },
  });
  assert.deepEqual(
    {
      defaultValue: byKey(overridden, 'basement.fireShutterCount').defaultValue,
      value: byKey(overridden, 'basement.fireShutterCount').value,
      source: byKey(overridden, 'basement.fireShutterCount').source,
    },
    { defaultValue: 252, value: 300, source: 'manual' },
  );

  const restored = resolveAdvancedParameters({ ...baseProject, advancedParameterOverrides: {} });
  assert.equal(byKey(restored, 'basement.fireShutterCount').defaultValue, 252);
  assert.equal(byKey(restored, 'basement.fireShutterCount').value, 252);
  assert.notEqual(byKey(restored, 'basement.fireShutterCount').source, 'manual');
});

test('rejects unknown, non-finite, and negative overrides while accepting zero', () => {
  for (const project of [
    { ...baseProject, advancedParameterOverrides: { unknown: 1 } },
    { ...baseProject, advancedParameterOverrides: { 'basement.fireShutterCount': Number.NaN } },
    { ...baseProject, advancedParameterOverrides: { 'basement.fireShutterCount': Number.POSITIVE_INFINITY } },
    { ...baseProject, advancedParameterOverrides: { 'basement.fireShutterCount': -1 } },
  ]) assert.throws(() => resolveAdvancedParameters(project), /(?:高级参数不存在：unknown|地下停车区防火卷帘数量必须为非负数)/);

  const zero = resolveAdvancedParameters({
    ...baseProject,
    advancedParameterOverrides: { 'basement.fireShutterCount': 0 },
  });
  assert.equal(byKey(zero, 'basement.fireShutterCount').value, 0);
  assert.equal(byKey(zero, 'basement.fireShutterCount').source, 'manual');
});

test('rounds generated and manual count parameters to whole facilities', () => {
  const scaled = resolveAdvancedParameters({ ...baseProject, garageFloorArea: 40100 });
  assert.ok(Number.isInteger(byKey(scaled, 'basement.fireShutterCount').defaultValue));

  const manual = resolveAdvancedParameters({
    ...baseProject,
    advancedParameterOverrides: { 'basement.fireShutterCount': 300.6 },
  });
  assert.equal(byKey(manual, 'basement.fireShutterCount').value, 301);
});

test('uses derived, estimated, and template defaults according to parameter reliability', () => {
  const sources = new Set(ADVANCED_PARAMETER_DEFINITIONS.map(({ defaultRule }) => defaultRule.source));
  assert.deepEqual(sources, new Set(['derived', 'estimated', 'template']));

  const larger = resolveAdvancedParameters({
    ...baseProject,
    garageFloorArea: baseProject.garageFloorArea * 2,
    pavedRoadArea: baseProject.pavedRoadArea * 2,
  });
  assert.equal(byKey(larger, 'basement.parkingArea').defaultValue, 124920);
  assert.equal(byKey(larger, 'grounds.roadArea').defaultValue, 17153.46);
  assert.equal(byKey(larger, 'grounds.tennisCourtCount').defaultValue, 0);
});

test('validateProject reports invalid override keys and values without rejecting zero', () => {
  assert.equal(
    validateProject({ ...baseProject, advancedParameterOverrides: { unknown: 1 } }),
    '高级参数不存在：unknown',
  );
  for (const value of [Number.NaN, Number.POSITIVE_INFINITY, -1]) {
    assert.equal(
      validateProject({
        ...baseProject,
        advancedParameterOverrides: { 'basement.fireShutterCount': value },
      }),
      '地下停车区防火卷帘数量必须为非负数',
    );
  }
  assert.equal(
    validateProject({
      ...baseProject,
      advancedParameterOverrides: { 'basement.fireShutterCount': 0 },
    }),
    undefined,
  );
});

test('rejects malformed override containers instead of silently treating them as empty', () => {
  for (const advancedParameterOverrides of [null, 42, false, []]) {
    const project = { ...baseProject, advancedParameterOverrides };
    assert.throws(() => resolveAdvancedParameters(project), /高级参数覆盖必须为对象/);
    assert.equal(validateProject(project), '高级参数覆盖必须为对象');
  }
});
