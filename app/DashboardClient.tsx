'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, Building2, Briefcase, MapPin, TrendingUp, 
  PieChart as PieIcon, ListChecks, Layers, Link2, Globe, AlertTriangle, CalendarRange
} from 'lucide-react';
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

  // 1. Filter Pipeline
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

  // 3. RESTORED & DEEPENED: Dzongkhag Concentration Matrix
  const dzongkhagConcentration = useMemo(() => {
    const counts: Record<string, { count: number; value: number; uniqueVendors: Set<string> }> = {};
    filteredData.forEach(item => {
      const name = item.company_dzongkhag || 'Unspecified';
      const val = Number(item.value_million_nu || 0);
      const vendor = item.company_name || 'Unknown';
      
      if (!counts[name]) counts[name] = { count: 0, value: 0, uniqueVendors: new Set() };
      counts[name].count += 1;
      counts[name].value += val;
      counts[name].uniqueVendors.add(vendor);
    });
    return Object.entries(counts)
      .map(([name, stats]) => ({ 
        name, 
        count: stats.count, 
        value: stats.value, 
        vendorsCount: stats.uniqueVendors.size 
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  // 4. NEW: Same Agency - Same Vendor Relationship Frequency (Top 5)
  const agencyVendorRelationships = useMemo(() => {
    const pairs: Record<string, { agency: string; vendor: string; count: number; totalValue: number }> = {};
    filteredData.forEach(item => {
      if (!item.procuring_agency || !item.company_name) return;
      const key = `${item.procuring_agency}|||${item.company_name}`;
      if (!pairs[key]) {
        pairs[key] = { agency: item.procuring_agency, vendor: item.company_name, count: 0, totalValue: 0 };
      }
      pairs[key].count += 1;
      pairs[key].totalValue += Number(item.value_million_nu || 0);
    });
    return Object.values(pairs).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [filteredData]);

  // 5. NEW: Geographic Reach of Same Vendor (Count of distinct Dzongkhags active)
  const vendorGeographicReach = useMemo(() => {
    const reach: Record<string, Set<string>> = {};
    const values: Record<string, number> = {};
    filteredData.forEach(item => {
      if (!item.company_name || !item.company_dzongkhag) return;
      if (!reach[item.company_name]) reach[item.company_name] = new Set();
      reach[item.company_name].add(item.company_dzongkhag);
      values[item.company_name] = (values[item.company_name] || 0) + Number(item.value_million_nu || 0);
    });
    return Object.entries(reach)
      .map(([name, dzs]) => ({ name, dzCount: dzs.size, totalValue: values[name] }))
      .sort((a, b) => b.dzCount - a.dzCount || b.totalValue - a.totalValue)
      .slice(0, 5);
  }, [filteredData]);

  // 6. MACRO METRIC: Herfindahl-Hirschman Index (HHI) Market Concentration Score
  const macroHhiIndex = useMemo(() => {
    const vendorSpend: Record<string, number> = {};
    let totalMarketSpend = 0;

    filteredData.forEach(item => {
      const name = item.company_name || 'Unknown';
      const val = Number(item.value_million_nu || 0);
      vendorSpend[name] = (vendorSpend[name] || 0) + val;
      totalMarketSpend += val;
    });

    if (totalMarketSpend === 0) return { score: 0, status: 'Extremely Fragmented' };

    let hhiSum = 0;
    Object.values(vendorSpend).forEach(value => {
      const marketSharePercentage = (value / totalMarketSpend) * 100;
      hhiSum += marketSharePercentage * marketSharePercentage;
    });

    let status = 'Highly Competitive';
    if (hhiSum >= 2500) status = 'Highly Concentrated / Monopolistic Risk';
    else if (hhiSum >= 1500) status = 'Moderate Concentration Market';

    return { score: Math.round(hhiSum), status };
  }, [filteredData]);

  // 7. MACRO METRIC: Fiscal Month Velocity Tracker (Spotting rush cycles)
  const seasonalVelocityTrend = useMemo(() => {
    const monthCounts: Record<string, number> = {};
    filteredData.forEach(item => {
      if (!item.award_date) return;
      const date = new Date(item.award_date);
      if (isNaN(date.getTime())) return;
      const monthName = date.toLocaleDateString('en-US', { month: 'long' });
      monthCounts[monthName] = (monthCounts[monthName] || 0) + 1;
    });
    return Object.entries(monthCounts).sort((a, b) => b[1] - a[1]);
  }, [filteredData]);

  // Top 10 Matrices
  const agenciesByValue = useMemo(() => {
    const counts: Record<string, { count: number; value: number }> = {};
    filteredData.forEach(item => {
      const name = item.procuring_agency || 'Unknown';
      if (!counts[name]) counts[name] = { count: 0, value: 0 };
      counts[name].count += 1;
      counts[name].value += Number(item.value_million_nu || 0);
    });
    return Object.entries(counts).map(([name, s]) => ({ name, ...s })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [filteredData]);

  const agenciesByCount = useMemo(() => {
    const counts: Record<string, { count: number; value: number }> = {};
    filteredData.forEach(item => {
      const name = item.procuring_agency || 'Unknown';
      if (!counts[name]) counts[name] = { count: 0, value: 0 };
      counts[name].count += 1;
      counts[name].value += Number(item.value_million_nu || 0);
    });
    return Object.entries(counts).map(([name, s]) => ({ name, ...s })).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [filteredData]);

  const vendorsByValue = useMemo(() => {
    const counts: Record<string, { count: number; value: number }> = {};
    filteredData.forEach(item => {
      const name = item.company_name || 'Unknown';
      if (!counts[name]) counts[name] = { count: 0, value: 0 };
      counts[name].count += 1;
      counts[name].value += Number(item.value_million_nu || 0);
    });
    return Object.entries(counts).map(([name, s]) => ({ name, ...s })).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [filteredData]);

  const vendorsByCount = useMemo(() => {
    const counts: Record<string, { count: number; value: number }> = {};
    filteredData.forEach(item => {
      const name = item.company_name || 'Unknown';
      if (!counts[name]) counts[name] = { count: 0, value: 0 };
      counts[name].count += 1;
      counts[name].value += Number(item.value_million_nu || 0);
    });
    return Object.entries(counts).map(([name, s]) => ({ name, ...s })).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [filteredData]);

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

  const uniqueMethods = useMemo(() => Array.from(new Set(filteredData.map(i => i.procurement_method).filter(Boolean))), [filteredData]);

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
      })).sort((a, b) => a.rawDate.localeCompare(b.rawDate));
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
        
        {/* Control Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-950 tracking-tight">Bhutan Public Procurement Deep-Analytics Portal</h1>
              <p className="text-sm text-slate-500">Comprehensive audit metrics, vendor volume clustering, and macro-market risk tracing.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex items-center">
                <Search className="absolute left-3 w-4 h-4 text-slate-400 pointer-events-none" />
                <input 
                  type="text" 
                  placeholder="Search agency or vendor..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full sm:w-64 pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden transition-all"
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

        {/* NEW: Macro Market Concentration (HHI) & Velocity Header Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-xs">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Macro Market Concentration Score (HHI)</span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-slate-990 font-mono">{macroHhiIndex.score}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${macroHhiIndex.score >= 2500 ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700'}`}>
                  {macroHhiIndex.status}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-xs">
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <CalendarRange className="w-6 h-6" />
            </div>
            <div className="w-full">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Peak Fiscal Award Activity Cycle</span>
              <p className="text-sm font-bold text-slate-900 mt-1">
                Highest Volume: <span className="text-indigo-600">{seasonalVelocityTrend[0]?.[0] || 'N/A'}</span> ({seasonalVelocityTrend[0]?.[1] || 0} contracts)
              </p>
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

        {/* NEW COMPLIANCE DECK: Relationship Loops & Territorial Reach */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Top 5 Agency-Vendor Relationship Loops */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <Link2 className="w-4 h-4 text-rose-600" />
              <h3 className="font-bold text-slate-950 text-sm">Exclusive Agency-to-Vendor Pairing Recurrence (Top 5 Cases)</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {agencyVendorRelationships.map((pair, i) => (
                <div key={i} className="p-4 flex items-center justify-between text-sm hover:bg-slate-50/30 transition-colors">
                  <div className="truncate max-w-[75%]">
                    <span className="font-bold text-slate-900 block truncate">{pair.agency}</span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      ↳ Connected Contractor: <span className="font-semibold text-slate-600">{pair.vendor}</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded-md block w-max ml-auto">
                      {pair.count} Award Loops
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">{pair.totalValue.toFixed(2)}M Nu.</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top 5 Vendors Geographic Reach */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-950 text-sm">Geographic Mobility: Vendor Reach Across Separate Dzongkhags</h3>
            </div>
            <div className="divide-y divide-slate-100">
              {vendorGeographicReach.map((vendor, i) => (
                <div key={i} className="p-4 flex items-center justify-between text-sm hover:bg-slate-50/30 transition-colors">
                  <div className="truncate max-w-[70%]">
                    <span className="font-semibold text-slate-900 block truncate">{vendor.name}</span>
                    <span className="text-xs text-slate-400 mt-0.5">National-scale infrastructure mobilization</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-md block w-max ml-auto">
                      {vendor.dzCount} Dzongkhags Active
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">Total: {vendor.totalValue.toFixed(2)}M Nu.</span>
                  </div>
                </div>
              ))}
            </div>
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

        {/* RESTORED: Vendor Concentration by Dzongkhags Matrix */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-950 text-sm">Vendor Concentration Matrix Across Dzongkhags</h3>
          </div>
          <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {dzongkhagConcentration.map((item) => (
              <div key={item.name} className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-1.5 hover:shadow-xs transition-all">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-tight block truncate">{item.name}</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-slate-900">{item.vendorsCount}</span>
                  <span className="text-[10px] text-slate-400 font-bold">Vendors</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${Math.min((item.count / filteredData.length) * 100 || 0, 100)}%` }} />
                </div>
                <span className="text-[11px] font-semibold text-slate-500 block">
                  {item.value.toFixed(1)}M Nu. ({item.count} projects)
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Vendor Clustering */}
        <div className="space-y-4">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" /> Market Density: Vendor Volume Clustering
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-indigo-50/40 to-white border border-indigo-100 rounded-2xl p-5 shadow-xs">
              <div className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-md px-2 py-0.5 w-max mb-3">{vendorClusters.tier1.name}</div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div><p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Unique Entities</p><p className="text-xl font-extrabold text-slate-950">{vendorClusters.tier1.vendorsCount}</p></div>
                <div><p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Financial Footprint</p><p className="text-xl font-extrabold text-slate-950 font-mono">{vendorClusters.tier1.totalValue.toFixed(2)}M</p></div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-50/30 to-white border border-amber-100 rounded-2xl p-5 shadow-xs">
              <div className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-0.5 w-max mb-3">{vendorClusters.tier2.name}</div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div><p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Unique Entities</p><p className="text-xl font-extrabold text-slate-950">{vendorClusters.tier2.vendorsCount}</p></div>
                <div><p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Financial Footprint</p><p className="text-xl font-extrabold text-slate-950 font-mono">{vendorClusters.tier2.totalValue.toFixed(2)}M</p></div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
              <div className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200/60 rounded-md px-2 py-0.5 w-max mb-3">{vendorClusters.tier3.name}</div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div><p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Unique Entities</p><p className="text-xl font-extrabold text-slate-950">{vendorClusters.tier3.vendorsCount}</p></div>
                <div><p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Financial Footprint</p><p className="text-xl font-extrabold text-slate-950 font-mono">{vendorClusters.tier3.totalValue.toFixed(2)}M</p></div>
              </div>
            </div>
          </div>
        </div>

        {/* Top 10 Leaders Section */}
        <div className="space-y-8">
          <div>
            <h2 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2"><Building2 className="w-5 h-5 text-indigo-600" /> Top Procuring Agencies Metrics</h2>
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
            <h2 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2"><Briefcase className="w-5 h-5 text-emerald-600" /> Top Contractors & Vendor Allocations</h2>
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

        {/* Records Registry */}
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
                      No active records match the current search filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  );
}