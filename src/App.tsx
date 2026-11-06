import React, { useEffect, useMemo, useState } from 'react';
import { AddUnitModal } from './components/AddUnitModal';
import { DupontWorkbench } from './components/DupontWorkbench';
import { Header } from './components/Header';
import { HorizonsSimulator } from './components/HorizonsSimulator';
import { MatrixGrid } from './components/MatrixGrid';
import { PortfolioLedger } from './components/PortfolioLedger';
import { PortfolioToolbar } from './components/PortfolioToolbar';
import { RoiTrajectoryChart } from './components/RoiTrajectoryChart';
import { WaterfallChart } from './components/WaterfallChart';
import { PORTFOLIO_PRESETS } from './data/presets';
import { DEFAULT_DUPONT_PARAMS } from './engine/dupontEngine';
import { runPortfolioSimulation } from './engine/portfolioEngine';
import {
  DupontParams,
  MatrixCellCoord,
  ProductUnit,
  SimulationParams,
} from './types/portfolio';
import {
  exportPortfolioCsv,
  parsePortfolioCsv,
  safeParsePortfolioJson,
} from './utils/security';

const STORAGE_KEY = 'meridian_capital_portfolio_v1';

interface PersistedState {
  presetId: string;
  units: ProductUnit[];
  params: SimulationParams;
}

function loadInitialState(): PersistedState {
  const defaultPreset = PORTFOLIO_PRESETS[0];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        presetId: defaultPreset.id,
        units: defaultPreset.units,
        params: defaultPreset.params,
      };
    }
    const parsed = safeParsePortfolioJson(raw);
    if (parsed.ok) {
      return {
        presetId: 'custom',
        units: parsed.units,
        params: parsed.params,
      };
    }
  } catch {
    // Fallback to default preset if storage is unavailable
  }
  return {
    presetId: defaultPreset.id,
    units: defaultPreset.units,
    params: defaultPreset.params,
  };
}

