import assert from 'node:assert/strict';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import test from 'node:test';

const ROOT = resolve('tmp', `portable-control-${process.pid}`);
const START = resolve('scripts', 'portable', 'start.mjs');
const STOP = resolve('scripts', 'portable', 'stop.mjs');

function run(script) {
  return new Promise((resolvePromise) => {
    const child = spawn(process.execPath, [script, '--root', ROOT, '--no-browser'], { windowsHide: true });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.stderr.on('data', (chunk) => { output += chunk; });
    child.on('close', (code) => resolvePromise({ code, output }));
  });
}

test('starts one background instance, reuses it, and stops only that instance', async () => {
  await rm(ROOT, { recursive: true, force: true });
  await mkdir(resolve(ROOT, 'app', 'runtime'), { recursive: true });
  await mkdir(resolve(ROOT, 'app', 'dist'), { recursive: true });
  await mkdir(resolve(ROOT, 'app', 'templates'), { recursive: true });
  await copyFile(process.execPath, resolve(ROOT, 'app', 'runtime', 'node.exe'));
  await writeFile(resolve(ROOT, 'app', 'dist', 'index.html'), '<!doctype html>');
  await writeFile(resolve(ROOT, 'app', 'templates', '物业路演PPT_完整24页_v1.pptx'), 'fixture');
  await writeFile(resolve(ROOT, 'app', 'templates', '安序物业_住宅物业服务投标文件_双括号动态母版_清理版.docx'), 'fixture');
  await writeFile(resolve(ROOT, 'app', 'server.mjs'), `
    import { createServer } from 'node:http';
    const port = Number(process.env.PORT);
    const payload = JSON.stringify({ status: 'ok', pid: process.pid, instanceId: process.env.INSTANCE_ID });
    createServer((request, response) => {
      response.writeHead(request.url === '/api/health' ? 200 : 404, { 'Content-Type': 'application/json' });
      response.end(request.url === '/api/health' ? payload : '{}');
    }).listen(port, '127.0.0.1');
  `);

  try {
    const first = await run(START);
    assert.equal(first.code, 0, first.output);
    const firstState = JSON.parse(await readFile(resolve(ROOT, 'app', '.runtime', 'server.json'), 'utf8'));
    assert.equal((await fetch(`http://127.0.0.1:${firstState.port}/api/health`)).status, 200);

    const second = await run(START);
    assert.equal(second.code, 0, second.output);
    const secondState = JSON.parse(await readFile(resolve(ROOT, 'app', '.runtime', 'server.json'), 'utf8'));
    assert.equal(secondState.pid, firstState.pid);

    const stopped = await run(STOP);
    assert.equal(stopped.code, 0, stopped.output);
    await assert.rejects(() => fetch(`http://127.0.0.1:${firstState.port}/api/health`));
  } finally {
    await run(STOP);
    await rm(ROOT, { recursive: true, force: true });
  }
});
