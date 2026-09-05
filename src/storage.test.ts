// @vitest-environment jsdom
import { afterEach, describe, expect, test } from 'vitest';
import { EXAMPLE_PROJECT } from './exampleProject';
import { storage } from './storage';
import type { CalculationAdjustments, CalculationResult } from './types';

const adjustments: CalculationAdjustments = {
  version: 1,
  overrides: {
    'service-5': { annualFrequency: 400 },
    'cleaning-12': { disabled: true },
  },
  customActions: [{
    id: 'custom-service-1',
    category: 'service',
    action: '夜间客户关怀',
    property: '自定义',
    annualFrequency: 120,
    annualHours: 60,
  }],
};

function result(projectName: string, calculatedAt: string, annualCost = 481800): CalculationResult {
  return {
    version: 1,
    calculatedAt,
    project: { ...EXAMPLE_PROJECT, projectName },
    totalActionCount: 122,
    totalHeadcount: 34,
    annualCost,
    categories: [],
    actions: [],
  };
}

afterEach(() => localStorage.clear());

describe('project storage', () => {
  test('saves reusable company profile data', () => {
    const profile = {
      companyName: '安序物业', socialCreditCode: '91440000TEST', legalRepresentative: '张三',
      registeredAddress: '广东省广州市', contactName: '李经理', contactPhone: '13800000000', companyProfile: '专注住宅物业服务。',
    };
    storage.saveCompanyProfile(profile);
    expect(storage.loadCompanyProfile()).toEqual(profile);
  });

  test('creates a project record and updates the same active project after recalculation', () => {
    const first = storage.saveCalculatedProject(result('滨江花园', '2026-09-03T08:00:00.000Z'));
    const updated = storage.saveCalculatedProject(result('滨江花园二期', '2026-09-03T09:00:00.000Z', 520000));

    expect(updated.id).toBe(first.id);
    expect(storage.loadProjects()).toHaveLength(1);
    expect(storage.loadProjects()[0].result.project.projectName).toBe('滨江花园二期');
    expect(storage.loadProjects()[0].result.annualCost).toBe(520000);
  });

  test('starts a separate project only after clearing the active project', () => {
    storage.saveCalculatedProject(result('项目一', '2026-09-03T08:00:00.000Z'));
    storage.startNewProject();
    storage.saveCalculatedProject(result('项目二', '2026-09-03T09:00:00.000Z'));

    expect(storage.loadProjects().map((item) => item.result.project.projectName)).toEqual(['项目二', '项目一']);
  });

  test('selects and duplicates a saved project without changing the original', () => {
    const original = storage.saveCalculatedProject(result('湖畔家园', '2026-09-03T08:00:00.000Z'));
    const copy = storage.duplicateProject(original.id);

    expect(copy?.id).not.toBe(original.id);
    expect(copy?.result.project.projectName).toBe('湖畔家园（副本）');
    expect(storage.selectProject(original.id)).toBe(true);
    expect(storage.loadDraft()?.projectName).toBe('湖畔家园');
    expect(storage.loadResult()?.project.projectName).toBe('湖畔家园');
  });

  test('records presentation generation metadata without storing the file itself', () => {
    const project = storage.saveCalculatedProject(result('云山府', '2026-09-03T08:00:00.000Z'));
    storage.markPresentationGenerated(project.id, {
      fileName: '云山府-路演方案.pptx',
      slides: 24,
      generatedAt: '2026-09-03T10:00:00.000Z',
    });

    expect(storage.loadProjects()[0].presentation).toEqual({
      fileName: '云山府-路演方案.pptx',
      slides: 24,
      generatedAt: '2026-09-03T10:00:00.000Z',
    });
  });

  test('records bid document generation metadata', () => {
    const project = storage.saveCalculatedProject(result('云山府', '2026-09-03T08:00:00.000Z'));
    storage.markBidDocumentGenerated(project.id, {
      fileName: '云山府-投标标书.docx', actionCount: 108,
      downloadUrl: '/api/bid/jobs/job-1/download', generatedAt: '2026-09-03T10:00:00.000Z',
    });
    expect(storage.loadProjects()[0].bidDocument?.fileName).toBe('云山府-投标标书.docx');
  });

  test('deletes a project and clears the active result when that project is open', () => {
    const project = storage.saveCalculatedProject(result('待删除项目', '2026-09-03T08:00:00.000Z'));

    expect(storage.deleteProject(project.id)).toBe(true);
    expect(storage.loadProjects()).toEqual([]);
    expect(storage.loadDraft()).toBeNull();
    expect(storage.loadResult()).toBeNull();
    expect(storage.getActiveProjectId()).toBeNull();
  });
});
