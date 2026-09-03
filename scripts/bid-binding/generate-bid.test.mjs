import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { generateBidDocument } from './generate-bid.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..', '..');
const TEMPLATE = path.join(ROOT, 'output', 'bid-template', '安序物业_住宅物业服务投标文件_双括号动态母版_清理版.docx');
const RESULT = path.join(ROOT, 'tmp', 'bid-binding-v1', 'demo-result.json');
const PYTHON = process.env.RUNTIME_PYTHON || 'python';

test('generates a complete Word bid from the current calculation result', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'bid-generator-'));
  try {
    const outputPath = path.join(directory, 'result.docx');
    const result = JSON.parse(await readFile(RESULT, 'utf8'));
    const stages = [];

    await generateBidDocument({
      templatePath: TEMPLATE,
      result,
      outputPath,
      generatedAt: new Date('2026-09-03T08:00:00+08:00'),
      onStage: (stage) => stages.push(stage),
    });

    const bytes = await readFile(outputPath);
    assert.equal(bytes.subarray(0, 2).toString(), 'PK');
    assert.deepEqual(stages, ['preparing', 'binding', 'exporting']);

    const inspection = spawnSync(PYTHON, ['-c', [
      'import json, sys',
      'from docx import Document',
      'doc = Document(sys.argv[1])',
      'text = "\\n".join([p.text for p in doc.paragraphs] + [c.text for t in doc.tables for r in t.rows for c in r.cells])',
      'print(json.dumps({"project": "增城示范花园" in text, "unresolved": "{{" in text}, ensure_ascii=False))',
    ].join('; '), outputPath], { encoding: 'utf8' });
    assert.equal(inspection.status, 0, inspection.stderr);
    assert.deepEqual(JSON.parse(inspection.stdout.trim()), { project: true, unresolved: false });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
