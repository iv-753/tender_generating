import assert from 'node:assert/strict';
import test from 'node:test';
import { applicationFileManifest, compressionCommand, isForbiddenPackagePath, launcherCommand, runtimePackageJson } from './build-package.mjs';

test('portable application manifest contains every local runtime dependency', () => {
  const destinations = applicationFileManifest().map((item) => item.destination.replaceAll('\\', '/'));

  assert.ok(destinations.includes('server.mjs'));
  assert.ok(destinations.includes('dist'));
  assert.ok(destinations.includes('templates'));
  assert.ok(destinations.includes('scripts/calculation'));
  assert.ok(destinations.includes('scripts/excel-recognition'));
  assert.ok(destinations.includes('scripts/ppt-binding'));
  assert.ok(destinations.includes('scripts/bid-binding'));
  assert.ok(destinations.includes('api/_lib/result-validation.mjs'));
  assert.ok(destinations.includes('src/data/city-cost-bands.json'));
  assert.ok(destinations.some((path) => path.startsWith('portable/')));
});

test('forbids secrets, source workbooks, and generated user data from a package', () => {
  for (const path of ['.env', 'qianwen-key.csv', 'limenkey.csv', 'public/models/动态成本.xlsx', 'outputs/客户项目.xlsx', '生成文件/历史项目.docx']) {
    assert.equal(isForbiddenPackagePath(path), true, path);
  }
  assert.equal(isForbiddenPackagePath('app/templates/物业路演PPT_完整24页_v1.pptx'), false);
  assert.equal(isForbiddenPackagePath('app/src/data/city-cost-bands.json'), false);
});

test('passes a quoted package root without a trailing backslash before the quote', () => {
  const command = launcherCommand('start');
  assert.match(command, /--root "%~dp0\."/);
  assert.doesNotMatch(command, /--root "%~dp0"/);
});

test('installs only dependencies required by the local server', () => {
  const manifest = runtimePackageJson();
  assert.deepEqual(Object.keys(manifest.dependencies).sort(), ['@office-kit/pptx', '@xmldom/xmldom', 'formualizer', 'jszip']);
  assert.equal(manifest.dependencies.react, undefined);
  assert.equal(manifest.dependencies.antd, undefined);
  assert.equal(manifest.dependencies['@vercel/blob'], undefined);
});

test('uses Windows Unicode-safe ZIP compression', () => {
  const command = compressionCommand('Z:\\交付\\物业方案工作台-本地版', 'Z:\\交付\\物业方案工作台-本地版.zip');
  assert.equal(command.executable, 'powershell.exe');
  assert.ok(command.args.includes('Compress-Archive'));
  assert.ok(command.args.includes('Z:\\交付\\物业方案工作台-本地版'));
  assert.ok(command.args.includes('Z:\\交付\\物业方案工作台-本地版.zip'));
});
