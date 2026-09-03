import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

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

async function loadArtifactTool() {
  const runtimeModules = process.env.RUNTIME_NODE_MODULES;
  if (!runtimeModules) throw new Error('缺少 RUNTIME_NODE_MODULES 环境变量');
  const modulePath = path.join(runtimeModules, '@oai', 'artifact-tool', 'dist', 'artifact_tool.mjs');
  return import(pathToFileURL(modulePath).href);
}

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
  return deck.slides.items.flatMap((slide, slideIndex) =>
    slide.shapes.items.map((shape) => ({ shape, slideIndex })),
  );
}

function replacePlaceholder(shape, value) {
  const current = String(shape.text ?? '');
  if (!current.includes('{{')) throw new Error(`绑定对象 ${shape.name} 不含占位符`);
  const placeholders = current.match(/\{\{[^{}]+\}\}/g) ?? [];
  shape.text = placeholders.length > 1 ? value : current.replace(placeholders[0], value);
}

function bindDeck(deck, bindings) {
  const shapes = allShapes(deck);
  for (const [name, value] of Object.entries(bindings.named)) {
    const matches = shapes.filter(({ shape }) => shape.name === name);
    if (matches.length !== 1) throw new Error(`绑定对象 ${name} 匹配数量为 ${matches.length}`);
    replacePlaceholder(matches[0].shape, value);
  }

  bindings.cards.forEach((card, index) => {
    const number = String(index + 1).padStart(2, '0');
    const titleMatches = shapes.filter(({ shape }) => String(shape.text ?? '') === SOURCE_CARD_TITLES[index]);
    if (titleMatches.length !== 1) throw new Error(`动作标题 ${SOURCE_CARD_TITLES[index]} 匹配数量为 ${titleMatches.length}`);
    titleMatches[0].shape.text = card.title;

    for (const [suffix, value] of [['scope', card.scope], ['frequency', card.frequency]]) {
      const name = `field-action-${number}-${suffix}`;
      const matches = shapes.filter(({ shape }) => shape.name === name);
      if (matches.length !== 1) throw new Error(`绑定对象 ${name} 匹配数量为 ${matches.length}`);
      replacePlaceholder(matches[0].shape, value);
    }
  });

  const unresolved = shapes
    .map(({ shape, slideIndex }) => ({ text: String(shape.text ?? ''), slide: slideIndex + 1 }))
    .filter(({ text }) => /\{\{[^{}]+\}\}/.test(text));
  if (unresolved.length) {
    throw new Error(`仍有未绑定占位符：${unresolved.map((item) => `P${item.slide} ${item.text}`).join('；')}`);
  }
}

async function saveBlob(filePath, blob) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, new Uint8Array(await blob.arrayBuffer()));
}

export async function generatePresentation({ templatePath, result, outputPath, generatedAt, previewDir, onStage }) {
  onStage?.('preparing');
  const bindings = buildPresentationBindings(result, generatedAt);
  onStage?.('binding');
  const { FileBlob, PresentationFile } = await loadArtifactTool();
  const deck = await PresentationFile.importPptx(await FileBlob.load(templatePath));
  if (deck.slides.items.length !== 24) throw new Error(`模板页数异常：${deck.slides.items.length}`);

  bindDeck(deck, bindings);

  if (previewDir) {
    await fs.mkdir(previewDir, { recursive: true });
    for (const [index, slide] of deck.slides.items.entries()) {
      const number = String(index + 1).padStart(2, '0');
      await saveBlob(path.join(previewDir, `slide-${number}.png`), await deck.export({ slide, format: 'png', scale: 1 }));
      const layout = await slide.export({ format: 'layout' });
      await fs.writeFile(path.join(previewDir, `slide-${number}.layout.json`), await layout.text(), 'utf8');
    }
    await saveBlob(path.join(previewDir, 'montage.webp'), await deck.export({ format: 'webp', montage: true, scale: 1 }));
    const inspection = await deck.inspect({
      kind: 'slide,textbox,shape,image,notes',
      include: 'id,slide,name,text,textPreview,bbox',
      maxChars: 500000,
    });
    await fs.writeFile(path.join(previewDir, 'inspect.ndjson'), inspection.ndjson, 'utf8');
  }

  onStage?.('exporting');
  const pptx = await PresentationFile.exportPptx(deck);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await pptx.save(outputPath);
  return { outputPath, slides: deck.slides.items.length, bindings };
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
    previewDir: args['preview-dir'] ? path.resolve(args['preview-dir']) : undefined,
    onStage: (stage) => process.stdout.write(`${JSON.stringify({ type: 'stage', stage })}\n`),
  });
  process.stdout.write(`${JSON.stringify({ type: 'complete', outputPath: output.outputPath, slides: output.slides })}\n`);
}
