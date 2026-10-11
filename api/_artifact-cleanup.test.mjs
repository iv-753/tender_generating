import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { createArtifactCleanup } from './_lib/artifact-cleanup.mjs';
import { createArtifactCleanupHandler } from './artifacts/cleanup.mjs';

const NOW = Date.parse('2026-10-11T12:00:00Z');
const DAY = 24 * 60 * 60 * 1000;
const GRACE = 5 * 60 * 1000;
const ID = '123e4567-e89b-42d3-a456-426614174000';
const ppt = `generated/presentation/${ID}/artifact.pptx`;
const bid = `generated/bid/${ID}/artifact.docx`;
const blob = (pathname, age = DAY + GRACE + 1) => ({
  pathname, size: 33_000_000, uploadedAt: new Date(NOW - age),
});

test('cleans only expired generated documents across all pages, preserving everything else', async () => {
  const events = [];
  const pages = [
    { blobs: [blob(ppt), blob('models/cost.xlsx'), blob(`generated/presentation/${ID}/template.pptx`)], hasMore: true, cursor: 'page-2' },
    { blobs: [blob(bid), blob(`generated/bid/${ID}/artifact.pptx`), blob('generated/other/file.pptx')], hasMore: false },
  ];
  const cleanup = createArtifactCleanup({
    listBlobs: async (options) => {
      events.push(['list', options]);
      return pages.shift();
    },
    deleteBlobs: async (paths) => events.push(['delete', paths]),
  });
  const stats = await cleanup({ now: NOW });
  assert.deepEqual(events.map(([type]) => type), ['list', 'list', 'delete']);
  assert.equal(events[0][1].prefix, 'generated/');
  assert.equal(events[1][1].cursor, 'page-2');
  assert.deepEqual(events[2][1], [ppt, bid]);
  assert.deepEqual(stats, { scanned: 6, deleted: 2, deletedBytes: 66_000_000 });
});

test('preserves unexpired files, legacy signing grace, and missing or invalid timestamps', async () => {
  const cleanup = createArtifactCleanup({
    listBlobs: async () => ({ blobs: [
      blob(ppt, DAY - 1), blob(ppt, DAY), blob(ppt, DAY + GRACE - 1),
      blob(ppt, -DAY), { pathname: ppt },
      { ...blob(ppt), uploadedAt: 'invalid' },
      { ...blob(ppt), uploadedAt: null },
    ], hasMore: false }),
    deleteBlobs: async () => assert.fail('must not delete any protected file'),
  });
  assert.equal((await cleanup({ now: NOW })).deleted, 0);
});

test('deletes at the retention boundary and sends a shared abort signal', async () => {
  const signal = new AbortController().signal;
  const cleanup = createArtifactCleanup({
    listBlobs: async (options) => {
      assert.equal(options.abortSignal, signal);
      return { blobs: [blob(ppt, DAY + GRACE)], hasMore: false };
    },
    deleteBlobs: async (paths, options) => {
      assert.deepEqual(paths, [ppt]);
      assert.equal(options.abortSignal, signal);
    },
  });
  assert.equal((await cleanup({ now: NOW, abortSignal: signal })).deleted, 1);
});

test('dry run reports eligible files without deleting them', async () => {
  const cleanup = createArtifactCleanup({
    listBlobs: async () => ({ blobs: [blob(ppt), blob(bid, 1000)], hasMore: false }),
    deleteBlobs: async () => assert.fail('dry run must not delete files'),
  });
  assert.deepEqual(await cleanup({ now: NOW, dryRun: true }), {
    scanned: 2, deleted: 0, deletedBytes: 0, eligible: 1, eligibleBytes: 33_000_000, dryRun: true,
  });
});

test('an incomplete listing aborts before deleting anything', async () => {
  const cleanup = createArtifactCleanup({
    listBlobs: async () => ({ blobs: [blob(ppt)], hasMore: true }),
    deleteBlobs: async () => assert.fail('must finish listing before deletion'),
  });
  await assert.rejects(cleanup({ now: NOW }), /cursor/i);
});

