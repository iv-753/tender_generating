import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { createCalculator } from './calculator.mjs';
import { PARITY_PROJECTS } from './fixtures/parity-projects.mjs';
import { createWorkbookOracle } from './workbook-oracle.mjs';

function comparable(result) {
  const { calculatedAt: _calculatedAt, ...rest } = result;
  return rest;
}

function compare(actual, expected, location = 'result') {
  if (typeof expected === 'number') {
    assert.equal(typeof actual, 'number', `${location} 应为数字`);
    assert.ok(Math.abs(actual - expected) <= 1e-7, `${location}: ${actual} !== ${expected}`);
    return;
  }
  if (Array.isArray(expected)) {
    assert.equal(actual.length, expected.length, `${location}.length`);
    expected.forEach((value, index) => compare(actual[index], value, `${location}[${index}]`));
    return;
  }
  if (expected && typeof expected === 'object') {
    assert.deepEqual(Object.keys(actual).sort(), Object.keys(expected).sort(), `${location}.keys`);
    for (const key of Object.keys(expected)) compare(actual[key], expected[key], `${location}.${key}`);
    return;
  }
  assert.equal(actual, expected, location);
}

test('pure calculator matches the workbook for every action and category', async () => {
  const modelBytes = await readFile(path.resolve(import.meta.dirname, '..', '..', '..', '动态成本分析模型.xlsx'));
  const workbook = await createWorkbookOracle(modelBytes);
  const calculate = createCalculator();

  for (const project of PARITY_PROJECTS) {
    const expected = workbook(project);
    const actual = calculate(project);
    assert.equal(actual.totalActionCount, 122, project.projectName);
    assert.deepEqual(actual.categories.map(({ actionCount }) => actionCount), [17, 48, 51, 6]);
    compare(comparable(actual), comparable(expected), project.projectName);
  }
});
