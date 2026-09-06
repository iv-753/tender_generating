import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { PARITY_PROJECTS } from '../calculation/fixtures/parity-projects.mjs';

const packageRoot = resolve(process.argv[2]);
const state = JSON.parse(await readFile(resolve(packageRoot, 'app', '.runtime', 'server.json'), 'utf8'));
const baseUrl = `http://127.0.0.1:${state.port}`;

async function jsonRequest(path, init) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const payload = await response.json().catch(() => null);
  assert.equal(response.ok, true, `${path}: ${JSON.stringify(payload)}`);
  return payload;
}

async function waitForJob(kind, jobId) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const job = await jsonRequest(`/api/${kind}/jobs/${jobId}`);
    if (job.status === 'complete') return job;
    assert.notEqual(job.status, 'error', job.error);
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 200));
  }
  throw new Error(`${kind} 生成超时`);
}

const health = await jsonRequest('/api/health');
assert.equal(health.instanceId, state.instanceId);
const page = await fetch(`${baseUrl}/project/new`);
assert.equal(page.status, 200);
assert.match(await page.text(), /id="root"/);

const result = await jsonRequest('/api/calculate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(PARITY_PROJECTS[0]),
});
assert.equal(result.standardActionCount, 452);

const presentation = await jsonRequest('/api/presentation/jobs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(result),
});
const completedPresentation = await waitForJob('presentation', presentation.jobId);
assert.equal(completedPresentation.slides, 24);

const bid = await jsonRequest('/api/bid/jobs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(result),
});
const completedBid = await waitForJob('bid', bid.jobId);
assert.ok(completedBid.actionCount > 0);

const outputNames = await readdir(resolve(packageRoot, '生成文件'));
assert.ok(outputNames.some((name) => name.endsWith('.pptx')));
assert.ok(outputNames.some((name) => name.endsWith('.docx')));
process.stdout.write(JSON.stringify({
  page: 'ok',
  calculationActions: result.standardActionCount,
  presentationSlides: completedPresentation.slides,
  bidActions: completedBid.actionCount,
  outputDirectory: resolve(packageRoot, '生成文件'),
}, null, 2));
