import React, { useRef } from 'react';
import { Download, RotateCcw, Upload } from 'lucide-react';
import { PORTFOLIO_PRESETS } from '../data/presets';
import { PortfolioSummary } from '../types/portfolio';

interface PortfolioToolbarProps {
  activePresetId: string;
  summary: PortfolioSummary;
  waccRate: number;
  statusMessage: { type: 'success' | 'error'; text: string } | null;
  onSelectPreset: (presetId: string) => void;
  onResetOverrides: () => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onImportFile: (file: File) => void;
}

export const PortfolioToolbar: React.FC<PortfolioToolbarProps> = ({
  activePresetId,
  summary,
  waccRate,
  statusMessage,
  onSelectPreset,
  onResetOverrides,
  onExportJson,
  onExportCsv,
  onImportFile,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportFile(file);
      e.target.value = '';
    }
  };

  const roiDelta = Number(
    (summary.simulated3YrRoi - summary.baseline3YrRoi).toFixed(1)
  );

  return (
    <section aria-label="Portfolio controls and executive summary" className="space-y-5">
      {/* Workspace Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
        <div className="flex flex-wrap items-center gap-3">
          <label
            htmlFor="preset-select"
            className="text-xs font-medium text-[#94A3B8] whitespace-nowrap"
          >
            Portfolio Model
          </label>
          <select
            id="preset-select"
            value={activePresetId}
            onChange={(e) => onSelectPreset(e.target.value)}
            className="bg-[#1E293B] text-[#F8FAFC] text-xs font-medium px-3 py-2 rounded-md border border-[#334155] focus:outline-none focus:border-[#06B6D4] cursor-pointer"
          >
            {PORTFOLIO_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
            <option value="custom">Custom Portfolio</option>
          </select>

          <button
            type="button"
            onClick={onResetOverrides}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] bg-[#1E293B] hover:bg-[#273549] border border-[#334155] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset Matrix Overrides</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.csv"
            onChange={handleFileChange}
            className="hidden"
            aria-label="Import JSON or CSV portfolio file"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#F8FAFC] bg-[#1E293B] hover:bg-[#273549] border border-[#334155] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#06B6D4]" aria-hidden="true" />
            <span>Import JSON / CSV</span>
          </button>
          <button
            type="button"
            onClick={onExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#F8FAFC] bg-[#1E293B] hover:bg-[#273549] border border-[#334155] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#10B981]" aria-hidden="true" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={onExportJson}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#F8FAFC] bg-[#1E293B] hover:bg-[#273549] border border-[#334155] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#94A3B8]" aria-hidden="true" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {statusMessage && (
        <div
          role="status"
          className={`px-4 py-2.5 rounded-md border text-xs font-medium ${
            statusMessage.type === 'success'
              ? 'bg-[#10B981]/10 border-[#10B981]/40 text-[#34D399]'
              : 'bg-[#F43F5E]/10 border-[#F43F5E]/40 text-[#FB7185]'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* 4-Column Executive KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-4">
          <div className="text-xs font-medium text-[#94A3B8]">
            Total Portfolio Revenue
          </div>
          <div className="mt-1.5 font-mono-tabular text-2xl font-semibold text-[#F8FAFC]">
            ${summary.totalRevenue.toLocaleString()}M
          </div>
          <div className="mt-1 text-xs text-[#94A3B8] font-mono-tabular">
            {summary.weightedGrowth}% weighted growth · {summary.weightedMargin}% margin
          </div>
        </div>

        <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-4">
          <div className="text-xs font-medium text-[#94A3B8]">
            Simulated Capital Pool
          </div>
          <div className="mt-1.5 font-mono-tabular text-2xl font-semibold text-[#06B6D4]">
            ${summary.totalSimulatedCapital.toLocaleString()}M
          </div>
          <div className="mt-1 text-xs text-[#94A3B8] font-mono-tabular">
            Baseline ${summary.totalCurrentCapital.toLocaleString()}M ·{' '}
            <span
              className={
                summary.totalSimulatedCapital >= summary.totalCurrentCapital
                  ? 'text-[#10B981]'
                  : 'text-[#F59E0B]'
              }
            >
              {summary.totalSimulatedCapital >= summary.totalCurrentCapital ? '+' : ''}
              {(summary.totalSimulatedCapital - summary.totalCurrentCapital).toFixed(1)}M
            </span>
          </div>
        </div>

        <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-4">
          <div className="text-xs font-medium text-[#94A3B8]">
            Projected 3-Year ROI
          </div>
          <div className="mt-1.5 font-mono-tabular text-2xl font-semibold text-[#10B981]">
            {summary.simulated3YrRoi}%
          </div>
          <div className="mt-1 text-xs text-[#94A3B8] font-mono-tabular">
            Baseline {summary.baseline3YrRoi}% ·{' '}
            <span className={roiDelta >= 0 ? 'text-[#10B981]' : 'text-[#F43F5E]'}>
              {roiDelta >= 0 ? `+${roiDelta}%` : `${roiDelta}%`} lift
            </span>
          </div>
        </div>

        <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-4">
          <div className="text-xs font-medium text-[#94A3B8]">
            Annualized Spread vs. WACC
          </div>
          <div
            className={`mt-1.5 font-mono-tabular text-2xl font-semibold ${
              summary.waccSpread >= 0 ? 'text-[#10B981]' : 'text-[#F43F5E]'
            }`}
          >
            {summary.waccSpread >= 0 ? `+${summary.waccSpread}%` : `${summary.waccSpread}%`}
          </div>
          <div className="mt-1 text-xs text-[#94A3B8] font-mono-tabular">
            Hurdle rate {waccRate.toFixed(1)}% ·{' '}
            {summary.waccSpread >= 0 ? 'Value Accretive' : 'Below Hurdle'}
          </div>
        </div>
      </div>
    </section>
  );
};
