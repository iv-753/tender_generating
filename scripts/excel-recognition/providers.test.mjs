import assert from 'node:assert/strict';
import test from 'node:test';
import { createRecognitionProvider } from './providers.mjs';

test('qwen adapter uses an OpenAI-compatible structured-output request', async () => {
  let captured;
  const fetchImpl = async (url, options) => {
    captured = { url, options, body: JSON.parse(options.body) };
    return new Response(JSON.stringify({
      choices: [{ message: { content: '```json\n{"fieldCorrections":[],"removeBuildingIndexes":[],"buildingCorrections":[],"newBuildings":[]}\n```' } }],
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };
  const provider = createRecognitionProvider({
    provider: 'qwen', apiKey: 'server-only-secret', baseUrl: 'https://example.test/v1', model: 'qwen3.7-max', fetchImpl,
  });
  const result = await provider.mapWorkbook('工作表：测试\nA1=项目名称', {
    fields: { projectName: [{ sheet: '测试', cell: 'B1', labelCell: 'A1', score: 0.99, reason: '项目名称' }], city: [] },
    buildings: [],
    conflicts: [],
  });

  assert.equal(result.fields.projectName.cell, 'B1');
  assert.equal(result.fields.city.cell, null);
  assert.equal(captured.url, 'https://example.test/v1/chat/completions');
  assert.equal(captured.options.headers.Authorization, 'Bearer server-only-secret');
  assert.equal(captured.body.model, 'qwen3.7-max');
  assert.equal(captured.body.response_format.type, 'json_schema');
  assert.equal(captured.body.response_format.json_schema.name, 'property_excel_mapping_review');
  const messages = JSON.stringify(captured.body.messages);
  assert.match(messages, /规则候选映射/);
  assert.match(messages, /工作表：测试/);
  assert.match(messages, /\[\\"测试\\",\\"B1\\",0\.99\]/);
  assert.doesNotMatch(messages, /labelCell|reason|\\"city\\":\[\]/);
  assert.equal(JSON.stringify(captured.body).includes('server-only-secret'), false);
});

test('local adapter keeps the same contract and allows an endpoint without an API key', async () => {
  let authorization;
  const provider = createRecognitionProvider({
    provider: 'local', baseUrl: 'http://127.0.0.1:11434/v1', model: 'local-model', supportsJsonSchema: false,
    fetchImpl: async (_url, options) => {
      authorization = options.headers.Authorization;
      return new Response(JSON.stringify({ choices: [{ message: { content: '{"fields":{},"buildings":[]}' } }] }), { status: 200 });
    },
  });
  assert.deepEqual(await provider.mapWorkbook('A1=测试'), { fields: {}, buildings: [] });
  assert.equal(authorization, undefined);
});
