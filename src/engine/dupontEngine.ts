import {
  DupontAnalysisResult,
  DupontDriverSensitivity,
  DupontParams,
} from '../types/portfolio';
import { clampNumber } from '../utils/security';

export const DEFAULT_DUPONT_PARAMS: DupontParams = {
  revenue: 1222,
  ebitMargin: 24.5,
  taxRate: 21.0,
  costOfDebt: 5.5,
  assetTurnover: 1.35,
  equityMultiplier: 1.85,
};

/**
 * Computes the 5-Step DuPont ROE Decomposition, ROA, ROIC, and Economic Value Added (EVA).
 */
export function computeDupontAnalysis(
  rawParams: DupontParams,
  waccRate: number
): DupontAnalysisResult {
  const revenue = clampNumber(rawParams.revenue, 1, 100000, 1000);
  const ebitMarginPct = clampNumber(rawParams.ebitMargin, -20, 75, 22);
  const taxRate = clampNumber(rawParams.taxRate, 0, 60, 21);
  const costOfDebt = clampNumber(rawParams.costOfDebt, 0, 25, 5.5);
  const assetTurnover = clampNumber(rawParams.assetTurnover, 0.1, 10, 1.25);
  const equityMultiplier = clampNumber(rawParams.equityMultiplier, 1.0, 8.0, 1.8);
  const safeWacc = clampNumber(waccRate, 1, 30, 10.5);

  const totalAssets = Number((revenue / assetTurnover).toFixed(2));
  const shareholdersEquity = Number((totalAssets / equityMultiplier).toFixed(2));
  const totalDebt = Number(Math.max(0, totalAssets - shareholdersEquity).toFixed(2));
  const debtToEquity = Number((equityMultiplier - 1).toFixed(2));

  const ebit = Number((revenue * (ebitMarginPct / 100)).toFixed(2));
  const interestExpense = Number((totalDebt * (costOfDebt / 100)).toFixed(2));
  const ebt = Number((ebit - interestExpense).toFixed(2));
  const taxExpense = ebt > 0 ? Number((ebt * (taxRate / 100)).toFixed(2)) : 0;
  const netIncome = Number((ebt - taxExpense).toFixed(2));

  // 5-Step DuPont Identity Factors
  const taxBurden = ebt > 0 ? Number((netIncome / ebt).toFixed(4)) : 0;
  const interestBurden = ebit !== 0 ? Number((ebt / ebit).toFixed(4)) : 0;
  const ebitMarginFactor = ebitMarginPct / 100;

  const netProfitMarginPct = Number(((netIncome / revenue) * 100).toFixed(2));
  const roaPct = Number(((netIncome / totalAssets) * 100).toFixed(2));
  const roePct = Number(
    (
      taxBurden *
      interestBurden *
      ebitMarginFactor *
      assetTurnover *
      equityMultiplier *
      100
    ).toFixed(2)
  );

  // Economic Value Added (EVA) = NOPAT - (Invested Capital * WACC)
  const nopat = Number((ebit * (1 - taxRate / 100)).toFixed(2));
  const investedCapital = totalAssets; // Debt + Equity
  const roicPct = Number(((nopat / investedCapital) * 100).toFixed(2));
  const eva = Number((nopat - investedCapital * (safeWacc / 100)).toFixed(2));
  const evaSpreadPct = Number((roicPct - safeWacc).toFixed(2));

  // Compute +10% relative stress-test sensitivity for each of the 5 DuPont levers
  const calcRoeOnly = (p: DupontParams): number => {
    const assets = p.revenue / p.assetTurnover;
    const eq = assets / p.equityMultiplier;
    const debt = Math.max(0, assets - eq);
    const opInc = p.revenue * (p.ebitMargin / 100);
    const intExp = debt * (p.costOfDebt / 100);
    const preTax = opInc - intExp;
    const ni = preTax > 0 ? preTax * (1 - p.taxRate / 100) : preTax;
    return (ni / eq) * 100;
  };

  const baseRoeExact = calcRoeOnly({
    revenue,
    ebitMargin: ebitMarginPct,
    taxRate,
    costOfDebt,
    assetTurnover,
    equityMultiplier,
  });

  const sensitivities: DupontDriverSensitivity[] = [
    {
      driver: 'EBIT Margin (+10% rel)',
      currentValue: `${ebitMarginPct.toFixed(1)}%`,
      roeImpactBps: Math.round(
        (calcRoeOnly({
          revenue,
          ebitMargin: ebitMarginPct * 1.1,
          taxRate,
          costOfDebt,
          assetTurnover,
          equityMultiplier,
        }) -
          baseRoeExact) *
          100
      ),
    },
    {
      driver: 'Asset Turnover (+10% rel)',
      currentValue: `${assetTurnover.toFixed(2)}x`,
      roeImpactBps: Math.round(
        (calcRoeOnly({
          revenue,
          ebitMargin: ebitMarginPct,
          taxRate,
          costOfDebt,
          assetTurnover: assetTurnover * 1.1,
          equityMultiplier,
        }) -
          baseRoeExact) *
          100
      ),
    },
    {
      driver: 'Equity Multiplier (+10% rel)',
      currentValue: `${equityMultiplier.toFixed(2)}x`,
      roeImpactBps: Math.round(
        (calcRoeOnly({
          revenue,
          ebitMargin: ebitMarginPct,
          taxRate,
          costOfDebt,
          assetTurnover,
          equityMultiplier: equityMultiplier * 1.1,
        }) -
          baseRoeExact) *
          100
      ),
    },
    {
      driver: 'Tax Rate (-10% rel)',
      currentValue: `${taxRate.toFixed(1)}%`,
      roeImpactBps: Math.round(
        (calcRoeOnly({
          revenue,
          ebitMargin: ebitMarginPct,
          taxRate: taxRate * 0.9,
          costOfDebt,
          assetTurnover,
          equityMultiplier,
        }) -
          baseRoeExact) *
          100
      ),
    },
    {
      driver: 'Cost of Debt (-10% rel)',
      currentValue: `${costOfDebt.toFixed(1)}%`,
      roeImpactBps: Math.round(
        (calcRoeOnly({
          revenue,
          ebitMargin: ebitMarginPct,
          taxRate,
          costOfDebt: costOfDebt * 0.9,
          assetTurnover,
          equityMultiplier,
        }) -
          baseRoeExact) *
          100
      ),
    },
  ];

  return {
    taxBurden,
    interestBurden,
    ebitMarginPct,
    assetTurnover,
    equityMultiplier,
    netProfitMarginPct,
    roaPct,
    roePct,
    totalAssets,
    shareholdersEquity,
    totalDebt,
    debtToEquity,
    ebit,
    interestExpense,
    ebt,
    netIncome,
    nopat,
    roicPct,
    eva,
    evaSpreadPct,
    sensitivities,
  };
}
