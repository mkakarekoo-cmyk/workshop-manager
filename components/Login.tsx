
import React, { useState } from 'react';
import { KeyRound, Mail, Warehouse, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      onLogin(email);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute -top-48 -left-48 w-[600px] h-[600px] bg-[#22c55e] rounded-full blur-[160px]"></div>
        <div className="absolute -bottom-48 -right-48 w-[600px] h-[600px] bg-blue-600 rounded-full blur-[160px]"></div>
      </div>

      <div className="w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="bg-[#22c55e] p-12 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <Warehouse className="w-full h-full scale-150 rotate-12" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex p-5 bg-white/20 backdrop-blur-xl rounded-[2rem] mb-6 border border-white/30 shadow-xl">
              <Warehouse className="w-12 h-12" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Menadżer Warsztatu</h1>
            <p className="text-green-50 text-sm font-bold uppercase tracking-widest opacity-80">Profesjonalne Zarządzanie Zasobami</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-12 space-y-10">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Konto Użytkownika</label>
            <div className="relative group">
              <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#22c55e] transition-colors" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-[#22c55e]/10 focus:border-[#22c55e] transition-all outline-none font-bold text-slate-700"
                placeholder="m.kakarekoo@gmail.com"
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Hasło dostępu</label>
            <div className="relative group">
              <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#22c55e] transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-[#22c55e]/10 focus:border-[#22c55e] transition-all outline-none font-bold text-slate-700"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-6 bg-[#0f172a] hover:bg-[#1e293b] text-white font-black rounded-[2rem] shadow-2xl shadow-slate-400/20 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center uppercase tracking-widest text-sm"
          >
            {loading ? 'Autoryzacja...' : 'Zaloguj do systemu'}
          </button>
        </form>

        <div className="p-8 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.1em]">
            © 2026 Created by Mateusz Kakareko
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
