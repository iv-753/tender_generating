import { extractWorkbook } from './extract-workbook.mjs';
import { normalizeRecognition } from './normalize-recognition.mjs';
import { createRecognitionProvider } from './providers.mjs';
import { buildRuleCandidates } from './rule-candidates.mjs';
import { buildDraftMapping } from './rule-review.mjs';

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

export async function recognizeExcelLocally(bytes, { buildCandidates = buildRuleCandidates } = {}) {
  const workbook = await extractWorkbook(bytes);
  const candidates = buildCandidates(workbook);
  return normalizeRecognition(workbook, buildDraftMapping(candidates), {
    provider: 'local-rules',
    model: 'built-in',
  });
}

function needsOnlineEnhancement(result) {
  if (result.missingFields.length > 0) return true;
  const evidence = [
    ...Object.values(result.recognition.fields),
    ...result.recognition.buildings.flatMap((building) => Object.values(building.fields)),
  ];
  return evidence.some((item) => item.status === 'needs_confirmation');
}

export async function recognizeExcelWithFallback(bytes, { remoteRecognize } = {}) {
  const local = await recognizeExcelLocally(bytes);
  if (!remoteRecognize || !needsOnlineEnhancement(local)) return local;
  try {
    return await remoteRecognize(bytes);
  } catch {
    return {
      ...local,
      warnings: [
        ...local.warnings,
        '智能识别暂时不可用，已保留本地规则识别结果；请补充或核对标记字段。',
      ],
    };
  }
}
