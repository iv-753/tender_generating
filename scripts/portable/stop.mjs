import { readFile, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isMatchingInstance, resolvePortablePaths } from './runtime-state.mjs';

const args = process.argv.slice(2);
const rootIndex = args.indexOf('--root');
const packageRoot = rootIndex >= 0 ? args[rootIndex + 1] : resolve(import.meta.dirname, '..', '..', '..');
const paths = resolvePortablePaths(packageRoot);

async function health(port) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/health`, { signal: AbortSignal.timeout(1_000) });
    return response.ok ? response.json() : null;
  } catch {
    return null;
  }
}

async function main() {
  let state;
  try {
    state = JSON.parse(await readFile(paths.state, 'utf8'));
  } catch {
    process.stdout.write('物业方案工作台当前未运行。\n');
    return;
  }

  const current = await health(state.port);
  if (!isMatchingInstance(state, current)) {
    await unlink(paths.state).catch(() => undefined);
    process.stdout.write('物业方案工作台当前未运行。\n');
    return;
  }

  process.kill(state.pid);
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline && isMatchingInstance(state, await health(state.port))) {
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 100));
  }
  await unlink(paths.state).catch(() => undefined);
  process.stdout.write('物业方案工作台已关闭。\n');
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : '关闭失败'}\n`);
  process.exitCode = 1;
});
