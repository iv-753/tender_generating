import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { dirname, extname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import init, { Workbook } from 'formualizer';

const ROOT = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(ROOT, 'dist');
const MODEL = resolve(ROOT, '..', '动态成本分析模型.xlsx');
const PRESENTATION_TEMPLATE = resolve(ROOT, '..', '物业路演PPT_完整24页_v1.pptx');
const PRESENTATION_OUTPUT = resolve(ROOT, '..', 'output');
const PRESENTATION_GENERATOR = resolve(ROOT, 'scripts', 'ppt-binding', 'generate-ppt.mjs');
const BID_TEMPLATE = resolve(ROOT, '..', 'output', 'bid-template', '安序物业_住宅物业服务投标文件_双括号动态母版_清理版.docx');
const BID_GENERATOR = resolve(ROOT, 'scripts', 'bid-binding', 'generate-bid.mjs');
const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT || 4173);
const ACTION_COUNTS = { service: 17, cleaning: 48, greening: 51, assistance: 6 };
const FACTORS = { high: 1.2, upper: 1.1, standard: 1, base: 0.9 };
const GRADES = { A: '紫荆花', B: '金百合', C: '郁金香', D: '向日葵' };
const GRADE_COLUMNS = { A: 5, B: 7, C: 9, D: 11 };
const ASSISTANCE_ROWS = [4, 5, 7, 8, 9, 10];
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };
const presentationJobs = new Map();
const bidJobs = new Map();

await init();
const modelBytes = await readFile(MODEL);

