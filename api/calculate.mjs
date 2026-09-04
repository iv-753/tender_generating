import { createCalculator, validateProject } from '../scripts/calculation/calculator.mjs';
import { errorMessage, json, readJson } from './_lib/http.mjs';

const defaultCalculate = createCalculator();

export function createCalculateHandler({ calculate = defaultCalculate, validate = validateProject } = {}) {
  return {
    async fetch(request) {
      if (request.method !== 'POST') return json({ error: '仅支持 POST 请求' }, 405);
      try {
        const project = await readJson(request);
        const validationError = validate(project);
        if (validationError) return json({ error: validationError }, 400);
        return json(calculate(project));
      } catch (error) {
        console.error(error);
        return json({ error: errorMessage(error) }, 500);
      }
    },
  };
}

export default createCalculateHandler();
