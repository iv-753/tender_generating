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
  advancedParameterOverrides?: Record<string, number>;
}

export type RecognizedBuildingData = { [Field in keyof BuildingTypeInput]: BuildingTypeInput[Field] | null };
export type RecognizedProjectData = {
  [Field in Exclude<keyof ProjectData, 'buildings' | 'advancedParameterOverrides'>]: ProjectData[Field] | null;
} & {
  buildings: RecognizedBuildingData[];
  advancedParameterOverrides?: Record<string, number> | null;
};

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

export type ActionCategory =
  | 'service'
  | 'cleaning'
  | 'greening'
  | 'assistance'
  | 'pestControl'
  | 'engineeringOutsourced'
  | 'engineeringRoutine';

export type AdvancedParameterGroup = 'basement' | 'building' | 'grounds' | 'staffingCost';
export type AdvancedParameterSource = 'derived' | 'estimated' | 'template' | 'manual';

export interface AdvancedParameterSnapshot {
  key: string;
  label: string;
  group: AdvancedParameterGroup;
  unit: string;
  defaultValue: number;
  value: number;
  source: AdvancedParameterSource;
  affectedActionIds: string[];
}

export interface ManagementCostSummary {
  headcount: number;
  annualCost: number;
}

export interface ActionOverride {
  annualFrequency?: number;
  annualHours?: number;
  annualCost?: number;
  headcount?: number;
  disabled?: boolean;
}

export interface CustomActionInput {
  id: string;
  category: ActionCategory;
  action: string;
  property: string;
  basis?: string;
  frequency?: string;
  annualFrequency?: number;
  annualHours?: number;
  annualCost?: number;
  headcount?: number;
}

export interface CalculationAdjustments {
  version: 1;
  overrides: Record<string, ActionOverride>;
  customActions: CustomActionInput[];
}

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
  hoursPerFrequency?: number;
  annualHours?: number;
  headcount?: number;
  annualCost: number;
  enabled?: boolean;
  source?: 'baseline' | 'custom';
}

export interface CategorySummary {
  category: ActionCategory;
  title: string;
  actionCount: number;
  headcount: number;
  annualCost: number;
  workloadAnnualCost?: number;
  workloadEquivalentHeadcount?: number;
}

interface CalculationResultBase {
  calculatedAt: string;
  project: ProjectData;
  totalActionCount: number;
  totalHeadcount: number;
  annualCost: number;
  workloadAnnualCost?: number;
  categories: CategorySummary[];
  actions: ServiceActionResult[];
}

export interface CalculationResultV2 extends CalculationResultBase {
  version: 2;
  advancedParameterVersion: string;
  advancedParameters: AdvancedParameterSnapshot[];
  standardActionCount: 452;
  activeActionCount: number;
  management: ManagementCostSummary;
}

/** @deprecated Temporary compatibility until the calculation engine migrates to V2. */
export interface LegacyCalculationResult extends CalculationResultBase {
  version: 1;
}

export type CalculationResult = CalculationResultV2 | LegacyCalculationResult;

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
  adjustments?: CalculationAdjustments;
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
