import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { access, cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import JSZip from 'jszip';

const SOURCE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PACKAGE_NAME = '物业方案工作台-本地版';
const NODE_VERSION = process.env.PORTABLE_NODE_VERSION || 'v24.18.0';

export function applicationFileManifest() {
  return [
    { source: 'server.mjs', destination: 'server.mjs' },
    { source: 'dist', destination: 'dist' },
    { source: 'templates', destination: 'templates' },
    { source: 'scripts/calculation', destination: 'scripts/calculation' },
    { source: 'scripts/excel-recognition', destination: 'scripts/excel-recognition' },
    { source: 'scripts/ppt-binding', destination: 'scripts/ppt-binding' },
    { source: 'scripts/bid-binding', destination: 'scripts/bid-binding' },
    { source: 'api/_lib/result-validation.mjs', destination: 'api/_lib/result-validation.mjs' },
    { source: 'src/data/city-cost-bands.json', destination: 'src/data/city-cost-bands.json' },
    { source: 'scripts/portable/start.mjs', destination: 'portable/start.mjs' },
    { source: 'scripts/portable/stop.mjs', destination: 'portable/stop.mjs' },
    { source: 'scripts/portable/runtime-state.mjs', destination: 'portable/runtime-state.mjs' },
  ];
}

export function isForbiddenPackagePath(filePath) {
  const normalized = String(filePath).replaceAll('\\', '/').toLowerCase();
  return /(^|\/)\.env(?:\.|$)/.test(normalized)
    || /(?:qianwen|limenkey).*\.csv$/.test(normalized)
    || /(^|\/)public\/models\/.*\.xlsx$/.test(normalized)
    || /(^|\/)outputs?\//.test(normalized)
    || /(^|\/)生成文件\/.+/.test(normalized);
}

export function launcherCommand(action) {
  const script = action === 'stop' ? 'stop.mjs' : 'start.mjs';
  return `@echo off\r\nchcp 65001 >nul\r\ncd /d "%~dp0"\r\n"app\\runtime\\node.exe" "app\\portable\\${script}" --root "%~dp0."\r\nif errorlevel 1 pause\r\n`;
}

export function runtimePackageJson() {
  return {
    name: 'property-calculator-portable-runtime',
    private: true,
    type: 'module',
    dependencies: {
      '@office-kit/pptx': '0.12.0',
      '@xmldom/xmldom': '0.9.12',
      formualizer: '0.8.4',
      jszip: '3.10.1',
    },
  };
}

export function compressionCommand(packageRoot, zipPath) {
  return {
    executable: 'powershell.exe',
    args: [
      '-NoProfile',
      '-NonInteractive',
      '-Command',
      'Compress-Archive',
      '-LiteralPath', packageRoot,
      '-DestinationPath', zipPath,
      '-CompressionLevel', 'Optimal',
      '-Force',
    ],
  };
}

function run(command, args, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', windowsHide: true, ...options });
    child.once('error', reject);
    child.once('close', (code) => code === 0 ? resolvePromise() : reject(new Error(`${command} 执行失败，退出码 ${code}`)));
  });
}

async function copyManifest(appRoot) {
  for (const item of applicationFileManifest()) {
    const source = resolve(SOURCE_ROOT, item.source);
    const destination = resolve(appRoot, item.destination);
    await mkdir(dirname(destination), { recursive: true });
    await cp(source, destination, { recursive: true });
  }
}

async function sha256(file) {
  return createHash('sha256').update(await readFile(file)).digest('hex');
}

async function download(url, destination) {
  const response = await fetch(url);
  if (!response.ok || !response.body) throw new Error(`下载失败：${url}`);
  await mkdir(dirname(destination), { recursive: true });
  await pipeline(response.body, createWriteStream(destination));
}

