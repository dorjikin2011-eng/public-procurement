'use client';

import React, { useState, useMemo } from 'react';
import { Search, Building2, ShieldCheck, Briefcase, MapPin, TrendingUp, PieChart as PieIcon, ListChecks, Layers } from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, 
  PieChart, Pie, Cell, Legend, LineChart, Line 
} from 'recharts';

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

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

export default function DashboardClient({ initialData }: { initialData: ProcurementItem[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDzongkhag, setSelectedDzongkhag] = useState('All');

  // 1. Interactive Filter Pipeline
  const filteredData = useMemo(() => {
    return initialData.filter((item) => {
      const matchesSearch = 
        item.procuring_agency?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDzongkhag = selectedDzongkhag === 'All' || item.company_dzongkhag === selectedDzongkhag;
      
      return matchesSearch && matchesDzongkhag;
    });
  }, [searchTerm, selectedDzongkhag, initialData]);

  const dzongkhagsList = useMemo(() => {
    const list = new Set(initialData.map(i => i.company_dzongkhag).filter(Boolean));
    return ['All', ...Array.from(list)].sort();
  }, [initialData]);

  // 2. Vendor Volume Clustering Engine
  const vendorClusters = useMemo(() => {
    const vendorMetrics: Record<string, { count: number; value: number }> = {};
    
    filteredData.forEach(item => {
      const name = item.company_name || 'Unknown';
      if (!vendorMetrics[name]) vendorMetrics[name] = { count: 0, value: 0 };
      vendorMetrics[name].count += 1;
      vendorMetrics[name].value += Number(item.value_million_nu || 0);
    });

    const clusters = {
      tier1: { name: 'Tier 1: High-Volume Anchors (≥ 5 Awards)', vendorsCount: 0, totalValue: 0, totalAwards: 0 },
      tier2: { name: 'Tier 2: Mid-Market Operators (2-4 Awards)', vendorsCount: 0, totalValue: 0, totalAwards: 0 },
      tier3: { name: 'Tier 3: Niche / Single-Project Contractors (1 Award)', vendorsCount: 0, totalValue: 0, totalAwards: 0 },
    };

    Object.values(vendorMetrics).forEach(v => {
      if (v.count >= 5) {
        clusters.tier1.vendorsCount += 1;
        clusters.tier1.totalValue += v.value;
        clusters.tier1.totalAwards += v.count;
      } else if (v.count >= 2) {
        clusters.tier2.vendorsCount += 1;
        clusters.tier2.totalValue += v.value;
        clusters.tier2.totalAwards += v.count;
      } else {
        clusters.tier3.vendorsCount += 1;
        clusters.tier3.totalValue += v.value;
        clusters.tier3.totalAwards += v.count;
      }
    });

    return clusters;
  }, [filteredData]);

  // 3. Top 10 Agencies
  const agenciesByValue = useMemo(() => {
    const counts: Record<string, { count: number; value: number }> = {};
    filteredData.forEach(item => {
      const name = item.procuring_agency || 'Unknown';
      if (!counts[name]) counts[name] = { count: 0, value: 0 };
      counts[name].count += 1;
      counts[name].value += Number(item.value_million_nu || 0);
    });
    return Object.entries(counts).map(([name, s]) => ({ name, ...s }))
      .sort((a, b) => b.value - a.value).slice(0, 10);
  }, [filteredData]);

  const agenciesByCount = useMemo(() => {
    const counts: Record<string, { count: number; value: number }> = {};
    filteredData.forEach(item => {
      const name = item.procuring_agency || 'Unknown';
      if (!counts[name]) counts[name] = { count: 0, value: 0 };
      counts[name].count += 1;
      counts[name].value += Number(item.value_million_nu || 0);
    });
    return Object.entries(counts).map(([name, s]) => ({ name, ...s }))
      .sort((a, b) => b.count - a.count).slice(0, 10);
  }, [filteredData]);

  // 4. Top 10 Vendors
  const vendorsByValue = useMemo(() => {
    const counts: Record<string, { count: number; value: number }> = {};
    filteredData.forEach(item => {
      const name = item.company_name || 'Unknown';
      if (!counts[name]) counts[name] = { count: 0, value: 0 };
      counts[name].count += 1;
      counts[name].value += Number(item.value_million_nu || 0);
    });
    return Object.entries(counts).map(([name, s]) => ({ name, ...s }))
      .sort((a, b) => b.value - a.value).slice(0, 10);
  }, [filteredData]);

  const vendorsByCount = useMemo(() => {
    const counts: Record<string, { count: number; value: number }> = {};
    filteredData.forEach(item => {
      const name = item.company_name || 'Unknown';
      if (!counts[name]) counts[name] = { count: 0, value: 0 };
      counts[name].count += 1;
      counts[name].value += Number(item.value_million_nu || 0);
    });
    return Object.entries(counts).map(([name, s]) => ({ name, ...s }))
      .sort((a, b) => b.count - a.count).slice(0, 10);
  }, [filteredData]);

  // 5. Pie Charts Data
  const categoryPieData = useMemo(() => {
    const distribution: Record<string, number> = {};
    filteredData.forEach(item => {
      const cat = item.category || 'Uncategorized';
      distribution[cat] = (distribution[cat] || 0) + 1;
    });
    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const methodPieData = useMemo(() => {
    const distribution: Record<string, number> = {};
    filteredData.forEach(item => {
      const method = item.procurement_method || 'Direct / Specified';
      distribution[method] = (distribution[method] || 0) + 1;
    });
    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  // 6. Timeline Trends
  const uniqueMethods = useMemo(() => {
    return Array.from(new Set(filteredData.map(i => i.procurement_method).filter(Boolean)));
  }, [filteredData]);

  const methodTimelineTrend = useMemo(() => {
    const monthlyGroups: Record<string, Record<string, number>> = {};
    
    filteredData.forEach(item => {
      if (!item.award_date) return;
      const date = new Date(item.award_date);
      if (isNaN(date.getTime())) return;
      
      const monthKey = date.toISOString().substring(0, 7);
      const method = item.procurement_method || 'Unknown';
      
      if (!monthlyGroups[monthKey]) monthlyGroups[monthKey] = {};
      monthlyGroups[monthKey][method] = (monthlyGroups[monthKey][method] || 0) + 1;
    });

    return Object.entries(monthlyGroups)
      .map(([month, methods]) => ({
        month: new Date(month + '-02').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        rawDate: month,
        ...methods
      }))
      .sort((a, b) => a.rawDate.localeCompare(b.rawDate));
  }, [filteredData]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <main className="min-h-screen bg-slate-50/60 p-4 md:p-8 font-sans antialiased text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Control Deck */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-950 tracking-tight">Bhutan Public Procurement Deep-Analytics Portal</h1>
              <p className="text-sm text-slate-500">Comprehensive audit metrics, vendor volume clustering, and time-series process tracing.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
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
                  className="w-full sm:w-48 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden appearance-none cursor-pointer"
                >
                  {dzongkhagsList.map(dz => (
                    <option key={dz} value={dz}>Dzongkhag: {dz}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Matrix */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-950">Procurement Methods Usage Timeline (Tender Count Month-Wise)</h2>
          </div>
          <div className="w-full h-72">
            {methodTimelineTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={methodTimelineTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" fontSize={11} tickLine={false} stroke="#94a3b8" />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#94a3b8" />
                  <Tooltip contentStyle={{ background: '#0f172a', borderRadius: '12px', color: '#fff', fontSize: '11px', border: 'none' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  {uniqueMethods.map((method, index) => (
                    <Line key={method} type="monotone" dataKey={method} stroke={COLORS[index % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">No time-series distribution available.</div>
            )}
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <PieIcon className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-950">Procurement Segment Distribution Categories (Volume Count)</h3>
            </div>
            <div className="w-full h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={4} dataKey="value">
                    {categoryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Tenders`, 'Volume']} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <PieIcon className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-950">Procurement Method Composition Ratios (Volume Count)</h3>
            </div>
            <div className="w-full h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={methodPieData} cx="50%" cy="50%" innerRadius={0} outerRadius={80} dataKey="value">
                    {methodPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} Uses`, 'Count']} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RESTORED: Vendor Volume Clustering Matrix Card Grid */}
        <div className="space-y-4">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" /> Market Density: Vendor Volume Clustering
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Tier 1 Card */}
            <div className="bg-gradient-to-br from-indigo-50/40 to-white border border-indigo-100 rounded-2xl p-5 shadow-xs">
              <div className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-md px-2 py-0.5 w-max mb-3">
                {vendorClusters.tier1.name}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Unique Entities</p>
                  <p className="text-xl font-extrabold text-slate-950">{vendorClusters.tier1.vendorsCount}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Financial Footprint</p>
                  <p className="text-xl font-extrabold text-slate-950 font-mono">{vendorClusters.tier1.totalValue.toFixed(2)}M</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">Responsible for <span className="font-bold text-slate-800">{vendorClusters.tier1.totalAwards}</span> total award wins.</p>
            </div>

            {/* Tier 2 Card */}
            <div className="bg-gradient-to-br from-amber-50/30 to-white border border-amber-100 rounded-2xl p-5 shadow-xs">
              <div className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-0.5 w-max mb-3">
                {vendorClusters.tier2.name}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Unique Entities</p>
                  <p className="text-xl font-extrabold text-slate-950">{vendorClusters.tier2.vendorsCount}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Financial Footprint</p>
                  <p className="text-xl font-extrabold text-slate-950 font-mono">{vendorClusters.tier2.totalValue.toFixed(2)}M</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">Responsible for <span className="font-bold text-slate-800">{vendorClusters.tier2.totalAwards}</span> total award wins.</p>
            </div>

            {/* Tier 3 Card */}
            <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <div className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200/60 rounded-md px-2 py-0.5 w-max mb-3">
                {vendorClusters.tier3.name}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Unique Entities</p>
                  <p className="text-xl font-extrabold text-slate-950">{vendorClusters.tier3.vendorsCount}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Financial Footprint</p>
                  <p className="text-xl font-extrabold text-slate-950 font-mono">{vendorClusters.tier3.totalValue.toFixed(2)}M</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">Responsible for <span className="font-bold text-slate-800">{vendorClusters.tier3.totalAwards}</span> total award wins.</p>
            </div>

          </div>
        </div>

        {/* Top 10 Leaderboards Section */}
        <div className="space-y-8">
          <div>
            <h2 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" /> Top Procuring Agencies Metrics
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 font-bold text-xs text-slate-500 uppercase tracking-wider">Top 10 by Total Value (Millions Nu.)</div>
                <div className="divide-y divide-slate-100">
                  {agenciesByValue.map((a, i) => (
                    <div key={a.name} className="p-3.5 flex items-center justify-between text-sm hover:bg-slate-50/30 transition-colors">
                      <div className="truncate max-w-[70%]"><span className="text-slate-400 text-xs font-bold mr-2 w-4 inline-block">{i+1}</span><span className="font-semibold text-slate-900">{a.name}</span></div>
                      <span className="font-mono text-xs font-bold bg-slate-100 px-2.5 py-1 rounded-lg text-slate-950">{a.value.toFixed(2)} M Nu.</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 font-bold text-xs text-slate-500 uppercase tracking-wider">Top 10 by Tender Process Volume Count</div>
                <div className="divide-y divide-slate-100">
                  {agenciesByCount.map((a, i) => (
                    <div key={a.name} className="p-3.5 flex items-center justify-between text-sm hover:bg-slate-50/30 transition-colors">
                      <div className="truncate max-w-[70%]"><span className="text-slate-400 text-xs font-bold mr-2 w-4 inline-block">{i+1}</span><span className="font-semibold text-slate-900">{a.name}</span></div>
                      <span className="font-mono text-xs font-bold bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg text-indigo-700">{a.count} Tenders</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-emerald-600" /> Top Contractors & Vendor Allocations
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 font-bold text-xs text-slate-500 uppercase tracking-wider">Top 10 Corporate Partners by Value</div>
                <div className="divide-y divide-slate-100">
                  {vendorsByValue.map((v, i) => (
                    <div key={v.name} className="p-3.5 flex items-center justify-between text-sm hover:bg-slate-50/30 transition-colors">
                      <div className="truncate max-w-[70%]"><span className="text-slate-400 text-xs font-bold mr-2 w-4 inline-block">{i+1}</span><span className="font-semibold text-slate-900">{v.name}</span></div>
                      <span className="font-mono text-xs font-bold bg-slate-100 px-2.5 py-1 rounded-lg text-slate-950">{v.value.toFixed(2)} M Nu.</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 font-bold text-xs text-slate-500 uppercase tracking-wider">Top 10 Corporate Partners by Success Volume Count</div>
                <div className="divide-y divide-slate-100">
                  {vendorsByCount.map((v, i) => (
                    <div key={v.name} className="p-3.5 flex items-center justify-between text-sm hover:bg-slate-50/30 transition-colors">
                      <div className="truncate max-w-[70%]"><span className="text-slate-400 text-xs font-bold mr-2 w-4 inline-block">{i+1}</span><span className="font-semibold text-slate-900">{v.name}</span></div>
                      <span className="font-mono text-xs font-bold bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg text-emerald-700">{v.count} Projects</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Contracts Portfolio Table Log */}
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-slate-700" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Procurement Awards Records Registry</h3>
              <p className="text-xs text-slate-500 mt-0.5">Live-filtered matching audit registry rows ({filteredData.length} records found).</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Procuring Agency</th>
                  <th className="p-4">Contractor / Company Name</th>
                  <th className="p-4">Award Date</th>
                  <th className="p-4">Method</th>
                  <th className="p-4 text-right">Value (M Nu.)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredData.slice(0, 25).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-4 font-medium text-slate-950 max-w-xs truncate">{item.procuring_agency}</td>
                    <td className="p-4 font-normal text-slate-600 max-w-xs truncate">{item.company_name}</td>
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-700 text-xs font-medium px-2 py-1 rounded-md whitespace-nowrap">
                        {formatDate(item.award_date)}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-mono text-slate-500">{item.procurement_method}</td>
                    <td className="p-4 text-right font-semibold text-slate-900">
                      {Number(item.value_million_nu).toFixed(3)}
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-sm text-slate-400 font-medium">
                      No active records match the current search filters. Try refining your keywords.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredData.length > 25 && (
            <div className="p-4 text-center border-t border-slate-100 bg-slate-50/30 text-xs text-slate-400 font-medium">
              Showing top 25 rows out of matching result criteria. Use search queries or dropdown targets to narrow results.
            </div>
          )}
        </div>

      </div>
    </main>
  );
}