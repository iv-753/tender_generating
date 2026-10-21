import type { CalculationResult } from '../../src/types';
export const FLOWER_SOURCE_ID: string;
export const FLOWER_RULE_ID: string;
export function staffingBaseline(result: CalculationResult): string;
export function staffingPlanFor(result: CalculationResult): NonNullable<CalculationResult['staffingPlan']> | null;
