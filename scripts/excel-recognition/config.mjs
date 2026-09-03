import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function parseCsvLine(line) {
  const values = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && quoted && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') quoted = !quoted;
    else if (character === ',' && !quoted) {
      values.push(value);
      value = '';
    } else value += character;
  }
  values.push(value);
  return values;
}

async function readBundledQwenSettings(projectRoot) {
  const names = await readdir(projectRoot).catch(() => []);
  const fileName = names.find((name) => /(?:qianwen|limenkey).*\.csv$/i.test(name));
  if (!fileName) return {};
  const lines = (await readFile(resolve(projectRoot, fileName), 'utf8')).split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return {};
  const headers = parseCsvLine(lines[0].replace(/^\uFEFF/, ''));
  const idIndex = headers.indexOf('id');
  const valueIndex = headers.findIndex((_, index) => index !== idIndex);
  if (idIndex < 0 || valueIndex < 0) return {};
  return Object.fromEntries(lines.slice(1).map(parseCsvLine).map((row) => [row[idIndex], row[valueIndex]]).filter(([key, value]) => key && value));
}

export async function loadRecognitionConfig({ env = process.env, projectRoot } = {}) {
  const provider = env.AI_PROVIDER || 'qwen';
  if (provider === 'local') {
    return {
      provider,
      apiKey: env.AI_API_KEY || undefined,
      baseUrl: env.AI_BASE_URL || 'http://127.0.0.1:11434/v1',
      model: env.AI_MODEL || 'local-model',
      supportsJsonSchema: env.AI_SUPPORTS_JSON_SCHEMA === 'true',
    };
  }

  const bundled = projectRoot ? await readBundledQwenSettings(projectRoot) : {};
  return {
    provider,
    apiKey: env.QWEN_API_KEY || env.AI_API_KEY || bundled.apiKey,
    baseUrl: env.AI_BASE_URL || bundled.openAiCompatible || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: env.AI_MODEL || 'qwen3.7-max',
    supportsJsonSchema: env.AI_SUPPORTS_JSON_SCHEMA !== 'false',
  };
}
