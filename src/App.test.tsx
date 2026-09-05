// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

vi.mock('./workbookCalculator', () => ({ calculateProject: vi.fn() }));
vi.mock('./excelRecognition', () => ({ recognizeExcelFile: vi.fn() }));
import App from './App';
import { recognizeExcelFile } from './excelRecognition';
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
  vi.mocked(recognizeExcelFile).mockReset();
});

const recognitionResult = {
  version: 1 as const,
  provider: 'qwen',
  model: 'qwen3.7-max',
  project: {
    ...EXAMPLE_PROJECT,
    projectName: '云麓华庭',
    region: '浙江省',
    city: '杭州市',
    serviceGrade: 'B' as const,
    costBand: 'upper' as const,
    recommendedCostBand: 'upper' as const,
    costBandSourceVersion: '2025-wage-2026-09',
    residentialChargeArea: 108000,
    seasonalFlowerArea: null,
  },
  recognition: {
    fields: {
      projectName: { status: 'recognized' as const, confidence: 0.98, source: { sheet: '项目总览', cell: 'E5', raw: '云麓华庭' }, note: '' },
      residentialChargeArea: { status: 'recognized' as const, confidence: 0.97, source: { sheet: '项目总览', cell: 'E8', raw: '10.8万㎡' }, note: '' },
      seasonalFlowerArea: { status: 'missing' as const, confidence: 0, source: null, note: '原表未提供' },
    },
    buildings: [],
  },
  missingFields: ['seasonalFlowerArea'],
  warnings: [],
};

function savedResult(projectName: string, calculatedAt: string, annualCost: number) {
  return {
    version: 1 as const,
    calculatedAt,
    project: { ...EXAMPLE_PROJECT, projectName },
    totalActionCount: 122,
    totalHeadcount: 34,
    annualCost,
    categories: [
      { category: 'service' as const, title: '服务', actionCount: 17, headcount: 5, annualCost: 1 },
      { category: 'cleaning' as const, title: '清洁', actionCount: 48, headcount: 15, annualCost: 0 },
      { category: 'greening' as const, title: '绿化', actionCount: 51, headcount: 3, annualCost: 0 },
      { category: 'assistance' as const, title: '客助', actionCount: 6, headcount: 11, annualCost: 0 },
    ],
    actions: [],
  };
}

test('uses the project center as the workspace home', () => {
  window.history.replaceState({}, '', '/');
  render(<App />);

  expect(window.location.pathname).toBe('/projects');
  expect(screen.getByRole('heading', { name: '物业方案工作台' })).toBeTruthy();
  expect(screen.getByRole('heading', { name: '项目中心' })).toBeTruthy();
  expect(screen.getByText('还没有保存的项目')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /新建项目/ }));
  expect(window.location.pathname).toBe('/project/new');
});

test('uses enterprise modules as the global navigation', () => {
  window.history.replaceState({}, '', '/projects');
  render(<App />);

  expect(screen.getByRole('link', { name: /项目中心/ })).toBeTruthy();
  expect(screen.getByRole('link', { name: /企业资料/ })).toBeTruthy();
  expect(screen.getByRole('link', { name: /方案资产/ })).toBeTruthy();
  expect(screen.getByRole('link', { name: /管理中心/ })).toBeTruthy();
  expect(screen.queryByText('企业内网')).toBeNull();
  expect(screen.queryByRole('link', { name: /新建测算/ })).toBeNull();
});

test('uses province and city selectors with an adjacent cost override', () => {
  window.history.replaceState({}, '', '/project/new');
  render(<App />);

  expect(screen.getByLabelText('省份')).toBeTruthy();
  expect(screen.getByLabelText('城市')).toBeTruthy();
  expect(screen.queryByText('成本城市')).toBeNull();
  fireEvent.click(screen.getByText('测算参数'));
  expect(screen.getByText(/系统建议：高成本城市/)).toBeTruthy();
  expect(screen.getByText(/当前采用：较高成本城市.*已手动调整/)).toBeTruthy();
});

