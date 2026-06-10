"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUserStore } from '@/store/userStore';
import { Menu, X, Sun, Moon } from 'lucide-react';
import Image from 'next/image';
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

  /* ── Close mobile menu on route change ── */
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  /* ── Prevent body scroll when mobile menu is open ── */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

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
          <Link href="/" className="flex items-center gap-2.5 shrink-0 min-h-0 min-w-0">
            <Image
  src="/future-engineers-logo-v2.png"
  alt="Future Engineers Logo"
  width={36}
  height={36}
  priority
  className="h-9 w-9 object-contain"
/>
            <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--text)' }}>
              Future <span className="text-blue-500">Engineers</span>
            </span>
          </Link>

          {/* ── Desktop nav links ── */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.name}
                  href={link.path}
                  className={`relative text-sm font-medium transition-colors hover:text-blue-500 min-h-0 min-w-0 py-1 ${
                    isActive ? 'text-blue-500' : 'text-[var(--text-muted)]'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <motion.div
                      layoutId="nav-underline"
                      className="absolute left-0 bottom-0 w-full h-[2px] bg-blue-500 rounded-full"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* ── Desktop right actions ── */}
          <div className="hidden md:flex items-center gap-3">

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-lg transition-all hover:bg-slate-700/40 min-h-0 min-w-0"
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
              <Link href="/profile" className="flex items-center gap-2 transition-opacity hover:opacity-80 min-h-0 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </div>
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors min-h-0 min-w-0"
              >
                Login
              </Link>
            )}
          </div>

          {/* ── Mobile right actions ── */}
          <div className="md:hidden flex items-center gap-1">
            {/* Mobile: show profile avatar or login link before hamburger */}
            {user && user.isProfileComplete ? (
              <Link
                href="/profile"
                className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow mr-1 min-h-0 min-w-0"
              >
                {user.name?.[0]?.toUpperCase() || 'U'}
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors mr-1 min-h-0 min-w-0"
              >
                Login
              </Link>
            )}

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-lg transition-colors min-h-0 min-w-0"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Hamburger */}
            <button
              className="p-2.5 rounded-lg transition-colors min-h-0 min-w-0"
              style={{ color: 'var(--text-muted)' }}
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isOpen}
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
            style={{
              background: 'var(--bg-secondary)',
              borderTop: '1px solid var(--border)',
              maxHeight: 'calc(100vh - 60px)',
              overflowY: 'auto',
            }}
          >
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`block py-3 px-3 rounded-lg text-sm font-medium transition-colors ${
                    pathname === link.path
                      ? 'text-blue-400 bg-blue-500/10'
                      : 'hover:bg-slate-700/30'
                  }`}
                  style={{ color: pathname === link.path ? undefined : 'var(--text-muted)', minHeight: 44 }}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
