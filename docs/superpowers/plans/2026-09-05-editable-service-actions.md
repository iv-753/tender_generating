# Editable Service Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让用户在测算结果页调整、停用或新增服务动作，并严格按既有 Excel 口径同步重算年工作量成本、完整岗位预算和服务成本单价。

**Architecture:** 保留现有 `calculateProject()` 作为唯一基准测算入口，新增纯函数调整引擎：先生成固定 122 项基准结果，再应用项目级覆盖记录并重新汇总。页面只保存轻量调整记录与最终结果；所有内置动作保留稳定编号，停用动作以 `enabled: false` 和零工作量成本保留，确保恢复、历史兼容和固定文档模板仍可定位。

**Tech Stack:** React 19、TypeScript、Ant Design、Vite/Vitest、Node.js `node:test`、localStorage、现有 `.mjs` 纯计算引擎。

---

## File map

- Create `scripts/calculation/adjustments.mjs`: 应用覆盖、自定义动作及双成本重算的唯一业务实现。
- Create `scripts/calculation/adjustments.test.mjs`: 覆盖频次、工时、停用、新增和人数临界点。
- Create `api/calculate-adjusted.mjs`: 线上调整重算接口。
- Modify `server.mjs`: 本地环境增加同口径调整接口。
- Modify `src/types.ts`: 增加调整记录、动作来源、启停状态和工作量成本汇总类型。
- Create `src/adjustedCalculator.ts`: 前端调用调整接口并处理错误。
- Modify `src/storage.ts` and `src/storage.test.ts`: 按项目保存、复制、读取和清除调整记录。
- Create `src/components/ActionEditor.tsx`: 编辑动作、停用/撤销和新增动作表单。
- Modify `src/pages/ProjectResultPage.tsx`: 编辑状态、双成本展示、注释和保存/取消流程。
- Modify `src/styles.css`: 编辑态及成本解释的必要样式。
- Modify `api/_lib/result-validation.mjs`, `server.mjs`, `scripts/bid-binding/bindings.mjs`: 接受保留 122 个内置动作并带自定义动作的最终结果。
- Modify `src/App.test.tsx`, `api/_vercel-api.test.mjs`, `scripts/bid-binding/bindings.test.mjs`, `package.json`: 页面、接口、导出及完整测试接线。

### Task 1: Define the adjustment contract

**Files:**
- Modify: `src/types.ts`
- Test: `src/storage.test.ts`

- [ ] **Step 1: Add a compile-time fixture before the types exist**

在 `src/storage.test.ts` 增加并使用以下数据，确保后续存储测试采用真实契约：

```ts
const adjustments: CalculationAdjustments = {
  version: 1,
  overrides: {
    'service-5': { annualFrequency: 400 },
    'cleaning-12': { disabled: true },
  },
  customActions: [{
    id: 'custom-service-1',
    category: 'service',
    action: '夜间客户关怀',
    property: '自定义',
    annualFrequency: 120,
    annualHours: 60,
  }],
};
```

- [ ] **Step 2: Verify typecheck fails**

Run: `npm run typecheck`

Expected: FAIL，提示 `CalculationAdjustments` 尚未导出。

- [ ] **Step 3: Add the exact public types**

在 `src/types.ts` 增加：

```ts
export interface ActionOverride {
  annualFrequency?: number;
  annualHours?: number;
  headcount?: number;
  disabled?: boolean;
}

export interface CustomActionInput {
  id: string;
  category: ActionCategory;
  action: string;
  property: string;
  basis?: string;
  frequency?: string;
  annualFrequency?: number;
  annualHours?: number;
  headcount?: number;
}

export interface CalculationAdjustments {
  version: 1;
  overrides: Record<string, ActionOverride>;
  customActions: CustomActionInput[];
}
```

给 `ServiceActionResult` 增加 `enabled?: boolean`、`source?: 'baseline' | 'custom'`，给 `CalculationResult` 增加 `workloadAnnualCost?: number`，给 `CategorySummary` 增加 `workloadAnnualCost?: number` 和 `workloadEquivalentHeadcount?: number`，给 `ProjectRecord` 增加 `adjustments?: CalculationAdjustments`。这些字段保持可选，旧项目无需迁移。

- [ ] **Step 4: Verify typecheck passes**

Run: `npm run typecheck`

Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add src/types.ts src/storage.test.ts
git commit -m "feat: define service action adjustments"
```

### Task 2: Build the pure adjustment engine

**Files:**
- Create: `scripts/calculation/adjustments.mjs`
- Create: `scripts/calculation/adjustments.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write failing tests for both cost layers**

