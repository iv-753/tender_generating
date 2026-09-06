import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import test from 'node:test';
import { findAvailablePort, isMatchingInstance, resolvePortablePaths } from './runtime-state.mjs';

test('resolves all writable and executable paths inside the extracted package', () => {
  const paths = resolvePortablePaths('Z:\\delivery\\物业方案工作台-本地版');

  assert.equal(paths.node, 'Z:\\delivery\\物业方案工作台-本地版\\app\\runtime\\node.exe');
  assert.equal(paths.server, 'Z:\\delivery\\物业方案工作台-本地版\\app\\server.mjs');
  assert.equal(paths.output, 'Z:\\delivery\\物业方案工作台-本地版\\生成文件');
  assert.equal(paths.state, 'Z:\\delivery\\物业方案工作台-本地版\\app\\.runtime\\server.json');
});

test('chooses another loopback port when the preferred port is occupied', async () => {
  const occupied = createServer();
  await new Promise((resolve) => occupied.listen(0, '127.0.0.1', resolve));
  try {
    const preferredPort = occupied.address().port;
    const port = await findAvailablePort(preferredPort);
    assert.notEqual(port, preferredPort);
    assert.ok(port > 0);
  } finally {
    await new Promise((resolve) => occupied.close(resolve));
  }
});

test('accepts only the process and instance token recorded by the launcher', () => {
  const state = { pid: 123, instanceId: 'package-a', port: 4173 };
  assert.equal(isMatchingInstance(state, { status: 'ok', pid: 123, instanceId: 'package-a' }), true);
  assert.equal(isMatchingInstance(state, { status: 'ok', pid: 456, instanceId: 'package-a' }), false);
  assert.equal(isMatchingInstance(state, { status: 'ok', pid: 123, instanceId: 'other' }), false);
});
