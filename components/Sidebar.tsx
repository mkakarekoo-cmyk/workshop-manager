
import React from 'react';
import { 
  Wrench, Users, ChevronLeft, ChevronRight,
  Building2, X, LogOut, CalendarDays, Briefcase, LayoutDashboard
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
  
  const internalItems = [];
  
  if (isSuperAdmin) {
    internalItems.push({ id: 'DASHBOARD' as ModuleType, label: 'PANEL ANALITYCZNY', icon: LayoutDashboard });
  }

  internalItems.push(
    { id: 'BAZA NARZĘDZI' as ModuleType, label: 'BAZA NARZĘDZI', icon: Wrench },
    { id: 'MOJE NARZĘDZIA' as ModuleType, label: 'MOJE NARZĘDZIA', icon: Briefcase },
    { id: 'GRAFIK' as ModuleType, label: 'GRAFIK', icon: CalendarDays }
  );

  if (isSuperAdmin) internalItems.push({ id: 'UŻYTKOWNICY' as ModuleType, label: 'UŻYTKOWNICY', icon: Users });

  return (
    <>
      {/* Overlay backdrop for mobile - ułatwia zamykanie i poprawia czytelność */}
      <div 
        className={`fixed inset-0 bg-[#0f172a]/60 backdrop-blur-md z-[4900] lg:hidden transition-opacity duration-500 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleSidebar}
      />

      <aside className={`fixed inset-y-0 left-0 lg:sticky lg:top-0 z-[5000] ${isOpen ? 'translate-x-0 w-[280px] sm:w-80 shadow-[0_0_100px_rgba(0,0,0,0.5)]' : '-translate-x-full lg:translate-x-0 w-0 lg:w-28'} bg-[#0f172a] h-screen transition-all duration-500 ease-in-out flex flex-col border-r-8 border-[#22c55e]/10 overflow-hidden`}>
        <div className="h-20 sm:h-28 flex items-center justify-between px-6 sm:px-10 border-b border-white/5 shrink-0">
          {isOpen ? (
            <div className="flex items-center space-x-4 sm:space-x-6">
               <div className="w-10 h-10 sm:w-14 sm:h-14 bg-[#22c55e] rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-black shadow-2xl rotate-3 shrink-0">N</div>
               <div className="flex flex-col min-w-0"><span className="text-white font-black tracking-tighter text-lg sm:text-2xl uppercase leading-none italic truncate">Menadżer</span><span className="text-[#22c55e] font-black tracking-tighter text-lg sm:text-2xl uppercase leading-none italic truncate">Narzędzi</span></div>
            </div>
          ) : (
            <div className="mx-auto w-12 h-12 bg-[#22c55e] rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-2xl rotate-3 shrink-0">N</div>
          )}
          <button onClick={toggleSidebar} className="lg:hidden p-2 text-white/50 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 mt-6 sm:mt-10 flex flex-col overflow-y-auto no-scrollbar">
          {isOpen && isSuperAdmin && (
            <div className="px-6 sm:px-8 py-2 sm:py-4 mb-6 sm:mb-10 animate-in slide-in-from-left duration-500">
              <div className="p-5 sm:p-8 bg-white/5 rounded-[2rem] sm:rounded-[3rem] border border-white/10 shadow-2xl">
                <label className="text-[8px] font-black text-[#22c55e] uppercase tracking-[0.3em] sm:tracking-[0.5em] ml-2 mb-3 flex items-center italic shrink-0"><Building2 size={10} className="mr-2" /> ODDZIAŁ</label>
                <div className="relative">
                  <select 
                    value={simulationBranchId}
                    onChange={(e) => setSimulationBranchId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 text-white text-[10px] font-black rounded-xl border-2 border-slate-800 outline-none appearance-none cursor-pointer hover:border-[#22c55e] transition-all uppercase italic truncate pr-8"
                  >
                    <option value="all">WSZYSTKIE LOKALIZACJE</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>)}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#22c55e]"><ChevronRight size={14} /></div>
                </div>
              </div>
            </div>
          )}

          <nav className="flex flex-col space-y-2 sm:space-y-4">
            {internalItems.map((item) => {
              const active = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { onModuleChange(item.id); if (window.innerWidth < 1024) toggleSidebar(); }}
                  className={`w-full flex items-center py-4 sm:py-6 transition-all group relative ${active ? 'bg-white/10 text-white' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
                >
                  {active && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#22c55e] shadow-lg shadow-green-500"></div>}
                  <div className={`${isOpen ? 'px-8 sm:px-10' : 'mx-auto'} flex items-center w-full`}>
                    <item.icon className={`w-5 h-5 sm:w-6 sm:h-6 shrink-0 transition-transform group-hover:scale-110 ${active ? 'text-[#22c55e]' : ''}`} />
                    {isOpen && <span className="ml-6 sm:ml-8 font-black text-[10px] sm:text-[12px] tracking-[0.2em] sm:tracking-[0.4em] uppercase italic truncate">{item.label}</span>}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="shrink-0 mt-auto border-t border-white/5">
          <div className="p-6 sm:p-8">
            <div className="flex flex-row items-center bg-white/5 p-3 sm:p-4 rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden">
                <div className="relative shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-[#22c55e] rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-black border-2 border-white/20 shadow-2xl">
                {user.email.charAt(0).toUpperCase()}
                </div>
                {isOpen && (
                <div className="ml-4 min-w-0 flex flex-col">
                    <p className="text-[10px] sm:text-[11px] text-white font-black truncate uppercase italic leading-none">{user.first_name || user.email.split('@')[0]}</p>
                    <p className="text-[7px] sm:text-[8px] text-[#22c55e] uppercase font-black tracking-[0.2em] sm:tracking-[0.4em] mt-1 sm:mt-2 italic truncate">{user.role}</p>
                </div>
                )}
            </div>
          </div>
          <button onClick={toggleSidebar} className="w-full py-6 sm:py-8 text-slate-600 hover:text-white transition-all bg-black/20 hover:bg-black/40 flex items-center justify-center">
            {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
