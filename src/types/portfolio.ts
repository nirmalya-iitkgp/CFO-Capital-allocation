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
