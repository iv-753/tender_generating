import type { RevenueScenario } from '../../src/types';
export const REVENUE_FIELDS: Array<[keyof Pick<RevenueScenario, 'commercialAnnual' | 'parkingAnnual' | 'valueAddedAnnual' | 'nonContractAnnual' | 'otherAnnual'>, string]>;
export function emptyRevenueScenario(): RevenueScenario;
export function calculateRevenueScenario(annualCost: number, residentialArea: number, scenario: RevenueScenario): {
  errors: string[]; otherIncome: number | null; totalCost: number | null; breakEvenRate: number | null;
  targetRate: number | null; chargeRate: number | null; targetAnnualIncome: number | null; targetAnnualProfit: number | null;
  currentAnnualIncome: number | null; currentAnnualProfit: number | null; currentMargin: number | null;
};
