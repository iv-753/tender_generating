import { extractWorkbook } from './extract-workbook.mjs';
import { normalizeRecognition } from './normalize-recognition.mjs';
import { createRecognitionProvider } from './providers.mjs';
import { buildRuleCandidates } from './rule-candidates.mjs';

export async function recognizeExcel(bytes, { config, provider, buildCandidates = buildRuleCandidates } = {}) {
  const workbook = await extractWorkbook(bytes);
  const recognitionProvider = provider || createRecognitionProvider(config);
  let candidates;
  try {
    candidates = buildCandidates(workbook);
  } catch {
    candidates = undefined;
  }
  const mapping = await recognitionProvider.mapWorkbook(workbook.modelText, candidates);
  return normalizeRecognition(workbook, mapping, {
    provider: recognitionProvider.provider,
    model: recognitionProvider.model,
  });
}
