
import React from 'react';
import { 
  Wrench, 
  Truck, 
  Warehouse, 
  Users, 
  ChevronLeft, 
  ChevronRight,
  Building2,
  ShieldCheck,
  X
} from 'lucide-react';
import { ModuleType, User, Branch } from '../types';

interface SidebarProps {
  activeModule: ModuleType;
  onModuleChange: (module: ModuleType) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  user: User;
  branches: Branch[];
  simulationBranchId: string;
  setSimulationBranchId: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  activeModule, 
  onModuleChange, 
  isOpen, 
  toggleSidebar, 
  user,
  branches,
  simulationBranchId,
  setSimulationBranchId
}) => {
  const menuItems = [
    { id: 'NARZĘDZIA' as ModuleType, label: 'NARZĘDZIA', icon: Wrench },
    { id: 'MOJA FLOTA' as ModuleType, label: 'MOJA FLOTA', icon: Truck },
    { id: 'MÓJ WARSZTAT' as ModuleType, label: 'MÓJ WARSZTAT', icon: Warehouse },
    { id: 'UŻYTKOWNICY' as ModuleType, label: 'UŻYTKOWNICY', icon: Users },
  ];

  return (
    <aside className={`
      fixed inset-y-0 left-0 lg:relative lg:inset-auto z-50
      ${isOpen ? 'translate-x-0 w-80' : '-translate-x-full lg:translate-x-0 w-24'} 
      sidebar-dark h-full transition-all duration-500 ease-in-out flex flex-col shadow-2xl
    `}>
      <div className="h-24 flex items-center justify-between px-8 border-b border-slate-800/40 shrink-0">
        {isOpen ? (
          <div className="flex items-center space-x-4">
             <div className="w-10 h-10 bg-[#22c55e] rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-green-500/20">W</div>
             <div className="flex flex-col">
                <span className="text-white font-black tracking-tighter text-xl uppercase leading-none">Menadżer</span>
                <span className="text-[#22c55e] font-black tracking-tighter text-xl uppercase leading-none">Warsztatu</span>
             </div>
          </div>
        ) : (
          <div className="mx-auto w-12 h-12 bg-[#22c55e] rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-xl">W</div>
        )}
        
        {/* Mobile Close Button */}
        <button onClick={toggleSidebar} className="lg:hidden p-2 text-white/50 hover:text-white transition-colors">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 mt-8 px-4 space-y-10 overflow-y-auto no-scrollbar pb-10">
        {/* Branch Selector for Admin */}
        {isOpen && user.role === 'ADMINISTRATOR' && (
          <div className="space-y-4 px-3 py-6 bg-slate-900/50 rounded-[2rem] border border-slate-800/50 mx-2 animate-in fade-in duration-700">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center">
              <Building2 className="w-3 h-3 mr-2" /> WIDOK ODDZIAŁU
            </label>
            <div className="relative">
              <select 
                value={simulationBranchId}
                onChange={(e) => setSimulationBranchId(e.target.value)}
                className="w-full pl-4 pr-10 py-3.5 bg-slate-800 text-white text-xs font-black rounded-2xl border-none outline-none appearance-none focus:ring-2 focus:ring-[#22c55e] transition-all cursor-pointer"
              >
                <option value="all">WSZYSTKIE ODDZIAŁY</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>
                ))}
              </select>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#22c55e] rotate-90" />
            </div>
          </div>
        )}

        <nav className="space-y-3 px-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onModuleChange(item.id)}
              className={`
                w-full flex items-center p-5 rounded-[2rem] transition-all group relative overflow-hidden
                ${activeModule === item.id 
                  ? 'bg-[#22c55e] text-white shadow-2xl shadow-[#22c55e]/20' 
                  : 'text-slate-500 hover:bg-slate-800/80 hover:text-white'}
              `}
            >
              <item.icon className={`${isOpen ? 'mr-5' : 'mx-auto'} w-5 h-5 shrink-0 transition-transform group-hover:scale-110`} />
              {isOpen && <span className="font-black text-xs tracking-widest uppercase">{item.label}</span>}
              {!isOpen && activeModule === item.id && (
                <div className="absolute left-0 w-2 h-8 bg-[#22c55e] rounded-r-full shadow-[0_0_15px_rgba(34,197,94,0.5)]"></div>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6 border-t border-slate-800/40 shrink-0">
        <div className={`flex items-center ${isOpen ? 'justify-start' : 'justify-center'} bg-slate-900/60 p-4 rounded-[2.5rem] border border-slate-800/30 group hover:border-[#22c55e]/30 transition-all`}>
          <div className="relative">
            <div className="w-12 h-12 bg-slate-800 rounded-[1.2rem] flex items-center justify-center text-white font-black shadow-lg border-2 border-slate-700">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#22c55e] rounded-full border-4 border-slate-900 flex items-center justify-center">
               <ShieldCheck className="w-2.5 h-2.5 text-white" />
            </div>
          </div>
          {isOpen && (
            <div className="ml-4 min-w-0">
              <p className="text-xs text-white font-black truncate tracking-tight">{user.name?.toUpperCase() || 'UŻYTKOWNIK'}</p>
              <p className="text-[10px] text-[#22c55e] uppercase font-black tracking-[0.2em]">{user.role}</p>
            </div>
          )}
        </div>
        
        {isOpen && (
          <button 
            onClick={toggleSidebar}
            className="w-full mt-6 flex items-center justify-center p-3 text-slate-500 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
        )}
      </div>
      {!isOpen && (
         <button onClick={toggleSidebar} className="mx-auto mb-8 p-3 bg-slate-800 text-[#22c55e] rounded-2xl shadow-lg border border-slate-700 hover:bg-slate-700 transition-all hidden lg:flex">
           <ChevronRight size={20} />
         </button>
      )}
    </aside>
  );
};

export default Sidebar;
