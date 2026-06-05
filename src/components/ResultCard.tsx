import { PredictionResult } from '@/types';

const chanceStyles: Record<string, { label: string; badgeColor: string }> = {
  SAFE: { label: 'Safe', badgeColor: 'bg-green-100 text-green-800 border-green-300' },
  MODERATE: { label: 'Moderate', badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  RISKY: { label: 'Risky', badgeColor: 'bg-red-100 text-red-800 border-red-300' },
  NO_DATA: { label: 'No Data', badgeColor: 'bg-slate-100 text-slate-800 border-slate-300' },
};

export default function ResultCard({ college, userRank }: { college: PredictionResult; userRank: number }) {
  const openingRank = college.openingRank || 0;
  const closingRank = college.closingRank || 0;
  const rank = userRank || 0;

  const chance = chanceStyles[college.predictionLevel] ?? chanceStyles.NO_DATA;

  return (
    <div className="bg-white shadow-md rounded-xl p-6 border border-gray-100 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start gap-4 mb-3">
          <h2 className="text-xl font-bold text-gray-900 leading-snug">{college.institute}</h2>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${chance.badgeColor} shrink-0`}>
            {chance.label}
          </span>
        </div>

        <p className="text-gray-700 font-medium my-2">{college.program}</p>

        {college.stream && (
          <p className="text-xs text-purple-600 font-semibold uppercase tracking-wider mt-2 mb-4">
            {college.stream}
          </p>
        )}

        <div className="mt-6 grid grid-cols-3 gap-2 bg-gray-50 p-4 rounded-lg text-center border border-gray-100">
          <div>
            <span className="block text-gray-500 font-semibold text-[10px] tracking-wide">OPENING</span>
            <span className="text-sm font-bold text-gray-800 block mt-1">{openingRank.toLocaleString()}</span>
          </div>
          <div className="border-x border-gray-200">
            <span className="block text-gray-500 font-semibold text-[10px] tracking-wide">CLOSING</span>
            <span className="text-sm font-bold text-gray-800 block mt-1">{closingRank.toLocaleString()}</span>
          </div>
          <div>
            <span className="block text-gray-500 font-semibold text-[10px] tracking-wide">ROUND</span>
            <span className="text-sm font-bold text-gray-800 block mt-1">{college.round}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
