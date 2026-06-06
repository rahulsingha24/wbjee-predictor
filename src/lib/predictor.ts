import { CutoffRecord, PredictionLevel, PredictionResult } from '@/types';

/* ─── Chance Bands ────────────────────────────────────────────────────────────
  SAFE       : rank is inside closing cutoff (rank ≤ closingRank)
  MODERATE   : rank up to 10% worse than closing cutoff
  RISKY      : rank 10–15% worse than closing cutoff
  NO_DATA    : rank more than 15% worse than closing cutoff
─────────────────────────────────────────────────────────────────────────────── */

export function calculatePrediction(
  rank: number,
  cutoff: CutoffRecord,
): PredictionResult {
  let chancePercentage = 0;
  let predictionLevel: PredictionLevel = 'NO_DATA';

  if (!cutoff.closingRank || cutoff.closingRank <= 0) {
    return { ...cutoff, predictionLevel, chancePercentage, smartScore: 0 };
  }

  const closing = cutoff.closingRank;
  const opening = cutoff.openingRank > 0
    ? cutoff.openingRank
    : Math.max(1, Math.floor(closing * 0.5));

  // Lower rank = better in WBJEE (rank 1 is best)
  if (rank <= closing) {
    predictionLevel  = 'SAFE';
    chancePercentage = 100;
  } else {
    const percentageOver = ((rank - closing) / closing) * 100;

    if (percentageOver <= 10) {
      predictionLevel  = 'MODERATE';
      chancePercentage = 50;
    } else if (percentageOver <= 15) {
      predictionLevel  = 'RISKY';
      chancePercentage = 10;
    } else {
      predictionLevel  = 'NO_DATA';
      chancePercentage = 0;
    }
  }

  // smartScore: for sorting within same chance group
  // Inside closing: smaller gap between rank and closing = better slot utilization
  // Outside closing: smaller gap = closer to cutoff = more realistic
  const smartScore = rank <= closing
    ? closing - rank          // inside → smaller gap = better utilised seat
    : rank - closing;         // outside → smaller gap = less risky

  return { ...cutoff, predictionLevel, chancePercentage, smartScore };
}

/* ─── Sort order ─────────────────────────────────────────────────────────────
  Sort priority:
    1. Chance level: RISKY > MODERATE > SAFE
    2. Within same level: by closing rank ascending (lower closing rank first)
─────────────────────────────────────────────────────────────────────────── */
const LEVEL_ORDER: Record<string, number> = {
  RISKY:      0,
  MODERATE:   1,
  SAFE:       2,
  NO_DATA:    99,
};

export function sortPredictions(predictions: PredictionResult[]): PredictionResult[] {
  return [...predictions].sort((a, b) => {
    const la = LEVEL_ORDER[a.predictionLevel] ?? 99;
    const lb = LEVEL_ORDER[b.predictionLevel] ?? 99;
    if (la !== lb) return la - lb;
    // Within same level: lower closing rank first
    if (a.closingRank !== b.closingRank) return a.closingRank - b.closingRank;
    return 0;
  });
}
