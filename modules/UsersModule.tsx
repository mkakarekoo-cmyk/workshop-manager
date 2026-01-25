
import React, { useState, useMemo } from 'react';
import { 
  Users, 
  ShieldCheck, 
  Search, 
  UserPlus, 
  ShieldAlert,
  Trash2,
  Lock,
  Unlock,
  CheckCircle2,
  Mail,
  Shield,
  User as UserIcon,
  X,
  AlertCircle,
  MapPin,
  ChevronDown
} from 'lucide-react';
import { User, Branch } from '../types';

interface UsersModuleProps {
  user: User;
  branches: Branch[];
}

const MOCK_USERS: User[] = [
  { id: 'u1', email: 'm.kakarekoo@gmail.com', role: 'ADMINISTRATOR', name: 'MATEUSZ KAKAREKO', status: 'AKTYWNY', avatar_url: 'https://i.pravatar.cc/150?u=u1', branch_id: '1' },
  { id: 'u2', email: 'biuro@warsztat.pl', role: 'USER', name: 'ADAM NOWAK', status: 'AKTYWNY', avatar_url: 'https://i.pravatar.cc/150?u=u2', branch_id: '2' },
  { id: 'u3', email: 'serwis@agro-tech.com', role: 'USER', name: 'JAN KOWALSKI', status: 'ZABLOKOWANY', avatar_url: 'https://i.pravatar.cc/150?u=u3', branch_id: '3' },
  { id: 'u4', email: 'logistyka@firma.pl', role: 'USER', name: 'EWA ZIELIŃSKA', status: 'AKTYWNY', avatar_url: 'https://i.pravatar.cc/150?u=u4', branch_id: '5' },
];

