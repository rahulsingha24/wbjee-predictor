import { createClient } from '@supabase/supabase-js';
import { CutoffRecord } from '@/types';
import localCutoffs from '@/data/cutoffs.json';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://spzaghfqnyfvgqwbyuyk.supabase.co';

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNwemFnaGZxbnlmdmdxd2J5dXlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTYzOTYsImV4cCI6MjA5MTA3MjM5Nn0.ALgmfIItGKhYFji5tXkifcX5PSjzSn7LnOVEL0vkKek';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

type SupabaseRow = Record<string, unknown>;
type NormalizedRow = Record<string, unknown>;

const normalizeKey = (key: string) =>
  key
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9]/g, '');

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

const cleanText = (value?: string) =>
  typeof value === 'string'
    ? value.trim().toUpperCase().replace(/\s+/g, ' ')
    : '';

const normalizeCategoryValue = (category?: string) => {
  const value = cleanText(category);

  if (!value) return '';

  if (
    value === 'OPEN' ||
    value === 'GENERAL' ||
    value === 'GENERAL (OPEN)' ||
    value === 'OPEN CATEGORY'
  ) {
    return 'GENERAL';
  }

  if (
    value === 'OPEN (PWD)' ||
    value === 'GENERAL (PWD)' ||
    value === 'GENERAL (OPEN) (PWD)'
  ) {
    return 'GENERAL';
  }

  if (
    value === 'TFW' ||
    value === 'TUITION FEE WAIVER' ||
    value === 'TUITION FEE WAIVERS' ||
    value === 'TUITION FEE WAIVER (PWD)' ||
    value === 'TFW (PWD)'
  ) {
    return 'TFW';
  }

  if (/^OBC\s*[-]?\s*A/.test(value)) return 'OBC-A';
  if (/^OBC\s*[-]?\s*B/.test(value)) return 'OBC-B';

  if (value.startsWith('SC')) return 'SC';
  if (value.startsWith('ST')) return 'ST';
  if (value.startsWith('EWS')) return 'EWS';

  return value;
};

const isTruthy = (value: unknown) => {
  if (typeof value === 'boolean') return value;

  if (typeof value === 'string') {
    const v = value.trim().toUpperCase();
    return v === 'TRUE' || v === 'YES' || v === '1';
  }

  return !!value;
};

const normalizeForCompare = (value?: string) =>
  typeof value === 'string'
    ? value.trim().toUpperCase().replace(/\s+/g, ' ').replace(/\W+/g, '')
    : '';

const matchesText = (value?: string, target?: string) => {
  const a = normalizeForCompare(value);
  const b = normalizeForCompare(target);

  if (!a || !b) return false;

  return a === b || a.includes(b) || b.includes(a);
};

const getRowBaseCategory = (item: CutoffRecord): string => {
  return normalizeCategoryValue(item.category);
};

const getRowIsTFW = (item: CutoffRecord): boolean => {
  const category = cleanText(item.category);
  const program = cleanText(item.program);
  const tfwStatus = cleanText((item as any).tfwStatus);

  return (
    item.isTFW === true ||
    category === 'TUITION FEE WAIVER' ||
    category === 'TUITION FEE WAIVER (PWD)' ||
    category === 'TFW' ||
    category === 'TFW (PWD)' ||
    tfwStatus === 'YES' ||
    program.includes('(TFW)') ||
    program.endsWith(' TFW')
  );
};

const getRowIsPWD = (item: CutoffRecord): boolean => {
  const category = cleanText(item.category);

  return (
    item.isPWD === true ||
    category.includes('PWD')
  );
};

const getDisplayCategory = (item: CutoffRecord): string => {
  const baseCat = getRowBaseCategory(item);
  const isTFW = getRowIsTFW(item);
  const isPWD = getRowIsPWD(item);

  if (isTFW) {
    return isPWD ? 'TFW (PwD)' : 'TFW';
  }

  if (baseCat === 'GENERAL') {
    return isPWD ? 'General (Open) (PwD)' : 'General (Open)';
  }

  if (baseCat === 'OBC-A') return isPWD ? 'OBC-A (PwD)' : 'OBC-A';
  if (baseCat === 'OBC-B') return isPWD ? 'OBC-B (PwD)' : 'OBC-B';
  if (baseCat === 'SC') return isPWD ? 'SC (PwD)' : 'SC';
  if (baseCat === 'ST') return isPWD ? 'ST (PwD)' : 'ST';
  if (baseCat === 'EWS') return isPWD ? 'EWS (PwD)' : 'EWS';

  return item.category || '';
};

const mapSupabaseRow = (row: SupabaseRow): CutoffRecord => {
  const normal = normalizeRow(row);
  const rawCategory = getStringField(normal, 'Category');
  const normalizedCat = normalizeCategoryValue(rawCategory);

  const isTFW =
    normalizedCat === 'TFW' ||
    getStringField(normal, 'Program').toUpperCase().includes('(TFW)');

  const isPWD =
    rawCategory.toUpperCase().includes('PWD') ||
    getStringField(normal, 'PwD').toUpperCase() === 'TRUE';

  const finalCategory = normalizedCat === 'TFW' ? 'Tuition Fee Waiver' : rawCategory;

  return {
    id: getStringField(normal, 'Sr.No') || getStringField(normal, 'Institute') || '',
    round: getStringField(normal, 'Round'),
    institute: getStringField(normal, 'Institute'),
    program: getStringField(normal, 'Program'),
    quota: getStringField(normal, 'Quota'),
    category: finalCategory,
    isTFW,
    isPWD,
    openingRank: getNumericField(normal, 'Opening Rank'),
    closingRank: getNumericField(normal, 'Closing Rank'),
    stream: getStringField(normal, 'Stream'),
    seatType: getStringField(normal, 'Seat Type'),
  };
};

