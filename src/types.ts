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
  recommendedCostBand?: CostBand;
  costBandSourceVersion?: string;
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

export type RecognizedBuildingData = { [Field in keyof BuildingTypeInput]: BuildingTypeInput[Field] | null };
export type RecognizedProjectData = {
  [Field in Exclude<keyof ProjectData, 'buildings'>]: ProjectData[Field] | null;
} & { buildings: RecognizedBuildingData[] };

export type RecognitionStatus = 'recognized' | 'needs_confirmation' | 'missing' | 'derived';

export interface RecognitionEvidence {
  status: RecognitionStatus;
  confidence: number;
  source: { sheet: string; cell: string; raw: unknown } | null;
  note: string;
}

export interface ExcelRecognitionResult {
  version: 1;
  provider: string;
  model: string;
  project: RecognizedProjectData;
  recognition: {
    fields: Record<string, RecognitionEvidence>;
    buildings: Array<{ label: string; fields: Record<string, RecognitionEvidence> }>;
  };
  missingFields: string[];
  warnings: string[];
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
