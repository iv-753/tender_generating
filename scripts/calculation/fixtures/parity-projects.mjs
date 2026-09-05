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
  { ...base, projectName: 'C级完整模型示例' },
  { ...base, projectName: 'A级完整模型示例', serviceGrade: 'A' },
  { ...base, projectName: 'B级完整模型示例', serviceGrade: 'B' },
  { ...base, projectName: 'D级完整模型示例', serviceGrade: 'D' },
];
