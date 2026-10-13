import type { ProjectData } from '../../src/types';
export function dailyCoverageHours(raw: unknown): number | null;
export function importedSecurityRoster(project: ProjectData): { mode?: 'declared'; totals?: Record<string,number>; total?:number; gatePosts: number; gateHours: number; gatePeople: number; patrolHours: number; twoTowerAssumption: boolean; assumedPeople: boolean } | null;
