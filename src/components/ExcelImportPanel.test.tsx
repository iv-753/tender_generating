// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import ExcelImportPanel from './ExcelImportPanel';
import { recognizeExcelFile } from '../excelRecognition';
import { EXAMPLE_PROJECT } from '../exampleProject';
import type { ExcelRecognitionResult } from '../types';

vi.mock('../excelRecognition', () => ({ recognizeExcelFile: vi.fn() }));
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
Object.defineProperty(window, 'matchMedia', { value: vi.fn(() => ({ matches: false, addListener() {}, removeListener() {} })) });
const computedStyle = window.getComputedStyle;
window.getComputedStyle = element => computedStyle(element);
afterEach(() => { cleanup(); localStorage.clear(); vi.clearAllMocks(); });
const result: ExcelRecognitionResult = {
  version: 1, provider: 'local-rules', model: 'zhujiang-template',
  project: { ...EXAMPLE_PROJECT, projectName: '实际导入项目', district: '越秀区', recommendedCostBand: 'high', costBandSourceVersion: '2025-wage-2026-09', workbookOverrides: { 'zhuj.asset.building.elevatorCount': 6 } },
  recognition: { fields: {}, buildings: [], parameters: [{ key: 'zhuj.asset.building.elevatorCount', label: '电梯数量', group: '设备和场地', value: 6, unit: '台', status: 'recognized', confidence: 1, source: { sheet: '2 设备和场地', cell: 'D43', raw: 6 }, note: '' }] },
  issues: [{ key: 'zhuj.asset.building.stiltFloorArea', label: '架空层面积', kind: 'conflict', message: '100㎡与1700㎡不一致。', sources: [{ sheet: '2 设备和场地', cell: 'D35', raw: 100 }] }],
  ignoredSheets: ['5 实际人数和费用', '6 项目收入'], missingFields: [], warnings: [],
};
const upload = () => fireEvent.change(document.querySelector('input[type=file]')!, { target: { files: [new File(['data'], '项目资料.xlsx')] } });

test('reviews parameters, excluded sheets and actionable source issues before adopting', async () => {
  vi.mocked(recognizeExcelFile).mockResolvedValue(result);
  const apply = vi.fn();
  render(<ExcelImportPanel onApply={apply} />);
  upload();
  const dialog = await screen.findByRole('dialog');
  expect(dialog.textContent).toContain('字段规则识别完成');
  expect(dialog.textContent).toContain('100㎡与1700㎡不一致');
  expect(dialog.textContent).toContain('5 实际人数和费用');
  expect(dialog.textContent).toContain('疏散楼梯（每栋合计）');
  expect(dialog.textContent).toContain('510.98 ㎡');
  expect(apply).not.toHaveBeenCalled();
  fireEvent.click(within(dialog).getByText('设备和场地（1 项）'));
  expect(within(dialog).getByText('6 台')).toBeTruthy();
  fireEvent.click(within(dialog).getByRole('button', { name: '采用识别结果' }));
  expect(apply).toHaveBeenCalledWith(result);
});

test('cancel keeps the current project untouched', async () => {
  vi.mocked(recognizeExcelFile).mockResolvedValue(result);
  const apply = vi.fn(); render(<ExcelImportPanel onApply={apply} />); upload();
  const dialog = await screen.findByRole('dialog');
  fireEvent.click(within(dialog).getByRole('button', { name: /取\s*消/ }));
  expect(apply).not.toHaveBeenCalled();
});
