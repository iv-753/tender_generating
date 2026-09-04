import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { DOMParser } from '@xmldom/xmldom';
import JSZip from 'jszip';

import { generateBidDocument } from './generate-bid.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..', '..');
const TEMPLATE = path.join(ROOT, 'output', 'bid-template', '安序物业_住宅物业服务投标文件_双括号动态母版_清理版.docx');
const RESULT = path.join(ROOT, 'tmp', 'bid-binding-v1', 'demo-result.json');
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

    const zip = await JSZip.loadAsync(bytes);
    const xmlFiles = Object.keys(zip.files).filter((name) => /^word\/.*\.xml$/.test(name));
    const text = (await Promise.all(xmlFiles.map((name) => zip.file(name).async('string')))).join('\n');
    assert.equal(text.includes('增城示范花园'), true);
    assert.equal(text.includes('{{'), false);
    const document = new DOMParser().parseFromString(await zip.file('word/document.xml').async('string'), 'application/xml');
    const textNodes = Array.from(document.getElementsByTagNameNS(
      'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
      't',
    ));
    assert.equal(textNodes.some((node) => (node.textContent ?? '').includes('\n')), false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
