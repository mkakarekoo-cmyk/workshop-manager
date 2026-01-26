
import React, { useState } from 'react';
import { LogOut, Bell, Search, RefreshCw, X, Menu, CheckCircle2, AlertTriangle } from 'lucide-react';
import { User, ModuleType } from '../types';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  activeModule: ModuleType;
  toggleSidebar: () => void;
  onRefresh: () => void;
}

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'SUCCESS', text: 'Zasób T-102 został przyjęty w Porosłach.', time: '5 min temu' },
  { id: 2, type: 'WARNING', text: 'Mercedes BIA 10221 wymaga przeglądu technicznego.', time: '1h temu' },
  { id: 3, type: 'INFO', text: 'Zaplanowano wydanie dla oddziału Suwałki.', time: '3h temu' },
];

const Header: React.FC<HeaderProps> = ({ user, onLogout, activeModule, toggleSidebar, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    onRefresh(); // Trigger parent refresh logic
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  return (
    <header className="h-24 bg-white/80 backdrop-blur-2xl border-b border-slate-100 flex items-center justify-between px-4 lg:px-12 sticky top-0 z-40 shadow-sm shrink-0">
      <div className="flex items-center space-x-4 lg:space-x-10">
        <button onClick={toggleSidebar} className="lg:hidden p-3 text-slate-500 hover:bg-slate-50 rounded-2xl transition-all">
          <Menu size={24} />
        </button>

        <div className="flex flex-col">
          <h2 className="text-xl lg:text-3xl font-black text-[#0f172a] tracking-tighter uppercase leading-none">{activeModule}</h2>
          <p className="text-[8px] lg:text-[10px] font-black text-[#22c55e] uppercase tracking-[0.4em] mt-1">OK</p>
        </div>
        
        <div className="h-10 w-[2px] bg-slate-100 hidden lg:block"></div>
        
        <div className="relative hidden xl:block group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#22c55e] transition-colors" />
          <input 
            type="text" 
            placeholder="Szukaj zasobów..." 
            className="pl-16 pr-8 py-4 bg-slate-100/50 border-none rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-[#22c55e]/10 outline-none w-[350px] transition-all"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 lg:space-x-8">
        <button 
          onClick={handleRefreshClick}
          className={`p-3 lg:p-4 text-slate-400 hover:text-[#22c55e] hover:bg-green-50 rounded-[1.2rem] lg:rounded-[1.5rem] transition-all ${isRefreshing ? 'bg-green-50 text-[#22c55e]' : ''}`}
          title="Odśwież dane"
        >
          <RefreshCw size={20} className={isRefreshing ? 'animate-spin-slow' : ''} />
        </button>
        
        <div className="relative">
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-3 lg:p-4 text-slate-400 hover:text-[#22c55e] hover:bg-green-50 rounded-[1.2rem] lg:rounded-[1.5rem] transition-all group"
          >
            <Bell size={20} />
            <span className="absolute top-3 right-3 lg:top-4 lg:right-4 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 lg:border-4 border-white"></span>
          </button>

          {isNotifOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)}></div>
              <div className="absolute right-0 mt-6 w-[280px] lg:w-96 bg-white rounded-[2rem] lg:rounded-[2.5rem] shadow-2xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-4">
                <div className="p-6 lg:p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-[#0f172a]">Powiadomienia</h3>
                   <button onClick={() => setIsNotifOpen(false)} className="text-slate-400"><X size={16} /></button>
                </div>
                <div className="max-h-[300px] lg:max-h-[400px] overflow-y-auto">
                   {MOCK_NOTIFICATIONS.map(n => (
                     <div key={n.id} className="p-5 lg:p-6 border-b border-slate-50 hover:bg-slate-50 transition-colors flex items-start space-x-4">
                        <div className={`mt-1 p-2 rounded-xl shrink-0 ${n.type === 'SUCCESS' ? 'bg-green-50 text-[#22c55e]' : 'bg-rose-50 text-rose-500'}`}>
                           {n.type === 'SUCCESS' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                        </div>
                        <div className="min-w-0">
                           <p className="text-[10px] lg:text-[11px] font-bold text-slate-700 leading-snug truncate lg:whitespace-normal">{n.text}</p>
                           <p className="text-[8px] font-black text-slate-300 uppercase mt-2">{n.time}</p>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center space-x-2 lg:space-x-6 pl-2 lg:pl-8 border-l border-slate-100">
          <button 
            onClick={onLogout}
            className="w-10 h-10 lg:w-14 lg:h-14 bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white rounded-[1rem] lg:rounded-[1.5rem] transition-all flex items-center justify-center shadow-sm"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
