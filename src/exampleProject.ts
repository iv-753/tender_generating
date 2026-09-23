import type { ProjectData } from './types';
import exampleData from './data/zhujiang-example.json' with { type: 'json' };

export const EXAMPLE_PROJECT: ProjectData = {
  projectName: '增城示范花园',
  region: '广东省',
  city: '广州市',
  serviceGrade: 'C',
  costBand: 'upper',
  recommendedCostBand: 'high',
  costBandSourceVersion: '2025-wage-2026-09',
  totalBuildingArea: 252480.75,
  residentialChargeArea: 149904,
  deliveredHouseholds: 2256,
  receivedHouseholds: 1608,
  occupiedHouseholds: 1200,
  perimeterEntrances: 500,
  gatehouses: 2,
  pavedRoadArea: 26896,
  greenArea: 26353,
  lawnRatio: 0.5,
  seasonalFlowerArea: 0,
  winterProtectionArea: 0,
  buildings: [
    {
      buildingCount: 8,
      lobbyElevatorCount: 53.28,
      stiltFloorArea: 260,
      totalFloors: 232,
      standardLobbyArea: 37.82,
      evacuationStairArea: 17.62,
      rooftopArea: 400,
    },
    {
      buildingCount: 4,
      lobbyElevatorCount: 64,
      stiltFloorArea: 178,
      totalFloors: 152,
      standardLobbyArea: 44,
      evacuationStairArea: 17,
      rooftopArea: 450,
    },
  ],
  garageFloorArea: 40060.27,
  garageFloors: 2,
};

/** Explicit demonstration data only; the calculation engine never applies it to real projects. */
export function createZhujiangExampleProject(serviceGrade: ProjectData['serviceGrade'] = EXAMPLE_PROJECT.serviceGrade): ProjectData {
  return structuredClone({
    ...EXAMPLE_PROJECT,
    projectName: `${EXAMPLE_PROJECT.projectName}（示例）`,
    calculationModel: 'zhujiang-v1',
    district: '增城区',
    serviceGrade,
    exampleDataVersion: exampleData.version,
    workbookOverrides: { ...exampleData.workbookQuantities, ...exampleData.scenario, ...exampleData.plans[serviceGrade] },
  });
}

/** Change only untouched demo plans; preserve project edits and the grade's fixed standards. */
export function updateExampleGradePlans(overrides: Record<string, number | string>, previousGrade: ProjectData['serviceGrade'], nextGrade: ProjectData['serviceGrade']) {
  const previous: Record<string, number> = exampleData.plans[previousGrade];
  const next: Record<string, number> = exampleData.plans[nextGrade];
  const updated = { ...overrides };
  for (const key of new Set([...Object.keys(previous), ...Object.keys(next)])) {
    if (updated[key] !== previous[key]) continue;
    if (next[key] === undefined) delete updated[key];
    else updated[key] = next[key];
  }
  return updated;
}