test('storage failures are propagated instead of reporting cleanup success', async () => {
  const cleanup = createArtifactCleanup({
    listBlobs: async () => ({ blobs: [blob(ppt)], hasMore: false }),
    deleteBlobs: async () => { throw new Error('delete failed'); },
  });
  await assert.rejects(cleanup({ now: NOW }), /delete failed/);
});

test('cleanup is repeatable and deletes in bounded batches', async () => {
  let files = Array.from({ length: 205 }, (_, i) => blob(
    `generated/presentation/123e4567-e89b-42d3-a456-${String(i).padStart(12, '0')}/artifact.pptx`,
  ));
  const batches = [];
  const cleanup = createArtifactCleanup({
    listBlobs: async () => ({ blobs: [...files], hasMore: false }),
    deleteBlobs: async (paths) => {
      batches.push(paths.length);
      files = files.filter((file) => !paths.includes(file.pathname));
    },
  });
  assert.equal((await cleanup({ now: NOW })).deleted, 205);
  assert.deepEqual(batches, [100, 100, 5]);
  assert.equal((await cleanup({ now: NOW })).deleted, 0);
});

test('cron rejects missing configuration, missing credentials, wrong credentials and other methods', async () => {
  const cleanup = async () => assert.fail('unauthorized request must not touch storage');
  const request = (method = 'GET', authorization) => new Request('https://example.test/api/artifacts/cleanup', {
    method, headers: authorization ? { Authorization: authorization } : {},
  });
  assert.equal((await createArtifactCleanupHandler({ cleanup, getSecret: () => undefined }).fetch(request())).status, 503);
  const handler = createArtifactCleanupHandler({ cleanup, getSecret: () => 'test-secret' });
  assert.equal((await handler.fetch(request())).status, 401);
  assert.equal((await handler.fetch(request('GET', 'Bearer invalid'))).status, 401);
  assert.equal((await handler.fetch(request('POST', 'Bearer test-secret'))).status, 405);
});

test('authenticated cron awaits cleanup and returns non-cacheable statistics', async () => {
  const stats = { scanned: 3, deleted: 2, deletedBytes: 66_000_000 };
  let completed = false;
  const handler = createArtifactCleanupHandler({
    getSecret: () => 'test-secret',
    cleanup: async ({ abortSignal }) => {
      assert.ok(abortSignal instanceof AbortSignal);
      await Promise.resolve();
      completed = true;
      return stats;
    },
  });
  const response = await handler.fetch(new Request('https://example.test/api/artifacts/cleanup', {
    headers: { Authorization: 'Bearer test-secret' },
  }));
  assert.equal(completed, true);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), stats);
});

test('failed cron returns a failure status without exposing internal errors', async () => {
  const handler = createArtifactCleanupHandler({
    getSecret: () => 'test-secret',
    cleanup: async () => { throw new Error('private storage credentials'); },
  });
  const response = await handler.fetch(new Request('https://example.test/api/artifacts/cleanup', {
    headers: { Authorization: 'Bearer test-secret' },
  }));
  assert.equal(response.status, 500);
  assert.doesNotMatch(await response.text(), /private storage credentials/);
});

test('authenticated dry-run requests cannot perform deletion', async () => {
  const handler = createArtifactCleanupHandler({
    getSecret: () => 'test-secret',
    cleanup: async ({ dryRun }) => { assert.equal(dryRun, true); return { dryRun }; },
  });
  const response = await handler.fetch(new Request('https://example.test/api/artifacts/cleanup?dryRun=1', {
    headers: { Authorization: 'Bearer test-secret' },
  }));
  assert.equal(response.status, 200);
});

test('production cron runs once daily on the cleanup route with bounded duration', async () => {
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
  assert.deepEqual(config.crons, [{ path: '/api/artifacts/cleanup', schedule: '0 19 * * *' }]);
  assert.equal(config.functions['api/artifacts/cleanup.mjs'].maxDuration, 60);
});