创建 `scripts/calculation/adjustments.test.mjs`，至少包含以下断言：

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateProject } from './engine.mjs';
import { applyAdjustments } from './adjustments.mjs';
import { PARITY_PROJECTS } from './fixtures/parity-projects.mjs';

const baseline = () => calculateProject(PARITY_PROJECTS[0]);

test('returns the untouched workbook result when no adjustment exists', () => {
  const before = baseline();
  const after = applyAdjustments(before, { version: 1, overrides: {}, customActions: [] });
  assert.equal(after.annualCost, before.annualCost);
  assert.equal(after.totalHeadcount, before.totalHeadcount);
  assert.equal(after.totalActionCount, 122);
});

test('changing annual frequency recalculates hours and workload cost', () => {
  const before = baseline();
  const source = before.actions.find((item) => item.id === 'service-5');
  const after = applyAdjustments(before, { version: 1, overrides: { 'service-5': { annualFrequency: 400 } }, customActions: [] });
  const changed = after.actions.find((item) => item.id === 'service-5');
  assert.equal(changed.annualFrequency, 400);
  assert.ok(Math.abs(changed.annualHours - source.annualHours * 400 / source.annualFrequency) < 1e-7);
  assert.ok(changed.annualCost < source.annualCost);
});

test('an annual-hours override is authoritative', () => {
  const after = applyAdjustments(baseline(), { version: 1, overrides: { 'service-5': { annualFrequency: 400, annualHours: 100 } }, customActions: [] });
  const changed = after.actions.find((item) => item.id === 'service-5');
  assert.equal(changed.annualHours, 100);
  assert.equal(changed.annualCost, 100 * 30 * 1.1);
});

test('disabling an action zeros its workload cost but only changes budget across a staffing boundary', () => {
  const before = baseline();
  const after = applyAdjustments(before, { version: 1, overrides: { 'service-5': { disabled: true } }, customActions: [] });
  const disabled = after.actions.find((item) => item.id === 'service-5');
  assert.equal(disabled.enabled, false);
  assert.equal(disabled.annualCost, 0);
  assert.equal(after.totalActionCount, 121);
  assert.ok(after.workloadAnnualCost < before.actions.reduce((sum, item) => sum + item.annualCost, 0));
});

test('a custom action immediately adds workload cost and participates in rounded staffing', () => {
  const after = applyAdjustments(baseline(), {
    version: 1,
    overrides: {},
    customActions: [{ id: 'custom-service-1', category: 'service', action: '夜间客户关怀', property: '自定义', annualFrequency: 120, annualHours: 500 }],
  });
  const custom = after.actions.find((item) => item.id === 'custom-service-1');
  assert.equal(custom.source, 'custom');
  assert.equal(custom.annualCost, 500 * 30 * 1.1);
  assert.equal(after.totalActionCount, 123);
});

