import React, { useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { HorizonType, PositionedUnit, ProductUnit } from '../types/portfolio';
import { clampNumber } from '../utils/security';

interface PortfolioLedgerProps {
  units: PositionedUnit[];
  selectedUnitId: string | null;
  onSelectUnit: (id: string) => void;
  onUpdateUnit: (id: string, patch: Partial<ProductUnit>) => void;
  onDeleteUnit: (id: string) => void;
}

export const PortfolioLedger: React.FC<PortfolioLedgerProps> = ({
  units,
  selectedUnitId,
  onSelectUnit,
  onUpdateUnit,
  onDeleteUnit,
}) => {
  const [search, setSearch] = useState('');
  const [horizonFilter, setHorizonFilter] = useState<'ALL' | HorizonType>('ALL');

  const filtered = units.filter((u) => {
    const matchesHorizon =
      horizonFilter === 'ALL' || u.horizon === horizonFilter;
    const matchesSearch = u.name
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    return matchesHorizon && matchesSearch;
  });

  return (
    <section
      id="portfolio-ledger"
      aria-label="Unit financials ledger"
      className="bg-[#1E293B] border border-[#334155] rounded-lg p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="font-display text-base font-semibold text-[#F8FAFC]">
            Unit Financials &amp; Reallocation Ledger
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Edit unit revenue, growth, market share, or margin inline to re-plot the 9-box matrix
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search
              className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter product lines..."
              aria-label="Filter product lines"
              className="bg-[#0F172A] text-[#F8FAFC] placeholder-[#64748B] text-xs pl-8 pr-3 py-2 rounded-md border border-[#334155] focus:outline-none focus:border-[#06B6D4] w-48"
            />
          </div>

          {/* Horizon Segmented Filter */}
          <div
            role="group"
            aria-label="Filter by horizon"
            className="flex items-center gap-1 p-1 bg-[#0F172A] border border-[#334155] rounded-md"
          >
            {(['ALL', 'H1', 'H2', 'H3'] as const).map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHorizonFilter(h)}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                  horizonFilter === h
                    ? 'bg-[#1E293B] text-[#06B6D4] font-semibold'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                {h === 'ALL' ? 'All' : h}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* High-Density Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#334155] text-[11px] font-medium text-[#94A3B8]">
              <th className="py-2.5 pr-3">Product Line</th>
              <th className="py-2.5 px-2">Horizon</th>
              <th className="py-2.5 px-2">GE-McKinsey Posture</th>
              <th className="py-2.5 px-2 text-right">Revenue ($M)</th>
              <th className="py-2.5 px-2 text-right">Growth (%)</th>
              <th className="py-2.5 px-2 text-right">Share (%)</th>
              <th className="py-2.5 px-2 text-right">Margin (%)</th>
              <th className="py-2.5 px-2 text-right">Current ($M)</th>
              <th className="py-2.5 px-2 text-right">Simulated ($M)</th>
              <th className="py-2.5 px-2 text-right">Delta ($M)</th>
              <th className="py-2.5 px-2 text-right">3Y ROI</th>
              <th className="py-2.5 pl-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#334155]/60 text-xs">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={12} className="py-8 text-center text-[#94A3B8]">
                  No product lines match your current filter.
                </td>
              </tr>
            ) : (
              filtered.map((unit) => {
                const isSelected = unit.id === selectedUnitId;
                return (
                  <tr
                    key={unit.id}
                    onClick={() => onSelectUnit(unit.id)}
                    className={`h-11 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#06B6D4]/10'
                        : 'hover:bg-[#0F172A]/50'
                    }`}
                  >
                    <td className="py-2 pr-3 font-medium text-[#F8FAFC] whitespace-nowrap">
                      {unit.name}
                    </td>

                    <td
                      className="py-2 px-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        aria-label={`Horizon for ${unit.name}`}
                        value={unit.horizon}
                        onChange={(e) =>
                          onUpdateUnit(unit.id, {
                            horizon: e.target.value as HorizonType,
                          })
                        }
                        className="bg-[#0F172A] text-[#F8FAFC] font-mono-tabular text-xs px-2 py-1 rounded border border-[#334155] focus:border-[#06B6D4] focus:outline-none"
                      >
                        <option value="H1">H1</option>
                        <option value="H2">H2</option>
                        <option value="H3">H3</option>
                      </select>
                    </td>

                    <td className="py-2 px-2 whitespace-nowrap">
                      <span
                        className={
                          unit.posture === 'Invest / Grow'
                            ? 'text-[#34D399] font-medium'
                            : unit.posture === 'Selectivity / Earnings'
                              ? 'text-[#94A3B8]'
                              : 'text-[#FB7185] font-medium'
                        }
                      >
                        {unit.posture}
                      </span>
                    </td>

                    {/* Inline Editable Numeric Cells */}
                    <td
                      className="py-2 px-2 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="number"
                        aria-label={`Revenue for ${unit.name}`}
                        value={unit.revenue}
                        min={0.5}
                        max={50000}
                        step={1}
                        onChange={(e) =>
                          onUpdateUnit(unit.id, {
                            revenue: clampNumber(e.target.value, 0.5, 50000, unit.revenue),
                          })
                        }
                        className="w-20 text-right font-mono-tabular bg-[#0F172A] text-[#F8FAFC] px-2 py-1 rounded border border-[#334155] focus:border-[#06B6D4] focus:outline-none"
                      />
                    </td>

                    <td
                      className="py-2 px-2 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="number"
                        aria-label={`Growth rate for ${unit.name}`}
                        value={unit.growthRate}
                        min={-40}
                        max={200}
                        step={1}
                        onChange={(e) =>
                          onUpdateUnit(unit.id, {
                            growthRate: clampNumber(
                              e.target.value,
                              -40,
                              200,
                              unit.growthRate
                            ),
                          })
                        }
                        className="w-16 text-right font-mono-tabular bg-[#0F172A] text-[#F8FAFC] px-2 py-1 rounded border border-[#334155] focus:border-[#06B6D4] focus:outline-none"
                      />
                    </td>

                    <td
                      className="py-2 px-2 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="number"
                        aria-label={`Market share for ${unit.name}`}
                        value={unit.marketShare}
                        min={0.5}
                        max={95}
                        step={1}
                        onChange={(e) =>
                          onUpdateUnit(unit.id, {
                            marketShare: clampNumber(
                              e.target.value,
                              0.5,
                              95,
                              unit.marketShare
                            ),
                          })
                        }
                        className="w-16 text-right font-mono-tabular bg-[#0F172A] text-[#F8FAFC] px-2 py-1 rounded border border-[#334155] focus:border-[#06B6D4] focus:outline-none"
                      />
                    </td>

                    <td
                      className="py-2 px-2 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="number"
                        aria-label={`Gross margin for ${unit.name}`}
                        value={unit.grossMargin}
                        min={5}
                        max={95}
                        step={1}
                        onChange={(e) =>
                          onUpdateUnit(unit.id, {
                            grossMargin: clampNumber(
                              e.target.value,
                              5,
                              95,
                              unit.grossMargin
                            ),
                          })
                        }
                        className="w-16 text-right font-mono-tabular bg-[#0F172A] text-[#F8FAFC] px-2 py-1 rounded border border-[#334155] focus:border-[#06B6D4] focus:outline-none"
                      />
                    </td>

                    <td
                      className="py-2 px-2 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="number"
                        aria-label={`Current capital for ${unit.name}`}
                        value={unit.currentCapital}
                        min={0.1}
                        max={10000}
                        step={1}
                        onChange={(e) =>
                          onUpdateUnit(unit.id, {
                            currentCapital: clampNumber(
                              e.target.value,
                              0.1,
                              10000,
                              unit.currentCapital
                            ),
                          })
                        }
                        className="w-18 text-right font-mono-tabular bg-[#0F172A] text-[#F8FAFC] px-2 py-1 rounded border border-[#334155] focus:border-[#06B6D4] focus:outline-none"
                      />
                    </td>

                    <td className="py-2 px-2 text-right font-mono-tabular font-semibold text-[#06B6D4]">
                      ${unit.simulatedCapital}M
                    </td>

                    <td
                      className={`py-2 px-2 text-right font-mono-tabular font-medium ${
                        unit.capitalDelta >= 0
                          ? 'text-[#10B981]'
                          : 'text-[#FB7185]'
                      }`}
                    >
                      {unit.capitalDelta >= 0
                        ? `+$${unit.capitalDelta}M`
                        : `-$${Math.abs(unit.capitalDelta)}M`}
                    </td>

                    <td className="py-2 px-2 text-right font-mono-tabular font-semibold text-[#10B981]">
                      {unit.projected3YrRoi}%
                    </td>

                    <td
                      className="py-2 pl-2 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onDeleteUnit(unit.id)}
                        disabled={units.length <= 1}
                        title={
                          units.length <= 1
                            ? 'At least one unit is required'
                            : `Remove ${unit.name}`
                        }
                        aria-label={`Remove ${unit.name}`}
                        className="p-1.5 text-[#94A3B8] hover:text-[#FB7185] disabled:opacity-30 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
