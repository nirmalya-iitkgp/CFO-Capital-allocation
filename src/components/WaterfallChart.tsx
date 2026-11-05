import React, { useState } from 'react';
import { WaterfallStep } from '../types/portfolio';

interface WaterfallChartProps {
  steps: WaterfallStep[];
}

export const WaterfallChart: React.FC<WaterfallChartProps> = ({ steps }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const maxVal = Math.max(
    10,
    ...steps.map((s) => Math.max(s.start, s.end, s.value))
  );
  const yMax = Math.ceil(maxVal * 1.12);

  const chartHeight = 250;
  const chartWidth = Math.max(560, steps.length * 76);
  const padTop = 24;
  const padBottom = 54;
  const padLeft = 48;
  const padRight = 20;
  const plotHeight = chartHeight - padTop - padBottom;
  const plotWidth = chartWidth - padLeft - padRight;

  const yScale = (val: number) =>
    padTop + plotHeight - (Math.max(0, val) / yMax) * plotHeight;

  const barWidth = Math.min(44, Math.max(22, (plotWidth / steps.length) * 0.58));
  const stepWidth = plotWidth / steps.length;

  const hoveredStep = steps.find((s) => s.id === hoveredId) ?? null;

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-lg p-5 flex flex-col justify-between">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
        <div>
          <h2 className="font-display text-base font-semibold text-[#F8FAFC]">
            Capital Allocation Waterfall
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Net capital bridge from current baseline to optimized horizon allocation ($M)
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs text-[#94A3B8]">
          <span>
            <span className="inline-block w-2.5 h-2.5 rounded-xs bg-[#10B981] mr-1.5 align-middle" />
            Reinvest (+)
          </span>
          <span>
            <span className="inline-block w-2.5 h-2.5 rounded-xs bg-[#F43F5E] mr-1.5 align-middle" />
            Trim / Divest (-)
          </span>
          <span>
            <span className="inline-block w-2.5 h-2.5 rounded-xs bg-[#06B6D4] mr-1.5 align-middle" />
            Optimized Pool
          </span>
        </div>
      </div>

      {/* Hover Detail Strip */}
      <div className="h-7 flex items-center justify-between text-xs font-mono-tabular bg-[#0F172A]/70 border border-[#334155] rounded px-3 mb-3">
        {hoveredStep ? (
          <>
            <span className="font-sans font-medium text-[#F8FAFC]">
              {hoveredStep.label}
              {hoveredStep.horizon ? ` (${hoveredStep.horizon})` : ''}
            </span>
            <span
              className={
                hoveredStep.type === 'inflow'
                  ? 'text-[#10B981] font-semibold'
                  : hoveredStep.type === 'outflow'
                    ? 'text-[#FB7185] font-semibold'
                    : 'text-[#06B6D4] font-semibold'
              }
            >
              {hoveredStep.value > 0 && hoveredStep.type === 'inflow'
                ? `+$${hoveredStep.value}M`
                : `$${hoveredStep.value}M`}{' '}
              · Running Total: ${hoveredStep.end}M
            </span>
          </>
        ) : (
          <span className="font-sans text-[#94A3B8]">
            Hover over any waterfall bar to inspect unit-level capital delta
          </span>
        )}
      </div>

      {/* Responsive SVG Container */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full min-w-[520px] h-auto select-none"
          role="img"
          aria-label="Capital allocation waterfall chart"
        >
          {/* Horizontal Gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const val = Math.round(yMax * ratio);
            const y = yScale(val);
            return (
              <g key={ratio}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={chartWidth - padRight}
                  y2={y}
                  stroke="#334155"
                  strokeDasharray={ratio === 0 ? undefined : '3 3'}
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

          {/* Waterfall Bars & Connectors */}
          {steps.map((step, idx) => {
            const cx = padLeft + idx * stepWidth + stepWidth / 2;
            const x = cx - barWidth / 2;
            const topVal = Math.max(step.start, step.end);
            const botVal = Math.min(step.start, step.end);
            const yTop = yScale(topVal);
            const yBot = yScale(botVal);
            const height = Math.max(3, yBot - yTop);

            const fill =
              step.type === 'baseline'
                ? '#64748B'
                : step.type === 'inflow'
                  ? '#10B981'
                  : step.type === 'outflow'
                    ? '#F43F5E'
                    : '#06B6D4';

            const nextStep = steps[idx + 1];
            const connectorY = yScale(step.end);

            return (
              <g
                key={step.id}
                onMouseEnter={() => setHoveredId(step.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="cursor-pointer"
              >
                {/* Connector line to next bar */}
                {nextStep && (
                  <line
                    x1={x + barWidth}
                    y1={connectorY}
                    x2={padLeft + (idx + 1) * stepWidth + stepWidth / 2 - barWidth / 2}
                    y2={connectorY}
                    stroke="#475569"
                    strokeDasharray="2 2"
                    strokeWidth={1}
                  />
                )}

                <rect
                  x={x}
                  y={yTop}
                  width={barWidth}
                  height={height}
                  rx={3}
                  fill={fill}
                  opacity={hoveredId && hoveredId !== step.id ? 0.55 : 1}
                />

                {/* Value label above bar */}
                <text
                  x={cx}
                  y={yTop - 6}
                  textAnchor="middle"
                  fill="#F8FAFC"
                  fontSize="10"
                  fontWeight="600"
                  className="font-mono-tabular"
                >
                  {step.type === 'inflow' ? `+${step.value}` : step.value}
                </text>

                {/* X-Axis label */}
                <text
                  x={cx}
                  y={chartHeight - 26}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="10"
                >
                  {step.label.length > 11
                    ? `${step.label.slice(0, 10)}…`
                    : step.label}
                </text>
                {step.horizon && (
                  <text
                    x={cx}
                    y={chartHeight - 12}
                    textAnchor="middle"
                    fill="#64748B"
                    fontSize="9"
                    className="font-mono-tabular"
                  >
                    {step.horizon}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
