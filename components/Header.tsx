
import React, { useState } from 'react';
import { LogOut, Bell, RefreshCw, X, Menu, Info, ShoppingBag, Truck, PackageCheck } from 'lucide-react';
import { User, ModuleType, AppNotification } from '../types';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  activeModule: ModuleType;
  toggleSidebar: () => void;
  onRefresh: () => void;
  notifications: AppNotification[];
  onMarkRead: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout, activeModule, toggleSidebar, onRefresh, notifications, onMarkRead }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  const toggleNotif = () => {
    if (!isNotifOpen) {
      onMarkRead();
    }
    setIsNotifOpen(!isNotifOpen);
  };

  return (
    <header className="h-20 sm:h-28 bg-white/90 backdrop-blur-3xl border-b-4 border-slate-50 flex items-center justify-between px-4 sm:px-14 sticky top-0 z-40 shadow-xl shrink-0">
      <div className="flex items-center space-x-4 sm:space-x-12">
        <button onClick={toggleSidebar} className="lg:hidden p-3 sm:p-4 bg-[#0f172a] text-white rounded-xl sm:rounded-2xl shadow-lg">
          <Menu size={20} className="sm:size-6" />
        </button>
        <div className="flex flex-col">
          <h2 className="text-lg sm:text-3xl font-black text-[#0f172a] tracking-tighter uppercase leading-none italic truncate max-w-[120px] sm:max-w-none">{activeModule}</h2>
          <div className="flex items-center space-x-2 mt-1 sm:mt-3">
             <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#22c55e] rounded-full animate-pulse"></span>
             <p className="text-[7px] sm:text-[10px] font-black text-[#22c55e] uppercase tracking-[0.2em] sm:tracking-[0.5em]">SYSTEM AKTYWNY</p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-6">
        <button 
          onClick={handleRefreshClick}
          className={`p-3 sm:p-5 text-slate-400 hover:text-[#22c55e] rounded-xl sm:rounded-[1.8rem] transition-all ${isRefreshing ? 'bg-green-50 text-[#22c55e]' : ''}`}
        >
          <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : 'sm:size-[22px]'} />
        </button>

        <div className="relative">
          <button 
            onClick={toggleNotif}
            className={`p-3 sm:p-5 rounded-xl sm:rounded-[1.8rem] transition-all relative ${isNotifOpen ? 'bg-slate-100 text-[#0f172a]' : 'text-slate-400 hover:text-[#22c55e]'}`}
          >
            <Bell size={18} className="sm:size-[22px]" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 sm:top-4 sm:right-4 w-4 h-4 sm:w-5 sm:h-5 bg-rose-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-[8px] text-white font-black animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>
          
          {isNotifOpen && (
            <div className="fixed sm:absolute right-4 left-4 sm:right-0 sm:left-auto mt-6 sm:mt-8 w-auto sm:w-[450px] bg-[#0f172a] rounded-[2.5rem] shadow-2xl border-4 border-[#22c55e]/30 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-6 duration-500">
                <div className="p-8 sm:p-10 border-b border-white/10 flex justify-between items-center bg-slate-900/50">
                   <div>
                      <h3 className="text-[10px] sm:text-[12px] font-black uppercase tracking-widest text-[#22c55e]">Centrum Powiadomień</h3>
                      <p className="text-[8px] text-white/30 font-bold uppercase tracking-widest mt-1">Ostatnie zdarzenia logistyczne</p>
                   </div>
                   <button onClick={() => setIsNotifOpen(false)} className="p-3 bg-white/5 rounded-full text-white/30 hover:text-white transition-all"><X size={20}/></button>
                </div>
                <div className="max-h-[450px] overflow-y-auto no-scrollbar">
                   {notifications.length === 0 ? (
                     <div className="p-20 text-center space-y-4">
                        <Info size={48} className="mx-auto text-white/5" />
                        <p className="text-[10px] text-white/20 font-black uppercase italic tracking-widest">Brak nowych zdarzeń w oddziale</p>
                     </div>
                   ) : (
                     <div className="divide-y divide-white/5">
                        {notifications.map(n => (
                          <div key={n.id} className={`p-8 flex items-start space-x-6 hover:bg-white/5 transition-all group ${n.type === 'SUCCESS' ? 'bg-green-500/5' : ''}`}>
                             <div className={`p-4 rounded-2xl shrink-0 shadow-2xl transform group-hover:scale-110 transition-transform ${
                               n.type === 'WARNING' ? 'bg-amber-500' : 
                               n.type === 'SUCCESS' ? 'bg-[#22c55e]' : 'bg-blue-600'
                             } text-white`}>
                                {n.title.includes('ZAMÓWIENIE') ? <ShoppingBag size={20} /> : 
                                 n.type === 'SUCCESS' ? <PackageCheck size={20} /> : <Truck size={20} />}
                             </div>
                             <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-2">
                                   <p className={`text-[9px] font-black uppercase tracking-widest ${
                                     n.type === 'WARNING' ? 'text-amber-500' : 
                                     n.type === 'SUCCESS' ? 'text-[#22c55e]' : 'text-blue-400'
                                   }`}>{n.title}</p>
                                   <p className="text-[8px] font-bold text-white/20 uppercase italic">{new Date(n.created_at).toLocaleTimeString()}</p>
                                </div>
                                <p className="text-[13px] font-bold text-white/90 uppercase leading-tight italic">{n.message}</p>
                             </div>
                          </div>
                        ))}
                     </div>
                   )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-6 bg-slate-900/80 border-t border-white/5 text-center">
                     <button onClick={() => setIsNotifOpen(false)} className="text-[9px] font-black text-[#22c55e] uppercase tracking-widest hover:underline">Zamknij Podgląd</button>
                  </div>
                )}
            </div>
          )}
        </div>

        <button 
          onClick={onLogout}
          className="w-12 h-12 sm:w-16 sm:h-16 bg-rose-50 border-2 border-white shadow-lg rounded-xl sm:rounded-[1.8rem] flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-95"
          title="Wyloguj się"
        >
          <LogOut size={20} className="sm:size-7" />
        </button>
      </div>
    </header>
  );
};

export default Header;
