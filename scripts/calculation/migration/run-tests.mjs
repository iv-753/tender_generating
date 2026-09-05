import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const bundledPython = process.platform === 'win32'
  ? join(
      homedir(),
      '.cache',
      'codex-runtimes',
      'codex-primary-runtime',
      'dependencies',
      'python',
      'python.exe',
    )
  : join(
      homedir(),
      '.cache',
      'codex-runtimes',
      'codex-primary-runtime',
      'dependencies',
      'python',
      'bin',
      'python3',
    );

const candidates = [
  process.env.MIGRATION_PYTHON && { command: process.env.MIGRATION_PYTHON, args: [] },
  existsSync(bundledPython) && { command: bundledPython, args: [] },
  { command: 'python3', args: [] },
  { command: 'python', args: [] },
  process.platform === 'win32' && { command: 'py', args: ['-3'] },
].filter(Boolean);

const probe = [
  '-c',
  "import openpyxl,sys;sys.exit(0 if openpyxl.__version__=='3.1.5' else 1)",
];

for (const candidate of candidates) {
  const available = spawnSync(candidate.command, [...candidate.args, ...probe], {
    stdio: 'ignore',
    windowsHide: true,
  });
  if (available.status !== 0) continue;

  const result = spawnSync(
    candidate.command,
    [
      ...candidate.args,
      '-m',
      'unittest',
      'scripts/calculation/migration/test_generate_static_rules.py',
    ],
    { stdio: 'inherit', windowsHide: true },
  );
  process.exit(result.status ?? 1);
}

console.error(
  '未找到包含 openpyxl==3.1.5 的 Python。可设置 MIGRATION_PYTHON，或按 migration/requirements.txt 准备独立环境。',
);
process.exit(1);
