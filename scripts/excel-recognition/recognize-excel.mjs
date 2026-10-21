import { extractWorkbook } from './extract-workbook.mjs';
import { normalizeRecognition } from './normalize-recognition.mjs';
import { createRecognitionProvider } from './providers.mjs';
import { buildRuleCandidates } from './rule-candidates.mjs';
import { buildDraftMapping } from './rule-review.mjs';
import { recognizeZhujiangWorkbook } from './zhujiang-import.mjs';
import { SUPPLEMENT_FIELDS } from './zhujiang-import-fields.mjs';

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
  const template = recognizeZhujiangWorkbook(workbook);
  if (template) return template;
  const candidates = buildCandidates(workbook);
  return normalizeRecognition(workbook, buildDraftMapping(candidates), {
    provider: 'local-rules',
    model: 'built-in',
  });
}

function needsOnlineEnhancement(result) {
  if (result.project.confirmedConfiguration) return false;
  // Known blank/invalid/conflicting cells need human source correction, not AI guesses.
  if (result.model === 'zhujiang-template') return result.unmatchedRows.length > 0;
  if (result.missingFields.length > 0) return true;
  const evidence = [
    ...Object.values(result.recognition.fields),
    ...result.recognition.buildings.flatMap((building) => Object.values(building.fields)),
  ];
  return evidence.some((item) => item.status === 'needs_confirmation');
}

export async function recognizeExcelSmart(bytes, { config, provider } = {}) {
  const workbook = await extractWorkbook(bytes);
  const template = recognizeZhujiangWorkbook(workbook);
  const local = template ?? normalizeRecognition(workbook, buildDraftMapping(buildRuleCandidates(workbook)), { provider: 'local-rules', model: 'built-in' });
  if (!needsOnlineEnhancement(local)) return local;
  try {
    const ai = provider ?? createRecognitionProvider(config);
    if (template) {
      const suggestions = await ai.mapSupplement(template.unmatchedRows, SUPPLEMENT_FIELDS);
      const enhanced = recognizeZhujiangWorkbook(workbook, suggestions);
      enhanced.provider = `${ai.provider ?? 'ai'}+local-rules`;
      return enhanced;
    }
    const enhanced = await recognizeExcel(bytes, { config, provider: ai });
    // Keep deterministic recognized values; AI only fills unresolved fields.
    for (const [key, evidence] of Object.entries(local.recognition.fields)) if (['recognized', 'derived'].includes(evidence.status)) {
      enhanced.project[key] = local.project[key]; enhanced.recognition.fields[key] = evidence;
    }
    enhanced.missingFields = enhanced.missingFields.filter(key => key.startsWith('buildings[') || enhanced.project[key] == null);
    return enhanced;
  } catch {
    local.warnings.push('智能识别暂时不可用，已保留规则识别结果；未匹配项请核对原表，空白不会自动补值。');
    return local;
  }
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
