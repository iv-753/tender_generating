import fs from 'node:fs/promises';

import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import JSZip from 'jszip';

const WORD_NS = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const PLACEHOLDER = /\{\{([^{}]+)\}\}/g;

function descendants(root, localName) {
  return Array.from(root.getElementsByTagNameNS(WORD_NS, localName));
}

function directChildren(root, localName) {
  return Array.from(root.childNodes).filter(
    (node) => node.nodeType === 1 && node.namespaceURI === WORD_NS && node.localName === localName,
  );
}

function nodeText(root) {
  return descendants(root, 't').map((node) => node.textContent ?? '').join('');
}

function setText(node, value) {
  const parts = String(value).split('\n');
  node.textContent = parts[0];
  if (/^\s|\s$/.test(parts[0])) node.setAttribute('xml:space', 'preserve');
  let reference = node;
  for (const part of parts.slice(1)) {
    const lineBreak = node.ownerDocument.createElementNS(WORD_NS, 'w:br');
    const text = node.ownerDocument.createElementNS(WORD_NS, 'w:t');
    text.textContent = part;
    if (/^\s|\s$/.test(part)) text.setAttribute('xml:space', 'preserve');
    reference.parentNode.insertBefore(lineBreak, reference.nextSibling);
    reference.parentNode.insertBefore(text, lineBreak.nextSibling);
    reference = text;
  }
}

function replaceInParagraph(paragraph, values) {
  const textNodes = descendants(paragraph, 't');
  if (!textNodes.length) return;
  const combined = textNodes.map((node) => node.textContent ?? '').join('');
  const matches = [...combined.matchAll(PLACEHOLDER)].filter((match) => Object.hasOwn(values, match[1]));

  for (const match of matches.reverse()) {
    const start = match.index;
    const end = start + match[0].length;
    let cursor = 0;
    let startIndex = -1;
    let endIndex = -1;
    let startOffset = 0;
    let endOffset = 0;

    for (const [index, node] of textNodes.entries()) {
      const value = node.textContent ?? '';
      const nextCursor = cursor + value.length;
      if (startIndex === -1 && start < nextCursor) {
        startIndex = index;
        startOffset = start - cursor;
      }
      if (end <= nextCursor) {
        endIndex = index;
        endOffset = end - cursor;
        break;
      }
      cursor = nextCursor;
    }

    if (startIndex === -1 || endIndex === -1) throw new Error(`无法定位占位符：${match[0]}`);
    const replacement = String(values[match[1]]);
    if (startIndex === endIndex) {
      const value = textNodes[startIndex].textContent ?? '';
      setText(textNodes[startIndex], value.slice(0, startOffset) + replacement + value.slice(endOffset));
    } else {
      const startValue = textNodes[startIndex].textContent ?? '';
      const endValue = textNodes[endIndex].textContent ?? '';
      setText(textNodes[startIndex], startValue.slice(0, startOffset) + replacement);
      for (let index = startIndex + 1; index < endIndex; index += 1) setText(textNodes[index], '');
      setText(textNodes[endIndex], endValue.slice(endOffset));
    }
  }
}

function replaceInNode(root, values) {
  for (const paragraph of descendants(root, 'p')) replaceInParagraph(paragraph, values);
}

function normalized(value) {
  return String(value ?? '').replace(/[\s/（）()]/g, '');
}

function placeholders(value) {
  return new Set([...String(value).matchAll(PLACEHOLDER)].map((match) => match[1]));
}

function containsAll(source, required) {
  return [...required].every((item) => source.has(item));
}

function findRepeatedRows(document, requiredPlaceholders) {
  return descendants(document, 'tr').flatMap((row) => {
    const cells = directChildren(row, 'tc');
    const texts = cells.map(nodeText);
    const found = new Set(texts.flatMap((value) => [...placeholders(value)]));
    return containsAll(found, requiredPlaceholders) ? [{ row, cells, texts }] : [];
  });
}

function fillRows(document, rows, bindings, kind) {
  if (rows.length !== bindings.length) {
    throw new Error(`${kind}行数量不一致：模板${rows.length}行，映射${bindings.length}行`);
  }
  rows.forEach(({ row, cells, texts }, index) => {
    const item = bindings[index];
    if (normalized(texts[0]) !== normalized(item.expectedTitle)) {
      throw new Error(`第${index + 1}个${kind}标题不一致：模板“${texts[0]}”，映射“${item.expectedTitle}”（${item.id}）`);
    }
    if (!item.enabled) {
      row.parentNode.removeChild(row);
      return;
    }
    const values = kind === '动作'
      ? { 适用范围: item.scope, 服务频次: item.frequency }
      : { 配置依据: item.basis, 配置标准: item.standard, 配置人数: item.headcount };
    for (const cell of cells) replaceInNode(cell, values);
  });
}

function parseXml(xml, fileName) {
  const errors = [];
  const document = new DOMParser({ onError: (level, message) => errors.push(`${level}: ${message}`) }).parseFromString(xml, 'application/xml');
  if (!document?.documentElement || errors.some((item) => item.startsWith('fatalError'))) {
    throw new Error(`无法读取Word模板结构：${fileName}`);
  }
  return document;
}

export async function bindBidTemplate(templatePath, bindings) {
  const zip = await JSZip.loadAsync(await fs.readFile(templatePath));
  const documentFile = zip.file('word/document.xml');
  if (!documentFile) throw new Error('Word模板缺少正文结构');

  const editableFiles = Object.keys(zip.files).filter((name) =>
    name === 'word/document.xml' || /^word\/(header|footer)\d+\.xml$/.test(name),
  );
  const documents = new Map();
  for (const name of editableFiles) {
    documents.set(name, parseXml(await zip.file(name).async('string'), name));
  }

  const mainDocument = documents.get('word/document.xml');
  fillRows(mainDocument, findRepeatedRows(mainDocument, new Set(['适用范围', '服务频次'])), bindings.actionRows, '动作');
  fillRows(mainDocument, findRepeatedRows(mainDocument, new Set(['配置依据', '配置标准', '配置人数'])), bindings.staffingRows, '岗位');

  const named = Object.fromEntries(Object.entries(bindings.named).map(([key, value]) => [key, String(value)]));
  for (const document of documents.values()) replaceInNode(document, named);

  const unresolved = new Set();
  for (const document of documents.values()) {
    for (const paragraph of descendants(document, 'p')) {
      for (const match of nodeText(paragraph).matchAll(PLACEHOLDER)) unresolved.add(match[0]);
    }
  }
  if (unresolved.size) throw new Error(`仍有未填写占位符：${[...unresolved].sort().join(', ')}`);

  const serializer = new XMLSerializer();
  for (const [name, document] of documents) zip.file(name, serializer.serializeToString(document));
  return zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } });
}
