# 452 项完整物业成本模型 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有 122 项局部测算升级为脱离 Excel 运行的 452 项完整物业成本模型，并提供可选高级参数、7 类服务结果和独立管理成本。

**Architecture:** 保留现有 `ProjectData → API → calculation engine → CalculationResult` 主链路，在基础参数和动作规则之间增加版本化的高级参数解析层。原 Excel 只由一次性迁移脚本和本地回归测试读取；生产运行只使用提交到代码库的参数字典、规则模块和计算函数。

**Tech Stack:** React 19、TypeScript、Ant Design 6、Node.js ESM、Vitest、Node test runner、Python/openpyxl（仅一次性迁移）。

---

## 文件结构

新增或拆分后的职责如下：

- `scripts/calculation/category-config.mjs`：7 个服务分类、数量和成本模型的唯一配置源。
- `scripts/calculation/rules/advanced-parameter-definitions.mjs`：高级参数字典、默认值规则及关联动作。
- `scripts/calculation/advanced-parameters.mjs`：生成默认参数快照并应用客户覆盖值。
- `scripts/calculation/rules/pest-control-rules.mjs`：7 项四害消杀规则。
- `scripts/calculation/rules/engineering-outsourced-rules.mjs`：95 项工程委外规则。
- `scripts/calculation/rules/engineering-routine-rules.mjs`：228 项工程常规规则。
- `scripts/calculation/full-cost-calculators.mjs`：四害、两类工程及管理成本计算。
- `src/components/AdvancedParametersDrawer.tsx`：高级参数分组查看、调整和恢复。
- 现有 `engine.mjs` 继续负责组装结果，不把 452 项规则或页面逻辑堆入该文件。

## Task 1：建立 V2 数据契约与分类配置

**Files:**
- Create: `scripts/calculation/category-config.mjs`
- Modify: `src/types.ts`
- Modify: `src/calculation.ts`
- Test: `src/calculation.test.ts`

- [ ] **Step 1：先写失败的分类契约测试**

在 `src/calculation.test.ts` 将动作数量测试改为：

```ts
test('locks the complete result inventory to exactly 452 standard actions', () => {
  expect(ACTION_COUNTS).toEqual({
    service: 17,
    cleaning: 48,
    greening: 51,
    assistance: 6,
    pestControl: 7,
    engineeringOutsourced: 95,
    engineeringRoutine: 228,
  });
  expect(Object.values(ACTION_COUNTS).reduce((sum, count) => sum + count, 0)).toBe(452);
});
```

- [ ] **Step 2：运行测试并确认旧契约失败**

Run: `pnpm exec vitest run src/calculation.test.ts`

Expected: FAIL，显示当前 `ACTION_COUNTS` 仍只有 122 项。

- [ ] **Step 3：增加统一分类配置**

创建 `scripts/calculation/category-config.mjs`：

```js
export const CATEGORY_CONFIG = Object.freeze([
  { category: 'service', title: '服务', expectedCount: 17, costModel: 'rounded-service-staffing' },
  { category: 'cleaning', title: '清洁', expectedCount: 48, costModel: 'rounded-daily-staffing' },
  { category: 'greening', title: '绿化', expectedCount: 51, costModel: 'rounded-daily-staffing' },
  { category: 'assistance', title: '客助', expectedCount: 6, costModel: 'dedicated-posts' },
  { category: 'pestControl', title: '四害消杀', expectedCount: 7, costModel: 'pest-workdays' },
  { category: 'engineeringOutsourced', title: '工程委外', expectedCount: 95, costModel: 'rounded-outsourced-staffing' },
  { category: 'engineeringRoutine', title: '工程常规', expectedCount: 228, costModel: 'rounded-routine-staffing' },
]);

export const CATEGORY_TITLES = Object.freeze(Object.fromEntries(
  CATEGORY_CONFIG.map(({ category, title }) => [category, title]),
));

export const STANDARD_ACTION_COUNT = CATEGORY_CONFIG.reduce(
  (sum, item) => sum + item.expectedCount,
  0,
);
```

同步扩展 `src/calculation.ts` 的 `ACTION_COUNTS`，并在 `src/types.ts` 定义 V2 类型：

```ts
export type ActionCategory =
  | 'service'
  | 'cleaning'
  | 'greening'
  | 'assistance'
  | 'pestControl'
  | 'engineeringOutsourced'
  | 'engineeringRoutine';

export type AdvancedParameterGroup = 'basement' | 'building' | 'grounds' | 'staffingCost';
export type AdvancedParameterSource = 'derived' | 'estimated' | 'template' | 'manual';

export interface AdvancedParameterSnapshot {
  key: string;
  label: string;
  group: AdvancedParameterGroup;
  unit: string;
  defaultValue: number;
  value: number;
  source: AdvancedParameterSource;
  affectedActionIds: string[];
}

export interface ManagementCostSummary {
  headcount: number;
  annualCost: number;
}
```

给 `ProjectData` 增加 `advancedParameterOverrides?: Record<string, number>`；将 `CalculationResult.version` 改为 `2`，并增加：

