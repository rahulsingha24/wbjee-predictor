"use client";

import { useUserStore } from '@/store/userStore';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Send, MessageSquare, ChevronDown, Loader2 } from 'lucide-react';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { motion } from 'framer-motion';

export default function FeedbackPage() {
  const { user } = useUserStore();
  const router = useRouter();

  const [formData, setFormData] = useState({
    type: '',
    message: '',
  });

  const [errors, setErrors] = useState({
    type: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const validate = () => {
    let valid = true;
    const newErrors = { type: '', message: '' };

    if (!formData.type) {
      newErrors.type = 'Please select an issue type.';
      valid = false;
    }
    if (!formData.message.trim()) {
      newErrors.message = 'Please describe the issue or suggestion.';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      if (isFirebaseConfigured && db) {
        await addDoc(collection(db, 'feedback'), {
          type: formData.type,
          message: formData.message,
          userEmail: user?.email || 'Anonymous',
          userName: user?.name || 'Anonymous',
          createdAt: serverTimestamp(),
        });
      }
      
      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      alert('Failed to submit feedback. Please try again later.');
    } finally {
      setIsSubmitting(false);
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
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[500px] z-10"
      >
        <div className="glass-card p-6 sm:p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)]" style={{ border: '1px solid var(--border)' }}>
          <div className="mb-6 border-b pb-6 text-center" style={{ borderColor: 'var(--border-solid)' }}>
            <div className="w-14 h-14 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
              <MessageSquare className="w-7 h-7 text-blue-500" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-2" style={{ color: 'var(--text)' }}>Send Feedback</h1>
            <p className="text-sm sm:text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Help us improve Future Engineers by reporting issues, wrong data, or suggestions.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {success && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center mb-4"
              >
                <p className="text-emerald-500 font-medium text-sm sm:text-base">
                  Thank you! Your feedback has been submitted.
                </p>
              </motion.div>
            )}

            <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>
                  Issue Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      setFormData({ ...formData, type: e.target.value });
                      if (e.target.value) setErrors({ ...errors, type: '' });
                    }}
                    className="w-full px-4 pr-10 py-3.5 rounded-xl font-medium text-sm outline-none appearance-none cursor-pointer transition-all duration-200"
                    style={{
                      background: 'var(--input-bg)',
                      border: `1.5px solid ${errors.type ? '#ef4444' : 'var(--border-solid)'}`,
                      color: 'var(--text)',
                    }}
                    onFocus={(e) => { if (!errors.type) (e.currentTarget as HTMLElement).style.borderColor = '#3b82f6'; }}
                    onBlur={(e)  => { if (!errors.type) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-solid)'; }}
                  >
                    <option value="" disabled>Select an option</option>
                    <option value="Wrong cutoff data">Wrong cutoff data</option>
                    <option value="Wrong college / branch info">Wrong college / branch info</option>
                    <option value="Filter or result problem">Filter or result problem</option>
                    <option value="Website bug / crash">Website bug / crash</option>
                    <option value="Suggestion">Suggestion</option>
                    <option value="Other">Other</option>
                  </select>
                  <ChevronDown
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                    style={{ color: 'var(--text-subtle)' }}
                  />
                </div>
                {errors.type && <p className="text-red-500 text-xs mt-1.5">{errors.type}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text)' }}>
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={5}
                  value={formData.message}
                  onChange={(e) => {
                    setFormData({ ...formData, message: e.target.value });
                    if (e.target.value.trim()) setErrors({ ...errors, message: '' });
                  }}
                  className="w-full px-4 py-3.5 rounded-xl font-medium text-sm outline-none transition-all resize-none"
                  placeholder="Describe your issue or suggestion in detail..."
                  style={{
                    background: 'var(--input-bg)',
                    border: `1.5px solid ${errors.message ? '#ef4444' : 'var(--border-solid)'}`,
                    color: 'var(--text)',
                  }}
                  onFocus={(e) => { if (!errors.message) (e.currentTarget as HTMLElement).style.borderColor = '#3b82f6'; }}
                  onBlur={(e)  => { if (!errors.message) (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-solid)'; }}
                />
                {errors.message && <p className="text-red-500 text-xs mt-1.5">{errors.message}</p>}
              </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || success}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2.5 transition-all duration-200 shadow-md active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : success ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Redirecting to Home...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Feedback
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