export default function App() {
  const initial = useMemo(() => loadInitialState(), []);
  const [presetId, setPresetId] = useState<string>(initial.presetId);
  const [units, setUnits] = useState<ProductUnit[]>(initial.units);
  const [params, setParams] = useState<SimulationParams>(initial.params);
  const [dupontParams, setDupontParams] = useState<DupontParams>(
    DEFAULT_DUPONT_PARAMS
  );
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(
    initial.units[0]?.id ?? null
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Persist portfolio state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ units, params })
      );
    } catch {
      // Ignore quota errors in restricted environments
    }
  }, [units, params]);

  const simulation = useMemo(
    () => runPortfolioSimulation(units, params),
    [units, params]
  );

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    window.setTimeout(() => {
      setStatusMessage((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  const handleSelectPreset = (nextPresetId: string) => {
    const found = PORTFOLIO_PRESETS.find((p) => p.id === nextPresetId);
    if (!found) return;
    setPresetId(found.id);
    setUnits(found.units);
    setParams(found.params);
    setSelectedUnitId(found.units[0]?.id ?? null);
    showStatus('success', `Loaded "${found.name}" portfolio model.`);
  };

  const handleMoveUnitToCell = (
    unitId: string,
    cell: MatrixCellCoord | null
  ) => {
    setPresetId('custom');
    setUnits((prev) =>
      prev.map((u) =>
        u.id === unitId ? { ...u, manualCellOverride: cell } : u
      )
    );
  };

  const handleResetOverrides = () => {
    setUnits((prev) =>
      prev.map((u) => ({ ...u, manualCellOverride: null }))
    );
    showStatus('success', 'All 9-box matrix positions reset to formula-derived scores.');
  };

  const handleUpdateUnit = (id: string, patch: Partial<ProductUnit>) => {
    setPresetId('custom');
    setUnits((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...patch } : u))
    );
  };

  const handleDeleteUnit = (id: string) => {
    if (units.length <= 1) return;
    setPresetId('custom');
    setUnits((prev) => prev.filter((u) => u.id !== id));
    if (selectedUnitId === id) {
      setSelectedUnitId(units.find((u) => u.id !== id)?.id ?? null);
    }
  };

  const handleAddUnit = (newUnit: ProductUnit) => {
    setPresetId('custom');
    setUnits((prev) => [...prev, newUnit]);
    setSelectedUnitId(newUnit.id);
    showStatus('success', `Added "${newUnit.name}" to ${newUnit.horizon}.`);
  };

  const triggerDownload = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const payload = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        params,
        units,
      },
      null,
      2
    );
    triggerDownload('meridian-portfolio.json', payload, 'application/json');
    showStatus('success', 'Exported portfolio scenario to JSON.');
  };

  const handleExportCsv = () => {
    const csv = exportPortfolioCsv(simulation.units);
    triggerDownload('meridian-portfolio.csv', csv, 'text/csv;charset=utf-8;');
    showStatus('success', 'Exported formula-sanitized portfolio report to CSV.');
  };

  const handleImportFile = async (file: File) => {
    if (file.size > 512 * 1024) {
      showStatus('error', 'Import rejected: file exceeds 512KB security limit.');
      return;
    }
    const text = await file.text();
    if (file.name.toLowerCase().endsWith('.json')) {
      const res = safeParsePortfolioJson(text);
      if (!res.ok) {
        showStatus('error', `JSON import failed: ${res.error}`);
        return;
      }
      setPresetId('custom');
      setUnits(res.units);
      setParams(res.params);
      setSelectedUnitId(res.units[0]?.id ?? null);
      showStatus('success', `Imported ${res.units.length} product units from JSON.`);
    } else {
      const res = parsePortfolioCsv(text);
      if (!res.ok) {
        showStatus('error', `CSV import failed: ${res.error}`);
        return;
      }
      setPresetId('custom');
      setUnits(res.units);
      setSelectedUnitId(res.units[0]?.id ?? null);
      showStatus('success', `Imported ${res.units.length} product units from CSV.`);
    }
  };

  return (
    <div id="top" className="min-h-screen bg-[#0F172A] text-[#F8FAFC] flex flex-col">
      <Header onOpenAddModal={() => setIsAddModalOpen(true)} />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-6 py-6 space-y-6">
        <PortfolioToolbar
          activePresetId={presetId}
          summary={simulation.summary}
          waccRate={params.waccRate}
          statusMessage={statusMessage}
          onSelectPreset={handleSelectPreset}
          onResetOverrides={handleResetOverrides}
          onExportJson={handleExportJson}
          onExportCsv={handleExportCsv}
          onImportFile={handleImportFile}
        />

        {/* Primary Bento Row: GE-McKinsey 9-Box Matrix + McKinsey Three Horizons Simulator */}
        <section
          id="matrix-horizons"
          aria-label="GE-McKinsey 9-Box Matrix and Three Horizons Simulator"
          className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch"
        >
          <div className="xl:col-span-7 flex">
            <div className="w-full flex">
              <MatrixGrid
                units={simulation.units}
                selectedUnitId={selectedUnitId}
                onSelectUnit={setSelectedUnitId}
                onMoveUnitToCell={handleMoveUnitToCell}
              />
            </div>
          </div>

          <div className="xl:col-span-5 flex">
            <div className="w-full flex">
              <HorizonsSimulator
                params={params}
                horizonBreakdown={simulation.summary.horizonBreakdown}
                onChangeParams={(next) => {
                  setPresetId('custom');
                  setParams(next);
                }}
              />
            </div>
          </div>
        </section>

        {/* Secondary Bento Row: Capital Allocation Waterfall + 3-Year ROI Trajectory */}
        <section
          aria-label="Capital Allocation Waterfall and 3-Year ROI Projections"
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
        >
          <div id="capital-waterfall" className="lg:col-span-7 flex">
            <div className="w-full flex">
              <WaterfallChart steps={simulation.waterfall} />
            </div>
          </div>

          <div id="roi-projections" className="lg:col-span-5 flex">
            <div className="w-full flex">
              <RoiTrajectoryChart
                projections={simulation.projections}
                waccRate={params.waccRate}
              />
            </div>
          </div>
        </section>

        {/* Dynamic 5-Step DuPont ROE Decomposition & EVA Workbench */}
        <DupontWorkbench
          params={dupontParams}
          portfolioRevenue={simulation.summary.totalRevenue}
          waccRate={params.waccRate}
          onChangeParams={setDupontParams}
        />

        {/* Full-Width Editable Unit Financials Ledger */}
        <PortfolioLedger
          units={simulation.units}
          selectedUnitId={selectedUnitId}
          onSelectUnit={setSelectedUnitId}
          onUpdateUnit={handleUpdateUnit}
          onDeleteUnit={handleDeleteUnit}
        />
      </main>

      <footer className="border-t border-[#1E293B] py-5 px-6 text-xs text-[#64748B]">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <span>Meridian Capital · Quantitative Portfolio &amp; Capital Allocation Engine</span>
          <span>GE-McKinsey 9-Box &amp; McKinsey Three Horizons Modeling</span>
        </div>
      </footer>

      <AddUnitModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddUnit={handleAddUnit}
      />
    </div>
  );
}
