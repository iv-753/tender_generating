// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

vi.mock('./workbookCalculator', () => ({ calculateProject: vi.fn() }));
import App from './App';

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

afterEach(cleanup);

test('navigates to the result page without reloading', () => {
  window.history.replaceState({}, '', '/project/new');
  render(<App />);

  fireEvent.click(screen.getByRole('link', { name: /测算结果/ }));

  expect(window.location.pathname).toBe('/project/result');
  expect(screen.getByText('暂无测算结果')).toBeTruthy();
});
