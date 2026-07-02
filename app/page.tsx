import { supabase } from '@/lib/supabase';

// 1. Define an explicit type interface for our database row layout
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

export const revalidate = 86400; 

export default async function Home() {
  // Pass our interface to Supabase so it typed handles the response array
  const { data: procurements, error } = await supabase
    .from('procurements')
    .select('*')
    .order('award_date', { ascending: false });

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-6 rounded-xl shadow-md border border-red-100 max-w-md text-center">
          <h2 className="text-xl font-bold text-red-600">Database Connection Error</h2>
          <p className="text-slate-500 mt-2 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  // Cast or fall back to an empty array typed to our interface
  const dataList: ProcurementItem[] = procurements || [];

  const totalContracts = dataList.length;
  
  // Explicitly type the accumulator (sum) as a number, and item as ProcurementItem
  const totalSpend = dataList.reduce((sum: number, item: ProcurementItem) => {
    return sum + Number(item.value_million_nu || 0);
  }, 0);

  const avgContractValue = totalContracts > 0 ? totalSpend / totalContracts : 0;

  // Explicitly type our dynamic category dictionary object
  const categories = dataList.reduce((acc: Record<string, number>, item: ProcurementItem) => {
    const catName = item.category || 'Uncategorized';
    acc[catName] = (acc[catName] || 0) + Number(item.value_million_nu || 0);
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-slate-50/50 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-950 tracking-tight">
              Bhutan Public Procurement Dashboard
            </h1>
            <p className="text-slate-500 mt-1 text-sm md:text-base">
              National contract allocations, transparency tracking, and expenditure analytics for FY 2025-26.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Connected to Supabase Live
            </span>
          </div>
        </div>

        {/* High-Level Metric Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Public Spend</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-slate-900">
                {totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-sm font-bold text-slate-500">Million Nu.</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Contracts Awarded</span>
            <div className="mt-2">
              <span className="text-3xl font-black text-slate-900">{totalContracts.toLocaleString()}</span>
              <span className="text-sm font-bold text-slate-500 ml-2">Tenders</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Allocation Size</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-slate-900">{avgContractValue.toFixed(3)}</span>
              <span className="text-sm font-bold text-slate-500">Million Nu.</span>
            </div>
          </div>
        </div>

        {/* Category Share Distribution Cards */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Allocation by Segment Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(categories).map(([category, value]) => (
              <div key={category} className="bg-white border border-slate-100 p-4 rounded-xl flex items-center justify-between shadow-xs">
                <div>
                  <p className="text-sm font-semibold text-slate-700">{category}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Aggregated contract sum</p>
                </div>
                {/* Fixed 'value is of type unknown' error by declaring it explicitly as a number */}
                <span className="text-base font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">
                  {(value as number).toFixed(2)} M
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Overview Portal Table View */}
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-900">Recent Procurement Awards Portfolio</h3>
            <p className="text-xs text-slate-500 mt-0.5">Audit log listing verified state award registries.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4">Procuring Agency</th>
                  <th className="p-4">Contractor / Company Name</th>
                  <th className="p-4">Dzongkhag</th>
                  <th className="p-4">Method</th>
                  <th className="p-4 text-right">Value (Nu. Millions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {dataList.slice(0, 15).map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-medium text-slate-950 max-w-xs truncate">{item.procuring_agency}</td>
                    <td className="p-4 font-normal text-slate-600 max-w-xs truncate">{item.company_name}</td>
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-700 text-xs font-medium px-2 py-0.5 rounded-md">
                        {item.company_dzongkhag}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-mono text-slate-500">{item.procurement_method}</td>
                    <td className="p-4 text-right font-semibold text-slate-900">
                      {Number(item.value_million_nu).toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalContracts > 15 && (
            <div className="p-4 text-center border-t border-slate-100 bg-slate-50/30 text-xs text-slate-400 font-medium">
              Showing first 15 of {totalContracts} records.
            </div>
          )}
        </div>

      </div>
    </main>
  );
}