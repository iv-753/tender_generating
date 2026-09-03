import type { CalculationResult, ProjectData } from './types';

const DRAFT_KEY = 'property-calculator:draft:v1';
const RESULT_KEY = 'property-calculator:result:v1';

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

export const storage = {
  loadDraft: () => load<ProjectData>(DRAFT_KEY),
  saveDraft: (data: ProjectData) => save(DRAFT_KEY, data),
  loadResult: () => load<CalculationResult>(RESULT_KEY),
  saveResult: (data: CalculationResult) => save(RESULT_KEY, data),
};
