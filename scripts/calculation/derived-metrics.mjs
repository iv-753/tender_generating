const total = (items, value) => items.reduce((sum, item, index) => sum + value(item, index), 0);

export function deriveMetrics(project) {
  const buildings = Array.from({ length: 5 }, (_, index) => project.buildings[index] ?? {
    buildingCount: 0,
    lobbyElevatorCount: 0,
    stiltFloorArea: 0,
    totalFloors: 0,
    standardLobbyArea: 0,
    evacuationStairArea: 0,
    rooftopArea: 0,
  });
  const entranceLawnArea = project.greenArea * project.lawnRatio * 0.25;
  const mainLawnArea = project.greenArea * project.lawnRatio - entranceLawnArea;
  const entranceGroundcoverArea = project.greenArea * (1 - project.lawnRatio) * 0.25;
  const mainGroundcoverArea = project.greenArea * (1 - project.lawnRatio) - entranceGroundcoverArea;
  const lobbyFloorArea = total(buildings, (item) => item.buildingCount * item.lobbyElevatorCount);
  const stiltFloorArea = total(buildings, (item) => item.stiltFloorArea * item.buildingCount);
  const standardLobbyFloorArea = total(buildings, (item) => item.totalFloors * item.standardLobbyArea);
  const stairFloorArea = total(buildings, (item, index) => (item.totalFloors + (index < 2 ? 5 : 0)) * item.evacuationStairArea);
  const rooftopFloorArea = total(buildings, (item) => item.rooftopArea * item.buildingCount);

  return {
    ...project,
    zero: 0,
    one: 1,
    gateWallArea: project.gatehouses * 200,
    entranceLawnArea,
    mainLawnArea,
    entranceGroundcoverArea,
    mainGroundcoverArea,
    entranceGreenArea: entranceLawnArea + entranceGroundcoverArea,
    mainGreenArea: mainLawnArea + mainGroundcoverArea,
    treeShrubCount: project.greenArea / 29,
    lobbyFloorArea,
    lobbyWallArea: lobbyFloorArea * 4.9,
    lobbyCeilingArea: lobbyFloorArea,
    stiltFloorArea,
    stiltWallArea: stiltFloorArea * 2.96,
    stiltCeilingArea: stiltFloorArea,
    standardLobbyFloorArea,
    standardLobbyWallArea: standardLobbyFloorArea * 3.615,
    standardLobbyCeilingArea: standardLobbyFloorArea,
    stairFloorArea,
    stairWallArea: stairFloorArea * 3,
    stairCeilingArea: stairFloorArea,
    rooftopFloorArea,
    rooftopWallArea: rooftopFloorArea,
    garageTotalArea: project.garageFloorArea * project.garageFloors,
  };
}
