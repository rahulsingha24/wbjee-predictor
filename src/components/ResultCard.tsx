import { PredictionResult } from '@/types';

/* ─── Chance level styling ───────────────────────────────────────────────── */
const chanceConfig: Record<string, {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  ringColor: string;
}> = {
  SAFE: {
    label:       'Safe',
    badgeBg:     'rgba(16,185,129,0.12)',
    badgeText:   '#10b981',
    badgeBorder: 'rgba(16,185,129,0.30)',
    ringColor:   '#10b981',
  },
  MODERATE: {
    label:       'Moderate',
    badgeBg:     'rgba(245,158,11,0.12)',
    badgeText:   '#f59e0b',
    badgeBorder: 'rgba(245,158,11,0.30)',
    ringColor:   '#f59e0b',
  },
  RISKY: {
    label:       'Risky',
    badgeBg:     'rgba(239,68,68,0.12)',
    badgeText:   '#ef4444',
    badgeBorder: 'rgba(239,68,68,0.30)',
    ringColor:   '#ef4444',
  },
  NO_DATA: {
    label:       'No Data',
    badgeBg:     'rgba(100,116,139,0.12)',
    badgeText:   'var(--text-subtle)',
    badgeBorder: 'var(--border-solid)',
    ringColor:   'var(--border-solid)',
  },
};

/* ─── ResultCard ─────────────────────────────────────────────────────────── */
export default function ResultCard({ college, userRank }: { college: PredictionResult; userRank: number }) {
  const openingRank = college.openingRank || 0;
  const closingRank = college.closingRank || 0;

  const cfg = chanceConfig[college.predictionLevel] ?? chanceConfig.NO_DATA;

  return (
    <div
      style={{
        background:   'var(--rc-bg)',
        border:       `1px solid var(--rc-border)`,
        borderLeft:   `3px solid ${cfg.ringColor}`,
        borderRadius: 14,
        padding:      '16px',
        display:      'flex',
        flexDirection:'column',
        gap:          10,
        /* Prevent card from overflowing on narrow screens */
        minWidth:     0,
        overflow:     'hidden',
        boxSizing:    'border-box',
      }}
    >
      {/* ── Header: institute name + chance badge ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <h2
          style={{
            fontSize:   15,
            fontWeight: 700,
            color:      'var(--text)',
            lineHeight: 1.3,
            minWidth:   0,
            /* Allow long college names to wrap, not overflow */
            wordBreak:  'break-word',
            flex:       1,
          }}
        >
          {college.institute}
        </h2>
        <span
          style={{
            fontSize:     11,
            fontWeight:   700,
            padding:      '3px 9px',
            borderRadius: 50,
            border:       `1px solid ${cfg.badgeBorder}`,
            background:   cfg.badgeBg,
            color:        cfg.badgeText,
            whiteSpace:   'nowrap',
            flexShrink:   0,
          }}
        >
          {cfg.label}
        </span>
      </div>

      {/* ── Program ── */}
      <p
        style={{
          fontSize:   13,
          fontWeight: 600,
          color:      'var(--text-muted)',
          wordBreak:  'break-word',
        }}
      >
        {college.program}
      </p>

      {/* ── Stream (if available) ── */}
      {college.stream && (
        <p
          style={{
            fontSize:      11,
            fontWeight:    700,
            color:         '#8b5cf6',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {college.stream}
        </p>
      )}

      {/* ── Stats row: Opening / Closing / Round ── */}
      <div
        style={{
          display:      'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap:          0,
          background:   'var(--rc-stats-bg)',
          border:       '1px solid var(--rc-stats-border)',
          borderRadius: 10,
          overflow:     'hidden',
          marginTop:    4,
        }}
      >
        {[
          { label: 'Opening', value: openingRank.toLocaleString() },
          { label: 'Closing', value: closingRank.toLocaleString() },
          { label: 'Round',   value: String(college.round) },
        ].map((stat, i) => (
          <div
            key={stat.label}
            style={{
              padding:     '10px 4px',
              textAlign:   'center',
              borderRight: i < 2 ? '1px solid var(--rc-stats-border)' : 'none',
              minWidth:    0,
            }}
          >
            <span
              style={{
                display:      'block',
                fontSize:     9,
                fontWeight:   700,
                textTransform:'uppercase',
                letterSpacing:'0.08em',
                color:        'var(--text-subtle)',
                marginBottom: 3,
              }}
            >
              {stat.label}
            </span>
            <span
              style={{
                display:    'block',
                fontSize:   13,
                fontWeight: 700,
                color:      'var(--text)',
                /* Prevent very long rank numbers from overflowing on 320px */
                wordBreak:  'break-all',
              }}
            >
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* ── Meta info: district, category, quota ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
        {college.district && (
          <span
            style={{
              fontSize:     11,
              padding:      '2px 8px',
              borderRadius: 50,
              background:   'var(--surface-hover)',
              color:        'var(--text-muted)',
              border:       '1px solid var(--border)',
              whiteSpace:   'nowrap',
            }}
          >
            📍 {college.district}
          </span>
        )}
        {college.category && (
          <span
            style={{
              fontSize:     11,
              padding:      '2px 8px',
              borderRadius: 50,
              background:   'var(--surface-hover)',
              color:        'var(--text-muted)',
              border:       '1px solid var(--border)',
              whiteSpace:   'nowrap',
            }}
          >
            {college.category}
          </span>
        )}
        {college.quota && (
          <span
            style={{
              fontSize:     11,
              padding:      '2px 8px',
              borderRadius: 50,
              background:   'var(--surface-hover)',
              color:        'var(--text-muted)',
              border:       '1px solid var(--border)',
              whiteSpace:   'nowrap',
            }}
          >
            {college.quota}
          </span>
        )}
        {college.isTFW && (
          <span
            style={{
              fontSize:     11,
              padding:      '2px 8px',
              borderRadius: 50,
              background:   'rgba(245,158,11,0.10)',
              color:        '#f59e0b',
              border:       '1px solid rgba(245,158,11,0.25)',
              whiteSpace:   'nowrap',
            }}
          >
            TFW
          </span>
        )}
      </div>
    </div>
  );
}
