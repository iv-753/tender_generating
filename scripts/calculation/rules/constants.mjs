export const COST_BAND_FACTORS = Object.freeze({ high: 1.2, upper: 1.1, standard: 1, base: 0.9 });
export const GRADE_LABELS = Object.freeze({ A: '紫荆花', B: '金百合', C: '郁金香', D: '向日葵' });
export const GRADE_CORRECTION = Object.freeze({ A: 1.2, B: 1.1, C: 1.05, D: 1 });
export const CLEANING_DAILY_RATE = Object.freeze({ A: 4000 / 26, B: 3800 / 26, C: 3500 / 26, D: 3300 / 26 });
export const GREENING_DAILY_RATE = Object.freeze({ A: 6000 / 26, B: 5500 / 26, C: 5000 / 26, D: 4500 / 26 });
export const SERVICE_HOURLY_RATE = 30;
export const SERVICE_ANNUAL_HOURS = 2304;
export const WORKDAY_HOURS = 8;
export const WORKDAYS_PER_YEAR = 365;
export const ASSISTANCE_MONTHLY_RATE = 8000;
export const WORKBOOK_BASE_COST_BAND = 'upper';
export const FULL_MODEL_COST_FACTORS = Object.freeze({
  high: 1.2 / 1.1,
  upper: 1,
  standard: 1 / 1.1,
  base: 0.9 / 1.1,
});
export const ENGINEERING_ROUTINE_MONTHLY_RATE = 6666.66666666667;
export const ENGINEERING_OUTSOURCED_MONTHLY_RATE = 7500;
export const ENGINEERING_BUDGET_FACTOR = 1.2;
export const MANAGEMENT_BUDGET_FACTOR = 1.06;
export const ASSISTANCE_BUDGET_FACTOR = 1.06;
export const PEST_WORKDAY_RATE = 600;
export const ENGINEERING_MONTHLY_CAPACITY_HOURS = 30 * 8;
export const ENGINEERING_ANNUAL_CAPACITY_HOURS = 12 * ENGINEERING_MONTHLY_CAPACITY_HOURS;
