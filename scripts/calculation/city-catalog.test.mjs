import assert from 'node:assert/strict';
import test from 'node:test';
import { validateProject } from './calculator.mjs';
import { PARITY_PROJECTS } from './fixtures/parity-projects.mjs';

const baseProject = PARITY_PROJECTS[0];

test('accepts an adjacent city cost override', () => {
  const project = {
    ...baseProject,
    region: '广东省',
    city: '广州市',
    recommendedCostBand: 'high',
    costBandSourceVersion: '2025-wage-2026-09',
    costBand: 'upper',
  };
  assert.equal(validateProject(project), undefined);
});

test('rejects a two-band city cost override', () => {
  const project = {
    ...baseProject,
    region: '广东省',
    city: '广州市',
    recommendedCostBand: 'high',
    costBandSourceVersion: '2025-wage-2026-09',
    costBand: 'standard',
  };
  assert.match(validateProject(project), /只能上下调整一级/);
});

test('rejects a mismatched province and city', () => {
  const project = { ...baseProject, region: '湖南省', city: '广州市', costBand: 'high' };
  assert.match(validateProject(project), /有效的省份和城市/);
});
