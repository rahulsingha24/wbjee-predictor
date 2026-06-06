"use client";

import { useUserStore } from '@/store/userStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  LogOut, History, Bookmark, Settings, User,
  Edit3, ChevronRight, ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const {
    user, favorites, savedPredictions, preferences,
    updatePreferences, logout,
  } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    if (!user)                       router.push('/login');
    else if (!user.isProfileComplete) router.push('/onboarding');
  }, [user, router]);

  const handleLogout = () => { logout(); router.push('/'); };

  if (!user || !user.isProfileComplete) return null;

  const joinDate = user.joinedAt
    ? new Date(user.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Recently';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

      {/* ── Profile header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 mb-10 sm:mb-12">
        <div className="relative shrink-0">
          <div
            className="w-24 sm:w-28 h-24 sm:h-28 rounded-full p-1"
            style={{ border: '2px solid var(--border-solid)', background: 'var(--surface)' }}
          >
            <div
              className="w-full h-full rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.25), rgba(124,58,237,0.25))' }}
            >
              <span className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--text)' }}>
                {user.name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          </div>
          <button
            className="absolute bottom-0 right-0 p-2 rounded-full transition-colors"
            style={{
              background: 'var(--bg-secondary)',
              border:     '1px solid var(--border-solid)',
              color:      'var(--text-muted)',
            }}
            aria-label="Edit profile picture"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="text-center sm:text-left">
          <h1
            className="text-2xl sm:text-3xl font-bold mb-1"
            style={{ color: 'var(--text)' }}
          >
            {user.name}
          </h1>
          <p className="mb-3" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm"
            style={{
              background: 'var(--surface)',
              border:     '1px solid var(--border-solid)',
              color:      'var(--text-muted)',
            }}
          >
            <span>📅</span> Joined {joinDate}
          </div>
        </div>
      </div>

      {/* ── Main grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">

        {/* ── LEFT: Saved predictions + colleges ──────────────────────────── */}
        <div className="lg:col-span-2 space-y-8 sm:space-y-10">

          {/* Saved Predictions */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <History className="w-5 h-5 text-blue-400" /> Saved Predictions
              </h2>
              <button
                className="text-sm hover:underline"
                style={{ color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', minHeight: 36 }}
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {savedPredictions.length > 0 ? (
                savedPredictions.slice(0, 5).map((pred) => (
                  <div
                    key={pred.id}
                    className="p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors glass-card"
                    style={{ border: '1px solid var(--border-solid)' }}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-1.5">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                          style={{
                            background: 'rgba(37,99,235,0.12)',
                            color:      '#60a5fa',
                            border:     '1px solid rgba(37,99,235,0.25)',
                          }}
                        >
                          RANK {pred.rank}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {pred.category}, {pred.quota}
                        </span>
                      </div>
                      <p className="text-sm" style={{ color: 'var(--text)' }}>{pred.focus}</p>
                    </div>
                    <Link
                      href={`/results?rank=${pred.rank}&category=${pred.category}&quota=${pred.quota}&tfwStatus=Non-TFW&round=All Rounds`}
                      className="shrink-0"
                    >
                      <button
                        className="px-4 py-2 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
                        style={{
                          background: 'var(--surface-hover)',
                          color:      'var(--text)',
                          border:     '1px solid var(--border-solid)',
                          minHeight:  40,
                        }}
                      >
                        Reopen <ExternalLink className="w-3 h-3" />
                      </button>
                    </Link>
                  </div>
                ))
              ) : (
                /* Demo items when nothing is saved */
                <>
                  {[
                    { rank: 4500, cat: 'Gen', quota: 'Home State', focus: 'CSE, IT focus • Jadavpur, IEM' },
                    { rank: 8200, cat: 'OBC', quota: 'Home State', focus: 'ECE focus • Heritage, Techno Main' },
                  ].map((d, i) => (
                    <div
                      key={i}
                      className="p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card"
                      style={{ border: '1px solid var(--border-solid)' }}
                    >
                      <div>
                        <div className="flex items-center flex-wrap gap-2 mb-1.5">
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider"
                            style={{
                              background: 'rgba(37,99,235,0.12)',
                              color:      '#60a5fa',
                              border:     '1px solid rgba(37,99,235,0.25)',
                            }}
                          >
                            RANK {d.rank}
                          </span>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{d.cat}, {d.quota}</span>
                        </div>
                        <p className="text-sm" style={{ color: 'var(--text)' }}>{d.focus}</p>
                      </div>
                      <Link href="/predictor" className="shrink-0">
                        <button
                          className="px-4 py-2 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
                          style={{
                            background: 'var(--surface-hover)',
                            color:      'var(--text)',
                            border:     '1px solid var(--border-solid)',
                            minHeight:  40,
                          }}
                        >
                          Reopen <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </Link>
                    </div>
                  ))}
                </>
              )}
            </div>
          </section>

          {/* Saved Colleges */}
          <section>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Bookmark className="w-5 h-5 text-orange-400" /> Saved Colleges
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {favorites.length > 0 ? (
                favorites.slice(0, 6).map((name, idx) => (
                  <div
                    key={idx}
                    className="glass-card p-4 sm:p-5 rounded-2xl relative"
                    style={{ border: '1px solid var(--border-solid)' }}
                  >
                    <Bookmark className="w-4 h-4 text-orange-400 fill-orange-400 absolute top-4 right-4" />
                    <h3 className="font-bold text-sm mb-1 pr-6 leading-snug" style={{ color: 'var(--text)' }}>
                      {name}
                    </h3>
                    <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
                      West Bengal •{' '}
                      {name.toLowerCase().includes('government') || name.toLowerCase().includes('university') || name.toLowerCase().includes('jadavpur') || name.toLowerCase().includes('kalyani') || name.toLowerCase().includes('jalpaiguri')
                        ? 'Government'
                        : 'Private'
                      }
                    </p>
                    <div className="flex gap-2">
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{
                          background: 'var(--surface-hover)',
                          color:      'var(--text-muted)',
                          border:     '1px solid var(--border-solid)',
                        }}
                      >
                        CSE
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                /* Design demo cards */
                <>
                  {[
                    { name: 'Jadavpur University', loc: 'Kolkata', type: 'Government', tags: ['CSE', 'IT'] },
                    { name: 'IEM Kolkata', loc: 'Salt Lake', type: 'Private', tags: ['CSE'] },
                  ].map((c, i) => (
                    <div
                      key={i}
                      className="glass-card p-4 sm:p-5 rounded-2xl relative"
                      style={{ border: '1px solid var(--border-solid)' }}
                    >
                      <Bookmark className="w-4 h-4 text-orange-400 fill-orange-400 absolute top-4 right-4" />
                      <h3 className="font-bold text-sm mb-1 pr-6" style={{ color: 'var(--text)' }}>{c.name}</h3>
                      <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>{c.loc} • {c.type}</p>
                      <div className="flex gap-2">
                        {c.tags.map((t) => (
                          <span
                            key={t}
                            className="text-xs px-2 py-0.5 rounded"
                            style={{
                              background: 'var(--surface-hover)',
                              color:      'var(--text-muted)',
                              border:     '1px solid var(--border-solid)',
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </section>
        </div>

        {/* ── RIGHT: Preferences + Account ────────────────────────────────── */}
        <div className="space-y-5 sm:space-y-6">

          {/* Preferences */}
          <section
            className="glass-card p-5 sm:p-6 rounded-2xl"
            style={{ border: '1px solid var(--border-solid)' }}
          >
            <h2 className="text-lg font-bold mb-5 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <Settings className="w-5 h-5" style={{ color: 'var(--text-muted)' }} /> Preferences
            </h2>
            <div className="space-y-5">
              {[
                { key: 'darkMode' as const, label: 'Dark Mode', desc: 'Easier on the eyes' },
                { key: 'emailAlerts' as const, label: 'Email Alerts', desc: 'Cutoff updates' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{label}</p>
                    <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>{desc}</p>
                  </div>
                  <button
                    onClick={() => updatePreferences({ [key]: !preferences[key] })}
                    className={`w-11 h-6 rounded-full p-1 transition-colors shrink-0`}
                    style={{
                      background: preferences[key] ? '#2563eb' : 'var(--surface-hover)',
                      border:     '1px solid var(--border-solid)',
                      minHeight:  'auto',
                      minWidth:   'auto',
                    }}
                    aria-label={`Toggle ${label}`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full transition-transform ${preferences[key] ? 'translate-x-5' : 'translate-x-0'}`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Account */}
          <section
            className="p-5 rounded-2xl"
            style={{
              background:   'var(--surface)',
              border:       '1px solid var(--border-solid)',
              borderLeft:   '3px solid #f97316',
            }}
          >
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
              <User className="w-5 h-5 text-orange-400" /> Account
            </h2>
            <div className="space-y-2">
              {['Change Password', 'Update Profile Info'].map((label) => (
                <button
                  key={label}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl transition-colors text-sm"
                  style={{
                    background: 'var(--surface-hover)',
                    color:      'var(--text)',
                    border:     '1px solid var(--border-solid)',
                    minHeight:  48,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = 'var(--surface-hover)';
                  }}
                >
                  <span>{label}</span>
                  <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-subtle)' }} />
                </button>
              ))}

              {/* Logout — always visible, prominent */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 p-3.5 rounded-xl transition-colors text-sm mt-2"
                style={{
                  color:     '#f87171',
                  border:    '1px solid rgba(248,113,113,0.25)',
                  background:'rgba(248,113,113,0.06)',
                  minHeight:  48,
                  cursor:    'pointer',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(248,113,113,0.12)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(248,113,113,0.06)';
                }}
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </section>
        </div>
      </div>
      {/* Note: global <Footer /> is rendered by layout.tsx — no duplicate footer here */}
    </div>
  );
}
