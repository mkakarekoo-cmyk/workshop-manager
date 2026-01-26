
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
      fixed inset-y-0 left-0 lg:sticky lg:top-0 z-50
      ${isOpen ? 'translate-x-0 w-80' : '-translate-x-full lg:translate-x-0 w-24'} 
      sidebar-dark h-screen transition-all duration-300 ease-in-out flex flex-col shadow-2xl
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
        
        <button onClick={toggleSidebar} className="lg:hidden p-2 text-white/50 hover:text-white transition-colors">
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 mt-6 flex flex-col overflow-y-auto no-scrollbar">
        {/* Branch Selector */}
        {isOpen && user.role === 'ADMINISTRATOR' && (
          <div className="px-6 py-4 mb-6">
            <div className="space-y-4 p-5 bg-slate-900/50 rounded-[2rem] border border-slate-800/50 animate-in fade-in duration-500">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center">
                <Building2 className="w-3 h-3 mr-2" /> WIDOK ODDZIAŁU
              </label>
              <div className="relative">
                <select 
                  value={simulationBranchId}
                  onChange={(e) => setSimulationBranchId(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-slate-800 text-white text-xs font-black rounded-xl border-none outline-none appearance-none cursor-pointer"
                >
                  <option value="all">WSZYSTKIE ODDZIAŁY</option>
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>
                  ))}
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#22c55e] rotate-90" />
              </div>
            </div>
          </div>
        )}

        <nav className="flex flex-col">
          {menuItems.map((item) => {
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onModuleChange(item.id)}
                className={`
                  w-full flex items-center py-5 transition-all group relative border-b border-white/5
                  ${isActive ? 'bg-slate-800/50 text-white' : 'text-slate-500 hover:bg-slate-800/30 hover:text-slate-300'}
                `}
              >
                {/* Active Strip Indicator */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#22c55e] shadow-[0_0_15px_rgba(34,197,94,0.4)]"></div>
                )}
                
                <div className={`${isOpen ? 'px-8' : 'mx-auto'} flex items-center w-full`}>
                  <item.icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#22c55e]' : ''}`} />
                  {isOpen && <span className="ml-5 font-black text-xs tracking-widest uppercase">{item.label}</span>}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="shrink-0">
        <div className="px-6 py-6 border-t border-slate-800/40">
          <div className={`flex items-center ${isOpen ? 'justify-start' : 'justify-center'} bg-slate-900/60 p-4 rounded-[2rem] border border-slate-800/30`}>
            <div className="relative shrink-0">
              <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-white font-black border border-slate-700">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#22c55e] rounded-full border-2 border-slate-900 flex items-center justify-center">
                 <ShieldCheck className="w-2 h-2 text-white" />
              </div>
            </div>
            {isOpen && (
              <div className="ml-4 min-w-0">
                <p className="text-[11px] text-white font-black truncate tracking-tight">{user.name?.toUpperCase()}</p>
                <p className="text-[9px] text-[#22c55e] uppercase font-black tracking-[0.2em]">{user.role}</p>
              </div>
            )}
          </div>
        </div>
        
        <button 
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center py-6 text-slate-600 hover:text-white transition-colors bg-slate-900/20"
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
