"use client";

import { useUserStore } from '@/store/userStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogOut, Edit3, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function ProfilePage() {
  const { user, logout, updateProfile } = useUserStore();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !user) return null;

  const joinDate = user.joinedAt
    ? new Date(user.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Recently';

  const handleLogout = async () => {
    if (auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    logout();
    router.push('/login');
  };

  const startEdit = () => {
    setEditName(user.name);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditName('');
  };

  const saveEdit = () => {
    if (editName.trim() && editName.trim() !== user.name) {
      updateProfile({ name: editName.trim() });
    }
    setIsEditing(false);
  };

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
        <div className="glass-card p-8 sm:p-10 rounded-2xl text-center relative">
          {/* Avatar */}
          <div className="relative inline-block mb-6">
            <div
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1.5 mx-auto"
              style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
            >
              <div
                className="w-full h-full rounded-full flex items-center justify-center shadow-lg"
                style={{ 
                  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                  boxShadow: '0 4px 20px rgba(124, 58, 237, 0.35)' 
                }}
              >
                <span className="text-4xl sm:text-5xl font-extrabold text-white">
                  {user.name?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
            </div>
          </div>

          {/* Name Section */}
          <div className="mb-2">
            {isEditing ? (
              <div className="flex items-center justify-center gap-2 mb-2">
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="px-3 py-2 rounded-lg text-center font-bold text-lg sm:text-xl outline-none"
                  style={{
                    background: 'var(--input-bg)',
                    border: '1.5px solid var(--border-solid)',
                    color: 'var(--text)'
                  }}
                  autoFocus
                />
                <button onClick={saveEdit} className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors">
                  <Check className="w-5 h-5" />
                </button>
                <button onClick={cancelEdit} className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 mb-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--text)' }}>
                  {user.name}
                </h1>
                <button 
                  onClick={startEdit}
                  className="p-2 rounded-full transition-colors hover:bg-blue-500/10 group"
                  aria-label="Edit Name"
                >
                  <Edit3 className="w-4 h-4 text-[var(--text-muted)] group-hover:text-blue-500 transition-colors" />
                </button>
              </div>
            )}
          </div>

          <p className="mb-4 text-sm sm:text-base font-medium" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
          
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-8"
            style={{
              background: 'var(--surface-hover)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
            }}
          >
            <span>📅</span> Joined {joinDate}
          </div>

          {/* Sign Out Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl transition-all font-bold text-sm shadow-sm active:scale-[0.98]"
            style={{
              color: '#ef4444',
              border: '1.5px solid rgba(239,68,68,0.3)',
              background: 'rgba(239,68,68,0.05)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.1)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.05)';
            }}
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </motion.div>
    </div>
  );
}
