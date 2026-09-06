# Generation Progress Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为测算、标书、PPT和Excel智能导入提供克制、可信的分阶段进度展示，并保证真实错误立即显示。

**Architecture:** 新建一个无业务依赖的进度计时模块和一个复用现有 Ant Design `Progress`、`Steps` 的展示组件。测算与文件生成在前端等待“真实结果”和“最低展示时长”两个条件，Excel只显示真实等待过程，不增加延迟。

**Tech Stack:** React 19、TypeScript、Ant Design 6、Vitest、Testing Library

---

### Task 1: 进度计时基础能力

**Files:**
- Create: `src/progressTiming.ts`
- Create: `src/progressTiming.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, test, vi } from 'vitest';
import { progressSnapshot, waitForMinimumDuration } from './progressTiming';

describe('progress timing', () => {
  test('maps elapsed time to a capped percent and active stage', () => {
    expect(progressSnapshot(0, 8_000, 4)).toEqual({ percent: 4, stage: 0 });
    expect(progressSnapshot(4_100, 8_000, 4)).toEqual({ percent: 51, stage: 2 });
    expect(progressSnapshot(20_000, 8_000, 4)).toEqual({ percent: 96, stage: 3 });
  });

  test('waits only for the remaining minimum duration', async () => {
    vi.useFakeTimers();
    const done = vi.fn();
    void waitForMinimumDuration(1_000, 8_000, () => 5_000).then(done);
    await vi.advanceTimersByTimeAsync(3_999);
    expect(done).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(done).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npx vitest run src/progressTiming.test.ts --exclude "**/.worktrees/**"`

Expected: FAIL because `progressTiming.ts` does not exist.

- [ ] **Step 3: Implement the timing helpers**

```ts
export const CALCULATION_MINIMUM_MS = 8_000;
export const ARTIFACT_MINIMUM_MS = 15_000;

export function progressSnapshot(elapsedMs: number, durationMs: number, stageCount: number) {
  const ratio = Math.max(0, Math.min(1, elapsedMs / durationMs));
  return {
    percent: Math.min(96, Math.max(4, Math.floor(ratio * 100))),
    stage: Math.min(stageCount - 1, Math.floor(ratio * stageCount)),
  };
}

export function waitForMinimumDuration(startedAt: number, durationMs: number, now = Date.now) {
  const remaining = Math.max(0, startedAt + durationMs - now());
  return new Promise<void>((resolve) => window.setTimeout(resolve, remaining));
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `npx vitest run src/progressTiming.test.ts --exclude "**/.worktrees/**"`

Expected: PASS with 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/progressTiming.ts src/progressTiming.test.ts
git commit -m "feat: add perceived progress timing"
```

### Task 2: 可复用的克制型进度组件

**Files:**
- Create: `src/components/GenerationProgress.tsx`
- Create: `src/components/GenerationProgress.test.tsx`
- Modify: `src/styles.css`

- [ ] **Step 1: Write the failing component test**

```tsx
import { act, render, screen } from '@testing-library/react';
import { test, expect, vi } from 'vitest';
import GenerationProgress from './GenerationProgress';

test('advances stages and shows the slow-operation message', async () => {
  vi.useFakeTimers();
  render(<GenerationProgress startedAt={Date.now()} durationMs={40_000} stages={[
    { title: '读取工作表', description: '解析工作簿内容' },
    { title: '识别项目字段', description: '匹配项目基础信息' },
    { title: '核对单位与口径', description: '检查面积与数量单位' },
    { title: '整理待确认结果', description: '汇总识别结果' },
  ]} slowAfterMs={30_000} slowMessage="表格内容较多，正在继续核对" />);
  expect(screen.getByText('读取工作表')).toBeTruthy();
  await act(() => vi.advanceTimersByTimeAsync(30_000));
  expect(screen.getByText('表格内容较多，正在继续核对')).toBeTruthy();
  vi.useRealTimers();
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npx vitest run src/components/GenerationProgress.test.tsx --exclude "**/.worktrees/**"`

Expected: FAIL because `GenerationProgress.tsx` does not exist.

- [ ] **Step 3: Implement the component**

Create a component that updates elapsed time every 100 ms, calls `progressSnapshot`, and renders Ant Design `Progress` plus vertical `Steps`. Accept `startedAt`, `durationMs`, `stages`, optional `subtitle`, `slowAfterMs`, `slowMessage`, and `compact`; render the slow message only after its threshold. Clear the interval in the effect cleanup.

```tsx
type Stage = { title: string; description: string };
type Props = {
  startedAt: number;
  durationMs: number;
  stages: readonly Stage[];
  subtitle?: string;
  slowAfterMs?: number;
  slowMessage?: string;
  compact?: boolean;
};
```

