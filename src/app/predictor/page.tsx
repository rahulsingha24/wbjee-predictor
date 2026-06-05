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
      className="flex rounded-xl p-1 gap-0.5"
      style={{
        background:  'var(--toggle-bg)',
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
            className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            style={{
              background: active ? 'var(--toggle-active-bg)' : 'transparent',
              color:      active ? 'var(--toggle-active-text)' : 'var(--text-subtle)',
              boxShadow:  active ? '0 1px 4px rgba(0,0,0,0.18)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)';
            }}
            onMouseLeave={(e) => {
              if (!active) (e.currentTarget as HTMLElement).style.color = 'var(--text-subtle)';
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

  /* Auth guard — only runs after hydration so we don't redirect prematurely */
  useEffect(() => {
    if (!mounted) return;
    if (!user)                       router.push('/login');
    else if (!user.isProfileComplete) router.push('/onboarding');
  }, [user, router, mounted]);

  /* ── Pre-hydration: show loading spinner ── */
  if (!mounted) {
    return (
      <div className="min-h-[calc(100vh-60px)] flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#3b82f6' }} />
      </div>
    );
  }

  /* ── Post-hydration: not logged in → show login prompt ── */
  if (!user || !user.isProfileComplete) {
    return (
      <div className="min-h-[calc(100vh-60px)] flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
        <div className="text-center max-w-sm">
          <AlertCircle className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-subtle)' }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>Login Required</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Please sign in to use the college predictor.</p>
          <a
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all"
          >
            Go to Login <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  /* Rank validation — runs on every keystroke for real-time feedback */
  const validateRank = useCallback((raw: string): string => {
    if (!raw) return '';
    const n = Number(raw);
    if (isNaN(n) || !Number.isInteger(n)) return `Please enter a whole number.`;
    if (n < MIN_RANK || n > MAX_RANK)
      return `Please enter a valid WBJEE rank between ${MIN_RANK.toLocaleString()} and ${MAX_RANK.toLocaleString()}.`;
    return '';
  }, []);

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
      className="min-h-[calc(100vh-60px)] flex items-center justify-center px-4 py-10 relative overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      {/* Ambient glows */}
      <div
        className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'var(--glow-a)', filter: 'blur(100px)' }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'var(--glow-b)', filter: 'blur(100px)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[480px] z-10"
      >
        {/* ── Page header ── */}
        <div className="text-center mb-7">
          <h1
            className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-2"
            style={{ color: 'var(--text)' }}
          >
            Find Colleges for{' '}
            <span className="text-gradient-animated">Your Rank</span>
          </h1>
          <p className="text-sm sm:text-base" style={{ color: 'var(--text-muted)' }}>
            Get smart WBJEE college predictions using previous-year cutoff trends.
          </p>
        </div>

        {/* ── Form card ── */}
        <div
          className="rounded-2xl overflow-hidden shadow-xl"
          style={{
            background:  'var(--card-bg)',
            border:      '1px solid var(--border-solid)',
          }}
        >
          {/* Accent top bar */}
          <div className="h-[3px] bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-400" />

          <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5" noValidate>

            {/* ── RANK ── */}
            <div>
              <FieldLabel>WBJEE General Merit Rank (GMR)</FieldLabel>
              <div className="relative">
                {/* # prefix */}
                <span
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold select-none pointer-events-none"
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
                  onChange={(e) => handleRankChange(e.target.value)}
                  placeholder="e.g. 4500"
                  autoComplete="off"
                  className="w-full pl-10 pr-4 py-3.5 text-2xl font-bold rounded-xl outline-none transition-all duration-200"
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

            {/* ── QUOTA + SEAT TYPE (side-by-side on sm+, stacked on xs) ── */}
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
              className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background:  isRankValid || !rankRaw
                  ? 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)'
                  : 'var(--border-solid)',
                color:       '#fff',
                boxShadow:   (isRankValid || !rankRaw)
                  ? '0 0 20px rgba(37,99,235,0.30)'
                  : 'none',
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

        {/* Footer note */}
        <p className="text-center text-[11px] mt-4" style={{ color: 'var(--text-subtle)' }}>
          Based on WBJEE 2025 cutoff data. Predictions are for 2026 admissions.
        </p>
      </motion.div>
    </div>
  );
}
