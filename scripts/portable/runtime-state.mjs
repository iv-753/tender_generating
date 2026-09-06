import { createServer } from 'node:net';
import { resolve } from 'node:path';

export function resolvePortablePaths(packageRoot) {
  const root = resolve(packageRoot);
  const app = resolve(root, 'app');
  const runtimeState = resolve(app, '.runtime');
  return {
    root,
    app,
    node: resolve(app, 'runtime', 'node.exe'),
    server: resolve(app, 'server.mjs'),
    output: resolve(root, '生成文件'),
    runtimeState,
    state: resolve(runtimeState, 'server.json'),
    log: resolve(runtimeState, 'server.log'),
  };
}

function reservePort(port) {
  return new Promise((resolvePromise, reject) => {
    const server = createServer();
    server.unref();
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => resolvePromise(address.port));
    });
  });
}

export async function findAvailablePort(preferredPort = 4173) {
  try {
    return await reservePort(preferredPort);
  } catch {
    return reservePort(0);
  }
}

export function isMatchingInstance(state, health) {
  return health?.status === 'ok'
    && Number(health.pid) === Number(state?.pid)
    && health.instanceId === state?.instanceId;
}
