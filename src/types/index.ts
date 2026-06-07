export interface CutoffRecord {
  id?: string;
  round: string;
  institute: string;
  program: string;
  quota: string;
  category: string;
  openingRank: number;
  closingRank: number;
  district?: string;
  type?: string;
  isTFW?: boolean;
  isPWD?: boolean;
  stream?: string;
  seatType?: string;
}

export type PredictionLevel =
  | 'SAFE'
  | 'MODERATE'
  | 'RISKY'
  | 'NO_DATA';

export interface PredictionResult extends CutoffRecord {
  predictionLevel: PredictionLevel;
  chancePercentage: number;
  smartScore: number;
}
