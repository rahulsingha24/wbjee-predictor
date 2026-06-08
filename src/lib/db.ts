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
  const rawCategory = getStringField(normal, 'Category');
  const normalizedCat = normalizeCategoryValue(rawCategory);
  
  const isTFW = normalizedCat === 'TFW' || getStringField(normal, 'Program').includes('TFW');
  const finalCategory = normalizedCat === 'TFW' ? 'GENERAL' : normalizedCat;

  return {
    id: getStringField(normal, 'Sr.No') || getStringField(normal, 'Institute') || '',
    round: getStringField(normal, 'Round'),
    institute: getStringField(normal, 'Institute'),
    program: getStringField(normal, 'Program'),
    quota: getStringField(normal, 'Quota'),
    category: finalCategory,
    isTFW: isTFW,
    openingRank: getNumericField(normal, 'Opening Rank'),
    closingRank: getNumericField(normal, 'Closing Rank'),
    stream: getStringField(normal, 'Stream'),
    seatType: getStringField(normal, 'Seat Type'),
  };
};

/* ─── Raw data loader ────────────────────────────────────────────────────── */
export async function fetchAllCutoffs(): Promise<CutoffRecord[]> {
  // Use local data which is complete and verified
  return (localCutoffs as any[]).map(item => ({
    ...item,
    openingRank: typeof item.openingRank === 'string' ? parseInt(item.openingRank.replace(/,/g, ''), 10) || 0 : item.openingRank,
    closingRank: typeof item.closingRank === 'string' ? parseInt(item.closingRank.replace(/,/g, ''), 10) || 0 : item.closingRank,
    isTFW: typeof item.isTFW === 'string' ? item.isTFW.toUpperCase() === 'TRUE' : !!item.isTFW,
    isPWD: typeof item.isPWD === 'string' ? item.isPWD.toUpperCase() === 'TRUE' : !!item.isPWD,
  })) as CutoffRecord[];
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
    pwd?:       boolean;
    seatType?:  string;
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

  /* 1. Category — Support PWD and GENERAL_TFW correctly based on row data */
  let filtered = allData.filter(item => {
    const rawCat = (item.category || '').trim();
    let rowBaseCat = '';
    
    if (rawCat.includes('Open')) rowBaseCat = 'GENERAL';
    else if (rawCat.includes('OBC - A')) rowBaseCat = 'OBC-A';
    else if (rawCat.includes('OBC - B')) rowBaseCat = 'OBC-B';
    else if (rawCat.includes('SC')) rowBaseCat = 'SC';
    else if (rawCat.includes('ST')) rowBaseCat = 'ST';
    else if (rawCat.includes('EWS')) rowBaseCat = 'EWS';
    else if (rawCat === 'Tuition Fee Waiver') rowBaseCat = 'TFW';
    
    const isRowPWD = item.isPWD === true || rawCat.includes('PwD');
    const isRowTFW = item.isTFW === true || rawCat === 'Tuition Fee Waiver';
    
    const isUserPWD = options.pwd === true;
    
    if (category === 'GENERAL_TFW') {
        if (isUserPWD) {
            if (isRowTFW) return isRowPWD; // Only return TFW seats if they are actually PwD
            if (rowBaseCat === 'GENERAL') return isRowPWD;
            return false;
        }
       if (isRowTFW) return true; // Match TFW seats
       if (rowBaseCat === 'GENERAL') {
           if (isRowPWD) return false;
           return true; 
       }
       return false;
    }
    
    if (rowBaseCat === category) {
       if (isUserPWD) return isRowPWD; // ONLY return PwD seats if user checked PwD
       if (isRowPWD) return false;     // Hide PwD seats if user didn't check PwD
       return true;
    }
    
    return false;
  });

  /* 2. Round */
  if (options.round && options.round !== 'All Rounds') {
    filtered = filtered.filter(item => matchesText(item.round, options.round));
  }

  /* 3. Quota — strict separation based on selection */
  if (options.quota && options.quota !== 'All' && options.quota !== 'All Quotas' && options.quota !== 'Both') {
    filtered = filtered.filter(item => matchesText(item.quota, options.quota));
  }

  /* Seat Type */
  if (options.seatType && options.seatType !== 'All') {
    // some cutoffs have `officialSeatType` and some might use `seatType` from old mappings
    filtered = filtered.filter(item => matchesText((item as any).officialSeatType || item.seatType, options.seatType));
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
    const seatT = (item as any).officialSeatType || item.seatType || 'Unknown';
    const key = `${item.institute}||${item.program}||${item.quota}||${item.category}||${item.round}||${seatT}`;
    const existing = uniqueMap.get(key);
    if (!existing || item.closingRank < existing.closingRank) {
      uniqueMap.set(key, item);
    }
  }

  return Array.from(uniqueMap.values()).map(item => {
    let displayCat = item.category;
    if (category === 'GENERAL_TFW') {
      if (displayCat === 'Open' || displayCat === 'Tuition Fee Waiver') {
        displayCat = 'General+TFW';
      } else if (displayCat === 'Open (PwD)' || displayCat === 'Tuition Fee Waiver (PwD)') {
        displayCat = 'General+TFW (PwD)';
      }
    } else {
      if (displayCat === 'Open') {
        displayCat = 'General (Open)';
      } else if (displayCat === 'Open (PwD)') {
        displayCat = 'General (Open) (PwD)';
      }
    }
    return { ...item, category: displayCat };
  });
}

export const getUniqueValues = async (key: keyof CutoffRecord) => {
  const data = await fetchAllCutoffs();
  return Array.from(new Set(data.map(item => String(item[key] ?? '')))).sort();
};

export const getCategoriesWithPwd = (): string[] => {
  const pwdCats = new Set<string>();
  (localCutoffs as any[]).forEach(item => {
    const isRowPWD = item.isPWD === 'TRUE' || item.isPWD === true || (item.category || '').includes('PwD');
    if (isRowPWD) {
      const rawCat = (item.category || '').trim();
      if (rawCat.includes('Open')) pwdCats.add('GENERAL');
      else if (rawCat.includes('OBC - A')) pwdCats.add('OBC-A');
      else if (rawCat.includes('OBC - B')) pwdCats.add('OBC-B');
      else if (rawCat.includes('SC')) pwdCats.add('SC');
      else if (rawCat.includes('ST')) pwdCats.add('ST');
      else if (rawCat.includes('EWS')) pwdCats.add('EWS');
    }
  });
  // GENERAL_TFW uses GENERAL's PwD seats too
  if (pwdCats.has('GENERAL')) {
    pwdCats.add('GENERAL_TFW');
  }
  return Array.from(pwdCats);
};
