import cutoffsData from './cutoffs.json';

export type CutoffRecord = {
  round: string;
  institute: string;
  program: string;
  quota: string;
  category: string;
  openingRank: number;
  closingRank: number;
  isTFW: boolean;
  type: string;
  district: string;
};

export const datasets = cutoffsData as CutoffRecord[];

// Extract unique values for filters
export const getUniqueValues = (key: keyof CutoffRecord) => {
  return Array.from(new Set(datasets.map((item) => item[key]))).sort();
};

export const categories = getUniqueValues('category');
export const institutes = getUniqueValues('institute');
export const programs = getUniqueValues('program');
export const rounds = getUniqueValues('round');
export const districts = getUniqueValues('district');

export type PredictionLevel = 'SAFE' | 'MODERATE' | 'RISKY' | 'VERY_LOW' | 'NO_DATA';

export interface PredictionResult extends CutoffRecord {
  predictionLevel: PredictionLevel;
  chancePercentage: number;
}

export function predictColleges(
  rank: number,
  category: string,
  options: {
    round?: string;
    isTFW?: boolean;
    type?: string;
    program?: string;
    district?: string;
  }
): PredictionResult[] {
  let filtered = datasets.filter((item) => item.category === category);

  if (options.round && options.round !== 'All Rounds') {
    filtered = filtered.filter((item) => item.round === options.round);
  }
  
  // TFW Logic: if user specifies TFW preference, we map it exactly or include both if not specified.
  if (options.isTFW !== undefined) {
    filtered = filtered.filter((item) => item.isTFW === options.isTFW);
  }

  if (options.type && options.type !== 'All') {
    filtered = filtered.filter((item) => item.type === options.type);
  }

  if (options.program && options.program !== 'All') {
    filtered = filtered.filter((item) => item.program === options.program);
  }

  if (options.district && options.district !== 'All') {
    filtered = filtered.filter((item) => item.district === options.district);
  }

  const results = filtered.map((item) => {
    let predictionLevel: PredictionLevel = 'NO_DATA';
    let chancePercentage = 0;

    if (item.closingRank === 0) {
      return { ...item, predictionLevel, chancePercentage };
    }

    const gap = item.closingRank - rank;
    const margin = gap / item.closingRank;

    if (rank <= item.closingRank * 0.8) {
      predictionLevel = 'SAFE';
      chancePercentage = 90 + Math.min(9, Math.floor(margin * 100));
    } else if (rank <= item.closingRank * 1.05) {
      predictionLevel = 'MODERATE';
      chancePercentage = 60 + Math.max(0, Math.floor(margin * 100));
    } else if (rank <= item.closingRank * 1.25) {
      predictionLevel = 'RISKY';
      // negative margin
      chancePercentage = 30 + Math.max(0, Math.floor((1 + margin) * 30));
    } else {
      predictionLevel = 'VERY_LOW';
      chancePercentage = Math.max(1, Math.floor((item.closingRank / rank) * 20));
    }

    if (chancePercentage > 99) chancePercentage = 99;

    return {
      ...item,
      predictionLevel,
      chancePercentage,
    };
  });

  // Sort by highest chance first, then by closing rank
  return results.sort((a, b) => {
    if (b.chancePercentage !== a.chancePercentage) {
      return b.chancePercentage - a.chancePercentage;
    }
    return a.closingRank - b.closingRank;
  });
}
