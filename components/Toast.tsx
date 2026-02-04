
import React, { useEffect } from 'react';
import { X, Bell, Info, AlertTriangle, CheckCircle, Truck, ShoppingBag } from 'lucide-react';

export interface ToastProps {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS';
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, title, message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), 5000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  const icons = {
    INFO: <Info size={20} className="text-blue-500" />,
    WARNING: <AlertTriangle size={20} className="text-amber-500" />,
    SUCCESS: <CheckCircle size={20} className="text-[#22c55e]" />,
  };

  const bgColors = {
    INFO: 'border-l-blue-500',
    WARNING: 'border-l-amber-500',
    SUCCESS: 'border-l-[#22c55e]',
  };

  return (
    <div className={`w-80 sm:w-96 bg-white shadow-2xl rounded-2xl border-l-8 ${bgColors[type]} p-5 flex items-start space-x-4 animate-in slide-in-from-right duration-500 mb-4 pointer-events-auto`}>
      <div className="p-3 bg-slate-50 rounded-xl shrink-0">
        {title.includes('ZAMÓWIENIE') ? <ShoppingBag size={20} className="text-amber-600" /> : 
         title.includes('WYSYŁKA') || title.includes('DRODZE') ? <Truck size={20} className="text-blue-600" /> : 
         icons[type]}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">{title}</h4>
        <p className="text-sm font-bold text-slate-800 leading-tight italic">{message}</p>
      </div>
      <button onClick={() => onClose(id)} className="text-slate-300 hover:text-slate-500 transition-colors">
        <X size={18} />
      </button>
    </div>
  );
};

export default Toast;
