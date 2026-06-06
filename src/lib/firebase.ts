import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Check if all required keys are present
const isConfigured = Object.values(firebaseConfig).every(value => !!value);

if (!isConfigured && process.env.NODE_ENV !== 'test') {
  console.warn(
    'Firebase environment variables are missing or incomplete.\n' +
    'Please check your .env.local file and ensure all NEXT_PUBLIC_FIREBASE_* variables are set.\n' +
    'App will fallback to mock login.'
  );
}

// Initialize Firebase only if config is provided to prevent crashes
export const isFirebaseConfigured = isConfigured;

const app = !getApps().length && isFirebaseConfigured ? initializeApp(firebaseConfig) : (isFirebaseConfigured ? getApp() : null);
const db = app ? getFirestore(app) : null;
const auth = app ? getAuth(app) : null;
let analytics = null;
if (app && typeof window !== 'undefined') {
  isSupported().then(yes => yes ? analytics = getAnalytics(app) : null);
}

export { app, db, auth, analytics };