test('opens a project workspace with five business views', () => {
  const project = storage.saveCalculatedProject(savedResult('湖畔家园', '2026-09-03T08:00:00.000Z', 481800));
  storage.selectProject(project.id);
  window.history.replaceState({}, '', '/project/overview');
  render(<App />);

  expect(screen.getByRole('heading', { name: '湖畔家园' })).toBeTruthy();
  for (const name of ['项目概览', '测算结果', '路演PPT', '投标标书', '生成记录']) {
    expect(screen.getByRole('link', { name })).toBeTruthy();
  }
});

test('saves company profile for reuse', async () => {
  window.history.replaceState({}, '', '/company');
  render(<App />);

  fireEvent.change(screen.getByLabelText('企业名称'), { target: { value: '安序物业' } });
  fireEvent.change(screen.getByLabelText('统一社会信用代码'), { target: { value: '91440000TEST' } });
  fireEvent.change(screen.getByLabelText('法定代表人'), { target: { value: '张三' } });
  fireEvent.change(screen.getByLabelText('注册地址'), { target: { value: '广东省广州市' } });
  fireEvent.change(screen.getByLabelText('联系人'), { target: { value: '李经理' } });
  fireEvent.change(screen.getByLabelText('联系电话'), { target: { value: '13800000000' } });
  fireEvent.click(screen.getByRole('button', { name: /保存企业资料/ }));

  await waitFor(() => expect(storage.loadCompanyProfile()?.companyName).toBe('安序物业'));
});

test.each([
  ['/templates', '方案资产'],
  ['/settings', '管理中心'],
  ['/project/presentation', '路演PPT'],
  ['/project/bid', '投标标书'],
  ['/project/history', '生成记录'],
])('renders the %s workspace', (path, title) => {
  storage.saveCalculatedProject(savedResult('湖畔家园', '2026-09-03T08:00:00.000Z', 481800));
  window.history.replaceState({}, '', path);
  render(<App />);
  expect(screen.getByRole('heading', { name: title })).toBeTruthy();
});

test.each([
  ['/projects', 'PROJECT ARCHIVE'],
  ['/company', 'COMPANY PROFILE'],
  ['/templates', 'TEMPLATE LIBRARY'],
  ['/settings', 'SYSTEM'],
  ['/project/new', '模型就绪'],
  ['/project/overview', 'PROJECT WORKSPACE'],
  ['/project/bid', '标准模板待校验'],
  ['/project/history', 'ACTIVITY LOG'],
])('does not expose implementation copy on %s', (path, copy) => {
  storage.saveCalculatedProject(savedResult('湖畔家园', '2026-09-03T08:00:00.000Z', 481800));
  window.history.replaceState({}, '', path);
  render(<App />);
  expect(screen.queryByText(copy)).toBeNull();
});

test('lists saved projects and opens, edits, or duplicates a project', () => {
  storage.saveCalculatedProject(savedResult('湖畔家园', '2026-09-03T08:00:00.000Z', 481800));
  storage.startNewProject();
  storage.saveCalculatedProject(savedResult('滨江花园', '2026-09-03T09:00:00.000Z', 520000));
  window.history.replaceState({}, '', '/projects');
  render(<App />);

  expect(screen.getByText('湖畔家园')).toBeTruthy();
  expect(screen.getByText('滨江花园')).toBeTruthy();
  expect(screen.getByText('¥520,000')).toBeTruthy();

  fireEvent.click(screen.getAllByRole('button', { name: /复制/ })[0]);
  expect(screen.getByText('滨江花园（副本）')).toBeTruthy();

  fireEvent.click(screen.getAllByRole('button', { name: /继续编辑/ })[0]);
  expect(window.location.pathname).toBe('/project/new');
  expect(storage.loadDraft()?.projectName).toBe('滨江花园（副本）');
});

