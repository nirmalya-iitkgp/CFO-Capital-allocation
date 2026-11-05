# Meridian Capital — Dynamic Capital Allocation & Portfolio Optimization Engine

Meridian Capital is an institutional dark-mode portfolio intelligence dashboard that transforms static corporate strategy frameworks into a live quantitative capital allocation engine. By combining product-line unit financials (revenue, growth rate, market share, gross margin) with automated **GE-McKinsey 9-Box Matrix** positioning and **McKinsey Three Horizons** modeling, strategy leaders can run real-time reinvestment simulations, test WACC/hurdle-rate sensitivity, and project 3-year ROI trajectories.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and product choices reflect your confirmed preferences and are locked for implementation:

- **Confirmed Decision 1 — Persistence & Portability**: Portfolio models, product-line unit financials, and simulation scenarios are persisted in browser `localStorage` with full **JSON and CSV import/export** (including formula-injection sanitization and strict schema validation).
- **Confirmed Decision 2 — Strategic Frameworks**: The workspace focuses exclusively on the **GE-McKinsey 9-Box Matrix** (Industry Attractiveness vs. Competitive Strength) and **McKinsey Three Horizons** (Horizon 1 Core, Horizon 2 Emerging, Horizon 3 Transformational).
- **Confirmed Decision 3 — Financial Modeling Depth**: The reinvestment simulator includes **interactive capital budget sliders, configurable WACC / hurdle rate, and 3-year projected ROI & NPV trajectories**.
- **Confirmed Decision 4 — Deterministic Quantitative Engine**: All matrix positioning, capital reallocation ratios, waterfall bridges, and ROI projections are computed deterministically in TypeScript with zero external AI/LLM calls.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Automated & Interactive GE-McKinsey 9-Box Grid**: Automatically plots business units / product lines onto a 3×3 matrix based on Industry Attractiveness (market growth, margin profile) and Competitive Strength (relative market share, gross margin advantage). Strategists can also drag-and-adjust nodes directly across the 9-box grid to test strategic overrides and immediately see updated capital posture (*Invest / Grow*, *Selectivity / Earnings*, *Harvest / Divest*).
  2. **McKinsey Three Horizons Capital Simulator**: Maps every product line to Horizon 1 (Core), Horizon 2 (Emerging), or Horizon 3 (Transformational) R&D bets. Interactive budget sliders let users reallocate total available capital across horizons and individual units, comparing current baseline vs. simulated allocation.
  3. **WACC & 3-Year ROI Trajectory Engine**: Configurable WACC / hurdle rate slider (`5%–20%`) and reinvestment rate controls dynamically compute 3-year projected revenue, EBITDA/gross profit contribution, risk-adjusted ROI, and value-creation spread over WACC.
  4. **Capital Allocation Waterfall & Portfolio Ledger**: Visualizes how capital shifts from Harvest/Divest units into Invest/Grow and H2/H3 bets via an interactive waterfall chart, paired with a high-density, editable unit-financials ledger.
- **Target Audience / Persona**: Corporate Strategy VPs, Chief Strategy Officers, Venture Studio Partners, and PE/VC Portfolio Managers.
- **Key Value**: Replaces static slide decks with an auditable, real-time financial model where every strategic positioning change immediately quantifies capital reallocation and 3-year ROI impact.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Portfolio Onboarding & Preset Switching**: Loads with a realistic enterprise multi-horizon portfolio (e.g., *Meridian Enterprise Suite* with 8 product lines across H1–H3) stored in `localStorage`, with one-click switching to a *Venture Studio* preset, adding new product lines, or importing CSV/JSON.
  2. **9-Box Matrix Positioning & Drag-Override**: Users inspect auto-plotted product nodes on the 3×3 GE-McKinsey grid (sized by revenue, highlighted in neon cyan `#06B6D4` when selected). Dragging a node to another cell updates its strategic override and recalculates recommended capital weight.
  3. **Reinvestment & Hurdle-Rate Simulation**: Adjusting the total capital pool, Horizon 1/2/3 target ratio sliders, or WACC hurdle rate updates the **Capital Allocation Waterfall** (emerald `#10B981` inflows, amber/rose outflows) and **3-Year ROI Trajectory** chart in real time (<16ms).
  4. **Unit Financials & Security-Hardened Export**: Editing unit metrics inline (Revenue, Growth %, Market Share %, Gross Margin %, Horizon) immediately re-plots the matrix. Users can export sanitized CSV/JSON reports or reset to baseline.

- **Visual Identity & Theme**:
  - **Aesthetic Direction**: Institutional Dark-Mode Fintech / Bento Grid — high-craft, restrained, analytical precision.
  - **Color Palette & Mood**:
    - Dominant Canvas (`60%`): Deep Charcoal (`#0F172A`)
    - Structural Surfaces (`30%`): Elevated Slate (`#1E293B`) with crisp `1px solid #334155` hairline borders (single-elevation depth, no nested cards-within-cards)
    - Accent Budget (`10%`): Emerald Green (`#10B981`) for positive reinvestment inflows & above-WACC ROI; Neon Cyan (`#06B6D4`) for active/selected matrix nodes and simulated trajectory curves; Amber (`#F59E0B`) and Rose (`#F43F5E`) strictly for divestment/below-hurdle indicators paired with explicit text labels.
  - **Typography & Hierarchy**:
    - Display & Headings: `Plus Jakarta Sans` (SemiBold/Bold, optical tracking `+0.01em` for dark mode)
    - Body & Controls: `DM Sans` (Regular/Medium, 13px–15px)
    - Financial Data & Coordinates: `JetBrains Mono` with `font-variant-numeric: tabular-nums`
  - **Top Bar Contract**: Single-row, 3-zone header: Brand wordmark (`Meridian Capital`) on the left, 4 concise view/section links (`Matrix & Horizons`, `Capital Waterfall`, `ROI Projections`, `Portfolio Ledger`) in the center, and 1 primary action (`+ Add Product Line`) on the right.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Client-Side Deterministic Engine + `localStorage` Persistence**
  - *Chosen Approach*: Pure TypeScript financial & matrix calculation engine with automatic `localStorage` persistence and JSON/CSV import-export.
  - *Why*: Instantaneous (<16ms) slider and drag-and-drop feedback with zero network latency, complete data privacy for sensitive corporate financials, and zero external API dependencies.
  - *Alternatives Considered*: Backend database or LLM-generated recommendations (rejected per user preference for local persistence and no AI usage).

