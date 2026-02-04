
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  Trash2, Search, Plus, Wrench, Truck, AlertTriangle, CheckCircle, Package, 
  MapPin, X, Save, Loader, ZoomIn, Send, Info, Camera,
  ChevronLeft, ChevronRight, MapPinned, MoveHorizontal, 
  ChevronFirst, ChevronLast, Check, Mail, ShieldAlert
} from 'lucide-react';
import { Tool, ToolStatus, User, Branch } from '../types';
import Lightbox from '../components/Lightbox';
import { supabase } from '../supabase';
import { emailService } from '../services/emailService';

const PAGE_SIZE = 10;
const SUPABASE_URL = 'https://cuctnnsgvxhomxobpchi.supabase.co';

interface ToolsModuleProps {
  user: User;
  simulationBranchId: string;
  branches: Branch[];
  refreshTrigger: number;
  onRefresh: () => void;
  viewMode: 'BAZA NARZĘDZI' | 'MOJE NARZĘDZIA' | 'GRAFIK';
  targetToolId?: string | null;
  onTargetToolClear?: () => void;
}

const ToolsModule: React.FC<ToolsModuleProps> = ({ 
  user, simulationBranchId, branches, refreshTrigger, onRefresh, viewMode, targetToolId, onTargetToolClear
}) => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);

  const [transferTargetBranch, setTransferTargetBranch] = useState('1');
  const [transferNotes, setTransferNotes] = useState('');
  
  const [newName, setNewName] = useState('');
  const [newSN, setNewSN] = useState('');
  const [newBranch, setNewBranch] = useState('1');
  const [newCat, setNewCat] = useState('NARZĘDZIA RĘCZNE');
  const [newDesc, setNewDesc] = useState('');
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const isAdmin = user.role === 'ADMINISTRATOR';
  const selectedTool = useMemo(() => tools.find(t => t.id === selectedToolId), [tools, selectedToolId]);

  const effectiveBranchId = useMemo(() => {
    if (simulationBranchId === 'all') return Number(user.branch_id);
    return Number(simulationBranchId);
  }, [simulationBranchId, user.branch_id]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const getToolImageUrl = (path: string | null | undefined) => {
    if (!path) return `${SUPABASE_URL}/storage/v1/object/public/tool-photos/placeholder.jpg`;
    if (path.startsWith('http')) return path;
    return `${SUPABASE_URL}/storage/v1/object/public/tool-photos/${path}`;
  };

  const fetchTools = useCallback(async () => {
    setLoading(true);
    const from = (currentPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    try {
      let query = supabase
        .from('tools')
        .select('*, current_branch:branches!tools_branch_id_fkey(name, email), target_branch:branches!tools_target_branch_id_fkey(name, email)', { count: 'exact' })
        .order('name', { ascending: true })
        .range(from, to);

      if (viewMode === 'MOJE NARZĘDZIA') {
        query = query.eq('branch_id', effectiveBranchId);
      } 

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,serial_number.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      
      if (data) {
        setTools(data as Tool[]);
        setTotalCount(count || 0);
      }
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  }, [viewMode, simulationBranchId, searchTerm, effectiveBranchId, currentPage]);

  useEffect(() => {
    fetchTools();
  }, [refreshTrigger, viewMode, simulationBranchId, searchTerm, effectiveBranchId, currentPage]);

  const handleAddTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newSN) return;
    setIsSubmitting(true);
    try {
      let photoPath = null;
      if (newPhoto) {
        const fileName = `${Date.now()}_${newPhoto.name}`;
        await supabase.storage.from('tool-photos').upload(fileName, newPhoto);
        photoPath = fileName;
      }
      const { error } = await supabase.from('tools').insert([{
        name: newName, serial_number: newSN, branch_id: Number(newBranch),
        category: newCat, description: newDesc, status: ToolStatus.FREE, photo_path: photoPath
      }]);
      if (error) throw error;
      setIsAddModalOpen(false);
      onRefresh();
    } catch (err: any) { alert(err.message); } 
    finally { setIsSubmitting(false); }
  };

  const handleAcceptDelivery = async (tool: Tool) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('tools').update({
        branch_id: effectiveBranchId, target_branch_id: null, status: ToolStatus.FREE
      }).eq('id', tool.id);
      if (error) throw error;
      onRefresh();
    } catch (err: any) { alert(err.message); } 
    finally { setIsSubmitting(false); }
  };

  const handleTransferTool = async () => {
    if (!selectedTool) return;
    setIsSubmitting(true);
    try {
      const toBranch = branches.find(b => b.id === transferTargetBranch);
      const { error } = await supabase.from('tools').update({
        status: ToolStatus.IN_TRANSIT, target_branch_id: Number(transferTargetBranch)
      }).eq('id', selectedTool.id);
      if (error) throw error;
      if (toBranch?.email) {
        await emailService.sendNotification({
          to: toBranch.email, subject: `📦 LOGISTYKA: ${selectedTool.name}`,
          toolName: selectedTool.name, fromBranch: 'HUB', toBranch: toBranch.name,
          operator: user.first_name || user.email, notes: transferNotes
        });
      }
      setSelectedToolId(null);
      onRefresh();
    } catch (err: any) { alert(err.message); } 
    finally { setIsSubmitting(false); }
  };

  return (
    <div className="p-4 sm:p-8 lg:p-14 space-y-6 sm:space-y-12 pb-40 animate-in fade-in duration-700">
      {/* Statystyki - Zoptymalizowany Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-8">
        <StatCard label="W DRODZE" color="blue" icon={<Truck size={16}/>} value={tools.filter(t => t.status === ToolStatus.IN_TRANSIT).length} />
        <StatCard label="WYDANE" color="rose" icon={<Package size={16}/>} value={tools.filter(t => t.status === ToolStatus.OCCUPIED).length} />
        <StatCard label="SERWIS" color="amber" icon={<AlertTriangle size={16}/>} value={tools.filter(t => t.status === ToolStatus.MAINTENANCE).length} />
        <StatCard label="WOLNE" color="green" icon={<CheckCircle size={16}/>} value={tools.filter(t => t.status === ToolStatus.FREE).length} />
      </div>

      {/* Toolbar - Sticky i responsywny */}
      <div className="flex flex-col gap-4 bg-[#0f172a] p-5 sm:p-10 rounded-3xl sm:rounded-[4rem] shadow-2xl border-b-4 sm:border-b-8 border-[#22c55e] sticky top-20 z-40 transition-all">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-5xl font-black text-white uppercase italic tracking-tighter leading-none truncate">{viewMode}</h2>
            <div className="flex items-center mt-1 sm:mt-4">
               <div className="w-6 h-6 sm:w-10 sm:h-10 bg-[#22c55e]/10 rounded-lg flex items-center justify-center text-[#22c55e] mr-3 shadow-inner"><MapPinned size={14}/></div>
               <p className="text-[#22c55e] text-[8px] sm:text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.5em] italic truncate">
                 {viewMode === 'BAZA NARZĘDZI' ? 'GLOBAL' : `Baza: ${branches.find(b => Number(b.id) === Number(effectiveBranchId))?.name.toUpperCase()}`}
               </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {isAdmin && (
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 sm:px-10 py-3 sm:py-5 bg-[#22c55e] text-white rounded-xl sm:rounded-3xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-xl border-b-4 border-green-800 active:scale-95 flex items-center gap-2"
              >
                <Plus size={16}/> <span className="hidden xs:inline">DODAJ</span>
              </button>
            )}
          </div>
        </div>
        <div className="relative w-full">
             <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
             <input type="text" placeholder="Szukaj..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-5 py-3 sm:py-5 bg-slate-800 text-white border border-slate-700 rounded-xl sm:rounded-[2rem] text-xs sm:text-sm font-black outline-none focus:border-[#22c55e] uppercase transition-all" />
        </div>
      </div>

      {/* Kontener listy - Table na Desktop, Cards na Mobile */}
      <div className="space-y-4">
        {/* Widok Mobile - Karty */}
        <div className="block md:hidden space-y-4">
           {loading ? (
             <div className="py-20 flex justify-center"><Loader className="animate-spin text-[#22c55e]" size={32}/></div>
           ) : tools.length === 0 ? (
             <div className="text-center py-10 text-slate-400 font-black uppercase italic">Brak narzędzi</div>
           ) : tools.map(tool => (
             <ToolMobileCard 
               key={tool.id} tool={tool} isAdmin={isAdmin} 
               effectiveBranchId={effectiveBranchId} 
               onSelect={setSelectedToolId} 
               onZoom={setLightboxImage} 
               getToolImageUrl={getToolImageUrl}
               onAccept={handleAcceptDelivery}
             />
           ))}
        </div>

        {/* Widok Desktop - Tabela */}
        <div className="hidden md:block bg-white rounded-[3rem] shadow-3xl border border-slate-100 overflow-hidden relative min-h-[400px]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-20">
               <Loader className="animate-spin text-[#22c55e]" size={40}/>
            </div>
          )}
          <table className="w-full text-left border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50/80 text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] italic">
                <th className="px-10 py-8 border-b-2 border-slate-100">Zasób / S/N</th>
                <th className="px-10 py-8 border-b-2 border-slate-100">Lokalizacja</th>
                <th className="px-10 py-8 border-b-2 border-slate-100">Status</th>
                <th className="px-10 py-8 text-right border-b-2 border-slate-100">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-50">
              {tools.map(tool => (
                <ToolRow 
                  key={tool.id} tool={tool} user={user} 
                  effectiveBranchId={effectiveBranchId} 
                  onSelect={setSelectedToolId} 
                  getToolImageUrl={getToolImageUrl} 
                  onZoom={setLightboxImage} 
                  onDelete={(id: string) => supabase.from('tools').delete().eq('id', id).then(onRefresh)} 
                  onAccept={handleAcceptDelivery} 
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginacja */}
        <div className="bg-white rounded-2xl sm:rounded-[3rem] p-4 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl border border-slate-100">
           <div className="text-slate-400 font-black uppercase text-[9px] sm:text-[10px] tracking-widest italic order-2 sm:order-1">
              Poz. <span className="text-[#22c55e]">{Math.min(totalCount, (currentPage - 1) * PAGE_SIZE + 1)}-{Math.min(totalCount, currentPage * PAGE_SIZE)}</span> z <span className="text-[#0f172a]">{totalCount}</span>
           </div>
           <div className="flex items-center gap-2 order-1 sm:order-2">
              <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-[#22c55e] disabled:opacity-20"><ChevronFirst size={16}/></button>
              <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-[#22c55e] disabled:opacity-20"><ChevronLeft size={16}/></button>
              <div className="px-4 font-black text-xs text-[#0f172a]">{currentPage} / {totalPages || 1}</div>
              <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-[#22c55e] disabled:opacity-20"><ChevronRight size={16}/></button>
              <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-[#22c55e] disabled:opacity-20"><ChevronLast size={16}/></button>
           </div>
        </div>
      </div>

      {/* Modal Dodawania i Zarządzania (Zoptymalizowane pod Mobile) */}
      {isAddModalOpen && <ToolFormModal branches={branches} onClose={() => setIsAddModalOpen(false)} onSubmit={handleAddTool} isSubmitting={isSubmitting} />}
      {selectedTool && (
        <ToolDetailsModal 
          tool={selectedTool} branches={branches} 
          onClose={() => setSelectedToolId(null)} 
          onTransfer={handleTransferTool} 
          isSubmitting={isSubmitting} 
          getToolImageUrl={getToolImageUrl}
          transferTargetBranch={transferTargetBranch}
          setTransferTargetBranch={setTransferTargetBranch}
          transferNotes={transferNotes}
          setTransferNotes={setTransferNotes}
        />
      )}
      <Lightbox isOpen={!!lightboxImage} imageUrl={lightboxImage || ''} onClose={() => setLightboxImage(null)} />
    </div>
  );
};

// --- KOMPONENTY POMOCNICZE ---

const ToolMobileCard = ({ tool, isAdmin, effectiveBranchId, onSelect, onZoom, getToolImageUrl, onAccept }: any) => {
  const isHere = Number(tool.branch_id) === effectiveBranchId;
  const isHeadingToMe = tool.status === 'W DRODZE' && Number(tool.target_branch_id) === effectiveBranchId;
  const statusColors: any = { 'WOLNE': 'text-green-500 bg-green-50', 'W DRODZE': 'text-blue-500 bg-blue-50', 'KONSERWACJA': 'text-amber-500 bg-amber-50', 'ZAJĘTE': 'text-rose-500 bg-rose-50' };

  return (
    <div className={`p-5 rounded-3xl border-2 transition-all shadow-lg ${isHeadingToMe ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-slate-100'}`}>
       <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border-2 border-white shadow-sm" onClick={() => onZoom(getToolImageUrl(tool.photo_path))}>
             <img src={getToolImageUrl(tool.photo_path)} className="w-full h-full object-cover" alt="" />
          </div>
          <div className="min-w-0 flex-1">
             <h4 className="font-black text-[#0f172a] uppercase text-sm leading-tight truncate">{tool.name}</h4>
             <p className="text-[9px] font-mono font-black text-slate-400 mt-1 uppercase">S/N: {tool.serial_number}</p>
          </div>
          <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase ${statusColors[tool.status] || 'bg-slate-50 text-slate-400'}`}>
             {tool.status}
          </div>
       </div>
       <div className="flex items-center gap-2 mb-5">
          <MapPin size={10} className="text-slate-300"/>
          <span className="text-[9px] font-black text-slate-500 uppercase">{(tool.current_branch?.name || 'HUB').toUpperCase()}</span>
          {isHeadingToMe && <span className="text-[8px] font-black text-blue-600 animate-pulse ml-auto italic">IDZIE DO CIEBIE!</span>}
       </div>
       <button 
         onClick={() => isHeadingToMe ? onAccept(tool) : onSelect(tool.id)}
         className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 border-b-4 ${isHeadingToMe ? 'bg-blue-600 border-blue-900 text-white' : isHere ? 'bg-[#0f172a] border-black text-white' : 'bg-rose-500 border-rose-900 text-white'}`}
       >
         {isHeadingToMe ? 'POTWIERDŹ ODBIÓR' : isHere ? 'ZARZĄDZAJ' : 'ZAMÓW'}
       </button>
    </div>
  );
};

const ToolRow = ({ tool, effectiveBranchId, user, onSelect, getToolImageUrl, onZoom, onDelete, onAccept }: any) => {
  const isHere = Number(tool.branch_id) === effectiveBranchId;
  const isHeadingToMe = tool.status === 'W DRODZE' && Number(tool.target_branch_id) === effectiveBranchId;
  const isAdmin = user.role === 'ADMINISTRATOR';

  return (
    <tr className={`group transition-all ${isHeadingToMe ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'}`}>
      <td className="px-10 py-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-16 bg-slate-100 rounded-2xl overflow-hidden border-4 border-white shadow-xl cursor-zoom-in" onClick={() => onZoom(getToolImageUrl(tool.photo_path))}>
            <img src={getToolImageUrl(tool.photo_path)} className="w-full h-full object-cover" alt="" />
          </div>
          <div>
            <p className="font-black text-[#0f172a] uppercase text-base italic leading-none truncate max-w-[200px]">{tool.name}</p>
            <p className="text-[9px] font-mono font-black text-slate-300 uppercase mt-2">S/N: {tool.serial_number}</p>
          </div>
        </div>
      </td>
      <td className="px-10 py-6">
         <div className={`inline-flex items-center px-4 py-2 rounded-xl border-2 text-[9px] font-black uppercase tracking-widest ${isHere ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
            <MapPin size={12} className="mr-2" /> {tool.current_branch?.name?.toUpperCase() || 'HUB'}
         </div>
      </td>
      <td className="px-10 py-6">
         <div className="flex items-center gap-3">
            <span className={`w-2 h-2 rounded-full ${tool.status === 'WOLNE' ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`}></span>
            <span className="text-[10px] font-black uppercase text-slate-500">{tool.status}</span>
         </div>
      </td>
      <td className="px-10 py-6 text-right">
         <div className="flex items-center justify-end gap-3">
            {isAdmin && <button onClick={() => onDelete(tool.id)} className="p-4 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-lg"><Trash2 size={18}/></button>}
            <button 
              onClick={() => isHeadingToMe ? onAccept(tool) : onSelect(tool.id)} 
              className={`px-8 py-4 text-white rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all border-b-4 shadow-xl active:scale-95 ${isHeadingToMe ? 'bg-blue-600 border-blue-900 animate-pulse' : isHere ? 'bg-[#0f172a] border-black hover:bg-[#22c55e] hover:border-green-800' : 'bg-rose-500 border-rose-900'}`}
            >
               {isHeadingToMe ? 'ODBIERZ' : isHere ? 'ZARZĄDZAJ' : 'ZAMÓW'}
            </button>
         </div>
      </td>
    </tr>
  );
};

const StatCard = ({ label, value, color, icon }: any) => {
  const themes: any = { blue: 'text-blue-600 bg-blue-100', rose: 'text-rose-600 bg-rose-100', amber: 'text-amber-600 bg-amber-100', green: 'text-green-600 bg-green-100' };
  return (
    <div className="p-3 sm:p-6 rounded-2xl sm:rounded-[2.5rem] bg-white shadow-xl flex flex-col items-center text-center border-2 border-slate-50 transition-all hover:border-[#22c55e]/30 group">
      <div className={`p-2 sm:p-4 rounded-xl mb-2 sm:mb-4 group-hover:scale-110 transition-transform ${themes[color]}`}>{icon}</div>
      <p className="text-[7px] sm:text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 italic truncate w-full">{label}</p>
      <h3 className="text-xl sm:text-4xl font-black italic text-slate-800 leading-none">{value}</h3>
    </div>
  );
};

// --- MODALE (Uproszczone pod Mobile) ---

const ToolFormModal = ({ branches, onClose, onSubmit, isSubmitting }: any) => (
  <div className="fixed inset-0 z-[6000] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
    <div className="absolute inset-0 bg-[#0f172a]/95 backdrop-blur-xl" onClick={onClose}></div>
    <form onSubmit={onSubmit} className="relative w-full max-w-2xl bg-white rounded-t-[2.5rem] sm:rounded-[3rem] shadow-2xl animate-in slide-in-from-bottom duration-500 overflow-hidden max-h-[90vh] flex flex-col">
       <div className="bg-[#0f172a] p-6 text-white flex justify-between items-center border-b-4 border-[#22c55e] shrink-0">
          <h3 className="text-xl font-black uppercase italic">Nowy Zasób</h3>
          <button type="button" onClick={onClose} className="p-2 bg-white/10 rounded-full"><X size={20}/></button>
       </div>
       <div className="flex-1 p-6 space-y-6 overflow-y-auto no-scrollbar">
          <input required name="name" placeholder="NAZWA..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black uppercase text-sm outline-none focus:border-[#22c55e]" />
          <input required name="sn" placeholder="S/N..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black uppercase text-sm outline-none focus:border-[#22c55e]" />
          <select name="branch" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-black uppercase text-sm outline-none">
             {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>)}
          </select>
          <button type="submit" disabled={isSubmitting} className="w-full py-6 bg-[#22c55e] text-white rounded-3xl font-black uppercase tracking-widest shadow-2xl border-b-8 border-green-800 flex items-center justify-center gap-3">
             {isSubmitting ? <Loader className="animate-spin" size={20}/> : <Save size={20}/>} <span>ZAREJESTRUJ</span>
          </button>
       </div>
    </form>
  </div>
);

const ToolDetailsModal = ({ tool, branches, onClose, onTransfer, isSubmitting, getToolImageUrl, transferTargetBranch, setTransferTargetBranch, transferNotes, setTransferNotes }: any) => (
  <div className="fixed inset-0 z-[5000] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
    <div className="absolute inset-0 bg-[#0f172a]/95 backdrop-blur-xl" onClick={onClose}></div>
    <div className="relative w-full max-w-2xl bg-white rounded-t-[2.5rem] sm:rounded-[3rem] shadow-2xl animate-in slide-in-from-bottom duration-500 overflow-hidden max-h-[95vh] flex flex-col">
       <div className="bg-[#0f172a] p-8 text-white flex items-center gap-6 border-b-4 sm:border-b-8 border-[#22c55e] shrink-0">
          <div className="w-16 h-16 sm:w-24 sm:h-24 bg-[#22c55e] rounded-2xl overflow-hidden border-2 border-white shadow-xl rotate-2 shrink-0">
             <img src={getToolImageUrl(tool.photo_path)} className="w-full h-full object-cover" alt="" />
          </div>
          <div className="min-w-0 flex-1">
             <h3 className="text-xl sm:text-3xl font-black uppercase italic leading-tight truncate">{tool.name}</h3>
             <p className="text-[9px] sm:text-[11px] font-black text-[#22c55e] uppercase tracking-widest mt-1">OPERACJA LOGISTYCZNA</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all"><X size={20}/></button>
       </div>
       <div className="flex-1 p-8 space-y-8 overflow-y-auto no-scrollbar">
          <div className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100">
             <h4 className="text-xs font-black text-[#0f172a] uppercase mb-5 italic flex items-center gap-3"><Truck size={14} className="text-[#22c55e]"/> Transfer Oddziałowy</h4>
             <div className="space-y-4">
                <select value={transferTargetBranch} onChange={e => setTransferTargetBranch(e.target.value)} className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black uppercase text-xs outline-none focus:border-[#22c55e]">
                   {branches.filter((b: any) => Number(b.id) !== Number(tool.branch_id)).map((b: any) => <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>)}
                </select>
                <input value={transferNotes} onChange={e => setTransferNotes(e.target.value)} placeholder="Uwagi do wysyłki..." className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black uppercase text-xs outline-none focus:border-[#22c55e]" />
             </div>
             <button onClick={onTransfer} disabled={isSubmitting} className="w-full mt-6 py-5 bg-[#0f172a] text-[#22c55e] rounded-2xl font-black uppercase tracking-widest shadow-xl border-b-4 border-black active:scale-95 flex items-center justify-center gap-3">
                {isSubmitting ? <Loader className="animate-spin" size={18}/> : <Send size={18}/>} <span>WYZWÓL TRANSFER</span>
             </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100"><p className="text-[7px] font-black text-slate-300 uppercase mb-1">NR SERYJNY</p><p className="text-[10px] font-black text-[#0f172a]">{tool.serial_number}</p></div>
             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100"><p className="text-[7px] font-black text-slate-300 uppercase mb-1">BAZA OBECNA</p><p className="text-[10px] font-black text-[#22c55e] truncate">{(tool.current_branch?.name || 'HUB').toUpperCase()}</p></div>
          </div>
       </div>
    </div>
  </div>
);

export default ToolsModule;
