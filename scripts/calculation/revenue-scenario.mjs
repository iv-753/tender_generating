export const REVENUE_FIELDS = [
  ['commercialAnnual', '商业物业费'], ['parkingAnnual', '车位管理费'],
  ['valueAddedAnnual', '增值服务收入'], ['nonContractAnnual', '非合同收入'], ['otherAnnual', '其他收入'],
];
export function emptyRevenueScenario() {
  return { commercialAnnual: null, parkingAnnual: null, valueAddedAnnual: null, nonContractAnnual: null,
    otherAnnual: 0, currentResidentialRate: null, collectionRate: 100, targetMargin: 0,
    additionalAnnualCost: 0, sources: {}, notes: [] };
}
const valid = x => typeof x === 'number' && Number.isFinite(x) && x >= 0;

// Margin is profit / ALL project revenue, not markup on cost or residential revenue.
export function calculateRevenueScenario(annualCost, residentialArea, scenario) {
  const s = { ...emptyRevenueScenario(), ...scenario };
  const errors = REVENUE_FIELDS.filter(([key]) => !valid(s[key])).map(([, label]) => `请填写${label}年度金额，没有的填0`);
  if (!valid(annualCost)) errors.push('年度测算费用无效');
  if (!valid(residentialArea) || residentialArea === 0) errors.push('住宅收费面积必须大于0');
  if (!valid(s.additionalAnnualCost)) errors.push('请填写补充年度费用，没有新增的填0');
  if (!valid(s.collectionRate) || s.collectionRate <= 0 || s.collectionRate > 100) errors.push('住宅收缴率须大于0且不超过100%');
  if (!valid(s.targetMargin) || s.targetMargin >= 100) errors.push('目标利润率须在0%至100%之间（不含100%）');
  const empty = { errors, otherIncome: null, totalCost: null, breakEvenRate: null, targetRate: null, chargeRate: null,
    targetAnnualIncome: null, targetAnnualProfit: null, currentAnnualIncome: null, currentAnnualProfit: null, currentMargin: null };
  if (errors.length) return empty;
  const otherIncome = REVENUE_FIELDS.reduce((sum, [key]) => sum + s[key], 0);
  const totalCost = annualCost + s.additionalAnnualCost;
  const denominator = residentialArea * 12 * s.collectionRate / 100;
  const breakEvenRate = Math.max(0, (totalCost - otherIncome) / denominator);
  const targetRate = Math.max(0, (totalCost / (1 - s.targetMargin / 100) - otherIncome) / denominator);
  // Cent-level charge must not undershoot the target.
  const chargeRate = Math.ceil(targetRate * 100 - 1e-9) / 100;
  const targetAnnualIncome = chargeRate * denominator + otherIncome;
  const currentAnnualIncome = valid(s.currentResidentialRate) ? s.currentResidentialRate * denominator + otherIncome : null;
  return { errors, otherIncome, totalCost, breakEvenRate, targetRate, chargeRate, targetAnnualIncome,
    targetAnnualProfit: targetAnnualIncome - totalCost, currentAnnualIncome,
    currentAnnualProfit: currentAnnualIncome === null ? null : currentAnnualIncome - totalCost,
    currentMargin: currentAnnualIncome > 0 ? (currentAnnualIncome - totalCost) / currentAnnualIncome * 100 : null };
}
