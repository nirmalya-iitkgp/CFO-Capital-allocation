export type HorizonType = 'H1' | 'H2' | 'H3';

export type MatrixPosture =
  | 'Invest / Grow'
  | 'Selectivity / Earnings'
  | 'Harvest / Divest';

export interface MatrixCellCoord {
  /** 0 = High Attractiveness, 1 = Medium, 2 = Low */
  row: 0 | 1 | 2;
  /** 0 = Low Strength, 1 = Medium, 2 = High */
  col: 0 | 1 | 2;
}

export interface ProductUnit {
  id: string;
  name: string;
  horizon: HorizonType;
  /** Annual revenue in $M */
  revenue: number;
  /** YoY revenue growth rate in % */
  growthRate: number;
  /** Relative market share in % */
  marketShare: number;
  /** Gross margin in % */
  grossMargin: number;
  /** Current allocated capital in $M */
  currentCapital: number;
  /** Optional manual 9-box cell override */
  manualCellOverride: MatrixCellCoord | null;
}

export interface HorizonTargets {
  h1: number;
  h2: number;
  h3: number;
}

export interface SimulationParams {
  /** Total capital pool available for allocation in $M */
  totalCapitalPool: number;
  /** Weighted Average Cost of Capital / Hurdle Rate in % */
  waccRate: number;
  /** Target allocation percentages across H1, H2, H3 (must sum to 100) */
  horizonTargets: HorizonTargets;
  /** Capital deployment efficiency multiplier (0.7 to 1.4) */
  reinvestmentEfficiency: number;
}

export interface PositionedUnit extends ProductUnit {
  industryAttractiveness: number;
  competitiveStrength: number;
  autoCell: MatrixCellCoord;
  activeCell: MatrixCellCoord;
  posture: MatrixPosture;
  strategicWeight: number;
  simulatedCapital: number;
  capitalDelta: number;
  projected3YrRoi: number;
  waccSpread: number;
}

export interface WaterfallStep {
  id: string;
  label: string;
  value: number;
  start: number;
  end: number;
  type: 'baseline' | 'outflow' | 'inflow' | 'total';
  horizon?: HorizonType;
}

export interface YearlyProjection {
  year: number;
  label: string;
  baselineValue: number;
  simulatedValue: number;
  hurdleValue: number;
  baselineRoi: number;
  simulatedRoi: number;
}

export interface HorizonBreakdownItem {
  currentCapital: number;
  simulatedCapital: number;
  currentPct: number;
  simulatedPct: number;
  unitCount: number;
}

export interface PortfolioSummary {
  totalRevenue: number;
  weightedGrowth: number;
  weightedMargin: number;
  totalCurrentCapital: number;
  totalSimulatedCapital: number;
  baseline3YrRoi: number;
  simulated3YrRoi: number;
  waccSpread: number;
  horizonBreakdown: Record<HorizonType, HorizonBreakdownItem>;
}

export interface PortfolioSimulationResult {
  units: PositionedUnit[];
  waterfall: WaterfallStep[];
  projections: YearlyProjection[];
  summary: PortfolioSummary;
}

export interface DupontParams {
  /** Base revenue in $M (can sync with portfolio totalRevenue) */
  revenue: number;
  /** Operating margin (EBIT / Revenue) in % */
  ebitMargin: number;
  /** Effective corporate tax rate in % */
  taxRate: number;
  /** Pre-tax cost of debt in % */
  costOfDebt: number;
  /** Asset turnover (Revenue / Total Assets) in x */
  assetTurnover: number;
  /** Equity multiplier (Total Assets / Shareholders' Equity) in x */
  equityMultiplier: number;
}

export interface DupontDriverSensitivity {
  driver: string;
  currentValue: string;
  roeImpactBps: number;
}

export interface DupontAnalysisResult {
  taxBurden: number;
  interestBurden: number;
  ebitMarginPct: number;
  assetTurnover: number;
  equityMultiplier: number;
  netProfitMarginPct: number;
  roaPct: number;
  roePct: number;
  totalAssets: number;
  shareholdersEquity: number;
  totalDebt: number;
  debtToEquity: number;
  ebit: number;
  interestExpense: number;
  ebt: number;
  netIncome: number;
  nopat: number;
  roicPct: number;
  eva: number;
  evaSpreadPct: number;
  sensitivities: DupontDriverSensitivity[];
}

