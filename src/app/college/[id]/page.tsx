"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { fetchAllCutoffs } from '@/lib/db';
import { CutoffRecord } from '@/types';
import { Building2, MapPin, Globe, GraduationCap, BarChart3, AlertCircle, Loader2, BookOpen } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export default function CollegeDetailPage() {
  const params = useParams();
  const id = decodeURIComponent(params.id as string);
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CutoffRecord[]>([]);

  useEffect(() => {
    async function loadData() {
      const allData = await fetchAllCutoffs();
      const collegeData = allData.filter(d => d.institute === id);
      setData(collegeData);
      setLoading(false);
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold text-white">Loading College Details...</h2>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-16 h-16 text-slate-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">College Not Found</h2>
        <p className="text-slate-400">The requested institute could not be found in the database.</p>
      </div>
    );
  }

  const typeLabel = data[0].type ? `${data[0].type} Institute` : undefined;
  const district = data[0].district ?? 'West Bengal';
  const uniqueBranches = Array.from(new Set(data.map(d => d.program))).sort();
  
  // Prepare chart data for the most popular branch
  const firstBranch = uniqueBranches[0];
  const branchData = data.filter(d => d.program === firstBranch && d.category === 'Open');
  const chartData = branchData.map(d => ({
    round: d.round,
    opening: d.openingRank,
    closing: d.closingRank
  }));

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-12">
      <div className="glass-card p-8 rounded-3xl border border-slate-700/50 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <Building2 className="w-48 h-48 text-blue-500" />
        </div>
        
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 relative z-10">{id}</h1>
        
        <div className="flex flex-wrap gap-4 relative z-10">
          {typeLabel && (
            <span className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-xl text-slate-300 border border-slate-700">
              <Building2 className="w-5 h-5 text-blue-400" />
              {typeLabel}
            </span>
          )}
          <span className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-xl text-slate-300 border border-slate-700">
            <MapPin className="w-5 h-5 text-red-400" />
            {district}
          </span>
          <span className="flex items-center gap-2 bg-slate-900/80 px-4 py-2 rounded-xl text-slate-300 border border-slate-700">
            <GraduationCap className="w-5 h-5 text-emerald-400" />
            {uniqueBranches.length} Programs
          </span>
          <a href="#" className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 transition-colors px-4 py-2 rounded-xl text-blue-300 border border-blue-500/30">
            <Globe className="w-5 h-5" />
            Official Website
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Programs List */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 rounded-3xl border border-slate-700/50">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-400" />
              Available Programs
            </h2>
            <ul className="space-y-3">
              {uniqueBranches.map(branch => (
                <li key={branch} className="text-slate-300 bg-slate-900/50 p-3 rounded-xl border border-slate-800 text-sm">
                  {branch}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Charts & Stats */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card p-6 md:p-8 rounded-3xl border border-slate-700/50">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Cutoff Trends: {firstBranch} (Open Category)
            </h2>
            <div className="h-[300px] w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                    <XAxis dataKey="round" stroke="#94a3b8" axisLine={false} tickLine={false} />
                    <YAxis stroke="#94a3b8" axisLine={false} tickLine={false} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '12px' }}
                    />
                    <Line type="monotone" dataKey="closing" name="Closing Rank" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} />
                    <Line type="monotone" dataKey="opening" name="Opening Rank" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500">
                  Not enough data for chart
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
