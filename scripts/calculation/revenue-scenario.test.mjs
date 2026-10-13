import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRevenueScenario, emptyRevenueScenario } from './revenue-scenario.mjs';

const scenario = () => ({ ...emptyRevenueScenario(), commercialAnnual: 595170, parkingAnnual: 0, valueAddedAnnual: 275720, nonContractAnnual: 36080, currentResidentialRate: 2.4 });
test('total-revenue margin reconciles annual income, costs and profit, without changing service costs', () => {
  const input = scenario();
  const result = calculateRevenueScenario(2118947, 43339.375, input);
  assert.equal(result.otherIncome, 906970);
  assert.equal(result.currentAnnualIncome, 2155144);
  assert.equal(result.currentAnnualProfit, 36197);
  assert.ok(Math.abs(result.breakEvenRate - 2.3304) < 1e-6);
  for (const margin of [0, 10, 15]) {
    const r = calculateRevenueScenario(2118947, 43339.375, { ...input, targetMargin: margin });
    const income = r.targetRate * 43339.375 * 12 + 906970;
    assert.ok(Math.abs((income - 2118947) / income - margin / 100) < 1e-12);
    assert.ok(r.chargeRate >= r.targetRate && r.chargeRate - r.targetRate < 0.010001);
  }
  assert.equal(input.targetMargin, 0);
});
test('collection rate and additional costs affect required price; surplus income floors price at zero', () => {
  const base = calculateRevenueScenario(2118947, 43339.375, scenario());
  const low = calculateRevenueScenario(2118947, 43339.375, { ...scenario(), collectionRate: 90 });
  assert.ok(Math.abs(low.breakEvenRate * 0.9 - base.breakEvenRate) < 1e-10);
  assert.equal(calculateRevenueScenario(100, 100, scenario()).targetRate, 0);
  assert.equal(calculateRevenueScenario(2118947, 43339.375, { ...scenario(), additionalAnnualCost: 100 }).totalCost, 2119047);
});
test('missing, zero area, negative and invalid percentages do not produce a misleading price', () => {
  for (const change of [{ commercialAnnual: null }, { commercialAnnual: -1 }, { collectionRate: 0 }, { collectionRate: 101 }, { targetMargin: 100 }, { targetMargin: NaN }]) {
    assert.equal(calculateRevenueScenario(100, 100, { ...scenario(), ...change }).targetRate, null);
  }
  assert.equal(calculateRevenueScenario(100, 0, scenario()).targetRate, null);
  assert.equal(calculateRevenueScenario(NaN, 100, scenario()).targetRate, null);
  assert.equal(calculateRevenueScenario(100, 100, { ...scenario(), currentResidentialRate: null }).currentAnnualProfit, null);
});
