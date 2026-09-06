import { randomUUID } from 'node:crypto';
import { closeSync, openSync } from 'node:fs';
import { access, mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { findAvailablePort, isMatchingInstance, resolvePortablePaths } from './runtime-state.mjs';

const args = process.argv.slice(2);
const rootIndex = args.indexOf('--root');
const packageRoot = rootIndex >= 0 ? args[rootIndex + 1] : resolve(import.meta.dirname, '..', '..', '..');
const noBrowser = args.includes('--no-browser');
const paths = resolvePortablePaths(packageRoot);

async function health(port) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/health`, { signal: AbortSignal.timeout(1_000) });
    return response.ok ? response.json() : null;
  } catch {
    return null;
  }
}

function openBrowser(port) {
  if (noBrowser) return;
  const url = `http://127.0.0.1:${port}/project/new`;
  const opener = spawn('cmd.exe', ['/d', '/s', '/c', 'start', '""', url], { detached: true, stdio: 'ignore', windowsHide: true });
  opener.unref();
}

async function existingState() {
  try {
    return JSON.parse(await readFile(paths.state, 'utf8'));
  } catch {
    return null;
  }
}

async function requireCompletePackage() {
  const required = [
    paths.node,
    paths.server,
    resolve(paths.app, 'dist', 'index.html'),
    resolve(paths.app, 'templates', '物业路演PPT_完整24页_v1.pptx'),
    resolve(paths.app, 'templates', '安序物业_住宅物业服务投标文件_双括号动态母版_清理版.docx'),
  ];
  for (const file of required) {
    try {
      await access(file);
    } catch {
      throw new Error(`本地包文件不完整：${file}`);
    }
  }
}

async function waitForServer(state) {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    const result = await health(state.port);
    if (isMatchingInstance(state, result)) return true;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 150));
  }
  return false;
}

async function main() {
  await requireCompletePackage();
  await mkdir(paths.runtimeState, { recursive: true });
  await mkdir(paths.output, { recursive: true });

  const previous = await existingState();
  if (previous && isMatchingInstance(previous, await health(previous.port))) {
    openBrowser(previous.port);
    process.stdout.write(`物业方案工作台已在运行：http://127.0.0.1:${previous.port}/project/new\n`);
    return;
  }
  await unlink(paths.state).catch(() => undefined);

  const state = { port: await findAvailablePort(4173), instanceId: randomUUID() };
  const log = openSync(paths.log, 'a');
  const child = spawn(paths.node, ['--no-warnings', '--experimental-wasm-modules', paths.server], {
    cwd: paths.app,
    detached: true,
    windowsHide: true,
    stdio: ['ignore', log, log],
    env: {
      ...process.env,
      PORT: String(state.port),
      INSTANCE_ID: state.instanceId,
      OUTPUT_DIR: paths.output,
      PORTABLE_MODE: '1',
      RUNTIME_NODE: paths.node,
    },
  });
  closeSync(log);
  state.pid = child.pid;
  child.unref();
  await writeFile(paths.state, JSON.stringify(state, null, 2), 'utf8');

  if (!await waitForServer(state)) {
    try { process.kill(state.pid); } catch { /* process already ended */ }
    await unlink(paths.state).catch(() => undefined);
    throw new Error(`本地服务启动失败，请查看日志：${paths.log}`);
  }

  openBrowser(state.port);
  process.stdout.write(`物业方案工作台已启动：http://127.0.0.1:${state.port}/project/new\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : '启动失败'}\n`);
  process.exitCode = 1;
});