const UsersModule: React.FC<UsersModuleProps> = ({ user: currentUser, branches }) => {
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const toggleStatus = (id: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        return { ...u, status: u.status === 'AKTYWNY' ? 'ZABLOKOWANY' : 'AKTYWNY' };
      }
      return u;
    }));
  };

  const changeRole = (id: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        return { ...u, role: u.role === 'ADMINISTRATOR' ? 'USER' : 'ADMINISTRATOR' };
      }
      return u;
    }));
  };

  const changeBranch = (userId: string, branchId: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, branch_id: branchId };
      }
      return u;
    }));
  };

  const deleteUser = (id: string) => {
    if (confirm('Czy na pewno chcesz usunąć tego użytkownika?')) {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [users, searchTerm]);

  return (
    <div className="p-10 space-y-10 animate-in fade-in duration-1000">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
        <div>
          <h2 className="text-4xl font-black text-[#0f172a] tracking-tighter uppercase mb-2">Zarządzanie Użytkownikami</h2>
          <p className="text-slate-400 text-sm font-black uppercase tracking-[0.2em] flex items-center">
            <ShieldCheck className="w-4 h-4 mr-2 text-[#22c55e]" /> Panel Kontroli Dostępu i Uprawnień
          </p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="px-10 py-5 bg-[#22c55e] hover:bg-[#1eb354] text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-2xl shadow-green-500/20 transition-all active:scale-95 flex items-center border-2 border-white/20"
        >
          <UserPlus className="w-5 h-5 mr-3" /> Dodaj Użytkownika
        </button>
      </div>

      <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden min-h-[600px] flex flex-col">
        <div className="p-10 border-b border-slate-50 flex flex-col lg:flex-row justify-between items-center gap-8 bg-slate-50/30">
          <div className="relative w-full lg:w-[500px] group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#22c55e] transition-colors" size={24} />
            <input 
              type="text" 
              placeholder="Szukaj po nazwisku lub adresie e-mail..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-white border border-slate-100 rounded-[2.5rem] text-sm font-black focus:ring-4 focus:ring-[#22c55e]/10 outline-none transition-all shadow-inner"
            />
          </div>
          <div className="flex items-center space-x-4 w-full lg:w-auto">
             <div className="bg-[#0f172a] px-6 py-4 rounded-2xl flex items-center space-x-4 border-2 border-slate-700">
                <Users className="text-[#22c55e]" size={20} />
                <span className="text-white text-xs font-black uppercase tracking-widest">{filteredUsers.length} AKTYWNYCH KONT</span>
             </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
              <tr>
                <th className="px-10 py-6">Profil & E-mail</th>
                <th className="px-10 py-6">Rola</th>
                <th className="px-10 py-6">Oddział</th>
                <th className="px-10 py-6">Status</th>
                <th className="px-10 py-6 text-right">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-all group animate-in slide-in-from-bottom duration-500">
                  <td className="px-10 py-8">
                    <div className="flex items-center">
                      <div className="relative">
                        <img src={u.avatar_url} className="w-14 h-14 rounded-2xl border-4 border-white shadow-xl group-hover:scale-110 transition-transform" alt="" />
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white ${u.status === 'AKTYWNY' ? 'bg-[#22c55e]' : 'bg-rose-500'}`}></div>
                      </div>
                      <div className="ml-6">
                        <p className="font-black text-[#0f172a] text-base uppercase tracking-tight leading-none mb-1.5">{u.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 flex items-center uppercase tracking-widest">
                          <Mail className="w-3 h-3 mr-2 text-[#22c55e]" /> {u.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <button 
                      onClick={() => changeRole(u.id)}
                      className={`inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                        u.role === 'ADMINISTRATOR' ? 'bg-[#0f172a] text-[#22c55e] border-slate-700' : 'bg-slate-100 text-slate-500 border-white shadow-sm'
                      }`}
                    >
                      {u.role === 'ADMINISTRATOR' ? <Shield className="w-3.5 h-3.5 mr-2" /> : <UserIcon className="w-3.5 h-3.5 mr-2" />}
                      {u.role}
                    </button>
                  </td>
                  <td className="px-10 py-8">
                    <div className="relative group/select">
                      <select 
                        value={u.branch_id}
                        onChange={(e) => changeBranch(u.id, e.target.value)}
                        className="appearance-none bg-slate-50 border-2 border-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none focus:ring-2 focus:ring-[#22c55e] transition-all pr-10 shadow-sm"
                      >
                        {branches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover/select:text-[#22c55e]" />
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <span className={`inline-flex items-center px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${
                      u.status === 'AKTYWNY' ? 'bg-green-50 text-[#22c55e] border-white shadow-sm' : 'bg-rose-50 text-rose-600 border-white shadow-sm'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => toggleStatus(u.id)}
                        className={`p-4 rounded-2xl transition-all active:scale-90 shadow-sm border border-slate-100 bg-white ${u.status === 'AKTYWNY' ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' : 'text-[#22c55e] hover:bg-green-50'}`}
                        title={u.status === 'AKTYWNY' ? 'Zablokuj Dostęp' : 'Przywróć Dostęp'}
                      >
                        {u.status === 'AKTYWNY' ? <Lock size={20} /> : <Unlock size={20} />}
                      </button>
                      <button 
                        onClick={() => deleteUser(u.id)}
                        className="p-4 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all active:scale-90 shadow-sm border border-slate-100 bg-white"
                        title="Usuń Użytkownika"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-[#0f172a]/90 backdrop-blur-xl" onClick={() => setIsAddModalOpen(false)}></div>
           <div className="relative w-full max-w-xl bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
              <div className="bg-[#22c55e] p-12 text-white flex justify-between items-center relative overflow-hidden">
                 <div className="relative z-10">
                    <h3 className="text-3xl font-black uppercase tracking-tighter">Nowy Użytkownik</h3>
                    <p className="text-green-50 text-[10px] font-black uppercase tracking-widest mt-2">Dostęp do platformy</p>
                 </div>
                 <button onClick={() => setIsAddModalOpen(false)} className="p-5 bg-white/20 hover:bg-white/30 rounded-full transition-all border border-white/20 relative z-10"><X size={24} /></button>
              </div>
              <div className="p-12 space-y-6">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Imię i Nazwisko</label>
                    <input type="text" placeholder="Np. JAN KOWALSKI" className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm font-black focus:ring-4 focus:ring-[#22c55e]/10 outline-none" />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Adres E-mail</label>
                    <input type="email" placeholder="uzytkownik@firma.pl" className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm font-black focus:ring-4 focus:ring-[#22c55e]/10 outline-none" />
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Oddział Macierzysty</label>
                    <select className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm font-black outline-none cursor-pointer">
                       {branches.map(b => <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>)}
                    </select>
                 </div>
                 <button className="w-full py-6 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl transition-all">Generuj Zaproszenie</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default UsersModule;
