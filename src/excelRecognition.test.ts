// @vitest-environment jsdom
import { afterEach, expect, test, vi } from 'vitest';
import { recognizeExcelFile } from './excelRecognition';

const result = {
  version: 1 as const,
  provider: 'qwen',
  model: 'qwen3.7-max',
  project: { projectName: '云麓华庭', buildings: [] },
  recognition: { fields: {}, buildings: [] },
  missingFields: ['seasonalFlowerArea'],
  warnings: [],
};

afterEach(() => vi.unstubAllGlobals());

test('uploads xlsx bytes and returns the recognition payload', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  }));
  vi.stubGlobal('fetch', fetchMock);
  const file = new File(['xlsx'], '项目资料.xlsx');

  await expect(recognizeExcelFile(file)).resolves.toEqual(result);
  expect(fetchMock).toHaveBeenCalledWith('/api/excel/recognize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'X-File-Name': encodeURIComponent(file.name),
    },
    body: file,
  });
});

test('rejects unsupported or oversized files before upload', async () => {
  await expect(recognizeExcelFile(new File(['text'], '资料.xls'))).rejects.toThrow('仅支持 .xlsx 文件');
  const oversized = new File(['x'], '资料.xlsx');
  Object.defineProperty(oversized, 'size', { value: 4_000_001 });
  await expect(recognizeExcelFile(oversized)).rejects.toThrow('文件不能超过 4MB');
});

test('surfaces the server error without exposing an invalid payload', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: 'AI服务暂不可用' }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' },
  })));
  await expect(recognizeExcelFile(new File(['xlsx'], '资料.xlsx'))).rejects.toThrow('AI服务暂不可用');
});