Add only restrained styles: a 0.3-second progress transition, a soft pulse on the active step icon, and a short opacity transition for stage text. Include `prefers-reduced-motion: reduce` to disable the pulse and transitions.

- [ ] **Step 4: Run the test and verify it passes**

Run: `npx vitest run src/components/GenerationProgress.test.tsx --exclude "**/.worktrees/**"`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/GenerationProgress.tsx src/components/GenerationProgress.test.tsx src/styles.css
git commit -m "feat: add restrained generation progress"
```

### Task 3: 测算、标书和PPT最低展示时长

**Files:**
- Modify: `src/pages/ProjectNewPage.tsx`
- Modify: `src/pages/ProjectResultPage.tsx`
- Modify: `src/components/BidGenerationButton.tsx`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Add failing interaction assertions**

Use fake timers in the existing calculation, immediate PPT, and immediate bid tests. Resolve each mocked API immediately, advance to one millisecond before the minimum, and assert that navigation or the download button is absent; advance the last millisecond and assert success.

```ts
await vi.advanceTimersByTimeAsync(7_999);
expect(window.location.pathname).toBe('/project/new');
await vi.advanceTimersByTimeAsync(1);
expect(window.location.pathname).toBe('/project/result');
```

```ts
await vi.advanceTimersByTimeAsync(14_999);
expect(screen.queryByText('下载PPT')).toBeNull();
await vi.advanceTimersByTimeAsync(1);
expect(await screen.findByText('下载PPT')).toBeTruthy();
```

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npx vitest run src/App.test.tsx --exclude "**/.worktrees/**"`

Expected: the new minimum-duration assertions fail because success is currently immediate.

- [ ] **Step 3: Gate only successful completion**

At the start of each operation store `const startedAt = Date.now()`. After the real API succeeds, call `await waitForMinimumDuration(startedAt, CALCULATION_MINIMUM_MS)` for calculation or `ARTIFACT_MINIMUM_MS` for bid/PPT before navigation or exposing success. Keep the `catch` path outside the wait so errors remain immediate.

Render `GenerationProgress` with these stage labels:

```ts
const calculationStages = [
  { title: '校验项目参数', description: '核对面积、户数与服务等级' },
  { title: '匹配服务规则', description: '匹配项目适用的服务动作' },
  { title: '核算人员与成本', description: '汇总工时、岗位与年度预算' },
  { title: '生成测算方案', description: '整理项目测算结果' },
] as const;
```

For immediately completed serverless jobs, retain the completed payload in a local variable and keep React state as `running` until the minimum duration has elapsed. Reuse the current bid and PPT stage copy in the shared component.

- [ ] **Step 4: Run focused tests and verify success**

Run: `npx vitest run src/App.test.tsx --exclude "**/.worktrees/**"`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/pages/ProjectNewPage.tsx src/pages/ProjectResultPage.tsx src/components/BidGenerationButton.tsx src/App.test.tsx
git commit -m "feat: pace calculation and artifact generation"
```

### Task 4: Excel真实等待进度

**Files:**
- Modify: `src/components/ExcelImportPanel.tsx`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Add failing Excel progress assertions**

Extend the existing delayed Excel recognition test to verify the four stage titles and the 30-second message, then resolve the mocked request and assert the review appears immediately without any additional timer advancement.

```ts
expect(screen.getByText('读取工作表')).toBeTruthy();
await vi.advanceTimersByTimeAsync(30_000);
expect(screen.getByText('表格内容较多，正在继续核对')).toBeTruthy();
finishRecognition(validRecognitionResponse);
expect(await screen.findByText('识别结果确认')).toBeTruthy();
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npx vitest run src/App.test.tsx --exclude "**/.worktrees/**"`

Expected: FAIL because the current panel shows a fixed 100% bar and no stages.

- [ ] **Step 3: Replace the fixed bar with shared progress**

Store the recognition start timestamp when upload begins and render compact `GenerationProgress` while `status === 'recognizing'` with a 40-second visual duration, the four Excel stages, `slowAfterMs={30_000}`, and the approved slow message. Do not call `waitForMinimumDuration`; on success switch to `review` immediately, and on failure retain the existing immediate error behavior.

- [ ] **Step 4: Run focused tests and type checking**

Run: `npx vitest run src/components/GenerationProgress.test.tsx src/App.test.tsx --exclude "**/.worktrees/**"`

Expected: PASS.

Run: `npm run typecheck`

Expected: exit code 0.

- [ ] **Step 5: Verify the four real pages**

Start the local server and inspect `/project/new`, `/project/result`, `/project/bid`, and the Excel upload panel. Confirm the exact durations, stage copy, restrained animation, immediate errors, and successful navigation/download state.

- [ ] **Step 6: Commit**

```bash
git add src/components/ExcelImportPanel.tsx src/App.test.tsx
git commit -m "feat: show real Excel recognition progress"
```
