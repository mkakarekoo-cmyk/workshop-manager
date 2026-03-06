
import React from 'react';
import { Truck, ExternalLink, ArrowRight } from 'lucide-react';

const FleetRedirect: React.FC = () => {
  const handleRedirect = () => {
    // Tutaj wpisz docelowy URL zewnętrznej aplikacji
    window.open('https://twoja-aplikacja-flotowa.pl', '_blank');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 lg:p-20 animate-in fade-in duration-1000">
      <div className="max-w-4xl w-full bg-[#0f172a] rounded-[4rem] p-12 lg:p-20 shadow-2xl border-b-8 border-[#22c55e] relative overflow-hidden text-center">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
          <Truck size={400} className="text-white" />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-32 h-32 bg-[#22c55e] rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-green-500/20 mb-10 rotate-3 animate-bounce">
            <Truck size={56} />
          </div>

          <h2 className="text-5xl lg:text-7xl font-black text-white uppercase tracking-tighter italic leading-none mb-6">
            Moja Flota
          </h2>
          
          <p className="text-[#22c55e] text-sm lg:text-base font-black uppercase tracking-[0.4em] mb-12 max-w-2xl mx-auto">
            Zarządzanie pojazdami i wyposażeniem mobilnym odbywa się w dedykowanym systemie flotowym.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button 
              onClick={handleRedirect}
              className="px-12 py-6 bg-[#22c55e] text-white rounded-[2.2rem] text-sm font-black uppercase tracking-widest shadow-2xl hover:bg-[#1eb354] transition-all border-b-4 border-green-800 active:scale-95 flex items-center space-x-4 group"
            >
              <span>Otwórz Aplikację Floty</span>
              <ExternalLink size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
          </div>

          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-3xl">
            {[
              { label: 'Zarządzanie Autami', desc: 'Pełna baza pojazdów' },
              { label: 'Inwentaryzacja', desc: 'Wyposażenie szuflad' },
              { label: 'Karty Paliwowe', desc: 'Rozliczenia i limity' }
            ].map((item, i) => (
              <div key={i} className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-sm">
                <p className="text-white font-black text-[10px] uppercase tracking-widest mb-2">{item.label}</p>
                <p className="text-slate-400 text-[8px] uppercase font-bold tracking-widest">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <p className="mt-10 text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] italic flex items-center">
        <ArrowRight size={14} className="mr-3 text-[#22c55e]" /> Kliknięcie przycisku otworzy nową kartę w przeglądarce
      </p>
    </div>
  );
};

export default FleetRedirect;
