
import React, { useState, useMemo } from 'react';
import { LogOut, Bell, RefreshCw, X, Menu, Info, Settings, Key, Eye, EyeOff, Save, ShieldCheck, ShoppingBag, Truck, PackageCheck } from 'lucide-react';
import { User, ModuleType, AppNotification } from '../types';
import { supabase } from '../supabase';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  activeModule: ModuleType;
  toggleSidebar: () => void;
  onRefresh: () => void;
  notifications: AppNotification[];
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, activeModule, toggleSidebar, onRefresh, notifications }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [firstName, setFirstName] = useState(user.first_name || '');
  const [lastName, setLastName] = useState(user.last_name || '');
  const [newPassword, setNewPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleRefreshClick = () => {
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const updateData: any = { data: { first_name: firstName, last_name: lastName } };
      if (newPassword) updateData.password = newPassword;
      const { error } = await supabase.auth.updateUser(updateData);
      if (error) throw error;
      setIsSettingsOpen(false);
      onRefresh();
    } catch (err: any) { console.error(err.message); }
    finally { setIsUpdating(false); }
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
            onClick={() => setIsNotifOpen(!isNotifOpen)}
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

        <button onClick={() => setIsSettingsOpen(true)} className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-50 border-2 border-white shadow-lg rounded-xl sm:rounded-[1.8rem] flex items-center justify-center text-[#0f172a] hover:bg-[#22c55e] hover:text-white transition-all">
             <Settings size={20} className="sm:size-7" />
        </button>
      </div>

      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#0f172a]/95 backdrop-blur-xl" onClick={() => setIsSettingsOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-white rounded-t-[2rem] sm:rounded-[4rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500">
            <div className="bg-[#0f172a] p-8 sm:p-12 text-white flex justify-between items-center relative border-b-8 border-[#22c55e]">
              <div className="flex items-center space-x-6 sm:space-x-8">
                <div className="w-12 h-12 sm:w-20 sm:h-20 bg-[#22c55e] rounded-xl sm:rounded-[1.8rem] flex items-center justify-center text-white"><ShieldCheck size={28} className="sm:size-[40px]"/></div>
                <div><h3 className="text-xl sm:text-4xl font-black uppercase italic leading-none">Mój Profil</h3></div>
              </div>
              <button onClick={() => setIsSettingsOpen(false)} className="p-3 bg-white/10 rounded-full"><X size={24} /></button>
            </div>
            <form onSubmit={handleProfileUpdate} className="p-8 sm:p-12 space-y-6 sm:space-y-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                 <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="IMIĘ" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-[2rem] text-xs font-black outline-none uppercase"/>
                 <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="NAZWISKO" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-[2rem] text-xs font-black outline-none uppercase"/>
              </div>
              <div className="relative">
                <input type={showPass ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="NOWE HASŁO" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-[2.5rem] text-xs font-black outline-none focus:border-[#22c55e] transition-all"/>
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300">{showPass ? <EyeOff size={20}/> : <Eye size={20}/>}</button>
              </div>
              <button type="submit" disabled={isUpdating} className="w-full py-5 sm:py-8 bg-[#22c55e] text-white rounded-[1.5rem] sm:rounded-[3rem] font-black uppercase tracking-widest shadow-2xl border-b-6 border-green-800 flex items-center justify-center space-x-4">
                {isUpdating ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                <span>ZAKTUALIZUJ PROFIL</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
