import { calculateProject } from '../calculation/engine.mjs';
import { PARITY_PROJECTS } from '../calculation/fixtures/parity-projects.mjs';

export function fullResult(projectOverrides = {}) {
  return calculateProject({
    ...structuredClone(PARITY_PROJECTS[0]),
    projectName: '增城示范花园',
    ...projectOverrides,
  });
}

export function cloneResult(result = fullResult()) {
  return structuredClone(result);
}