```ts
advancedParameterVersion: string;
advancedParameters: AdvancedParameterSnapshot[];
standardActionCount: 452;
activeActionCount: number;
management: ManagementCostSummary;
```

- [ ] **Step 4：运行契约测试和类型检查**

Run: `pnpm exec vitest run src/calculation.test.ts && pnpm run typecheck`

Expected: PASS。

- [ ] **Step 5：提交数据契约**

```bash
git add scripts/calculation/category-config.mjs src/types.ts src/calculation.ts src/calculation.test.ts
git commit -m "feat: define complete calculation contract"
```

## Task 2：迁移 330 项规则并形成高级参数字典

**Files:**
- Create: `scripts/calculation/migration/full-model-parameter-map.json`
- Modify: `scripts/calculation/migration/generate-static-rules.py`
- Create: `scripts/calculation/rules/advanced-parameter-definitions.mjs`
- Create: `scripts/calculation/rules/pest-control-rules.mjs`
- Create: `scripts/calculation/rules/engineering-outsourced-rules.mjs`
- Create: `scripts/calculation/rules/engineering-routine-rules.mjs`
- Create: `scripts/calculation/full-rule-catalog.test.mjs`

- [ ] **Step 1：写规则完整性测试**

创建 `scripts/calculation/full-rule-catalog.test.mjs`：

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { ADVANCED_PARAMETER_DEFINITIONS } from './rules/advanced-parameter-definitions.mjs';
import { PEST_CONTROL_RULES } from './rules/pest-control-rules.mjs';
import { ENGINEERING_OUTSOURCED_RULES } from './rules/engineering-outsourced-rules.mjs';
import { ENGINEERING_ROUTINE_RULES } from './rules/engineering-routine-rules.mjs';

test('contains every missing workbook action and a deduplicated parameter catalog', () => {
  assert.equal(PEST_CONTROL_RULES.length, 7);
  assert.equal(ENGINEERING_OUTSOURCED_RULES.length, 95);
  assert.equal(ENGINEERING_ROUTINE_RULES.length, 228);
  const parameterKeys = new Set(ADVANCED_PARAMETER_DEFINITIONS.map((item) => item.key));
  assert.equal(parameterKeys.size, ADVANCED_PARAMETER_DEFINITIONS.length);
  assert.ok(parameterKeys.size >= 65 && parameterKeys.size <= 80);
  for (const rule of [...PEST_CONTROL_RULES, ...ENGINEERING_OUTSOURCED_RULES, ...ENGINEERING_ROUTINE_RULES]) {
    assert.ok(rule.id);
    assert.ok(rule.action);
    assert.ok(parameterKeys.has(rule.quantityParameterKey));
  }
});

test('maps every affected action back to the same parameter', () => {
  const byKey = new Map(ADVANCED_PARAMETER_DEFINITIONS.map((item) => [item.key, item]));
  for (const rule of [...PEST_CONTROL_RULES, ...ENGINEERING_OUTSOURCED_RULES, ...ENGINEERING_ROUTINE_RULES]) {
    assert.ok(byKey.get(rule.quantityParameterKey).affectedActionIds.includes(rule.id));
  }
});
```

- [ ] **Step 2：运行测试并确认规则模块尚不存在**

Run: `node --test scripts/calculation/full-rule-catalog.test.mjs`

Expected: FAIL，提示缺少完整规则文件。

- [ ] **Step 3：建立参数行映射**

从内部工作簿读取 `四害消杀!5:11`、`工程委外!5:99`、`工程常规!5:232`。在 `full-model-parameter-map.json` 中为每个来源行指定稳定参数编号；同一设施的巡查、检测和保养行必须使用同一编号。文件结构固定为：

```json
{
  "version": "2026-09-full-model-v1",
  "rows": {
    "四害消杀:5": "pest.treatmentArea",
    "工程常规:5": "basement.parkingArea",
    "工程常规:6": "basement.fireShutterCount",
    "工程委外:5": "basement.fireShutterCount"
  }
}
```

逐行补全 330 个来源行，不允许自动按相同数字合并；数量碰巧相同但业务对象不同的设施必须保留为不同参数。完成后用脚本校验三张表的每个动作行恰好出现一次。

- [ ] **Step 4：扩展一次性迁移脚本**

在 `generate-static-rules.py` 增加以下输出契约：

```python
MISSING_SHEETS = {
    "四害消杀": (5, 11, "pest-control"),
    "工程委外": (5, 99, "engineering-outsourced"),
    "工程常规": (5, 232, "engineering-routine"),
}

def require_parameter_key(mapping: dict[str, str], sheet_name: str, row: int) -> str:
    source = f"{sheet_name}:{row}"
    if source not in mapping:
        raise ValueError(f"缺少高级参数映射：{source}")
    return mapping[source]

GRADE_REFERENCE = re.compile(r"'分级单价保洁、绿化 '!([A-Z]+[0-9]+)")

