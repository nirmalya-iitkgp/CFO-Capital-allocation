# Meridian Capital — Dynamic Capital Allocation & Portfolio Optimization Engine

Meridian Capital is an institutional dark-mode portfolio intelligence dashboard that combines product-line unit financials with automated **GE-McKinsey 9-Box Matrix** positioning and **McKinsey Three Horizons** modeling to generate dynamic capital reallocation recommendations, waterfall bridges, and 3-year ROI trajectories.

---

## Key Capabilities

1. **Interactive GE-McKinsey 9-Box Matrix**
   - Automatically plots product lines across **Industry Attractiveness** (composite of YoY revenue growth and gross margin) and **Competitive Strength** (composite of relative market share and gross margin).
   - Supports **drag-and-drop** node overrides across any of the 9 cells (*Invest / Grow*, *Selectivity / Earnings*, *Harvest / Divest*) with instant recalculation of recommended capital weights and one-click reset to formula-derived positions.

2. **McKinsey Three Horizons & WACC Simulator**
   - Maps every product line to **Horizon 1 (Core Cash Engines)**, **Horizon 2 (Emerging Growth)**, or **Horizon 3 (Transformational Bets)**.
   - Interactive sliders for **Total Capital Pool ($M)**, **WACC / Hurdle Rate (%)**, **Capital Efficiency**, and auto-rebalancing **H1 / H2 / H3 target ratios** (always summing to 100%).

3. **Capital Allocation Waterfall & 3-Year ROI Trajectory**
   - **Capital Allocation Waterfall**: Visualizes unit-level divestment/trim outflows and reinvestment inflows from the current baseline pool to the optimized allocation.
   - **3-Year ROI Trajectory**: Compares compounded portfolio value and cumulative ROI (%) for the Optimized Allocation against the Baseline Allocation and WACC Hurdle Benchmark.

4. **5-Step DuPont ROE Decomposition & EVA Workbench**
   - Decomposes Return on Equity ($\text{ROE} = \text{Tax Burden} \times \text{Interest Burden} \times \text{EBIT Margin} \times \text{Asset Turnover} \times \text{Equity Multiplier}$) alongside **ROA**, **ROIC**, and **Economic Value Added (EVA)** against the portfolio's WACC hurdle rate.
   - Interactive 5-driver stress-test sliders and a `+10%` relative lever sensitivity breakdown.

5. **Editable Unit Financials Ledger & Local Persistence**
   - Inline-editable table for Revenue ($M), Growth (%), Market Share (%), Gross Margin (%), Current Capital ($M), and Horizon, with search and horizon filtering.
   - Automatic `localStorage` persistence (`meridian_capital_portfolio_v1`) plus **JSON and CSV import/export**.

---

## Security & Data Integrity

- **CSV Formula Injection Protection**: Neutralizes leading formula characters (`=`, `+`, `-`, `@`, `\t`, `\r`) on CSV export and strips them on import.
- **Prototype Pollution & Schema Validation**: JSON imports reject payloads over 512KB, strip `__proto__`, `constructor`, and `prototype` keys, sanitize HTML/control characters, and clamp all numeric inputs to safe domain bounds.
- **Deterministic Quantitative Engine**: All calculations run deterministically in TypeScript with zero external AI/LLM calls.

---

## Running Tests & Build

```bash
# Run unit tests & red-pill/blue-pill security tests
npm test

# Type-check
npm run lint

# Production build
npm run build
```
