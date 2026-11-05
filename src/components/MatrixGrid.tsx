import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { getCellPosture } from '../engine/portfolioEngine';
import { MatrixCellCoord, PositionedUnit } from '../types/portfolio';

interface MatrixGridProps {
  units: PositionedUnit[];
  selectedUnitId: string | null;
  onSelectUnit: (unitId: string) => void;
  onMoveUnitToCell: (unitId: string, cell: MatrixCellCoord | null) => void;
}

const ROW_LABELS = ['High Attractiveness', 'Medium Attractiveness', 'Low Attractiveness'];
const COL_LABELS = ['Low Strength', 'Medium Strength', 'High Strength'];

export const MatrixGrid: React.FC<MatrixGridProps> = ({
  units,
  selectedUnitId,
  onSelectUnit,
  onMoveUnitToCell,
}) => {
  const [draggedUnitId, setDraggedUnitId] = useState<string | null>(null);
  const [hoverCellKey, setHoverCellKey] = useState<string | null>(null);

  const selectedUnit = units.find((u) => u.id === selectedUnitId) ?? units[0] ?? null;

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, unitId: string) => {
    setDraggedUnitId(unitId);
    e.dataTransfer.setData('text/plain', unitId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    row: 0 | 1 | 2,
    col: 0 | 1 | 2
  ) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedUnitId;
    if (id) {
      onMoveUnitToCell(id, { row, col });
      onSelectUnit(id);
    }
    setDraggedUnitId(null);
    setHoverCellKey(null);
  };

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-5 flex flex-col justify-between">
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
          <div>
            <h2 className="font-display text-base font-semibold text-[#F8FAFC]">
              GE-McKinsey 9-Box Portfolio Matrix
            </h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Auto-plotted from unit growth, margin, and market share · Drag any node to override posture
            </p>
          </div>
          <div className="text-xs text-[#94A3B8] font-mono-tabular">
            {units.length} Active Units
          </div>
        </div>

        {/* 3x3 Grid with Axis Labels */}
        <div className="grid grid-cols-[110px_1fr] gap-3">
          {/* Y-Axis Labels */}
          <div className="grid grid-rows-3 gap-2.5">
            {ROW_LABELS.map((label) => (
              <div
                key={label}
                className="flex items-center justify-end text-right pr-2 text-xs font-medium text-[#94A3B8]"
              >
                {label}
              </div>
            ))}
          </div>

          {/* 3x3 Matrix Cells */}
          <div className="grid grid-cols-3 gap-2.5">
            {([0, 1, 2] as const).map((row) =>
              ([0, 1, 2] as const).map((col) => {
                const posture = getCellPosture({ row, col });
                const cellKey = `${row}-${col}`;
                const cellUnits = units.filter(
                  (u) => u.activeCell.row === row && u.activeCell.col === col
                );
                const isHovered = hoverCellKey === cellKey;

                const postureStyle =
                  posture === 'Invest / Grow'
                    ? 'bg-[#10B981]/8 border-[#10B981]/30'
                    : posture === 'Selectivity / Earnings'
                      ? 'bg-[#0F172A]/60 border-[#334155]'
                      : 'bg-[#F43F5E]/8 border-[#F43F5E]/25';

                const postureTextColor =
                  posture === 'Invest / Grow'
                    ? 'text-[#34D399]'
                    : posture === 'Selectivity / Earnings'
                      ? 'text-[#94A3B8]'
                      : 'text-[#FB7185]';

                return (
                  <div
                    key={cellKey}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setHoverCellKey(cellKey);
                    }}
                    onDragLeave={() => setHoverCellKey(null)}
                    onDrop={(e) => handleDrop(e, row, col)}
                    className={`min-h-[116px] rounded-md border p-2.5 transition-colors flex flex-col justify-between ${postureStyle} ${
                      isHovered ? 'ring-2 ring-[#06B6D4] bg-[#06B6D4]/10' : ''
                    }`}
                  >
                    <div className={`text-[11px] font-medium ${postureTextColor}`}>
                      {posture}
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {cellUnits.map((unit) => {
                        const isSelected = selectedUnit?.id === unit.id;
                        const isOverridden = unit.manualCellOverride !== null;
                        return (
                          <button
                            key={unit.id}
                            type="button"
                            draggable
                            onDragStart={(e) => handleDragStart(e, unit.id)}
                            onClick={() => onSelectUnit(unit.id)}
                            title={`${unit.name} · $${unit.simulatedCapital}M (${unit.horizon})`}
                            className={`text-left px-2.5 py-1.5 rounded text-xs font-medium transition-all cursor-grab active:cursor-grabbing ${
                              isSelected
                                ? 'bg-[#06B6D4] text-[#0F172A] font-semibold shadow-sm'
                                : 'bg-[#0F172A] text-[#F8FAFC] border border-[#334155] hover:border-[#06B6D4]'
                            }`}
                          >
                            <div className="truncate max-w-[130px]">{unit.name}</div>
                            <div
                              className={`text-[10px] font-mono-tabular ${
                                isSelected ? 'text-[#0F172A]/80' : 'text-[#94A3B8]'
                              }`}
                            >
                              {unit.horizon} · ${unit.simulatedCapital}M
                              {isOverridden ? ' · Manual' : ''}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* X-Axis Labels */}
          <div />
          <div className="grid grid-cols-3 gap-2.5 pt-1">
            {COL_LABELS.map((label) => (
              <div
                key={label}
                className="text-center text-xs font-medium text-[#94A3B8]"
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Node Inspector Strip */}
      {selectedUnit && (
        <div className="mt-5 pt-4 border-t border-[#334155] flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs text-[#94A3B8]">
              Selected Unit · {selectedUnit.horizon} · {selectedUnit.posture}
            </div>
            <div className="text-sm font-semibold text-[#F8FAFC] mt-0.5">
              {selectedUnit.name}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs font-mono-tabular">
            <div>
              <span className="text-[#94A3B8]">Attractiveness: </span>
              <span className="text-[#F8FAFC] font-medium">
                {selectedUnit.industryAttractiveness}/100
              </span>
            </div>
            <div>
              <span className="text-[#94A3B8]">Strength: </span>
              <span className="text-[#F8FAFC] font-medium">
                {selectedUnit.competitiveStrength}/100
              </span>
            </div>
            <div>
              <span className="text-[#94A3B8]">Sim Capital: </span>
              <span className="text-[#06B6D4] font-semibold">
                ${selectedUnit.simulatedCapital}M
              </span>
            </div>
            <div>
              <span className="text-[#94A3B8]">3Y ROI: </span>
              <span className="text-[#10B981] font-semibold">
                {selectedUnit.projected3YrRoi}%
              </span>
            </div>
            {selectedUnit.manualCellOverride && (
              <button
                type="button"
                onClick={() => onMoveUnitToCell(selectedUnit.id, null)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-sans font-medium text-[#06B6D4] hover:text-[#22D3EE] bg-[#0F172A] border border-[#334155] rounded cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" aria-hidden="true" />
                <span>Snap to Auto</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
