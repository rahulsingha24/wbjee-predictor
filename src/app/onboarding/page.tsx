"use client";

import { useUserStore } from '@/store/userStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import { db, isFirebaseConfigured, auth } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';

export default function OnboardingPage() {
  const { user, updateProfile } = useUserStore();
  const router = useRouter();

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // AuthProvider handles redirecting away from here if profile is already complete or user is logged out.

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // Prevent leading space
    if (val.startsWith(' ')) val = val.trimStart();
    
    // Prevent multiple continuous spaces
    val = val.replace(/\s{2,}/g, ' ');

    // Check for numbers or symbols
    if (/[^a-zA-Z\s]/.test(val)) {
      setNameError("Name can contain only letters and spaces.");
      val = val.replace(/[^a-zA-Z\s]/g, '');
    } else {
      setNameError('');
    }

    if (val.length > 50) val = val.slice(0, 50);

    // Auto-format normal names (Title Case) but allow ALL CAPS
    if (val && val !== val.toUpperCase()) {
      val = val.split(' ').map(word => {
        if (!word) return '';
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }).join(' ');
    }

    setName(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim();
    
    if (!finalName) {
      setNameError("Please enter your name.");
      return;
    }
    if (finalName.length < 2) {
      setNameError("Name must be at least 2 characters long.");
      return;
    }

    setIsSubmitting(true);

    try {
      const uid = auth?.currentUser?.uid;

if (isFirebaseConfigured && (!db || !uid)) {
  throw new Error('Authentication not ready. Please login again.');
} // Fallback to email if auth isn't perfectly synced in store
      if (isFirebaseConfigured && db && uid) {
        await setDoc(doc(db, 'users', uid), {
          displayName: finalName,
          profileCompleted: true,
        }, { merge: true });
      }

      updateProfile({
        name: finalName,
        isProfileComplete: true,
      });

      router.push('/');
    } catch (err) {
      console.error('Failed to save profile:', err);
      alert('Failed to save profile. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (!mounted || !user || user.isProfileComplete) return null;

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
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[440px] z-10"
      >
        <div className="glass-card p-8 sm:p-10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] relative" style={{ border: '1px solid var(--border)' }}>
          <div className="mb-8 border-b pb-6 text-center" style={{ borderColor: 'var(--border-solid)' }}>
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-3" style={{ color: 'var(--text)' }}>
              Complete Your Profile
            </h1>
            <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Enter your name to continue using Future Engineers.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>
                Student Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                onBlur={() => {
                  if (!name.trim()) setNameError("Please enter your name.");
                  else if (name.trim().length < 2) setNameError("Name must be at least 2 characters long.");
                }}
                className="w-full px-4 py-3.5 rounded-xl font-medium text-sm outline-none transition-all duration-200"
                placeholder="e.g. Rahul Kumar Singha"
                style={{
                  background: 'var(--input-bg)',
                  border: `1.5px solid ${nameError ? '#ef4444' : 'var(--border-solid)'}`,
                  color: 'var(--text)',
                }}
                onFocus={(e) => { if (!nameError) (e.currentTarget as HTMLElement).style.borderColor = '#3b82f6'; }}
                onBlurCapture={(e) => { if (!nameError) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-solid)'; }}
              />
              {nameError && <p className="text-red-500 text-xs mt-1.5 font-medium">{nameError}</p>}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2.5 transition-all duration-200 shadow-md active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save & Continue
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