- **Decision 2 — Custom SVG Data Visualizations (Waterfall & 3-Year ROI Trajectory)**
  - *Chosen Approach*: Purpose-built, responsive SVG charts with interactive hover tooltips, tabular-nums axis labels, and smooth CSS transitions.
  - *Why*: Eliminates heavy charting library bundle bloat, guarantees exact alignment with `#0F172A` / `#10B981` / `#06B6D4` tokens, and ensures deterministic rendering in unit tests.

- **Decision 3 — Security-Hardened Import/Export & Input Validation**
  - *Chosen Approach*: Strict numeric clamping, prototype-pollution-safe JSON parsing, and CSV formula-injection neutralization (prefixing cells starting with `=`, `+`, `-`, `@`, `\t`, `\r` on export and stripping/escaping on import).
  - *Why*: Financial tools frequently import/export spreadsheets; neutralizing formula injection and malformed JSON prevents client-side security vulnerabilities.

---

## 4. Technical Architecture & Data Strategy

- **Architecture & Component Diagram**:
```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Meridian Capital (App Shell)                     │
│  Top Bar: [Meridian Capital] ── [4 Nav Links] ── [+ Add Product Line]   │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
┌─────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│  Portfolio Store    │  │  Quantitative Engine │  │  Security & I/O      │
│  (localStorage +    │─▶│  • GE-McKinsey 9-Box │─▶│  • CSV/JSON Parser   │
│   Preset Scenarios) │  │  • 3-Horizon Ratios  │  │  • Formula Sanitizer │
└────────┬────────────┘  │  • WACC & 3-Yr ROI   │  │  • Schema Validator  │
         │               └──────────┬───────────┘  └──────────────────────┘
         │                          │
         ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Bento Workspace Grid                             │
│  ┌───────────────────────────────────┐  ┌────────────────────────────┐  │
│  │  Interactive 3x3 GE-McKinsey Grid │  │  McKinsey 3 Horizons &     │  │
│  │  (Drag-and-adjust product nodes,  │  │  WACC / Budget Simulator   │  │
│  │   auto-score vs. manual override) │  │  (H1/H2/H3 sliders, WACC)  │  │
│  └───────────────────────────────────┘  └────────────────────────────┘  │
│  ┌───────────────────────────────────┐  ┌────────────────────────────┐  │
│  │  Capital Allocation Waterfall     │  │  3-Year ROI Trajectory     │  │
│  │  (Baseline -> Divest -> Reinvest) │  │  (Baseline vs. Simulated   │  │
│  └───────────────────────────────────┘  │   vs. WACC Hurdle Line)    │  │
│                                         └────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  Editable Unit Financials Ledger & Import/Export Toolbar          │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - `ProductUnit`: `id`, `name`, `horizon` (`'H1' | 'H2' | 'H3'`), `revenue` ($M), `growthRate` (%), `marketShare` (%), `grossMargin` (%), `industryAttractiveness` (1–100 computed or overridden), `competitiveStrength` (1–100 computed or overridden), `manualCellOverride` (`{ row: 0|1|2, col: 0|1|2 } | null`), `currentCapital` ($M).
  - `SimulationParams`: `totalCapitalPool` ($M), `waccRate` (%), `horizonTargets` (`{ h1: number, h2: number, h3: number }` summing to 100%), `reinvestmentEfficiency` (multiplier).
  - `PortfolioScenario`: `id`, `name`, `units: ProductUnit[]`, `params: SimulationParams`, `updatedAt: string`.

- **Interactive Component & State Mapping**:
  - **GE-McKinsey 9-Box Grid**: Renders 9 strategic cells (*Invest/Grow*, *Selectivity/Earnings*, *Harvest/Divest*). Supports HTML5 drag-and-drop and click-to-select on product nodes; dropping a node into a cell sets `manualCellOverride` and recalculates recommended capital allocation. Includes a `"Reset Overrides"` button to snap back to formula-derived positions.
  - **Three Horizons & WACC Simulator**: Sliders for Total Capital Pool, H1/H2/H3 target allocation percentages (auto-balancing to 100%), and WACC hurdle rate (`5%–20%`). Updates all downstream charts and KPIs immediately.
  - **Capital Allocation Waterfall**: Computes net capital delta per unit (`simulatedCapital - currentCapital`), grouping outflows (divestments/trims) and inflows (reinvestments) into a step-by-step waterfall bridge.
  - **3-Year ROI Trajectory**: Projects Year 0 through Year 3 cumulative value, annual ROI %, and WACC hurdle benchmark for both Baseline and Simulated allocations.
  - **Unit Financials Ledger**: Inline-editable table with search/horizon filter, add/delete unit modal/drawer, and sanitized CSV/JSON import & export.
  - **Verification & Testing**: Automated unit test suite covering matrix scoring, 3-horizon capital allocation math, 3-year ROI/WACC projections, and red-pill/blue-pill security tests (CSV injection, prototype pollution, malformed JSON, out-of-bounds numeric inputs).
