import React, { useMemo } from 'react';
import { RefreshCw, RotateCcw } from 'lucide-react';
import {
  computeDupontAnalysis,
  DEFAULT_DUPONT_PARAMS,
} from '../engine/dupontEngine';
import { DupontParams } from '../types/portfolio';

interface DupontWorkbenchProps {
  params: DupontParams;
  portfolioRevenue: number;
  waccRate: number;
  onChangeParams: (next: DupontParams) => void;
}

export const DupontWorkbench: React.FC<DupontWorkbenchProps> = ({
  params,
  portfolioRevenue,
  waccRate,
  onChangeParams,
}) => {
  const analysis = useMemo(
    () => computeDupontAnalysis(params, waccRate),
    [params, waccRate]
  );

  const handleSyncRevenue = () => {
    onChangeParams({
      ...params,
      revenue: Math.max(10, Math.round(portfolioRevenue)),
    });
  };

  const handleReset = () => {
    onChangeParams({
      ...DEFAULT_DUPONT_PARAMS,
      revenue: Math.max(10, Math.round(portfolioRevenue)),
    });
  };

  return (
    <section
      id="dupont-workbench"
      aria-label="Dynamic DuPont Analysis and ROE Decomposition Workbench"
      className="bg-[#1E293B] border border-[#334155] rounded-lg p-5 space-y-6"
    >
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#334155]">
        <div>
          <h2 className="font-display text-base font-semibold text-[#F8FAFC]">
            5-Step DuPont ROE Decomposition &amp; EVA Workbench
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Stress-test operating margin, asset velocity, and financial leverage against {waccRate.toFixed(1)}% WACC
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSyncRevenue}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#06B6D4] bg-[#0F172A] hover:bg-[#162032] border border-[#334155] rounded-md transition-colors whitespace-nowrap cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Sync Portfolio Revenue (${Math.round(portfolioRevenue)}M)</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] bg-[#0F172A] border border-[#334155] rounded-md transition-colors whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset Levers</span>
          </button>
        </div>
      </div>

      {/* Main 12-Column Split: Interactive DuPont Tree (7 cols) + 5-Driver Sliders (5 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive 5-Step DuPont Tree & EVA Bridge */}
        <div className="xl:col-span-7 space-y-5">
          {/* Tier 1: Top-Line Return on Equity (ROE) & EVA */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[#0F172A] border border-[#06B6D4]/60 rounded-md p-3.5">
              <div className="text-[11px] font-medium text-[#94A3B8]">
                Return on Equity (ROE)
              </div>
              <div
                className={`mt-1 font-mono-tabular text-2xl font-bold ${
                  analysis.roePct >= waccRate ? 'text-[#10B981]' : 'text-[#FB7185]'
                }`}
              >
                {analysis.roePct.toFixed(2)}%
              </div>
              <div className="mt-0.5 text-[11px] font-mono-tabular text-[#94A3B8]">
                NI ${analysis.netIncome}M / Eq ${analysis.shareholdersEquity}M
              </div>
            </div>

            <div className="bg-[#0F172A] border border-[#334155] rounded-md p-3.5">
              <div className="text-[11px] font-medium text-[#94A3B8]">
                Return on Assets (ROA)
              </div>
              <div className="mt-1 font-mono-tabular text-2xl font-semibold text-[#F8FAFC]">
                {analysis.roaPct.toFixed(2)}%
              </div>
              <div className="mt-0.5 text-[11px] font-mono-tabular text-[#94A3B8]">
                Net Margin × Asset Turnover
              </div>
            </div>

            <div className="bg-[#0F172A] border border-[#334155] rounded-md p-3.5">
              <div className="text-[11px] font-medium text-[#94A3B8]">
                Economic Value Added (EVA)
              </div>
              <div
                className={`mt-1 font-mono-tabular text-2xl font-semibold ${
                  analysis.eva >= 0 ? 'text-[#10B981]' : 'text-[#FB7185]'
                }`}
              >
                {analysis.eva >= 0 ? `+$${analysis.eva}M` : `-$${Math.abs(analysis.eva)}M`}
              </div>
              <div className="mt-0.5 text-[11px] font-mono-tabular text-[#94A3B8]">
                ROIC {analysis.roicPct.toFixed(1)}% ({analysis.evaSpreadPct >= 0 ? '+' : ''}
                {analysis.evaSpreadPct.toFixed(1)}% vs WACC)
              </div>
            </div>
          </div>

          {/* Tier 2: 3-Step DuPont Bridge (Net Margin × Asset Turnover × Equity Multiplier) */}
          <div className="bg-[#0F172A]/70 border border-[#334155] rounded-md p-4">
            <div className="text-xs font-medium text-[#94A3B8] mb-3">
              5-Step DuPont Identity Breakdown
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
              <div className="bg-[#1E293B] border border-[#334155] rounded p-2.5">
                <div className="text-[11px] text-[#94A3B8]">Tax Burden</div>
                <div className="font-mono-tabular text-base font-semibold text-[#F8FAFC] mt-1">
                  {analysis.taxBurden.toFixed(2)}x
                </div>
                <div className="text-[10px] font-mono-tabular text-[#64748B] mt-0.5">
                  NI / EBT
                </div>
              </div>

              <div className="bg-[#1E293B] border border-[#334155] rounded p-2.5">
                <div className="text-[11px] text-[#94A3B8]">Interest Burden</div>
                <div className="font-mono-tabular text-base font-semibold text-[#F8FAFC] mt-1">
                  {analysis.interestBurden.toFixed(2)}x
                </div>
                <div className="text-[10px] font-mono-tabular text-[#64748B] mt-0.5">
                  EBT / EBIT
                </div>
              </div>

              <div className="bg-[#1E293B] border border-[#334155] rounded p-2.5">
                <div className="text-[11px] text-[#94A3B8]">EBIT Margin</div>
                <div className="font-mono-tabular text-base font-semibold text-[#10B981] mt-1">
                  {analysis.ebitMarginPct.toFixed(1)}%
                </div>
                <div className="text-[10px] font-mono-tabular text-[#64748B] mt-0.5">
                  EBIT / Rev
                </div>
              </div>

              <div className="bg-[#1E293B] border border-[#334155] rounded p-2.5">
                <div className="text-[11px] text-[#94A3B8]">Asset Turnover</div>
                <div className="font-mono-tabular text-base font-semibold text-[#06B6D4] mt-1">
                  {analysis.assetTurnover.toFixed(2)}x
                </div>
                <div className="text-[10px] font-mono-tabular text-[#64748B] mt-0.5">
                  Rev / Assets
                </div>
              </div>

              <div className="bg-[#1E293B] border border-[#334155] rounded p-2.5 col-span-2 sm:col-span-1">
                <div className="text-[11px] text-[#94A3B8]">Equity Mult.</div>
                <div className="font-mono-tabular text-base font-semibold text-[#A78BFA] mt-1">
                  {analysis.equityMultiplier.toFixed(2)}x
                </div>
                <div className="text-[10px] font-mono-tabular text-[#64748B] mt-0.5">
                  D/E {analysis.debtToEquity.toFixed(2)}x
                </div>
              </div>
            </div>

            {/* Balance Sheet & Income Statement Summary Strip */}
            <div className="mt-4 pt-3 border-t border-[#334155] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono-tabular">
              <div>
                <span className="text-[#94A3B8]">EBIT: </span>
                <span className="text-[#F8FAFC] font-medium">${analysis.ebit}M</span>
              </div>
              <div>
                <span className="text-[#94A3B8]">NOPAT: </span>
                <span className="text-[#10B981] font-medium">${analysis.nopat}M</span>
              </div>
              <div>
                <span className="text-[#94A3B8]">Total Assets: </span>
                <span className="text-[#F8FAFC] font-medium">${analysis.totalAssets}M</span>
              </div>
              <div>
                <span className="text-[#94A3B8]">Total Debt: </span>
                <span className="text-[#F8FAFC] font-medium">${analysis.totalDebt}M</span>
              </div>
            </div>
          </div>

          {/* Tier 3: +10% Relative Lever Sensitivity Table */}
          <div className="bg-[#0F172A]/70 border border-[#334155] rounded-md p-4">
            <div className="text-xs font-medium text-[#94A3B8] mb-2.5">
              ROE Sensitivity (+10% Favorable Shift per Lever)
            </div>
            <div className="space-y-2">
              {analysis.sensitivities.map((s) => {
                const maxBps = Math.max(
                  100,
                  ...analysis.sensitivities.map((item) => Math.abs(item.roeImpactBps))
                );
                const widthPct = Math.min(
                  100,
                  Math.round((Math.abs(s.roeImpactBps) / maxBps) * 100)
                );
                return (
                  <div
                    key={s.driver}
                    className="grid grid-cols-[170px_1fr_80px] items-center gap-3 text-xs"
                  >
                    <span className="text-[#F8FAFC] truncate">{s.driver}</span>
                    <div className="h-2 bg-[#1E293B] rounded-xs overflow-hidden">
                      <div
                        style={{ width: `${widthPct}%` }}
                        className={`h-full ${
                          s.roeImpactBps >= 0 ? 'bg-[#10B981]' : 'bg-[#F43F5E]'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-right font-mono-tabular font-medium ${
                        s.roeImpactBps >= 0 ? 'text-[#10B981]' : 'text-[#FB7185]'
                      }`}
                    >
                      {s.roeImpactBps >= 0 ? `+${s.roeImpactBps}` : s.roeImpactBps} bps
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: 5-Driver Stress-Test Slider Array */}
        <div className="xl:col-span-5 bg-[#0F172A]/60 border border-[#334155] rounded-md p-4 space-y-4">
          <div className="text-xs font-semibold text-[#F8FAFC]">
            Operational &amp; Capital Structure Levers
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <label htmlFor="dupont-ebit" className="text-[#94A3B8]">
                EBIT Margin (Operating Efficiency)
              </label>
              <span className="font-mono-tabular font-semibold text-[#10B981]">
                {params.ebitMargin.toFixed(1)}%
              </span>
            </div>
            <input
              id="dupont-ebit"
              type="range"
              min={2}
              max={55}
              step={0.5}
              value={params.ebitMargin}
              onChange={(e) =>
                onChangeParams({ ...params, ebitMargin: Number(e.target.value) })
              }
              className="w-full meridian-slider"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <label htmlFor="dupont-turnover" className="text-[#94A3B8]">
                Asset Turnover (Inventory &amp; Asset Velocity)
              </label>
              <span className="font-mono-tabular font-semibold text-[#06B6D4]">
                {params.assetTurnover.toFixed(2)}x
              </span>
            </div>
            <input
              id="dupont-turnover"
              type="range"
              min={0.3}
              max={4.0}
              step={0.05}
              value={params.assetTurnover}
              onChange={(e) =>
                onChangeParams({ ...params, assetTurnover: Number(e.target.value) })
              }
              className="w-full meridian-slider"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <label htmlFor="dupont-leverage" className="text-[#94A3B8]">
                Equity Multiplier (Financial Leverage)
              </label>
              <span className="font-mono-tabular font-semibold text-[#A78BFA]">
                {params.equityMultiplier.toFixed(2)}x
              </span>
            </div>
            <input
              id="dupont-leverage"
              type="range"
              min={1.0}
              max={5.0}
              step={0.05}
              value={params.equityMultiplier}
              onChange={(e) =>
                onChangeParams({
                  ...params,
                  equityMultiplier: Number(e.target.value),
                })
              }
              className="w-full meridian-slider"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <label htmlFor="dupont-tax" className="text-[#94A3B8]">
                Effective Tax Rate
              </label>
              <span className="font-mono-tabular font-semibold text-[#F8FAFC]">
                {params.taxRate.toFixed(1)}%
              </span>
            </div>
            <input
              id="dupont-tax"
              type="range"
              min={5}
              max={40}
              step={0.5}
              value={params.taxRate}
              onChange={(e) =>
                onChangeParams({ ...params, taxRate: Number(e.target.value) })
              }
              className="w-full meridian-slider"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <label htmlFor="dupont-debt-cost" className="text-[#94A3B8]">
                Pre-Tax Cost of Debt
              </label>
              <span className="font-mono-tabular font-semibold text-[#F8FAFC]">
                {params.costOfDebt.toFixed(1)}%
              </span>
            </div>
            <input
              id="dupont-debt-cost"
              type="range"
              min={1}
              max={15}
              step={0.25}
              value={params.costOfDebt}
              onChange={(e) =>
                onChangeParams({ ...params, costOfDebt: Number(e.target.value) })
              }
              className="w-full meridian-slider"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