def grade_unit_hours(formula_sheet, value_sheet, row: int) -> dict[str, float]:
    formula = formula_sheet.cell(row, 5).value
    references = GRADE_REFERENCE.findall(formula or "")
    if len(references) != 4:
        raise ValueError(f"无法读取四档标准工时：{formula_sheet.title}!E{row}")
    travel_ratio = ratio(formula_sheet.cell(row, 7).value or "")
    scale = multiplier(formula)
    return dict(zip(GRADES, (
        float(value_sheet[reference].value) * scale * (1 + travel_ratio)
        for reference in references
    )))

def engineering_rule(formula_sheet, value_sheet, price_sheet, row: int, prefix: str, parameter_key: str) -> dict:
    frequency = formula_sheet.cell(row, 11).value or "0"
    annual_frequency = float(value_sheet.cell(row, 14).value or 0)
    return {
        "id": f"{prefix}-{row}",
        "action": formula_sheet.cell(row, 1).value,
        "system": formula_sheet.cell(row, 2).value or "",
        "property": "基础" if str(formula_sheet.cell(row, 1).value).startswith("A-") else "可选",
        "unit": formula_sheet.cell(row, 3).value or "",
        "quantityParameterKey": parameter_key,
        "templateQuantity": value_sheet.cell(row, 4).value or 0,
        "unitHours": grade_unit_hours(formula_sheet, price_sheet, row),
        "frequency": dict.fromkeys(GRADES, frequency),
        "annualFrequency": dict.fromkeys(GRADES, annual_frequency),
        "monthlyRate": value_sheet.cell(row, 16).value or 0,
    }
```

迁移脚本同时打开公式工作簿和 `data_only=True` 的数值工作簿；`price_sheet` 传入“分级单价保洁、绿化 ”。四害因列结构不同，单独读取 C 列数量、K 列年频次以及 D/F 列单位和在途工时。迁移脚本必须把公式拆成静态数值和明确字段，不得把 Excel 公式字符串复制到生产规则中。

- [ ] **Step 5：生成并检查静态规则**

Run: `python scripts/calculation/migration/generate-static-rules.py`

Expected: 生成 3 个动作规则模块和 1 个高级参数定义模块；输出规则数量 `7 / 95 / 228`，参数数量位于 `65—80`。

- [ ] **Step 6：运行完整性测试**

Run: `node --test scripts/calculation/full-rule-catalog.test.mjs`

Expected: PASS。

- [ ] **Step 7：提交静态规则**

```bash
git add scripts/calculation/migration scripts/calculation/rules scripts/calculation/full-rule-catalog.test.mjs
git commit -m "feat: migrate complete action and parameter catalogs"
```

## Task 3：实现高级参数默认值解析

**Files:**
- Create: `scripts/calculation/advanced-parameters.mjs`
- Create: `scripts/calculation/advanced-parameters.test.mjs`
- Modify: `scripts/calculation/derived-metrics.mjs`
- Modify: `scripts/calculation/calculator.mjs`

- [ ] **Step 1：写默认值和覆盖规则测试**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { PARITY_PROJECTS } from './fixtures/parity-projects.mjs';
import { resolveAdvancedParameters } from './advanced-parameters.mjs';

test('resolves every advanced parameter without customer input', () => {
  const result = resolveAdvancedParameters(PARITY_PROJECTS[0]);
  assert.ok(result.length >= 65 && result.length <= 80);
  assert.ok(result.every((item) => Number.isFinite(item.value) && item.value >= 0));
  assert.ok(result.every((item) => item.source !== 'manual'));
});

test('keeps a manual override and can return to the generated default', () => {
  const project = {
    ...PARITY_PROJECTS[0],
    advancedParameterOverrides: { 'basement.fireShutterCount': 300 },
  };
  const result = resolveAdvancedParameters(project);
  const shutters = result.find((item) => item.key === 'basement.fireShutterCount');
  assert.equal(shutters.defaultValue, 252);
  assert.equal(shutters.value, 300);
  assert.equal(shutters.source, 'manual');
});
```

- [ ] **Step 2：确认测试失败**

Run: `node --test scripts/calculation/advanced-parameters.test.mjs`

Expected: FAIL，提示缺少解析模块。

- [ ] **Step 3：实现统一解析器**

创建 `advanced-parameters.mjs`：

```js
import { deriveMetrics } from './derived-metrics.mjs';
import { ADVANCED_PARAMETER_DEFINITIONS } from './rules/advanced-parameter-definitions.mjs';

export const ADVANCED_PARAMETER_VERSION = '2026-09-full-model-v1';

function finiteNonNegative(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) throw new Error(`${label}必须为非负数`);
  return number;
}

function defaultValue(definition, metrics) {
  const rule = definition.defaultRule;
  if (rule.type === 'metric') return metrics[rule.metric] * (rule.scale ?? 1);
  if (rule.type === 'scaled-template') {
    if (rule.baselineMetric === 0) return rule.templateValue;
    return rule.templateValue * metrics[rule.metric] / rule.baselineMetric;
  }
  if (rule.type === 'template') return rule.value;
  throw new Error(`未知高级参数默认规则：${rule.type}`);
}

export function resolveAdvancedParameters(project) {
  const metrics = deriveMetrics(project);
  const overrides = project.advancedParameterOverrides ?? {};
  return ADVANCED_PARAMETER_DEFINITIONS.map((definition) => {
    let generated = finiteNonNegative(defaultValue(definition, metrics), definition.label);
    if (definition.round === 'integer') generated = Math.round(generated);
    const manual = Object.hasOwn(overrides, definition.key);
    return {
      ...definition,
      defaultValue: generated,
      value: manual ? finiteNonNegative(overrides[definition.key], definition.label) : generated,
      source: manual ? 'manual' : definition.defaultRule.source,
    };
  });
}

export function parameterValues(snapshot) {
  return Object.fromEntries(snapshot.map(({ key, value }) => [key, value]));
}
```

