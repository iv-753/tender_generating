import { createCalculator, validateProject } from '../scripts/calculation/calculator.mjs';
import { applyAdjustments } from '../scripts/calculation/adjustments.mjs';
import { errorMessage, json, readJson } from './_lib/http.mjs';

const defaultCalculate = createCalculator();

export function createAdjustedCalculateHandler({ calculate = defaultCalculate, apply = applyAdjustments, validate = validateProject } = {}) {
  return {
    async fetch(request) {
      if (request.method !== 'POST') return json({ error: '仅支持 POST 请求' }, 405);
      try {
        const body = await readJson(request);
        const validationError = validate(body?.project);
        if (validationError) return json({ error: validationError }, 400);
        const baseline = calculate(body.project);
        return json(apply(baseline, body.adjustments));
      } catch (error) {
        console.error(error);
        return json({ error: errorMessage(error, '调整方案重算失败') }, 500);
      }
    },
  };
}

export default createAdjustedCalculateHandler();
