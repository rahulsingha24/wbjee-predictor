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
    <div className="max-w-6xl mx-auto px-4 py-10">

      {/* ── Profile header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-12">
        <div className="relative shrink-0">
          <div className="w-28 h-28 rounded-full border-2 border-slate-600 p-1 bg-slate-800">
            <div className="w-full h-full bg-gradient-to-br from-blue-600/30 to-purple-600/30 rounded-full flex items-center justify-center">
              <span className="text-3xl font-bold text-white">{user.name?.[0]?.toUpperCase() || 'U'}</span>
            </div>
          </div>
          <button className="absolute bottom-0 right-0 p-2 bg-slate-800 rounded-full border border-slate-700 text-slate-400 hover:text-white transition-colors">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-bold text-white mb-1">{user.name}</h1>
          <p className="text-slate-400 mb-3">{user.email}</p>
          <div className="inline-flex items-center gap-1.5 bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-700/50 text-sm text-slate-400">
            <span>📅</span> Joined {joinDate}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── LEFT / MAIN ────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-10">

          {/* Saved Predictions */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-blue-400" /> Saved Predictions
              </h2>
              <button className="text-blue-400 text-sm hover:underline">View All</button>
            </div>

            <div className="space-y-3">
              {savedPredictions.length > 0 ? (
                savedPredictions.slice(0, 5).map((pred) => (
                  <div key={pred.id} className="glass-card p-5 rounded-2xl border border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-600 transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="bg-blue-900/30 text-blue-300 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-blue-800/40">
                          RANK {pred.rank}
                        </span>
                        <span className="text-slate-400 text-xs">{pred.category}, {pred.quota}</span>
                      </div>
                      <p className="text-slate-200 text-sm">{pred.focus}</p>
                    </div>
                    <Link
                      href={`/results?rank=${pred.rank}&category=${pred.category}&quota=${pred.quota}&tfwStatus=Non-TFW&round=All Rounds`}
                      className="shrink-0"
                    >
                      <button className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 border border-slate-700">
                        Reopen <ExternalLink className="w-3 h-3" />
                      </button>
                    </Link>
                  </div>
                ))
              ) : (
                /* Demo items matching the design when nothing is saved */
                <>
                  {[
                    { rank: 4500, cat: 'Gen', quota: 'Home State', focus: 'CSE, IT focus • Jadavpur, IEM' },
                    { rank: 8200, cat: 'OBC', quota: 'Home State', focus: 'ECE focus • Heritage, Techno Main' },
                  ].map((d, i) => (
                    <div key={i} className="glass-card p-5 rounded-2xl border border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="bg-blue-900/30 text-blue-300 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-blue-800/40">
                            RANK {d.rank}
                          </span>
                          <span className="text-slate-400 text-xs">{d.cat}, {d.quota}</span>
                        </div>
                        <p className="text-slate-200 text-sm">{d.focus}</p>
                      </div>
                      <Link href="/predictor" className="shrink-0">
                        <button className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 border border-slate-700">
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
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-orange-400" /> Saved Colleges
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {favorites.length > 0 ? (
                favorites.slice(0, 6).map((name, idx) => (
                  <div key={idx} className="glass-card p-5 rounded-2xl border border-slate-700/50 relative">
                    <Bookmark className="w-4 h-4 text-orange-400 fill-orange-400 absolute top-4 right-4" />
                    <h3 className="font-bold text-white text-sm mb-1 pr-6 leading-snug">{name}</h3>
                    <p className="text-slate-400 text-xs mb-3">West Bengal • {name.toLowerCase().includes('government') || name.toLowerCase().includes('university') || name.toLowerCase().includes('jadavpur') || name.toLowerCase().includes('kalyani') || name.toLowerCase().includes('jalpaiguri') ? 'Government' : 'Private'}</p>
                    <div className="flex gap-2">
                      <span className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded border border-slate-700">CSE</span>
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
                    <div key={i} className="glass-card p-5 rounded-2xl border border-slate-700/50 relative">
                      <Bookmark className="w-4 h-4 text-orange-400 fill-orange-400 absolute top-4 right-4" />
                      <h3 className="font-bold text-white text-sm mb-1 pr-6">{c.name}</h3>
                      <p className="text-slate-400 text-xs mb-3">{c.loc} • {c.type}</p>
                      <div className="flex gap-2">
                        {c.tags.map((t) => (
                          <span key={t} className="bg-slate-800 text-slate-300 text-xs px-2 py-0.5 rounded border border-slate-700">{t}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </section>
        </div>

        {/* ── RIGHT SIDEBAR ────────────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Preferences */}
          <section className="glass-card p-6 rounded-2xl border border-slate-700/50">
            <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-400" /> Preferences
            </h2>
            <div className="space-y-5">
              {[
                { key: 'darkMode' as const, label: 'Dark Mode', desc: 'Easier on the eyes' },
                { key: 'emailAlerts' as const, label: 'Email Alerts', desc: 'Cutoff updates' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="text-white text-sm font-medium">{label}</p>
                    <p className="text-slate-500 text-xs">{desc}</p>
                  </div>
                  <button
                    onClick={() => updatePreferences({ [key]: !preferences[key] })}
                    className={`w-11 h-6 rounded-full p-1 transition-colors ${preferences[key] ? 'bg-blue-600' : 'bg-slate-700'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${preferences[key] ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* Account */}
          <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 border-l-2 border-l-orange-400">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-orange-400" /> Account
            </h2>
            <div className="space-y-2">
              {['Change Password', 'Update Profile Info'].map((label) => (
                <button key={label} className="w-full flex items-center justify-between bg-slate-800 hover:bg-slate-700 text-white p-3.5 rounded-xl transition-colors border border-slate-700 text-sm">
                  <span>{label}</span>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 text-red-400 hover:bg-slate-800/50 p-3.5 rounded-xl transition-colors border border-slate-800 text-sm mt-2"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-800 pt-10 text-center text-sm text-slate-500">
        <p className="font-semibold text-white text-base mb-3">WBJEE Predictor</p>
        <div className="flex justify-center gap-6 mb-4 text-slate-400">
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/terms"   className="hover:text-white transition-colors">Terms of Service</Link>
          <Link href="/feedback" className="hover:text-white transition-colors">Contact Us</Link>
        </div>
        <p>© 2026 WBJEE Predictor. Built for WBJEE Aspirants.</p>
      </footer>
    </div>
  );
}
