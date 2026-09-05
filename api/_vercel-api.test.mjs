import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { createCalculateHandler } from './calculate.mjs';
import { createExcelRecognitionHandler } from './excel/recognize.mjs';
import { createGenerationHandler } from './_lib/generation-handler.mjs';
import { createPrivateArtifactStore } from './_lib/blob-store.mjs';
import { resultValidationError } from './_lib/result-validation.mjs';
import { cloneResult, fullResult } from '../scripts/test-fixtures/full-result.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
test('Vercel calculation endpoint calls the pure calculator without loading a model', async () => {
  let calls = 0;
  const handler = createCalculateHandler({
    calculate: (project) => { calls += 1; return { project, version: 2, standardActionCount: 452 }; },
    validate: () => undefined,
  });
  const project = { projectName: '演示项目' };
  const response = await handler.fetch(new Request('https://example.test/api/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  }));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { project, version: 2, standardActionCount: 452 });
  assert.equal(calls, 1);
});

test('adjusted calculation rebuilds the baseline before applying user changes', async () => {
  const { createAdjustedCalculateHandler } = await import('./calculate-adjusted.mjs');
  const calls = [];
  const handler = createAdjustedCalculateHandler({
    calculate: (project) => { calls.push(['calculate', project]); return { project, actions: [], categories: [], annualCost: 10 }; },
    apply: (baseline, adjustments) => { calls.push(['apply', baseline, adjustments]); return { ...baseline, annualCost: 20 }; },
    validate: () => undefined,
  });
  const body = {
    project: { projectName: '演示项目' },
    adjustments: { version: 1, overrides: {}, customActions: [] },
  };
  const response = await handler.fetch(new Request('https://example.test/api/calculate-adjusted', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }));

  assert.equal(response.status, 200);
  assert.equal((await response.json()).annualCost, 20);
  assert.deepEqual(calls.map(([name]) => name), ['calculate', 'apply']);
  assert.deepEqual(calls[1][2], body.adjustments);
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
  const result = fullResult();
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
  assert.equal(stored[0].downloadFileName, '增城示范花园-路演方案.pptx');
});

test('generation accepts stopped standard actions and custom actions while preserving the 452-action inventory', async () => {
  const result = fullResult();
  result.actions = [
    ...result.actions.map((item) => item.id === 'service-5'
      ? { ...item, source: 'baseline', enabled: false, annualFrequency: 0, annualCost: 0 }
      : { ...item, source: 'baseline', enabled: true }),
    { id: 'custom-service-demo', category: 'service', action: '自定义动作', source: 'custom', enabled: true, annualCost: 100 },
  ];
  result.totalActionCount = result.actions.length;
  result.activeActionCount = result.actions.filter((item) => item.enabled !== false).length;
  result.categories = result.categories.map((summary) => summary.category === 'service'
    ? { ...summary, actionCount: summary.actionCount, annualCost: summary.annualCost + 100, workloadAnnualCost: summary.workloadAnnualCost + 100 }
    : summary);
  result.annualCost += 100;
  result.workloadAnnualCost += 100;
  const handler = createGenerationHandler({
    kind: 'bid', extension: 'docx', fileLabel: '投标标书', contentType: 'application/test',
    generate: async () => ({ bytes: Buffer.from('docx'), actionCount: 109 }),
    store: async () => ({ downloadUrl: 'https://private.example/signed' }),
  });

  const response = await handler.fetch(new Request('https://example.test/api/bid/jobs', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(result),
  }));

  assert.equal(response.status, 200);
});

test('accepts an authentic complete V2 result', () => {
  const result = fullResult();
  assert.equal(result.advancedParameters.length, 90);
  assert.equal(resultValidationError(result), undefined);
});

const invalidCases = [
  ['少一个标准动作', (result) => { result.actions.pop(); result.totalActionCount -= 1; result.activeActionCount -= 1; }, /标准动作必须完整包含 452 项/],
  ['标准动作编号重复', (result) => { result.actions[1].id = result.actions[0].id; }, /标准动作编号必须唯一/],
  ['缺少一个分类', (result) => { result.categories.pop(); }, /服务分类必须完整包含 7 类/],
  ['标准动作数声明错误', (result) => { result.standardActionCount = 451; }, /标准动作数必须为 452/],
  ['契约版本不是 2', (result) => { result.version = 1; }, /测算结果版本必须为 2/],
  ['缺少高级参数快照', (result) => { delete result.advancedParameters; }, /缺少高级参数快照/],
  ['缺少管理成本', (result) => { delete result.management; }, /缺少有效管理成本/],
];

for (const [name, mutate, expected] of invalidCases) {
  test(`rejects V2 result when ${name}`, () => {
    const result = cloneResult();
    mutate(result);
    assert.match(resultValidationError(result), expected);
  });
}

test('rejects inconsistent V2 totals with a clear Chinese error', () => {
  const result = fullResult();
  result.annualCost += 1;
  assert.match(resultValidationError(result), /年度总成本与分类及管理成本不一致/);
});

