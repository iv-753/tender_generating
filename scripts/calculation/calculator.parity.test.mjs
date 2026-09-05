import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { createCalculator } from './calculator.mjs';
import { PARITY_PROJECTS } from './fixtures/parity-projects.mjs';
import { createWorkbookOracle, resolveWorkbookModelPath } from './workbook-oracle.mjs';

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
    for (const key of Object.keys(expected)) compare(actual[key], expected[key], `${location}.${key}`);
    return;
  }
  assert.equal(actual, expected, location);
}

test('pure calculator matches the workbook for every action and category', async () => {
  const modelPath = await resolveWorkbookModelPath();
  const modelBytes = await readFile(modelPath);
  const workbook = await createWorkbookOracle(modelBytes);
  const calculate = createCalculator();

  for (const project of PARITY_PROJECTS) {
    const expected = workbook(project);
    const actual = calculate(project);
    assert.equal(actual.totalActionCount, 452, project.projectName);
    assert.deepEqual(actual.categories.map(({ actionCount }) => actionCount), [17, 48, 51, 6, 7, 95, 228]);
    compare(actual.categories, expected.categories, `${project.projectName}.categories`);
    compare(actual.actions, expected.actions, `${project.projectName}.actions`);
    compare(actual.management, expected.management, `${project.projectName}.management`);
    compare(actual.totalHeadcount, expected.totalHeadcount, `${project.projectName}.totalHeadcount`);
    compare(actual.annualCost, expected.annualCost, `${project.projectName}.annualCost`);
    compare(actual.workloadAnnualCost, expected.workloadAnnualCost, `${project.projectName}.workloadAnnualCost`);
    const unitPrice = actual.annualCost / project.residentialChargeArea / 12;
    compare(unitPrice, expected.unitPrice, `${project.projectName}.unitPrice`);
  }
});

test('workbook fixture resolution accepts an explicit path and otherwise finds the source workbook upward', async () => {
  const discovered = await resolveWorkbookModelPath();
  assert.match(discovered, /动态成本分析模型\.xlsx$/);
  assert.equal(
    await resolveWorkbookModelPath({ env: { FULL_MODEL_WORKBOOK_PATH: discovered } }),
    discovered,
  );
  await assert.rejects(
    resolveWorkbookModelPath({ env: { FULL_MODEL_WORKBOOK_PATH: `${discovered}.missing` } }),
    /FULL_MODEL_WORKBOOK_PATH 指向的工作簿不存在/,
  );
});
