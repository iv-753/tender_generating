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
