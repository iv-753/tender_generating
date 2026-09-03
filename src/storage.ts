import type { CalculationResult, CompanyProfile, PresentationRecord, ProjectData, ProjectRecord } from './types';

const DRAFT_KEY = 'property-calculator:draft:v1';
const RESULT_KEY = 'property-calculator:result:v1';
const PROJECTS_KEY = 'property-calculator:projects:v1';
const ACTIVE_PROJECT_KEY = 'property-calculator:active-project:v1';
const COMPANY_PROFILE_KEY = 'property-calculator:company-profile:v1';

interface StoredValue<T> {
  version: 1;
  data: T;
}

function load<T>(key: string): T | null {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? 'null') as StoredValue<T> | null;
    return value?.version === 1 ? value.data : null;
  } catch {
    return null;
  }
}

function save<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify({ version: 1, data } satisfies StoredValue<T>));
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `project-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadStoredProjects() {
  return load<ProjectRecord[]>(PROJECTS_KEY) ?? [];
}

function saveProjects(projects: ProjectRecord[]) {
  save(PROJECTS_KEY, projects);
}

function sortProjects(projects: ProjectRecord[]) {
  return [...projects].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function activate(record: ProjectRecord) {
  localStorage.setItem(ACTIVE_PROJECT_KEY, record.id);
  save(DRAFT_KEY, record.result.project);
  save(RESULT_KEY, record.result);
}

function saveCalculatedProject(result: CalculationResult) {
  const projects = loadStoredProjects();
  const activeId = localStorage.getItem(ACTIVE_PROJECT_KEY);
  const active = projects.find((item) => item.id === activeId);
  const record: ProjectRecord = active
    ? { ...active, updatedAt: result.calculatedAt, result }
    : { id: makeId(), createdAt: result.calculatedAt, updatedAt: result.calculatedAt, result };
  const next = active
    ? projects.map((item) => item.id === active.id ? record : item)
    : [record, ...projects];
  saveProjects(sortProjects(next));
  activate(record);
  return record;
}

function loadProjects() {
  const projects = loadStoredProjects();
  if (projects.length) return sortProjects(projects);

  const legacyResult = load<CalculationResult>(RESULT_KEY);
  if (!legacyResult) return [];
  const record: ProjectRecord = {
    id: makeId(),
    createdAt: legacyResult.calculatedAt,
    updatedAt: legacyResult.calculatedAt,
    result: legacyResult,
  };
  saveProjects([record]);
  activate(record);
  return [record];
}

export const storage = {
  loadDraft: () => load<ProjectData>(DRAFT_KEY),
  saveDraft: (data: ProjectData) => save(DRAFT_KEY, data),
  loadResult: () => load<CalculationResult>(RESULT_KEY),
  saveResult: (data: CalculationResult) => save(RESULT_KEY, data),
  loadProjects,
  loadActiveProject: () => {
    const activeId = localStorage.getItem(ACTIVE_PROJECT_KEY);
    return loadProjects().find((item) => item.id === activeId) ?? null;
  },
  loadCompanyProfile: () => load<CompanyProfile>(COMPANY_PROFILE_KEY),
  saveCompanyProfile: (data: CompanyProfile) => save(COMPANY_PROFILE_KEY, data),
  saveCalculatedProject,
  getActiveProjectId: () => localStorage.getItem(ACTIVE_PROJECT_KEY),
  startNewProject: () => {
    localStorage.removeItem(ACTIVE_PROJECT_KEY);
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(RESULT_KEY);
  },
  selectProject: (id: string) => {
    const record = loadProjects().find((item) => item.id === id);
    if (!record) return false;
    activate(record);
    return true;
  },
  duplicateProject: (id: string) => {
    const projects = loadProjects();
    const source = projects.find((item) => item.id === id);
    if (!source) return null;
    const now = new Date().toISOString();
    const copy: ProjectRecord = {
      id: makeId(),
      createdAt: now,
      updatedAt: now,
      result: {
        ...structuredClone(source.result),
        calculatedAt: now,
        project: {
          ...structuredClone(source.result.project),
          projectName: `${source.result.project.projectName}（副本）`,
        },
      },
    };
    saveProjects(sortProjects([copy, ...projects]));
    return copy;
  },
  markPresentationGenerated: (id: string, presentation: PresentationRecord) => {
    const projects = loadProjects();
    saveProjects(projects.map((item) => item.id === id ? { ...item, presentation } : item));
  },
  deleteProject: (id: string) => {
    const projects = loadStoredProjects();
    if (!projects.some((item) => item.id === id)) return false;
    saveProjects(projects.filter((item) => item.id !== id));
    if (localStorage.getItem(ACTIVE_PROJECT_KEY) === id) {
      localStorage.removeItem(ACTIVE_PROJECT_KEY);
      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(RESULT_KEY);
    }
    return true;
  },
};
