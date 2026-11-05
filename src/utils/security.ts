import {
  HorizonType,
  MatrixCellCoord,
  PositionedUnit,
  ProductUnit,
  SimulationParams,
} from '../types/portfolio';

const MAX_IMPORT_BYTES = 512 * 1024; // 512 KB cap
const FORMULA_PREFIX_REGEX = /^[=+\-@\t\r]/;
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Strips HTML tags, control characters, and trims whitespace to prevent XSS.
 */
export function sanitizeText(input: unknown, maxLen = 64): string {
  if (typeof input !== 'string') return 'Untitled Unit';
  const stripped = input
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim();
  if (!stripped) return 'Untitled Unit';
  return stripped.slice(0, maxLen);
}

/**
 * Validates and clamps numeric inputs, rejecting NaN, Infinity, and non-numbers.
 */
export function clampNumber(
  value: unknown,
  min: number,
  max: number,
  fallback: number
): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, Number(num.toFixed(2))));
}

/**
 * Neutralizes CSV formula injection (DDE / Excel / Sheets) on export.
 */
export function sanitizeCsvCell(value: string | number): string {
  const str = String(value ?? '');
  const neutralized = FORMULA_PREFIX_REGEX.test(str) ? `'${str}` : str;
  if (/[",\n\r]/.test(neutralized)) {
    return `"${neutralized.replace(/"/g, '""')}"`;
  }
  return neutralized;
}

/**
 * Strips leading formula-injection prefixes when importing untrusted CSV cells.
 */
export function unescapeCsvCell(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("'") && FORMULA_PREFIX_REGEX.test(cleaned.slice(1))) {
    cleaned = cleaned.slice(1);
  }
  while (FORMULA_PREFIX_REGEX.test(cleaned)) {
    cleaned = cleaned.slice(1);
  }
  return cleaned;
}

function validateHorizon(val: unknown): HorizonType {
  if (val === 'H1' || val === 'H2' || val === 'H3') return val;
  return 'H1';
}

function validateCellOverride(val: unknown): MatrixCellCoord | null {
  if (!val || typeof val !== 'object') return null;
  const record = val as Record<string, unknown>;
  const row = record.row;
  const col = record.col;
  if (
    (row === 0 || row === 1 || row === 2) &&
    (col === 0 || col === 1 || col === 2)
  ) {
    return { row, col };
  }
  return null;
}

export function sanitizeProductUnit(raw: unknown, index: number): ProductUnit {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<
    string,
    unknown
  >;
  return {
    id: sanitizeText(obj.id || `unit-${index + 1}`, 36).replace(
      /[^a-zA-Z0-9_-]/g,
      ''
    ) || `unit-${index + 1}`,
    name: sanitizeText(obj.name, 48),
    horizon: validateHorizon(obj.horizon),
    revenue: clampNumber(obj.revenue, 0.5, 50000, 25),
    growthRate: clampNumber(obj.growthRate, -40, 200, 12),
    marketShare: clampNumber(obj.marketShare, 0.5, 95, 15),
    grossMargin: clampNumber(obj.grossMargin, 5, 95, 55),
    currentCapital: clampNumber(obj.currentCapital, 0.1, 10000, 10),
    manualCellOverride: validateCellOverride(obj.manualCellOverride),
  };
}

/**
 * Safely parses and validates a JSON portfolio export, blocking prototype pollution.
 */