/* ─── Raw data loader ────────────────────────────────────────────────────── */
export async function fetchAllCutoffs(): Promise<CutoffRecord[]> {
  return (localCutoffs as any[]).map((item) => {
    const openingRank =
      typeof item.openingRank === 'string'
        ? parseInt(item.openingRank.replace(/,/g, ''), 10) || 0
        : Number(item.openingRank ?? 0);

    const closingRank =
      typeof item.closingRank === 'string'
        ? parseInt(item.closingRank.replace(/,/g, ''), 10) || 0
        : Number(item.closingRank ?? 0);

    const normalizedItem = {
      ...item,
      openingRank,
      closingRank,
      isTFW: isTruthy(item.isTFW) || cleanText(item.category) === 'TUITION FEE WAIVER',
      isPWD: isTruthy(item.isPWD) || cleanText(item.category).includes('PWD'),
      seatType: item.seatType || item.officialSeatType || '',
    };

    return normalizedItem;
  }) as CutoffRecord[];
}

/* ─── Prediction fetch ───────────────────────────────────────────────────── */
export async function fetchCutoffsForPrediction(
  category: string,
  options: {
    round?: string;
    quota?: string;
    type?: string;
    program?: string;
    district?: string;
    pwd?: boolean;
    seatType?: string;
  }
): Promise<CutoffRecord[]> {
  const allData = await fetchAllCutoffs();

  const selectedCategory = category || 'GENERAL';
  const userWantsPWD = options.pwd === true;

  /* 
    IMPORTANT ACCURACY RULES:

    GENERAL + No PwD:
      Only Open/General rows, no TFW, no PwD.

    GENERAL + PwD:
      Only Open/General PwD rows, no TFW.

    GENERAL_TFW + No PwD:
      Only TFW rows, no normal Open/General, no PwD.

    GENERAL_TFW + PwD:
      Only TFW + PwD rows.
      If dataset has no TFW PwD rows, return empty.
      Do NOT fall back to General PwD.

    SC/ST/EWS/OBC:
      Only their own category.
      PwD true means only that category PwD.
      PwD false excludes PwD.
  */
  let filtered = allData.filter((item) => {
    const rowBaseCat = getRowBaseCategory(item);
    const rowIsTFW = getRowIsTFW(item);
    const rowIsPWD = getRowIsPWD(item);

    if (selectedCategory === 'GENERAL_TFW') {
      return rowIsTFW && rowIsPWD === userWantsPWD;
    }

    if (selectedCategory === 'GENERAL') {
      return rowBaseCat === 'GENERAL' && !rowIsTFW && rowIsPWD === userWantsPWD;
    }

    return rowBaseCat === selectedCategory && !rowIsTFW && rowIsPWD === userWantsPWD;
  });

  /* Round */
  if (options.round && options.round !== 'All Rounds') {
    filtered = filtered.filter((item) => matchesText(item.round, options.round));
  }

  /* Quota */
  if (
    options.quota &&
    options.quota !== 'All' &&
    options.quota !== 'All Quotas' &&
    options.quota !== 'Both' &&
    options.quota !== 'Home State + All India'
  ) {
    filtered = filtered.filter((item) => matchesText(item.quota, options.quota));
  }

  /* Seat Type */
  if (options.seatType && options.seatType !== 'All') {
    filtered = filtered.filter((item) =>
      matchesText((item as any).officialSeatType || item.seatType, options.seatType)
    );
  }

  /* Institute Type */
  if (options.type && options.type !== 'All' && options.type !== 'All Types') {
    filtered = filtered.filter((item) => matchesText(item.type, options.type));
  }

  /* Program */
  if (options.program && options.program !== 'All' && options.program !== 'All Branches') {
    filtered = filtered.filter((item) => matchesText(item.program, options.program));
  }

  /* District */
  if (options.district && options.district !== 'All' && options.district !== 'All Districts') {
    filtered = filtered.filter((item) => matchesText(item.district, options.district));
  }

  /*
    Deduplication:
    Keep the best row for the exact same slot.
    Include TFW/PwD in key so different seat categories never collapse into each other.
  */
  const uniqueMap = new Map<string, CutoffRecord>();

  for (const item of filtered) {
    const seatType = (item as any).officialSeatType || item.seatType || 'Unknown';
    const rowIsTFW = getRowIsTFW(item) ? 'TFW' : 'NON_TFW';
    const rowIsPWD = getRowIsPWD(item) ? 'PWD' : 'NON_PWD';

    const key = [
      item.institute,
      item.program,
      item.quota,
      item.category,
      item.round,
      seatType,
      rowIsTFW,
      rowIsPWD,
    ].join('||');

    const existing = uniqueMap.get(key);

    if (!existing || item.closingRank < existing.closingRank) {
      uniqueMap.set(key, item);
    }
  }

  return Array.from(uniqueMap.values()).map((item) => ({
    ...item,
    category: getDisplayCategory(item),
    isTFW: getRowIsTFW(item),
    isPWD: getRowIsPWD(item),
    seatType: (item as any).officialSeatType || item.seatType || '',
  }));
}

export const getUniqueValues = async (key: keyof CutoffRecord) => {
  const data = await fetchAllCutoffs();
  return Array.from(new Set(data.map((item) => String(item[key] ?? '')))).sort();
};

/*
  Keep PwD visible for all categories in UI.
  This function may still be used by pages, so returning all categories prevents hiding.
*/
export const getCategoriesWithPwd = (): string[] => {
  return ['GENERAL', 'GENERAL_TFW', 'EWS', 'OBC-A', 'OBC-B', 'SC', 'ST'];
};