test('deletes a saved project only after confirmation', async () => {
  storage.saveCalculatedProject(savedResult('临时测算项目', '2026-09-03T09:00:00.000Z', 520000));
  window.history.replaceState({}, '', '/projects');
  render(<App />);

  const row = screen.getByRole('row', { name: /临时测算项目/ });
  fireEvent.click(within(row).getByRole('button', { name: /删除/ }));
  expect(screen.getByText('删除这个项目？')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /取\s*消/ }));
  expect(screen.getByText('临时测算项目')).toBeTruthy();

  fireEvent.click(within(screen.getByRole('row', { name: /临时测算项目/ })).getByRole('button', { name: /删除/ }));
  fireEvent.click(screen.getByRole('button', { name: '确认删除' }));
  expect(await screen.findByText('还没有保存的项目')).toBeTruthy();
});

test('navigates inside a project without reloading', () => {
  storage.saveCalculatedProject(savedResult('湖畔家园', '2026-09-03T08:00:00.000Z', 481800));
  window.history.replaceState({}, '', '/project/overview');
  render(<App />);

  fireEvent.click(screen.getByRole('link', { name: '测算结果' }));

  expect(window.location.pathname).toBe('/project/result');
  expect(screen.getByRole('heading', { name: '湖畔家园' })).toBeTruthy();
});

test('does not expose the internal V1 coverage note on the project form', () => {
  window.history.replaceState({}, '', '/project/new');
  render(<App />);

  expect(screen.queryByText('本版覆盖 122 项')).toBeNull();
  expect(screen.queryByText(/不是全国审计工资库/)).toBeNull();
});

test('imports an Excel workbook, reviews the result, and applies it only after confirmation', async () => {
  vi.mocked(recognizeExcelFile).mockResolvedValue(recognitionResult);
  window.history.replaceState({}, '', '/project/new');
  render(<App />);

  expect(screen.getByText('Excel 智能导入')).toBeTruthy();
  const projectName = screen.getByLabelText('项目名称') as HTMLInputElement;
  expect(projectName.value).toBe('增城示范花园');
  const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
  expect(fileInput).toBeTruthy();
  fireEvent.change(fileInput!, { target: { files: [new File(['xlsx'], '项目资料.xlsx')] } });

  const dialog = await screen.findByRole('dialog', { name: '识别结果确认' });
  expect(screen.getByText('云麓华庭')).toBeTruthy();
  expect(screen.getByText('108,000 ㎡')).toBeTruthy();
  expect(dialog.textContent).toContain('1 项待补充');
  expect(projectName.value).toBe('增城示范花园');

  fireEvent.click(screen.getByRole('button', { name: '采用识别结果' }));
  expect(projectName.value).toBe('云麓华庭');
  const seasonalFlowerArea = screen.getByLabelText('时花面积') as HTMLInputElement;
  expect(seasonalFlowerArea.value).toBe('');
});

test('shows a real waiting state while Excel recognition is running', async () => {
  vi.mocked(recognizeExcelFile).mockReturnValue(new Promise(() => undefined));
  window.history.replaceState({}, '', '/project/new');
  render(<App />);

  const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
  fireEvent.change(fileInput!, { target: { files: [new File(['xlsx'], '项目资料.xlsx')] } });
  expect(await screen.findByText('正在识别项目数据')).toBeTruthy();
  expect(screen.getByText(/通常需要约 1 分钟/)).toBeTruthy();
});

test('keeps the form unchanged when the recognition result is cancelled', async () => {
  vi.mocked(recognizeExcelFile).mockResolvedValue(recognitionResult);
  window.history.replaceState({}, '', '/project/new');
  render(<App />);

  const projectName = screen.getByLabelText('项目名称') as HTMLInputElement;
  const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
  fireEvent.change(fileInput!, { target: { files: [new File(['xlsx'], '项目资料.xlsx')] } });
  await screen.findByRole('dialog', { name: '识别结果确认' });
  fireEvent.click(screen.getByRole('button', { name: /取\s*消/ }));
  expect(projectName.value).toBe('增城示范花园');
});

