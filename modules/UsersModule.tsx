
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, ShieldCheck, Search, Trash2, RefreshCw, 
  Save, CheckCircle, ChevronDown, Lock, MapPin,
  UserPlus, Loader, X, Send, AlertCircle
} from 'lucide-react';
import { User, Branch, UserRole } from '../types';
import { supabase } from '../supabase';

interface UsersModuleProps {
  user: User;
  branches: Branch[];
  allUsers: User[];
  onRefresh: () => void;
  refreshTrigger: number;
}

interface UserEditState {
  role: UserRole;
  branch_id: string;
}

const UsersModule: React.FC<UsersModuleProps> = ({ user: currentUser, branches, allUsers, onRefresh, refreshTrigger }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSavingId, setIsSavingId] = useState<string | null>(null);
  const [savedBadgeId, setSavedBadgeId] = useState<string | null>(null);
  const [editStates, setEditStates] = useState<Record<string, UserEditState>>({});
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSubmittingInvite, setIsSubmittingInvite] = useState(false);
  
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('MECHANIK');
  const [inviteBranch, setInviteBranch] = useState('1');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');

  useEffect(() => {
    const initial: Record<string, UserEditState> = {};
    allUsers.forEach(u => {
      initial[u.id] = {
        role: u.role,
        branch_id: u.branch_id ? String(u.branch_id) : '1'
      };
    });
    setEditStates(initial);
  }, [allUsers]);

  const getDisplayName = (u: User | undefined) => {
    if (!u) return 'Nieznany Operator';
    const name = `${u.first_name || ''} ${u.last_name || ''}`.trim();
    return name || u.email || 'Profil Anonimowy';
  };

  const handleSync = async () => {
    setIsSyncing(true);
    await onRefresh();
    setTimeout(() => setIsSyncing(false), 1200);
  };

  const handleUpdateUser = async (id: string) => {
    const state = editStates[id];
    if (!state) return;
    const targetUser = allUsers.find(u => u.id === id);
    if (targetUser?.email?.toLowerCase() === 'm.kakarekoo@gmail.com') return;

    setIsSavingId(id);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          role: state.role,
          branch_id: Number(state.branch_id)
        })
        .eq('id', id);

      if (error) throw error;
      setSavedBadgeId(id);
      setTimeout(() => setSavedBadgeId(null), 2500);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSavingId(null);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;
      setConfirmDeleteId(null);
      onRefresh();
    } catch (err: any) { alert(err.message); }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    
    setIsSubmittingInvite(true);
    try {
      // W systemie KROK 1 administrator tworzy profil, który zostanie powiązany z kontem po pierwszym logowaniu użytkownika
      const { error } = await supabase.from('profiles').insert([{
        email: inviteEmail.toLowerCase(),
        role: inviteRole,
        branch_id: Number(inviteBranch),
        first_name: inviteFirstName,
        last_name: inviteLastName,
        status: 'AKTYWNY'
      }]);

      if (error) {
        if (error.code === '23505') throw new Error("Ten adres email jest już zarejestrowany w systemie.");
        throw error;
      }

      alert(`Profil dla ${inviteEmail} został utworzony pomyślnie!`);
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setInviteFirstName('');
      setInviteLastName('');
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => {
      const term = searchTerm.toLowerCase();
      return getDisplayName(u).toLowerCase().includes(term) || u.email?.toLowerCase().includes(term);
    });
  }, [allUsers, searchTerm]);

  return (
    <div className="p-4 sm:p-8 lg:p-14 space-y-8 sm:space-y-16 animate-in fade-in duration-1000 pb-32">
      
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 sm:gap-10 bg-[#0f172a] p-8 sm:p-12 rounded-[2rem] sm:rounded-[4rem] shadow-2xl relative overflow-hidden border-b-8 border-[#22c55e]">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <Users size={400} className="text-white" />
        </div>
        <div className="relative z-10">
            <h2 className="text-3xl sm:text-6xl font-black text-white tracking-tighter uppercase mb-2 sm:mb-4 italic leading-none drop-shadow-lg">Personel</h2>
            <p className="text-[#22c55e] text-[9px] sm:text-[11px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] flex items-center">
              <ShieldCheck size={16} className="mr-3 sm:mr-4" /> Globalne zarządzanie uprawnieniami
            </p>
        </div>
        <div className="relative z-10 flex items-center space-x-4 sm:space-x-6 w-full lg:w-auto">
          <button 
            onClick={handleSync}
            className={`p-4 sm:p-6 bg-slate-800 text-slate-400 rounded-[1.5rem] sm:rounded-3xl border border-slate-700 hover:text-[#22c55e] transition-all shadow-xl ${isSyncing ? 'animate-spin text-[#22c55e]' : ''}`}
          >
            <RefreshCw size={22} />
          </button>
          <button 
            onClick={() => setIsInviteModalOpen(true)}
            className="flex-1 lg:flex-none px-8 sm:px-12 py-5 sm:py-6 bg-[#22c55e] text-white rounded-[1.5rem] sm:rounded-[2.2rem] text-[9px] sm:text-[11px] font-black uppercase tracking-widest shadow-2xl hover:bg-[#1eb354] transition-all border-b-4 border-green-800 flex items-center justify-center space-x-4 active:scale-95"
          >
            <UserPlus size={18}/><span>Nowy Profil</span>
          </button>
        </div>
      </div>

      <div className="relative max-w-2xl group z-10">
        <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#22c55e] transition-colors" size={24} />
        <input 
          type="text" 
          placeholder="Szukaj pracownika..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="w-full pl-20 pr-8 py-5 sm:py-6 bg-white border border-slate-100 rounded-[2rem] sm:rounded-[2.5rem] text-xs sm:text-sm font-black outline-none focus:border-[#22c55e] transition-all uppercase shadow-2xl shadow-slate-200/30" 
        />
      </div>

      <div className="bg-white rounded-[2rem] sm:rounded-[4rem] shadow-3xl border border-slate-100 overflow-hidden relative z-10">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100">
                <th className="px-12 py-10 text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">Tożsamość</th>
                <th className="px-12 py-10 text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">Rola Systemowa</th>
                <th className="px-12 py-10 text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">Oddział</th>
                <th className="px-12 py-10 text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] text-right">Konsola</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-12 py-20 text-center">
                    <AlertCircle size={48} className="mx-auto text-slate-200 mb-4"/>
                    <p className="text-slate-300 font-black uppercase tracking-widest text-xs italic">Nie znaleziono pracowników spełniających kryteria</p>
                  </td>
                </tr>
              ) : filteredUsers.map(u => {
                const isSA = u.email?.toLowerCase() === 'm.kakarekoo@gmail.com';
                const s = editStates[u.id] || { role: u.role, branch_id: String(u.branch_id) };
                const isChanged = s.role !== u.role || String(s.branch_id) !== String(u.branch_id);
                const isConfirming = confirmDeleteId === u.id;

                return (
                  <tr key={u.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                    <td className="px-12 py-10">
                      <div className="flex items-center space-x-6">
                        <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-black text-lg sm:text-xl border-4 border-white shadow-xl transform group-hover:rotate-3 transition-transform ${isSA ? 'bg-[#0f172a] text-[#22c55e]' : 'bg-slate-100 text-slate-800'}`}>
                          {isSA ? <ShieldCheck size={28}/> : (u.first_name?.charAt(0) || u.email.charAt(0)).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-base sm:text-lg font-black text-[#0f172a] uppercase tracking-tighter italic leading-none truncate">{getDisplayName(u)}</p>
                          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 mt-2 lowercase opacity-60 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-12 py-10">
                      <div className="relative min-w-[200px] sm:min-w-[220px]">
                         <select 
                           disabled={isSA}
                           value={s.role} 
                           onChange={e => setEditStates({...editStates, [u.id]: {...s, role: e.target.value as any}})}
                           className={`w-full appearance-none px-6 py-4 rounded-[1.2rem] sm:rounded-2xl border-2 font-black text-[10px] sm:text-[11px] uppercase tracking-widest outline-none transition-all shadow-inner ${isSA ? 'bg-slate-50 border-slate-100 text-slate-300' : 'bg-white border-slate-100 focus:border-[#22c55e] cursor-pointer hover:bg-slate-50'}`}
                         >
                           <option value="ADMINISTRATOR">ADMINISTRATOR</option>
                           <option value="DORADCA SERWISOWY">DORADCA SERWISOWY</option>
                           <option value="MECHANIK">MECHANIK</option>
                         </select>
                         {!isSA && <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />}
                      </div>
                    </td>
                    <td className="px-12 py-10">
                      <div className="relative min-w-[200px] sm:min-w-[220px]">
                         <select 
                           disabled={isSA}
                           value={s.branch_id} 
                           onChange={e => setEditStates({...editStates, [u.id]: {...s, branch_id: e.target.value}})}
                           className={`w-full appearance-none px-6 py-4 rounded-[1.2rem] sm:rounded-2xl border-2 font-black text-[10px] sm:text-[11px] uppercase tracking-widest outline-none transition-all shadow-inner ${isSA ? 'bg-slate-50 border-slate-100 text-slate-300' : 'bg-white border-slate-100 focus:border-[#22c55e] cursor-pointer hover:bg-slate-50'}`}
                         >
                           {branches.map(b => <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>)}
                         </select>
                         {!isSA && <MapPin size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />}
                      </div>
                    </td>
                    <td className="px-12 py-10 text-right">
                      <div className="flex items-center justify-end space-x-4">
                        {savedBadgeId === u.id && (
                          <div className="flex items-center space-x-2 text-[#22c55e] animate-in fade-in slide-in-from-right duration-500 mr-4">
                            <CheckCircle size={18}/> <span className="text-[10px] font-black uppercase tracking-widest">ZAPISANO</span>
                          </div>
                        )}
                        <button 
                          onClick={() => handleUpdateUser(u.id)}
                          disabled={isSA || !isChanged || isSavingId === u.id}
                          className={`p-4 sm:p-5 rounded-2xl shadow-xl transition-all ${isSA ? 'hidden' : isChanged ? 'bg-[#22c55e] text-white hover:scale-105 hover:bg-[#1eb354]' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                        >
                          {isSavingId === u.id ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
                        </button>
                        {!isSA && (
                          <div className="flex items-center space-x-2">
                             {isConfirming ? (
                               <button 
                                 onClick={() => handleDeleteUser(u.id)}
                                 className="px-6 py-3 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl animate-in zoom-in duration-300 border-b-4 border-rose-900"
                               >
                                 POTWIERDŹ?
                               </button>
                             ) : (
                               <button 
                                 onClick={() => { setConfirmDeleteId(u.id); setTimeout(() => setConfirmDeleteId(null), 3000); }}
                                 className="p-4 sm:p-5 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-xl"
                               >
                                 <Trash2 size={20} />
                               </button>
                             )}
                          </div>
                        )}
                        {isSA && <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl text-slate-200 border border-slate-100"><Lock size={20}/></div>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DODAWANIA PROFILU */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-[5000] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#0f172a]/95 backdrop-blur-3xl" onClick={() => setIsInviteModalOpen(false)}></div>
          <div className="relative w-full max-w-3xl bg-white rounded-t-[2.5rem] sm:rounded-[4rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500">
             <div className="bg-[#0f172a] p-8 sm:p-12 text-white flex justify-between items-center shrink-0 border-b-8 border-[#22c55e]">
                <div className="flex items-center space-x-6 sm:space-x-8">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#22c55e] rounded-[1.8rem] flex items-center justify-center shadow-xl"><UserPlus size={40}/></div>
                  <div>
                    <h3 className="text-2xl sm:text-4xl font-black uppercase italic leading-none">Dodaj Profil</h3>
                    <p className="text-[#22c55e] text-[9px] sm:text-[10px] font-black uppercase tracking-[0.5em] mt-3">Konfiguracja Nowego Operatora</p>
                  </div>
                </div>
                <button onClick={() => setIsInviteModalOpen(false)} className="p-4 sm:p-6 bg-white/10 rounded-full hover:bg-white/20 transition-all active:scale-90"><X size={30}/></button>
             </div>
             <form onSubmit={handleInviteSubmit} className="p-8 sm:p-12 space-y-8 sm:space-y-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Imię</label>
                      <input type="text" value={inviteFirstName} onChange={e => setInviteFirstName(e.target.value)} placeholder="np. Jan" className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] font-black uppercase outline-none focus:border-[#22c55e] transition-all" />
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Nazwisko</label>
                      <input type="text" value={inviteLastName} onChange={e => setInviteLastName(e.target.value)} placeholder="np. Kowalski" className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] font-black uppercase outline-none focus:border-[#22c55e] transition-all" />
                   </div>
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Służbowy Adres Email</label>
                   <input required type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="np. andrzej.chlabicz@contractus.com.pl" className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] font-black outline-none focus:border-[#22c55e] shadow-inner transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Rola Systemowa</label>
                      <select value={inviteRole} onChange={e => setInviteRole(e.target.value as any)} className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] font-black uppercase outline-none focus:border-[#22c55e] appearance-none shadow-inner cursor-pointer">
                        <option value="MECHANIK">MECHANIK</option>
                        <option value="DORADCA SERWISOWY">DORADCA SERWISOWY</option>
                        <option value="ADMINISTRATOR">ADMINISTRATOR</option>
                      </select>
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6">Oddział Bazowy</label>
                      <select value={inviteBranch} onChange={e => setInviteBranch(e.target.value)} className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] font-black uppercase outline-none focus:border-[#22c55e] appearance-none shadow-inner cursor-pointer">
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>)}
                      </select>
                   </div>
                </div>
                <button type="submit" disabled={isSubmittingInvite} className="w-full py-6 sm:py-8 bg-[#22c55e] text-white rounded-[2rem] sm:rounded-[3rem] font-black uppercase tracking-widest shadow-2xl hover:bg-[#1eb354] transition-all border-b-8 border-green-800 flex items-center justify-center space-x-6 active:scale-95 disabled:opacity-50">
                   {isSubmittingInvite ? <Loader className="animate-spin" size={24}/> : <Send size={24} />}
                   <span>Utwórz Dostęp Systemowy</span>
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersModule;
