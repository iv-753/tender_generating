// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

vi.mock('./workbookCalculator', () => ({ calculateProject: vi.fn() }));
import App from './App';
import { EXAMPLE_PROJECT } from './exampleProject';
import { storage } from './storage';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, 'ResizeObserver', {
  configurable: true,
  value: ResizeObserverMock,
});

Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

test('navigates to the result page without reloading', () => {
  window.history.replaceState({}, '', '/project/new');
  render(<App />);

  fireEvent.click(screen.getByRole('link', { name: /测算结果/ }));

  expect(window.location.pathname).toBe('/project/result');
  expect(screen.getByText('暂无测算结果')).toBeTruthy();
});

test('does not expose the internal V1 coverage note on the project form', () => {
  window.history.replaceState({}, '', '/project/new');
  render(<App />);

  expect(screen.queryByText('本版覆盖 122 项')).toBeNull();
  expect(screen.queryByText(/不是全国审计工资库/)).toBeNull();
});

test('does not expose the internal calculation-scope disclaimer on results', () => {
  storage.saveResult({
    version: 1,
    calculatedAt: new Date().toISOString(),
    project: EXAMPLE_PROJECT,
    totalActionCount: 122,
    totalHeadcount: 34,
    annualCost: 481800,
    categories: [
      { category: 'service', title: '服务', actionCount: 17, headcount: 5, annualCost: 1 },
      { category: 'cleaning', title: '清洁', actionCount: 48, headcount: 15, annualCost: 0 },
      { category: 'greening', title: '绿化', actionCount: 51, headcount: 3, annualCost: 0 },
      { category: 'assistance', title: '客助', actionCount: 6, headcount: 11, annualCost: 0 },
    ],
    actions: [],
  });
  window.history.replaceState({}, '', '/project/result');
  render(<App />);

  expect(screen.queryByText('测算范围说明')).toBeNull();
  expect(screen.queryByText(/不是全国审计工资库/)).toBeNull();
  expect(screen.queryByText('四类覆盖')).toBeNull();
  const unitCostCard = screen.getByText('服务成本单价').closest('.ant-card');
  expect(unitCostCard?.textContent).toContain('0.27元/㎡·月');
  expect(screen.queryByText('CALCULATION RESULT / 122 ACTIONS')).toBeNull();
});

test('generates a presentation with real stage feedback and exposes the download', async () => {
  storage.saveResult({
    version: 1,
    calculatedAt: new Date().toISOString(),
    project: EXAMPLE_PROJECT,
    totalActionCount: 122,
    totalHeadcount: 34,
    annualCost: 481800,
    categories: [
      { category: 'service', title: '服务', actionCount: 17, headcount: 5, annualCost: 1 },
      { category: 'cleaning', title: '清洁', actionCount: 48, headcount: 15, annualCost: 0 },
      { category: 'greening', title: '绿化', actionCount: 51, headcount: 3, annualCost: 0 },
      { category: 'assistance', title: '客助', actionCount: 6, headcount: 11, annualCost: 0 },
    ],
    actions: [],
  });
  let finishGeneration!: (response: Response) => void;
  const generationResponse = new Promise<Response>((resolve) => { finishGeneration = resolve; });
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ jobId: 'job-1', status: 'running', stage: 'validating' }), { status: 202 }))
    .mockReturnValueOnce(generationResponse);
  vi.stubGlobal('fetch', fetchMock);
  window.history.replaceState({}, '', '/project/result');
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /生成路演PPT/ }));

  expect(await screen.findByText('正在生成路演PPT')).toBeTruthy();
  expect(screen.getByText('校验项目数据')).toBeTruthy();
  expect(screen.getByText('整理服务方案')).toBeTruthy();
  expect(screen.getByText('套用路演模板')).toBeTruthy();
  expect(screen.getByText('导出演示文件')).toBeTruthy();
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  await act(async () => {
    finishGeneration(new Response(JSON.stringify({ jobId: 'job-1', status: 'complete', stage: 'complete', fileName: '示范项目-路演方案.pptx', slides: 24, downloadUrl: '/api/presentation/jobs/job-1/download' }), { status: 200 }));
  });
  expect(await screen.findByText('路演PPT已生成')).toBeTruthy();
  const download = screen.getByText('下载PPT').closest('a');
  expect(download?.getAttribute('href')).toBe('/api/presentation/jobs/job-1/download');
  expect(screen.getByText('示范项目-路演方案.pptx')).toBeTruthy();
  expect(screen.getByText('共 24 页')).toBeTruthy();
  vi.unstubAllGlobals();
});