test('rejects invalid numbers and duplicate custom ids', () => {
  assert.throws(() => applyAdjustments(baseline(), { version: 1, overrides: { 'service-5': { annualHours: -1 } }, customActions: [] }), /非负/);
  assert.throws(() => applyAdjustments(baseline(), { version: 1, overrides: {}, customActions: [
    { id: 'service-5', category: 'service', action: '重复动作', property: '自定义', annualHours: 1 },
  ] }), /编号重复/);
});
```

- [ ] **Step 2: Run the tests to verify failure**

Run: `node --test scripts/calculation/adjustments.test.mjs`

Expected: FAIL，提示找不到 `adjustments.mjs`。

- [ ] **Step 3: Implement `applyAdjustments()`**

实现必须遵循以下确定顺序：校验调整对象；克隆基准动作；对内置动作应用频次、工时、人数和停用覆盖；加入自定义动作；按所属分类单价计算动作成本；按当前 Excel 规则重新汇总完整岗位人数与预算；计算全部有效动作的 `workloadAnnualCost`。核心公开接口固定为：

```js
export function applyAdjustments(baseline, adjustments) {
  // 返回新的 CalculationResult，不修改 baseline 或 adjustments。
}
```

频次覆盖但无工时覆盖时，服务类从 `SERVICE_RULES` 取得单次工时，清洁/绿化从对应规则及基准数量取得单位工作量；工时覆盖存在时直接以工时为准。停用动作保留在 `actions` 中，但设为 `enabled: false`、`annualFrequency: 0`、`annualHours: 0`、`headcount: 0`、`annualCost: 0`。客助自定义动作只接受整数人数。分类预算必须继续使用 `SERVICE_ANNUAL_HOURS`、`WORKDAY_HOURS`、`WORKDAYS_PER_YEAR`、各等级日薪及 `ASSISTANCE_MONTHLY_RATE`，不得另设新单价。

- [ ] **Step 4: Wire the new Node test into `package.json` and run it**

把 `scripts/calculation/adjustments.test.mjs` 加入现有 Node 测试命令。

Run: `node --test scripts/calculation/adjustments.test.mjs`

Expected: PASS，6 个测试全部通过。

- [ ] **Step 5: Re-run workbook parity**

Run: `node --no-warnings --experimental-wasm-modules --test scripts/calculation/engine.test.mjs scripts/calculation/calculator.parity.test.mjs scripts/calculation/adjustments.test.mjs`

Expected: PASS；无调整结果仍与 Excel 基准一致。

- [ ] **Step 6: Commit**

```bash
git add scripts/calculation/adjustments.mjs scripts/calculation/adjustments.test.mjs package.json
git commit -m "feat: recalculate adjusted service actions"
```

### Task 3: Expose one adjustment API locally and online

**Files:**
- Create: `api/calculate-adjusted.mjs`
- Modify: `server.mjs`
- Modify: `api/_vercel-api.test.mjs`
- Create: `src/adjustedCalculator.ts`

- [ ] **Step 1: Write failing API tests**

在 `api/_vercel-api.test.mjs` 增加：

```js
test('adjusted calculation rebuilds the baseline before applying user changes', async () => {
  const { createAdjustedCalculateHandler } = await import('./calculate-adjusted.mjs');
  const handler = createAdjustedCalculateHandler({
    calculate: (project) => ({ project, actions: [], categories: [], annualCost: 10 }),
    apply: (baseline, adjustments) => ({ ...baseline, adjustments, annualCost: 20 }),
    validate: () => undefined,
  });
  const response = await handler.fetch(new Request('https://example.test/api/calculate-adjusted', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project: { projectName: '演示项目' }, adjustments: { version: 1, overrides: {}, customActions: [] } }),
  }));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).annualCost, 20);
});
```

- [ ] **Step 2: Verify the API test fails**

Run: `node --test api/_vercel-api.test.mjs`

Expected: FAIL，提示找不到 `calculate-adjusted.mjs`。

- [ ] **Step 3: Implement the API and browser client**

`api/calculate-adjusted.mjs` 接受 `{ project, adjustments }`，先执行现有项目校验和 `calculateProject(project)`，再执行 `applyAdjustments()`。`server.mjs` 的 `/api/calculate-adjusted` 使用完全相同的两个函数。`src/adjustedCalculator.ts` 导出：

```ts
export async function calculateAdjustedProject(
  project: ProjectData,
  adjustments: CalculationAdjustments,
): Promise<CalculationResult> {
  const response = await fetch('/api/calculate-adjusted', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project, adjustments }),
  });
  const payload = await response.json().catch(() => null) as CalculationResult | { error?: string } | null;
  if (!response.ok || !payload || 'error' in payload) throw new Error(payload && 'error' in payload ? payload.error : '调整方案重算失败');
  return payload;
}
```

- [ ] **Step 4: Verify API and type safety**

Run: `node --test api/_vercel-api.test.mjs && npm run typecheck`

Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add api/calculate-adjusted.mjs api/_vercel-api.test.mjs server.mjs src/adjustedCalculator.ts
git commit -m "feat: add adjusted calculation endpoint"
```

### Task 4: Persist adjustments with each project

**Files:**
- Modify: `src/storage.ts`
- Modify: `src/storage.test.ts`

- [ ] **Step 1: Write failing persistence tests**

增加以下行为断言：

```ts
test('saves adjusted result and adjustment record on the active project', () => {
  const project = storage.saveCalculatedProject(result('湖畔家园', '2026-09-03T08:00:00.000Z'));
  storage.saveProjectAdjustments(project.id, adjustments, result('湖畔家园', '2026-09-03T09:00:00.000Z', 420000));
  expect(storage.loadActiveProject()?.adjustments).toEqual(adjustments);
  expect(storage.loadResult()?.annualCost).toBe(420000);
});

test('duplicates adjustments without sharing object references', () => {
  const project = storage.saveCalculatedProject(result('湖畔家园', '2026-09-03T08:00:00.000Z'));
  storage.saveProjectAdjustments(project.id, adjustments, result('湖畔家园', '2026-09-03T09:00:00.000Z'));
  const copy = storage.duplicateProject(project.id)!;
  expect(copy.adjustments).toEqual(adjustments);
  expect(copy.adjustments).not.toBe(storage.loadProjects().find((item) => item.id === project.id)?.adjustments);
});
```

