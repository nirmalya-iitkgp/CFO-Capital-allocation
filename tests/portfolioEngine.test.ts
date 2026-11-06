import assert from 'node:assert/strict';
import test from 'node:test';
import { PORTFOLIO_PRESETS } from '../src/data/presets';
import {
  computeUnitScores,
  getCellPosture,
  rebalanceHorizonTargets,
  runPortfolioSimulation,
  scoresToCell,
} from '../src/engine/portfolioEngine';
import {
  clampNumber,
  exportPortfolioCsv,
  parsePortfolioCsv,
  safeParsePortfolioJson,
  sanitizeCsvCell,
  sanitizeText,
} from '../src/utils/security';

test('Blue-Pill: GE-McKinsey scoring places high-growth high-margin leader in Invest / Grow', () => {
  const leader = PORTFOLIO_PRESETS[0].units[0]; // Core Ledger Cloud (H1 cash cow)
  const scores = computeUnitScores(leader);
  assert.ok(scores.industryAttractiveness >= 55);
  assert.ok(scores.competitiveStrength >= 66);
  const cell = scoresToCell(scores.industryAttractiveness, scores.competitiveStrength);
  const posture = getCellPosture(cell);
  assert.equal(posture, 'Invest / Grow');

  const highGrowth = PORTFOLIO_PRESETS[0].units[3]; // Cross-Border FX Engine (31% growth)
  const highScores = computeUnitScores(highGrowth);
  assert.ok(highScores.industryAttractiveness >= 66);
});

test('Blue-Pill: McKinsey Three Horizons rebalancing always sums to 100%', () => {
  const initial = { h1: 55, h2: 30, h3: 15 };
  const afterH1 = rebalanceHorizonTargets('H1', 70, initial);
  assert.equal(afterH1.h1 + afterH1.h2 + afterH1.h3, 100);
  assert.equal(afterH1.h1, 70);

  const afterH3 = rebalanceHorizonTargets('H3', 40, afterH1);
  assert.equal(afterH3.h1 + afterH3.h2 + afterH3.h3, 100);
  assert.equal(afterH3.h3, 40);
});

test('Blue-Pill: Portfolio simulation conserves total capital pool and computes 3-year ROI', () => {
  const preset = PORTFOLIO_PRESETS[0];
  const result = runPortfolioSimulation(preset.units, preset.params);

  const sumSimCapital = result.units.reduce((acc, u) => acc + u.simulatedCapital, 0);
  assert.ok(Math.abs(sumSimCapital - preset.params.totalCapitalPool) < 0.2);
  assert.equal(result.projections.length, 4);
  assert.ok(result.summary.simulated3YrRoi > 0);
  assert.equal(result.waterfall[0].type, 'baseline');
  assert.equal(result.waterfall[result.waterfall.length - 1].type, 'total');
});

test('Red-Pill Security: CSV formula injection is neutralized on export and stripped on import', () => {
  const maliciousName = '=CMD|"/C calc"!A0';
  const exported = sanitizeCsvCell(maliciousName);
  assert.ok(exported.startsWith('"\'=CMD'));

  const simpleFormula = sanitizeCsvCell('=SUM(A1:A5)');
  assert.ok(simpleFormula.startsWith("'=SUM"));

  const csvPayload = [
    'ID,Product Line,Horizon,Revenue,Growth,Share,Margin,Capital',
    'u1,=SUM(1+1),H1,100,20,25,70,30',
    'u2,+malicious,H2,50,15,10,60,15',
  ].join('\n');

  const parsed = parsePortfolioCsv(csvPayload);
  assert.equal(parsed.ok, true);
  if (parsed.ok) {
    assert.equal(parsed.units[0].name, 'SUM(1+1)');
    assert.equal(parsed.units[1].name, 'malicious');
  }
});

test('Red-Pill Security: JSON parser blocks prototype pollution and clamps out-of-bounds numbers', () => {
  const hostileJson = JSON.stringify({
    __proto__: { polluted: true },
    params: {
      totalCapitalPool: 999999999,
      waccRate: -50,
      horizonTargets: { h1: 50, h2: 30, h3: 20 },
      reinvestmentEfficiency: 99,
    },
    units: [
      {
        id: 'u-1',
        name: '<script>alert("xss")</script>Core Unit',
        horizon: 'INVALID_HORIZON',
        revenue: 'NaN',
        growthRate: 5000,
        marketShare: -10,
        grossMargin: 120,
        currentCapital: Infinity,
      },
    ],
  });

  const res = safeParsePortfolioJson(hostileJson);
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(({} as Record<string, unknown>).polluted, undefined);
    assert.equal(res.params.totalCapitalPool, 50000);
    assert.equal(res.params.waccRate, 3);
    assert.equal(res.params.reinvestmentEfficiency, 1.4);
    assert.equal(res.units[0].name, 'alert("xss")Core Unit');
    assert.equal(res.units[0].horizon, 'H1');
    assert.equal(res.units[0].growthRate, 200);
    assert.equal(res.units[0].marketShare, 0.5);
    assert.equal(res.units[0].grossMargin, 95);
  }
});

test('Red-Pill Security: sanitizeText and clampNumber handle adversarial inputs safely', () => {
  assert.equal(sanitizeText('<b>Bold</b>\u0000Text'), 'BoldText');
  assert.equal(sanitizeText('   '), 'Untitled Unit');
  assert.equal(clampNumber(Number.NaN, 0, 100, 42), 42);
  assert.equal(clampNumber(Number.POSITIVE_INFINITY, 0, 100, 42), 42);
  assert.equal(clampNumber(-999, 0, 100, 42), 0);
});

import {
  computeDupontAnalysis,
  DEFAULT_DUPONT_PARAMS,
} from '../src/engine/dupontEngine';

test('Blue-Pill: 5-Step DuPont Identity product equals exact ROE and computes EVA', () => {
  const res = computeDupontAnalysis(DEFAULT_DUPONT_PARAMS, 10.5);
  const productRoe =
    res.taxBurden *
    res.interestBurden *
    (res.ebitMarginPct / 100) *
    res.assetTurnover *
    res.equityMultiplier *
    100;
  assert.ok(Math.abs(productRoe - res.roePct) < 0.05);
  assert.ok(res.roePct > 20);
  assert.ok(res.eva > 0);
  assert.equal(res.sensitivities.length, 5);
});

test('Red-Pill Security: DuPont engine clamps extreme leverage and negative/NaN inputs', () => {
  const res = computeDupontAnalysis(
    {
      revenue: Number.NaN,
      ebitMargin: 999,
      taxRate: -50,
      costOfDebt: Infinity,
      assetTurnover: 0,
      equityMultiplier: 100,
    },
    -10
  );
  assert.equal(res.ebitMarginPct, 75);
  assert.equal(res.assetTurnover, 0.1);
  assert.equal(res.equityMultiplier, 8);
  assert.ok(Number.isFinite(res.roePct));
  assert.ok(Number.isFinite(res.eva));
});

