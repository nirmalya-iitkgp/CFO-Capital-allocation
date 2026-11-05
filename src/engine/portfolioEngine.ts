import {
  HorizonBreakdownItem,
  HorizonTargets,
  HorizonType,
  MatrixCellCoord,
  MatrixPosture,
  PortfolioSimulationResult,
  PortfolioSummary,
  PositionedUnit,
  ProductUnit,
  SimulationParams,
  WaterfallStep,
  YearlyProjection,
} from '../types/portfolio';

/**
 * Computes Industry Attractiveness (0-100) and Competitive Strength (0-100)
 * from unit financial metrics.
 */
export function computeUnitScores(unit: ProductUnit): {
  industryAttractiveness: number;
  competitiveStrength: number;
} {
  // Growth normalized from [-10%, 50%] -> [0, 100]
  const growthNorm = Math.min(100, Math.max(0, ((unit.growthRate + 10) / 60) * 100));
  // Margin normalized from [15%, 85%] -> [0, 100]
  const marginNorm = Math.min(100, Math.max(0, ((unit.grossMargin - 15) / 70) * 100));
  // Market share normalized from [0%, 45%] -> [0, 100]
  const shareNorm = Math.min(100, Math.max(0, (unit.marketShare / 45) * 100));

  const industryAttractiveness = Math.round(growthNorm * 0.62 + marginNorm * 0.38);
  const competitiveStrength = Math.round(shareNorm * 0.58 + marginNorm * 0.42);

  return { industryAttractiveness, competitiveStrength };
}

/**
 * Maps Attractiveness & Strength scores to a 3x3 GE-McKinsey grid coordinate.
 * Row 0 = High Attractiveness, Row 2 = Low Attractiveness
 * Col 0 = Low Strength, Col 2 = High Strength
 */
export function scoresToCell(
  industryAttractiveness: number,
  competitiveStrength: number
): MatrixCellCoord {
  const row: 0 | 1 | 2 =
    industryAttractiveness >= 66 ? 0 : industryAttractiveness >= 36 ? 1 : 2;
  const col: 0 | 1 | 2 =
    competitiveStrength >= 66 ? 2 : competitiveStrength >= 36 ? 1 : 0;
  return { row, col };
}

/**
 * Returns the GE-McKinsey strategic posture for a given 3x3 cell.
 */
export function getCellPosture(cell: MatrixCellCoord): MatrixPosture {
  const strengthScore = cell.col; // 0=Low, 1=Med, 2=High
  const attractivenessScore = 2 - cell.row; // 0=Low, 1=Med, 2=High
  const combined = strengthScore + attractivenessScore;

  if (combined >= 3) return 'Invest / Grow';
  if (combined === 2) return 'Selectivity / Earnings';
  return 'Harvest / Divest';
}

function getPostureMultiplier(posture: MatrixPosture): number {
  switch (posture) {
    case 'Invest / Grow':
      return 1.65;
    case 'Selectivity / Earnings':
      return 1.0;
    case 'Harvest / Divest':
      return 0.42;
  }
}

/**
 * Rebalances Horizon 1, 2, 3 target percentages so they always sum to 100%.
 */
export function rebalanceHorizonTargets(
  changed: HorizonType,
  newValue: number,
  current: HorizonTargets
): HorizonTargets {
  const clamped = Math.min(100, Math.max(0, Math.round(newValue)));
  const remaining = 100 - clamped;

  if (changed === 'H1') {
    const otherSum = current.h2 + current.h3;
    const h2 =
      otherSum > 0 ? Math.round((current.h2 / otherSum) * remaining) : Math.round(remaining / 2);
    const h3 = remaining - h2;
    return { h1: clamped, h2, h3 };
  }

  if (changed === 'H2') {
    const otherSum = current.h1 + current.h3;
    const h1 =
      otherSum > 0 ? Math.round((current.h1 / otherSum) * remaining) : Math.round(remaining / 2);
    const h3 = remaining - h1;
    return { h1, h2: clamped, h3 };
  }

  const otherSum = current.h1 + current.h2;
  const h1 =
    otherSum > 0 ? Math.round((current.h1 / otherSum) * remaining) : Math.round(remaining / 2);
  const h2 = remaining - h1;
  return { h1, h2, h3: clamped };
}

/**
 * Runs the full deterministic portfolio optimization, capital waterfall,
 * and 3-year ROI trajectory simulation.
 */
