import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import test, { after, before } from 'node:test';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const FIXTURE = path.resolve(ROOT, '..', 'tmp', 'bid-binding-v1', 'demo-result.json');
const PORT = 43000 + (process.pid % 1000);
const BASE_URL = `http://127.0.0.1:${PORT}`;
let server;
let logs = '';

before(async () => {
  server = spawn(process.execPath, ['--no-warnings', '--experimental-wasm-modules', 'server.mjs'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT), RUNTIME_NODE: process.execPath },
    windowsHide: true,
  });
  server.stdout.setEncoding('utf8');
  server.stderr.setEncoding('utf8');
  server.stdout.on('data', (chunk) => { logs += chunk; });
  server.stderr.on('data', (chunk) => { logs += chunk; });
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      if ((await fetch(`${BASE_URL}/`)).ok) return;
    } catch {
      // Server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`测试服务器未启动：${logs}`);
});

after(() => server?.kill());

test('creates, completes, and downloads a Word bid job', async () => {
  const result = JSON.parse(await readFile(FIXTURE, 'utf8'));
  const createdResponse = await fetch(`${BASE_URL}/api/bid/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result),
  });
  assert.equal(createdResponse.status, 202);
  let job = await createdResponse.json();
  assert.equal(job.status, 'running');

  for (let attempt = 0; attempt < 100 && job.status === 'running'; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    const response = await fetch(`${BASE_URL}/api/bid/jobs/${job.jobId}`);
    assert.equal(response.status, 200);
    job = await response.json();
  }
  assert.equal(job.status, 'complete', job.error || logs);
  assert.match(job.fileName, /增城示范花园-投标标书\.docx$/);

  const download = await fetch(`${BASE_URL}${job.downloadUrl}`);
  assert.equal(download.status, 200);
  assert.match(download.headers.get('content-type') || '', /wordprocessingml/);
  const bytes = Buffer.from(await download.arrayBuffer());
  assert.equal(bytes.subarray(0, 2).toString(), 'PK');
});

test('rejects an incomplete bid result', async () => {
  const result = JSON.parse(await readFile(FIXTURE, 'utf8'));
  result.actions.pop();
  const response = await fetch(`${BASE_URL}/api/bid/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(result),
  });
  assert.equal(response.status, 400);
});
