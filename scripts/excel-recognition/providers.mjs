import { RECOGNITION_JSON_SCHEMA, REVIEW_JSON_SCHEMA, recognitionPrompt } from './schema.mjs';
import { applyRuleReview } from './rule-review.mjs';

function cleanBaseUrl(value) {
  return String(value || '').replace(/\/+$/, '');
}

function completionUrl(value) {
  const baseUrl = cleanBaseUrl(value);
  return /\/chat\/completions$/i.test(baseUrl) ? baseUrl : `${baseUrl}/chat/completions`;
}

function parseJsonContent(content) {
  if (content && typeof content === 'object') return content;
  const text = String(content ?? '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('AI 返回的字段映射不是有效 JSON');
  }
}

export function createRecognitionProvider({
  provider = 'qwen', apiKey, baseUrl, model, supportsJsonSchema = provider === 'qwen', fetchImpl = fetch,
} = {}) {
  if (!['qwen', 'local'].includes(provider)) throw new Error(`不支持的 AI 服务类型：${provider}`);
  if (!baseUrl) throw new Error('未配置 AI 服务地址');
  if (!model) throw new Error('未配置 AI 模型');
  if (provider === 'qwen' && !apiKey) throw new Error('未配置千问 API 密钥');

  return {
    provider,
    model,
    async mapSupplement(rows, definitions) {
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
      const body = {
        model, temperature: 0,
        messages: [
          { role: 'system', content: '只将未匹配的Excel行对应到允许的测算字段。必须引用提供的sheet和cell，不能计算、补值、猜测，不匹配则省略。不得把实际人数、费用或收入映射为测算条件。只返回JSON对象，mappings数组内每项为key、sheet、cell、confidence。' },
          { role: 'user', content: JSON.stringify({ rows, fields: definitions.map(({ key, label, unit, section }) => ({ key, label, unit, section })) }) },
        ],
      };
      if (supportsJsonSchema) body.response_format = { type: 'json_schema', json_schema: {
        name: 'calculation_input_supplement', strict: true, schema: { type: 'object', additionalProperties: false, required: ['mappings'], properties: {
          mappings: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['key', 'sheet', 'cell', 'confidence'], properties: {
            key: { type: 'string', enum: definitions.map(d => d.key) }, sheet: { type: 'string' }, cell: { type: 'string' }, confidence: { type: 'number', minimum: 0, maximum: 1 },
          } } },
        } },
      } };
      const response = await fetchImpl(completionUrl(baseUrl), { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`AI补充识别请求失败（HTTP ${response.status}）`);
      const payload = await response.json();
      const parsed = parseJsonContent(payload?.choices?.[0]?.message?.content);
      if (!Array.isArray(parsed?.mappings)) throw new Error('AI补充识别格式无效');
      return parsed.mappings;
    },
    async mapWorkbook(workbookText, candidates) {
      const reviewingCandidates = Boolean(candidates);
      const headers = { 'Content-Type': 'application/json' };
      if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
      const body = {
        model,
        temperature: 0,
        messages: [
          { role: 'system', content: '你是物业项目Excel字段识别器。严格选择原工作簿单元格作为证据，缺失字段不得猜测。' },
          { role: 'user', content: recognitionPrompt(workbookText, candidates) },
        ],
      };
      if (supportsJsonSchema) body.response_format = {
        type: 'json_schema',
        json_schema: reviewingCandidates ? REVIEW_JSON_SCHEMA : RECOGNITION_JSON_SCHEMA,
      };

      const response = await fetchImpl(completionUrl(baseUrl), {
        method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(90000),
      });
      if (!response.ok) throw new Error(`AI 字段识别请求失败（HTTP ${response.status}）`);
      const payload = await response.json();
      const content = payload?.choices?.[0]?.message?.content;
      if (content === undefined || content === null) throw new Error('AI 未返回字段映射');
      const parsed = parseJsonContent(content);
      return reviewingCandidates ? applyRuleReview(candidates, parsed) : parsed;
    },
  };
}
