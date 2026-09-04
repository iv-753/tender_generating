import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';

import { getSlideCount, validatePresentation } from '@office-kit/pptx';

test('使用项目内公开依赖读取24页PPT模板', async () => {
  const generator = await import('./generate-ppt.mjs');
  assert.equal(typeof generator.loadTemplateDeck, 'function');

  const deck = await generator.loadTemplateDeck(path.resolve('templates/物业路演PPT_完整24页_v1.pptx'));
  assert.equal(getSlideCount(deck), 24);
  assert.deepEqual(validatePresentation(deck), []);
});