- [ ] **Step 4：在项目校验中检查覆盖参数**

在 `calculator.mjs` 的 `validateProject()` 中验证：覆盖键必须存在于参数字典，值必须为有限非负数。未知键返回“高级参数不存在：编号”，不静默忽略。

- [ ] **Step 5：运行参数和项目校验测试**

Run: `node --test scripts/calculation/advanced-parameters.test.mjs scripts/calculation/derived-metrics.test.mjs`

Expected: PASS。

- [ ] **Step 6：提交默认参数解析器**

```bash
git add scripts/calculation/advanced-parameters.mjs scripts/calculation/advanced-parameters.test.mjs scripts/calculation/derived-metrics.mjs scripts/calculation/calculator.mjs
git commit -m "feat: resolve default advanced parameters"
```

## Task 4：实现四害、工程和管理成本计算

**Files:**
- Create: `scripts/calculation/full-cost-calculators.mjs`
- Create: `scripts/calculation/full-cost-calculators.test.mjs`
- Modify: `scripts/calculation/rules/constants.mjs`

- [ ] **Step 1：写各模块代表公式测试**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateFullCostModules } from './full-cost-calculators.mjs';
import { PARITY_PROJECTS } from './fixtures/parity-projects.mjs';
import { parameterValues, resolveAdvancedParameters } from './advanced-parameters.mjs';

test('calculates 7 pest, 95 outsourced, 228 routine actions and management', () => {
  const project = PARITY_PROJECTS[0];
  const parameters = parameterValues(resolveAdvancedParameters(project));
  const result = calculateFullCostModules(project, parameters);
  assert.deepEqual(result.groups.map((item) => item.actions.length), [7, 95, 228]);
  assert.equal(result.management.headcount, 4);
  assert.ok(result.management.annualCost > 0);
});

test('keeps a zero-quantity facility as a zero-cost action', () => {
  const project = {
    ...PARITY_PROJECTS[0],
    advancedParameterOverrides: { 'grounds.tennisCourtCount': 0 },
  };
  const parameters = parameterValues(resolveAdvancedParameters(project));
  const result = calculateFullCostModules(project, parameters);
  const action = result.groups.flatMap((item) => item.actions)
    .find((item) => item.id === 'engineering-routine-192');
  assert.equal(action.quantity, 0);
  assert.equal(action.annualCost, 0);
});
```

- [ ] **Step 2：确认测试失败**

Run: `node --test scripts/calculation/full-cost-calculators.test.mjs`

Expected: FAIL，提示缺少完整成本计算模块。

- [ ] **Step 3：增加完整模型常量**

在 `constants.mjs` 增加：

```js
export const WORKBOOK_BASE_COST_BAND = 'upper';
export const FULL_MODEL_COST_FACTORS = Object.freeze({
  high: 1.2 / 1.1,
  upper: 1,
  standard: 1 / 1.1,
  base: 0.9 / 1.1,
});
export const ENGINEERING_ROUTINE_MONTHLY_RATE = 6666.66666666667;
export const ENGINEERING_OUTSOURCED_MONTHLY_RATE = 7500;
export const ENGINEERING_BUDGET_FACTOR = 1.2;
export const MANAGEMENT_BUDGET_FACTOR = 1.06;
export const ASSISTANCE_BUDGET_FACTOR = 1.06;
export const PEST_WORKDAY_RATE = 600;
export const ENGINEERING_MONTHLY_CAPACITY_HOURS = 30 * 8;
export const ENGINEERING_ANNUAL_CAPACITY_HOURS = 12 * ENGINEERING_MONTHLY_CAPACITY_HOURS;
```

`upper` 作为内部 Excel 示例项目的基准档位，因此同一示范项目不会再次叠加 1.1；其他成本档位按现有相对关系变化。

- [ ] **Step 4：实现动作工时和分类预算**

`full-cost-calculators.mjs` 必须使用以下统一动作公式：

```js
function workloadAction(rule, category, grade, quantity, hourlyRate) {
  const annualFrequency = Number(rule.annualFrequency[grade] ?? 0);
  const unitHours = Number(rule.unitHours[grade] ?? 0);
  const annualHours = quantity * unitHours * annualFrequency;
  return {
    id: rule.id,
    category,
    action: rule.action,
    property: rule.property,
    unit: rule.unit,
    quantity,
    frequency: String(rule.frequency[grade] ?? 0),
    annualFrequency,
    annualHours,
    annualCost: annualHours * hourlyRate,
  };
}

