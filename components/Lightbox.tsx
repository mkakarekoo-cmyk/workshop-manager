
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, ZoomOut, Download } from 'lucide-react';

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
      className="fixed inset-0 z-[100000] bg-[#0f172a]/95 backdrop-blur-xl flex items-center justify-center p-6 sm:p-20 animate-in fade-in zoom-in-95 duration-300"
      onClick={onClose}
    >
      <div className="absolute top-10 right-10 flex items-center space-x-4">
        <button 
          className="p-4 bg-white/10 hover:bg-white/20 text-white rounded-[1.5rem] transition-all border border-white/10"
          title="Pobierz"
        >
          <Download size={24} />
        </button>
        <button 
          onClick={onClose}
          className="p-4 bg-rose-500/80 hover:bg-rose-600 text-white rounded-[1.5rem] transition-all shadow-xl shadow-rose-900/50 border border-rose-400/50"
          title="Zamknij"
        >
          <X size={24} />
        </button>
      </div>

      <div className="relative max-w-7xl max-h-full flex flex-col items-center">
        <img 
          src={imageUrl} 
          alt="Preview" 
          className="max-w-full max-h-[80vh] object-contain rounded-[2rem] shadow-[0_0_100px_rgba(34,197,94,0.2)] border-8 border-white"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="mt-8 bg-white/10 backdrop-blur-md px-10 py-4 rounded-3xl border border-white/20">
          <p className="text-white text-sm font-bold tracking-widest uppercase">Podgląd Zasobu Technicznego</p>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Lightbox;