test('keeps the form unchanged when Excel recognition fails', async () => {
  vi.mocked(recognizeExcelFile).mockRejectedValue(new Error('AI服务暂不可用'));
  window.history.replaceState({}, '', '/project/new');
  render(<App />);

  const projectName = screen.getByLabelText('项目名称') as HTMLInputElement;
  const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
  fireEvent.change(fileInput!, { target: { files: [new File(['xlsx'], '项目资料.xlsx')] } });
  expect(await screen.findByText('AI服务暂不可用')).toBeTruthy();
  expect(projectName.value).toBe('增城示范花园');
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

test('explains workload cost separately from the rounded staffing budget', () => {
  storage.saveResult({
    ...savedResult('湖畔家园', '2026-09-03T08:00:00.000Z', 481800),
    workloadAnnualCost: 410000,
    categories: [
      { category: 'service', title: '服务', actionCount: 1, headcount: 5, annualCost: 481800, workloadAnnualCost: 10395, workloadEquivalentHeadcount: 4.6 },
      { category: 'cleaning', title: '清洁', actionCount: 0, headcount: 0, annualCost: 0, workloadAnnualCost: 0, workloadEquivalentHeadcount: 0 },
      { category: 'greening', title: '绿化', actionCount: 0, headcount: 0, annualCost: 0, workloadAnnualCost: 0, workloadEquivalentHeadcount: 0 },
      { category: 'assistance', title: '客助', actionCount: 0, headcount: 0, annualCost: 0, workloadAnnualCost: 0, workloadEquivalentHeadcount: 0 },
    ],
    actions: [{ id: 'service-5', category: 'service', action: '车行相关业务办理', property: '基础', annualFrequency: 600, annualHours: 315, annualCost: 10395 }],
  });
  window.history.replaceState({}, '', '/project/result');
  render(<App />);

  expect(screen.getByText('项目年度用工预算')).toBeTruthy();
  expect(screen.getByText('工作量折算成本')).toBeTruthy();
  expect(screen.getByRole('columnheader', { name: /年工作量成本/ })).toBeTruthy();
  expect(document.querySelector('.category-summary')?.textContent).toContain('工作量相当于 4.6 人，实际配置 5 人');
  expect(screen.getByRole('button', { name: /调整服务方案/ })).toBeTruthy();
});

test('shows action quantities as rounded whole numbers on the result page', () => {
  storage.saveResult({
    ...savedResult('湖畔家园', '2026-09-03T08:00:00.000Z', 481800),
    categories: [
      { category: 'service', title: '服务', actionCount: 0, headcount: 0, annualCost: 0 },
      { category: 'cleaning', title: '清洁', actionCount: 0, headcount: 0, annualCost: 0 },
      { category: 'greening', title: '绿化', actionCount: 2, headcount: 0, annualCost: 0 },
      { category: 'assistance', title: '客助', actionCount: 0, headcount: 0, annualCost: 0 },
    ],
    actions: [
      { id: 'greening-1', category: 'greening', action: '草坪复绿', property: '基础', quantity: 9882.375, unit: '平方米', annualFrequency: 104.4, annualHours: 9307.05, annualCost: 0 },
      { id: 'greening-2', category: 'greening', action: '时花维护', property: '基础', unit: '平方米', annualCost: 0 },
    ],
  });
  window.history.replaceState({}, '', '/project/result');
  render(<App />);
  fireEvent.click(screen.getByRole('tab', { name: /绿化/ }));

  expect(screen.getByText('9,882 平方米')).toBeTruthy();
  expect(screen.queryByText('9882.375 平方米')).toBeNull();
  const roundedMetricsRow = screen.getByRole('row', { name: /草坪复绿/ });
  expect(roundedMetricsRow.children[4]?.textContent).toBe('104');
  expect(roundedMetricsRow.children[5]?.textContent).toBe('9,307');
  const missingQuantityRow = screen.getByRole('row', { name: /时花维护/ });
  expect(missingQuantityRow.children[2]?.textContent).toBe('—');
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
  expect(screen.getByText('编排路演内容')).toBeTruthy();
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

test('accepts an immediately completed serverless presentation job', async () => {
  const current = savedResult('湖畔家园', '2026-09-03T08:00:00.000Z', 481800);
  const project = storage.saveCalculatedProject(current);
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
    jobId: 'job-serverless',
    status: 'complete',
    stage: 'complete',
    fileName: '湖畔家园-路演方案.pptx',
    slides: 24,
    downloadUrl: 'https://private.example/signed',
  }), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  window.history.replaceState({}, '', '/project/result');
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /生成路演PPT/ }));
  expect(await screen.findByText('路演PPT已生成')).toBeTruthy();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(storage.loadProjects().find((item) => item.id === project.id)?.presentation?.fileName).toBe('湖畔家园-路演方案.pptx');
  vi.unstubAllGlobals();
});

