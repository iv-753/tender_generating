// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
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
    annualCost: 1,
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
});
