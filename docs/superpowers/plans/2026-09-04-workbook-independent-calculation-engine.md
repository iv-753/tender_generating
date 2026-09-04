# Workbook-Independent Calculation Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the runtime Excel calculation path with a deterministic JavaScript engine that returns the same 122 actions, category summaries, and costs as the current workbook.

**Architecture:** Keep the public `validateProject` and `createCalculator` contract, but make `createCalculator()` synchronous and independent of model bytes. Split immutable business constants, project-derived metrics, typed action rules, and category calculators into focused modules; retain the workbook implementation only under tests as a local oracle.

**Tech Stack:** Node.js ESM, JavaScript, Node test runner, Vitest, Vite, TypeScript, local XLSX oracle through the existing dev-only `formualizer` dependency.

---

### Task 1: Freeze workbook parity fixtures

**Files:**
- Create: `scripts/calculation/workbook-oracle.mjs`
- Create: `scripts/calculation/fixtures/parity-projects.mjs`
- Create: `scripts/calculation/calculator.parity.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Extract the current workbook implementation into a test-only oracle**

Move the present input-writing and result-reading implementation from `scripts/calculation/calculator.mjs` to `scripts/calculation/workbook-oracle.mjs`, export `createWorkbookOracle(modelBytes)`, and keep its 17/48/51/6 row mappings unchanged.

- [ ] **Step 2: Define representative projects**

Export `PARITY_PROJECTS` containing the existing demo project, one case for each service grade and cost band, a zero-area/zero-household case, and building mixes with one and five building types. Each project must satisfy `validateProject`.

- [ ] **Step 3: Write the failing parity test**

The test must load `../动态成本分析模型.xlsx`, create the workbook oracle, call the future pure `createCalculator()`, and compare every response field except `calculatedAt` with numeric tolerance `1e-7`:

```js
const compare = (actual, expected, path = 'result') => {
  if (typeof expected === 'number') {
    assert.ok(Math.abs(actual - expected) <= 1e-7, `${path}: ${actual} !== ${expected}`);
    return;
  }
  // recursively compare arrays and plain objects
};
```

Also assert `totalActionCount === 122` and category action counts equal `17/48/51/6`.

- [ ] **Step 4: Run the parity test and confirm it fails**

Run: `node --no-warnings --experimental-wasm-modules --test scripts/calculation/calculator.parity.test.mjs`

Expected: FAIL because the pure engine does not exist yet or still requires workbook bytes.

- [ ] **Step 5: Register the parity test and commit the harness**

Add the parity test to `pnpm test`, then commit:

```bash
git add scripts/calculation/workbook-oracle.mjs scripts/calculation/fixtures/parity-projects.mjs scripts/calculation/calculator.parity.test.mjs package.json
git commit -m "test: add workbook calculation parity oracle"
```

### Task 2: Add immutable rule data and derived metrics

**Files:**
- Create: `scripts/calculation/rules/constants.mjs`
- Create: `scripts/calculation/rules/service-rules.mjs`
- Create: `scripts/calculation/rules/cleaning-rules.mjs`
- Create: `scripts/calculation/rules/greening-rules.mjs`
- Create: `scripts/calculation/rules/assistance-rules.mjs`
- Create: `scripts/calculation/derived-metrics.mjs`
- Create: `scripts/calculation/derived-metrics.test.mjs`

- [ ] **Step 1: Write failing derived-metric tests**

Cover entrance grass/groundcover splits, tree count, five building-type lobby/stilt/front-hall/stair/rooftop totals, the legacy first-two-building stair `floors + 5` behavior, and garage area multiplication.

- [ ] **Step 2: Run the derived-metric test and confirm it fails**

Run: `node --test scripts/calculation/derived-metrics.test.mjs`

Expected: FAIL with missing module/export.

- [ ] **Step 3: Implement deterministic derived metrics**

Export `deriveMetrics(project)` using only finite arithmetic and the exact workbook equations. Return source project fields plus named derived quantities such as `gateWallArea`, `entranceLawnArea`, `mainLawnArea`, `lobbyFloorArea`, `stairWallArea`, and `garageTotalArea`.

- [ ] **Step 4: Encode the 122 rules as immutable data**

Transcribe workbook action names, attributes, units, quantity-source identifiers, grade frequencies, unit times, occurrence parameters, and staffing ratios into the four rule files. Export frozen arrays and validate their lengths at module load:

```js
if (SERVICE_RULES.length !== 17) throw new Error('服务规则数量必须为 17');
if (CLEANING_RULES.length !== 48) throw new Error('清洁规则数量必须为 48');
if (GREENING_RULES.length !== 51) throw new Error('绿化规则数量必须为 51');
if (ASSISTANCE_RULES.length !== 6) throw new Error('客助规则数量必须为 6');
```

- [ ] **Step 5: Run metric tests and commit**

Run: `node --test scripts/calculation/derived-metrics.test.mjs`

Expected: PASS.

```bash
git add scripts/calculation/rules scripts/calculation/derived-metrics.mjs scripts/calculation/derived-metrics.test.mjs
git commit -m "feat: encode property calculation rules"
```

### Task 3: Implement the pure 122-action engine

**Files:**
- Create: `scripts/calculation/engine.mjs`
- Create: `scripts/calculation/engine.test.mjs`
- Modify: `scripts/calculation/calculator.mjs`

- [ ] **Step 1: Write failing engine contract tests**

Assert validation behavior, stable action ids, category order, `122` actions, finite non-negative outputs, service/cleaning/greening aggregate-before-rounding staffing, and assistance per-action rounding.

- [ ] **Step 2: Run the engine tests and confirm they fail**

Run: `node --test scripts/calculation/engine.test.mjs`

Expected: FAIL with missing engine exports.

- [ ] **Step 3: Implement category calculators**

Implement rule-type switches rather than formula evaluation. Resolve quantity only through named derived metrics; apply grade frequency/unit-time tables, annual-frequency conversions, current monthly/hourly wages, and the legacy rounding rules. Throw on unknown rule types, unknown quantity sources, zero denominators, duplicate ids, or non-finite/negative outputs.

- [ ] **Step 4: Replace the production calculator facade**

Keep `validateProject(project)` and export:

```js
export function createCalculator() {
  return calculateProject;
}
```

`calculateProject` returns the existing `CalculationResult` shape and adds only the current timestamp variability.

- [ ] **Step 5: Run engine and parity tests; correct every mismatch**

Run:

```bash
node --test scripts/calculation/derived-metrics.test.mjs scripts/calculation/engine.test.mjs
node --no-warnings --experimental-wasm-modules --test scripts/calculation/calculator.parity.test.mjs
```

Expected: all tests PASS; parity output reports all projects and all 122 actions equal within tolerance.

- [ ] **Step 6: Commit the engine**

```bash
git add scripts/calculation/calculator.mjs scripts/calculation/engine.mjs scripts/calculation/engine.test.mjs scripts/calculation/rules
git commit -m "feat: calculate property costs without Excel"
```

### Task 4: Remove Excel from production request paths

**Files:**
- Modify: `server.mjs`
- Modify: `api/calculate.mjs`
- Modify: `api/_vercel-api.test.mjs`
- Delete: `api/_lib/model-loader.mjs`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `vercel.json`
- Modify: `SECURITY-NOTE.md`

- [ ] **Step 1: Rewrite endpoint tests to require zero model loading**

Construct the handler with `{ calculate, validate }`, POST a project, and assert the injected pure calculator is called once. Delete the model-loader fallback test and add a source/config assertion that production files contain neither `model-loader` nor `动态成本分析模型.xlsx`.

- [ ] **Step 2: Run the endpoint test and confirm it fails**

Run: `node --test api/_vercel-api.test.mjs`

Expected: FAIL because `api/calculate.mjs` still initializes the workbook.

- [ ] **Step 3: Wire both servers directly to the pure calculator**

Create the calculator at module startup without `await`, bytes, Blob, or filesystem access. Preserve status codes, JSON bodies, and validation messages.

- [ ] **Step 4: Remove runtime model infrastructure**

Delete `api/_lib/model-loader.mjs`, remove its Vercel configuration, move `formualizer` from `dependencies` to `devDependencies` because only the parity oracle and `verify:model` use it, and update the lockfile with the bundled pnpm runtime.

- [ ] **Step 5: Run endpoint, type, and build checks**

Run:

```bash
node --test api/_vercel-api.test.mjs
pnpm typecheck
pnpm build
```

Expected: all PASS and `dist` contains no workbook/model loader.

- [ ] **Step 6: Commit production wiring**

```bash
git add server.mjs api/calculate.mjs api/_vercel-api.test.mjs package.json pnpm-lock.yaml vercel.json SECURITY-NOTE.md
git rm api/_lib/model-loader.mjs
git commit -m "refactor: remove Excel from production calculation"
```

### Task 5: Full regression and actual-page acceptance

**Files:**
- Modify only if a verified regression requires a scoped fix.

- [ ] **Step 1: Run the complete automated suite**

Run: `pnpm test`

Expected: all Vitest and Node tests PASS, including workbook parity.

- [ ] **Step 2: Start the real local application**

Run: `pnpm serve`

Expected: the application starts on its configured localhost port without reading the workbook.

- [ ] **Step 3: Verify the customer flow in the browser**

At the actual new-project entry, submit the default example, open the result page, and verify the four categories contain `17/48/51/6` actions, totals render, and the browser network request to `/api/calculate` succeeds without any model-file request.

- [ ] **Step 4: Re-run proof commands after any fix**

Run: `pnpm test && pnpm build`

Expected: PASS after the final edit.

- [ ] **Step 5: Record final repository state**

Run:

```bash
git status --short
git log -5 --oneline
```

Expected: only deliberate changes remain, with no workbook or generated artifact tracked.