- [ ] **Step 2: Verify tests fail**

Run: `npx vitest run src/storage.test.ts`

Expected: FAIL，提示 `saveProjectAdjustments` 不存在。

- [ ] **Step 3: Implement storage updates**

增加 `loadActiveAdjustments()`、`saveProjectAdjustments(id, adjustments, result)` 和 `clearProjectAdjustments(id, baselineResult)`。保存时同时更新项目记录、`RESULT_KEY` 和更新时间；复制项目时深拷贝调整记录；重新提交基础测算时清除旧调整，避免新参数沿用旧覆盖。

- [ ] **Step 4: Verify storage tests pass**

Run: `npx vitest run src/storage.test.ts`

Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add src/storage.ts src/storage.test.ts
git commit -m "feat: persist project action adjustments"
```

### Task 5: Build the action editor and cost explanations

**Files:**
- Create: `src/components/ActionEditor.tsx`
- Modify: `src/pages/ProjectResultPage.tsx`
- Modify: `src/styles.css`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Write failing page interaction tests**

在 `src/App.test.tsx` 用含真实动作的结果数据增加以下验证：进入“调整服务方案”；修改年频次后调用调整接口；直接修改年工时后显示“已手动调整”；停用动作后该行成本为零；添加自定义动作后动作数和工作量折算成本增加；点击取消不写入存储；点击保存后重新进入页面仍保留调整。

必须包含以下用户可见断言：

```ts
expect(screen.getByText('项目年度用工预算')).toBeTruthy();
expect(screen.getByText('工作量折算成本')).toBeTruthy();
expect(screen.getByRole('columnheader', { name: /年工作量成本/ })).toBeTruthy();
expect(screen.getByText(/按完整岗位人数向上取整/)).toBeTruthy();
```

- [ ] **Step 2: Verify the page tests fail**

Run: `npx vitest run src/App.test.tsx`

Expected: FAIL，因为调整入口和双成本说明尚不存在。

- [ ] **Step 3: Implement `ActionEditor`**

组件接收 `result`、`adjustments`、`onChange`，按分类渲染：服务/清洁/绿化提供年频次与年工时数字框，客助提供整数配置人数；内置动作提供“停用/撤销”，自定义动作提供“删除”；分类底部提供“添加服务动作”。数字输入为空、负数或非数字时显示当前单元格错误且不触发重算。

年频次被修改时只写入 `annualFrequency` 并删除该动作的 `annualHours` 覆盖；年工时被修改时写入 `annualHours`。自定义服务/清洁/绿化动作至少需要名称和年工时，自定义客助动作至少需要名称和配置人数。

- [ ] **Step 4: Integrate editing and explanatory copy**

`ProjectResultPage` 默认查看，点击“调整服务方案”进入编辑；每次有效修改用 200ms 防抖调用 `calculateAdjustedProject()`；请求期间保留上次有效结果并显示“正在重算”。保存调用 `storage.saveProjectAdjustments()`，取消恢复编辑前状态，“恢复原测算”清空覆盖并重新请求空调整。

顶部四项改为：动作总数、配置总人数、项目年度用工预算、服务成本单价，并在其下显示“工作量折算成本”。旧项目缺少 `workloadAnnualCost` 时，临时使用有效动作 `annualCost` 之和显示，不改写历史数据。信息提示准确写入：

```text
年工作量成本：本项年工时按对应人工单价折算，修改年频次或年工时后立即变化。
项目年度用工预算：汇总工作量后按完整岗位人数向上取整，小幅调整时预算可能暂时不变。
服务成本单价：项目年度用工预算除以住宅收费面积和12个月。
```

分类摘要显示“工作量相当于 X.X 人，实际配置 X 人”。停用或修改后比较前后结果，分别显示“本项年工作量成本减少 X 元；当前仍需 X 人，项目年度用工预算暂未变化”或“配置人数由 X 人变为 X 人，年度用工预算同步变化”。

- [ ] **Step 5: Verify focused UI tests and typecheck**

Run: `npx vitest run src/App.test.tsx && npm run typecheck`

Expected: PASS。

- [ ] **Step 6: Commit**

```bash
git add src/components/ActionEditor.tsx src/pages/ProjectResultPage.tsx src/styles.css src/App.test.tsx
git commit -m "feat: edit service actions on result page"
```

### Task 6: Keep overview and generated documents on the saved budget

**Files:**
- Modify: `api/_lib/result-validation.mjs`
- Modify: `server.mjs`
- Modify: `scripts/bid-binding/bindings.mjs`
- Modify: `scripts/bid-binding/bindings.test.mjs`
- Modify: `api/_vercel-api.test.mjs`

- [ ] **Step 1: Write failing compatibility tests**

增加一个结果夹具：122 个内置动作中一个 `enabled: false`，再追加一个 `source: 'custom'` 动作，`totalActionCount` 为122。断言生成接口接受该结果；标书绑定把停用内置动作设为 `enabled: false`；年度运营成本、人数和综合单价使用调整后的分类预算；固定模板不因额外自定义动作而报“不是122项”。

```js
const adjusted = result();
adjusted.actions[0] = { ...adjusted.actions[0], enabled: false, annualCost: 0 };
adjusted.actions.push({ id: 'custom-service-1', category: 'service', source: 'custom', enabled: true, action: '夜间客户关怀', property: '自定义', annualHours: 60, annualCost: 1980 });
adjusted.totalActionCount = 122;
const bindings = buildBidBindings(adjusted);
assert.equal(bindings.actionRows[0].enabled, false);
assert.equal(bindings.named['年度运营成本'], (adjusted.annualCost / 10000).toFixed(2));
```

- [ ] **Step 2: Verify compatibility tests fail**

Run: `node --test scripts/bid-binding/bindings.test.mjs api/_vercel-api.test.mjs`

Expected: FAIL，现有校验仍要求数组长度严格等于122，且未读取 `enabled`。

- [ ] **Step 3: Relax only the correct validation rule**

生成校验改为：必须包含四个分类、金额有效、动作编号唯一，并且恰好保留122个 `source !== 'custom'` 的内置动作；允许附加任意数量已校验的自定义动作。`scripts/bid-binding/bindings.mjs` 的 `actionEnabled()` 首先判断 `item.enabled !== false`，固定模板继续绑定内置动作；总人数、总预算和单价直接使用已调整的汇总结果。自定义动作的详细文字第一版只在网站结果页显示，PPT/标书使用其已计入的最终人数与成本，不擅自改动固定模板版式。

- [ ] **Step 4: Verify generators accept the adjusted result**

Run: `node --test scripts/bid-binding/bindings.test.mjs api/_vercel-api.test.mjs scripts/ppt-binding/bindings.test.mjs`

Expected: PASS。

- [ ] **Step 5: Commit**

```bash
git add api/_lib/result-validation.mjs server.mjs scripts/bid-binding/bindings.mjs scripts/bid-binding/bindings.test.mjs api/_vercel-api.test.mjs
git commit -m "fix: accept adjusted results in document generation"
```

### Task 7: Full regression and real-page acceptance

**Files:**
- Modify only files required by failures found in this task.

- [ ] **Step 1: Run the complete automated suite**

Run: `npm test`

Expected: PASS；基础 Excel 对照、122项初始结果、调整引擎、存储、页面、PPT和标书测试全部通过。

- [ ] **Step 2: Build the production bundle**

Run: `npm run build`

Expected: PASS，Vite 生成 `dist`，无 TypeScript 错误。

- [ ] **Step 3: Start the actual local application**

Run: `npm run serve`

Expected: 本地服务启动成功，浏览器可打开项目的“测算结果”入口。

- [ ] **Step 4: Verify the user-visible flow in the real page**

在真实项目数据下依次核对：默认预算与当前版本一致；信息提示解释两个口径；600改为400时年工时和年工作量成本立即下降；停用动作后行成本归零；未跨人数临界点时预算不变且提示原因；跨临界点时人数、预算和单价变化；新增服务动作后工作量成本立即增加；保存后刷新仍保留；取消与恢复原测算正确；生成按钮提交的是保存后的结果。

- [ ] **Step 5: Inspect browser console and network**

Expected: `/api/calculate-adjusted` 返回200；无 React 报错、无 `NaN`、无未处理 Promise；收费面积为0时服务成本单价显示“—”。

- [ ] **Step 6: Record final status**

```bash
git diff --check
git status --short --branch
```

Expected: `git diff --check` 无输出；工作区无未提交功能改动；分支只包含本功能相关提交。若前两步发现问题，回到对应任务以测试先行方式修复并提交；未经用户明确要求，不推送远端。
