"use client";

import { useEffect, useState, useCallback } from 'react';
import { useUserStore } from '@/store/userStore';
import { AlertCircle, ChevronDown, Loader2, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

/* ─── Constants ───────────────────────────────────────────────────────────── */
const MAX_RANK = 150000;
const MIN_RANK = 1;

// Re-ordered exactly as requested: General, EWS, OBC-A, OBC-B, SC, ST
const CATEGORIES: { value: string; label: string }[] = [
  { value: 'GENERAL', label: 'General (Open)' },
  { value: 'EWS',     label: 'EWS'            },
  { value: 'OBC-A',   label: 'OBC-A'          },
  { value: 'OBC-B',   label: 'OBC-B'          },
  { value: 'SC',      label: 'SC'             },
  { value: 'ST',      label: 'ST'             },
  { value: 'TFW',     label: 'TFW'            },
];

const QUOTA_OPTIONS  = ['Home State', 'All India'] as const;
const SEAT_OPTIONS = ['WBJEE Seats', 'JEE(Main) Seats'] as const;
const ROUND_OPTIONS  = ['All Rounds', 'Round 1', 'Round 2'] as const;

/* ─── Toggle group ─────────────────────────────────────────────────────────
   A pill-style segmented control that adapts to both themes via CSS vars.
   On very small screens, labels that are too long wrap or shrink gracefully.
─────────────────────────────────────────────────────────────────────────── */
function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[] | readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  // Normalise string[] to {value, label}[]
  const normalised = (options as (T | { value: T; label: string })[]).map((o) =>
    typeof o === 'string' ? { value: o as T, label: o as string } : o
  );

  return (
    <div
      className={`grid w-full rounded-xl p-1 gap-1 overflow-hidden ${
  normalised.length === 3 ? "grid-cols-3" : "grid-cols-2"
}`}
      style={{
        background:  'var(--input-bg)',
        border:      '1px solid var(--border-solid)',
      }}
    >
      {normalised.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`w-full min-w-0 py-2 px-1 rounded-lg text-[10px] sm:text-[11px] font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 whitespace-nowrap overflow-hidden text-ellipsis ${
              active
                ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-[0_0_12px_rgba(37,99,235,0.3)]'
                : 'bg-transparent hover:opacity-80'
            }`}
            style={{
              color:      active ? '#ffffff' : 'var(--text-muted)',
              minHeight:  '36px',
              transition: 'all 0.25s ease',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Label ──────────────────────────────────────────────────────────────── */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="block text-[10px] font-bold uppercase tracking-[0.12em] mb-2"
      style={{ color: 'var(--text-subtle)' }}
    >
      {children}
    </label>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function PredictorPage() {
  const { user } = useUserStore();
  const router   = useRouter();

  const [rankRaw,  setRankRaw]  = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [quota,    setQuota]    = useState<'Home State' | 'All India'>('Home State');
  const [seatType, setSeatType] = useState<'WBJEE Seats' | 'JEE(Main) Seats'>('WBJEE Seats');
  const [round,    setRound]    = useState<'All Rounds' | 'Round 1' | 'Round 2'>('All Rounds');
  const [rankError, setRankError] = useState('');
  const [loading,   setLoading]   = useState(false);
  const [mounted,   setMounted]   = useState(false);

  /* Wait for client-side hydration (Zustand reads localStorage) */
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* Rank validation — runs on every keystroke for real-time feedback */
  const validateRank = useCallback((raw: string): string => {
    if (!raw) return '';
    const n = Number(raw);
    if (isNaN(n) || !Number.isInteger(n)) return `Please enter a whole number.`;
    if (n < MIN_RANK || n > MAX_RANK)
      return `Please enter a valid WBJEE rank between ${MIN_RANK.toLocaleString()} and ${MAX_RANK.toLocaleString()}.`;
    return '';
  }, []);

  /* ── Pre-hydration or auth-checking: return null ── */
  if (!mounted || !user || !user.isProfileComplete) return null;
  const handleRankChange = (raw: string) => {
    setRankRaw(raw);
    setRankError(validateRank(raw));
  };

  const isRankValid = rankRaw !== '' && validateRank(rankRaw) === '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateRank(rankRaw);
    if (err) { setRankError(err); return; }
    if (!isRankValid) return;

    setLoading(true);
    const params = new URLSearchParams({
      rank:      rankRaw,
      category,
      quota,
      seatType,
      round,
    });
    router.push(`/results?${params.toString()}`);
  };

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div
      className="min-h-[calc(100vh-60px)] flex-grow flex flex-col items-center justify-center px-4 pt-16 sm:pt-20 pb-20 sm:pb-24 relative overflow-hidden w-full"
      style={{ background: 'var(--bg)' }}
    >
      {/* Ambient glows — matching Home Page exactly */}
      <div
        className="absolute top-[-12%] left-[-8%] w-[45%] h-[45%] rounded-full pointer-events-none"
        style={{ background: 'var(--glow-a)', filter: 'blur(60px)' }}
      />
      <div
        className="absolute bottom-[-10%] right-[-8%] w-[40%] h-[40%] rounded-full pointer-events-none"
        style={{ background: 'var(--glow-b)', filter: 'blur(55px)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[720px] z-10"
      >
        {/* ── Page header ── */}
        <div className="text-center mb-6 sm:mb-8">
<h1
  className="text-[1.8rem] sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.15] mb-3"
  style={{ color: 'var(--text)' }}
>
  Discover Your Best
  <br />
  <span className="text-gradient-animated">
    WBJEE College
  </span>
</h1>
<p
  className="text-sm sm:text-base leading-relaxed max-w-[500px] mx-auto"
  style={{ color: 'var(--text-muted)' }}
>
  Find colleges that match your rank using real WBJEE cutoff data.
</p>
        </div>

        <div className="max-w-[480px] mx-auto">

{/* ── Form card ── */}
  <div
    className="rounded-2xl overflow-hidden glass-card shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]"
    style={{
      border: '1px solid var(--border)',
    }}
  >
          {/* Accent top bar */}
          <div className="h-[3px] bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-400" />

          <form onSubmit={handleSubmit} className="p-5 sm:p-6 lg:p-7 space-y-5" noValidate>

            {/* ── RANK ── */}
            <div>
              <FieldLabel>WBJEE General Merit Rank (GMR)</FieldLabel>
              <div className="relative">
                {/* # prefix */}
                <span
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-base sm:text-lg font-bold select-none pointer-events-none"
                  style={{ color: 'var(--text-subtle)' }}
                >
                  #
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={MIN_RANK}
                  max={MAX_RANK}
                  value={rankRaw}
                  onKeyDown={(e) => ['e', 'E', '+', '-', '.'].includes(e.key) && e.preventDefault()}
                  onWheel={(e) => e.currentTarget.blur()}
                  onChange={(e) => handleRankChange(e.target.value)}
                  placeholder="e.g. 4500"
                  autoComplete="off"
                  className="w-full pl-10 pr-4 py-3.5 text-xl sm:text-2xl font-bold rounded-xl outline-none transition-all duration-200"
                  style={{
                    background:   'var(--input-bg)',
                    border:       `1.5px solid ${rankError ? '#ef4444' : 'var(--border-solid)'}`,
                    color:        'var(--text)',
                    caretColor:   '#3b82f6',
                  }}
                  onFocus={(e) => {
                    if (!rankError)
                      (e.currentTarget as HTMLElement).style.borderColor = '#3b82f6';
                  }}
                  onBlur={(e) => {
                    if (!rankError)
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-solid)';
                  }}
                />
              </div>
              {/* Real-time error */}
              {rankError && (
                <div className="flex items-start gap-1.5 mt-2 text-red-400 text-xs leading-snug">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{rankError}</span>
                </div>
              )}
              {/* Max rank hint */}
              {!rankError && (
                <p className="mt-1.5 text-[11px]" style={{ color: 'var(--text-subtle)' }}>
                  Valid range: 1 – 1,50,000
                </p>
              )}
            </div>

            {/* ── CATEGORY ── */}
            <div>
              <FieldLabel>Category</FieldLabel>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 pr-10 py-3.5 rounded-xl font-medium text-sm outline-none appearance-none cursor-pointer transition-all duration-200"
                  style={{
                    background: 'var(--input-bg)',
                    border:     '1.5px solid var(--border-solid)',
                    color:      'var(--text)',
                  }}
                  onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#3b82f6'; }}
                  onBlur={(e)  => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-solid)'; }}
                >
                  {CATEGORIES.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <ChevronDown
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: 'var(--text-subtle)' }}
                />
              </div>
            </div>

            {/* ── QUOTA + SEAT TYPE ── stacked always, side-by-side on sm+ ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Domicile Quota</FieldLabel>
                <ToggleGroup
                  options={QUOTA_OPTIONS}
                  value={quota}
                  onChange={(v) => setQuota(v as typeof quota)}
                />
              </div>
              <div>
                <FieldLabel>Seat Type</FieldLabel>
                <ToggleGroup
                  options={SEAT_OPTIONS}
                  value={seatType}
                  onChange={(v) => setSeatType(v as typeof seatType)}
                />
              </div>
            </div>

            {/* ── ROUND ── */}
            <div>
              <FieldLabel>Target Round Analysis</FieldLabel>
              <ToggleGroup
                options={ROUND_OPTIONS}
                value={round}
                onChange={(v) => setRound(v as typeof round)}
              />
            </div>

            {/* ── SUBMIT ── */}
            <button
              type="submit"
              disabled={loading || (rankRaw !== '' && !isRankValid)}
              className="w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background:  isRankValid || !rankRaw
                  ? 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)'
                  : 'var(--border-solid)',
                color:       '#fff',
                boxShadow:   (isRankValid || !rankRaw)
                  ? '0 0 20px rgba(37,99,235,0.30)'
                  : 'none',
                minHeight:   '52px',
              }}
              onMouseEnter={(e) => {
                if (!loading && (isRankValid || !rankRaw))
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 0 32px rgba(37,99,235,0.50)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.boxShadow = (isRankValid || !rankRaw)
                  ? '0 0 20px rgba(37,99,235,0.30)'
                  : 'none';
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating Predictions…
                </>
              ) : (
                <>
                  Generate Predictions
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      
      </div>

        {/* Footer note */}
        <p className="text-center text-[11px] mt-5 font-medium" style={{ color: 'var(--text-subtle)' }}>
          Based on WBJEE 2025 cutoff trends for 2026 admission guidance.
        </p>
      </motion.div>
    </div>
  );
}
