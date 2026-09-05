const metric = (metricName, scale = 1) => ({
  type: 'metric', metric: metricName, scale, source: 'derived',
});

const estimated = (metricName, baselineMetric, templateValue) => ({
  type: 'scaled-template',
  metric: metricName,
  baselineMetric,
  templateValue,
  source: 'estimated',
});

// Hand-maintained inference metadata. Omitted parameters intentionally retain their template rule.
// Scaled relationships are limited to areas or facility densities with a clear size dependency.
export const ADVANCED_PARAMETER_DEFAULT_RULES = Object.freeze({
  'basement.fireShutterCount': estimated('garageTotalArea', 80120.54, 252),
  'basement.parkingArea': estimated('garageTotalArea', 80120.54, 62460),
  'basement.parkingSurveillanceCount': estimated('garageTotalArea', 80120.54, 48),
  'basement.lobbyAccessControlCount': estimated('buildingCount', 12, 92),
  'basement.lobbyArea': estimated('buildingCount', 12, 1368.68),
  'basement.drainageEquipmentCount': estimated('garageTotalArea', 80120.54, 58),
  'basement.lobbyEquipmentCount': estimated('buildingCount', 12, 48),

  'building.groundFloorLobbyAccessControlCount': estimated('buildingCount', 12, 12),
  'building.groundFloorLobbyArea': estimated('buildingCount', 12, 623.64),
  'building.stiltFloorArea': estimated('stiltFloorArea', 2792, 2800.7),
  'building.standardFloorArea': estimated('standardLobbyFloorArea', 15462.24, 15421.2),
  'building.roofArea': estimated('rooftopFloorArea', 5000, 4261.2),
  'building.buildingCount': metric('buildingCount'),
  'building.evacuationStairArea': estimated('buildingEvacuationStairArea', 208.96, 189.8),
  'building.elevatorCount': estimated('buildingCount', 12, 28),
  'building.refugeFloorArea': estimated('totalBuildingArea', 252480.75, 5356.72),
  'building.refugeWetAlarmRoomCount': estimated('buildingCount', 12, 8),
  'building.refugePressurizationFanRoomCount': estimated('buildingCount', 12, 16),
  'building.shaftCount': estimated('buildingCount', 12, 840),
  'building.facadeBaseArea': estimated('totalBuildingArea', 252480.75, 17589.16),
  'building.facadeStandardArea': estimated('totalBuildingArea', 252480.75, 191513.8),
  'building.facadeRoofParapetArea': estimated('totalBuildingArea', 252480.75, 2656),

  'grounds.gatedEntrancePedestrianGateCount': estimated('gatehouses', 2, 2),
  'grounds.fireWaterPointCount': estimated('greenArea', 26353, 4),
  'grounds.entranceGuardhouseArea': estimated('gatehouses', 2, 794),
  'grounds.gatedEntranceAccessGateCount': estimated('gatehouses', 2, 2),
  'grounds.entrancePlazaArea': estimated('perimeterEntrances', 500, 4858.77),
  'grounds.zoneArea': estimated('greenArea', 26353, 9820.01),
  'grounds.childrenActivityArea': estimated('greenArea', 26353, 804.14),
  'grounds.activityFacilityArea': estimated('greenArea', 26353, 942.27),
  'grounds.fitnessActivityArea': estimated('greenArea', 26353, 138.13),
  'grounds.vehicleParkingArea': estimated('pavedRoadArea', 26896, 357.5),
  'grounds.waterOutletCount': estimated('greenArea', 26353, 4),
  'grounds.roadArea': estimated('pavedRoadArea', 26896, 8576.73),
  'grounds.drainagePipelineLength': estimated('greenArea', 26353, 5649.3),
  'grounds.drainageWellCount': estimated('greenArea', 26353, 329),
  'grounds.distributionBoxCount': estimated('greenArea', 26353, 3),
});
