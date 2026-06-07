"use client";

import { useUserStore } from '@/store/userStore';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { auth, isFirebaseConfigured, db } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function LoginPage() {
  const { user, login } = useUserStore();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    console.log('[Login Debug] Setting mounted to true');
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!auth || !isFirebaseConfigured || !mounted) return;
    console.log('[Login Debug] Checking for redirect result...');
    getRedirectResult(auth).then(async (result) => {
      console.log('[Login Debug] Redirect result:', result ? 'User found' : 'null');
      if (!result) return;
      await handleAuthResult(result.user);
    }).catch((err) => {
      console.error('[Login Debug] Redirect sign-in error:', err);
      setError(err.message || 'Failed to sign in via redirect. Please try again.');
    });
  }, [mounted, router]);

  const handleAuthResult = async (fbUser: any) => {
    console.log('[Login Debug] handleAuthResult called for user:', fbUser.email);
    let profileComplete = false;
    let displayName = '';
    let joinedAt = new Date().toISOString();

    try {
      if (db && fbUser.email) {
        console.log('[Login Debug] Fetching user from Firestore...');
        const snap = await getDoc(doc(db, 'users', fbUser.uid));
        if (snap.exists()) {
          console.log('[Login Debug] User exists in Firestore');
          const data = snap.data();
          if (data.profileCompleted) {
            profileComplete = true;
            displayName = data.displayName || '';
            joinedAt = data.createdAt?.toDate?.()?.toISOString() || joinedAt;
          }
          await setDoc(doc(db, 'users', fbUser.uid), { lastLoginAt: serverTimestamp() }, { merge: true });
        } else {
          console.log('[Login Debug] Creating new user in Firestore');
          await setDoc(doc(db, 'users', fbUser.uid), {
            uid: fbUser.uid,
            email: fbUser.email,
            loginProvider: 'google',
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
            profileCompleted: false
          });
        }
      }
    } catch (dbError) {
      console.error('[Login Debug] Database error:', dbError);
      setError('Database error during login. Make sure Firestore is enabled.');
      return;
    }

    console.log('[Login Debug] Updating local state and redirecting...');
    login({ 
      name: displayName, 
      email: fbUser.email || '', 
      isProfileComplete: profileComplete, 
      joinedAt 
    });
    
    router.push(profileComplete ? '/' : '/onboarding');
  };

  const isMobile = typeof window !== 'undefined' && /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const handleGoogleSignIn = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    console.log('[Login Debug] handleGoogleSignIn clicked.');
    setIsLoading(true);
    setError('');
    try {
      if (auth && isFirebaseConfigured) {
        const provider = new GoogleAuthProvider();
        
        try {
          console.log('[Login Debug] Executing signInWithPopup...');
          const result = await signInWithPopup(auth, provider);
          console.log('[Login Debug] signInWithPopup successful!');
          await handleAuthResult(result.user);
        } catch (popupErr: any) {
          console.error('[Login Debug] popup error:', popupErr.code, popupErr);
          if (popupErr.code === 'auth/popup-blocked') {
            console.warn('[Login Debug] Popup blocked by browser, falling back to redirect sign-in...');
            await signInWithRedirect(auth, provider);
          } else {
            throw popupErr;
          }
        }
      } else {
        console.log('[Login Debug] Firebase not configured, falling back to dev mode');
        login({ name: '', email: 'demo@wbjeepredictor.in', isProfileComplete: false, joinedAt: new Date().toISOString() });
        router.push('/onboarding');
      }
    } catch (err: any) {
      console.error('[Login Debug] Fatal sign-in error:', err);
      setError(err.message || 'Failed to sign in with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div
      className="min-h-[calc(100vh-60px)] flex-grow flex flex-col items-center justify-center px-4 pt-16 sm:pt-20 pb-20 sm:pb-24 relative overflow-hidden w-full"
      style={{ background: 'var(--bg)' }}
    >
      {/* Ambient glows */}
      <div
        className="absolute top-[-12%] left-[-8%] w-[45%] h-[45%] rounded-full pointer-events-none"
        style={{ background: 'var(--glow-a)', filter: 'blur(60px)' }}
      />
      <div
        className="absolute bottom-[-10%] right-[-8%] w-[40%] h-[40%] rounded-full pointer-events-none"
        style={{ background: 'var(--glow-b)', filter: 'blur(55px)' }}
      />

      <div className="w-full max-w-[420px] z-10">
        <div className="glass-card p-8 sm:p-10 rounded-2xl text-center relative">
          <div className="mb-8">
<h1
  className="text-2xl sm:text-3xl font-extrabold mb-3 leading-tight"
  style={{ color: 'var(--text)' }}
>
  Continue to
  <br />
  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-500 whitespace-nowrap">
    Future Engineers
  </span>
</h1>
            <p className="text-sm sm:text-base leading-relaxed mx-auto max-w-[380px]" style={{ color: 'var(--text-muted)' }}>
              Sign in with Google to use the WBJEE College Predictor.
            </p>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full font-bold rounded-xl flex items-center justify-center gap-3 transition-all duration-200 shadow-md active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mb-6 text-white"
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
              padding: '16px',
              border: 'none',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.2)',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(37, 99, 235, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(37, 99, 235, 0.2)';
            }}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <div className="bg-white rounded-full p-[2px] flex items-center justify-center shrink-0">
                  <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                </div>
                Continue with Google
              </>
            )}
          </button>

          {error && (
            <p className="text-red-500 text-sm mb-4 font-medium">{error}</p>
          )}

          <div className="flex items-start justify-center gap-2 text-xs mx-auto max-w-[380px]" style={{ color: 'var(--text-subtle)' }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="shrink-0 mt-[2px]"
            >
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span className="text-left">Secure login. Your data is used only to manage your account and preferences.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