test('generates a bid document from the current result and exposes the download', async () => {
  const current = savedResult('湖畔家园', '2026-09-03T08:00:00.000Z', 481800);
  storage.saveResult(current);
  let finishGeneration!: (response: Response) => void;
  const generationResponse = new Promise<Response>((resolve) => { finishGeneration = resolve; });
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ jobId: 'job-2', status: 'running', stage: 'validating' }), { status: 202 }))
    .mockReturnValueOnce(generationResponse);
  vi.stubGlobal('fetch', fetchMock);
  window.history.replaceState({}, '', '/project/result');
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /生成投标标书/ }));

  expect(await screen.findByText('正在生成投标标书')).toBeTruthy();
  expect(screen.getByText('分析项目数据')).toBeTruthy();
  expect(screen.getByText('整理服务方案')).toBeTruthy();
  expect(screen.getByText('编排投标内容')).toBeTruthy();
  expect(screen.getByText('生成投标文件')).toBeTruthy();
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  expect(fetchMock.mock.calls[0][0]).toBe('/api/bid/jobs');
  expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body)).project.projectName).toBe('湖畔家园');
  await act(async () => {
    finishGeneration(new Response(JSON.stringify({ jobId: 'job-2', status: 'complete', stage: 'complete', fileName: '湖畔家园-投标标书.docx', actionCount: 108, downloadUrl: '/api/bid/jobs/job-2/download' }), { status: 200 }));
  });
  expect(await screen.findByText('投标标书已生成')).toBeTruthy();
  const download = screen.getByText('下载标书').closest('a');
  expect(download?.getAttribute('href')).toBe('/api/bid/jobs/job-2/download');
  expect(screen.getByText('湖畔家园-投标标书.docx')).toBeTruthy();
  vi.unstubAllGlobals();
});

test('generates and records a bid document from the bid workspace', async () => {
  const current = savedResult('湖畔家园', '2026-09-03T08:00:00.000Z', 481800);
  const project = storage.saveCalculatedProject(current);
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ jobId: 'job-3', status: 'running', stage: 'validating' }), { status: 202 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ jobId: 'job-3', status: 'complete', stage: 'complete', fileName: '湖畔家园-投标标书.docx', actionCount: 108, downloadUrl: '/api/bid/jobs/job-3/download' }), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  window.history.replaceState({}, '', '/project/bid');
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /生成投标标书/ }));
  expect(await screen.findByText('正在生成投标标书')).toBeTruthy();
  expect(await screen.findByText('投标标书已生成')).toBeTruthy();
  expect(screen.getAllByText('下载标书').some((item) => item.closest('a')?.getAttribute('href') === '/api/bid/jobs/job-3/download')).toBe(true);
  expect(storage.loadProjects().find((item) => item.id === project.id)?.bidDocument?.fileName).toBe('湖畔家园-投标标书.docx');
  vi.unstubAllGlobals();
});

test('shows a readable bid generation error', async () => {
  storage.saveResult(savedResult('湖畔家园', '2026-09-03T08:00:00.000Z', 481800));
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: '标书模板校验失败' }), { status: 400 })));
  window.history.replaceState({}, '', '/project/result');
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /生成投标标书/ }));

  expect(await screen.findByText('投标文件生成失败，请检查项目资料后重试')).toBeTruthy();
  expect(screen.queryByText('标书模板校验失败')).toBeNull();
  vi.unstubAllGlobals();
});
