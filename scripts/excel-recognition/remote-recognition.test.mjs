import assert from 'node:assert/strict';
import test from 'node:test';
import { recognizeExcelRemotely } from './remote-recognition.mjs';

test('forwards workbook bytes to the fixed official recognition endpoint', async () => {
  let request;
  const expected = { version: 1, project: {}, missingFields: [], warnings: [] };
  const result = await recognizeExcelRemotely(Buffer.from('xlsx'), {
    fileName: '项目资料.xlsx',
    fetchImpl: async (url, init) => {
      request = { url, init };
      return new Response(JSON.stringify(expected), { status: 200, headers: { 'Content-Type': 'application/json' } });
    },
  });

  assert.equal(request.url, 'https://www.zhiyingtupu.website/api/excel/recognize');
  assert.equal(request.init.method, 'POST');
  assert.equal(request.init.headers['X-File-Name'], encodeURIComponent('项目资料.xlsx'));
  assert.deepEqual(request.init.body, Buffer.from('xlsx'));
  assert.deepEqual(result, expected);
});

test('turns an unavailable online service into a fallback-safe error', async () => {
  await assert.rejects(
    () => recognizeExcelRemotely(Buffer.from('xlsx'), {
      fileName: '项目资料.xlsx',
      fetchImpl: async () => new Response(JSON.stringify({ error: '服务繁忙' }), { status: 503 }),
    }),
    /线上智能识别暂时不可用/,
  );
});

test('rejects a malformed online recognition response', async () => {
  await assert.rejects(
    () => recognizeExcelRemotely(Buffer.from('xlsx'), {
      fileName: '项目资料.xlsx',
      fetchImpl: async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
    }),
    /无效结果/,
  );
});
