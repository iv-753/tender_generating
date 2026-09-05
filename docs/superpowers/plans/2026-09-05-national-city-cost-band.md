# 全国城市选择与成本档位 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用中国大陆完整省市目录替换城市自由输入，并自动推荐、允许相邻一级调整成本档位。

**Architecture:** 构建时生成并提交版本化的静态省市与档位 JSON，浏览器和服务端分别通过小型适配器读取同一数据源。前端负责联动选择和可选项约束，服务端重新校验省市组合及调整幅度，现有122项纯算法只接收最终 `costBand`，不感知城市目录。

**Tech Stack:** React 19、TypeScript、Ant Design、Node.js ESM、Vitest、Node Test Runner、Vite。

---

### Task 1: 生成版本化全国城市档位目录

**Files:**
- Create: `scripts/city-data/generate-city-catalog.mjs`
- Create: `src/data/city-cost-bands.json`
- Create: `scripts/city-data/city-catalog.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: 写目录完整性失败测试**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import catalog from '../../src/data/city-cost-bands.json' with { type: 'json' };

test('covers mainland provinces and prefecture-level locations', () => {
  assert.equal(catalog.version, '2025-wage-2026-09');
  assert.equal(catalog.provinces.length, 31);
  const cities = catalog.provinces.flatMap((province) => province.cities);
  assert.equal(cities.length, 337);
  assert.equal(new Set(cities.map((city) => city.code)).size, cities.length);
  assert.ok(cities.every((city) => ['high', 'upper', 'standard', 'base'].includes(city.recommendedBand)));
});

test('keeps the agreed flagship defaults', () => {
  const cities = catalog.provinces.flatMap((province) => province.cities);
  for (const name of ['北京市', '上海市', '广州市', '深圳市']) {
    assert.equal(cities.find((city) => city.name === name)?.recommendedBand, 'high');
  }
});
```

- [ ] **Step 2: 运行测试确认缺少数据文件**

Run: `node --test scripts/city-data/city-catalog.test.mjs`

Expected: FAIL，提示 `src/data/city-cost-bands.json` 不存在。

- [ ] **Step 3: 创建一次性目录生成器**

生成器固定使用行政区划数据提交 `c49d495b40ac73eb1a66f6eeae5f8fd10696f035`，排除省直辖县级条目，把四个直辖市的“市辖区”规范为同名城市。`HIGH` 固定为北上广深；`UPPER` 收录天津、重庆及高人工成本强二线城市；`STANDARD` 收录其余省会和经济较强地级市；其他城市默认为基础档。

```js
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const revision = 'c49d495b40ac73eb1a66f6eeae5f8fd10696f035';
const raw = `https://raw.githubusercontent.com/modood/Administrative-divisions-of-China/${revision}/dist`;
const HIGH = new Set(['北京市', '上海市', '广州市', '深圳市']);
const UPPER = new Set(['天津市', '重庆市', '杭州市', '南京市', '苏州市', '无锡市', '宁波市', '厦门市', '福州市', '青岛市', '济南市', '珠海市', '佛山市', '东莞市', '成都市', '武汉市', '长沙市', '郑州市', '西安市', '合肥市']);
const STANDARD = new Set(['石家庄市', '太原市', '呼和浩特市', '沈阳市', '大连市', '长春市', '哈尔滨市', '南昌市', '南宁市', '海口市', '三亚市', '贵阳市', '昆明市', '拉萨市', '兰州市', '西宁市', '银川市', '乌鲁木齐市', '常州市', '南通市', '扬州市', '镇江市', '泰州市', '嘉兴市', '湖州市', '绍兴市', '温州市', '金华市', '泉州市', '漳州市', '烟台市', '潍坊市', '威海市', '临沂市', '洛阳市', '宜昌市', '襄阳市', '株洲市', '岳阳市', '中山市', '惠州市', '江门市', '湛江市', '绵阳市', '德阳市', '宜宾市', '遵义市']);
const excludedCodes = new Set(['4190', '4290', '4690', '5002', '6590']);
const municipalityNames = new Map([['1101', '北京市'], ['1201', '天津市'], ['3101', '上海市'], ['5001', '重庆市']]);
const getJson = async (name) => {
  const response = await fetch(`${raw}/${name}.json`);
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  return response.json();
};
const [provinces, rawCities] = await Promise.all([getJson('provinces'), getJson('cities')]);
const bandFor = (name) => HIGH.has(name) ? 'high' : UPPER.has(name) ? 'upper' : STANDARD.has(name) ? 'standard' : 'base';
const cities = rawCities
  .filter((city) => !excludedCodes.has(city.code))
  .map((city) => ({ ...city, name: municipalityNames.get(city.code) ?? city.name }))
  .map((city) => ({ code: city.code, name: city.name, recommendedBand: bandFor(city.name) }));
