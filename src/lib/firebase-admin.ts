import * as admin from 'firebase-admin';

// Initialize Firebase Admin only if not already initialized and credentials exist
export const isAdminConfigured = !!process.env.FIREBASE_PROJECT_ID;

if (isAdminConfigured && !admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const adminDb = isAdminConfigured ? admin.firestore() : null;

export { admin, adminDb };
