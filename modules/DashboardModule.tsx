
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Activity, ArrowUpRight, ArrowDownLeft, Truck, ShoppingBag, 
  Wrench, AlertTriangle, Clock, MapPin, Search, Filter, 
  BarChart3, LayoutDashboard, Database, RefreshCw, Layers, X
} from 'lucide-react';
import { supabase } from '../supabase';
import { ToolLog, ToolStatus, Branch } from '../types';

interface DashboardModuleProps {
  branches: Branch[];
  refreshTrigger: number;
}

const DashboardModule: React.FC<DashboardModuleProps> = ({ branches, refreshTrigger }) => {
  const [logs, setLogs] = useState<ToolLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  
  const [globalStats, setGlobalStats] = useState({
    totalMoves: 0,
    pendingOrders: 0,
    maintenances: 0,
    refusals: 0
  });

  const fetchGlobalStats = useCallback(async () => {
    try {
      const { count: moves } = await supabase.from('tool_logs').select('*', { count: 'exact', head: true }).eq('action', 'PRZESUNIĘCIE');
      const { count: orders } = await supabase.from('tool_logs').select('*', { count: 'exact', head: true }).eq('action', 'ZAMÓWIENIE');
      const { count: maints } = await supabase.from('tool_logs').select('*', { count: 'exact', head: true }).eq('action', 'KONSERWACJA');
      const { count: refusals } = await supabase.from('tool_logs').select('*', { count: 'exact', head: true }).eq('action', 'ODMOWA');
      
      setGlobalStats({
        totalMoves: moves || 0,
        pendingOrders: orders || 0,
        maintenances: maints || 0,
        refusals: refusals || 0
      });
    } catch (e) {
      console.error("Dashboard stats error:", e);
    }
  }, []);

  const fetchGlobalLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tool_logs')
        .select('*, tool:tools(name), from_branch:branches!tool_logs_from_branch_id_fkey(name), to_branch:branches!tool_logs_to_branch_id_fkey(name)')
        .order('created_at', { ascending: false })
        .limit(150); 

      if (error) throw error;
      setLogs(data || []);
      
      fetchGlobalStats();
    } catch (e) {
      console.error("Dashboard Fetch Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalLogs();
  }, [refreshTrigger]);

  const toggleFilter = (action: string) => {
    if (activeFilter === action) {
      setActiveFilter(null);
    } else {
      setActiveFilter(action);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      const matchesAction = activeFilter ? l.action === activeFilter : true;
      const matchesSearch = !searchTerm || 
        l.tool?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.action.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesAction && matchesSearch;
    });
  }, [logs, activeFilter, searchTerm]);

  return (
    <div className="p-4 sm:p-8 lg:p-14 space-y-8 sm:space-y-12 pb-32 animate-in fade-in duration-700">
      <div className="bg-[#0f172a] p-8 sm:p-12 rounded-[2rem] sm:rounded-[4rem] shadow-2xl relative overflow-hidden border-b-8 border-[#22c55e]">
         <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
            <LayoutDashboard size={400} className="text-white hidden lg:block" />
         </div>
         <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h2 className="text-3xl sm:text-6xl font-black text-white uppercase italic tracking-tighter leading-none mb-3 sm:mb-4">Diagnostyka</h2>
              <div className="flex items-center space-x-4 sm:space-x-6">
                <span className="flex items-center text-[#22c55e] text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.5em] italic leading-none">
                   <Activity size={14} className="mr-2 animate-pulse shrink-0" /> Monitor Real-Time
                </span>
                <span className="h-4 w-[1px] bg-white/10 shrink-0"></span>
                <span className="text-white/40 text-[8px] sm:text-[10px] font-black uppercase tracking-widest italic truncate max-w-[150px] sm:max-w-none">Status globalny</span>
              </div>
            </div>
            <button onClick={fetchGlobalLogs} className="p-4 sm:p-6 bg-white/5 text-white rounded-2xl sm:rounded-[2rem] hover:bg-white/10 transition-all border border-white/10 active:scale-95 shrink-0 self-end lg:self-center">
               <RefreshCw size={20} className={loading ? 'animate-spin' : 'sm:size-[24px]'} />
            </button>
         </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
         <AnalyticsCard 
            title="Transfery" 
            value={globalStats.totalMoves} 
            color="blue" 
            icon={<Truck size={20}/>} 
            isActive={activeFilter === 'PRZESUNIĘCIE'}
            onClick={() => toggleFilter('PRZESUNIĘCIE')}
         />
         <AnalyticsCard 
            title="Prośby" 
            value={globalStats.pendingOrders} 
            color="amber" 
            icon={<ShoppingBag size={20}/>} 
            isActive={activeFilter === 'ZAMÓWIENIE'}
            onClick={() => toggleFilter('ZAMÓWIENIE')}
         />
         <AnalyticsCard 
            title="Serwisy" 
            value={globalStats.maintenances} 
            color="rose" 
            icon={<Wrench size={20}/>} 
            isActive={activeFilter === 'KONSERWACJA'}
            onClick={() => toggleFilter('KONSERWACJA')}
         />
         <AnalyticsCard 
            title="Odmowy" 
            value={globalStats.refusals} 
            color="slate" 
            icon={<AlertTriangle size={20}/>} 
            isActive={activeFilter === 'ODMOWA'}
            onClick={() => toggleFilter('ODMOWA')}
         />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
         <div className="xl:col-span-2 space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
               <div className="flex flex-wrap items-center gap-4">
                 <h3 className="text-2xl sm:text-3xl font-black text-[#0f172a] uppercase tracking-tighter italic border-l-8 border-[#22c55e] pl-6 sm:pl-8">Operacje</h3>
                 {activeFilter && (
                   <button 
                    onClick={() => setActiveFilter(null)}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                   >
                     <X size={12} /> <span>{activeFilter}</span>
                   </button>
                 )}
               </div>
               <div className="relative w-full sm:w-64">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Szukaj..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border-2 border-slate-100 rounded-[1.2rem] text-[9px] font-black uppercase outline-none focus:border-[#22c55e]"
                  />
               </div>
            </div>

            <div className="bg-white rounded-[2rem] sm:rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden min-h-[400px]">
               <div className="overflow-x-auto no-scrollbar scroll-smooth">
                  <table className="w-full text-left min-w-[750px]">
                     <thead>
                        <tr className="bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                           <th className="px-8 py-6">Typ</th>
                           <th className="px-8 py-6">Zasób / Uwagi</th>
                           <th className="px-8 py-6">Kierunek</th>
                           <th className="px-8 py-6 text-right">Czas</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {loading ? (
                           <tr><td colSpan={4} className="py-20 text-center"><RefreshCw size={32} className="animate-spin text-slate-200 mx-auto" /></td></tr>
                        ) : filteredLogs.length === 0 ? (
                          <tr><td colSpan={4} className="py-20 text-center text-slate-300 font-black uppercase tracking-widest text-[10px] italic">Brak wyników</td></tr>
                        ) : filteredLogs.map(log => (
                           <tr key={log.id} className="group hover:bg-slate-50 transition-all">
                              <td className="px-8 py-6">
                                 <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                    log.action === 'PRZESUNIĘCIE' ? 'bg-blue-100 text-blue-600' :
                                    log.action === 'ZAMÓWIENIE' ? 'bg-amber-100 text-amber-600' :
                                    log.action === 'ODMOWA' ? 'bg-rose-100 text-rose-600' :
                                    log.action === 'KONSERWACJA' ? 'bg-indigo-100 text-indigo-600' :
                                    'bg-green-100 text-[#22c55e]'
                                 }`}>
                                    {log.action}
                                 </span>
                              </td>
                              <td className="px-8 py-6">
                                 <p className="text-[13px] font-black text-[#0f172a] uppercase italic tracking-tight leading-none truncate max-w-[200px]">{log.tool?.name || 'Zasób'}</p>
                                 <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 italic truncate max-w-[250px]">{log.notes || '—'}</p>
                              </td>
                              <td className="px-8 py-6">
                                 <div className="flex items-center space-x-2 bg-slate-50 px-3 py-1.5 rounded-xl w-fit border border-slate-100">
                                    <span className="text-[9px] font-black text-slate-500 uppercase italic">{(log.from_branch?.name || 'CENT').toUpperCase()}</span>
                                    <ArrowUpRight size={12} className="text-[#22c55e]" />
                                    <span className="text-[9px] font-black text-[#0f172a] uppercase italic">{(log.to_branch?.name || 'SYST').toUpperCase()}</span>
                                 </div>
                              </td>
                              <td className="px-8 py-6 text-right whitespace-nowrap">
                                 <p className="text-[9px] font-black text-slate-800 uppercase italic leading-none mb-1">{new Date(log.created_at).toLocaleDateString()}</p>
                                 <p className="text-[8px] font-bold text-[#22c55e] uppercase italic">{new Date(log.created_at).toLocaleTimeString()}</p>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>

         <div className="space-y-8 sm:space-y-12">
            <h3 className="text-2xl sm:text-3xl font-black text-[#0f172a] uppercase tracking-tighter italic border-l-8 border-[#22c55e] pl-6 sm:pl-8">Aktywność Oddziałów</h3>
            <div className="bg-white p-8 sm:p-10 rounded-[2rem] sm:rounded-[3rem] shadow-2xl border border-slate-100 space-y-6 sm:space-y-8">
               {branches.map((b, i) => {
                  const activityCount = logs.filter(l => Number(l.from_branch_id) === Number(b.id) || Number(l.to_branch_id) === Number(b.id)).length;
                  const total = logs.length || 1;
                  const percentage = Math.round((activityCount / total) * 100);

                  return (
                     <div key={b.id} className="group">
                        <div className="flex items-center justify-between mb-2">
                           <p className="text-[10px] font-black text-[#0f172a] uppercase italic truncate pr-4">{b.name}</p>
                           <p className="text-[9px] font-black text-[#22c55e] shrink-0">{activityCount} OP</p>
                        </div>
                        <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                           <div className="h-full bg-gradient-to-r from-[#22c55e] to-green-400 transition-all duration-1000" style={{ width: `${Math.max(5, Math.min(percentage * 2, 100))}%` }}></div>
                        </div>
                     </div>
                  );
               })}
            </div>
         </div>
      </div>
    </div>
  );
};

const AnalyticsCard = ({ title, value, color, icon, isActive, onClick }: any) => {
   const colors: any = {
      blue: 'bg-blue-600',
      amber: 'bg-amber-500',
      rose: 'bg-rose-500',
      slate: 'bg-slate-700'
   };
   
   const borderColors: any = {
      blue: 'border-blue-500',
      amber: 'border-amber-500',
      rose: 'border-rose-500',
      slate: 'border-slate-700'
   };

   return (
      <div 
        onClick={onClick}
        className={`bg-white p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-xl border-2 flex flex-col items-center text-center cursor-pointer transition-all duration-300 
          ${isActive ? `${borderColors[color]} scale-105 shadow-2xl` : 'border-slate-50 hover:border-slate-200'}`}
      >
         <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl text-white mb-3 ${colors[color]} shadow-lg`}>
            {icon}
         </div>
         <p className="text-[7px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic leading-none">{title}</p>
         <h3 className="text-xl sm:text-4xl font-black text-[#0f172a] uppercase italic leading-none tracking-tighter">{value}</h3>
      </div>
   );
};

export default DashboardModule;
