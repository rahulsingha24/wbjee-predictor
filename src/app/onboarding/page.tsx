"use client";

import { useUserStore } from '@/store/userStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function OnboardingPage() {
  const { user, updateProfile } = useUserStore();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    source: '',
    otherSource: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  /* Wait for Zustand hydration */
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!user) {
      router.push('/login');
    } else if (user.isProfileComplete) {
      router.push('/predictor');
    } else {
      setFormData(f => ({ ...f, name: user.name || '' }));
    }
  }, [user, router, mounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.source) return;
    if (formData.source === 'Other' && !formData.otherSource) return;

    setIsSubmitting(true);
    const finalSource = formData.source === 'Other' ? formData.otherSource : formData.source;

    try {
      if (isFirebaseConfigured && db && user?.email) {
        // Save to Firebase
        await setDoc(doc(db, 'users', user.email), {
          name: formData.name,
          email: user.email,
          source: finalSource,
          loginTime: serverTimestamp(),
          lastActive: serverTimestamp(),
          deviceInfo: navigator.userAgent || 'Unknown',
        }, { merge: true });
      }

      // Save to local Zustand store
      updateProfile({
        name: formData.name,
        source: finalSource,
        isProfileComplete: true,
      });

      router.push('/predictor');
    } catch (err) {
      console.error('Failed to save profile:', err);
      alert('Failed to save profile. Please try again.');
      setIsSubmitting(false);
    }
  };

  /* Pre-hydration loading */
  if (!mounted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.isProfileComplete) return null;

  return (
    <div className="max-w-xl mx-auto px-4 py-16">
      <div className="glass-card p-8 rounded-3xl border border-slate-700/50">
        <div className="mb-8 border-b border-slate-800 pb-6 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to WBJEE Predictor</h1>
          <p className="text-slate-400">Please complete your profile to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Student Name *</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value.replace(/[^a-zA-Z\s]/g, '') })}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Where did you hear about us? *</label>
            <select
              required
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
            >
              <option value="" disabled>Select an option</option>
              <option value="YouTube">YouTube</option>
              <option value="Friend">Friend</option>
              <option value="Telegram">Telegram</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Instagram">Instagram</option>
              <option value="Facebook">Facebook</option>
              <option value="Google Search">Google Search</option>
              <option value="School/Coaching">School/Coaching</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {formData.source === 'Other' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Please specify *</label>
              <input
                required
                type="text"
                value={formData.otherSource}
                onChange={(e) => setFormData({ ...formData, otherSource: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Where did you hear about us?"
              />
            </div>
          )}

          <div className="pt-6 border-t border-slate-800">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
    </div>
  );
}