function roundedEngineeringSummary(category, title, actions, monthlyRate, costFactor) {
  const annualHours = actions.reduce((sum, item) => sum + item.annualHours, 0);
  const workloadEquivalentHeadcount = annualHours / (12 * 30 * 8);
  const headcount = Math.ceil(workloadEquivalentHeadcount);
  return {
    category,
    title,
    actionCount: actions.length,
    headcount,
    annualCost: headcount * monthlyRate * 12 * 1.2 * costFactor,
    workloadAnnualCost: actions.reduce((sum, item) => sum + item.annualCost, 0) * costFactor,
    workloadEquivalentHeadcount,
  };
}
```

四害消杀按 `年工时 ÷ 8` 折算工作日，再按 Excel 的全年人员与日成本口径汇总；工程委外使用动作所属系统月工资计算工作量成本、使用 7500 元/月计算取整后预算；工程常规使用 6666.6667 元/月；管理模块按 4 个岗位的月工资和人数求和后乘 1.06。所有模块最后再应用 V2 城市相对成本因子。

- [ ] **Step 5：运行模块测试**

Run: `node --test scripts/calculation/full-cost-calculators.test.mjs`

Expected: PASS。

- [ ] **Step 6：提交完整成本模块**

```bash
git add scripts/calculation/full-cost-calculators.mjs scripts/calculation/full-cost-calculators.test.mjs scripts/calculation/rules/constants.mjs
git commit -m "feat: calculate engineering pest and management costs"
```

## Task 5：组装 452 项结果并完成 Excel 回归

**Files:**
- Modify: `scripts/calculation/engine.mjs`
- Modify: `scripts/calculation/workbook-oracle.mjs`
- Modify: `scripts/calculation/engine.test.mjs`
- Modify: `scripts/calculation/calculator.parity.test.mjs`
- Modify: `scripts/calculation/fixtures/parity-projects.mjs`
- Modify: `package.json`

- [ ] **Step 1：把引擎契约测试升级为 452 项**

```js
test('returns the stable 452-action calculation contract', () => {
  const result = calculateProject(PARITY_PROJECTS[0]);
  assert.equal(result.version, 2);
  assert.equal(result.standardActionCount, 452);
  assert.equal(result.actions.filter((item) => item.source !== 'custom').length, 452);
  assert.deepEqual(result.categories.map((item) => [item.category, item.actionCount]), [
    ['service', 17],
    ['cleaning', 48],
    ['greening', 51],
    ['assistance', 6],
    ['pestControl', 7],
    ['engineeringOutsourced', 95],
    ['engineeringRoutine', 228],
  ]);
  assert.equal(new Set(result.actions.map(({ id }) => id)).size, 452);
});
```

- [ ] **Step 2：确认旧引擎失败**

Run: `node --test scripts/calculation/engine.test.mjs`

Expected: FAIL，实际动作数仍为 122。

- [ ] **Step 3：在引擎中组装完整结果**

`calculateProject()` 的最终结构改为：

```js
export function calculateProject(project) {
  const grade = project.serviceGrade;
  const factor = FULL_MODEL_COST_FACTORS[project.costBand];
  const advancedParameters = resolveAdvancedParameters(project);
  const parameters = parameterValues(advancedParameters);
  const metrics = deriveMetrics(project);
  const legacyGroups = [
    calculateService(metrics, grade, factor),
    calculateAreaCategory({ rules: CLEANING_RULES, category: 'cleaning', title: '清洁', metrics, grade, factor, dailyRate: CLEANING_DAILY_RATE[grade] }),
    calculateAreaCategory({ rules: GREENING_RULES, category: 'greening', title: '绿化', metrics, grade, factor, dailyRate: GREENING_DAILY_RATE[grade] }),
    calculateAssistance(metrics, grade, factor),
  ];
  const { groups: fullCostGroups, management } = calculateFullCostModules(project, parameters);
  const groups = [...legacyGroups, ...fullCostGroups];
  const categories = groups.map(({ summary }) => summary);
  const actions = groups.flatMap(({ actions: items }) => items);
  if (actions.length !== STANDARD_ACTION_COUNT) {
    throw new Error(`测算结果数量异常：应为 ${STANDARD_ACTION_COUNT} 项，实际为 ${actions.length} 项`);
  }
  const annualCost = categories.reduce((sum, item) => sum + item.annualCost, 0) + management.annualCost;
  return {
    version: 2,
    calculatedAt: new Date().toISOString(),
    project,
    advancedParameterVersion: ADVANCED_PARAMETER_VERSION,
    advancedParameters,
    standardActionCount: 452,
    activeActionCount: actions.filter((item) => item.enabled !== false).length,
    totalActionCount: actions.length,
    totalHeadcount: categories.reduce((sum, item) => sum + item.headcount, 0) + management.headcount,
    annualCost,
    workloadAnnualCost: actions.reduce((sum, item) => sum + item.annualCost, 0),
    management,
    categories,
    actions,
  };
}
```

现有 4 类也改用 `FULL_MODEL_COST_FACTORS`，客助分类预算增加 1.06，保证分类成本之和加管理成本严格等于项目年度总成本。

- [ ] **Step 4：扩展本地工作簿对照器**

`workbook-oracle.mjs` 增加完整动作读取和管理成本读取，但继续只用于本地测试。对照器不得进入 API、前端资源或构建产物。

四档回归断言固定为：

```js
const EXPECTED_UNIT_PRICES = {
  A: 3.156125962,
  B: 2.589873385,
  C: 2.261791829,
  D: 1.946698928,
};

