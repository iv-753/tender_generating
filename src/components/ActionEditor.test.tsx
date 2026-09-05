// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

import ActionEditor from './ActionEditor';
import type { CalculationAdjustments, ServiceActionResult } from '../types';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, 'ResizeObserver', { configurable: true, value: ResizeObserverMock });
const getComputedStyle = window.getComputedStyle.bind(window);
Object.defineProperty(window, 'getComputedStyle', {
  configurable: true,
  value: (element: Element) => getComputedStyle(element),
});
Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null,
    addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })),
});

const action: ServiceActionResult = {
  id: 'service-5',
  category: 'service',
  action: 'A-FW-57 车行相关业务办理',
  property: '基础',
  basis: '常住户数每年平均0.5次',
  frequency: '即时',
  annualFrequency: 600,
  annualHours: 315,
  annualCost: 10395,
  enabled: true,
  source: 'baseline',
};
const empty: CalculationAdjustments = { version: 1, overrides: {}, customActions: [] };

afterEach(cleanup);

test('changing frequency clears a previous hours override', () => {
  const onChange = vi.fn();
  render(<ActionEditor category="service" actions={[action]} adjustments={{ ...empty, overrides: { 'service-5': { annualHours: 200 } } }} onChange={onChange} />);

  fireEvent.change(screen.getByLabelText('车行相关业务办理年频次'), { target: { value: '400' } });

  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
    overrides: { 'service-5': { annualFrequency: 400 } },
  }));
});

test('shows annual frequency as a whole count and hours without floating-point noise', () => {
  render(<ActionEditor category="service" actions={[{ ...action, annualFrequency: 23.039999999999996, annualHours: 24.239999999999995 }]} adjustments={empty} onChange={vi.fn()} />);

  expect((screen.getByLabelText('车行相关业务办理年频次') as HTMLInputElement).value).toBe('23');
  expect((screen.getByLabelText('车行相关业务办理年工时') as HTMLInputElement).value).toBe('24.24');
});

test('stops and restores a workbook action without removing its id', () => {
  const onChange = vi.fn();
  const { rerender } = render(<ActionEditor category="service" actions={[action]} adjustments={empty} onChange={onChange} />);

  fireEvent.click(screen.getByRole('button', { name: '停用' }));
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ overrides: { 'service-5': { disabled: true } } }));

  rerender(<ActionEditor category="service" actions={[{ ...action, enabled: false }]} adjustments={{ ...empty, overrides: { 'service-5': { disabled: true } } }} onChange={onChange} />);
  fireEvent.click(screen.getByRole('button', { name: '撤销停用' }));
  expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ overrides: {} }));
});

test('adds a custom service action with frequency and annual hours', () => {
  const onChange = vi.fn();
  render(<ActionEditor category="service" actions={[action]} adjustments={empty} onChange={onChange} />);

  fireEvent.click(screen.getByRole('button', { name: /添加服务动作/ }));
  fireEvent.change(screen.getByLabelText('自定义动作名称'), { target: { value: '夜间客户关怀' } });
  fireEvent.change(screen.getByLabelText('自定义动作年频次'), { target: { value: '120' } });
  fireEvent.change(screen.getByLabelText('自定义动作年工时'), { target: { value: '60' } });
  fireEvent.click(screen.getByRole('button', { name: '确认添加' }));

  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
    customActions: [expect.objectContaining({ category: 'service', action: '夜间客户关怀', annualFrequency: 120, annualHours: 60 })],
  }));
});

test('edits frequency, hours, and workload cost for a complete-model category', () => {
  const onChange = vi.fn();
  const engineeringAction: ServiceActionResult = {
    ...action,
    id: 'engineering-outsourced-5',
    category: 'engineeringOutsourced',
    action: '设备检测',
    annualFrequency: 12,
    annualHours: 349.272,
    annualCost: 10573.322,
  };
  render(<ActionEditor category="engineeringOutsourced" actions={[engineeringAction]} adjustments={empty} onChange={onChange} />);

  expect(screen.getByText('工作量成本为动作核算值；分类/项目预算按取整用工口径重算')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('设备检测年频次'), { target: { value: '13.6' } });
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ overrides: { 'engineering-outsourced-5': { annualFrequency: 14 } } }));
  fireEvent.change(screen.getByLabelText('设备检测年工时'), { target: { value: '12.345' } });
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ overrides: { 'engineering-outsourced-5': { annualHours: 12.35 } } }));
  fireEvent.change(screen.getByLabelText('设备检测年工作量成本'), { target: { value: '456.789' } });
  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ overrides: { 'engineering-outsourced-5': { annualCost: 456.79 } } }));
});

test('assistance remains the only dedicated-post category', () => {
  const assistanceAction: ServiceActionResult = {
    ...action, id: 'assistance-4', category: 'assistance', action: '门岗', headcount: 2,
  };
  render(<ActionEditor category="assistance" actions={[assistanceAction]} adjustments={empty} onChange={vi.fn()} />);

  expect(screen.getByLabelText('门岗配置人数')).toBeTruthy();
  expect(screen.queryByLabelText('门岗年频次')).toBeNull();
  expect(screen.queryByLabelText('门岗年工时')).toBeNull();
  expect(screen.queryByLabelText('门岗年工作量成本')).toBeNull();
});

test('adds a custom pest action with editable workload cost', () => {
  const onChange = vi.fn();
  const pestAction: ServiceActionResult = { ...action, id: 'pest-control-5', category: 'pestControl', action: '四害防蚊喷药' };
  render(<ActionEditor category="pestControl" actions={[pestAction]} adjustments={empty} onChange={onChange} />);

  fireEvent.click(screen.getByRole('button', { name: /添加服务动作/ }));
  fireEvent.change(screen.getByLabelText('自定义动作名称'), { target: { value: '补充消杀' } });
  fireEvent.change(screen.getByLabelText('自定义动作年频次'), { target: { value: '12' } });
  fireEvent.change(screen.getByLabelText('自定义动作年工时'), { target: { value: '24.125' } });
  fireEvent.change(screen.getByLabelText('自定义动作年工作量成本'), { target: { value: '1800.555' } });
  fireEvent.click(screen.getByRole('button', { name: '确认添加' }));

  expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
    customActions: [expect.objectContaining({ category: 'pestControl', action: '补充消杀', annualFrequency: 12, annualHours: 24.13, annualCost: 1800.56 })],
  }));
});
