export type ServiceGrade = 'A' | 'B' | 'C' | 'D';
export type CostBand = 'high' | 'upper' | 'standard' | 'base';

export interface BuildingTypeInput {
  buildingCount: number;
  lobbyElevatorCount: number;
  stiltFloorArea: number;
  totalFloors: number;
  standardLobbyArea: number;
  evacuationStairArea: number;
  rooftopArea: number;
}

export interface ProjectData {
  projectName: string;
  region: string;
  city: string;
  serviceGrade: ServiceGrade;
  costBand: CostBand;
  totalBuildingArea: number;
  residentialChargeArea: number;
  deliveredHouseholds: number;
  receivedHouseholds: number;
  occupiedHouseholds: number;
  perimeterEntrances: number;
  gatehouses: number;
  pavedRoadArea: number;
  greenArea: number;
  lawnRatio: number;
  seasonalFlowerArea: number;
  winterProtectionArea: number;
  buildings: BuildingTypeInput[];
  garageFloorArea: number;
  garageFloors: number;
}

export type ActionCategory = 'service' | 'cleaning' | 'greening' | 'assistance';

export interface ServiceActionResult {
  id: string;
  category: ActionCategory;
  action: string;
  property: string;
  unit?: string;
  quantity?: number | string;
  basis?: string;
  frequency?: string;
  annualFrequency?: number;
  annualHours?: number;
  headcount?: number;
  annualCost: number;
}

export interface CategorySummary {
  category: ActionCategory;
  title: string;
  actionCount: number;
  headcount: number;
  annualCost: number;
}

export interface CalculationResult {
  version: 1;
  calculatedAt: string;
  project: ProjectData;
  totalActionCount: number;
  totalHeadcount: number;
  annualCost: number;
  categories: CategorySummary[];
  actions: ServiceActionResult[];
}

export interface PresentationRecord {
  fileName: string;
  slides: number;
  generatedAt: string;
}

export interface BidDocumentRecord {
  fileName: string;
  actionCount: number;
  downloadUrl: string;
  generatedAt: string;
}

export interface ProjectRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  result: CalculationResult;
  presentation?: PresentationRecord;
  bidDocument?: BidDocumentRecord;
}

export interface CompanyProfile {
  companyName: string;
  socialCreditCode: string;
  legalRepresentative: string;
  registeredAddress: string;
  contactName: string;
  contactPhone: string;
  companyProfile: string;
}
