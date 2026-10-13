import type { ProjectData, RecognizedProjectData } from '../../src/types';
export function toBuildingTotalProject<T extends ProjectData | RecognizedProjectData>(project: T): T & { stairAreaBasis: 'per-building' };
export function toPerFloorProject(project: ProjectData): ProjectData;
