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
  const categoryCounts = [
    ['service', 17], ['cleaning', 48], ['greening', 51], ['assistance', 6],
    ['pestControl', 7], ['engineeringOutsourced', 95], ['engineeringRoutine', 228],
  ] as const;
  const actions = categoryCounts.flatMap(([category, count]) => Array.from({ length: count }, (_, index) => ({
    id: `${category}-${index + 1}`,
    category,
    action: `${category}动作${index + 1}`,
    property: '基础',
    annualCost: 0,
    source: 'baseline' as const,
    enabled: true,
  })));
  return {
    version: 2,
    calculatedAt,
    project: { ...EXAMPLE_PROJECT, projectName, advancedParameterOverrides: { 'basement.fireShutterCount': 300 } },
    advancedParameterVersion: 'test-v2',
    advancedParameters: Array.from({ length: 90 }, (_, index) => ({
      key: `parameter-${index + 1}`,
      label: `高级参数${index + 1}`,
      group: 'basement' as const,
      unit: '项',
      defaultValue: index,
      value: index,
      source: 'template' as const,
      affectedActionIds: [],
    })),
    standardActionCount: 452,
    activeActionCount: 452,
    totalActionCount: 452,
    totalHeadcount: 34,
    annualCost,
    management: { headcount: 4, annualCost: 120000 },
    categories: categoryCounts.map(([category, actionCount]) => ({
      category,
      title: category,
      actionCount,
      headcount: category === 'service' ? 30 : 0,
      annualCost: category === 'service' ? annualCost - 120000 : 0,
    })),
    actions,
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

  test('preserves V2 advanced overrides and the complete result when saving and loading', () => {
    const complete = result('完整项目', '2026-09-03T08:00:00.000Z');
    storage.saveCalculatedProject(complete);

    expect(storage.loadDraft()?.advancedParameterOverrides).toEqual({ 'basement.fireShutterCount': 300 });
    const loaded = storage.loadResult();
    expect(loaded?.version).toBe(2);
    expect(loaded?.actions).toHaveLength(452);
    expect(loaded?.version === 2 ? loaded.advancedParameters : []).toHaveLength(90);
  });

  test('starting a new project only clears active project state and keeps company, template, and asset data', () => {
    const profile = {
      companyName: '安序物业', socialCreditCode: '91440000TEST', legalRepresentative: '张三',
      registeredAddress: '广东省广州市', contactName: '李经理', contactPhone: '13800000000', companyProfile: '专注住宅物业服务。',
    };
    storage.saveCompanyProfile(profile);
    localStorage.setItem('property-calculator:templates:v1', 'template-data');
    localStorage.setItem('property-calculator:assets:v1', 'asset-data');
    storage.saveCalculatedProject(result('活动项目', '2026-09-03T08:00:00.000Z'));

    storage.startNewProject();

    expect(storage.getActiveProjectId()).toBeNull();
    expect(storage.loadDraft()).toBeNull();
    expect(storage.loadResult()).toBeNull();
    expect(storage.loadCompanyProfile()).toEqual(profile);
    expect(localStorage.getItem('property-calculator:templates:v1')).toBe('template-data');
    expect(localStorage.getItem('property-calculator:assets:v1')).toBe('asset-data');
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

  test('saves adjusted result and adjustment record on the active project', () => {
    const project = storage.saveCalculatedProject(result('湖畔家园', '2026-09-03T08:00:00.000Z'));
    storage.saveProjectAdjustments(project.id, adjustments, result('湖畔家园', '2026-09-03T09:00:00.000Z', 420000));

    expect(storage.loadActiveProject()?.adjustments).toEqual(adjustments);
    expect(storage.loadActiveAdjustments()).toEqual(adjustments);
    expect(storage.loadResult()?.annualCost).toBe(420000);
  });

  test('clears adjustments and restores the supplied baseline result', () => {
    const project = storage.saveCalculatedProject(result('湖畔家园', '2026-09-03T08:00:00.000Z'));
    storage.saveProjectAdjustments(project.id, adjustments, result('湖畔家园', '2026-09-03T09:00:00.000Z', 420000));
    storage.clearProjectAdjustments(project.id, result('湖畔家园', '2026-09-03T10:00:00.000Z', 481800));

    expect(storage.loadActiveProject()?.adjustments).toBeUndefined();
    expect(storage.loadResult()?.annualCost).toBe(481800);
  });

  test('duplicates adjustments without sharing object references', () => {
    const project = storage.saveCalculatedProject(result('湖畔家园', '2026-09-03T08:00:00.000Z'));
    storage.saveProjectAdjustments(project.id, adjustments, result('湖畔家园', '2026-09-03T09:00:00.000Z'));
    const copy = storage.duplicateProject(project.id)!;

    expect(copy.adjustments).toEqual(adjustments);
    expect(copy.adjustments).not.toBe(storage.loadProjects().find((item) => item.id === project.id)?.adjustments);
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
