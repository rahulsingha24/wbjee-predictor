"use client";

import { useEffect, useState } from 'react';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { Users, UserPlus, PieChart, Activity } from 'lucide-react';

interface UserData {
  name: string;
  email: string;
  source: string;
  loginTime: any;
  lastActive: any;
  deviceInfo: string;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (isFirebaseConfigured && db) {
        try {
          const q = query(collection(db, 'users'), orderBy('lastActive', 'desc'), limit(100));
          const snapshot = await getDocs(q);
          const userData = snapshot.docs.map(doc => doc.data() as UserData);
          setUsers(userData);
        } catch (err) {
          console.error("Error fetching users:", err);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  // Calculate Stats
  const totalUsers = users.length;
  
  // Daily Signups (rough calculation from loginTime)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dailySignups = users.filter(u => {
    if (!u.loginTime) return false;
    const date = u.loginTime.toDate ? u.loginTime.toDate() : new Date(u.loginTime);
    return date >= today;
  }).length;

  // Source Stats
  const sourceStats = users.reduce((acc, user) => {
    const s = user.source || 'Unknown';
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-slate-400">Overview of user statistics and recent activity.</p>
      </div>

      {!isFirebaseConfigured && (
        <div className="bg-amber-500/10 border border-amber-500/50 text-amber-500 p-4 rounded-xl mb-8">
          Warning: Firebase is not configured. Admin data cannot be loaded.
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="glass-card p-6 rounded-2xl border border-slate-700/50">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Total Users</p>
              <h3 className="text-2xl font-bold text-white">{totalUsers}</h3>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-700/50">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Daily Signups</p>
              <h3 className="text-2xl font-bold text-white">{dailySignups}</h3>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-slate-700/50 lg:col-span-2">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center shrink-0">
              <PieChart className="w-6 h-6 text-purple-400" />
            </div>
            <div className="w-full">
              <p className="text-slate-400 text-sm mb-2">Top Sources</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(sourceStats)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([source, count]) => (
                    <div key={source} className="bg-slate-800 px-3 py-1.5 rounded-lg text-sm border border-slate-700">
                      <span className="text-white">{source}:</span> <span className="text-blue-400 font-bold">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Logins Table */}
      <div className="glass-card rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <Activity className="w-5 h-5 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Recent Logins</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-6 py-4 text-sm font-medium text-slate-400">Name</th>
                <th className="px-6 py-4 text-sm font-medium text-slate-400">Email</th>
                <th className="px-6 py-4 text-sm font-medium text-slate-400">Source</th>
                <th className="px-6 py-4 text-sm font-medium text-slate-400">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {users.map((user, i) => (
                <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 text-white font-medium">{user.name}</td>
                  <td className="px-6 py-4 text-slate-400">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded-md text-xs border border-blue-500/20">
                      {user.source || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm">
                    {user.lastActive?.toDate ? new Date(user.lastActive.toDate()).toLocaleString() : 'Recent'}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