async function installPortableNode(appRoot, cacheRoot) {
  if (!/^v\d+\.\d+\.\d+$/.test(NODE_VERSION)) throw new Error(`Node.js 版本号无效：${NODE_VERSION}`);
  const archiveName = `node-${NODE_VERSION}-win-x64.zip`;
  const baseUrl = `https://nodejs.org/dist/${NODE_VERSION}`;
  const archivePath = resolve(cacheRoot, archiveName);
  const checksums = await (await fetch(`${baseUrl}/SHASUMS256.txt`)).text();
  const expected = checksums.split(/\r?\n/).find((line) => line.endsWith(`  ${archiveName}`))?.split(/\s+/)[0];
  if (!expected) throw new Error(`未找到 ${archiveName} 的官方校验值`);

  let valid = false;
  try { valid = (await sha256(archivePath)) === expected; } catch { valid = false; }
  if (!valid) {
    await rm(archivePath, { force: true });
    await download(`${baseUrl}/${archiveName}`, archivePath);
    if (await sha256(archivePath) !== expected) throw new Error('Node.js 运行环境校验失败');
  }

  const zip = await JSZip.loadAsync(await readFile(archivePath));
  const nodeEntry = Object.values(zip.files).find((entry) => /\/node\.exe$/i.test(entry.name));
  if (!nodeEntry) throw new Error('Node.js 压缩包中缺少 node.exe');
  const runtimeRoot = resolve(appRoot, 'runtime');
  await mkdir(runtimeRoot, { recursive: true });
  await writeFile(resolve(runtimeRoot, 'node.exe'), await nodeEntry.async('nodebuffer'));
  await writeFile(resolve(runtimeRoot, 'VERSION.txt'), `${NODE_VERSION}\n来源：${baseUrl}/${archiveName}\nSHA256：${expected}\n`, 'utf8');
}

async function listFiles(root) {
  const files = [];
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      if (entry.isDirectory()) await visit(path);
      else if (entry.isFile()) files.push(relative(root, path));
    }
  }
  await visit(root);
  return files;
}

async function createUserFiles(packageRoot) {
  await mkdir(resolve(packageRoot, '生成文件'), { recursive: true });
  await writeFile(resolve(packageRoot, '启动物业方案工作台.cmd'), launcherCommand('start'), 'utf8');
  await writeFile(resolve(packageRoot, '关闭物业方案工作台.cmd'), launcherCommand('stop'), 'utf8');
  await writeFile(resolve(packageRoot, '使用说明.txt'), [
    '物业方案工作台本地版',
    '',
    '1. 请先完整解压本压缩包，不要直接在压缩包内运行。',
    '2. 双击“启动物业方案工作台.cmd”，浏览器会自动打开。',
    '3. 测算、服务动作调整、PPT和标书生成可在本地运行。',
    '4. 复杂Excel的智能增强识别需要联网；网络异常时仍会保留本地规则识别结果，可在表单中补充。',
    '5. 生成的PPT和标书保存在“生成文件”文件夹。',
    '6. 使用结束后可双击“关闭物业方案工作台.cmd”。',
  ].join('\r\n'), 'utf8');
}

export async function buildPortablePackage() {
  const releaseRoot = resolve(SOURCE_ROOT, 'release');
  const packageRoot = resolve(releaseRoot, PACKAGE_NAME);
  const appRoot = resolve(packageRoot, 'app');
  const zipPath = resolve(releaseRoot, `${PACKAGE_NAME}.zip`);
  const cacheRoot = resolve(SOURCE_ROOT, '..', '.portable-cache');
  const pnpmStore = resolve(cacheRoot, 'pnpm-store');

  await rm(packageRoot, { recursive: true, force: true });
  await rm(zipPath, { force: true });
  await mkdir(appRoot, { recursive: true });
  await copyManifest(appRoot);
  await writeFile(resolve(appRoot, 'package.json'), `${JSON.stringify(runtimePackageJson(), null, 2)}\n`, 'utf8');
  await createUserFiles(packageRoot);
  await installPortableNode(appRoot, cacheRoot);

  await run('pnpm', ['install', '--prod', '--lockfile=false', '--prefer-offline', '--store-dir', pnpmStore, '--dir', appRoot], { shell: true });
  const forbidden = (await listFiles(packageRoot)).filter(isForbiddenPackagePath);
  if (forbidden.length) throw new Error(`本地包包含禁止文件：${forbidden.join('、')}`);

  const compression = compressionCommand(packageRoot, zipPath);
  await run(compression.executable, compression.args);
  await access(zipPath);
  const sizeMb = ((await stat(zipPath)).size / 1024 / 1024).toFixed(1);
  process.stdout.write(`本地包已生成：${zipPath}（${sizeMb} MB）\n`);
  return { packageRoot, zipPath };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildPortablePackage().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.stack : error}\n`);
    process.exitCode = 1;
  });
}
