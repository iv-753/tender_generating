import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { dirname, extname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCalculator, validateProject } from './scripts/calculation/calculator.mjs';
import { applyAdjustments } from './scripts/calculation/adjustments.mjs';
import { loadRecognitionConfig } from './scripts/excel-recognition/config.mjs';
import { recognizeExcel } from './scripts/excel-recognition/recognize-excel.mjs';
import { resultValidationError } from './api/_lib/result-validation.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(ROOT, 'dist');
const PRESENTATION_TEMPLATE = resolve(ROOT, 'templates', '物业路演PPT_完整24页_v1.pptx');
const PRESENTATION_OUTPUT = resolve(ROOT, '..', 'output');
const PRESENTATION_GENERATOR = resolve(ROOT, 'scripts', 'ppt-binding', 'generate-ppt.mjs');
const BID_TEMPLATE = resolve(ROOT, 'templates', '安序物业_住宅物业服务投标文件_双括号动态母版_清理版.docx');
const BID_GENERATOR = resolve(ROOT, 'scripts', 'bid-binding', 'generate-bid.mjs');
const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT || 4173);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
const presentationJobs = new Map();
const bidJobs = new Map();

const calculate = createCalculator();

function text(value) {
  return value === null || value === undefined || value === '' ? '' : String(value);
}

function json(response, status, payload) {
  const body = Buffer.from(JSON.stringify(payload));
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': body.length, 'Cache-Control': 'no-store' });
  response.end(body);
}

function publicPresentationJob(job) {
  return {
    jobId: job.jobId,
    status: job.status,
    stage: job.stage,
    fileName: job.fileName,
    slides: job.slides,
    downloadUrl: job.status === 'complete' ? `/api/presentation/jobs/${job.jobId}/download` : undefined,
    error: job.error,
  };
}

function publicBidJob(job) {
  return {
    jobId: job.jobId,
    status: job.status,
    stage: job.stage,
    fileName: job.fileName,
    actionCount: job.actionCount,
    downloadUrl: job.status === 'complete' ? `/api/bid/jobs/${job.jobId}/download` : undefined,
    error: job.error,
  };
}

function safeFileName(value) {
  return text(value).trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').replace(/[. ]+$/g, '').slice(0, 80) || '物业项目';
}

function startPresentationJob(job, result) {
  queueMicrotask(async () => {
    const resultPath = resolve(PRESENTATION_OUTPUT, `.${job.jobId}.json`);
    try {
      await mkdir(PRESENTATION_OUTPUT, { recursive: true });
      await writeFile(resultPath, JSON.stringify(result), 'utf8');
      job.stage = 'preparing';
      const child = spawn(process.env.RUNTIME_NODE || process.execPath, [
        '--no-warnings',
        '--experimental-wasm-modules',
        PRESENTATION_GENERATOR,
        '--template', PRESENTATION_TEMPLATE,
        '--result', resultPath,
        '--output', job.outputPath,
      ], { cwd: ROOT, env: process.env, windowsHide: true });
      let stdout = '';
      let stderr = '';
      child.stdout.setEncoding('utf8');
      child.stderr.setEncoding('utf8');
      child.stdout.on('data', (chunk) => {
        stdout += chunk;
        const lines = stdout.split(/\r?\n/);
        stdout = lines.pop() ?? '';
        for (const line of lines) {
          try {
            const event = JSON.parse(line);
            if (event.type === 'stage' && ['preparing', 'binding', 'exporting'].includes(event.stage)) job.stage = event.stage;
            if (event.type === 'complete') job.slides = event.slides;
          } catch {
            // Ignore non-protocol output from the presentation runtime.
          }
        }
      });
      child.stderr.on('data', (chunk) => { stderr += chunk; });
      child.on('error', (error) => {
        job.status = 'error';
        job.error = error.message;
      });
      child.on('close', async (code) => {
        await unlink(resultPath).catch(() => undefined);
        if (code === 0 && job.status !== 'error') {
          job.status = 'complete';
          job.stage = 'complete';
          job.slides ||= 24;
        } else if (job.status !== 'error') {
          job.status = 'error';
          job.error = stderr.trim().split(/\r?\n/).at(-1) || 'PPT生成失败';
        }
      });
    } catch (error) {
      await unlink(resultPath).catch(() => undefined);
      job.status = 'error';
      job.error = error instanceof Error ? error.message : 'PPT生成失败';
    }
  });
}

