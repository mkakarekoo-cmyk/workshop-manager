
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, ArrowUpRight, ArrowDownLeft, Truck, ShoppingBag, 
  Wrench, AlertTriangle, Clock, MapPin, Search, Filter, 
  BarChart3, LayoutDashboard, Database, RefreshCw, Layers
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

  const fetchGlobalLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tool_logs')
        .select('*, tool:tools(name), from_branch:branches!tool_logs_from_branch_id_fkey(name), to_branch:branches!tool_logs_to_branch_id_fkey(name)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (e) {
      console.error("Dashboard Fetch Error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalLogs();
  }, [refreshTrigger]);

  const stats = useMemo(() => {
    return {
      totalMoves: logs.filter(l => l.action === 'PRZESUNIĘCIE').length,
      pendingOrders: logs.filter(l => l.action === 'ZAMÓWIENIE').length,
      maintenances: logs.filter(l => l.action === 'KONSERWACJA').length,
      refusals: logs.filter(l => l.action === 'ODMOWA').length
    };
  }, [logs]);

  const filteredLogs = logs.filter(l => 
    l.tool?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.action.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
         <AnalyticsCard title="Transfery" value={stats.totalMoves} color="blue" icon={<Truck size={24}/>} sub="Globalna logistyka" />
         <AnalyticsCard title="Zapotrzebowania" value={stats.pendingOrders} color="amber" icon={<ShoppingBag size={24}/>} sub="Prośby o zasoby" />
         <AnalyticsCard title="Serwisy" value={stats.maintenances} color="rose" icon={<Wrench size={24}/>} sub="Konserwacje aktywne" />
         <AnalyticsCard title="Odmowy" value={stats.refusals} color="slate" icon={<AlertTriangle size={24}/>} sub="Konflikty zasobów" />
      </div>

      {/* Main Flow Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
         {/* Live Traffic */}
         <div className="xl:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
               <h3 className="text-3xl font-black text-[#0f172a] uppercase tracking-tighter italic border-l-8 border-[#22c55e] pl-8">Logistyka Czasu Rzeczywistego</h3>
               <div className="relative w-72">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Filtruj ruch..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-6 py-3 bg-white border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-[#22c55e]"
                  />
               </div>
            </div>

            <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
               <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left">
                     <thead>
                        <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                           <th className="px-10 py-6">Zdarzenie</th>
                           <th className="px-10 py-6">Zasób</th>
                           <th className="px-10 py-6">Przepływ</th>
                           <th className="px-10 py-6">Data</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {loading ? (
                           <tr><td colSpan={4} className="py-20 text-center"><RefreshCw size={40} className="animate-spin text-slate-200 mx-auto" /></td></tr>
                        ) : filteredLogs.map(log => (
                           <tr key={log.id} className="group hover:bg-slate-50/50 transition-all">
                              <td className="px-10 py-6">
                                 <span className={`inline-flex items-center px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                                    log.action === 'PRZESUNIĘCIE' ? 'bg-blue-50 text-blue-600' :
                                    log.action === 'ZAMÓWIENIE' ? 'bg-amber-50 text-amber-600' :
                                    log.action === 'ODMOWA' ? 'bg-rose-50 text-rose-600' :
                                    'bg-green-50 text-[#22c55e]'
                                 }`}>
                                    {log.action}
                                 </span>
                              </td>
                              <td className="px-10 py-6">
                                 <p className="text-[12px] font-black text-[#0f172a] uppercase italic tracking-tight">{log.tool?.name || 'Nieznany'}</p>
                                 <p className="text-[9px] text-slate-400 font-bold uppercase truncate max-w-[200px] mt-1 italic">"{log.notes}"</p>
                              </td>
                              <td className="px-10 py-6">
                                 <div className="flex items-center space-x-3">
                                    <span className="text-[10px] font-black text-slate-500 uppercase italic">{(log.from_branch?.name || 'SYSTEM').toUpperCase()}</span>
                                    <ArrowUpRight size={14} className="text-slate-300" />
                                    <span className="text-[10px] font-black text-[#0f172a] uppercase italic">{(log.to_branch?.name || 'BAZA').toUpperCase()}</span>
                                 </div>
                              </td>
                              <td className="px-10 py-6">
                                 <p className="text-[10px] font-black text-slate-400 uppercase italic">{new Date(log.created_at).toLocaleDateString()}</p>
                                 <p className="text-[9px] font-bold text-slate-300 uppercase italic">{new Date(log.created_at).toLocaleTimeString()}</p>
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
            <h3 className="text-3xl font-black text-[#0f172a] uppercase tracking-tighter italic border-l-8 border-[#22c55e] pl-8">Ranking Oddziałów</h3>
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 space-y-8">
               {branches.map((b, i) => {
                  const activityCount = logs.filter(l => Number(l.from_branch_id) === Number(b.id) || Number(l.to_branch_id) === Number(b.id)).length;
                  return (
                     <div key={b.id} className="flex items-center justify-between group">
                        <div className="flex items-center space-x-6">
                           <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black text-[10px] group-hover:bg-[#22c55e] group-hover:text-white transition-all">
                              {i + 1}
                           </div>
                           <div>
                              <p className="text-[11px] font-black text-[#0f172a] uppercase italic leading-none">{b.name}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">Logistyka: {activityCount} operacji</p>
                           </div>
                        </div>
                        <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                           <div className="h-full bg-[#22c55e]" style={{ width: `${Math.min(activityCount * 5, 100)}%` }}></div>
                        </div>
                     </div>
                  );
               })}
            </div>

            <div className="p-10 bg-gradient-to-br from-[#0f172a] to-slate-900 rounded-[3rem] shadow-2xl text-white space-y-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10"><Database size={80}/></div>
               <h4 className="text-xl font-black uppercase italic tracking-tighter">Status Bazy Danych</h4>
               <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-white/5">
                     <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Replikacja</span>
                     <span className="text-[10px] font-black text-[#22c55e] uppercase tracking-widest italic">ACTIVE</span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-white/5">
                     <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Retencja Logów</span>
                     <span className="text-[10px] font-black text-white uppercase tracking-widest italic">30 DNI</span>
                  </div>
                  <div className="flex justify-between items-center py-3">
                     <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Uptime</span>
                     <span className="text-[10px] font-black text-white uppercase tracking-widest italic">99.9%</span>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const AnalyticsCard = ({ title, value, color, icon, sub }: any) => {
   const colors: any = {
      blue: 'bg-blue-600 shadow-blue-500/30',
      amber: 'bg-amber-500 shadow-amber-500/30',
      rose: 'bg-rose-500 shadow-rose-500/30',
      slate: 'bg-slate-700 shadow-slate-700/30'
   };
   return (
      <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 flex items-center space-x-8 group hover:-translate-y-2 transition-all duration-500">
         <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-2xl ${colors[color]} group-hover:rotate-6 transition-transform`}>
            {icon}
         </div>
         <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">{title}</p>
            <h3 className="text-4xl font-black text-[#0f172a] uppercase italic leading-none tracking-tighter">{value}</h3>
            <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.3em] mt-3">{sub}</p>
         </div>
      </div>
   );
};

export default DashboardModule;
