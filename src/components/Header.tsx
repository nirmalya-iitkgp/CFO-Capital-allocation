import React from 'react';
import { Plus } from 'lucide-react';

interface HeaderProps {
  onOpenAddModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAddModal }) => {
  return (
    <header className="sticky top-0 z-30 bg-[#0F172A]/95 backdrop-blur-sm border-b border-[#1E293B]">
      <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#top"
          className="font-display text-lg font-bold tracking-tight text-[#F8FAFC] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#06B6D4] focus-visible:outline-offset-4 rounded"
        >
          Meridian Capital
        </a>

        {/* Zone 2: 4 Concise Single-Line Navigation Links */}
        <nav
          aria-label="Primary sections"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#94A3B8]"
        >
          <a
            href="#matrix-horizons"
            className="hover:text-[#F8FAFC] hover:underline underline-offset-8 decoration-[#06B6D4] transition-colors whitespace-nowrap shrink-0"
          >
            Matrix &amp; Horizons
          </a>
          <a
            href="#capital-waterfall"
            className="hover:text-[#F8FAFC] hover:underline underline-offset-8 decoration-[#06B6D4] transition-colors whitespace-nowrap shrink-0"
          >
            Capital Waterfall
          </a>
          <a
            href="#roi-projections"
            className="hover:text-[#F8FAFC] hover:underline underline-offset-8 decoration-[#06B6D4] transition-colors whitespace-nowrap shrink-0"
          >
            ROI Projections
          </a>
          <a
            href="#dupont-workbench"
            className="hover:text-[#F8FAFC] hover:underline underline-offset-8 decoration-[#06B6D4] transition-colors whitespace-nowrap shrink-0"
          >
            DuPont &amp; EVA
          </a>
          <a
            href="#portfolio-ledger"
            className="hover:text-[#F8FAFC] hover:underline underline-offset-8 decoration-[#06B6D4] transition-colors whitespace-nowrap shrink-0"
          >
            Portfolio Ledger
          </a>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#0F172A] bg-[#10B981] hover:bg-[#34D399] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#06B6D4] focus-visible:outline-offset-2"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Add Product Line</span>
          </button>
        </div>
      </div>
    </header>
  );
};