for (const [grade, expected] of Object.entries(EXPECTED_UNIT_PRICES)) {
  const result = calculate({ ...PARITY_PROJECTS[0], serviceGrade: grade, costBand: 'upper' });
  const actual = result.annualCost / result.project.residentialChargeArea / 12;
  assert.ok(Math.abs(actual - expected) <= 0.01, `${grade}: ${actual} !== ${expected}`);
}
```

- [ ] **Step 5：运行引擎与工作簿回归**

Run: `node --no-warnings --experimental-wasm-modules --test scripts/calculation/engine.test.mjs scripts/calculation/calculator.parity.test.mjs`

Expected: PASS，四档单价偏差均不超过 0.01 元/平方米·月。

- [ ] **Step 6：把新增测试加入总测试命令并提交**

将 `full-rule-catalog.test.mjs`、`advanced-parameters.test.mjs`、`full-cost-calculators.test.mjs` 加入 `package.json` 的 `test` 命令。

```bash
git add scripts/calculation package.json
git commit -m "feat: assemble the complete 452-action engine"
```

## Task 6：扩展动作调整与自定义动作

**Files:**
- Modify: `scripts/calculation/adjustments.mjs`
- Modify: `scripts/calculation/adjustments.test.mjs`
- Modify: `src/components/ActionEditor.tsx`
- Modify: `src/components/ActionEditor.test.tsx`

- [ ] **Step 1：写新分类调整测试**

```js
test('recalculates engineering and pest actions after frequency or hour overrides', () => {
  const before = baseline();
  const routine = before.actions.find((item) => item.category === 'engineeringRoutine');
  const pest = before.actions.find((item) => item.category === 'pestControl');
  const after = applyAdjustments(before, {
    version: 1,
    overrides: {
      [routine.id]: { annualHours: routine.annualHours / 2 },
      [pest.id]: { annualFrequency: 12 },
    },
    customActions: [],
  });
  assert.equal(after.standardActionCount, 452);
  assert.equal(after.actions.length, 452);
  assert.ok(after.annualCost !== before.annualCost);
});
```

- [ ] **Step 2：运行测试并确认新分类尚不支持**

Run: `node --test scripts/calculation/adjustments.test.mjs`

Expected: FAIL，提示未知分类或找不到规则。

- [ ] **Step 3：按成本模型重算分类**

`adjustments.mjs` 不再维护自己的 4 类常量，改为读取 `CATEGORY_CONFIG`。频次与工时调整适用于服务、清洁、绿化、四害、工程委外和工程常规；客助继续只允许调整配置人数。分类汇总调用与基础引擎相同的成本模型函数，避免基础测算和调整测算出现两套公式。

调整后的计数规则固定为：

```js
return {
  ...baseline,
  calculatedAt: new Date().toISOString(),
  standardActionCount: 452,
  activeActionCount: actions.filter((item) => item.enabled !== false).length,
  totalActionCount: actions.length,
  totalHeadcount: categories.reduce((sum, item) => sum + item.headcount, 0)
    + baseline.management.headcount,
  annualCost: categories.reduce((sum, item) => sum + item.annualCost, 0)
    + baseline.management.annualCost,
  categories,
  actions,
};
```

停用标准动作只把其成本和工作量归零，不从 452 项标准库中删除；新增动作使 `totalActionCount` 增加，但 `standardActionCount` 始终为 452。

- [ ] **Step 4：扩展编辑器分类判断**

`ActionEditor.tsx` 使用以下判断：

```ts
const dedicatedPostCategory = category === 'assistance';
```

其余 6 类均显示整数年频次、可保留两位小数的年工时和年工作量成本。自定义四害或工程动作使用该分类的默认人工成本口径。

- [ ] **Step 5：运行调整与组件测试**

Run: `node --test scripts/calculation/adjustments.test.mjs && pnpm exec vitest run src/components/ActionEditor.test.tsx`

Expected: PASS。

- [ ] **Step 6：提交动作调整扩展**

```bash
git add scripts/calculation/adjustments.mjs scripts/calculation/adjustments.test.mjs src/components/ActionEditor.tsx src/components/ActionEditor.test.tsx
git commit -m "feat: edit all complete-model action categories"
```

## Task 7：增加可选高级参数界面

**Files:**
- Create: `src/components/AdvancedParametersDrawer.tsx`
- Create: `src/components/AdvancedParametersDrawer.test.tsx`
- Modify: `src/pages/ProjectNewPage.tsx`
- Modify: `src/workbookCalculator.ts`
- Modify: `src/styles.css`

- [ ] **Step 1：写抽屉交互测试**

```tsx
test('shows generated defaults and only saves manual differences', () => {
  const onChange = vi.fn();
  render(
    <AdvancedParametersDrawer
      open
      loading={false}
      parameters={[{
        key: 'basement.fireShutterCount',
        label: '防火卷帘数量',
        group: 'basement',
        unit: '个',
        defaultValue: 252,
        value: 252,
        source: 'estimated',
        affectedActionIds: ['engineering-routine-6', 'engineering-outsourced-5'],
      }]}
      overrides={{}}
      onChange={onChange}
      onClose={() => undefined}
    />,
  );
  expect(screen.getByDisplayValue('252')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('防火卷帘数量'), { target: { value: '300' } });
  expect(onChange).toHaveBeenCalledWith({ 'basement.fireShutterCount': 300 });
});
```

- [ ] **Step 2：运行测试并确认组件不存在**

Run: `pnpm exec vitest run src/components/AdvancedParametersDrawer.test.tsx`

Expected: FAIL。

- [ ] **Step 3：实现高级参数抽屉**

组件使用 Ant Design `Drawer + Collapse + InputNumber + Tag`：四组默认折叠；标题显示“系统已估算”；每个参数显示名称、数值、单位、来源和影响动作数；手动修改时写入覆盖对象；点击“恢复默认”删除该键，点击“整组恢复”删除该组所有键。

来源文案固定为：

```ts
const SOURCE_LABELS: Record<AdvancedParameterSource, string> = {
  derived: '直接推算',
  estimated: '规则估算',
  template: '模板默认',
  manual: '手动调整',
};
```

- [ ] **Step 4：在新建项目页接入预览计算**

在“开始测算”旁增加“高级参数（可选，系统已估算）”。点击时先执行现有表单校验，再调用 `calculateProject()` 获取 `advancedParameters`；不保存项目。抽屉关闭时把 `advancedParameterOverrides` 写回表单，正式点击“开始测算”时随 `ProjectData` 一起提交。

`workbookCalculator.ts` 增加只返回参数快照的封装：

```ts
export async function previewAdvancedParameters(project: ProjectData) {
  const result = await calculateProject(project);
  return result.advancedParameters;
}
```

- [ ] **Step 5：运行组件、新建页和类型测试**

Run: `pnpm exec vitest run src/components/AdvancedParametersDrawer.test.tsx src/App.test.tsx && pnpm run typecheck`

Expected: PASS。

- [ ] **Step 6：提交高级参数界面**

```bash
git add src/components/AdvancedParametersDrawer.tsx src/components/AdvancedParametersDrawer.test.tsx src/pages/ProjectNewPage.tsx src/workbookCalculator.ts src/styles.css
git commit -m "feat: add optional advanced parameter editor"
```

## Task 8：扩展结果页为 7 类和管理成本

**Files:**
- Modify: `src/pages/ProjectResultPage.tsx`
- Modify: `src/App.test.tsx`
- Modify: `src/calculation.ts`
- Modify: `src/styles.css`

- [ ] **Step 1：写完整结果页测试**

测试数据必须包含 452 个标准动作和 7 个分类，并断言：

```tsx
expect(screen.getByText('标准动作库')).toBeTruthy();
expect(screen.getByText('452 项')).toBeTruthy();
for (const name of ['服务', '清洁', '绿化', '客助', '四害消杀', '工程委外', '工程常规']) {
  expect(screen.getByRole('tab', { name: new RegExp(name) })).toBeTruthy();
}
expect(screen.getByText('管理人员成本')).toBeTruthy();
```

- [ ] **Step 2：确认旧页面测试失败**

Run: `pnpm exec vitest run src/App.test.tsx`

Expected: FAIL，页面仍只有 4 类。

- [ ] **Step 3：增加 7 类、筛选和管理成本**

将 `categoryOrder` 扩展为 7 类。顶部“动作总数”改为“标准动作库 452 项”，自定义或停用动作通过副文案显示，不改变标准库口径。增加管理人员成本卡片；年度总成本和单价继续使用 `result.annualCost`。

表格工具栏增加：只看有成本、显示零值、只看已调整、只看已停用/自定义。筛选仅影响展示，不改变汇总。分页继续保持每页 12—15 项，不一次渲染 452 行。

- [ ] **Step 4：修正人数显示规则**

`showsActionHeadcount()` 仍只对 `assistance` 返回 `true`；四害和工程动作显示年频次、年工时和年工作量成本。顶部配置人数包含 7 类配置人数及管理人员。

- [ ] **Step 5：运行结果页测试和类型检查**

Run: `pnpm exec vitest run src/App.test.tsx src/components/ActionEditor.test.tsx && pnpm run typecheck`

Expected: PASS。

- [ ] **Step 6：提交结果页扩展**

```bash
git add src/pages/ProjectResultPage.tsx src/App.test.tsx src/calculation.ts src/styles.css
git commit -m "feat: show complete calculation results"
```

## Task 9：统一 API、存储和导出校验

**Files:**
- Modify: `api/_lib/result-validation.mjs`
- Modify: `api/_vercel-api.test.mjs`
- Modify: `scripts/bid-binding/bindings.mjs`
- Modify: `scripts/bid-binding/bindings.test.mjs`
- Modify: `scripts/ppt-binding/bindings.mjs`
- Modify: `scripts/ppt-binding/bindings.test.mjs`
- Modify: `src/storage.test.ts`

- [ ] **Step 1：写 V2 结果校验测试**

```js
test('accepts 452 standard actions and rejects an incomplete complete-model result', () => {
  assert.equal(resultValidationError(fullResult()), undefined);
  const incomplete = fullResult();
  incomplete.actions = incomplete.actions.slice(0, 451);
  assert.match(resultValidationError(incomplete), /服务动作数据不完整/);
});
```

- [ ] **Step 2：确认旧校验拒绝 V2 结果**

Run: `node --test api/_vercel-api.test.mjs scripts/bid-binding/bindings.test.mjs scripts/ppt-binding/bindings.test.mjs`

Expected: FAIL，旧逻辑仍要求 122 项。

- [ ] **Step 3：更新服务端结果校验**

`result-validation.mjs` 检查 `version === 2`、`standardActionCount === 452`、452 个非自定义稳定编号、7 个分类、完整高级参数快照和管理成本。停用动作不导致校验失败；自定义动作允许存在，但不计入 452 个标准编号。

- [ ] **Step 4：更新 PPT 和标书绑定**

删除“必须恰好 122 项”的错误文案，改为验证 452 项完整结果。现有 PPT 和标书仍选取代表动作，不强制把全部 452 项写入正文；项目名称、年度总成本、综合单价、人员总数和动作数必须读取 V2 最终结果。新增分类成本如果模板没有对应占位符，不修改模板版式。

标书绑定的校验结构固定为：

```js
const baselineActions = result.actions.filter((item) => item.source !== 'custom');
const baselineIds = new Set(baselineActions.map((item) => item.id));
if (result.standardActionCount !== 452 || baselineActions.length !== 452 || baselineIds.size !== 452) {
  throw new Error('标书生成需要完整的452项测算结果');
}
```

- [ ] **Step 5：确认存储不清除公司资料和模板**

`storage.test.ts` 增加测试：保存和加载 V2 项目时保留高级参数覆盖；`startNewProject()` 只清活动项目、草稿和结果，不清 `COMPANY_PROFILE_KEY`。不增加旧项目删除或迁移代码。

- [ ] **Step 6：运行 API、导出和存储测试**

Run: `node --test api/_vercel-api.test.mjs scripts/bid-binding/bindings.test.mjs scripts/ppt-binding/bindings.test.mjs && pnpm exec vitest run src/storage.test.ts`

Expected: PASS。

- [ ] **Step 7：提交端到端契约更新**

```bash
git add api scripts/bid-binding scripts/ppt-binding src/storage.test.ts
git commit -m "feat: use complete results across exports"
```

## Task 10：完整验证与实际页面验收

**Files:**
- Modify when required by failures: files changed in Tasks 1—9 only

- [ ] **Step 1：运行全量自动化测试**

Run: `pnpm test`

Expected: PASS，无失败和未处理异常。

- [ ] **Step 2：运行生产构建**

Run: `pnpm run build`

Expected: PASS，生成 `dist/`。

- [ ] **Step 3：确认部署产物不包含 Excel**

Run: `rg -n "动态成本分析模型|\.xlsx" dist api scripts/calculation --glob '!**/*.test.mjs' --glob '!scripts/calculation/migration/**'`

Expected: 无结果；生产代码和部署产物不引用原 Excel。

- [ ] **Step 4：启动本地生产入口**

Run: `pnpm run serve`

Expected: 服务运行在 `http://127.0.0.1:4173/`。

- [ ] **Step 5：实际页面验收**

在 `http://127.0.0.1:4173/project/new` 使用示范数据核对：高级参数入口默认折叠、四组参数均有默认值、修改和恢复正常；开始测算后进入结果页，显示 452 项、7 类和管理成本；C 档较高成本示范项目单价约为 2.26 元/平方米·月；零值动作可以显示和隐藏；任意工程参数调整后对应动作与总成本同步变化。

- [ ] **Step 6：核对 PPT 和标书生成**

分别生成一次 PPT 和标书，确认文件名使用项目名称，文档中的年度成本、综合单价、人员总数和动作数量与结果页一致。

- [ ] **Step 7：检查改动范围并提交修正**

Run: `git status --short && git diff --check`

Expected: 仅包含本计划范围内的文件，无空白错误。

```bash
git add api scripts src package.json
git commit -m "test: verify complete property cost model"
```

完成后不要自动推送；先向用户汇报回归结果、示范项目四档单价、实际页面验收结果和最终提交号，等待用户明确要求推送。
