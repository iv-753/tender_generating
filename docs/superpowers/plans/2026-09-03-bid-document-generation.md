# Bid Document Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a working “生成投标标书” flow that binds the current 122-action calculation result into the approved Word template and downloads a `.docx`.

**Architecture:** Mirror the existing asynchronous PPT job API. A focused Node generator builds binding data and invokes the existing Python Word binder; the result page creates and polls the job, then exposes the download. Disabled service rows are removed by the binder while the source calculation remains unchanged.

**Tech Stack:** React 19, TypeScript, Ant Design, Node HTTP server, Node test runner, Vitest, Python `python-docx`.

---

### Task 1: Remove disabled actions from the generated document

**Files:**
- Modify: `scripts/bid-binding/bindings.mjs`
- Modify: `scripts/bid-binding/apply_bindings.py`
- Test: `scripts/bid-binding/bindings.test.mjs`
- Test: `scripts/bid-binding/test_apply_bindings.py`

- [ ] **Step 1: Write failing tests**

Add a binding test that changes `service-5` to `frequency: '不设置'`, `annualFrequency: 0`, and asserts its binding contains `enabled: false`; add a Python test that marks the first action binding disabled and asserts the generated table has one fewer repeated action row.

- [ ] **Step 2: Run tests and verify the expected failures**

Run:

```powershell
node --test scripts/bid-binding/bindings.test.mjs
python -m unittest scripts/bid-binding/test_apply_bindings.py
```

Expected: the JavaScript assertion receives no `enabled` field and the Python output still contains the disabled row.

- [ ] **Step 3: Implement the smallest row-removal behavior**

Add this rule in `bindings.mjs` and attach it to action and staffing bindings:

```js
function actionEnabled(item) {
  const frequency = String(item.frequency ?? '').trim();
  return !['', '-', '无', '不设置'].includes(frequency)
    && (item.annualFrequency === undefined || Number(item.annualFrequency) > 0);
}
```

For staffing rows use `Number(item.headcount || 0) > 0`. In `apply_bindings.py`, remove disabled rows before placeholder replacement with `row._element.getparent().remove(row._element)`; enabled rows retain the existing title validation and replacement.

- [ ] **Step 4: Run both binding test suites and commit**

Expected: all binding tests pass and enabled source rows retain their existing formatting.

### Task 2: Add a command-line Word generator

**Files:**
- Create: `scripts/bid-binding/generate-bid.mjs`
- Test: `scripts/bid-binding/generate-bid.test.mjs`

- [ ] **Step 1: Write a failing generator test**

Create a test that invokes the exported `generateBidDocument` with the real cleaned template and the existing complete fixture, then verifies the output file exists, starts with ZIP signature `PK`, contains the current project name, and contains no `{{...}}` placeholders when opened through `python-docx`.

- [ ] **Step 2: Run it and verify failure because the module does not exist**

Run `node --test scripts/bid-binding/generate-bid.test.mjs` and expect `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement the generator**

Export:

```js
export async function generateBidDocument({ templatePath, result, outputPath, generatedAt, onStage })
```

It must call `buildBidBindings` with formal fallbacks (`住宅物业`, `以投标授权文件为准`, `以招标文件约定为准`), write a temporary UTF-8 binding JSON beside the output, spawn `process.env.RUNTIME_PYTHON || 'python'` with `apply_bindings.py`, forward `preparing`, `binding`, and `exporting` stages, reject on non-zero exit, and always delete the temporary JSON.

- [ ] **Step 4: Run the generator test and commit**

Expected: the real Word file is generated and passes content checks.

### Task 3: Expose asynchronous bid-generation APIs

**Files:**
- Modify: `server.mjs`
- Create: `scripts/bid-binding/server-api.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write a failing API integration test**

Spawn `server.mjs` on an unused port, POST the complete fixture to `/api/bid/jobs`, poll `/api/bid/jobs/:id`, download `/api/bid/jobs/:id/download`, and assert status `200`, Word MIME type, `.docx` filename, and ZIP signature. Also POST an incomplete result and assert status `400`.

- [ ] **Step 2: Run it and verify `/api/bid/jobs` returns 404**

Run `node --test scripts/bid-binding/server-api.test.mjs` and expect the missing endpoint failure.

- [ ] **Step 3: Implement API and job execution**

Add `BID_TEMPLATE`, `BID_GENERATOR`, and `bidJobs`; implement `publicBidJob`, `startBidJob`, and `downloadBidDocument`; expose:

```text
POST /api/bid/jobs
GET  /api/bid/jobs/:id
GET  /api/bid/jobs/:id/download
```

The POST must validate the submitted current calculation result, create `<项目名>-投标标书.docx`, cap in-memory jobs at 30, and never substitute demo data. The worker must clean its temporary result file on success or failure.

- [ ] **Step 4: Add the API test to `npm test`, run it, and commit**

Expected: valid job completes and downloads; invalid result is rejected.

### Task 4: Add the result-page button, progress, and download

**Files:**
- Modify: `src/pages/ProjectResultPage.tsx`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Write failing UI tests**

Add a test that clicks `生成投标标书`, asserts POST `/api/bid/jobs` receives the saved current result, verifies the “正在生成投标标书” state, completes the mocked poll, and asserts the download link points to `/api/bid/jobs/job-2/download` with the returned `.docx` filename. Add an error response assertion for readable failure text.

- [ ] **Step 2: Run the focused test and verify the button is absent**

Run:

```powershell
node node_modules/vitest/vitest.mjs run src/App.test.tsx -t "generates a bid document" --reporter=dot
```

Expected: failure because `生成投标标书` cannot be found.

- [ ] **Step 3: Implement the UI flow**

Add a secondary `FileTextOutlined` button beside `生成路演PPT`, a separate bid job state, POST/poll logic, four bid-specific stage labels, success `Result`, and a `下载标书` link. Keep the PPT flow unchanged and disable only the bid button while its own job runs.

- [ ] **Step 4: Run focused and full tests, build, and commit**

Run `npm test` and `npm run build`; expected: zero failures and a successful production build.

### Task 5: Verify the real customer flow

**Files:**
- No production file changes expected.

- [ ] **Step 1: Open the exact result route**

Open `http://127.0.0.1:4173/project/result` with a saved real calculation result; verify the new button is visible beside the PPT button and the header does not wrap or overflow.

- [ ] **Step 2: Generate and inspect one real document**

Click the button, observe all progress stages, download the `.docx`, and verify with `python-docx`: current project name appears, representative service/cleaning/greening values match the submitted result, disabled actions are absent from their service tables, and no double-brace placeholders remain.

- [ ] **Step 3: Check Git state**

Run `git diff --check` and `git status --short`; expected: no whitespace errors and only intentional files before the final implementation commit.
