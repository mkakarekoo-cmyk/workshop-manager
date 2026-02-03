
import React, { useState, useEffect } from 'react';
import { Mail, Warehouse, ShieldCheck, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string, password: string) => void;
  error?: string | null;
}

const Login: React.FC<LoginProps> = ({ onLogin, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Stop loading if an error occurs
  useEffect(() => {
    if (error) {
      setLoading(false);
    }
  }, [error]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    onLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute -top-64 -left-64 w-[800px] h-[800px] bg-[#22c55e] rounded-full blur-[160px] animate-pulse"></div>
        <div className="absolute -bottom-64 -right-64 w-[800px] h-[800px] bg-blue-600 rounded-full blur-[160px] opacity-40"></div>
      </div>

      <div className="w-full max-w-xl bg-white rounded-[4rem] shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-700 border border-white/20">
        <div className="bg-[#22c55e] p-16 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 flex items-center justify-center">
            <Warehouse className="w-96 h-96 scale-150 rotate-12" />
          </div>
          <div className="relative z-10">
            <div className="inline-flex p-8 bg-white/20 backdrop-blur-3xl rounded-[3rem] mb-8 border border-white/30 shadow-2xl">
              <Warehouse className="w-16 h-16" />
            </div>
            <h1 className="text-5xl font-black tracking-tighter uppercase mb-3 leading-none italic drop-shadow-lg">Menadżer Narzędzi</h1>
            <p className="text-green-50 text-[11px] font-black uppercase tracking-[0.5em] opacity-90">Centralny System Zarządzania</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-16 space-y-10 bg-white">
          {error && (
            <div className="bg-rose-50 border-2 border-rose-100 p-6 rounded-[2rem] flex items-center space-x-4 animate-in slide-in-from-top-4 duration-300">
              <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg">
                <AlertCircle size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-1">Błąd Autoryzacji</p>
                <p className="text-sm font-black text-rose-600 uppercase italic leading-none">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-6 flex items-center">
              <Mail className="w-3 h-3 mr-2 text-[#22c55e]" /> Adres Email Pracownika
            </label>
            <div className="relative group">
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-8 pr-8 py-6 bg-slate-50 border border-slate-200 rounded-[2.5rem] focus:ring-8 focus:ring-[#22c55e]/5 focus:border-[#22c55e] focus:bg-white transition-all outline-none font-black text-slate-700 text-sm placeholder:text-slate-300 placeholder:font-medium"
                placeholder="email@example.com"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-6 flex items-center">
              <Lock className="w-3 h-3 mr-2 text-[#22c55e]" /> Hasło Systemowe
            </label>
            <div className="relative group">
              <input
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-8 pr-20 py-6 bg-slate-50 border border-slate-200 rounded-[2.5rem] focus:ring-8 focus:ring-[#22c55e]/5 focus:border-[#22c55e] focus:bg-white transition-all outline-none font-black text-slate-700 text-sm placeholder:text-slate-300 placeholder:font-medium"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#22c55e] transition-colors"
              >
                {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-8 bg-[#22c55e] hover:bg-[#1eb354] text-white rounded-[3rem] font-black uppercase tracking-widest shadow-2xl shadow-green-900/20 transition-all active:scale-95 flex items-center justify-center space-x-4 border-b-4 border-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <ShieldCheck className="w-6 h-6 animate-pulse" />
            ) : (
              <>
                <span>Autoryzacja</span>
                <ArrowRight className="w-6 h-6" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
