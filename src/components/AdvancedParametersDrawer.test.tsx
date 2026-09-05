// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

import AdvancedParametersDrawer from './AdvancedParametersDrawer';
import type { AdvancedParameterSnapshot } from '../types';

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

const parameters: AdvancedParameterSnapshot[] = [
  { key: 'basement.fireShutterCount', label: '地下停车区防火卷帘数量', group: 'basement', unit: '个', defaultValue: 252, value: 252, source: 'template', affectedActionIds: ['action-1', 'action-2'] },
  { key: 'basement.parkingArea', label: '地下停车区面积', group: 'basement', unit: '平方米', defaultValue: 62460, value: 62460, source: 'derived', affectedActionIds: ['action-2', 'action-3'] },
  { key: 'building.lobbyCount', label: '标准大堂数量', group: 'building', unit: '个', defaultValue: 24, value: 24, source: 'derived', affectedActionIds: ['action-4'] },
  { key: 'grounds.treatmentArea', label: '四害消杀面积', group: 'grounds', unit: '平方米', defaultValue: 322906.05, value: 322906.05, source: 'estimated', affectedActionIds: ['action-5'] },
  { key: 'grounds.zoneArea', label: '园林分区面积', group: 'grounds', unit: '平方米', defaultValue: 26353, value: 26353, source: 'estimated', affectedActionIds: ['action-7'] },
];

afterEach(cleanup);

test('shows populated groups collapsed and hides an empty reserved group', () => {
  render(<AdvancedParametersDrawer open parameters={parameters} overrides={{ 'grounds.treatmentArea': 400000 }} onClose={vi.fn()} onChange={vi.fn()} />);

  for (const name of ['地下空间', '楼栋公区', '室外场地']) expect(screen.getByText(name)).toBeTruthy();
  expect(screen.queryByText('人员与成本')).toBeNull();
  expect(screen.getByText(/系统已估算 2 项/)).toBeTruthy();
  expect(screen.getByText(/影响 3 个服务动作/)).toBeTruthy();
  expect(screen.getByText(/已调整 1 项/)).toBeTruthy();
  expect(screen.queryByLabelText('地下停车区防火卷帘数量')).toBeNull();
});

test('shows value, unit, source, and affected actions only after expanding a group', () => {
  render(<AdvancedParametersDrawer open parameters={parameters} overrides={{ 'grounds.treatmentArea': 400000 }} onClose={vi.fn()} onChange={vi.fn()} />);

  fireEvent.click(screen.getByText('地下空间'));
  fireEvent.click(screen.getByText('楼栋公区'));
  fireEvent.click(screen.getByText('室外场地'));
  expect((screen.getByLabelText('地下停车区防火卷帘数量') as HTMLInputElement).value).toBe('252');
  expect(screen.getAllByText('个')).toHaveLength(2);
  expect(screen.getByText('模板默认')).toBeTruthy();
  expect(screen.getAllByText('直接推算')).toHaveLength(2);
  expect(screen.getByText('规则估算')).toBeTruthy();
  expect(screen.getByText('手动调整')).toBeTruthy();
  expect(screen.getAllByText('影响 2 个服务动作')).toHaveLength(2);
});

test('keeps only valid differences and rounds count parameters to integers', () => {
  const onChange = vi.fn();
  render(<AdvancedParametersDrawer open parameters={parameters} overrides={{}} onClose={vi.fn()} onChange={onChange} />);
  fireEvent.click(screen.getByText('地下空间'));
  const input = screen.getByLabelText('地下停车区防火卷帘数量');

  fireEvent.change(input, { target: { value: '300.6' } });
  expect(onChange).toHaveBeenLastCalledWith({ 'basement.fireShutterCount': 301 });
  fireEvent.change(input, { target: { value: '252' } });
  expect(onChange).toHaveBeenLastCalledWith({});
});

test('restores one parameter or a whole group to system defaults', () => {
  const onChange = vi.fn();
  render(<AdvancedParametersDrawer open parameters={parameters} overrides={{ 'basement.fireShutterCount': 300, 'basement.parkingArea': 70000, 'grounds.treatmentArea': 400000 }} onClose={vi.fn()} onChange={onChange} />);
  fireEvent.click(screen.getByText('地下空间'));

  const shutterRow = screen.getByLabelText('地下停车区防火卷帘数量').closest('.advanced-parameter-row');
  fireEvent.click(within(shutterRow as HTMLElement).getByRole('button', { name: '恢复系统值' }));
  expect(onChange).toHaveBeenLastCalledWith({ 'basement.parkingArea': 70000, 'grounds.treatmentArea': 400000 });

  fireEvent.click(screen.getByRole('button', { name: '恢复地下空间全部系统值' }));
  expect(onChange).toHaveBeenLastCalledWith({ 'grounds.treatmentArea': 400000 });
});

test('shows loading, failure, and empty states clearly', () => {
  const { rerender } = render(<AdvancedParametersDrawer open loading parameters={[]} overrides={{}} onClose={vi.fn()} onChange={vi.fn()} />);
  expect(screen.getByText('正在估算高级参数…')).toBeTruthy();

  rerender(<AdvancedParametersDrawer open error="暂时无法估算，请重试" parameters={[]} overrides={{}} onClose={vi.fn()} onChange={vi.fn()} />);
  expect(screen.getByText('暂时无法估算，请重试')).toBeTruthy();

  rerender(<AdvancedParametersDrawer open parameters={[]} overrides={{}} onClose={vi.fn()} onChange={vi.fn()} />);
  expect(screen.getByText('暂无可调整参数')).toBeTruthy();
});
