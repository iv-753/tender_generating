import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  getAllShapes,
  getShapeName,
  getShapeText,
  getSlideCount,
  loadPresentation,
  savePresentation,
  setShapeText,
  validatePresentation,
} from '@office-kit/pptx';

import { buildPresentationBindings } from './bindings.mjs';

const SOURCE_CARD_TITLES = [
  '客户诉求受理与闭环',
  '装修手续办理与巡查协同',
  '社区公告与信息发布',
  '客户满意度回访',
  '门岗人员与车辆核验',
  '园区公共区域巡查',
  '消防通道与重点部位巡查',
  '突发事件前期处置',
  '楼栋大堂及电梯厅清洁',
  '园区道路清扫',
  '地下车库保洁',
  '垃圾收集点清洁消杀',
  '草坪修剪',
  '乔灌木整形修剪',
  '绿化浇灌与巡查',
  '病虫害防治',
];

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index]?.replace(/^--/, '');
    const value = argv[index + 1];
    if (!key || value === undefined) throw new Error(`无效参数：${argv[index] ?? ''}`);
    args[key] = value;
  }
  for (const required of ['template', 'result', 'output']) {
    if (!args[required]) throw new Error(`缺少 --${required}`);
  }
  return args;
}

function allShapes(deck) {
  return getAllShapes(deck);
}

function replacePlaceholder(shape, value) {
  const current = getShapeText(shape);
  if (!current.includes('{{')) throw new Error(`绑定对象 ${getShapeName(shape)} 不含占位符`);
  const placeholders = current.match(/\{\{[^{}]+\}\}/g) ?? [];
  setShapeText(shape, placeholders.length > 1 ? value : current.replace(placeholders[0], value));
}

function bindDeck(deck, bindings) {
  const shapes = allShapes(deck);
  for (const [name, value] of Object.entries(bindings.named)) {
    const matches = shapes.filter(({ shape }) => getShapeName(shape) === name);
    if (matches.length !== 1) throw new Error(`绑定对象 ${name} 匹配数量为 ${matches.length}`);
    replacePlaceholder(matches[0].shape, value);
  }

  bindings.cards.forEach((card, index) => {
    const number = String(index + 1).padStart(2, '0');
    const titleMatches = shapes.filter(({ shape }) => getShapeText(shape) === SOURCE_CARD_TITLES[index]);
    if (titleMatches.length !== 1) throw new Error(`动作标题 ${SOURCE_CARD_TITLES[index]} 匹配数量为 ${titleMatches.length}`);
    setShapeText(titleMatches[0].shape, card.title);

    for (const [suffix, value] of [['scope', card.scope], ['frequency', card.frequency]]) {
      const name = `field-action-${number}-${suffix}`;
      const matches = shapes.filter(({ shape }) => getShapeName(shape) === name);
      if (matches.length !== 1) throw new Error(`绑定对象 ${name} 匹配数量为 ${matches.length}`);
      replacePlaceholder(matches[0].shape, value);
    }
  });

  const unresolved = shapes
    .map(({ shape, slideIndex }) => ({ text: getShapeText(shape), slide: slideIndex + 1 }))
    .filter(({ text }) => /\{\{[^{}]+\}\}/.test(text));
  if (unresolved.length) {
    throw new Error(`仍有未绑定占位符：${unresolved.map((item) => `P${item.slide} ${item.text}`).join('；')}`);
  }
}

export async function loadTemplateDeck(templatePath) {
  return loadPresentation(await fs.readFile(templatePath));
}

export async function generatePresentation({ templatePath, result, outputPath, generatedAt, onStage }) {
  onStage?.('preparing');
  const bindings = buildPresentationBindings(result, generatedAt);
  onStage?.('binding');
  const deck = await loadTemplateDeck(templatePath);
  const slideCount = getSlideCount(deck);
  if (slideCount !== 24) throw new Error(`模板页数异常：${slideCount}`);

  bindDeck(deck, bindings);

  const validationErrors = validatePresentation(deck).filter((issue) => issue.severity === 'error');
  if (validationErrors.length) throw new Error(`PPT结构校验失败：${validationErrors[0].message}`);

  onStage?.('exporting');
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, await savePresentation(deck));
  return { outputPath, slides: slideCount, bindings };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = parseArgs(process.argv.slice(2));
  const result = JSON.parse(await fs.readFile(path.resolve(args.result), 'utf8'));
  const generatedAt = args['generated-at'] ? new Date(args['generated-at']) : new Date();
  const output = await generatePresentation({
    templatePath: path.resolve(args.template),
    result,
    outputPath: path.resolve(args.output),
    generatedAt,
    onStage: (stage) => process.stdout.write(`${JSON.stringify({ type: 'stage', stage })}\n`),
  });
  process.stdout.write(`${JSON.stringify({ type: 'complete', outputPath: output.outputPath, slides: output.slides })}\n`);
}
