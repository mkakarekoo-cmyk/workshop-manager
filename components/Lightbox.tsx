
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, ZoomOut, Download, ZoomIn } from 'lucide-react';

interface LightboxProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
}

const Lightbox: React.FC<LightboxProps> = ({ isOpen, imageUrl, onClose }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div 
      className="fixed inset-0 z-[100000] bg-[#0f172a]/95 backdrop-blur-2xl flex items-center justify-center p-6 sm:p-20 animate-in fade-in zoom-in-95 duration-500"
      onClick={onClose}
    >
      <div className="absolute top-10 right-10 flex items-center space-x-6 z-[100001]">
        <button 
          className="p-6 bg-white/10 hover:bg-white/20 text-white rounded-[2rem] transition-all border border-white/10 backdrop-blur-md active:scale-90"
          title="Pobierz"
        >
          <Download size={28} />
        </button>
        <button 
          onClick={onClose}
          className="p-6 bg-rose-500/80 hover:bg-rose-600 text-white rounded-[2rem] transition-all shadow-2xl shadow-rose-900/50 border border-rose-400/50 active:scale-90"
          title="Zamknij"
        >
          <X size={28} />
        </button>
      </div>

      <div className="relative max-w-7xl max-h-full flex flex-col items-center">
        <div className="relative group/light">
           <img 
            src={imageUrl} 
            alt="Preview" 
            className="max-w-full max-h-[85vh] object-contain rounded-[2.5rem] shadow-[0_0_150px_rgba(34,197,94,0.3)] border-8 border-white"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover/light:opacity-100 transition-opacity pointer-events-none">
             <ZoomIn size={120} className="text-white/20" />
          </div>
        </div>
        <div className="mt-10 bg-white/10 backdrop-blur-md px-12 py-5 rounded-[2.5rem] border border-white/20 flex items-center space-x-4">
          <div className="w-3 h-3 bg-[#22c55e] rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
          <p className="text-white text-[10px] font-black tracking-[0.5em] uppercase italic">Inspekcja Wizualna Zasobu</p>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Lightbox;