function text(value) {
  return value === null || value === undefined || value === '' ? '' : String(value);
}
function number(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
function optionalNumber(value) {
  return value === null || value === undefined || value === '' ? undefined : number(value);
}
function safeValue(value) {
  return ['string', 'number', 'boolean'].includes(typeof value) ? value : undefined;
}

function validate(project) {
  if (!project || typeof project !== 'object') return '项目数据无效';
  if (!text(project.projectName).trim()) return '请填写项目名称';
  if (!text(project.region).trim() || !text(project.city).trim()) return '请填写项目地区和城市';
  if (!GRADES[project.serviceGrade] || !FACTORS[project.costBand]) return '测算参数无效';
  if (number(project.occupiedHouseholds) > number(project.receivedHouseholds)) return '常住户数不能大于已收楼户数';
  if (number(project.receivedHouseholds) > number(project.deliveredHouseholds)) return '已收楼户数不能大于已交付户数';
  if (number(project.lawnRatio) < 0 || number(project.lawnRatio) > 1) return '草坪比例必须在 0%—100% 之间';
  if (!Array.isArray(project.buildings) || project.buildings.length < 1 || project.buildings.length > 5) return '楼栋类型必须为 1—5 类';
  const numbers = [project.totalBuildingArea, project.residentialChargeArea, project.deliveredHouseholds, project.receivedHouseholds, project.occupiedHouseholds, project.perimeterEntrances, project.gatehouses, project.pavedRoadArea, project.greenArea, project.lawnRatio, project.seasonalFlowerArea, project.winterProtectionArea, project.garageFloorArea, project.garageFloors, ...project.buildings.flatMap((item) => Object.values(item))];
  if (numbers.some((value) => typeof value !== 'number' || !Number.isFinite(value) || value < 0)) return '所有数值必须为非负数';
}

function writeInputs(workbook, project) {
  const sheet = workbook.sheet('总-汇总表');
  sheet.setValue(6, 2, GRADES[project.serviceGrade]);
  sheet.setValues(19, 7, [[project.totalBuildingArea, project.residentialChargeArea, project.deliveredHouseholds, project.receivedHouseholds, project.occupiedHouseholds]]);
  sheet.setValues(24, 7, [[project.perimeterEntrances, project.gatehouses, project.pavedRoadArea, project.greenArea, project.lawnRatio, project.seasonalFlowerArea, project.winterProtectionArea]]);
  for (let row = 12; row <= 44; row += 1) sheet.setValue(row, 3, null);
  for (let index = 0; index < 5; index += 1) {
    const item = project.buildings[index];
    sheet.setValues(29 + index, 8, [[...(item ? [item.buildingCount, item.lobbyElevatorCount, item.stiltFloorArea, item.totalFloors, item.standardLobbyArea, item.evacuationStairArea, item.rooftopArea] : [null, null, null, null, null, null, null])]]);
  }
  sheet.setValues(37, 7, [[project.garageFloorArea, project.garageFloors]]);
}

function readService(workbook, factor) {
  const sheet = workbook.sheet('服务');
  return Array.from({ length: ACTION_COUNTS.service }, (_, index) => {
    const row = index + 5;
    return { id: `service-${row}`, category: 'service', action: text(sheet.getValue(row, 1)), property: text(sheet.getValue(row, 8)), basis: text(sheet.getValue(row, 15)), frequency: text(sheet.getValue(row, 13)), annualFrequency: optionalNumber(sheet.getValue(row, 16)), annualHours: optionalNumber(sheet.getValue(row, 17)), headcount: optionalNumber(sheet.getValue(row, 20)), annualCost: number(sheet.getValue(row, 19)) * factor };
  });
}

function readCleaning(workbook, factor) {
  const sheet = workbook.sheet('清洁');
  let surface = '';
  let location = '';
  return Array.from({ length: ACTION_COUNTS.cleaning }, (_, index) => {
    const row = index + 5;
    surface = text(sheet.getValue(row, 1)) || surface;
    location = text(sheet.getValue(row, 2)) || location;
    const annualHours = number(sheet.getValue(row, 25));
    return { id: `cleaning-${row}`, category: 'cleaning', action: text(sheet.getValue(row, 3)), property: text(sheet.getValue(row, 13)), unit: text(sheet.getValue(row, 4)), quantity: safeValue(sheet.getValue(row, 5)), basis: [surface, location].filter(Boolean).join(' / '), frequency: text(sheet.getValue(row, 22)), annualFrequency: optionalNumber(sheet.getValue(row, 24)), annualHours: optionalNumber(sheet.getValue(row, 25)), annualCost: annualHours * number(sheet.getValue(row, 27)) * factor };
  });
}

function readGreening(workbook, factor) {
  const sheet = workbook.sheet('绿化');
  return Array.from({ length: ACTION_COUNTS.greening }, (_, index) => {
    const row = index + 5;
    return { id: `greening-${row}`, category: 'greening', action: text(sheet.getValue(row, 1)), property: text(sheet.getValue(row, 10)), unit: text(sheet.getValue(row, 2)), quantity: safeValue(sheet.getValue(row, 3)), frequency: text(sheet.getValue(row, 19)), annualFrequency: optionalNumber(sheet.getValue(row, 21)), annualHours: optionalNumber(sheet.getValue(row, 22)), annualCost: number(sheet.getValue(row, 25)) * factor };
  });
}

function readAssistance(workbook, project, factor) {
  const sheet = workbook.sheet('客助');
  const monthlyPrice = number(sheet.getValue(12, 16));
  return ASSISTANCE_ROWS.map((row) => {
    const headcount = number(sheet.getValue(row, 16));
    return { id: `assistance-${row}`, category: 'assistance', action: text(sheet.getValue(row, 1)), property: text(sheet.getValue(row, 4)), unit: text(sheet.getValue(row, 2)), quantity: safeValue(sheet.getValue(row, 3)), frequency: text(sheet.getValue(row, GRADE_COLUMNS[project.serviceGrade])), headcount, annualCost: headcount * monthlyPrice * 12 * factor };
  });
}

function readSummaries(workbook, factor) {
  const definitions = [
    ['service', '服务', 17, 26, 20, 27, 20],
    ['cleaning', '清洁', 48, 58, 28, 60, 27],
    ['greening', '绿化', 51, 59, 26, 61, 26],
    ['assistance', '客助', 6, 11, 16, 13, 16],
  ];
  return definitions.map(([category, title, actionCount, headRow, headColumn, costRow, costColumn]) => {
    const sheet = workbook.sheet(title);
    return { category, title, actionCount, headcount: number(sheet.getValue(headRow, headColumn)), annualCost: number(sheet.getValue(costRow, costColumn)) * factor };
  });
}

function calculate(project) {
  const workbook = Workbook.fromXlsxBytes(modelBytes);
  writeInputs(workbook, project);
  workbook.evaluateAll();
  const factor = FACTORS[project.costBand];
  const actions = [...readService(workbook, factor), ...readCleaning(workbook, factor), ...readGreening(workbook, factor), ...readAssistance(workbook, project, factor)];
  if (actions.length !== 122) throw new Error(`测算结果数量异常：应为 122 项，实际为 ${actions.length} 项`);
  const categories = readSummaries(workbook, factor);
  return { version: 1, calculatedAt: new Date().toISOString(), project, totalActionCount: actions.length, totalHeadcount: categories.reduce((sum, item) => sum + item.headcount, 0), annualCost: categories.reduce((sum, item) => sum + item.annualCost, 0), categories, actions };
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

function presentationValidationError(result) {
  if (!result || typeof result !== 'object') return '测算结果无效';
  if (!text(result.project?.projectName).trim()) return '测算结果缺少项目名称';
  if (result.totalActionCount !== 122 || !Array.isArray(result.actions) || result.actions.length !== 122) return '服务动作数据不完整，请重新测算';
  if (!Array.isArray(result.categories) || !['service', 'cleaning', 'greening', 'assistance'].every((category) => result.categories.some((item) => item.category === category))) return '服务分类数据不完整，请重新测算';
  return undefined;
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
      const validationError = validate(project);
      if (validationError) return json(response, 400, { error: validationError });
      return json(response, 200, calculate(project));
    }
    if (url.pathname === '/api/presentation/jobs') {
      if (request.method !== 'POST') return json(response, 405, { error: '仅支持 POST 请求' });
      const result = await readJson(request);
      const validationError = presentationValidationError(result);
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
      const validationError = presentationValidationError(result);
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
