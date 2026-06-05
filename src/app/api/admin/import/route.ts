import { NextResponse } from 'next/server';
import { adminDb, isAdminConfigured } from '@/lib/firebase-admin';
import { CutoffRecord } from '@/types';

// Simple in-memory rate limiting map for the prototype
const rateLimitMap = new Map<string, { count: number, timestamp: number }>();

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting Protection (5 uploads per minute per IP)
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const now = Date.now();
    const windowMs = 60000;
    
    if (rateLimitMap.has(ip)) {
      const data = rateLimitMap.get(ip)!;
      if (now - data.timestamp < windowMs) {
        if (data.count >= 5) {
          return NextResponse.json({ error: 'Rate limit exceeded. Try again later.' }, { status: 429 });
        }
        data.count++;
      } else {
        rateLimitMap.set(ip, { count: 1, timestamp: now });
      }
    } else {
      rateLimitMap.set(ip, { count: 1, timestamp: now });
    }

    // 2. Auth Check (In a real app, verify Firebase Auth token here)
    const authHeader = req.headers.get('authorization');
    if (authHeader !== 'Bearer admin-mock-token') {
      return NextResponse.json({ error: 'Unauthorized Access' }, { status: 401 });
    }

    // 3. Import Data
    if (!isAdminConfigured || !adminDb) {
      return NextResponse.json({ 
        message: 'Mock import successful. Firebase Admin not configured in .env.local',
        mocked: true 
      });
    }

    const { data } = await req.json() as { data: CutoffRecord[] };

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    // Batch write to Firestore (up to 500 ops per batch)
    const batches = [];
    let currentBatch = adminDb.batch();
    let count = 0;

    for (const record of data) {
      const docRef = adminDb.collection('cutoffs').doc(); // Auto-generate ID
      currentBatch.set(docRef, record);
      count++;

      if (count === 500) {
        batches.push(currentBatch.commit());
        currentBatch = adminDb.batch();
        count = 0;
      }
    }

    if (count > 0) {
      batches.push(currentBatch.commit());
    }

    await Promise.all(batches);

    return NextResponse.json({ message: `Successfully imported ${data.length} records.` });

  } catch (error: any) {
    console.error('Import Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