export function runPortfolioSimulation(
  units: ProductUnit[],
  params: SimulationParams
): PortfolioSimulationResult {
  const horizonTargetMap: Record<HorizonType, number> = {
    H1: params.horizonTargets.h1 / 100,
    H2: params.horizonTargets.h2 / 100,
    H3: params.horizonTargets.h3 / 100,
  };

  // 1. Score & position every unit
  const prelim = units.map((unit) => {
    const { industryAttractiveness, competitiveStrength } = computeUnitScores(unit);
    const autoCell = scoresToCell(industryAttractiveness, competitiveStrength);
    const activeCell = unit.manualCellOverride ?? autoCell;
    const posture = getCellPosture(activeCell);
    const postureMult = getPostureMultiplier(posture);
    const growthFactor = Math.max(0.4, 1 + unit.growthRate / 100);
    const strategicWeight = Math.max(
      0.1,
      postureMult * Math.sqrt(unit.revenue) * growthFactor
    );

    return {
      ...unit,
      industryAttractiveness,
      competitiveStrength,
      autoCell,
      activeCell,
      posture,
      strategicWeight,
    };
  });

  // 2. Compute horizon weight totals
  const horizonWeightSums: Record<HorizonType, number> = { H1: 0, H2: 0, H3: 0 };
  for (const u of prelim) {
    horizonWeightSums[u.horizon] += u.strategicWeight;
  }

  // If a horizon has 0 units, redistribute its target proportionally to populated horizons
  const activeHorizonSum = (['H1', 'H2', 'H3'] as HorizonType[]).reduce(
    (acc, h) => (horizonWeightSums[h] > 0 ? acc + horizonTargetMap[h] : acc),
    0
  );

  // 3. Allocate simulated capital & compute 3-year ROI per unit
  const positionedUnits: PositionedUnit[] = prelim.map((u) => {
    const effectiveHorizonShare =
      activeHorizonSum > 0
        ? horizonTargetMap[u.horizon] / activeHorizonSum
        : 1 / prelim.length;

    const horizonPool = params.totalCapitalPool * effectiveHorizonShare;
    const unitShareInHorizon =
      horizonWeightSums[u.horizon] > 0
        ? u.strategicWeight / horizonWeightSums[u.horizon]
        : 0;

    const simulatedCapital = Number((horizonPool * unitShareInHorizon).toFixed(2));
    const capitalDelta = Number((simulatedCapital - u.currentCapital).toFixed(2));

    // 3-Year ROI model: combines gross margin yield, growth compounding, posture & efficiency
    const postureYieldBoost =
      u.posture === 'Invest / Grow'
        ? 1.18
        : u.posture === 'Selectivity / Earnings'
          ? 1.0
          : 0.78;

    const baseAnnualReturn =
      (u.grossMargin * 0.28 + Math.max(-10, u.growthRate) * 0.42) *
      postureYieldBoost *
      params.reinvestmentEfficiency;

    const projected3YrRoi = Number(
      ((Math.pow(1 + Math.max(-0.25, baseAnnualReturn / 100), 3) - 1) * 100).toFixed(1)
    );
    const annualizedRoi = projected3YrRoi / 3;
    const waccSpread = Number((annualizedRoi - params.waccRate).toFixed(1));

    return {
      ...u,
      simulatedCapital,
      capitalDelta,
      projected3YrRoi,
      waccSpread,
    };
  });

  // 4. Build Capital Allocation Waterfall
  const totalCurrentCapital = Number(
    positionedUnits.reduce((acc, u) => acc + u.currentCapital, 0).toFixed(2)
  );
  const totalSimulatedCapital = Number(
    positionedUnits.reduce((acc, u) => acc + u.simulatedCapital, 0).toFixed(2)
  );

  const outflows = positionedUnits
    .filter((u) => u.capitalDelta < -0.05)
    .sort((a, b) => a.capitalDelta - b.capitalDelta);
  const inflows = positionedUnits
    .filter((u) => u.capitalDelta > 0.05)
    .sort((a, b) => b.capitalDelta - a.capitalDelta);

  const waterfall: WaterfallStep[] = [
    {
      id: 'wf-baseline',
      label: 'Current Pool',
      value: totalCurrentCapital,
      start: 0,
      end: totalCurrentCapital,
      type: 'baseline',
    },
  ];

  let running = totalCurrentCapital;
  for (const out of outflows) {
    const next = Number((running + out.capitalDelta).toFixed(2));
    waterfall.push({
      id: `wf-out-${out.id}`,
      label: out.name,
      value: out.capitalDelta,
      start: running,
      end: next,
      type: 'outflow',
      horizon: out.horizon,
    });
    running = next;
  }

  for (const inf of inflows) {
    const next = Number((running + inf.capitalDelta).toFixed(2));
    waterfall.push({
      id: `wf-in-${inf.id}`,
      label: inf.name,
      value: inf.capitalDelta,
      start: running,
      end: next,
      type: 'inflow',
      horizon: inf.horizon,
    });
    running = next;
  }

  waterfall.push({
    id: 'wf-total',
    label: 'Optimized Pool',
    value: totalSimulatedCapital,
    start: 0,
    end: totalSimulatedCapital,
    type: 'total',
  });

  // 5. Build 3-Year ROI Trajectory (Year 0 -> Year 3)
  const baselineWeightedAnnualRoi =
    totalCurrentCapital > 0
      ? positionedUnits.reduce(
          (acc, u) => acc + (u.projected3YrRoi / 3) * 0.86 * u.currentCapital,
          0
        ) / totalCurrentCapital
      : 8;

  const simulatedWeightedAnnualRoi =
    totalSimulatedCapital > 0
      ? positionedUnits.reduce(
          (acc, u) => acc + (u.projected3YrRoi / 3) * u.simulatedCapital,
          0
        ) / totalSimulatedCapital
      : 12;

  const projections: YearlyProjection[] = [0, 1, 2, 3].map((year) => {
    const baseMult = Math.pow(1 + baselineWeightedAnnualRoi / 100, year);
    const simMult = Math.pow(1 + simulatedWeightedAnnualRoi / 100, year);
    const hurdleMult = Math.pow(1 + params.waccRate / 100, year);

    return {
      year,
      label: year === 0 ? 'Year 0' : `Year ${year}`,
      baselineValue: Number((totalCurrentCapital * baseMult).toFixed(1)),
      simulatedValue: Number((totalSimulatedCapital * simMult).toFixed(1)),
      hurdleValue: Number((totalSimulatedCapital * hurdleMult).toFixed(1)),
      baselineRoi: Number(((baseMult - 1) * 100).toFixed(1)),
      simulatedRoi: Number(((simMult - 1) * 100).toFixed(1)),
    };
  });

  // 6. Portfolio Summary & Horizon Breakdown
  const totalRevenue = Number(
    positionedUnits.reduce((acc, u) => acc + u.revenue, 0).toFixed(1)
  );
  const weightedGrowth =
    totalRevenue > 0
      ? Number(
          (
            positionedUnits.reduce((acc, u) => acc + u.growthRate * u.revenue, 0) /
            totalRevenue
          ).toFixed(1)
        )
      : 0;
  const weightedMargin =
    totalRevenue > 0
      ? Number(
          (
            positionedUnits.reduce((acc, u) => acc + u.grossMargin * u.revenue, 0) /
            totalRevenue
          ).toFixed(1)
        )
      : 0;

  const horizonBreakdown: Record<HorizonType, HorizonBreakdownItem> = {
    H1: { currentCapital: 0, simulatedCapital: 0, currentPct: 0, simulatedPct: 0, unitCount: 0 },
    H2: { currentCapital: 0, simulatedCapital: 0, currentPct: 0, simulatedPct: 0, unitCount: 0 },
    H3: { currentCapital: 0, simulatedCapital: 0, currentPct: 0, simulatedPct: 0, unitCount: 0 },
  };

  for (const u of positionedUnits) {
    horizonBreakdown[u.horizon].currentCapital += u.currentCapital;
    horizonBreakdown[u.horizon].simulatedCapital += u.simulatedCapital;
    horizonBreakdown[u.horizon].unitCount += 1;
  }

  for (const h of ['H1', 'H2', 'H3'] as HorizonType[]) {
    const item = horizonBreakdown[h];
    item.currentCapital = Number(item.currentCapital.toFixed(1));
    item.simulatedCapital = Number(item.simulatedCapital.toFixed(1));
    item.currentPct =
      totalCurrentCapital > 0
        ? Number(((item.currentCapital / totalCurrentCapital) * 100).toFixed(1))
        : 0;
    item.simulatedPct =
      totalSimulatedCapital > 0
        ? Number(((item.simulatedCapital / totalSimulatedCapital) * 100).toFixed(1))
        : 0;
  }

  const baseline3YrRoi = projections[3].baselineRoi;
  const simulated3YrRoi = projections[3].simulatedRoi;
  const waccSpread = Number(
    (simulatedWeightedAnnualRoi - params.waccRate).toFixed(1)
  );

  const summary: PortfolioSummary = {
    totalRevenue,
    weightedGrowth,
    weightedMargin,
    totalCurrentCapital,
    totalSimulatedCapital,
    baseline3YrRoi,
    simulated3YrRoi,
    waccSpread,
    horizonBreakdown,
  };

  return {
    units: positionedUnits,
    waterfall,
    projections,
    summary,
  };
}
