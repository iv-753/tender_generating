import { extractWorkbook } from './extract-workbook.mjs';
import { normalizeRecognition } from './normalize-recognition.mjs';
import { createRecognitionProvider } from './providers.mjs';

export async function recognizeExcel(bytes, { config, provider } = {}) {
  const workbook = await extractWorkbook(bytes);
  const recognitionProvider = provider || createRecognitionProvider(config);
  const mapping = await recognitionProvider.mapWorkbook(workbook.modelText);
  return normalizeRecognition(workbook, mapping, {
    provider: recognitionProvider.provider,
    model: recognitionProvider.model,
  });
}
