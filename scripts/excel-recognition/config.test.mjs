import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { loadRecognitionConfig } from './config.mjs';

test('loads a server-side Qwen key and endpoint from a BOM-prefixed settings CSV', async () => {
  const root = await mkdtemp(join(tmpdir(), 'excel-ai-config-'));
  try {
    await writeFile(join(root, 'LIMENKey（qianwen）.csv'), '\ufeffid,value\napiKey,test-secret\nopenAiCompatible,https://example.test/v1\n');
    const config = await loadRecognitionConfig({ env: {}, projectRoot: root });
    assert.equal(config.apiKey, 'test-secret');
    assert.equal(config.baseUrl, 'https://example.test/v1');
    assert.equal(config.model, 'qwen3.7-max');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