export function safeParsePortfolioJson(
  rawJson: string
):
  | { ok: true; units: ProductUnit[]; params: SimulationParams }
  | { ok: false; error: string } {
  if (typeof rawJson !== 'string' || rawJson.length > MAX_IMPORT_BYTES) {
    return { ok: false, error: 'Payload exceeds 512KB limit or is invalid.' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson, (key, value) => {
      if (FORBIDDEN_KEYS.has(key)) return undefined;
      return value;
    });
  } catch {
    return { ok: false, error: 'Malformed JSON syntax.' };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, error: 'Root JSON must be an object.' };
  }

  const root = parsed as Record<string, unknown>;
  if (!Array.isArray(root.units) || root.units.length === 0) {
    return { ok: false, error: 'Portfolio must contain at least one unit.' };
  }

  const units = root.units.slice(0, 50).map((u, idx) => sanitizeProductUnit(u, idx));

  const rawParams = (
    root.params && typeof root.params === 'object' ? root.params : {}
  ) as Record<string, unknown>;
  const rawTargets = (
    rawParams.horizonTargets && typeof rawParams.horizonTargets === 'object'
      ? rawParams.horizonTargets
      : {}
  ) as Record<string, unknown>;

  const h1 = clampNumber(rawTargets.h1, 0, 100, 60);
  const h2 = clampNumber(rawTargets.h2, 0, 100, 25);
  const h3 = clampNumber(rawTargets.h3, 0, 100, 15);
  const sum = h1 + h2 + h3;
  const normalizedTargets =
    sum > 0
      ? {
          h1: Math.round((h1 / sum) * 100),
          h2: Math.round((h2 / sum) * 100),
          h3: 100 - Math.round((h1 / sum) * 100) - Math.round((h2 / sum) * 100),
        }
      : { h1: 60, h2: 25, h3: 15 };

  const totalCurrent = units.reduce((acc, u) => acc + u.currentCapital, 0);

  const params: SimulationParams = {
    totalCapitalPool: clampNumber(
      rawParams.totalCapitalPool,
      1,
      50000,
      Math.max(10, Math.round(totalCurrent))
    ),
    waccRate: clampNumber(rawParams.waccRate, 3, 25, 10.5),
    horizonTargets: normalizedTargets,
    reinvestmentEfficiency: clampNumber(
      rawParams.reinvestmentEfficiency,
      0.7,
      1.4,
      1.0
    ),
  };

  return { ok: true, units, params };
}

/**
 * Exports positioned portfolio units to formula-safe CSV.
 */
export function exportPortfolioCsv(units: PositionedUnit[]): string {
  const headers = [
    'ID',
    'Product Line',
    'Horizon',
    'Revenue ($M)',
    'Growth (%)',
    'Market Share (%)',
    'Gross Margin (%)',
    'Current Capital ($M)',
    'Simulated Capital ($M)',
    'Capital Delta ($M)',
    'GE-McKinsey Posture',
    'Projected 3Y ROI (%)',
  ];

  const rows = units.map((u) =>
    [
      sanitizeCsvCell(u.id),
      sanitizeCsvCell(u.name),
      sanitizeCsvCell(u.horizon),
      sanitizeCsvCell(u.revenue),
      sanitizeCsvCell(u.growthRate),
      sanitizeCsvCell(u.marketShare),
      sanitizeCsvCell(u.grossMargin),
      sanitizeCsvCell(u.currentCapital),
      sanitizeCsvCell(u.simulatedCapital),
      sanitizeCsvCell(u.capitalDelta),
      sanitizeCsvCell(u.posture),
      sanitizeCsvCell(u.projected3YrRoi),
    ].join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Parses CSV text into sanitized ProductUnit[] records.
 */
export function parsePortfolioCsv(
  rawCsv: string
): { ok: true; units: ProductUnit[] } | { ok: false; error: string } {
  if (typeof rawCsv !== 'string' || rawCsv.length > MAX_IMPORT_BYTES) {
    return { ok: false, error: 'CSV exceeds 512KB limit or is invalid.' };
  }

  const lines = rawCsv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { ok: false, error: 'CSV must include a header row and at least one data row.' };
  }

  const units: ProductUnit[] = [];
  for (let i = 1; i < Math.min(lines.length, 51); i++) {
    const cols = lines[i].split(',').map((c) => unescapeCsvCell(c.replace(/^"|"$/g, '')));
    if (cols.length < 7) continue;
    units.push(
      sanitizeProductUnit(
        {
          id: cols[0] || `csv-${i}`,
          name: cols[1] || `Unit ${i}`,
          horizon: cols[2],
          revenue: Number(cols[3]),
          growthRate: Number(cols[4]),
          marketShare: Number(cols[5]),
          grossMargin: Number(cols[6]),
          currentCapital: Number(cols[7] ?? 10),
          manualCellOverride: null,
        },
        i - 1
      )
    );
  }

  if (units.length === 0) {
    return { ok: false, error: 'No valid product unit rows found in CSV.' };
  }

  return { ok: true, units };
}
