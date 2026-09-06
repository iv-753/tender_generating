# Excel Rule-Assisted Recognition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep sending the complete workbook to the existing AI while adding rule-generated field candidates that help it locate and verify property-project data faster.

**Architecture:** A new pure rule module scans extracted worksheet rows and produces ranked source-cell candidates with reasons and confidence. The existing prompt receives both the unchanged complete workbook text and those candidates; the AI remains the final mapper, and existing normalization remains the final validator. Any rule failure falls back to the current full-workbook AI flow.

**Tech Stack:** Node.js ESM, Formualizer workbook extraction, OpenAI-compatible Qwen API, Node test runner.

---

### Task 1: Build deterministic candidate discovery

**Files:**
- Create: `scripts/excel-recognition/rule-candidates.mjs`
- Create: `scripts/excel-recognition/rule-candidates.test.mjs`

- [ ] **Step 1: Write failing scalar and building candidate tests**

```js
test('finds current scalar fields and excludes historical rows', async () => {
  const workbook = await extractWorkbook(await readFile(new URL('../../outputs/01a065d6-excel-import/02-多工作表与异常口径.xlsx', import.meta.url)));
  const result = buildRuleCandidates(workbook);
  assert.equal(result.fields.residentialChargeArea[0].cell, 'E8');
  assert.equal(result.fields.residentialChargeArea.some((item) => item.sheet === '历史及无关数据'), false);
});

test('finds tabular building source cells', async () => {
  const workbook = await extractWorkbook(await readFile(new URL('../../outputs/01a065d6-excel-import/02-多工作表与异常口径.xlsx', import.meta.url)));
  const result = buildRuleCandidates(workbook);
  assert.equal(result.buildings[0].fields.buildingCount[0].cell, 'B4');
  assert.equal(result.buildings[1].fields.rooftopArea[0].cell, 'H5');
});
```

- [ ] **Step 2: Run the tests and confirm RED**

Run: `node --test scripts/excel-recognition/rule-candidates.test.mjs`

Expected: FAIL because `rule-candidates.mjs` does not exist.

- [ ] **Step 3: Implement the pure candidate engine**

Implement exported `buildRuleCandidates(workbook)` with:

```js
const FIELD_ALIASES = {
  projectName: ['项目名称', '案名', '楼盘名称'],
  region: ['行政区划', '项目区域', '所在区域', '省市区'],
  city: ['城市', '所在城市', '项目城市'],
  serviceGrade: ['服务等级', '服务档次', '服务级别'],
  totalBuildingArea: ['总建筑面积', '建筑面积合计'],
  residentialChargeArea: ['住宅收费面积', '住宅计费面积', '住宅管理面积'],
  deliveredHouseholds: ['已交付户数', '交付户数', '已交付套数'],
  receivedHouseholds: ['已收楼户数', '收楼户数'],
  occupiedHouseholds: ['常住户数', '入住户数', '实际居住户数'],
  perimeterEntrances: ['出入口外围', '出入口及外围面积'],
  gatehouses: ['门楼数', '门岗数', '门楼数量'],
  pavedRoadArea: ['道路铺装面积', '园路面积', '硬质铺装面积'],
  greenArea: ['绿化面积', '园林面积', '绿地面积'],
  lawnRatio: ['草坪比例', '草坪占比'],
  seasonalFlowerArea: ['时花面积', '时令花卉面积', '季节花卉面积'],
  winterProtectionArea: ['防寒面积', '冬季防护面积'],
  garageFloorArea: ['单层车库面积', '车库单层面积'],
  garageFloors: ['车库层数', '地下车库层数'],
};

export function buildRuleCandidates(workbook) {
  const fields = findScalarCandidates(workbook, FIELD_ALIASES);
  const buildings = findBuildingTables(workbook, BUILDING_FIELD_ALIASES);
  return { fields, buildings, conflicts: findConflicts(fields, buildings) };
}
```

Normalize punctuation and whitespace, prefer an adjacent non-empty value cell, score exact aliases above fuzzy aliases, penalize sheet names or row labels containing `历史|失效|作废|参考|无关`, and never invent a source address.

- [ ] **Step 4: Run candidate tests and confirm GREEN**

