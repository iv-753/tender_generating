import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { buildBidBindings } from './bindings.mjs';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const BINDER = path.join(SCRIPT_DIR, 'apply_bindings.py');

function runPython(python, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(python, args, { windowsHide: true });
    let stderr = '';
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr.trim().split(/\r?\n/).at(-1) || '标书生成失败'));
    });
  });
}

export async function generateBidDocument({ templatePath, result, outputPath, generatedAt = new Date(), onStage }) {
  const bindingsPath = `${outputPath}.${process.pid}.bindings.json`;
  try {
    onStage?.('preparing');
    const bindings = buildBidBindings(result, generatedAt, {
      propertyType: '住宅物业',
      projectManager: '以投标授权文件为准',
      servicePeriod: '以招标文件约定为准',
    });
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(bindingsPath, JSON.stringify(bindings), 'utf8');
    onStage?.('binding');
    onStage?.('exporting');
    await runPython(process.env.RUNTIME_PYTHON || 'python', [
      BINDER,
      '--template', path.resolve(templatePath),
      '--bindings', bindingsPath,
      '--output', path.resolve(outputPath),
    ]);
    return { outputPath, actionCount: bindings.actionRows.filter((item) => item.enabled).length };
  } finally {
    await fs.unlink(bindingsPath).catch(() => undefined);
  }
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

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = parseArgs(process.argv.slice(2));
  const result = JSON.parse(await fs.readFile(path.resolve(args.result), 'utf8'));
  const generatedAt = args['generated-at'] ? new Date(args['generated-at']) : new Date();
  const output = await generateBidDocument({
    templatePath: path.resolve(args.template),
    result,
    outputPath: path.resolve(args.output),
    generatedAt,
    onStage: (stage) => process.stdout.write(`${JSON.stringify({ type: 'stage', stage })}\n`),
  });
  process.stdout.write(`${JSON.stringify({ type: 'complete', outputPath: output.outputPath, actionCount: output.actionCount })}\n`);
}
