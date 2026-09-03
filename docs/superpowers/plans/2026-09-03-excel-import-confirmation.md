# Excel 智能导入与确认 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有新建测算页加入可见的 Excel 智能导入、识别等待、结果确认和表单回填闭环。

**Architecture:** 新增一个无状态接口客户端负责二进制上传；新增独立导入组件负责文件校验、调用状态和确认框；`ProjectNewPage`只负责把确认结果写入现有 Ant Design Form。后端识别结果不直接触发测算或持久化。

**Tech Stack:** React 19、TypeScript、Ant Design 6、Vitest、Testing Library、现有 Node `/api/excel/recognize` 接口。

---

### Task 1: 识别结果类型与接口客户端

**Files:**
- Modify: `src/types.ts`
- Create: `src/excelRecognition.ts`
- Create: `src/excelRecognition.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
test('uploads xlsx bytes and returns the recognition payload', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(result), { status: 200 })));
  expect(await recognizeExcelFile(new File(['xlsx'], '项目资料.xlsx'))).toEqual(result);
  expect(fetch).toHaveBeenCalledWith('/api/excel/recognize', expect.objectContaining({ method: 'POST' }));
});

test('rejects unsupported or oversized files before upload', async () => {
  await expect(recognizeExcelFile(new File(['text'], '资料.xls'))).rejects.toThrow('仅支持 .xlsx 文件');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/excelRecognition.test.ts`

Expected: FAIL because `recognizeExcelFile` does not exist.

- [ ] **Step 3: Implement the typed client**

Add `RecognitionEvidence`, `ExcelRecognitionResult` and nullable recognized project types to `src/types.ts`. Implement:

```ts
export async function recognizeExcelFile(file: File): Promise<ExcelRecognitionResult> {
  if (!file.name.toLowerCase().endsWith('.xlsx')) throw new Error('仅支持 .xlsx 文件');
  if (file.size > 10_000_000) throw new Error('文件不能超过 10MB');
  const response = await fetch('/api/excel/recognize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'X-File-Name': encodeURIComponent(file.name),
    },
    body: file,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(payload?.error || 'Excel识别失败，请重新上传');
  return payload as ExcelRecognitionResult;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/excelRecognition.test.ts`

Expected: PASS.

### Task 2: 导入入口、等待状态与确认框

**Files:**
- Create: `src/components/ExcelImportPanel.tsx`
- Modify: `src/pages/ProjectNewPage.tsx`
- Modify: `src/styles.css`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Write the failing interaction tests**

Mock `recognizeExcelFile` in `src/App.test.tsx`, then add tests that require: `/project/new` shows “Excel智能导入”；upload shows “正在识别项目数据”；resolved recognition opens “识别结果确认”；the project-name form value remains unchanged before “采用识别结果”；after confirmation it becomes the recognized value and missing `seasonalFlowerArea` remains empty；cancel and error preserve the original form.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/App.test.tsx -t "Excel智能导入|识别结果"`

Expected: FAIL because the import entry and dialog do not exist.

- [ ] **Step 3: Implement the component and page connection**

`ExcelImportPanel` receives one callback:

```ts
type Props = { onApply: (result: ExcelRecognitionResult) => void };
```

It owns `idle / recognizing / review / error / applied`, uses `Upload.Dragger` with `beforeUpload={() => false}`, calls `recognizeExcelFile`, renders a non-fake indeterminate wait state, and opens an Ant Design `Modal` listing business labels and normalized values. “采用识别结果” calls `onApply` only once; “取消” closes the modal without mutation.

In `ProjectNewPage`, insert the component before `.input-workspace` and apply data with:

```ts
const applyRecognition = (result: ExcelRecognitionResult) => {
  form.setFieldsValue(result.project as ProjectData);
  const firstMissingStep = findFirstMissingStep(result.missingFields);
  if (firstMissingStep !== undefined) setCurrentStep(firstMissingStep);
  message.success(result.missingFields.length ? '识别结果已写入，请补充缺失字段' : '识别结果已写入，请核对后开始测算');
};
```

Style the import area with the existing navy/teal palette, square corners and one restrained amber status accent. On mobile, stack the copy and action controls. Do not add gradients, fake AI scores or implementation terminology.

- [ ] **Step 4: Run focused tests to verify they pass**

Run: `npx vitest run src/excelRecognition.test.ts src/App.test.tsx -t "Excel|识别|uploads xlsx|unsupported"`

Expected: PASS.

### Task 3: Verification and delivery

**Files:**
- Verify: `src/components/ExcelImportPanel.tsx`
- Verify: `src/pages/ProjectNewPage.tsx`
- Verify: `src/styles.css`

- [ ] **Step 1: Run automated verification**

Run: `npx vitest run src/excelRecognition.test.ts src/App.test.tsx && npm run typecheck && npm run build`

Expected: all commands exit 0. Existing Ant Design deprecation warnings may remain, but no new test failures are allowed.

- [ ] **Step 2: Run actual-page verification**

Open `http://127.0.0.1:4173/project/new`, verify the import entry is visible, upload `outputs/01a065d6-excel-import/02-多工作表与异常口径.xlsx`, wait for the real recognition result, verify the confirmation dialog shows “云麓华庭”、杭州、B级、住宅收费面积108000 and missing时花面积, then apply and inspect the corresponding form steps.

- [ ] **Step 3: Inspect and commit**

Run: `git diff --check && git status --short`

Then commit only the planned frontend files:

```bash
git add src/types.ts src/excelRecognition.ts src/excelRecognition.test.ts src/components/ExcelImportPanel.tsx src/pages/ProjectNewPage.tsx src/styles.css src/App.test.tsx
git commit -m "feat: add Excel recognition workflow"
```
