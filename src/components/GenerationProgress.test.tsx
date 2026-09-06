// @vitest-environment jsdom

import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

import GenerationProgress from './GenerationProgress';

Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })),
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

test('advances stages and shows the slow-operation message', async () => {
  vi.useFakeTimers();
  render(<GenerationProgress
    startedAt={Date.now()}
    durationMs={40_000}
    stages={[
      { title: '读取工作表', description: '解析工作簿内容' },
      { title: '识别项目字段', description: '匹配项目基础信息' },
      { title: '核对单位与口径', description: '检查面积与数量单位' },
      { title: '整理待确认结果', description: '汇总识别结果' },
    ]}
    slowAfterMs={30_000}
    slowMessage="表格内容较多，正在继续核对"
  />);

  expect(screen.getByText('读取工作表')).toBeTruthy();
  expect(screen.queryByText('表格内容较多，正在继续核对')).toBeNull();
  await act(() => vi.advanceTimersByTimeAsync(30_000));
  expect(screen.getByText('表格内容较多，正在继续核对')).toBeTruthy();
});