const catalog = {
  version: '2025-wage-2026-09',
  updatedAt: '2026-09-05',
  sources: [
    'https://www.stats.gov.cn/sj/zxfb/202605/t20260515_1963707.html',
    'https://www.stats.gov.cn/sj/zxfbhjd/202607/t20260715_1964129.html',
    `https://github.com/modood/Administrative-divisions-of-China/tree/${revision}`,
  ],
  provinces: provinces.map((province) => ({
    code: province.code,
    name: province.name,
    cities: cities.filter((city) => city.code.startsWith(province.code)),
  })),
};
const target = fileURLToPath(new URL('../../src/data/city-cost-bands.json', import.meta.url));
await mkdir(fileURLToPath(new URL('../../src/data', import.meta.url)), { recursive: true });
await writeFile(target, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
```

- [ ] **Step 4: 生成数据并验证目录**

Run: `node scripts/city-data/generate-city-catalog.mjs && node --test scripts/city-data/city-catalog.test.mjs`

Expected: 2 tests PASS；31个省级选项、337个城市/地级行政区选项。

- [ ] **Step 5: 将目录测试加入一键回归并提交**

在 `package.json` 的 Node 测试组中加入 `scripts/city-data/city-catalog.test.mjs`。

```bash
git add scripts/city-data src/data/city-cost-bands.json package.json
git commit -m "feat: add nationwide city cost catalog"
```

### Task 2: 建立浏览器端城市与相邻档位规则

**Files:**
- Create: `src/cityCatalog.ts`
- Create: `src/cityCatalog.test.ts`
- Modify: `src/types.ts`
- Modify: `src/calculation.ts`
- Modify: `src/calculation.test.ts`

- [ ] **Step 1: 写省市查询和相邻调整失败测试**

```ts
import { expect, test } from 'vitest';
import { allowedCostBands, getCityRecommendation, normalizeProjectLocation } from './cityCatalog';

test('recommends Guangzhou as high and only permits one-step adjustment', () => {
  expect(getCityRecommendation('广东省', '广州市')).toBe('high');
  expect(allowedCostBands('high')).toEqual(['high', 'upper']);
  expect(allowedCostBands('upper')).toEqual(['high', 'upper', 'standard']);
});

test('normalizes a legacy city without suffix', () => {
  expect(normalizeProjectLocation({ region: '广东省广州市增城区', city: '广州', costBand: 'upper' }))
    .toMatchObject({ region: '广东省', city: '广州市', recommendedCostBand: 'high', costBand: 'upper' });
});
```

- [ ] **Step 2: 运行测试确认模块不存在**

Run: `pnpm vitest run src/cityCatalog.test.ts`

Expected: FAIL，提示无法解析 `./cityCatalog`。

- [ ] **Step 3: 增加项目审计字段和客户端目录适配器**

在 `ProjectData` 增加可选字段：

```ts
recommendedCostBand?: CostBand;
costBandSourceVersion?: string;
```

`src/cityCatalog.ts` 导出 `CITY_CATALOG_VERSION`、`provinceOptions`、`cityOptions(region)`、`getCityRecommendation(region, city)`、`allowedCostBands(recommendation)`、`isAllowedCostBand(recommendation, actual)`、`normalizeProjectLocation(project)` 和 `formatProjectLocation(project)`。档位顺序固定为 `['high', 'upper', 'standard', 'base']`，合法距离为不超过1。

- [ ] **Step 4: 移除旧16城市硬编码并统一验证**

`src/calculation.ts` 删除 `CITY_BANDS`，让 `inferCostBand` 委托 `cityCatalog`；`validateProjectData` 增加省市组合和相邻档位检查。保留 `inferCostBand(city)` 兼容已有调用，但返回全国目录中的推荐值。

- [ ] **Step 5: 运行客户端规则测试并提交**

Run: `pnpm vitest run src/cityCatalog.test.ts src/calculation.test.ts`

Expected: PASS。

```bash
git add src/cityCatalog.ts src/cityCatalog.test.ts src/types.ts src/calculation.ts src/calculation.test.ts
git commit -m "feat: add city recommendation and override rules"
```

### Task 3: 服务端独立校验与Excel识别规范化

**Files:**
- Create: `scripts/calculation/city-catalog.mjs`
- Create: `scripts/calculation/city-catalog.test.mjs`
- Modify: `scripts/calculation/calculator.mjs`
- Modify: `scripts/excel-recognition/normalize-recognition.mjs`
- Modify: `scripts/excel-recognition/normalize-recognition.test.mjs`
- Modify: `scripts/excel-recognition/server-api.test.mjs`
- Modify: `api/_vercel-api.test.mjs`

- [ ] **Step 1: 写服务端校验失败测试**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { validateProject } from './calculator.mjs';
import { PARITY_PROJECTS } from './fixtures/parity-projects.mjs';

const baseProject = PARITY_PROJECTS[0];

test('accepts an adjacent override and rejects a two-band override', () => {
  const valid = { ...baseProject, region: '广东省', city: '广州市', recommendedCostBand: 'high', costBand: 'upper' };
  assert.equal(validateProject(valid), undefined);
  assert.match(validateProject({ ...valid, costBand: 'standard' }), /只能上下调整一级/);
});
```

- [ ] **Step 2: 运行测试确认旧服务端没有跨级校验**

Run: `node --test scripts/calculation/city-catalog.test.mjs api/_vercel-api.test.mjs`

Expected: FAIL，跨两级项目仍被接受。

- [ ] **Step 3: 实现Node端目录适配器并接入接口校验**

`scripts/calculation/city-catalog.mjs` 从共享 JSON 建立省市索引，导出 `recommendCostBand(region, city)` 和 `validateCityCostBand(project)`。`calculator.mjs` 在服务等级校验后调用它，依次拒绝未知省市、缺少建议值和跨两级调整。

- [ ] **Step 4: 让Excel识别返回规范省市和系统建议**

删除 `normalize-recognition.mjs` 中旧 `CITY_BANDS`。根据识别到的城市和完整地区查找目录，成功时写入规范 `region`、`city`、`recommendedCostBand`、`costBandSourceVersion` 和默认 `costBand`；失败时保留缺失状态并要求用户选择，不猜测。

- [ ] **Step 5: 运行服务端与识别测试并提交**

Run: `node --no-warnings --experimental-wasm-modules --test scripts/calculation/city-catalog.test.mjs scripts/excel-recognition/normalize-recognition.test.mjs scripts/excel-recognition/server-api.test.mjs api/_vercel-api.test.mjs`

Expected: PASS。

```bash
git add scripts/calculation scripts/excel-recognition api/_vercel-api.test.mjs
git commit -m "feat: validate city cost bands on the server"
```

### Task 4: 改造项目表单为省市联动下拉

**Files:**
- Modify: `src/pages/ProjectNewPage.tsx`
- Modify: `src/components/ExcelImportPanel.tsx`
- Modify: `src/exampleProject.ts`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: 写表单文案和默认调整状态失败测试**

在项目新建页测试中断言：存在“省份”“城市”两个下拉框；不存在“成本城市”输入框；示例广州显示“系统建议：高成本城市”和“当前采用：较高成本城市（已手动调整）”。

```tsx
test('uses province and city selectors with an adjacent override', () => {
  window.history.replaceState({}, '', '/project/new');
  render(<App />);
  expect(screen.getByLabelText('省份')).toBeTruthy();
  expect(screen.getByLabelText('城市')).toBeTruthy();
  expect(screen.queryByText('成本城市')).toBeNull();
  fireEvent.click(screen.getByText('测算参数'));
  expect(screen.getByText(/系统建议：高成本城市/)).toBeTruthy();
  expect(screen.getByText(/当前采用：较高成本城市.*已手动调整/)).toBeTruthy();
});
```

- [ ] **Step 2: 运行单项测试确认失败**

Run: `pnpm vitest run src/App.test.tsx -t "uses province and city selectors"`

Expected: FAIL，仍显示“成本城市”文本框。

- [ ] **Step 3: 实现联动选择与相邻档位选项**

把 `region` 和 `city` 的 `Input` 替换为可搜索 `Select`。省份变化时清空城市和档位；城市变化时写入推荐档位及目录版本；成本档位选项来自 `allowedCostBands`。使用 `Form.Item extra` 显示系统建议和是否已手动调整，并注册隐藏审计字段。

```tsx
const province = Form.useWatch('region', form);
const city = Form.useWatch('city', form);
const recommended = getCityRecommendation(province, city);
const actual = Form.useWatch('costBand', form);

<Form.Item name="region" label="省份" rules={[{ required: true, message: '请选择省份' }]}>
  <Select showSearch optionFilterProp="label" options={provinceOptions} onChange={() => form.setFieldsValue({ city: undefined, costBand: undefined, recommendedCostBand: undefined, costBandSourceVersion: undefined })} />
</Form.Item>
<Form.Item name="city" label="城市" rules={[{ required: true, message: '请选择城市' }]}>
  <Select showSearch optionFilterProp="label" disabled={!province} options={cityOptions(province)} onChange={(nextCity) => {
    const next = getCityRecommendation(province, nextCity);
    form.setFieldsValue({ costBand: next, recommendedCostBand: next, costBandSourceVersion: CITY_CATALOG_VERSION });
  }} />
</Form.Item>
<Form.Item name="costBand" label="城市成本档位" extra={recommended ? `系统建议：${COST_BAND_LABELS[recommended]}；当前采用：${COST_BAND_LABELS[actual]}${actual !== recommended ? '（已手动调整）' : ''}` : undefined}>
  <Select options={allowedCostBands(recommended).map((value) => ({ value, label: COST_BAND_LABELS[value] }))} />
</Form.Item>
<Form.Item name="recommendedCostBand" hidden><Input /></Form.Item>
<Form.Item name="costBandSourceVersion" hidden><Input /></Form.Item>
```

- [ ] **Step 4: 更新示例项目和Excel确认面板文案**

示例项目使用 `region: '广东省'`、`city: '广州市'`、`recommendedCostBand: 'high'`、`costBand: 'upper'`，用于展示相邻调整。Excel面板把“项目地区”改为“省份”、“成本城市”改为“城市”。

- [ ] **Step 5: 运行表单测试并提交**

Run: `pnpm vitest run src/App.test.tsx -t "uses province and city selectors"`

Expected: PASS。

```bash
git add src/pages/ProjectNewPage.tsx src/components/ExcelImportPanel.tsx src/exampleProject.ts src/App.test.tsx
git commit -m "feat: add linked province and city selectors"
```

### Task 5: 统一位置展示并完成回归验收

**Files:**
- Modify: `src/pages/ProjectCenterPage.tsx`
- Modify: `src/pages/ProjectOverviewPage.tsx`
- Modify: `src/pages/ProjectResultPage.tsx`
- Modify: `src/storage.ts`
- Modify: `src/storage.test.ts`
- Modify: `VERCEL-DEPLOY.md`

- [ ] **Step 1: 写旧草稿兼容和位置展示失败测试**

断言旧项目 `{ region: '广东省广州市增城区', city: '广州' }` 编辑时规范为“广东省—广州市”，已生成历史结果不重算；项目中心、概览和结果页均显示“广东省 · 广州市”。

```ts
test('normalizes legacy draft locations without recalculating saved results', () => {
  const legacy = savedResult('旧项目', '2026-09-01T00:00:00.000Z', 123456);
  legacy.project.region = '广东省广州市增城区';
  legacy.project.city = '广州';
  storage.saveResult(legacy);
  expect(storage.loadResult()?.annualCost).toBe(123456);
  expect(normalizeProjectLocation(legacy.project)).toMatchObject({ region: '广东省', city: '广州市' });
});
```

- [ ] **Step 2: 实现草稿迁移和统一展示**

加载草稿或进入编辑页时调用 `normalizeProjectLocation`；结果页只展示保存时的最终成本档位。三个页面统一调用 `formatProjectLocation`，避免只显示省份。

```tsx
const draft = useMemo(() => normalizeProjectLocation(storage.loadDraft() ?? EXAMPLE_PROJECT), []);
// ProjectCenterPage / ProjectOverviewPage / ProjectResultPage
<span>{formatProjectLocation(item.result.project)}</span>
```

- [ ] **Step 3: 运行全部相关自动化验证**

Run: `pnpm vitest run src/cityCatalog.test.ts src/calculation.test.ts src/storage.test.ts src/App.test.tsx`

Run: `node --no-warnings --experimental-wasm-modules --test scripts/city-data/city-catalog.test.mjs scripts/calculation/*.test.mjs scripts/excel-recognition/*.test.mjs api/_vercel-api.test.mjs`

Expected: 全部 PASS；原Excel算法逐字段对照仍通过。

- [ ] **Step 4: 运行类型检查和生产构建**

Run: `pnpm typecheck && pnpm build`

Expected: PASS；城市 JSON 被静态打包，无运行时网络请求。

- [ ] **Step 5: 在真实页面验收**

启动 `pnpm serve`，打开 `/project/new`：选择广东省和广州市，确认自动建议高成本；手动改为较高成本并完成测算；确认标准/基础不可选，结果页仍为122项且无控制台错误或横向溢出。再选择一个外省城市，确认城市列表和建议值同步刷新。

- [ ] **Step 6: 提交最终整合**

```bash
git add src VERCEL-DEPLOY.md package.json scripts api
git commit -m "feat: complete nationwide city cost selection"
```
