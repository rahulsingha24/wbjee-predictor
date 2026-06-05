"use client";

import { useUserStore } from '@/store/userStore';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function FeedbackPage() {
  const { user } = useUserStore();
  const router = useRouter();

  const [formData, setFormData] = useState({
    type: 'Bug/Glitch',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.message.trim()) return;

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
        router.back();
      }, 2000);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      alert('Failed to submit feedback. Please try again later.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 relative">
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="glass-card p-8 rounded-3xl border border-slate-700/50 relative z-10">
        <div className="mb-8 border-b border-slate-800 pb-6 text-center">
          <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
            <MessageSquare className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Send Feedback</h1>
          <p className="text-slate-400">Help us improve the predictor by reporting issues or sharing your suggestions.</p>
        </div>

        {success ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400 text-3xl">
              ✓
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Thank You!</h2>
            <p className="text-slate-400">Your feedback has been submitted successfully.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Issue Type *</label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
              >
                <option value="Wrong cutoff">Wrong cutoff</option>
                <option value="Bug/Glitch">Bug/Glitch</option>
                <option value="Wrong college info">Wrong college info</option>
                <option value="Suggestion">Suggestion</option>
                <option value="Other issue">Other issue</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Message *</label>
              <textarea
                required
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                placeholder="Describe your issue or suggestion in detail..."
              />
            </div>

            <div className="pt-6 border-t border-slate-800">
              <button
                type="submit"
                disabled={isSubmitting || !formData.message.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Feedback
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
