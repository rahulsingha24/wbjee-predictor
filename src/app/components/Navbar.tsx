"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { GraduationCap, Menu, X, User, Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
  const { user } = useUserStore();
  const pathname  = usePathname();
  const [isOpen,  setIsOpen]  = useState(false);
  const [isDark,  setIsDark]  = useState(true);   // dark by default

  /* ── Initialise from localStorage (avoids flash) ── */
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const dark  = saved !== 'light';              // default → dark
    setIsDark(dark);
    document.documentElement.classList.toggle('light', !dark);
  }, []);

  /* ── Toggle handler ── */
  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('light', !next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const navLinks = [
    { name: 'Home',      path: '/' },
    { name: 'Predictor', path: '/predictor' },
  ];

  return (
    <nav
      className="fixed w-full z-50 top-0 left-0 glass"
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[60px]">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--text)' }}>
              WBJEE <span className="text-blue-400">Predictor</span>
            </span>
          </Link>

          {/* ── Desktop nav links ── */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.path}
                className={`text-sm font-medium transition-colors hover:text-blue-400 ${
                  pathname === link.path
                    ? 'text-blue-400 border-b-2 border-blue-500 pb-0.5'
                    : ''
                }`}
                style={{ color: pathname === link.path ? undefined : 'var(--text-muted)' }}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* ── Desktop right actions ── */}
          <div className="hidden md:flex items-center gap-3">

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-all hover:bg-slate-700/40"
              style={{ color: 'var(--text-muted)' }}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle theme"
            >
              {isDark
                ? <Sun  className="w-[18px] h-[18px]" />
                : <Moon className="w-[18px] h-[18px]" />
              }
            </button>

            {/* Login / Avatar */}
            {user && user.isProfileComplete ? (
              <Link href="/profile" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Login
              </Link>
            )}
          </div>

          {/* ── Mobile hamburger ── */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              className="p-2 transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden overflow-hidden"
            style={{ background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)' }}
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`block py-2.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                    pathname === link.path
                      ? 'text-blue-400 bg-blue-500/10'
                      : 'hover:bg-slate-700/30'
                  }`}
                  style={{ color: pathname === link.path ? undefined : 'var(--text-muted)' }}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-3 border-t" style={{ borderColor: 'var(--border-solid)' }}>
                {user && user.isProfileComplete ? (
                  <Link
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <User className="w-4 h-4" />
                    <span>Profile ({user.name?.split(' ')[0]})</span>
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  >
                    Login
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
