import assert from 'node:assert/strict';
import test from 'node:test';

import { deriveMetrics } from './derived-metrics.mjs';

test('derives landscape and building quantities with the workbook equations', () => {
  const project = {
    greenArea: 1000,
    lawnRatio: 0.4,
    gatehouses: 3,
    seasonalFlowerArea: 12,
    winterProtectionArea: 20,
    garageFloorArea: 500,
    garageFloors: 2,
    buildings: [
      { buildingCount: 2, lobbyElevatorCount: 10, stiltFloorArea: 20, totalFloors: 30, standardLobbyArea: 4, evacuationStairArea: 5, rooftopArea: 6 },
      { buildingCount: 3, lobbyElevatorCount: 11, stiltFloorArea: 21, totalFloors: 31, standardLobbyArea: 5, evacuationStairArea: 6, rooftopArea: 7 },
      { buildingCount: 4, lobbyElevatorCount: 12, stiltFloorArea: 22, totalFloors: 32, standardLobbyArea: 6, evacuationStairArea: 7, rooftopArea: 8 },
    ],
  };
  const metrics = deriveMetrics(project);
  assert.equal(metrics.gateWallArea, 600);
  assert.equal(metrics.entranceLawnArea, 100);
  assert.equal(metrics.mainLawnArea, 300);
  assert.equal(metrics.entranceGroundcoverArea, 150);
  assert.equal(metrics.mainGroundcoverArea, 450);
  assert.equal(metrics.entranceGreenArea, 250);
  assert.equal(metrics.mainGreenArea, 750);
  assert.equal(metrics.treeShrubCount, 1000 / 29);
  assert.equal(metrics.lobbyFloorArea, 101);
  assert.equal(metrics.lobbyWallArea, 101 * 4.9);
  assert.equal(metrics.stiltFloorArea, 191);
  assert.equal(metrics.stiltWallArea, 191 * 2.96);
  assert.equal(metrics.standardLobbyFloorArea, 467);
  assert.equal(metrics.standardLobbyWallArea, 467 * 3.615);
  assert.equal(metrics.stairFloorArea, 35 * 5 + 36 * 6 + 32 * 7);
  assert.equal(metrics.stairWallArea, metrics.stairFloorArea * 3);
  assert.equal(metrics.rooftopFloorArea, 65);
  assert.equal(metrics.rooftopWallArea, 65);
  assert.equal(metrics.garageTotalArea, 1000);
  assert.equal(metrics.buildingCount, 9);
  assert.equal(metrics.buildingEvacuationStairArea, 2 * 5 + 3 * 6 + 4 * 7);
});
