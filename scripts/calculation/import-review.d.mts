import type { ProjectData, ImportReviewIssue } from '../../src/types';
export type ReviewDecision = 'value' | 'covered' | 'extra' | 'ignore';
export function unresolvedImportIssues(project: ProjectData): ImportReviewIssue[];
export function resolveImportIssue(project: ProjectData, key: string, decision: ReviewDecision, value?: number | string): ProjectData;
export function reviewField(issue: ImportReviewIssue, project: ProjectData): {
  kind: 'number' | 'basic' | 'post' | 'activity' | 'unsupported' | 'coverage';
  key: string; unit: string; integer?: boolean; max?: number;
  current: number | string | null | undefined; derived?: number;
};

export function reviewChangeReason(issue: ImportReviewIssue, project: ProjectData): string;
export function reuseImportReview(previous: ProjectData, incoming: ProjectData): ProjectData;
export function reviewEvidence(issue: ImportReviewIssue): string;
