
import React, { useState } from 'react';
import { Lock, X, Save, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../supabase';

interface ChangePasswordModalProps {
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("Hasło musi mieć co najmniej 6 znaków.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Hasła nie są identyczne.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-[#0f172a]/90 backdrop-blur-2xl" onClick={onClose}></div>
      
      <div className="relative w-full max-w-lg bg-white rounded-[3rem] sm:rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border-b-[12px] border-[#22c55e]">
        <div className="bg-[#0f172a] p-10 sm:p-12 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-6">
            <div className="w-16 h-16 bg-[#22c55e] rounded-2xl flex items-center justify-center shadow-xl">
              <Lock size={28} />
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-black uppercase italic leading-none tracking-tighter">Zmień Hasło</h3>
              <p className="text-[#22c55e] text-[9px] font-black uppercase tracking-widest mt-2">Bezpieczeństwo konta</p>
            </div>
          </div>
          <button onClick={onClose} className="p-4 bg-white/10 rounded-full hover:bg-white/20 transition-all">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleUpdate} className="p-10 sm:p-14 space-y-8">
          {success ? (
            <div className="text-center py-10 space-y-6 animate-in fade-in zoom-in">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto border-4 border-[#22c55e]/20">
                <CheckCircle size={40} className="text-[#22c55e]" />
              </div>
              <p className="text-lg font-black text-green-700 uppercase italic tracking-tight">Hasło zostało zmienione!</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-rose-50 border-2 border-rose-100 p-6 rounded-3xl flex items-center space-x-4 animate-in slide-in-from-top-4">
                  <AlertCircle className="text-rose-500 shrink-0" size={20} />
                  <p className="text-xs font-black text-rose-600 uppercase italic leading-none">{error}</p>
                </div>
              )}

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6 italic">Nowe Hasło Systemowe</label>
                  <input 
                    required
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2.5rem] font-black outline-none focus:border-[#22c55e] shadow-inner"
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6 italic">Powtórz Nowe Hasło</label>
                  <input 
                    required
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2.5rem] font-black outline-none focus:border-[#22c55e] shadow-inner"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-8 bg-[#22c55e] text-white rounded-[3rem] font-black uppercase tracking-widest shadow-2xl border-b-8 border-green-800 transition-all active:scale-95 flex items-center justify-center space-x-4 disabled:opacity-50"
              >
                {loading ? <Loader className="animate-spin" size={24} /> : <Save size={24} />}
                <span>Zatwierdź nowe hasło</span>
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
