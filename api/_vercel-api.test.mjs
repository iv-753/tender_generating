import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { createCalculateHandler } from './calculate.mjs';
import { createExcelRecognitionHandler } from './excel/recognize.mjs';
import { createGenerationHandler } from './_lib/generation-handler.mjs';
import { createPrivateArtifactStore } from './_lib/blob-store.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const RESULT_FIXTURE = path.resolve(ROOT, '..', 'tmp', 'bid-binding-v1', 'demo-result.json');

test('Vercel calculation endpoint calls the pure calculator without loading a model', async () => {
  let calls = 0;
  const handler = createCalculateHandler({
    calculate: (project) => { calls += 1; return { project, totalActionCount: 122 }; },
    validate: () => undefined,
  });
  const project = { projectName: '演示项目' };
  const response = await handler.fetch(new Request('https://example.test/api/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { project, totalActionCount: 122 });
  assert.equal(calls, 1);
});

test('Vercel Excel endpoint rejects non-xlsx input before AI recognition', async () => {
  let calls = 0;
  const handler = createExcelRecognitionHandler({ recognize: async () => { calls += 1; } });
  const response = await handler.fetch(new Request('https://example.test/api/excel/recognize', {
    method: 'POST',
    headers: { 'X-File-Name': encodeURIComponent('项目资料.txt') },
    body: 'not-xlsx',
  }));
  assert.equal(response.status, 400);
  assert.equal(calls, 0);
});

test('Vercel document endpoint finishes in one invocation and returns a private download URL', async () => {
  const result = JSON.parse(await readFile(RESULT_FIXTURE, 'utf8'));
  const stored = [];
  const handler = createGenerationHandler({
    kind: 'presentation',
    extension: 'pptx',
    fileLabel: '路演方案',
    contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    generate: async () => ({ bytes: Buffer.from('pptx'), slides: 24 }),
    store: async (artifact) => { stored.push(artifact); return { downloadUrl: 'https://private.example/signed' }; },
  });
  const response = await handler.fetch(new Request('https://example.test/api/presentation/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result),
  }));
  assert.equal(response.status, 200);
  const job = await response.json();
  assert.equal(job.status, 'complete');
  assert.equal(job.stage, 'complete');
  assert.equal(job.slides, 24);
  assert.equal(job.downloadUrl, 'https://private.example/signed');
  assert.match(job.fileName, /增城示范花园-路演方案\.pptx$/);
  assert.equal(stored[0].access, 'private');
  assert.match(stored[0].pathname, /^generated\/presentation\/[0-9a-f-]+\/artifact\.pptx$/);
  assert.doesNotMatch(stored[0].pathname, /[^\x00-\x7F]/);
});

test('production calculation source has no workbook model loading path', async () => {
  const sources = await Promise.all([
    readFile(path.resolve(ROOT, 'api', 'calculate.mjs'), 'utf8'),
    readFile(path.resolve(ROOT, 'server.mjs'), 'utf8'),
  ]);
  for (const source of sources) {
    assert.doesNotMatch(source, /model-loader|动态成本分析模型\.xlsx|loadCostModelBytes/);
  }
});

test('artifact storage uses private Blob and a time-limited download URL', async () => {
  const calls = [];
  const store = createPrivateArtifactStore({
    putBlob: async (pathname, _bytes, options) => { calls.push(['put', pathname, options]); return { pathname }; },
    issueToken: async (options) => { calls.push(['issue', options]); return { clientSigningToken: 'client', delegationToken: 'delegation', validUntil: options.validUntil }; },
    presign: async (_token, options) => { calls.push(['presign', options]); return { presignedUrl: 'https://private.example/download' }; },
  });
  const result = await store({ pathname: 'generated/presentation/test.pptx', bytes: Buffer.alloc(6_000_000), contentType: 'application/test' });
  assert.equal(result.downloadUrl, 'https://private.example/download');
  assert.equal(calls[0][2].access, 'private');
  assert.equal(calls[0][2].multipart, true);
  assert.deepEqual(calls[1][1].operations, ['get']);
  assert.equal(calls[2][1].access, 'private');
  assert.equal(calls[2][1].operation, 'get');
  assert.ok(result.validUntil > Date.now());
});

test('Vercel configuration keeps API routes and rewrites SPA pages', async () => {
  const config = JSON.parse(await readFile(path.resolve(ROOT, 'vercel.json'), 'utf8'));
  assert.equal(config.framework, 'vite');
  assert.equal(config.outputDirectory, 'dist');
  assert.match(config.functions['api/presentation/jobs.mjs'].includeFiles, /\.pptx$/);
  assert.match(config.functions['api/bid/jobs.mjs'].includeFiles, /\.docx$/);
  assert.deepEqual(config.rewrites.at(-1), { source: '/((?!api/).*)', destination: '/index.html' });
});
