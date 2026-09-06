import { RECOGNITION_JSON_SCHEMA, recognitionPrompt } from './schema.mjs';

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
    async mapWorkbook(workbookText, candidates) {
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
      if (supportsJsonSchema) body.response_format = { type: 'json_schema', json_schema: RECOGNITION_JSON_SCHEMA };

      const response = await fetchImpl(completionUrl(baseUrl), {
        method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(90000),
      });
      if (!response.ok) throw new Error(`AI 字段识别请求失败（HTTP ${response.status}）`);
      const payload = await response.json();
      const content = payload?.choices?.[0]?.message?.content;
      if (content === undefined || content === null) throw new Error('AI 未返回字段映射');
      return parseJsonContent(content);
    },
  };
}
