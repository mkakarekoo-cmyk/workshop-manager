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

  const handleUpdateUser = async (id: string) => {
    const state = editStates[id];
    if (!state) return;
    setIsSavingId(id);
    try {
      const { error } = await supabase.from('profiles').update({ role: state.role, branch_id: Number(state.branch_id) }).eq('id', id);
      if (error) throw error;
      setSavedBadgeId(id);
      setTimeout(() => setSavedBadgeId(null), 2000);
      onRefresh();
    } catch (err: any) { alert(err.message); }
    finally { setIsSavingId(null); }
  };

  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => {
      const term = searchTerm.toLowerCase();
      const name = `${u.first_name || ''} ${u.last_name || ''}`.trim().toLowerCase();
      return name.includes(term) || u.email?.toLowerCase().includes(term);
    });
  }, [allUsers, searchTerm]);

  return (
    <div className="p-4 sm:p-8 lg:p-14 space-y-8 sm:space-y-12 pb-40 animate-in fade-in duration-700">
      
      {/* Banner / Header */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6 bg-[#0f172a] p-8 sm:p-12 rounded-[2rem] sm:rounded-[4rem] shadow-2xl relative overflow-hidden border-b-8 border-[#22c55e]">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none hidden sm:block">
          <Users size={400} className="text-white" />
        </div>
        <div className="relative z-10">
            <h2 className="text-2xl sm:text-5xl lg:text-6xl font-black text-white tracking-tighter uppercase mb-2 sm:mb-4 italic leading-none drop-shadow-lg">Personel</h2>
            <p className="text-[#22c55e] text-[9px] sm:text-[11px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] flex items-center">
              <ShieldCheck size={14} className="mr-3" /> ZARZĄDZANIE DOSTĘPEM
            </p>
        </div>
        <div className="relative z-10 flex items-center space-x-3 sm:space-x-6">
          <button 
            onClick={() => { setIsSyncing(true); onRefresh(); setTimeout(() => setIsSyncing(false), 1000); }}
            className={`p-4 sm:p-6 bg-slate-800 text-slate-400 rounded-2xl sm:rounded-3xl border border-slate-700 hover:text-[#22c55e] transition-all ${isSyncing ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={20} />
          </button>
          <button 
            onClick={() => setIsInviteModalOpen(true)}
            className="flex-1 lg:flex-none px-6 sm:px-12 py-4 sm:py-6 bg-[#22c55e] text-white rounded-2xl sm:rounded-[2.2rem] text-[9px] sm:text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-[#1eb354] transition-all border-b-4 border-green-800 active:scale-95 flex items-center justify-center space-x-3 sm:space-x-4"
          >
            <UserPlus size={18}/><span>Nowy Profil</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-2xl group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
        <input 
          type="text" 
          placeholder="Szukaj pracownika..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="w-full pl-14 pr-6 py-4 sm:py-6 bg-white border border-slate-100 rounded-xl sm:rounded-[2.5rem] text-xs sm:text-sm font-black outline-none focus:border-[#22c55e] uppercase shadow-lg shadow-slate-100" 
        />
      </div>

      {/* Tabela - Responsywny h-scroll */}
      <div className="bg-white rounded-[1.5rem] sm:rounded-[3rem] lg:rounded-[4rem] shadow-2xl border border-slate-50 overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 sm:px-12 py-8 text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest">Tożsamość</th>
                <th className="px-8 sm:px-12 py-8 text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest">Rola</th>
                <th className="px-8 sm:px-12 py-8 text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest">Oddział</th>
                <th className="px-8 sm:px-12 py-8 text-[9px] sm:text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map(u => {
                const s = editStates[u.id] || { role: u.role, branch_id: String(u.branch_id) };
                const isSA = u.email === 'm.kakarekoo@gmail.com';
                const isChanged = s.role !== u.role || String(s.branch_id) !== String(u.branch_id);

                return (
                  <tr key={u.id} className="group hover:bg-slate-50/30 transition-all">
                    <td className="px-8 sm:px-12 py-8">
                      <div className="flex items-center space-x-4 sm:space-x-6">
                        <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-lg sm:text-xl border-4 border-white shadow-xl ${isSA ? 'bg-[#0f172a] text-[#22c55e]' : 'bg-slate-100 text-slate-800'}`}>
                          {(u.first_name?.charAt(0) || u.email.charAt(0)).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm sm:text-lg font-black text-[#0f172a] uppercase leading-none truncate">{u.first_name} {u.last_name}</p>
                          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 mt-1 lowercase truncate opacity-60">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 sm:px-12 py-8">
                         <select 
                           disabled={isSA}
                           value={s.role} 
                           onChange={e => setEditStates({...editStates, [u.id]: {...s, role: e.target.value as any}})}
                           className="px-4 py-3 bg-white border border-slate-100 rounded-xl font-black text-[9px] sm:text-[11px] uppercase tracking-widest outline-none focus:border-[#22c55e] cursor-pointer"
                         >
                           <option value="ADMINISTRATOR">ADMINISTRATOR</option>
                           <option value="DORADCA SERWISOWY">DORADCA SERWISOWY</option>
                           <option value="MECHANIK">MECHANIK</option>
                         </select>
                    </td>
                    <td className="px-8 sm:px-12 py-8">
                         <select 
                           disabled={isSA}
                           value={s.branch_id} 
                           onChange={e => setEditStates({...editStates, [u.id]: {...s, branch_id: e.target.value}})}
                           className="px-4 py-3 bg-white border border-slate-100 rounded-xl font-black text-[9px] sm:text-[11px] uppercase tracking-widest outline-none focus:border-[#22c55e] cursor-pointer"
                         >
                           {branches.map(b => <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>)}
                         </select>
                    </td>
                    <td className="px-8 sm:px-12 py-8 text-right">
                      <div className="flex items-center justify-end space-x-3">
                        {savedBadgeId === u.id && <CheckCircle size={18} className="text-[#22c55e] animate-bounce"/>}
                        <button 
                          onClick={() => handleUpdateUser(u.id)}
                          disabled={isSA || !isChanged || isSavingId === u.id}
                          className={`p-3 sm:p-5 rounded-xl sm:rounded-2xl transition-all shadow-lg ${isSA ? 'hidden' : isChanged ? 'bg-[#22c55e] text-white' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                        >
                          {isSavingId === u.id ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
      </div>

      {/* Invite Modal - Skalowany do wysokości */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-[7000] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#0f172a]/95 backdrop-blur-3xl" onClick={() => setIsInviteModalOpen(false)}></div>
          <div className="relative w-full max-w-3xl bg-white rounded-t-[2rem] sm:rounded-[3rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500 flex flex-col max-h-[95vh]">
             <div className="bg-[#0f172a] p-6 sm:p-10 text-white flex justify-between items-center shrink-0 border-b-4 sm:border-b-8 border-[#22c55e]">
                <div className="flex items-center space-x-4 sm:space-x-8">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#22c55e] rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl"><UserPlus size={24}/></div>
                  <div>
                    <h3 className="text-xl sm:text-4xl font-black uppercase italic leading-none">Dodaj Profil</h3>
                    <p className="text-[#22c55e] text-[8px] sm:text-[10px] font-black uppercase tracking-[0.5em] mt-2 sm:mt-3 italic">Konfiguracja Operatora</p>
                  </div>
                </div>
                <button onClick={() => setIsInviteModalOpen(false)} className="p-3 sm:p-5 bg-white/10 rounded-full text-white/50 hover:text-white transition-all"><X size={24}/></button>
             </div>
             <form onSubmit={async (e) => {
               e.preventDefault();
               if (!inviteEmail) return;
               setIsSubmittingInvite(true);
               try {
                 const { error } = await supabase.from('profiles').insert([{ email: inviteEmail.toLowerCase(), role: inviteRole, branch_id: Number(inviteBranch), first_name: inviteFirstName, last_name: inviteLastName, status: 'AKTYWNY' }]);
                 if (error) throw error;
                 alert("Profil utworzony!");
                 setIsInviteModalOpen(false);
                 onRefresh();
               } catch (err: any) { alert(err.message); }
               finally { setIsSubmittingInvite(false); }
             }} className="p-6 sm:p-10 space-y-6 sm:space-y-8 overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Imię</label>
                      <input type="text" value={inviteFirstName} onChange={e => setInviteFirstName(e.target.value)} placeholder="Imię..." className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black uppercase outline-none focus:border-[#22c55e] transition-all" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Nazwisko</label>
                      <input type="text" value={inviteLastName} onChange={e => setInviteLastName(e.target.value)} placeholder="Nazwisko..." className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black uppercase outline-none focus:border-[#22c55e] transition-all" />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Email Służbowy</label>
                   <input required type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="email@example.com" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black outline-none focus:border-[#22c55e] transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Rola</label>
                      <select value={inviteRole} onChange={e => setInviteRole(e.target.value as any)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black uppercase outline-none focus:border-[#22c55e] appearance-none cursor-pointer">
                        <option value="MECHANIK">MECHANIK</option>
                        <option value="DORADCA SERWISOWY">DORADCA</option>
                        <option value="ADMINISTRATOR">ADMIN</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">Oddział</label>
                      <select value={inviteBranch} onChange={e => setInviteBranch(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-black uppercase outline-none focus:border-[#22c55e] appearance-none cursor-pointer">
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>)}
                      </select>
                   </div>
                </div>
                <button type="submit" disabled={isSubmittingInvite} className="w-full py-6 sm:py-8 bg-[#22c55e] text-white rounded-[2rem] sm:rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl hover:bg-[#1eb354] transition-all border-b-4 sm:border-b-8 border-green-800 flex items-center justify-center space-x-4 active:scale-95 disabled:opacity-50">
                   {isSubmittingInvite ? <Loader className="animate-spin" size={24}/> : <Send size={24} />}
                   <span>Utwórz Dostęp</span>
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersModule;