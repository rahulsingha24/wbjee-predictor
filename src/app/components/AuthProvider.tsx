"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { useUserStore } from '@/store/userStore';

// Routes that do NOT require authentication
const PUBLIC_ROUTES = ['/login'];
const ONBOARDING_ROUTE = '/onboarding';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  // 'loading' = Firebase hasn't resolved yet
  // 'done'    = Firebase has resolved (user may or may not be logged in)
  const [authReady, setAuthReady] = useState(false);
  const [firebaseAuthed, setFirebaseAuthed] = useState(false);

  const user = useUserStore((state) => state.user);
  const login = useUserStore((state) => state.login);
  const logout = useUserStore((state) => state.logout);
  const router = useRouter();
  const pathname = usePathname();

  // Step 1: Subscribe to Firebase auth state ONCE on mount.
  // When it fires, hydrate the Zustand store and mark auth as ready.
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      // No Firebase — treat as unauthenticated immediately
      setFirebaseAuthed(false);
      setAuthReady(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        let isComplete = false;
        let displayName = '';
        let joinedAt = new Date().toISOString();

        try {
          if (db) {
            const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (snap.exists()) {
              const data = snap.data();
              isComplete = data?.profileCompleted || false;
              displayName = data?.displayName || '';
              const createdAt = data?.createdAt;
              if (createdAt?.toDate) {
                joinedAt = createdAt.toDate().toISOString();
              }
            }
          }
        } catch (err) {
          console.error('AuthProvider: Firestore fetch error', err);
        }

        login({
          email: firebaseUser.email || '',
          name: displayName,
          isProfileComplete: isComplete,
          joinedAt,
        });

        setFirebaseAuthed(true);
      } else {
        logout();
        setFirebaseAuthed(false);
      }

      setAuthReady(true);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Step 2: Once auth is resolved, derive routing from the Zustand store's `user`.
  // This ensures that when onboarding calls updateProfile({ isProfileComplete: true }),
  // this effect re-runs with the fresh store state and routes to '/' correctly.
  useEffect(() => {
    if (!authReady) return;

    const isLoggedIn = firebaseAuthed && !!user;
    const isComplete = user?.isProfileComplete ?? false;

    if (!isLoggedIn) {
      // Logged out — only /login is allowed
      if (!PUBLIC_ROUTES.includes(pathname)) {
        router.replace('/login');
      }
    } else if (!isComplete) {
      // Logged in but profile incomplete — must be on /onboarding
      if (pathname !== ONBOARDING_ROUTE) {
        router.replace(ONBOARDING_ROUTE);
      }
    } else {
      // Logged in and complete — redirect away from login/onboarding
      if (PUBLIC_ROUTES.includes(pathname) || pathname === ONBOARDING_ROUTE) {
        router.replace('/');
      }
    }
  }, [authReady, firebaseAuthed, user, pathname, router]);

  // Show spinner while Firebase resolves
  if (!authReady) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg)' }}
      >
        <div className="w-8 h-8 border-[3px] border-slate-600/40 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  const isLoggedIn = firebaseAuthed && !!user;
  const isComplete = user?.isProfileComplete ?? false;

  // Prevent wrong content from flashing while redirect is in-flight
  if (!isLoggedIn && !PUBLIC_ROUTES.includes(pathname)) return null;
  if (isLoggedIn && !isComplete && pathname !== ONBOARDING_ROUTE) return null;
  if (isLoggedIn && isComplete && (PUBLIC_ROUTES.includes(pathname) || pathname === ONBOARDING_ROUTE)) return null;

  return <>{children}</>;
}
