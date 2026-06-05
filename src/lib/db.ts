import { createClient } from '@supabase/supabase-js';
import { CutoffRecord } from '@/types';
import localCutoffs from '@/data/cutoffs.json';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://spzaghfqnyfvgqwbyuyk.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwemFnaGZxbnlmdmdxd2J5dXlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTYzOTYsImV4cCI6MjA5MTA3MjM5Nn0.ALgmfIItGKhYFji5tXkifcX5PSjzSn7LnOVEL0vkKek';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

type SupabaseRow = Record<string, unknown>;

type NormalizedRow = Record<string, unknown>;

const normalizeKey = (key: string) =>
  key.toString().trim().toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9]/g, '');

const normalizeRow = (row: SupabaseRow): NormalizedRow => {
  const normalized: NormalizedRow = {};
  for (const [key, value] of Object.entries(row)) {
    normalized[normalizeKey(key)] = value;
  }
  return normalized;
};

const parseRank = (value: string | number | undefined) => {
  if (typeof value === 'string') {
    return Number(value.replace(/,/g, '').trim()) || 0;
  }
  return Number(value ?? 0);
};

const getStringField = (row: NormalizedRow, key: string) => {
  const value = row[normalizeKey(key)];
  return typeof value === 'string' ? value.trim() : '';
};

const getNumericField = (row: NormalizedRow, key: string) => {
  const value = row[normalizeKey(key)];
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return parseRank(value);
  return 0;
};

const normalizeCategoryValue = (category?: string) => {
  const value = typeof category === 'string'
    ? category.trim().toUpperCase().replace(/\s+/g, ' ')
    : '';

  if (!value) return '';
  if (value === 'OPEN' || value === 'GENERAL' || value === 'GENERAL (OPEN)' || value === 'OPEN CATEGORY') return 'GENERAL';
  if (value === 'TFW' || value === 'TUITION FEE WAIVER' || value === 'TUITION FEE WAIVERS') return 'TFW';
  if (/^OBC\s*[-]?\s*A$/.test(value)) return 'OBC-A';
  if (/^OBC\s*[-]?\s*B$/.test(value)) return 'OBC-B';
  if (value === 'SC') return 'SC';
  if (value === 'ST') return 'ST';
  if (value === 'EWS') return 'EWS';
  return value;
};

const mapSupabaseRow = (row: SupabaseRow): CutoffRecord => {
  const normal = normalizeRow(row);
  return {
    id: getStringField(normal, 'Sr.No') || getStringField(normal, 'Institute') || '',
    round: getStringField(normal, 'Round'),
    institute: getStringField(normal, 'Institute'),
    program: getStringField(normal, 'Program'),
    quota: getStringField(normal, 'Quota'),
    category: normalizeCategoryValue(getStringField(normal, 'Category')),
    openingRank: getNumericField(normal, 'Opening Rank'),
    closingRank: getNumericField(normal, 'Closing Rank'),
    stream: getStringField(normal, 'Stream'),
    seatType: getStringField(normal, 'Seat Type'),
  };
};

/* ─── Raw data loader ────────────────────────────────────────────────────── */
export async function fetchAllCutoffs(): Promise<CutoffRecord[]> {
  // Use local data which is complete and verified
  // Supabase table is incomplete (missing entries in certain categories/quotas)
  return localCutoffs as CutoffRecord[];
}

/* ─── Prediction fetch ───────────────────────────────────────────────────── */
export async function fetchCutoffsForPrediction(
  category: string,
  options: {
    round?:     string;
    quota?:     string;
    type?:      string;
    program?:   string;
    district?:  string;
  }
): Promise<CutoffRecord[]> {

  const allData = await fetchAllCutoffs();

  const normalizeFilter = (value?: string) =>
    typeof value === 'string'
      ? value.trim().toUpperCase().replace(/\s+/g, ' ').replace(/\W+/g, '')
      : '';

  const matchesText = (value?: string, target?: string) => {
    const a = normalizeFilter(value);
    const b = normalizeFilter(target);
    return a === b || a.includes(b) || b.includes(a);
  };

  /* 1. Category — flexible match for variations like Open, GENERAL, TFW, Tuition Fee Waiver */
  const normalizedCategory = normalizeCategoryValue(category);
  let filtered = allData.filter(
    item => normalizeCategoryValue(item.category) === normalizedCategory
  );

  /* 2. Round */
  if (options.round && options.round !== 'All Rounds') {
    filtered = filtered.filter(item => matchesText(item.round, options.round));
  }

  /* 3. Quota — strict separation: Home State ≠ All India */
  if (options.quota && options.quota !== 'All' && options.quota !== 'All Quotas') {
    filtered = filtered.filter(item => matchesText(item.quota, options.quota));
  }

  /* 4. Institute type */
  if (options.type && options.type !== 'All') {
    filtered = filtered.filter(item => matchesText(item.type, options.type));
  }

  /* 5. Program */
  if (options.program && options.program !== 'All') {
    filtered = filtered.filter(item => matchesText(item.program, options.program));
  }

  /* 6. District */
  if (options.district && options.district !== 'All') {
    filtered = filtered.filter(item => matchesText(item.district, options.district));
  }

  /* 7. Deduplication: keep best (lowest) closing rank per unique slot */
  const uniqueMap = new Map<string, CutoffRecord>();
  for (const item of filtered) {
    const key = `${item.institute}||${item.program}||${item.quota}||${item.category}||${item.round}`;
    const existing = uniqueMap.get(key);
    if (!existing || item.closingRank < existing.closingRank) {
      uniqueMap.set(key, item);
    }
  }

  return Array.from(uniqueMap.values());
}

export const getUniqueValues = async (key: keyof CutoffRecord) => {
  const data = await fetchAllCutoffs();
  return Array.from(new Set(data.map(item => String(item[key] ?? '')))).sort();
};
