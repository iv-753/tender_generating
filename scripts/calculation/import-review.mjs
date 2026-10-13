import { SUPPLEMENT_FIELDS, BUILDING_IMPORT_FIELDS } from '../excel-recognition/zhujiang-import-fields.mjs';

const geometry = {
  'building.groundFloorLobbyArea': ['lobbyElevatorCount', 'buildingCount'],
  'building.stiltFloorArea': ['stiltFloorArea', 'buildingCount'],
  'building.standardFloorArea': ['standardLobbyArea', 'totalFloors'],
  'building.roofArea': ['rooftopArea', 'buildingCount'],
  'building.evacuationStairArea': ['evacuationStairArea', 'totalFloors'],
};
const areaFields = { 'grounds.entrancePlazaArea': 'perimeterEntrances', 'grounds.zoneArea': 'greenArea', 'grounds.roadArea': 'pavedRoadArea' };
const validNumber = (v, field) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && (!field.integer || Number.isInteger(v)) && (field.max === undefined || v <= field.max);

export function reviewField(issue, project) {
  const key = issue.key;
  const building = key.match(/^buildings\[(\d+)\]\.(\w+)$/);
  const definition = SUPPLEMENT_FIELDS.find(f => f.key === key) ?? (building && BUILDING_IMPORT_FIELDS.find(f => f.key === building[2]));
  if (key.startsWith('posts.')) return { kind: 'post', key: 'zhuj.securityAdditionalStaff', unit: '人', integer: true, current: project.workbookOverrides?.['zhuj.securityAdditionalStaff'] ?? null };
  if (key === '服务!P15') return { kind: 'activity', key, unit: '次/年', current: project.workbookOverrides?.[key] ?? null };
  if (!definition) return { kind: 'unsupported', key, unit: '', current: null };
  if (definition.target === 'project') return { ...definition, key, kind: 'basic', current: building ? project.buildings?.[Number(building[1])]?.[building[2]] : project[key], max: definition.type === 'ratio' ? 1 : undefined };
  let derived;
  const asset = key.replace(/^zhuj\.asset\./, '');
  const pair = asset === 'building.evacuationStairArea' && project.stairAreaBasis === 'per-building' ? ['evacuationStairArea', 'buildingCount'] : geometry[asset];
  if (pair && project.buildings?.length && project.buildings.every(b => pair.every(k => validNumber(b[k], {})))) derived = project.buildings.reduce((sum, b) => sum + b[pair[0]] * b[pair[1]], 0);
  if (areaFields[asset]) derived = project[areaFields[asset]];
  if (asset === 'basement.parkingArea' && validNumber(project.garageFloorArea, {}) && validNumber(project.garageFloors, {})) derived = project.garageFloorArea * project.garageFloors;
  return { ...definition, kind: 'number', current: project.workbookOverrides?.[key] ?? project.advancedParameterOverrides?.[asset] ?? derived ?? null, derived };
}

function fingerprint(issue, project) {
  const field = reviewField(issue, project);
  const scope = field.kind === 'post'
    ? [project.serviceGrade, project.gatehouses, ...['mainEntrances', 'secondaryEntrances', 'monitorPosts', 'monitorStaff', 'securityDailyHours', 'mainDayHours', 'mainNightHours', 'securityLeaders', 'outdoorPatrolMinutes', 'indoorPatrolMinutes', 'priorityPatrolMinutes'].map(k => project.workbookOverrides?.[`zhuj.${k}`] ?? null)]
    : field.kind === 'activity' ? project.serviceGrade : field.kind === 'basic' ? [project.deliveredHouseholds, project.receivedHouseholds, project.occupiedHouseholds] : field.derived;
  return JSON.stringify([issue.key, issue.kind, issue.sources, field.current ?? null, scope ?? null]);
}

function resolved(issue, project) {
  const field = reviewField(issue, project);
  if (issue.kind === 'missing') return typeof field.current === 'string' ? !!field.current.trim() : validNumber(field.current, field);
  const r = issue.resolution;
  // “Covered by existing posts” is a classification decision. Changing grade,
  // entrance counts or another post's extra staffing does not undo it.
  // Accept the same source evidence in older saved fingerprints as well.
  if (r?.decision === 'covered' && field.kind === 'post') {
    try {
      const saved = JSON.parse(r.fingerprint);
      return JSON.stringify(saved.slice(0, 3)) === JSON.stringify([issue.key, issue.kind, issue.sources]);
    } catch { return false; }
  }
  if (!r || r.fingerprint !== fingerprint(issue, project)) return false;
  if (field.kind === 'post') return r.decision === 'covered' || (r.decision === 'extra' && validNumber(field.current, field) && r.value === field.current);
  if (field.kind === 'activity') return (r.decision === 'covered' && field.current === 0) || (r.decision === 'extra' && validNumber(field.current, field) && r.value === field.current);
  if (field.kind === 'unsupported') return issue.kind === 'unmatched' && r.decision === 'ignore';
  return r.decision === 'value' && r.value === field.current && (typeof field.current === 'string' ? !!field.current.trim() : validNumber(field.current, field));
}

export function unresolvedImportIssues(project) {
  return (project.importReviewIssues ?? []).filter(issue => !resolved(issue, project));
}

export function resolveImportIssue(project, issueKey, decision, value) {
  const issue = project.importReviewIssues?.find(i => i.key === issueKey);
  if (!issue) throw new Error('未找到待核对项');
  const field = reviewField(issue, project);
  let next = { ...project, workbookOverrides: { ...project.workbookOverrides } };
  if (field.kind === 'activity' && decision === 'covered') value = 0;
  const writing = (['number', 'basic'].includes(field.kind) && decision === 'value') || (['activity', 'post'].includes(field.kind) && decision === 'extra') || (field.kind === 'activity' && decision === 'covered');
  if (writing) {
    if (!(field.kind === 'basic' && typeof value === 'string' && ['text', 'grade'].includes(field.type)) && !validNumber(value, field)) throw new Error(field.integer ? '请填写非负整数' : '请填写有效的非负数');
    if (field.kind === 'basic') {
      const match = field.key.match(/^buildings\[(\d+)\]\.(\w+)$/);
      if (match) next.buildings = project.buildings.map((b, i) => i === Number(match[1]) ? { ...b, [match[2]]: value } : b);
      else next[field.key] = value;
    } else next.workbookOverrides[field.key] = value;
  }
  const resolution = { decision, value: writing ? value : undefined, fingerprint: fingerprint(issue, next) };
  if (!resolved({ ...issue, resolution }, next)) throw new Error('请先填写并核实对应参数');
  next.importReviewIssues = project.importReviewIssues.map(i => i.key === issueKey ? { ...i, resolution } : i);
  return next;
}
