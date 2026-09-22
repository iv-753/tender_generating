import { validateProject, getCalculationInputs } from '../scripts/calculation/calculator.mjs';
import { errorMessage, json, readJson } from './_lib/http.mjs';

export function createWorkbookInputsHandler({ validate = validateProject, inputs = getCalculationInputs } = {}) {
  return { async fetch(request) {
    if (request.method !== 'POST') return json({ error: '仅支持 POST 请求' }, 405);
    try {
      const project = await readJson(request);
      const error = validate(project);
      if (error) return json({ error }, 400);
      return json(inputs(project));
    } catch (error) { return json({ error: errorMessage(error) }, 400); }
  } };
}

export default createWorkbookInputsHandler();
