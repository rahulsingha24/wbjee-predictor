"use client";

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight, BarChart3, Target, SlidersHorizontal, Zap, AlertCircle,
  GraduationCap, BookOpen, Cpu, LineChart
} from 'lucide-react';

/* ─── Reusable motion preset ─────────────────────────────────────────────── */
const fadeUp = (delay = 0) => ({
  initial:     { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport:    { once: true, amount: 0.1 as const },
  transition:  { duration: 0.48, delay, ease: [0.22, 1, 0.36, 1] as any },
});

const fadeUpView = (delay = 0) => ({
  initial:     { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport:    { once: true, amount: 0.1 as const },
  transition:  { duration: 0.44, delay, ease: [0.22, 1, 0.36, 1] as any },
});

/* ─── Feature cards data ─────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon:  <Target className="w-5 h-5 text-blue-500" />,
    title: 'Accurate Predictions',
    desc:  'Based on real WBJEE cutoff trends.',
  },
  {
    icon:  <SlidersHorizontal className="w-5 h-5 text-purple-500" />,
    title: 'Smart Filtering',
    desc:  'Filter by rank, category, quota, and district.',
  },
  {
    icon:  <Zap className="w-5 h-5 text-orange-500" />,
    title: 'Fast Results',
    desc:  'Instant college predictions with smooth filtering.',
  },
  {
    icon:  <BarChart3 className="w-5 h-5 text-red-500" />,
    title: 'Real Cutoff Trends',
    desc:  'Analyze previous-year admission data easily.',
  },
];

/* ─── Steps data ─────────────────────────────────────────────────────────── */
const STEPS = [
  { num: '1', title: 'Enter Your Rank',    desc: 'Input your WBJEE rank.',                 color: 'bg-blue-600'   },
  { num: '2', title: 'Choose Preferences', desc: 'Select category and preferences.',         color: 'bg-purple-600' },
  { num: '3', title: 'View College Matches',  desc: 'See matching colleges instantly.',          color: 'bg-orange-500' },
];

/* ─── Page component ─────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="min-h-screen relative flex flex-col overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* Ambient glow blobs — reduced blur on mobile for performance */}
      <div
        className="absolute top-[-12%] left-[-8%] w-[45%] h-[45%] rounded-full pointer-events-none"
        style={{ background: 'var(--glow-a)', filter: 'blur(60px)' }}
      />
      <div
        className="absolute bottom-[-10%] right-[-8%] w-[40%] h-[40%] rounded-full pointer-events-none"
        style={{ background: 'var(--glow-b)', filter: 'blur(55px)' }}
      />

      {/* ────────────────────────── MAIN CONTENT ────────────────────────── */}
      <div className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20 pb-16 sm:pb-20 relative z-10 w-full">

        {/* ══ HERO ══════════════════════════════════════════════════════════ */}
        <section className="text-center max-w-2xl mx-auto mb-16 sm:mb-24 relative">

          {/* Educational Floating Animations */}
          <div className="absolute -top-4 -left-8 md:-top-8 md:-left-16 animate-float-slow opacity-30 pointer-events-none hidden sm:block">
            <GraduationCap className="w-12 h-12 text-blue-500" />
          </div>
          <div className="absolute top-20 -right-6 md:top-10 md:-right-24 animate-float-slower opacity-30 pointer-events-none hidden sm:block" style={{ animationDelay: '1s' }}>
            <Cpu className="w-10 h-10 text-purple-500" />
          </div>
          <div className="absolute bottom-4 -left-10 md:bottom-0 md:-left-20 animate-float-slower opacity-30 pointer-events-none hidden sm:block" style={{ animationDelay: '2s' }}>
            <BookOpen className="w-10 h-10 text-orange-500" />
          </div>
          <div className="absolute bottom-10 -right-8 md:bottom-4 md:-right-16 animate-float-slow opacity-30 pointer-events-none hidden sm:block" style={{ animationDelay: '0.5s' }}>
            <LineChart className="w-11 h-11 text-blue-500" />
          </div>

          {/* Badge */}
          <motion.div {...fadeUp(0)} className="inline-flex items-center gap-2 mb-5 sm:mb-6 px-4 py-1.5 rounded-full border text-xs font-semibold tracking-widest uppercase select-none"
            style={{
              borderColor: 'var(--border-solid)',
              background:  'var(--surface)',
              color:       'var(--text-muted)',
            }}
          >
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            Future Engineers
          </motion.div>

          {/* Heading — scales from 28px at 320px up to 3.4rem on desktop */}
          {/* Heading */}
<motion.h1
  {...fadeUp(0.1)}
  className="hero-heading text-[1.9rem] xs:text-3xl sm:text-4xl md:text-5xl lg:text-[3.2rem] font-extrabold tracking-tight leading-[1.1] mb-4 sm:mb-5 max-w-4xl mx-auto"
  style={{ color: "var(--text)" }}
>
  Discover Your Best
  <br className="hidden sm:block" />
  <span className="text-gradient-animated">
    WBJEE College
  </span>
</motion.h1>

          {/* Subtitle */}
          <motion.p
            {...fadeUp(0.18)}
            className="text-sm sm:text-base md:text-lg leading-relaxed mb-7 sm:mb-9 max-w-lg mx-auto"
            style={{ color: 'var(--text-muted)' }}
          >
            Explore colleges, branches, and admission possibilities using real WBJEE cutoff trends from previous years.
          </motion.p>

          {/* CTA Buttons — stacked on mobile, side-by-side on sm+ */}
          <motion.div
            {...fadeUp(0.26)}
            className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 relative z-10"
          >
            <Link
              href="/predictor"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-blue-600 hover:bg-blue-500 hover:-translate-y-0.5 text-white rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg active:scale-[0.97] min-h-0 min-w-0"
            >
              Start Predicting <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/feedback"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5 active:scale-[0.97] border min-h-0 min-w-0"
              style={{
                background:  'var(--surface)',
                color:       'var(--text-muted)',
                borderColor: 'var(--border-solid)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}
            >
              Send Feedback
            </Link>
          </motion.div>
        </section>

        {/* ══ WHY USE OUR PREDICTOR ═════════════════════════════════════════ */}
        <section className="mb-16 sm:mb-24">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>
              Why Use Our Predictor?
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-subtle)' }}>
              Built for WBJEE 2026 aspirants with real historical data.
            </p>
          </div>

          {/* Single col on mobile, 2 col on sm, 4 col on lg */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                {...fadeUpView(i * 0.07)}
                className="glass-card p-4 sm:p-5 rounded-2xl group cursor-default"
                style={{
                  border: '1px solid var(--border)',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(59,130,246,0.4)';
                  (e.currentTarget as HTMLElement).style.boxShadow   = '0 4px 24px rgba(37,99,235,0.12)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLElement).style.boxShadow   = '0 4px 24px rgba(0,0,0,0.12)';
                }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 sm:mb-4"
                  style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)' }}
                >
                  {f.icon}
                </div>
                <h3 className="font-semibold text-sm mb-1.5" style={{ color: 'var(--text)' }}>
                  {f.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-subtle)' }}>
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ══ HOW IT WORKS ══════════════════════════════════════════════════ */}
        <section className="mb-16 sm:mb-24">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>
              How It Works
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-subtle)' }}>
              Three simple steps to find your best college matches.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
            {STEPS.map((s, i) => (
              <motion.div
                key={i}
                {...fadeUpView(i * 0.1)}
                className="glass-card p-6 sm:p-7 rounded-2xl text-center hover:-translate-y-1 transition-transform duration-300"
                style={{ border: '1px solid var(--border)' }}
              >
                <div
                  className={`w-11 h-11 rounded-full ${s.color} text-white font-bold text-lg flex items-center justify-center mx-auto mb-4 sm:mb-5 shadow-lg`}
                >
                  {s.num}
                </div>
                <h3 className="font-bold text-base mb-2" style={{ color: 'var(--text)' }}>
                  {s.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-subtle)' }}>
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

      </div>

    </div>
  );
}