Run: `node --test scripts/excel-recognition/rule-candidates.test.mjs`

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/excel-recognition/rule-candidates.mjs scripts/excel-recognition/rule-candidates.test.mjs
git commit -m "feat: derive Excel field candidates with rules"
```

### Task 2: Give complete workbook and candidates to the existing AI

**Files:**
- Modify: `scripts/excel-recognition/schema.mjs`
- Modify: `scripts/excel-recognition/providers.mjs`
- Modify: `scripts/excel-recognition/recognize-excel.mjs`
- Modify: `scripts/excel-recognition/providers.test.mjs`
- Create: `scripts/excel-recognition/recognize-excel.test.mjs`

- [ ] **Step 1: Write failing prompt and fallback tests**

```js
test('sends both the complete workbook and rule candidates to the provider', async () => {
  let received;
  const provider = { provider: 'fixture', model: 'fixture', async mapWorkbook(text, candidates) { received = { text, candidates }; return EMPTY_MAPPING; } };
  await recognizeExcel(bytes, { provider });
  assert.match(received.text, /历史及无关数据/);
  assert.equal(received.candidates.fields.residentialChargeArea[0].cell, 'E8');
});

test('falls back to full-workbook AI mapping if candidate generation fails', async () => {
  let receivedText;
  await recognizeExcel(bytes, { provider, buildCandidates() { throw new Error('rule failure'); } });
  assert.match(receivedText, /项目总览/);
});
```

Update the provider request test to require the prompt to contain `规则候选映射` and the original workbook line.

- [ ] **Step 2: Run integration tests and confirm RED**

Run: `node --test scripts/excel-recognition/providers.test.mjs scripts/excel-recognition/recognize-excel.test.mjs`

Expected: FAIL because candidates are not accepted or added to the prompt.

- [ ] **Step 3: Implement the integration**

Change the interfaces to:

```js
export function recognitionPrompt(workbookText, candidates) {
  return `规则候选映射（仅供核对，可纠正）：\n${JSON.stringify(candidates)}\n\n完整工作簿内容：\n${workbookText}`;
}

async mapWorkbook(workbookText, candidates) {
  const prompt = recognitionPrompt(workbookText, candidates);
  return requestStructuredMapping(prompt);
}

export async function recognizeExcel(bytes, { config, provider, buildCandidates = buildRuleCandidates } = {}) {
  const workbook = await extractWorkbook(bytes);
  let candidates;
  try { candidates = buildCandidates(workbook); } catch { candidates = undefined; }
  const mapping = await provider.mapWorkbook(workbook.modelText, candidates);
  return normalizeRecognition(workbook, mapping, { provider: provider.provider, model: provider.model });
}
```

The prompt must explicitly say candidates are hints, the complete workbook is authoritative, the model must correct wrong candidates, and missing values must remain missing. Catch only candidate-generation errors; do not hide extraction, provider, or normalization failures.

- [ ] **Step 4: Run integration and existing recognition tests**

Run: `node --test scripts/excel-recognition/providers.test.mjs scripts/excel-recognition/recognize-excel.test.mjs scripts/excel-recognition/extract-workbook.test.mjs scripts/excel-recognition/normalize-recognition.test.mjs scripts/excel-recognition/server-api.test.mjs`

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/excel-recognition/schema.mjs scripts/excel-recognition/providers.mjs scripts/excel-recognition/recognize-excel.mjs scripts/excel-recognition/providers.test.mjs scripts/excel-recognition/recognize-excel.test.mjs
git commit -m "feat: guide Excel AI recognition with rule candidates"
```

### Task 3: Verify accuracy, fallback, and measured latency

**Files:**
- Modify only if a failing verification reveals a defect in Task 1 or Task 2.

- [ ] **Step 1: Run focused automated verification**

Run: `node --test scripts/excel-recognition/*.test.mjs scripts/excel-import-fixtures.test.mjs`

Expected: all tests pass, including historical-value exclusion and missing-field preservation.

- [ ] **Step 2: Run type and production build checks**

Run: `npm run typecheck && npm run build`

Expected: both commands exit successfully.

- [ ] **Step 3: Measure the two fixed workbooks through the unchanged model**

Run the same segmented timer used for the baseline and record extraction, candidate generation, AI, normalization, and total milliseconds for both files. Verify the final normalized projects match their current baselines exactly. Do not switch models or remove workbook text if the target is missed.

- [ ] **Step 4: Verify the actual upload page**

Restart the local production server, open `http://127.0.0.1:4173/project/new`, upload a fixture, and confirm the recognition progress and result-confirmation modal still work.

- [ ] **Step 5: Commit any final test-only adjustments**

```bash
git add scripts/excel-recognition src
git commit -m "test: verify rule-assisted Excel recognition"
```
