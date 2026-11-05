import React, { useState } from 'react';
import { YearlyProjection } from '../types/portfolio';

interface RoiTrajectoryChartProps {
  projections: YearlyProjection[];
  waccRate: number;
}

export const RoiTrajectoryChart: React.FC<RoiTrajectoryChartProps> = ({
  projections,
  waccRate,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(3);

  const allVals = projections.flatMap((p) => [
    p.baselineValue,
    p.simulatedValue,
    p.hurdleValue,
  ]);
  const minVal = Math.max(0, Math.floor(Math.min(...allVals) * 0.88));
  const maxVal = Math.ceil(Math.max(...allVals) * 1.08);
  const range = Math.max(1, maxVal - minVal);

  const width = 540;
  const height = 220;
  const padTop = 20;
  const padBottom = 34;
  const padLeft = 54;
  const padRight = 24;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const xScale = (year: number) => padLeft + (year / 3) * plotW;
  const yScale = (val: number) =>
    padTop + plotH - ((val - minVal) / range) * plotH;

  const buildPath = (getter: (p: YearlyProjection) => number) =>
    projections
      .map(
        (p, idx) =>
          `${idx === 0 ? 'M' : 'L'} ${xScale(p.year).toFixed(1)} ${yScale(
            getter(p)
          ).toFixed(1)}`
      )
      .join(' ');

  const simPath = buildPath((p) => p.simulatedValue);
  const basePath = buildPath((p) => p.baselineValue);
  const hurdlePath = buildPath((p) => p.hurdleValue);

  const activeProj =
    projections.find((p) => p.year === selectedYear) ?? projections[3];

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-5 flex flex-col justify-between">
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <div>
            <h2 className="font-display text-base font-semibold text-[#F8FAFC]">
              3-Year ROI &amp; Value Trajectory
            </h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Compounded portfolio value vs. baseline and {waccRate.toFixed(1)}% WACC hurdle
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-[#94A3B8]">
            <span>
              <span className="inline-block w-3 h-0.5 bg-[#10B981] mr-1.5 align-middle" />
              Optimized
            </span>
            <span>
              <span className="inline-block w-3 h-0.5 bg-[#06B6D4] mr-1.5 align-middle" />
              WACC Hurdle
            </span>
            <span>
              <span className="inline-block w-3 h-0.5 bg-[#94A3B8] mr-1.5 align-middle" />
              Baseline
            </span>
          </div>
        </div>

        {/* SVG Trajectory Plot */}
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          role="img"
          aria-label="3-year ROI trajectory chart"
        >
          {/* Horizontal Gridlines */}
          {[0, 0.33, 0.66, 1].map((t) => {
            const val = Math.round(minVal + range * t);
            const y = yScale(val);
            return (
              <g key={t}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#334155"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  fill="#94A3B8"
                  fontSize="10"
                  className="font-mono-tabular"
                >
                  ${val}M
                </text>
              </g>
            );
          })}

          {/* Baseline Line */}
          <path
            d={basePath}
            fill="none"
            stroke="#94A3B8"
            strokeWidth={2}
            strokeDasharray="4 4"
          />

          {/* WACC Hurdle Line */}
          <path
            d={hurdlePath}
            fill="none"
            stroke="#06B6D4"
            strokeWidth={2}
            strokeDasharray="6 3"
          />

          {/* Simulated Optimized Line */}
          <path
            d={simPath}
            fill="none"
            stroke="#10B981"
            strokeWidth={2.75}
          />

          {/* Interactive Year Nodes */}
          {projections.map((p) => {
            const cx = xScale(p.year);
            const cySim = yScale(p.simulatedValue);
            const isSelected = p.year === selectedYear;

            return (
              <g
                key={p.year}
                onClick={() => setSelectedYear(p.year)}
                onMouseEnter={() => setSelectedYear(p.year)}
                className="cursor-pointer"
              >
                <line
                  x1={cx}
                  y1={padTop}
                  x2={cx}
                  y2={height - padBottom}
                  stroke={isSelected ? '#06B6D4' : 'transparent'}
                  strokeWidth={1}
                  strokeDasharray="2 2"
                />
                <circle
                  cx={cx}
                  cy={cySim}
                  r={isSelected ? 5.5 : 4}
                  fill="#10B981"
                  stroke="#0F172A"
                  strokeWidth={2}
                />
                <text
                  x={cx}
                  y={height - 12}
                  textAnchor="middle"
                  fill={isSelected ? '#F8FAFC' : '#94A3B8'}
                  fontSize="11"
                  fontWeight={isSelected ? '600' : '400'}
                >
                  {p.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Year-by-Year Compact Tabular Strip */}
      <div className="mt-3 pt-3 border-t border-[#334155] grid grid-cols-4 gap-2 text-xs font-mono-tabular">
        {projections.map((p) => {
          const isSelected = p.year === selectedYear;
          return (
            <button
              key={p.year}
              type="button"
              onClick={() => setSelectedYear(p.year)}
              className={`text-left p-2 rounded border transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-[#0F172A] border-[#06B6D4]'
                  : 'bg-[#0F172A]/40 border-[#334155] hover:border-[#475569]'
              }`}
            >
              <div className="font-sans text-[11px] text-[#94A3B8]">{p.label}</div>
              <div className="text-sm font-semibold text-[#10B981] mt-0.5">
                ${p.simulatedValue}M
              </div>
              <div className="text-[11px] text-[#94A3B8]">
                +{p.simulatedRoi}% ROI
              </div>
            </button>
          );
        })}
      </div>

      {activeProj && (
        <div className="mt-2.5 flex items-center justify-between text-xs text-[#94A3B8] font-mono-tabular">
          <span>
            {activeProj.label} Value Creation vs. Hurdle:
          </span>
          <span
            className={
              activeProj.simulatedValue >= activeProj.hurdleValue
                ? 'text-[#10B981] font-semibold'
                : 'text-[#FB7185] font-semibold'
            }
          >
            {activeProj.simulatedValue >= activeProj.hurdleValue ? '+' : ''}$
            {(activeProj.simulatedValue - activeProj.hurdleValue).toFixed(1)}M
          </span>
        </div>
      )}
    </div>
  );
};
