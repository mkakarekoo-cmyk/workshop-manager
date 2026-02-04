
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
    <>
      {/* Mobilny Backdrop - pojawia się tylko gdy sidebar jest otwarty na małym ekranie */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[5500] lg:hidden animate-in fade-in duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* Usunięto h-[100dvh] oraz lg:sticky, aby sidebar przewijał się naturalnie ze stroną */}
      <aside className={`fixed inset-y-0 left-0 z-[6000] lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0 w-72 sm:w-80 shadow-2xl' : '-translate-x-full lg:translate-x-0 w-24 sm:w-28'} bg-[#0f172a] min-h-screen transition-all duration-500 ease-in-out flex flex-col border-r-4 sm:border-r-8 border-[#22c55e]/10`}>
        <div className="h-20 sm:h-28 flex items-center justify-between px-6 sm:px-10 border-b border-white/5 shrink-0">
          {isOpen ? (
            <div className="flex items-center space-x-3 sm:space-x-6 overflow-hidden">
               <div className="w-10 h-10 sm:w-14 sm:h-14 bg-[#22c55e] rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-black shadow-2xl rotate-3 shrink-0">N</div>
               <div className="flex flex-col truncate">
                 <span className="text-white font-black tracking-tighter text-lg sm:text-2xl uppercase leading-none italic">Menadżer</span>
                 <span className="text-[#22c55e] font-black tracking-tighter text-lg sm:text-2xl uppercase leading-none italic">Narzędzi</span>
               </div>
            </div>
          ) : (
            <div className="mx-auto w-10 h-10 sm:w-14 sm:h-14 bg-[#22c55e] rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-black text-xl sm:text-3xl shadow-2xl rotate-3">N</div>
          )}
          {isOpen && (
            <button onClick={toggleSidebar} className="lg:hidden p-2 sm:p-3 bg-white/5 text-white/50 hover:text-white rounded-xl border border-white/10 active:scale-90 transition-all ml-2">
              <X size={24} />
            </button>
          )}
        </div>

        <div className="flex-1 mt-6 sm:mt-10 flex flex-col px-4">
          {isOpen && isSuperAdmin && (
            <div className="mb-8 sm:mb-10 animate-in slide-in-from-left duration-500 px-2">
              <div className="p-4 sm:p-8 bg-white/5 rounded-[2rem] sm:rounded-[3rem] border border-white/10 shadow-2xl">
                <label className="text-[8px] sm:text-[9px] font-black text-[#22c55e] uppercase tracking-[0.3em] sm:tracking-[0.5em] ml-2 mb-3 sm:mb-4 flex items-center italic">
                  <Building2 size={12} className="mr-2 sm:mr-3 shrink-0" /> WIDOK ODDZIAŁU
                </label>
                <div className="relative group">
                  <select 
                    value={simulationBranchId}
                    onChange={(e) => setSimulationBranchId(e.target.value)}
                    className="w-full pl-4 sm:pl-6 pr-8 sm:pr-10 py-3 sm:py-5 bg-slate-900 text-white text-[10px] sm:text-[11px] font-black rounded-xl sm:rounded-2xl border-2 border-slate-800 outline-none appearance-none cursor-pointer hover:border-[#22c55e] transition-all uppercase italic shadow-inner truncate"
                  >
                    <option value="all">WSZYSTKIE LOKALIZACJE</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>)}
                  </select>
                  <div className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[#22c55e]"><ChevronRight size={16} /></div>
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
                  className={`w-full flex items-center py-4 sm:py-6 transition-all group relative rounded-2xl ${active ? 'bg-white/10 text-white' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
                >
                  {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1.5 bg-[#22c55e] shadow-[0_0_15px_rgba(34,197,94,0.5)] rounded-r-full"></div>}
                  <div className={`${isOpen ? 'px-6 sm:px-10' : 'mx-auto'} flex items-center w-full`}>
                    <item.icon className={`w-5 h-5 sm:w-6 sm:h-6 shrink-0 transition-transform group-hover:scale-110 ${active ? 'text-[#22c55e]' : ''}`} />
                    {isOpen && <span className="ml-4 sm:ml-8 font-black text-[10px] sm:text-[12px] tracking-[0.2em] sm:tracking-[0.4em] uppercase italic truncate">{item.label}</span>}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="shrink-0 mt-auto border-t border-white/5">
          <div className="p-4 sm:p-8">
            <div className={`flex items-center bg-white/5 p-3 sm:p-4 rounded-[2rem] sm:rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden group ${!isOpen && 'justify-center'}`}>
              <div className="flex items-center min-w-0 flex-1">
                  <div className="relative shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-[#22c55e] rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-black border-2 border-white/20 shadow-2xl z-10">
                  {user.email.charAt(0).toUpperCase()}
                  </div>
                  {isOpen && (
                  <div className="ml-3 sm:ml-4 min-w-0 relative z-10 flex flex-col overflow-hidden">
                      <p className="text-[10px] sm:text-[11px] text-white font-black truncate tracking-tighter uppercase italic leading-none">{user.first_name || user.email.split('@')[0]}</p>
                      <p className="text-[7px] sm:text-[8px] text-[#22c55e] uppercase font-black tracking-[0.2em] sm:tracking-[0.4em] mt-1 sm:mt-2 italic truncate">{user.role}</p>
                  </div>
                  )}
              </div>
            </div>
          </div>
          <button onClick={toggleSidebar} className="w-full py-6 sm:py-8 text-slate-600 hover:text-white transition-all bg-black/20 hover:bg-black/40 flex items-center justify-center border-t border-white/5">
            {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
