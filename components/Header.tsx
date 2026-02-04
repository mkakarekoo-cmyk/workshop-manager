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
  onNotificationClick: (n: AppNotification) => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout, activeModule, toggleSidebar, onRefresh, notifications, onMarkRead, onNotificationClick }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  const toggleNotif = () => {
    if (!isNotifOpen) onMarkRead();
    setIsNotifOpen(!isNotifOpen);
  };

  const handleNotifClick = (n: AppNotification) => {
    onNotificationClick(n);
    setIsNotifOpen(false);
  };

  return (
    <header className="h-20 sm:h-28 bg-white/95 backdrop-blur-md border-b-2 border-slate-50 flex items-center justify-between px-4 sm:px-10 lg:px-14 sticky top-0 z-40 shadow-sm shrink-0 transition-all">
      <div className="flex items-center space-x-3 sm:space-x-8 lg:space-x-12 min-w-0">
        <button 
          onClick={toggleSidebar} 
          className="lg:hidden p-2.5 bg-[#0f172a] text-white rounded-xl shadow-lg active:scale-95 transition-transform shrink-0"
        >
          <Menu size={18} />
        </button>
        <div className="flex flex-col min-w-0">
          <h2 className="text-sm sm:text-xl lg:text-3xl font-black text-[#0f172a] tracking-tighter uppercase leading-none italic truncate max-w-[120px] xs:max-w-[200px] sm:max-w-none">
            {activeModule}
          </h2>
          <div className="flex items-center space-x-1 sm:space-x-2 mt-1 sm:mt-2">
             <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-[#22c55e] rounded-full animate-pulse shrink-0"></span>
             <p className="text-[6px] sm:text-[9px] font-black text-[#22c55e] uppercase tracking-[0.2em] sm:tracking-[0.5em] truncate">CONNECTED</p>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-6 shrink-0">
        <button 
          onClick={handleRefreshClick}
          className={`p-2 sm:p-4 text-slate-400 hover:text-[#22c55e] rounded-xl sm:rounded-2xl transition-all active:scale-90 ${isRefreshing ? 'bg-green-50 text-[#22c55e]' : ''}`}
        >
          <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
        </button>

        <div className="relative">
          <button 
            onClick={toggleNotif}
            className={`p-2 sm:p-4 rounded-xl sm:rounded-2xl transition-all relative active:scale-90 ${isNotifOpen ? 'bg-slate-100 text-[#0f172a]' : 'text-slate-400 hover:text-[#22c55e]'}`}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 sm:top-3 sm:right-3 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-rose-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-[7px] text-white font-black animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>
          
          {isNotifOpen && (
            <>
              <div className="fixed inset-0 z-[-1] lg:hidden" onClick={() => setIsNotifOpen(false)}></div>
              <div className="fixed sm:absolute right-4 left-4 sm:right-0 sm:left-auto top-20 sm:top-24 w-auto sm:w-[400px] bg-[#0f172a] rounded-3xl shadow-2xl border-2 border-[#22c55e]/20 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-400">
                  <div className="p-5 sm:p-8 border-b border-white/5 flex justify-between items-center bg-slate-900/40">
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-[#22c55e]">Powiadomienia</h3>
                        <p className="text-[7px] text-white/30 font-bold uppercase tracking-widest mt-1">Status operacji logistycznych</p>
                    </div>
                    <button onClick={() => setIsNotifOpen(false)} className="p-2 bg-white/5 rounded-full text-white/30 hover:text-white transition-all"><X size={16}/></button>
                  </div>
                  <div className="max-h-[60vh] sm:max-h-[380px] overflow-y-auto no-scrollbar divide-y divide-white/5">
                    {notifications.length === 0 ? (
                      <div className="p-16 text-center text-white/10 italic text-[10px] font-black uppercase tracking-widest">Brak zdarzeń</div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => handleNotifClick(n)}
                          className={`p-5 sm:p-6 flex items-start space-x-4 hover:bg-white/5 transition-all group cursor-pointer ${!n.is_read ? 'bg-blue-500/5' : ''}`}
                        >
                            <div className={`p-2.5 rounded-xl shrink-0 ${
                              n.type === 'SUCCESS' ? 'bg-[#22c55e]' : n.type === 'WARNING' ? 'bg-amber-500' : 'bg-blue-600'
                            } text-white shadow-lg`}>
                              {n.type === 'SUCCESS' ? <PackageCheck size={14}/> : <Truck size={14}/>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                  <p className="text-[8px] font-black uppercase tracking-widest text-white/60">{n.title}</p>
                                  <p className="text-[7px] font-bold text-white/20 uppercase">{new Date(n.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                </div>
                                <p className="text-[11px] font-bold text-white/90 uppercase leading-tight italic line-clamp-2">{n.message}</p>
                            </div>
                        </div>
                      ))
                    )}
                  </div>
              </div>
            </>
          )}
        </div>

        <button 
          onClick={onLogout}
          className="w-10 h-10 sm:w-14 sm:h-14 bg-rose-50 border border-slate-100 shadow-sm rounded-xl sm:rounded-2xl flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-95 shrink-0"
        >
          <LogOut size={18} className="sm:size-6" />
        </button>
      </div>
    </header>
  );
};

export default Header;