function startBidJob(job, result) {
  queueMicrotask(async () => {
    const resultPath = resolve(PRESENTATION_OUTPUT, `.${job.jobId}.bid.json`);
    try {
      await mkdir(PRESENTATION_OUTPUT, { recursive: true });
      await writeFile(resultPath, JSON.stringify(result), 'utf8');
      job.stage = 'preparing';
      const child = spawn(process.env.RUNTIME_NODE || process.execPath, [
        BID_GENERATOR,
        '--template', BID_TEMPLATE,
        '--result', resultPath,
        '--output', job.outputPath,
      ], { cwd: ROOT, env: process.env, windowsHide: true });
      let stdout = '';
      let stderr = '';
      child.stdout.setEncoding('utf8');
      child.stderr.setEncoding('utf8');
      child.stdout.on('data', (chunk) => {
        stdout += chunk;
        const lines = stdout.split(/\r?\n/);
        stdout = lines.pop() ?? '';
        for (const line of lines) {
          try {
            const event = JSON.parse(line);
            if (event.type === 'stage' && ['preparing', 'binding', 'exporting'].includes(event.stage)) job.stage = event.stage;
            if (event.type === 'complete') job.actionCount = event.actionCount;
          } catch {
            // Ignore non-protocol output from the document runtime.
          }
        }
      });
      child.stderr.on('data', (chunk) => { stderr += chunk; });
      child.on('error', (error) => {
        job.status = 'error';
        job.error = error.message;
      });
      child.on('close', async (code) => {
        await unlink(resultPath).catch(() => undefined);
        if (code === 0 && job.status !== 'error') {
          job.status = 'complete';
          job.stage = 'complete';
        } else if (job.status !== 'error') {
          job.status = 'error';
          job.error = stderr.trim().split(/\r?\n/).at(-1) || '标书生成失败';
        }
      });
    } catch (error) {
      await unlink(resultPath).catch(() => undefined);
      job.status = 'error';
      job.error = error instanceof Error ? error.message : '标书生成失败';
    }
  });
}

