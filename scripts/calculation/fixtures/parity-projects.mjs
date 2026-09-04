const building = (overrides = {}) => ({
  buildingCount: 2,
  lobbyElevatorCount: 42,
  stiltFloorArea: 160,
  totalFloors: 66,
  standardLobbyArea: 31,
  evacuationStairArea: 16,
  rooftopArea: 320,
  ...overrides,
});

const base = {
  projectName: '算法对照项目',
  region: '广东省广州市增城区',
  city: '广州',
  serviceGrade: 'C',
  costBand: 'upper',
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
    building({ buildingCount: 8, lobbyElevatorCount: 53.28, stiltFloorArea: 260, totalFloors: 232, standardLobbyArea: 37.82, evacuationStairArea: 17.62, rooftopArea: 400 }),
    building({ buildingCount: 4, lobbyElevatorCount: 64, stiltFloorArea: 178, totalFloors: 152, standardLobbyArea: 44, evacuationStairArea: 17, rooftopArea: 450 }),
  ],
  garageFloorArea: 40060.27,
  garageFloors: 2,
};

export const PARITY_PROJECTS = [
  { ...base, projectName: '默认示例' },
  { ...base, projectName: 'A级高成本', serviceGrade: 'A', costBand: 'high', buildings: [building()] },
  { ...base, projectName: 'B级较高成本', serviceGrade: 'B', costBand: 'upper', lawnRatio: 0.37, buildings: Array.from({ length: 5 }, (_, index) => building({ buildingCount: index + 1, totalFloors: 40 + index * 9 })) },
  { ...base, projectName: 'C级标准成本', serviceGrade: 'C', costBand: 'standard', seasonalFlowerArea: 185, winterProtectionArea: 260 },
  { ...base, projectName: 'D级基础成本零量', serviceGrade: 'D', costBand: 'base', totalBuildingArea: 0, residentialChargeArea: 0, deliveredHouseholds: 0, receivedHouseholds: 0, occupiedHouseholds: 0, perimeterEntrances: 0, gatehouses: 0, pavedRoadArea: 0, greenArea: 0, seasonalFlowerArea: 0, winterProtectionArea: 0, buildings: [building({ buildingCount: 0, lobbyElevatorCount: 0, stiltFloorArea: 0, totalFloors: 0, standardLobbyArea: 0, evacuationStairArea: 0, rooftopArea: 0 })], garageFloorArea: 0, garageFloors: 0 },
];
