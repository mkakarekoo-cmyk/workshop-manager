
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
  
  // Globalne statystyki operacyjne
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
        .limit(150); // Zwiększony limit dla lepszej diagnostyki

      if (error) throw error;
      setLogs(data || []);
      
      // Pobierz realne liczniki z bazy
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
    <div className="p-8 lg:p-14 space-y-12 animate-in fade-in duration-700 pb-32">
      {/* Admin Command Header */}
      <div className="bg-[#0f172a] p-12 rounded-[4rem] shadow-2xl relative overflow-hidden border-b-8 border-[#22c55e]">
         <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
            <LayoutDashboard size={400} className="text-white" />
         </div>
         <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8">
            <div>
              <h2 className="text-6xl font-black text-white uppercase italic tracking-tighter leading-none mb-4">Centrum Diagnostyczne</h2>
              <div className="flex items-center space-x-6">
                <span className="flex items-center text-[#22c55e] text-[11px] font-black uppercase tracking-[0.5em] italic">
                   <Activity size={16} className="mr-3 animate-pulse" /> Monitorowanie Przepływów Real-Time
                </span>
                <span className="h-4 w-[1px] bg-white/10"></span>
                <span className="text-white/40 text-[10px] font-black uppercase tracking-widest italic">Wszystkie Oddziały Systemu</span>
              </div>
            </div>
            <button onClick={fetchGlobalLogs} className="p-6 bg-white/5 text-white rounded-[2rem] hover:bg-white/10 transition-all border border-white/10 active:scale-95">
               <RefreshCw size={24} className={loading ? 'animate-spin' : ''} />
            </button>
         </div>
      </div>

      {/* Analytics Cards - Teraz interaktywne */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
         <AnalyticsCard 
            title="Transfery" 
            value={globalStats.totalMoves} 
            color="blue" 
            icon={<Truck size={24}/>} 
            sub="Globalna logistyka"
            isActive={activeFilter === 'PRZESUNIĘCIE'}
            onClick={() => toggleFilter('PRZESUNIĘCIE')}
         />
         <AnalyticsCard 
            title="Zapotrzebowania" 
            value={globalStats.pendingOrders} 
            color="amber" 
            icon={<ShoppingBag size={24}/>} 
            sub="Prośby o zasoby"
            isActive={activeFilter === 'ZAMÓWIENIE'}
            onClick={() => toggleFilter('ZAMÓWIENIE')}
         />
         <AnalyticsCard 
            title="Serwisy" 
            value={globalStats.maintenances} 
            color="rose" 
            icon={<Wrench size={24}/>} 
            sub="Konserwacje aktywne"
            isActive={activeFilter === 'KONSERWACJA'}
            onClick={() => toggleFilter('KONSERWACJA')}
         />
         <AnalyticsCard 
            title="Odmowy" 
            value={globalStats.refusals} 
            color="slate" 
            icon={<AlertTriangle size={24}/>} 
            sub="Konflikty zasobów"
            isActive={activeFilter === 'ODMOWA'}
            onClick={() => toggleFilter('ODMOWA')}
         />
      </div>

      {/* Main Flow Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
         {/* Live Traffic */}
         <div className="xl:col-span-2 space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
               <div className="flex items-center space-x-6">
                 <h3 className="text-3xl font-black text-[#0f172a] uppercase tracking-tighter italic border-l-8 border-[#22c55e] pl-8">Logistyka Operacyjna</h3>
                 {activeFilter && (
                   <button 
                    onClick={() => setActiveFilter(null)}
                    className="flex items-center space-x-2 px-4 py-2 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all animate-in slide-in-from-left"
                   >
                     <X size={14} /> <span>Wyczyść filtr: {activeFilter}</span>
                   </button>
                 )}
               </div>
               <div className="relative w-full sm:w-72">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Szukaj w logach..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 bg-white border-2 border-slate-100 rounded-[1.5rem] text-[10px] font-black uppercase outline-none focus:border-[#22c55e] shadow-sm"
                  />
               </div>
            </div>

            <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden min-h-[500px]">
               <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                           <th className="px-10 py-8">Zdarzenie</th>
                           <th className="px-10 py-8">Zasób / Szczegóły</th>
                           <th className="px-10 py-8">Przepływ (Od - Do)</th>
                           <th className="px-10 py-8 text-right">Data Operacji</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {loading ? (
                           <tr><td colSpan={4} className="py-20 text-center"><RefreshCw size={40} className="animate-spin text-slate-200 mx-auto" /></td></tr>
                        ) : filteredLogs.length === 0 ? (
                          <tr><td colSpan={4} className="py-32 text-center text-slate-300 font-black uppercase tracking-[0.2em] italic">Brak wpisów spełniających kryteria filtra</td></tr>
                        ) : filteredLogs.map(log => (
                           <tr key={log.id} className="group hover:bg-slate-50/80 transition-all duration-300">
                              <td className="px-10 py-8">
                                 <span className={`inline-flex items-center px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                                    log.action === 'PRZESUNIĘCIE' ? 'bg-blue-100 text-blue-600' :
                                    log.action === 'ZAMÓWIENIE' ? 'bg-amber-100 text-amber-600' :
                                    log.action === 'ODMOWA' ? 'bg-rose-100 text-rose-600' :
                                    log.action === 'KONSERWACJA' ? 'bg-indigo-100 text-indigo-600' :
                                    'bg-green-100 text-[#22c55e]'
                                 }`}>
                                    {log.action}
                                 </span>
                              </td>
                              <td className="px-10 py-8">
                                 <p className="text-[14px] font-black text-[#0f172a] uppercase italic tracking-tight">{log.tool?.name || 'Zasób Systemowy'}</p>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 italic leading-relaxed max-w-sm">"{log.notes || 'Brak uwag'}"</p>
                              </td>
                              <td className="px-10 py-8">
                                 <div className="flex items-center space-x-4 bg-slate-50 px-4 py-3 rounded-2xl w-fit border border-slate-100">
                                    <span className="text-[10px] font-black text-slate-500 uppercase italic">{(log.from_branch?.name || 'CENTRAL').toUpperCase()}</span>
                                    <ArrowUpRight size={14} className="text-[#22c55e]" />
                                    <span className="text-[10px] font-black text-[#0f172a] uppercase italic">{(log.to_branch?.name || 'SYSTEM').toUpperCase()}</span>
                                 </div>
                              </td>
                              <td className="px-10 py-8 text-right">
                                 <p className="text-[10px] font-black text-slate-800 uppercase italic mb-1">{new Date(log.created_at).toLocaleDateString()}</p>
                                 <p className="text-[9px] font-bold text-[#22c55e] uppercase italic">{new Date(log.created_at).toLocaleTimeString()}</p>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>

         {/* Sidebar Stats */}
         <div className="space-y-12">
            <h3 className="text-3xl font-black text-[#0f172a] uppercase tracking-tighter italic border-l-8 border-[#22c55e] pl-8">Ranking Aktywności</h3>
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 space-y-8">
               {branches.map((b, i) => {
                  const activityCount = logs.filter(l => Number(l.from_branch_id) === Number(b.id) || Number(l.to_branch_id) === Number(b.id)).length;
                  const total = logs.length || 1;
                  const percentage = Math.round((activityCount / total) * 100);

                  return (
                     <div key={b.id} className="group">
                        <div className="flex items-center justify-between mb-3">
                           <div className="flex items-center space-x-4">
                              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center font-black text-[10px] group-hover:bg-[#22c55e] group-hover:text-white transition-all">
                                 {i + 1}
                              </div>
                              <p className="text-[11px] font-black text-[#0f172a] uppercase italic">{b.name}</p>
                           </div>
                           <p className="text-[10px] font-black text-[#22c55e]">{activityCount} <span className="text-slate-300 font-bold ml-1">OP</span></p>
                        </div>
                        <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                           <div className="h-full bg-gradient-to-r from-[#22c55e] to-green-400 transition-all duration-1000" style={{ width: `${Math.min(percentage * 2, 100)}%` }}></div>
                        </div>
                     </div>
                  );
               })}
            </div>

            <div className="p-10 bg-gradient-to-br from-[#0f172a] to-slate-900 rounded-[3rem] shadow-2xl text-white space-y-6 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700"><Database size={80}/></div>
               <h4 className="text-xl font-black uppercase italic tracking-tighter">Status Replikacji Danych</h4>
               <div className="space-y-4">
                  <div className="flex justify-between items-center py-4 border-b border-white/10">
                     <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Węzeł Główny</span>
                     <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-widest italic flex items-center">
                        <Activity size={10} className="mr-2 animate-ping" /> POŁĄCZONO
                     </span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-white/10">
                     <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Szybkość zapisu</span>
                     <span className="text-[10px] font-black text-white uppercase tracking-widest italic">~42 ms</span>
                  </div>
                  <div className="flex justify-between items-center py-4">
                     <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Synchronizacja</span>
                     <span className="text-[10px] font-black text-white uppercase tracking-widest italic">100% OK</span>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const AnalyticsCard = ({ title, value, color, icon, sub, isActive, onClick }: any) => {
   const colors: any = {
      blue: 'bg-blue-600 shadow-blue-500/30 ring-blue-500/50',
      amber: 'bg-amber-500 shadow-amber-500/30 ring-amber-500/50',
      rose: 'bg-rose-500 shadow-rose-500/30 ring-rose-500/50',
      slate: 'bg-slate-700 shadow-slate-700/30 ring-slate-700/50'
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
        className={`bg-white p-10 rounded-[3rem] shadow-2xl border-4 flex items-center space-x-8 group cursor-pointer transition-all duration-500 
          ${isActive ? `${borderColors[color]} scale-105 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] ring-8` : 'border-slate-100 hover:border-slate-200 hover:-translate-y-2 ring-transparent'}`}
      >
         <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-2xl ${colors[color]} group-hover:rotate-6 transition-transform shrink-0`}>
            {icon}
         </div>
         <div className="min-w-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic truncate">{title}</p>
            <h3 className="text-4xl font-black text-[#0f172a] uppercase italic leading-none tracking-tighter">{value}</h3>
            <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.3em] mt-3 truncate">{sub}</p>
         </div>
      </div>
   );
};

export default DashboardModule;
