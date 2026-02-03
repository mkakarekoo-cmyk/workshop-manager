
import React from 'react';
import { 
  Wrench, Users, ChevronLeft, ChevronRight,
  Building2, X, LogOut, CalendarDays, Briefcase
} from 'lucide-react';
import { ModuleType, User, Branch } from '../types';
import { supabase } from '../supabase';

interface SidebarProps {
  activeModule: ModuleType;
  onModuleChange: (module: ModuleType) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  user: User;
  branches: Branch[];
  simulationBranchId: string;
  setSimulationBranchId: (id: string) => void;
  isSuperAdmin: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeModule, onModuleChange, isOpen, toggleSidebar, user, 
  branches, simulationBranchId, setSimulationBranchId, isSuperAdmin 
}) => {
  
  const internalItems = [
    { id: 'BAZA NARZĘDZI' as ModuleType, label: 'BAZA NARZĘDZI', icon: Wrench },
    { id: 'MOJE NARZĘDZIA' as ModuleType, label: 'MOJE NARZĘDZIA', icon: Briefcase },
    { id: 'GRAFIK' as ModuleType, label: 'GRAFIK', icon: CalendarDays },
  ];

  if (isSuperAdmin) internalItems.push({ id: 'UŻYTKOWNICY' as ModuleType, label: 'UŻYTKOWNICY', icon: Users });

  return (
    <aside className={`fixed inset-y-0 left-0 lg:sticky lg:top-0 z-[5000] ${isOpen ? 'translate-x-0 w-80 shadow-[0_0_100px_rgba(0,0,0,0.5)]' : '-translate-x-full lg:translate-x-0 w-28'} bg-[#0f172a] h-screen transition-all duration-500 ease-in-out flex flex-col border-r-8 border-[#22c55e]/10`}>
      <div className="h-28 flex items-center justify-between px-10 border-b border-white/5 shrink-0">
        {isOpen ? (
          <div className="flex items-center space-x-6">
             <div className="w-14 h-14 bg-[#22c55e] rounded-2xl flex items-center justify-center text-white font-black shadow-2xl rotate-3">N</div>
             <div className="flex flex-col"><span className="text-white font-black tracking-tighter text-2xl uppercase leading-none italic">Menadżer</span><span className="text-[#22c55e] font-black tracking-tighter text-2xl uppercase leading-none italic">Narzędzi</span></div>
          </div>
        ) : (
          <div className="mx-auto w-14 h-14 bg-[#22c55e] rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-2xl rotate-3">N</div>
        )}
        <button onClick={toggleSidebar} className="lg:hidden p-4 bg-white/5 text-white/50 hover:text-white rounded-2xl border border-white/10 active:scale-90 transition-all">
          <X size={28} />
        </button>
      </div>

      <div className="flex-1 mt-10 flex flex-col overflow-y-auto no-scrollbar">
        {isOpen && isSuperAdmin && (
          <div className="px-8 py-4 mb-10 animate-in slide-in-from-left duration-500">
            <div className="p-8 bg-white/5 rounded-[3rem] border border-white/10 shadow-2xl">
              <label className="text-[9px] font-black text-[#22c55e] uppercase tracking-[0.5em] ml-2 mb-4 flex items-center italic"><Building2 size={12} className="mr-3" /> WIDOK ODDZIAŁU</label>
              <div className="relative group">
                <select 
                  value={simulationBranchId}
                  onChange={(e) => setSimulationBranchId(e.target.value)}
                  className="w-full pl-6 pr-10 py-5 bg-slate-900 text-white text-[11px] font-black rounded-2xl border-2 border-slate-800 outline-none appearance-none cursor-pointer hover:border-[#22c55e] transition-all uppercase italic shadow-inner"
                >
                  <option value="all">WSZYSTKIE LOKALIZACJE</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>)}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#22c55e] transition-transform"><ChevronRight size={18} /></div>
              </div>
            </div>
          </div>
        )}

        <nav className="flex flex-col space-y-4">
          {internalItems.map((item) => {
            const active = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { onModuleChange(item.id); if (window.innerWidth < 1024) toggleSidebar(); }}
                className={`w-full flex items-center py-6 transition-all group relative ${active ? 'bg-white/10 text-white' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
              >
                {active && <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#22c55e] shadow-lg shadow-green-500"></div>}
                <div className={`${isOpen ? 'px-10' : 'mx-auto'} flex items-center w-full`}>
                  <item.icon className={`w-6 h-6 shrink-0 transition-transform group-hover:scale-125 ${active ? 'text-[#22c55e]' : ''}`} />
                  {isOpen && <span className="ml-8 font-black text-[12px] tracking-[0.4em] uppercase italic">{item.label}</span>}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="shrink-0 mt-auto border-t border-white/5">
        <div className="p-8">
          <div className="flex flex-row justify-between items-center bg-white/5 p-4 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group">
            <div className="flex items-center min-w-0">
                <div className="relative shrink-0 w-12 h-12 bg-[#22c55e] rounded-2xl flex items-center justify-center text-white font-black border-2 border-white/20 shadow-2xl z-10">
                {user.email.charAt(0).toUpperCase()}
                </div>
                {isOpen && (
                <div className="ml-4 min-w-0 relative z-10 flex flex-col">
                    <p className="text-[11px] text-white font-black truncate tracking-tighter uppercase italic leading-none">{user.first_name || user.email.split('@')[0]}</p>
                    <p className="text-[8px] text-[#22c55e] uppercase font-black tracking-[0.4em] mt-2 italic">{user.role}</p>
                </div>
                )}
            </div>
            {isOpen && (
              <button onClick={() => supabase.auth.signOut()} className="ml-2 p-3 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all relative z-20"><LogOut size={18} /></button>
            )}
          </div>
        </div>
        <button onClick={toggleSidebar} className="w-full py-8 text-slate-600 hover:text-white transition-all bg-black/20 hover:bg-black/40 flex items-center justify-center">
          {isOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
