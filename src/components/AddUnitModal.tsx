import React, { useState } from 'react';
import { X } from 'lucide-react';
import { HorizonType, ProductUnit } from '../types/portfolio';
import { clampNumber, sanitizeText } from '../utils/security';

interface AddUnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUnit: (unit: ProductUnit) => void;
}

export const AddUnitModal: React.FC<AddUnitModalProps> = ({
  isOpen,
  onClose,
  onAddUnit,
}) => {
  const [name, setName] = useState('');
  const [horizon, setHorizon] = useState<HorizonType>('H2');
  const [revenue, setRevenue] = useState('45');
  const [growthRate, setGrowthRate] = useState('28');
  const [marketShare, setMarketShare] = useState('15');
  const [grossMargin, setGrossMargin] = useState('68');
  const [currentCapital, setCurrentCapital] = useState('18');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = sanitizeText(name || 'New Strategic Unit', 48);
    const newUnit: ProductUnit = {
      id: `unit-${Date.now()}`,
      name: cleanName,
      horizon,
      revenue: clampNumber(revenue, 0.5, 50000, 45),
      growthRate: clampNumber(growthRate, -40, 200, 28),
      marketShare: clampNumber(marketShare, 0.5, 95, 15),
      grossMargin: clampNumber(grossMargin, 5, 95, 68),
      currentCapital: clampNumber(currentCapital, 0.1, 10000, 18),
      manualCellOverride: null,
    };
    onAddUnit(newUnit);
    setName('');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-unit-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <div className="w-full max-w-md bg-[#1E293B] border border-[#334155] rounded-lg p-6">
        <div className="flex items-center justify-between pb-3 border-b border-[#334155]">
          <h2
            id="add-unit-title"
            className="font-display text-base font-semibold text-[#F8FAFC]"
          >
            Add Product Line
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 text-[#94A3B8] hover:text-[#F8FAFC] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="unit-name"
              className="block text-xs font-medium text-[#94A3B8] mb-1"
            >
              Product Line Name
            </label>
            <input
              id="unit-name"
              type="text"
              required
              maxLength={48}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Real-Time Clearing API"
              className="w-full bg-[#0F172A] text-[#F8FAFC] text-sm px-3 py-2 rounded border border-[#334155] focus:border-[#06B6D4] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="unit-horizon"
                className="block text-xs font-medium text-[#94A3B8] mb-1"
              >
                McKinsey Horizon
              </label>
              <select
                id="unit-horizon"
                value={horizon}
                onChange={(e) => setHorizon(e.target.value as HorizonType)}
                className="w-full bg-[#0F172A] text-[#F8FAFC] text-sm px-3 py-2 rounded border border-[#334155] focus:border-[#06B6D4] focus:outline-none"
              >
                <option value="H1">H1 · Core</option>
                <option value="H2">H2 · Emerging</option>
                <option value="H3">H3 · Transformational</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="unit-revenue"
                className="block text-xs font-medium text-[#94A3B8] mb-1"
              >
                Annual Revenue ($M)
              </label>
              <input
                id="unit-revenue"
                type="number"
                step="0.5"
                min="0.5"
                max="50000"
                required
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                className="w-full font-mono-tabular bg-[#0F172A] text-[#F8FAFC] text-sm px-3 py-2 rounded border border-[#334155] focus:border-[#06B6D4] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="unit-growth"
                className="block text-xs font-medium text-[#94A3B8] mb-1"
              >
                YoY Growth Rate (%)
              </label>
              <input
                id="unit-growth"
                type="number"
                step="1"
                min="-40"
                max="200"
                required
                value={growthRate}
                onChange={(e) => setGrowthRate(e.target.value)}
                className="w-full font-mono-tabular bg-[#0F172A] text-[#F8FAFC] text-sm px-3 py-2 rounded border border-[#334155] focus:border-[#06B6D4] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="unit-share"
                className="block text-xs font-medium text-[#94A3B8] mb-1"
              >
                Market Share (%)
              </label>
              <input
                id="unit-share"
                type="number"
                step="0.5"
                min="0.5"
                max="95"
                required
                value={marketShare}
                onChange={(e) => setMarketShare(e.target.value)}
                className="w-full font-mono-tabular bg-[#0F172A] text-[#F8FAFC] text-sm px-3 py-2 rounded border border-[#334155] focus:border-[#06B6D4] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="unit-margin"
                className="block text-xs font-medium text-[#94A3B8] mb-1"
              >
                Gross Margin (%)
              </label>
              <input
                id="unit-margin"
                type="number"
                step="1"
                min="5"
                max="95"
                required
                value={grossMargin}
                onChange={(e) => setGrossMargin(e.target.value)}
                className="w-full font-mono-tabular bg-[#0F172A] text-[#F8FAFC] text-sm px-3 py-2 rounded border border-[#334155] focus:border-[#06B6D4] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="unit-capital"
                className="block text-xs font-medium text-[#94A3B8] mb-1"
              >
                Current Capital ($M)
              </label>
              <input
                id="unit-capital"
                type="number"
                step="0.5"
                min="0.1"
                max="10000"
                required
                value={currentCapital}
                onChange={(e) => setCurrentCapital(e.target.value)}
                className="w-full font-mono-tabular bg-[#0F172A] text-[#F8FAFC] text-sm px-3 py-2 rounded border border-[#334155] focus:border-[#06B6D4] focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#334155]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] bg-[#0F172A] border border-[#334155] rounded-md cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-[#0F172A] bg-[#10B981] hover:bg-[#34D399] rounded-md cursor-pointer"
            >
              Add to Portfolio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
