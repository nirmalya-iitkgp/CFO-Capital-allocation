import React from 'react';
import { rebalanceHorizonTargets } from '../engine/portfolioEngine';
import {
  HorizonBreakdownItem,
  HorizonType,
  SimulationParams,
} from '../types/portfolio';

interface HorizonsSimulatorProps {
  params: SimulationParams;
  horizonBreakdown: Record<HorizonType, HorizonBreakdownItem>;
  onChangeParams: (next: SimulationParams) => void;
}

const HORIZON_META: {
  key: HorizonType;
  targetKey: 'h1' | 'h2' | 'h3';
  title: string;
  subtitle: string;
  accentColor: string;
}[] = [
  {
    key: 'H1',
    targetKey: 'h1',
    title: 'Horizon 1 · Core Cash Engines',
    subtitle: 'Defend & extend established product lines',
    accentColor: '#10B981',
  },
  {
    key: 'H2',
    targetKey: 'h2',
    title: 'Horizon 2 · Emerging Growth',
    subtitle: 'Scale proven high-growth adjacencies',
    accentColor: '#06B6D4',
  },
  {
    key: 'H3',
    targetKey: 'h3',
    title: 'Horizon 3 · Transformational Bets',
    subtitle: 'Seed long-term R&D & option value',
    accentColor: '#A78BFA',
  },
];

export const HorizonsSimulator: React.FC<HorizonsSimulatorProps> = ({
  params,
  horizonBreakdown,
  onChangeParams,
}) => {
  const handleHorizonSlider = (horizon: HorizonType, val: number) => {
    const nextTargets = rebalanceHorizonTargets(
      horizon,
      val,
      params.horizonTargets
    );
    onChangeParams({
      ...params,
      horizonTargets: nextTargets,
    });
  };

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-5 flex flex-col justify-between space-y-5">
      <div>
        <h2 className="font-display text-base font-semibold text-[#F8FAFC]">
          McKinsey Three Horizons &amp; WACC Simulator
        </h2>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          Adjust total capital pool, hurdle rate, and target R&amp;D ratios across horizons
        </p>

        {/* Global Capital & WACC Controls */}
        <div className="mt-4 space-y-4 pb-4 border-b border-[#334155]">
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <label htmlFor="capital-pool-slider" className="font-medium text-[#F8FAFC]">
                Total Capital Pool
              </label>
              <span className="font-mono-tabular font-semibold text-[#06B6D4]">
                ${params.totalCapitalPool}M
              </span>
            </div>
            <input
              id="capital-pool-slider"
              type="range"
              min={20}
              max={600}
              step={5}
              value={params.totalCapitalPool}
              onChange={(e) =>
                onChangeParams({
                  ...params,
                  totalCapitalPool: Number(e.target.value),
                })
              }
              className="w-full meridian-slider"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label htmlFor="wacc-slider" className="font-medium text-[#F8FAFC]">
                  WACC / Hurdle Rate
                </label>
                <span className="font-mono-tabular font-semibold text-[#F8FAFC]">
                  {params.waccRate.toFixed(1)}%
                </span>
              </div>
              <input
                id="wacc-slider"
                type="range"
                min={5}
                max={20}
                step={0.5}
                value={params.waccRate}
                onChange={(e) =>
                  onChangeParams({
                    ...params,
                    waccRate: Number(e.target.value),
                  })
                }
                className="w-full meridian-slider"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label htmlFor="efficiency-slider" className="font-medium text-[#F8FAFC]">
                  Capital Efficiency
                </label>
                <span className="font-mono-tabular font-semibold text-[#10B981]">
                  {params.reinvestmentEfficiency.toFixed(2)}x
                </span>
              </div>
              <input
                id="efficiency-slider"
                type="range"
                min={0.7}
                max={1.4}
                step={0.05}
                value={params.reinvestmentEfficiency}
                onChange={(e) =>
                  onChangeParams({
                    ...params,
                    reinvestmentEfficiency: Number(e.target.value),
                  })
                }
                className="w-full meridian-slider"
              />
            </div>
          </div>
        </div>

        {/* Three Horizons Ratio Sliders */}
        <div className="mt-4 space-y-4">
          {HORIZON_META.map((h) => {
            const targetPct = params.horizonTargets[h.targetKey];
            const stats = horizonBreakdown[h.key];
            return (
              <div key={h.key} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    <label
                      htmlFor={`horizon-${h.key}`}
                      className="text-xs font-semibold text-[#F8FAFC]"
                    >
                      {h.title}
                    </label>
                    <div className="text-[11px] text-[#94A3B8]">
                      {h.subtitle} · {stats.unitCount} units
                    </div>
                  </div>
                  <div className="text-right font-mono-tabular text-xs">
                    <span className="font-semibold text-[#F8FAFC]">{targetPct}%</span>
                    <span className="text-[#94A3B8] ml-1.5">
                      (${stats.simulatedCapital}M)
                    </span>
                  </div>
                </div>

                <input
                  id={`horizon-${h.key}`}
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={targetPct}
                  onChange={(e) => handleHorizonSlider(h.key, Number(e.target.value))}
                  className="w-full meridian-slider"
                />

                <div className="flex items-center justify-between text-[11px] font-mono-tabular text-[#94A3B8]">
                  <span>Current: {stats.currentPct}% (${stats.currentCapital}M)</span>
                  <span
                    className={
                      stats.simulatedCapital >= stats.currentCapital
                        ? 'text-[#10B981]'
                        : 'text-[#F59E0B]'
                    }
                  >
                    {stats.simulatedCapital >= stats.currentCapital ? '+' : ''}
                    {(stats.simulatedCapital - stats.currentCapital).toFixed(1)}M delta
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stacked Allocation Comparison Bar */}
      <div className="pt-3 border-t border-[#334155]">
        <div className="flex items-center justify-between text-xs text-[#94A3B8] mb-2">
          <span>Target Horizon Mix (100% Allocated)</span>
          <span className="font-mono-tabular text-[#F8FAFC]">
            {params.horizonTargets.h1}% / {params.horizonTargets.h2}% /{' '}
            {params.horizonTargets.h3}%
          </span>
        </div>
        <div className="h-2.5 w-full rounded-sm overflow-hidden flex bg-[#0F172A]">
          <div
            style={{ width: `${params.horizonTargets.h1}%` }}
            className="bg-[#10B981] transition-all duration-150"
            title={`H1: ${params.horizonTargets.h1}%`}
          />
          <div
            style={{ width: `${params.horizonTargets.h2}%` }}
            className="bg-[#06B6D4] transition-all duration-150"
            title={`H2: ${params.horizonTargets.h2}%`}
          />
          <div
            style={{ width: `${params.horizonTargets.h3}%` }}
            className="bg-[#A78BFA] transition-all duration-150"
            title={`H3: ${params.horizonTargets.h3}%`}
          />
        </div>
      </div>
    </div>
  );
};
