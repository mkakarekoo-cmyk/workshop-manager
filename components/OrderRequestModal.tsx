
import React from 'react';
import { ShoppingBag, X, CheckCircle, AlertTriangle, ArrowRight, Building2, Wrench } from 'lucide-react';
import { AppNotification } from '../types';

interface OrderRequestModalProps {
  order: AppNotification;
  onConfirm: (order: AppNotification) => void;
  onReject: (order: AppNotification) => void;
}

const OrderRequestModal: React.FC<OrderRequestModalProps> = ({ order, onConfirm, onReject }) => {
  const fromBranchName = order.raw_log?.to_branch?.name || "Inny oddział";
  const toolName = order.raw_log?.tool?.name || "Narzędzie";

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="absolute inset-0 bg-[#0f172a]/90 backdrop-blur-2xl"></div>
      
      <div className="relative w-full max-w-xl bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border-b-[12px] border-amber-500">
        
        {/* Pulsing Warning Header */}
        <div className="bg-amber-500 p-12 text-white text-center space-y-4 relative">
           <div className="absolute top-0 left-0 w-full h-full bg-white/10 animate-pulse pointer-events-none"></div>
           <div className="inline-flex p-6 bg-white/20 rounded-3xl border border-white/30 shadow-2xl mb-2">
              <AlertTriangle size={56} className="text-white fill-amber-600" />
           </div>
           <h3 className="text-[12px] font-black uppercase tracking-[0.5em] opacity-80 italic">Wykryto żądanie zasobu</h3>
           <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none">Oddział {fromBranchName} potrzebuje Twojego narzędzia</h2>
        </div>

        {/* Content Section */}
        <div className="p-12 space-y-8 text-center">
           <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-slate-100 shadow-inner group">
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-3 italic">NARZĘDZIE BĘDĄCE W TWOIM POSIADANIU:</p>
              <div className="flex items-center justify-center space-x-4">
                 <Wrench size={24} className="text-amber-500" />
                 <h4 className="text-2xl font-black text-[#0f172a] uppercase italic tracking-tight">{toolName}</h4>
              </div>
           </div>

           <p className="text-slate-500 text-sm font-bold uppercase italic leading-relaxed">
             Czy akceptujesz przekazanie tego narzędzia do oddziału <span className="text-amber-600 underline">{fromBranchName}</span>? 
           </p>
        </div>

        {/* Choice Section */}
        <div className="p-12 pt-0 grid grid-cols-2 gap-6">
           <button 
            onClick={() => onReject(order)}
            className="group py-8 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center space-x-3 active:scale-95 border-b-4 border-rose-100 hover:border-rose-700 shadow-xl"
          >
            <X size={20} />
            <span>ODRZUĆ</span>
          </button>
          <button 
            onClick={() => onConfirm(order)}
            className="group py-8 bg-[#22c55e] text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-green-500/30 border-b-8 border-green-800 transition-all flex items-center justify-center space-x-3 hover:bg-[#1eb354] active:scale-95"
          >
            <CheckCircle size={20} />
            <span>TAK - PRZEKAŻ</span>
            <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
          </button>
        </div>

        <div className="bg-slate-50 py-4 text-center border-t border-slate-100">
           <p className="text-slate-300 text-[8px] font-black uppercase tracking-[0.4em] italic">Potwierdzenie przeniesie Cię do wysyłki logistycznej</p>
        </div>
      </div>
    </div>
  );
};

export default OrderRequestModal;
