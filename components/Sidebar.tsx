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
      {/* Mobilny Backdrop - wyższe z-index i lepsza animacja */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-[#0f172a]/80 backdrop-blur-md z-[5500] lg:hidden animate-in fade-in duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar - fixed na mobile, relative na desktop */}
      <aside className={`fixed inset-y-0 left-0 z-[6000] lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0 w-[280px] sm:w-[320px] shadow-[20px_0_50px_rgba(0,0,0,0.3)]' : '-translate-x-full lg:translate-x-0 w-24 sm:w-28'} bg-[#0f172a] min-h-screen transition-all duration-500 ease-in-out flex flex-col border-r-4 sm:border-r-8 border-[#22c55e]/10 overflow-hidden`}>
        
        {/* Logo Section */}
        <div className="h-20 sm:h-28 flex items-center justify-between px-6 sm:px-10 border-b border-white/5 shrink-0">
          <div className="flex items-center space-x-4 overflow-hidden">
             <div className="w-10 h-10 sm:w-14 sm:h-14 bg-[#22c55e] rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-black shadow-2xl rotate-3 shrink-0">N</div>
             {isOpen && (
               <div className="flex flex-col truncate animate-in slide-in-from-left duration-300">
                 <span className="text-white font-black tracking-tighter text-lg sm:text-2xl uppercase leading-none italic">Menadżer</span>
                 <span className="text-[#22c55e] font-black tracking-tighter text-lg sm:text-2xl uppercase leading-none italic">Narzędzi</span>
               </div>
             )}
          </div>
          {isOpen && (
            <button onClick={toggleSidebar} className="lg:hidden p-2 text-white/50 hover:text-white rounded-xl active:scale-90 transition-all">
              <X size={24} />
            </button>
          )}
        </div>

        {/* Content Section */}
        <div className="flex-1 mt-6 sm:mt-10 flex flex-col px-4 overflow-y-auto no-scrollbar">
          {isOpen && isSuperAdmin && (
            <div className="mb-8 animate-in slide-in-from-left duration-500 px-2">
              <div className="p-4 sm:p-6 bg-white/5 rounded-2xl sm:rounded-[2.5rem] border border-white/10 shadow-inner">
                <label className="text-[8px] sm:text-[9px] font-black text-[#22c55e] uppercase tracking-[0.3em] ml-2 mb-3 flex items-center italic">
                  <Building2 size={12} className="mr-2 shrink-0" /> WIDOK ODDZIAŁU
                </label>
                <div className="relative">
                  <select 
                    value={simulationBranchId}
                    onChange={(e) => setSimulationBranchId(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 sm:py-4 bg-slate-900 text-white text-[10px] sm:text-[11px] font-black rounded-xl border border-slate-800 outline-none appearance-none cursor-pointer hover:border-[#22c55e] transition-all uppercase italic truncate"
                  >
                    <option value="all">GLOBALNY</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>)}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#22c55e]"><ChevronRight size={14} /></div>
                </div>
              </div>
            </div>
          )}

          <nav className="flex flex-col space-y-2">
            {internalItems.map((item) => {
              const active = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { onModuleChange(item.id); if (window.innerWidth < 1024) toggleSidebar(); }}
                  className={`w-full flex items-center py-4 sm:py-5 transition-all group relative rounded-xl sm:rounded-2xl ${active ? 'bg-white/10 text-white' : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'}`}
                >
                  {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-[#22c55e] shadow-[0_0_15px_rgba(34,197,94,0.5)] rounded-r-full"></div>}
                  <div className={`${isOpen ? 'px-6 sm:px-8' : 'mx-auto'} flex items-center w-full min-w-0`}>
                    <item.icon className={`w-5 h-5 sm:w-6 sm:h-6 shrink-0 ${active ? 'text-[#22c55e]' : ''}`} />
                    {isOpen && <span className="ml-4 sm:ml-6 font-black text-[10px] sm:text-[12px] tracking-[0.2em] uppercase italic truncate">{item.label}</span>}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Section */}
        <div className="shrink-0 mt-auto border-t border-white/5">
          <div className="p-4 sm:p-6">
            <div className={`flex items-center bg-white/5 p-3 rounded-2xl border border-white/10 shadow-xl overflow-hidden ${!isOpen && 'justify-center'}`}>
                <div className="relative shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-[#22c55e] rounded-xl flex items-center justify-center text-white font-black border-2 border-white/20 shadow-lg">
                  {user.email.charAt(0).toUpperCase()}
                </div>
                {isOpen && (
                  <div className="ml-3 sm:ml-4 min-w-0 flex flex-col overflow-hidden animate-in fade-in duration-300">
                      <p className="text-[10px] sm:text-[11px] text-white font-black truncate uppercase italic leading-none">{user.first_name || 'Użytkownik'}</p>
                      <p className="text-[7px] sm:text-[8px] text-[#22c55e] uppercase font-black tracking-widest mt-1 italic truncate">{user.role}</p>
                  </div>
                )}
            </div>
          </div>
          <button onClick={toggleSidebar} className="w-full py-5 text-slate-600 hover:text-white transition-all bg-black/20 flex items-center justify-center">
            {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;