import { createCalculator as createWorkbookCalculator, validateProject } from '../scripts/calculation/calculator.mjs';
import { errorMessage, json, readJson } from './_lib/http.mjs';
import { loadCostModelBytes as loadModel } from './_lib/model-loader.mjs';

export function createCalculateHandler({ loadModelBytes = loadModel, createCalculator = createWorkbookCalculator, validate = validateProject } = {}) {
  let calculatorPromise;
  const calculator = () => {
    if (!calculatorPromise) {
      calculatorPromise = Promise.resolve(loadModelBytes())
        .then((bytes) => createCalculator(bytes))
        .catch((error) => { calculatorPromise = undefined; throw error; });
    }
    return calculatorPromise;
  };
  return {
    async fetch(request) {
      if (request.method !== 'POST') return json({ error: '仅支持 POST 请求' }, 405);
      try {
        const project = await readJson(request);
        const validationError = validate(project);
        if (validationError) return json({ error: validationError }, 400);
        return json((await calculator())(project));
      } catch (error) {
        console.error(error);
        return json({ error: errorMessage(error) }, 500);
      }
    },
  };
}

export default createCalculateHandler();
