'use client';

import React, { useState, useMemo } from 'react';
import { Search, Building2, ShieldCheck, Briefcase, MapPin, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface ProcurementItem {
  id: number;
  category: string;
  procuring_agency: string;
  procurement_method: string;
  award_date: string;
  company_name: string;
  company_dzongkhag: string;
  value_million_nu: number | string;
}

export default function DashboardClient({ initialData }: { initialData: ProcurementItem[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDzongkhag, setSelectedDzongkhag] = useState('All');

  // 1. Search & Filter Pipeline
  const filteredData = useMemo(() => {
    return initialData.filter((item) => {
      const matchesSearch = 
        item.procuring_agency?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDzongkhag = selectedDzongkhag === 'All' || item.company_dzongkhag === selectedDzongkhag;
      
      return matchesSearch && matchesDzongkhag;
    });
  }, [searchTerm, selectedDzongkhag, initialData]);

  // 2. Extract unique list of Dzongkhags for selector dropdown
  const dzongkhagsList = useMemo(() => {
    const list = new Set(initialData.map(i => i.company_dzongkhag).filter(Boolean));
    return ['All', ...Array.from(list)].sort();
  }, [initialData]);

  // 3. Analytics Aggregation: Top 10 Agencies
  const topAgencies = useMemo(() => {
    const counts: Record<string, { count: number; value: number }> = {};
    filteredData.forEach(item => {
      const name = item.procuring_agency || 'Unknown';
      const val = Number(item.value_million_nu || 0);
      if (!counts[name]) counts[name] = { count: 0, value: 0 };
      counts[name].count += 1;
      counts[name].value += val;
    });
    return Object.entries(counts)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredData]);

  // 4. Analytics Aggregation: Top 10 Vendors
  const topVendors = useMemo(() => {
    const counts: Record<string, { count: number; value: number }> = {};
    filteredData.forEach(item => {
      const name = item.company_name || 'Unknown';
      const val = Number(item.value_million_nu || 0);
      if (!counts[name]) counts[name] = { count: 0, value: 0 };
      counts[name].count += 1;
      counts[name].value += val;
    });
    return Object.entries(counts)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [filteredData]);

  // 5. Analytics Aggregation: Trend Line over Time (Month Wise)
  const chronologicalTrend = useMemo(() => {
    const monthlySpend: Record<string, number> = {};
    filteredData.forEach(item => {
      if (!item.award_date) return;
      const date = new Date(item.award_date);
      if (isNaN(date.getTime())) return;
      
      // Group by "YYYY-MM"
      const monthKey = date.toISOString().substring(0, 7); 
      monthlySpend[monthKey] = (monthlySpend[monthKey] || 0) + Number(item.value_million_nu || 0);
    });

    return Object.entries(monthlySpend)
      .map(([month, total]) => ({
        month: new Date(month + '-02').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        rawDate: month,
        'Spend (M Nu.)': Number(total.toFixed(2))
      }))
      .sort((a, b) => a.rawDate.localeCompare(b.rawDate));
  }, [filteredData]);

  // 6. Analytics Aggregation: Dzongkhag Concentration Density
  const dzongkhagConcentration = useMemo(() => {
    const counts: Record<string, { count: number; value: number }> = {};
    filteredData.forEach(item => {
      const name = item.company_dzongkhag || 'Unspecified';
      const val = Number(item.value_million_nu || 0);
      if (!counts[name]) counts[name] = { count: 0, value: 0 };
      counts[name].count += 1;
      counts[name].value += val;
    });
    return Object.entries(counts)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  return (
    <main className="min-h-screen bg-slate-50/60 p-4 md:p-8 font-sans antialiased text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Operational Command Center */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-950 tracking-tight">Bhutan Procurement Analytics Engine</h1>
              <p className="text-sm text-slate-500">Live vendor distribution, agency commitments, and macro market spend indicators.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Dynamic Interactive Filters */}
              <div className="relative flex items-center">
                <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                <input 
                  type="text" 
                  placeholder="Search agency or vendor..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="relative">
                <select 
                  value={selectedDzongkhag} 
                  onChange={(e) => setSelectedDzongkhag(e.target.value)}
                  className="w-full sm:w-48 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                >
                  {dzongkhagsList.map(dz => (
                    <option key={dz} value={dz}>Dzongkhag: {dz}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Chronological Spending Trend Analysis Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-950">Trend Line of Spend Over Time (Month-Wise)</h2>
          </div>
          <div className="w-full h-64">
            {chronologicalTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chronologicalTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" fontSize={11} tickLine={false} stroke="#94a3b8" />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '12px', border: 'none' }} />
                  <Area type="monotone" dataKey="Spend (M Nu.)" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSpend)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No time-series indicators available for chosen criteria.</div>
            )}
          </div>
        </div>

        {/* Top 10 Macro Analytics Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Top 10 Procuring Agencies */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-950 text-sm">Top 10 Procuring Agencies by Value & Volume</h3>
            </div>
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {topAgencies.map((agency, idx) => (
                <div key={agency.name} className="p-4 flex items-center justify-between text-sm hover:bg-slate-50/40 transition-colors">
                  <div className="max-w-[70%] truncate">
                    <span className="text-xs font-bold text-slate-400 mr-2 inline-block w-4">{idx + 1}</span>
                    <span className="font-semibold text-slate-900">{agency.name}</span>
                    <p className="text-xs text-slate-400 mt-0.5">{agency.count} Tenders Managed</p>
                  </div>
                  <span className="font-mono font-bold text-slate-950 bg-slate-100/80 px-2.5 py-1 rounded-lg text-xs">
                    {agency.value.toFixed(2)} M Nu.
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Top 10 Vendors */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-950 text-sm">Top 10 Corporate Contractors / Vendors</h3>
            </div>
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {topVendors.map((vendor, idx) => (
                <div key={vendor.name} className="p-4 flex items-center justify-between text-sm hover:bg-slate-50/40 transition-colors">
                  <div className="max-w-[70%] truncate">
                    <span className="text-xs font-bold text-slate-400 mr-2 inline-block w-4">{idx + 1}</span>
                    <span className="font-semibold text-slate-900">{vendor.name}</span>
                    <p className="text-xs text-slate-400 mt-0.5">Awarded {vendor.count} projects</p>
                  </div>
                  <span className="font-mono font-bold text-emerald-950 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg text-xs">
                    {vendor.value.toFixed(2)} M Nu.
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Regional Concentration Matrix */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-rose-600" />
            <h3 className="font-bold text-slate-950 text-sm">Concentration Matrix of Vendors Across Dzongkhags</h3>
          </div>
          <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {dzongkhagConcentration.map((item) => (
              <div key={item.name} className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-1.5 hover:shadow-xs transition-shadow">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-tight block truncate">{item.name}</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-slate-900">{item.count}</span>
                  <span className="text-[10px] text-slate-400 font-bold">Vendors</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-full rounded-full" 
                    style={{ width: `${Math.min((item.count / filteredData.length) * 100 || 0, 100)}%` }} 
                  />
                </div>
                <span className="text-[11px] font-semibold text-slate-500 block">
                  {item.value.toFixed(1)}M Nu.
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}