test('rejects unstable categories, duplicate advanced keys, and invalid snapshot values', () => {
  const unstable = fullResult();
  unstable.actions[0].category = 'cleaning';
  assert.match(resultValidationError(unstable), /标准动作编号或分类不稳定/);

  const duplicateParameter = fullResult();
  duplicateParameter.advancedParameters[1].key = duplicateParameter.advancedParameters[0].key;
  assert.match(resultValidationError(duplicateParameter), /高级参数编号重复/);

  const invalidParameter = fullResult();
  invalidParameter.advancedParameters[0].value = -1;
  assert.match(resultValidationError(invalidParameter), /高级参数快照值无效/);
});

test('rejects mismatched total, active, category, and headcount summaries', () => {
  const total = fullResult();
  total.totalActionCount -= 1;
  assert.match(resultValidationError(total), /动作总数与动作明细不一致/);

  const active = fullResult();
  active.activeActionCount -= 1;
  assert.match(resultValidationError(active), /当前启用动作数与动作明细不一致/);

  const category = fullResult();
  category.categories[0].actionCount -= 1;
  assert.match(resultValidationError(category), /服务分类动作数量不一致/);

  const headcount = fullResult();
  headcount.totalHeadcount += 1;
  assert.match(resultValidationError(headcount), /项目总人数与分类及管理人数不一致/);
});

test('accepts any number of custom actions without counting them toward the 452 standards', () => {
  for (const customCount of [0, 1, 3]) {
    const result = fullResult();
    const customActions = Array.from({ length: customCount }, (_, index) => ({
      ...result.actions[0],
      id: `custom-service-${index}`,
      source: 'custom',
      annualCost: 0,
    }));
    result.actions.push(...customActions);
    result.totalActionCount = result.actions.length;
    result.activeActionCount = result.actions.filter((item) => item.enabled !== false).length;
    result.categories[0].actionCount += customCount;
    assert.equal(resultValidationError(result), undefined);
  }
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

test('artifact storage uses Vercel signing without requiring a custom download secret', async () => {
  const calls = [];
  const store = createPrivateArtifactStore({
    putBlob: async (pathname, _bytes, options) => { calls.push(['put', pathname, options]); return { pathname }; },
    issueToken: async (options) => { calls.push(['issue', options]); return { clientSigningToken: 'client', delegationToken: 'delegation', validUntil: options.validUntil }; },
    presign: async (_token, options) => { calls.push(['presign', options]); return { presignedUrl: 'https://store.private.blob.vercel-storage.com/generated/presentation/test.pptx?signature=test' }; },
  });
  const result = await store({ pathname: 'generated/presentation/test.pptx', downloadFileName: '示范项目-路演方案.pptx', bytes: Buffer.alloc(6_000_000), contentType: 'application/test' });
  const downloadUrl = new URL(result.downloadUrl, 'https://example.test');
  assert.equal(downloadUrl.pathname, '/api/artifacts/download');
  assert.equal(downloadUrl.searchParams.get('filename'), '示范项目-路演方案.pptx');
  assert.match(downloadUrl.searchParams.get('source'), /^https:\/\/store\.private\.blob\.vercel-storage\.com\//);
  assert.equal(calls[0][2].access, 'private');
  assert.equal(calls[0][2].multipart, true);
  assert.deepEqual(calls[1][1].operations, ['get']);
  assert.equal(calls[2][1].operation, 'get');
  assert.ok(result.validUntil > Date.now());
});

test('artifact download endpoint returns the generated Chinese filename', async () => {
  const artifactDownload = await import('./_lib/artifact-download.mjs');
  assert.equal(typeof artifactDownload.createArtifactDownloadHandler, 'function');
  const sourceUrl = 'https://store.private.blob.vercel-storage.com/generated/bid/123e4567-e89b-12d3-a456-426614174000/artifact.docx?signature=test';
  const downloadUrl = artifactDownload.createArtifactDownloadUrl({
    sourceUrl,
    fileName: '增城示范花园-投标标书.docx',
  });
  const handler = artifactDownload.createArtifactDownloadHandler({
    fetchSource: async (url) => {
      assert.equal(url, sourceUrl);
      return new Response('docx', { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' } });
    },
  });
  const response = await handler.fetch(new Request(`https://example.test${downloadUrl}`));

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-disposition'), /filename\*=UTF-8''%E5%A2%9E%E5%9F%8E%E7%A4%BA%E8%8C%83%E8%8A%B1%E5%9B%AD-%E6%8A%95%E6%A0%87%E6%A0%87%E4%B9%A6\.docx/);
  assert.equal(await response.text(), 'docx');
});

test('Vercel configuration keeps API routes and rewrites SPA pages', async () => {
  const config = JSON.parse(await readFile(path.resolve(ROOT, 'vercel.json'), 'utf8'));
  assert.equal(config.framework, 'vite');
  assert.equal(config.outputDirectory, 'dist');
  assert.match(config.functions['api/presentation/jobs.mjs'].includeFiles, /\.pptx$/);
  assert.match(config.functions['api/bid/jobs.mjs'].includeFiles, /\.docx$/);
  assert.deepEqual(config.rewrites.at(-1), { source: '/((?!api/).*)', destination: '/index.html' });
});
