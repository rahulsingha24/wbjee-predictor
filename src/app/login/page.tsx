"use client";

import { useUserStore } from '@/store/userStore';
import { LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { db } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function LoginPage() {
  const { user, login } = useUserStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && user.isProfileComplete) router.replace('/predictor');
  }, [user, router]);

  /* Handle redirect result when returning from mobile Google sign-in */
  useEffect(() => {
    if (!auth || !isFirebaseConfigured) return;
    getRedirectResult(auth).then(async (result) => {
      if (!result) return;
      const fbUser = result.user;
      let profileComplete = false;
      if (db && fbUser.email) {
        const snap = await getDoc(doc(db, 'users', fbUser.email));
        if (snap.exists() && snap.data().source) {
          profileComplete = true;
          await setDoc(doc(db, 'users', fbUser.email), { lastActive: serverTimestamp() }, { merge: true });
        } else {
          await setDoc(doc(db, 'users', fbUser.email), {
            name: fbUser.displayName || 'Student',
            email: fbUser.email,
            loginTime: serverTimestamp(),
            lastActive: serverTimestamp(),
          }, { merge: true });
        }
      }
      login({ name: fbUser.displayName || 'Student', email: fbUser.email || '', isProfileComplete: profileComplete, joinedAt: new Date().toISOString() });
      router.push(profileComplete ? '/predictor' : '/onboarding');
    }).catch((err) => {
      console.error('Redirect sign-in error:', err);
    });
  }, [login, router]);

  /* Detect mobile browser */
  const isMobile = typeof window !== 'undefined' && /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    try {
      if (auth && isFirebaseConfigured) {
        const provider = new GoogleAuthProvider();

        if (isMobile) {
          // Use redirect on mobile — popup is blocked on mobile browsers
          await signInWithRedirect(auth, provider);
          return; // page will reload, result handled in useEffect above
        }

        const result = await signInWithPopup(auth, provider);
        const fbUser = result.user;

        let profileComplete = false;
        if (db && fbUser.email) {
          const snap = await getDoc(doc(db, 'users', fbUser.email));
          if (snap.exists() && snap.data().source) {
            profileComplete = true;
            await setDoc(doc(db, 'users', fbUser.email), { lastActive: serverTimestamp() }, { merge: true });
          } else {
            await setDoc(doc(db, 'users', fbUser.email), {
              name: fbUser.displayName || 'Student',
              email: fbUser.email,
              loginTime: serverTimestamp(),
              lastActive: serverTimestamp(),
            }, { merge: true });
          }
        }

        login({ name: fbUser.displayName || 'Student', email: fbUser.email || '', isProfileComplete: profileComplete, joinedAt: new Date().toISOString() });
        router.push(profileComplete ? '/predictor' : '/onboarding');
      } else {
        // Dev / no Firebase fallback
        login({ name: 'Demo Student', email: 'demo@wbjeepredictor.in', isProfileComplete: false, joinedAt: new Date().toISOString() });
        router.push('/onboarding');
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to sign in with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-[90vh] flex items-center justify-center px-4 py-8 relative overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      {/* Glow blobs — capped size on mobile */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          width: 'min(500px, 90vw)',
          height: 'min(500px, 90vw)',
          background: 'rgba(37,99,235,0.10)',
          filter: 'blur(80px)',
        }}
      />
      <div
        className="absolute top-1/4 right-1/4 rounded-full pointer-events-none"
        style={{
          width: 'min(256px, 60vw)',
          height: 'min(256px, 60vw)',
          background: 'rgba(124,58,237,0.09)',
          filter: 'blur(60px)',
        }}
      />

      {/* Card — centered, constrained, responsive padding */}
      <div
        className="glass-card w-full max-w-sm relative z-10 shadow-2xl"
        style={{
          padding:      'clamp(24px, 6vw, 32px)',
          borderRadius: 24,
          border:       '1px solid var(--border-solid)',
        }}
      >
        {/* Avatar icon */}
        <div className="flex flex-col items-center text-center mb-7">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
            style={{
              background: 'var(--surface-hover)',
              border:     '1px solid var(--border-solid)',
            }}
          >
            <LogIn className="w-7 h-7" style={{ color: 'var(--text-muted)' }} />
          </div>
          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: 'var(--text)' }}
          >
            Welcome Back
          </h1>
          <p
            className="text-sm leading-relaxed max-w-[240px]"
            style={{ color: 'var(--text-muted)' }}
          >
            Sign in to save your favorite colleges.
          </p>
        </div>

        {/* Google button — full width */}
        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full font-semibold rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-60 mb-5"
          style={{
            background:    '#ffffff',
            color:         '#1e293b',
            padding:       '14px 20px',
            minHeight:     '52px',
            fontSize:      '14px',
            border:        '1px solid #e2e8f0',
            cursor:        isLoading ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={(e) => {
            if (!isLoading) (e.currentTarget as HTMLElement).style.background = '#f1f5f9';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#ffffff';
          }}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              {/* Google G logo */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>

        {error && (
          <p className="text-red-400 text-sm text-center mb-4">{error}</p>
        )}

        {/* Security note */}
        <div
          className="flex items-start gap-2 text-xs leading-relaxed"
          style={{ color: 'var(--text-subtle)' }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="shrink-0 mt-0.5"
          >
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span>Secure, one-tap login. Your data is only used to save your preferences.</span>
        </div>
      </div>
    </div>
  );
}
