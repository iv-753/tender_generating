import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test, { after, before } from 'node:test';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const FIXTURE = path.resolve(ROOT, 'outputs', '01a065d6-excel-import', '02-多工作表与异常口径.xlsx');
const API_PORT = 45000 + (process.pid % 500);
const MODEL_PORT = API_PORT + 500;
const BASE_URL = `http://127.0.0.1:${API_PORT}`;
let appServer;
let modelServer;
let logs = '';

const ref = (sheet, cell) => ({ sheet, cell, confidence: 0.97, note: '测试映射' });
const absent = { sheet: null, cell: null, confidence: 0, note: '原表未提供' };
const mapping = {
  fields: {
    projectName: ref('项目总览', 'E5'), region: ref('项目总览', 'E6'), city: ref('项目总览', 'E6'),
    serviceGrade: ref('项目总览', 'E13'), residentialChargeArea: ref('项目总览', 'E8'),
    seasonalFlowerArea: absent,
  },
  buildings: [],
};

before(async () => {
  modelServer = createServer(async (request, response) => {
    for await (const _chunk of request) { /* consume request */ }
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ choices: [{ message: { content: JSON.stringify(mapping) } }] }));
  });
  await new Promise((resolve) => modelServer.listen(MODEL_PORT, '127.0.0.1', resolve));

  appServer = spawn(process.execPath, ['--no-warnings', '--experimental-wasm-modules', 'server.mjs'], {
    cwd: ROOT,
    env: {
      ...process.env,
      PORT: String(API_PORT),
      AI_PROVIDER: 'local',
      AI_BASE_URL: `http://127.0.0.1:${MODEL_PORT}/v1`,
      AI_MODEL: 'fixture-model',
      AI_SUPPORTS_JSON_SCHEMA: 'false',
    },
    windowsHide: true,
  });
  appServer.stdout.setEncoding('utf8');
  appServer.stderr.setEncoding('utf8');
  appServer.stdout.on('data', (chunk) => { logs += chunk; });
  appServer.stderr.on('data', (chunk) => { logs += chunk; });
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

after(async () => {
  appServer?.kill();
  await new Promise((resolve) => modelServer?.close(resolve));
});

test('recognizes an uploaded Excel workbook through the provider-neutral API', async () => {
  const response = await fetch(`${BASE_URL}/api/excel/recognize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'X-File-Name': encodeURIComponent('02-多工作表与异常口径.xlsx'),
    },
    body: await readFile(FIXTURE),
  });
  assert.equal(response.status, 200, response.status === 200 ? '' : await response.clone().text());
  const result = await response.json();
  assert.equal(result.provider, 'local');
  assert.equal(result.project.projectName, '云麓华庭');
  assert.equal(result.project.city, '杭州');
  assert.equal(result.project.costBand, 'high');
  assert.equal(result.project.residentialChargeArea, 108000);
  assert.equal(result.project.seasonalFlowerArea, null);
  assert.ok(result.missingFields.includes('seasonalFlowerArea'));
});

test('rejects a non-xlsx upload before calling the model', async () => {
  const response = await fetch(`${BASE_URL}/api/excel/recognize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream', 'X-File-Name': encodeURIComponent('notes.txt') },
    body: 'not an xlsx',
  });
  assert.equal(response.status, 400);
});
