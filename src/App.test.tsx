// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
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

afterEach(cleanup);

test('navigates to the result page without reloading', () => {
  window.history.replaceState({}, '', '/project/new');
  render(<App />);

  fireEvent.click(screen.getByRole('link', { name: '查看测算结果' }));

  expect(window.location.pathname).toBe('/project/result');
  expect(screen.getByRole('heading', { name: '测算结果' })).toBeTruthy();
});
