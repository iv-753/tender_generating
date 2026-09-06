import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';

import { getAllShapes, getShapeName, getShapeText, getSlideCount, validatePresentation } from '@office-kit/pptx';

import { fullResult } from '../test-fixtures/full-result.mjs';

test('使用项目内公开依赖读取24页PPT模板', async () => {
  const generator = await import('./generate-ppt.mjs');
  assert.equal(typeof generator.loadTemplateDeck, 'function');

  const deck = await generator.loadTemplateDeck(path.resolve('templates/物业路演PPT_完整24页_v1.pptx'));
  assert.equal(getSlideCount(deck), 24);
  assert.deepEqual(validatePresentation(deck), []);
});

test('PPT模板在项目组织页提供8类人员动态绑定位置', async () => {
  const generator = await import('./generate-ppt.mjs');
  const output = await generator.generatePresentationBytes({
    templatePath: path.resolve('templates/物业路演PPT_完整24页_v1.pptx'),
    result: fullResult(),
    generatedAt: new Date('2026-09-03T00:00:00+08:00'),
  });
  const deck = await generator.loadTemplateDeck(path.resolve('templates/物业路演PPT_完整24页_v1.pptx'));
  const templateFields = new Set(getAllShapes(deck).map(({ shape }) => getShapeName(shape)));
  for (const field of [
    'field-staffing-summary', 'field-staffing-management', 'field-staffing-customer',
    'field-staffing-environment', 'field-staffing-engineering',
  ]) assert.equal(templateFields.has(field), true, `模板缺少${field}`);

  const generated = await (await import('@office-kit/pptx')).loadPresentation(output.bytes);
  const textByName = new Map(getAllShapes(generated).map(({ shape }) => [getShapeName(shape), getShapeText(shape)]));
  assert.equal(textByName.get('field-staffing-summary'), '配置8类人员，共48人。');
  assert.equal(textByName.get('field-staffing-engineering'), '工程委外4人、工程常规5人');
});
