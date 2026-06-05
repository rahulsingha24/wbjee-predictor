"use client";

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ArrowRight, BarChart3, Target, SlidersHorizontal, Zap, AlertCircle,
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
    icon:  <Target className="w-5 h-5 text-blue-400" />,
    title: 'Accurate Predictions',
    desc:  'Based on real WBJEE cutoff trends.',
  },
  {
    icon:  <SlidersHorizontal className="w-5 h-5 text-purple-400" />,
    title: 'Smart Filtering',
    desc:  'Filter by rank, category, quota, and district.',
  },
  {
    icon:  <Zap className="w-5 h-5 text-orange-400" />,
    title: 'Fast Results',
    desc:  'Instant college predictions with smooth filtering.',
  },
  {
    icon:  <BarChart3 className="w-5 h-5 text-red-400" />,
    title: 'Real Cutoff Trends',
    desc:  'Analyze previous-year admission data easily.',
  },
];

/* ─── Steps data ─────────────────────────────────────────────────────────── */
const STEPS = [
  { num: '1', title: 'Enter Rank',    desc: 'Input your WBJEE rank.',                 color: 'bg-blue-500'   },
  { num: '2', title: 'Apply Filters', desc: 'Choose category and preferences.',         color: 'bg-purple-500' },
  { num: '3', title: 'View Chances',  desc: 'See matching colleges instantly.',          color: 'bg-orange-500' },
];

/* ─── Page component ─────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* Ambient glow blobs — subtle, never laggy */}
      <div
        className="absolute top-[-12%] left-[-8%] w-[45%] h-[45%] rounded-full pointer-events-none"
        style={{ background: 'var(--glow-a)', filter: 'blur(120px)' }}
      />
      <div
        className="absolute bottom-[-10%] right-[-8%] w-[40%] h-[40%] rounded-full pointer-events-none"
        style={{ background: 'var(--glow-b)', filter: 'blur(110px)' }}
      />

      {/* ────────────────────────── MAIN CONTENT ────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-20 relative z-10">

        {/* ══ HERO ══════════════════════════════════════════════════════════ */}
        <section className="text-center max-w-2xl mx-auto mb-20 sm:mb-28">

          {/* Badge */}
          <motion.div {...fadeUp(0)} className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border text-xs font-semibold tracking-widest uppercase select-none"
            style={{
              borderColor: 'var(--border-solid)',
              background:  'var(--surface)',
              color:       'var(--text-muted)',
            }}
          >
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
            WBJEE 2026 — Updated
          </motion.div>

          {/* Heading */}
          <motion.h1
            {...fadeUp(0.1)}
            className="hero-heading text-4xl sm:text-5xl md:text-[3.4rem] font-extrabold tracking-tight leading-[1.15] mb-5"
            style={{ color: 'var(--text)' }}
          >
            Predict Your{' '}
            <span className="text-gradient-animated">Dream College</span>
            <br className="hidden sm:block" /> with Confidence
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            {...fadeUp(0.18)}
            className="text-base sm:text-lg leading-relaxed mb-9 max-w-lg mx-auto"
            style={{ color: 'var(--text-muted)' }}
          >
            Predict your WBJEE college chances using previous-year cutoff trends.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            {...fadeUp(0.26)}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link
              href="/predictor"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold text-sm transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] active:scale-[0.97]"
            >
              Start Predicting <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/feedback"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.97] border"
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
        <section className="mb-20 sm:mb-28">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>
              Why Use Our Predictor?
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-subtle)' }}>
              Built for WBJEE 2026 aspirants with real historical data.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                {...fadeUpView(i * 0.07)}
                className="glass-card p-5 rounded-2xl group cursor-default"
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
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
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
        <section className="mb-20 sm:mb-28">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>
              How It Works
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-subtle)' }}>
              Three simple steps to find your best college matches.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {STEPS.map((s, i) => (
              <motion.div
                key={i}
                {...fadeUpView(i * 0.1)}
                className="glass-card p-7 rounded-2xl text-center"
                style={{ border: '1px solid var(--border)' }}
              >
                <div
                  className={`w-11 h-11 rounded-full ${s.color} text-white font-bold text-lg flex items-center justify-center mx-auto mb-5 shadow-lg`}
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

        {/* ══ DISCLAIMER ════════════════════════════════════════════════════ */}
        <motion.div
          {...fadeUpView(0)}
          className="max-w-2xl mx-auto glass-card rounded-2xl px-5 py-4 flex items-start gap-3"
          style={{
            border:     '1px solid var(--border)',
            borderLeft: '3px solid #f97316',
          }}
        >
          <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-subtle)' }}>
            <strong style={{ color: 'var(--text-muted)' }}>Disclaimer: </strong>
            Predictions are based on previous WBJEE cutoff trends and are for estimation purposes only.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