async function downloadPresentation(response, job) {
  if (!job || job.status !== 'complete') return json(response, 404, { error: '文件尚未生成或已失效' });
  const fileStat = await stat(job.outputPath);
  const encoded = encodeURIComponent(job.fileName);
  response.writeHead(200, {
    'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'Content-Length': fileStat.size,
    'Content-Disposition': `attachment; filename*=UTF-8''${encoded}`,
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  createReadStream(job.outputPath).pipe(response);
}

async function downloadBidDocument(response, job) {
  if (!job || job.status !== 'complete') return json(response, 404, { error: '文件尚未生成或已失效' });
  const fileStat = await stat(job.outputPath);
  const encoded = encodeURIComponent(job.fileName);
  response.writeHead(200, {
    'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'Content-Length': fileStat.size,
    'Content-Disposition': `attachment; filename*=UTF-8''${encoded}`,
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  createReadStream(job.outputPath).pipe(response);
}

async function readJson(request) {
  const chunks = [];
  let length = 0;
  for await (const chunk of request) {
    length += chunk.length;
    if (length > 1_000_000) throw new Error('请求数据过大');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function readBody(request, maxBytes) {
  const declaredLength = Number(request.headers['content-length'] || 0);
  if (declaredLength > maxBytes) throw new Error('上传文件不能超过 10MB');
  const chunks = [];
  let length = 0;
  for await (const chunk of request) {
    length += chunk.length;
    if (length > maxBytes) throw new Error('上传文件不能超过 10MB');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function isXlsx(bytes) {
  return bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

async function serveStatic(request, response, pathname) {
  const decoded = decodeURIComponent(pathname);
  const requested = resolve(DIST, `.${decoded === '/' ? '/index.html' : decoded}`);
  const route = relative(DIST, requested);
  if (route.startsWith('..') || isAbsolute(route)) return json(response, 403, { error: '禁止访问' });
  let file = requested;
  try {
    if (!(await stat(file)).isFile()) throw new Error('not a file');
  } catch {
    file = resolve(DIST, 'index.html');
  }
  const body = await readFile(file);
  response.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream', 'Content-Length': body.length, 'X-Content-Type-Options': 'nosniff' });
  response.end(request.method === 'HEAD' ? undefined : body);
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${HOST}:${PORT}`);
    if (url.pathname === '/api/calculate') {
      if (request.method !== 'POST') return json(response, 405, { error: '仅支持 POST 请求' });
      const project = await readJson(request);
      const validationError = validateProject(project);
      if (validationError) return json(response, 400, { error: validationError });
      return json(response, 200, calculate(project));
    }
    if (url.pathname === '/api/calculate-adjusted') {
      if (request.method !== 'POST') return json(response, 405, { error: '仅支持 POST 请求' });
      const body = await readJson(request);
      const validationError = validateProject(body?.project);
      if (validationError) return json(response, 400, { error: validationError });
      return json(response, 200, applyAdjustments(calculate(body.project), body.adjustments));
    }
    if (url.pathname === '/api/excel/recognize') {
      if (request.method !== 'POST') return json(response, 405, { error: '仅支持 POST 请求' });
      const encodedName = text(request.headers['x-file-name']);
      let fileName = '';
      try { fileName = decodeURIComponent(encodedName); } catch { return json(response, 400, { error: '文件名无效' }); }
      if (!fileName.toLowerCase().endsWith('.xlsx')) return json(response, 400, { error: '目前仅支持 .xlsx 文件' });
      let bytes;
      try { bytes = await readBody(request, 10_000_000); } catch (error) { return json(response, 413, { error: error.message }); }
      if (!isXlsx(bytes)) return json(response, 400, { error: '文件不是有效的 .xlsx 工作簿' });
      const config = await loadRecognitionConfig({ projectRoot: resolve(ROOT, '..') });
      return json(response, 200, await recognizeExcel(bytes, { config }));
    }
    if (url.pathname === '/api/presentation/jobs') {
      if (request.method !== 'POST') return json(response, 405, { error: '仅支持 POST 请求' });
      const result = await readJson(request);
      const validationError = resultValidationError(result);
      if (validationError) return json(response, 400, { error: validationError });
      const jobId = randomUUID();
      const fileName = `${safeFileName(result.project.projectName)}-路演方案.pptx`;
      const job = { jobId, status: 'running', stage: 'validating', fileName, slides: undefined, outputPath: resolve(PRESENTATION_OUTPUT, `${jobId}-${fileName}`), error: undefined };
      presentationJobs.set(jobId, job);
      if (presentationJobs.size > 30) presentationJobs.delete(presentationJobs.keys().next().value);
      startPresentationJob(job, result);
      return json(response, 202, publicPresentationJob(job));
    }
    if (url.pathname === '/api/bid/jobs') {
      if (request.method !== 'POST') return json(response, 405, { error: '仅支持 POST 请求' });
      const result = await readJson(request);
      const validationError = resultValidationError(result);
      if (validationError) return json(response, 400, { error: validationError });
      const jobId = randomUUID();
      const fileName = `${safeFileName(result.project.projectName)}-投标标书.docx`;
      const job = { jobId, status: 'running', stage: 'validating', fileName, actionCount: undefined, outputPath: resolve(PRESENTATION_OUTPUT, `${jobId}-${fileName}`), error: undefined };
      bidJobs.set(jobId, job);
      if (bidJobs.size > 30) bidJobs.delete(bidJobs.keys().next().value);
      startBidJob(job, result);
      return json(response, 202, publicBidJob(job));
    }
    const presentationMatch = url.pathname.match(/^\/api\/presentation\/jobs\/([0-9a-f-]+)(\/download)?$/i);
    if (presentationMatch) {
      const job = presentationJobs.get(presentationMatch[1]);
      if (presentationMatch[2]) {
        if (request.method !== 'GET') return json(response, 405, { error: '仅支持 GET 请求' });
        return downloadPresentation(response, job);
      }
      if (request.method !== 'GET') return json(response, 405, { error: '仅支持 GET 请求' });
      if (!job) return json(response, 404, { error: '生成任务不存在或已失效' });
      return json(response, 200, publicPresentationJob(job));
    }
    const bidMatch = url.pathname.match(/^\/api\/bid\/jobs\/([0-9a-f-]+)(\/download)?$/i);
    if (bidMatch) {
      const job = bidJobs.get(bidMatch[1]);
      if (bidMatch[2]) {
        if (request.method !== 'GET') return json(response, 405, { error: '仅支持 GET 请求' });
        return downloadBidDocument(response, job);
      }
      if (request.method !== 'GET') return json(response, 405, { error: '仅支持 GET 请求' });
      if (!job) return json(response, 404, { error: '生成任务不存在或已失效' });
      return json(response, 200, publicBidJob(job));
    }
    if (url.pathname.startsWith('/api/')) return json(response, 404, { error: '接口不存在' });
    if (request.method !== 'GET' && request.method !== 'HEAD') return json(response, 405, { error: '请求方法不支持' });
    await serveStatic(request, response, url.pathname);
  } catch (error) {
    console.error(error);
    json(response, 500, { error: error instanceof Error ? error.message : '服务内部错误' });
  }
});

server.listen(PORT, HOST, () => console.log(`Property calculator: http://${HOST}:${PORT}/project/new`));
