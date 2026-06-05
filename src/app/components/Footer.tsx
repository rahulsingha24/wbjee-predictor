import Link from 'next/link';

export default function Footer() {
  return (
    <footer
      className="py-8 text-center text-sm"
      style={{
        borderTop: '1px solid var(--border)',
        color: 'var(--text-subtle)',
        background: 'var(--bg)',
      }}
    >
      <p
        className="font-semibold text-base mb-3"
        style={{ color: 'var(--text)' }}
      >
        WBJEE Predictor
      </p>

      <div
        className="flex items-center justify-center flex-wrap gap-5 mb-3 text-sm"
        style={{ color: 'var(--text-muted)' }}
      >
        <Link href="/privacy"  className="hover:text-blue-400 transition-colors">Privacy Policy</Link>
        <Link href="/terms"    className="hover:text-blue-400 transition-colors">Terms of Service</Link>
        <Link href="/feedback" className="hover:text-blue-400 transition-colors">Contact Us</Link>
      </div>

      <p>© 2026 WBJEE Predictor. Built for WBJEE Aspirants.</p>
    </footer>
  );
}
