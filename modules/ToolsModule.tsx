
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  Trash2, Search, Plus, Wrench, Truck, AlertTriangle, CheckCircle, Package, 
  MapPin, X, Save, Loader, ZoomIn, Send, Info, Camera,
  ChevronLeft, ChevronRight, MapPinned, MoveHorizontal, 
  ChevronFirst, ChevronLast, Check
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

  const [transferTargetBranch, setTransferTargetBranch] = useState('1');
  const [transferNotes, setTransferNotes] = useState('');
  
  const [newName, setNewName] = useState('');
  const [newSN, setNewSN] = useState('');
  const [newBranch, setNewBranch] = useState('1');
  const [newCat, setNewCat] = useState('NARZĘDZIA RĘCZNE');
  const [newDesc, setNewDesc] = useState('');
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, simulationBranchId, viewMode]);

  const handleAddTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newSN) return;
    setIsSubmitting(true);

    try {
      let photoPath = null;
      if (newPhoto) {
        const fileName = `${Date.now()}_${newPhoto.name}`;
        const { error: uploadError } = await supabase.storage.from('tool-photos').upload(fileName, newPhoto);
        if (uploadError) throw uploadError;
        photoPath = fileName;
      }

      const { error } = await supabase.from('tools').insert([{
        name: newName,
        serial_number: newSN,
        branch_id: Number(newBranch),
        category: newCat,
        description: newDesc,
        status: ToolStatus.FREE,
        photo_path: photoPath
      }]);

      if (error) throw error;

      setIsAddModalOpen(false);
      setNewName(''); setNewSN(''); setNewDesc(''); setNewPhoto(null); setPhotoPreview(null);
      onRefresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransferTool = async () => {
    if (!selectedTool) return;
    setIsSubmitting(true);

    try {
      const fromBranch = branches.find(b => Number(b.id) === Number(selectedTool.branch_id));
      const toBranch = branches.find(b => b.id === transferTargetBranch);

      const { error } = await supabase.from('tools').update({
        status: ToolStatus.IN_TRANSIT,
        target_branch_id: Number(transferTargetBranch)
      }).eq('id', selectedTool.id);

      if (error) throw error;

      await supabase.from('tool_logs').insert([{
        tool_id: selectedTool.id,
        action: 'PRZESUNIĘCIE',
        from_branch_id: selectedTool.branch_id,
        to_branch_id: Number(transferTargetBranch),
        operator_id: user.id,
        notes: transferNotes || `Przesunięcie z ${fromBranch?.name} do ${toBranch?.name}`
      }]);

      const destinationEmail = toBranch?.email || branches.find(b => b.id === transferTargetBranch)?.email;

      if (destinationEmail) {
        await emailService.sendNotification({
          to: destinationEmail,
          subject: `📦 LOGISTYKA: Wysłano do Państwa ${selectedTool.name}`,
          toolName: selectedTool.name,
          fromBranch: fromBranch?.name || 'HUB',
          toBranch: toBranch?.name || 'Inny',
          operator: `${user.first_name || ''} ${user.last_name || user.email}`.trim(),
          notes: transferNotes
        });
      }

      setSelectedToolId(null);
      setTransferNotes('');
      onRefresh();
      alert("✅ Zasób został wysłany. Oddział docelowy otrzymał powiadomienie e-mail.");
    } catch (err: any) {
      alert("❌ Błąd transferu: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptDelivery = async (tool: Tool) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const fromBranch = branches.find(b => Number(b.id) === Number(tool.branch_id));
      const currentBranch = branches.find(b => Number(b.id) === effectiveBranchId);

      const { error } = await supabase.from('tools').update({
        branch_id: effectiveBranchId,
        target_branch_id: null,
        status: ToolStatus.FREE
      }).eq('id', tool.id);

      if (error) throw error;

      await supabase.from('tool_logs').insert([{
        tool_id: tool.id,
        action: 'PRZYJĘCIE',
        from_branch_id: tool.branch_id,
        to_branch_id: effectiveBranchId,
        operator_id: user.id,
        notes: `Odebrano fizycznie w oddziale ${currentBranch?.name}`
      }]);

      const sourceEmail = fromBranch?.email || branches.find(b => Number(b.id) === Number(tool.branch_id))?.email;

      if (sourceEmail) {
        await emailService.sendNotification({
          to: sourceEmail,
          subject: `✅ OTRZYMANO: ${tool.name} dotarł do celu`,
          toolName: tool.name,
          fromBranch: fromBranch?.name || 'Inny',
          toBranch: currentBranch?.name || 'Inny',
          operator: `${user.first_name || ''} ${user.last_name || user.email}`.trim(),
          notes: "Narzędzie zostało odebrane i jest gotowe do pracy."
        });
      }

      onRefresh();
      alert(`✅ Potwierdzono odbiór: ${tool.name}`);
    } catch (err: any) {
      alert("❌ Błąd przyjmowania: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2.5; 
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };
  const stopDragging = () => setIsDragging(false);

  return (
    <div className="p-4 sm:p-8 lg:p-14 space-y-8 sm:space-y-12 pb-40 animate-in fade-in duration-700">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
        <StatCard label="W TRANSPORCIE" color="blue" icon={<Truck size={20}/>} value={tools.filter(t => t.status === ToolStatus.IN_TRANSIT).length} />
        <StatCard label="WYDANE" color="rose" icon={<Package size={20}/>} value={tools.filter(t => t.status === ToolStatus.OCCUPIED).length} />
        <StatCard label="W SERWISIE" color="amber" icon={<AlertTriangle size={20}/>} value={tools.filter(t => t.status === ToolStatus.MAINTENANCE).length} />
        <StatCard label="DOSTĘPNE" color="green" icon={<CheckCircle size={20}/>} value={tools.filter(t => t.status === ToolStatus.FREE).length} />
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6 bg-[#0f172a] p-6 sm:p-10 rounded-[2rem] lg:rounded-[4rem] shadow-2xl border-b-8 border-[#22c55e] sticky top-24 z-30">
        <div className="flex items-center space-x-8">
          <div>
            <h2 className="text-2xl sm:text-5xl font-black text-white uppercase italic tracking-tighter leading-none mb-2 sm:mb-3">{viewMode}</h2>
            <div className="flex items-center mt-2 sm:mt-4">
               <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#22c55e]/10 rounded-xl flex items-center justify-center text-[#22c55e] mr-4 shadow-inner"><MapPinned size={16}/></div>
               <p className="text-[#22c55e] text-[9px] sm:text-[11px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] italic">
                 {viewMode === 'BAZA NARZĘDZI' ? 'CENTRALNY WIDOK SYSTEMU' : `AKTYWNY ODDZIAŁ: ${branches.find(b => Number(b.id) === effectiveBranchId)?.name.toUpperCase()}`}
               </p>
            </div>
          </div>
          {isAdmin && (
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="hidden sm:flex px-10 py-5 bg-[#22c55e] text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-[#1eb354] transition-all border-b-4 border-green-800 active:scale-95 items-center space-x-3"
            >
              <Plus size={18}/> <span>Nowy Zasób</span>
            </button>
          )}
        </div>
        <div className="relative group w-full lg:w-[450px]">
             <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
             <input type="text" placeholder="Szukaj zasobu..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 py-4 sm:py-6 bg-slate-800 text-white border border-slate-700 rounded-[1.5rem] sm:rounded-[2.5rem] text-xs sm:text-sm font-black outline-none focus:border-[#22c55e] uppercase transition-all" />
        </div>
      </div>

      <div className="relative group-table">
        <div 
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDragging}
          onMouseLeave={stopDragging}
          className={`bg-white rounded-t-[2rem] lg:rounded-t-[4rem] shadow-3xl border-x-4 border-t-4 border-slate-100 force-show-scroll relative min-h-[500px] transition-all ${isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'}`}
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-20">
               <Loader className="animate-spin text-[#22c55e]" size={40}/>
            </div>
          )}
          
          <table className="w-full text-left min-w-[1500px] border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50/80 text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] italic sticky top-0 bg-white z-20">
                <th className="px-14 py-10 sticky left-0 z-[25] bg-slate-50 border-b-4 border-slate-100 shadow-[10px_0_15px_rgba(0,0,0,0.03)]">Zasób / Specyfikacja</th>
                <th className="px-14 py-10 border-b-4 border-slate-100">Lokalizacja</th>
                <th className="px-14 py-10 border-b-4 border-slate-100">Status</th>
                <th className="px-14 py-10 text-right bg-white/95 backdrop-blur-md sticky right-0 z-[25] border-b-4 border-slate-100 border-l-4 shadow-[-20px_0_30px_rgba(0,0,0,0.05)]">Panel Akcji</th>
              </tr>
            </thead>
            <tbody className="divide-y-4 divide-slate-50">
              {tools.length === 0 && !loading ? (
                <tr><td colSpan={4} className="px-14 py-32 text-center text-slate-300 font-black uppercase italic"><Package size={80} className="mx-auto mb-6 opacity-20"/>Brak wyników w bazie danych</td></tr>
              ) : tools.map(tool => (
                <ToolRow key={tool.id} tool={tool} effectiveBranchId={effectiveBranchId} user={user} onSelect={setSelectedToolId} getToolImageUrl={getToolImageUrl} onZoom={setLightboxImage} onDelete={(id: string) => supabase.from('tools').delete().eq('id', id).then(onRefresh)} onAccept={handleAcceptDelivery} />
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-b-[2rem] lg:rounded-b-[4rem] border-x-4 border-b-4 border-slate-100 p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl relative z-10">
           <div className="text-slate-400 font-black uppercase text-[10px] tracking-widest italic">
              Pozycje <span className="text-[#22c55e]">{Math.min(totalCount, (currentPage - 1) * PAGE_SIZE + 1)}-{Math.min(totalCount, currentPage * PAGE_SIZE)}</span> z <span className="text-[#0f172a]">{totalCount}</span>
           </div>

           <div className="flex items-center space-x-2">
              <PaginationButton onClick={() => setCurrentPage(1)} disabled={currentPage === 1} icon={<ChevronFirst size={18}/>} />
              <PaginationButton onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} icon={<ChevronLeft size={18}/>} />
              <div className="flex items-center space-x-1 px-2">
                 {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                   let pageNum;
                   if (totalPages <= 5) pageNum = i + 1;
                   else if (currentPage <= 3) pageNum = i + 1;
                   else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                   else pageNum = currentPage - 2 + i;
                   return (
                     <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-10 h-10 rounded-xl font-black text-[10px] transition-all border-2 ${currentPage === pageNum ? 'bg-[#22c55e] text-white border-[#22c55e] shadow-lg scale-110' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-[#22c55e] hover:text-[#22c55e]'}`}>{pageNum}</button>
                   );
                 })}
              </div>
              <PaginationButton onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || totalPages === 0} icon={<ChevronRight size={18}/>} />
              <PaginationButton onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0} icon={<ChevronLast size={18}/>} />
           </div>
           <div className="flex items-center space-x-3 text-slate-300">
              <span className="text-[10px] font-black uppercase tracking-widest italic">Strona {currentPage} / {totalPages || 1}</span>
           </div>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[6000] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-[#0f172a]/95 backdrop-blur-xl" onClick={() => setIsAddModalOpen(false)}></div>
           <form onSubmit={handleAddTool} className="relative w-full max-w-4xl bg-white rounded-t-[3rem] sm:rounded-[4rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500 flex flex-col max-h-[95vh]">
              <div className="bg-[#0f172a] p-10 text-white flex justify-between items-center shrink-0 border-b-8 border-[#22c55e]">
                 <div className="flex items-center space-x-8">
                   <div className="w-20 h-20 bg-[#22c55e] rounded-[2rem] flex items-center justify-center shadow-xl rotate-3"><Plus size={40}/></div>
                   <div>
                     <h3 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Dodaj Zasób</h3>
                     <p className="text-[#22c55e] text-[10px] font-black uppercase tracking-[0.5em] mt-3">Rejestracja Nowego Narzędzia</p>
                   </div>
                 </div>
                 <button type="button" onClick={() => setIsAddModalOpen(false)} className="p-6 bg-white/10 rounded-full hover:bg-white/20 transition-all border border-white/10"><X size={32}/></button>
              </div>
              <div className="flex-1 p-10 space-y-10 overflow-y-auto no-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6 italic">Nazwa Urządzenia</label><input required type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="np. Klucz Dynamometryczny Beta" className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] font-black uppercase outline-none focus:border-[#22c55e] transition-all" /></div>
                    <div className="space-y-4"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6 italic">Numer Seryjny (S/N)</label><input required type="text" value={newSN} onChange={e => setNewSN(e.target.value)} placeholder="np. S/N 123456789" className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] font-black uppercase outline-none focus:border-[#22c55e] transition-all" /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6 italic">Lokalizacja Bazowa</label>
                      <select value={newBranch} onChange={e => setNewBranch(e.target.value)} className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] font-black uppercase outline-none focus:border-[#22c55e] appearance-none cursor-pointer">
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>)}
                      </select>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6 italic">Kategoria</label>
                      <select value={newCat} onChange={e => setNewCat(e.target.value)} className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] font-black uppercase outline-none focus:border-[#22c55e] appearance-none cursor-pointer">
                        <option value="NARZĘDZIA RĘCZNE">NARZĘDZIA RĘCZNE</option>
                        <option value="ELEKTRONARZĘDZIA">ELEKTRONARZĘDZIA</option>
                        <option value="POMIAROWE">POMIAROWE</option>
                        <option value="SPECJALISTYCZNE">SPECJALISTYCZNE</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6 italic">Zdjęcie Poglądowe</label>
                    <label className="w-full h-48 bg-slate-50 border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center cursor-pointer hover:border-[#22c55e] transition-all relative overflow-hidden group">
                      {photoPreview ? <img src={photoPreview} className="w-full h-full object-cover" alt="Preview" /> : <><Camera size={40} className="text-slate-200 group-hover:scale-110 transition-transform"/><p className="text-[10px] font-black text-slate-300 uppercase mt-4 tracking-widest italic">Kliknij aby wgrać zdjęcie</p></>}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setNewPhoto(file); setPhotoPreview(URL.createObjectURL(file)); } }} />
                    </label>
                  </div>
                  <button type="submit" disabled={isSubmitting} className="w-full py-8 bg-[#22c55e] text-white rounded-[3rem] font-black uppercase tracking-widest shadow-2xl hover:bg-[#1eb354] transition-all border-b-8 border-green-800 flex items-center justify-center space-x-6 active:scale-95 disabled:opacity-50">
                    {isSubmitting ? <Loader className="animate-spin" size={28}/> : <Save size={28}/>}<span>Zarejestruj Narzędzie</span>
                  </button>
              </div>
           </form>
        </div>
      )}

      {selectedTool && (
        <div className="fixed inset-0 z-[5000] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#0f172a]/95 backdrop-blur-3xl" onClick={() => setSelectedToolId(null)}></div>
          <div className="relative w-full max-w-5xl bg-white rounded-t-[3rem] sm:rounded-[4rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500 flex flex-col max-h-[95vh]">
            <div className="bg-[#0f172a] p-12 text-white flex justify-between items-center relative border-b-8 border-[#22c55e] shrink-0">
               <div className="flex items-center space-x-10 relative z-10">
                 <div className="w-32 h-32 bg-[#22c55e] rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl rotate-3 overflow-hidden border-4 border-white/20">
                    <img src={getToolImageUrl(selectedTool.photo_path)} className="w-full h-full object-cover opacity-90" alt="" />
                 </div>
                 <div>
                   <h3 className="text-4xl font-black uppercase tracking-tighter italic leading-none">{selectedTool.name}</h3>
                   <p className="text-[#22c55e] text-[11px] font-black uppercase tracking-[0.5em] mt-4">KARTA ZASOBU SYSTEMOWEGO</p>
                 </div>
               </div>
               <button onClick={() => setSelectedToolId(null)} className="p-6 bg-white/10 rounded-full hover:bg-white/20 transition-all shrink-0 border border-white/10"><X size={32} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar p-12 space-y-12">
               <div className="space-y-8">
                  <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200">
                    <h4 className="text-xl font-black text-[#0f172a] uppercase italic mb-6 flex items-center"><Truck size={20} className="mr-3 text-[#22c55e]"/> Logistyka i Wysyłka</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Oddział Docelowy</label>
                          <select value={transferTargetBranch} onChange={(e) => setTransferTargetBranch(e.target.value)} className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl font-black uppercase text-sm outline-none focus:border-[#22c55e]">
                            {branches.filter(b => Number(b.id) !== Number(selectedTool.branch_id)).map(b => (
                              <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>
                            ))}
                          </select>
                       </div>
                       <div className="space-y-4">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Uwagi do wysyłki</label>
                          <input type="text" value={transferNotes} onChange={(e) => setTransferNotes(e.target.value)} placeholder="np. Proszę o zwrot do piątku" className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl font-black text-sm outline-none focus:border-[#22c55e]"/>
                       </div>
                    </div>
                    <button onClick={handleTransferTool} disabled={isSubmitting} className="mt-8 w-full py-6 bg-[#0f172a] text-[#22c55e] rounded-[2rem] font-black uppercase tracking-widest shadow-xl flex items-center justify-center space-x-4 border-b-8 border-black active:scale-95 disabled:opacity-50">
                      {isSubmitting ? <Loader className="animate-spin" size={20}/> : <Send size={20}/>}<span>WYZWÓL TRANSFER I MAILA</span>
                    </button>
                  </div>
                  <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200">
                    <h4 className="text-xl font-black text-[#0f172a] uppercase italic mb-6 flex items-center"><Info size={20} className="mr-3 text-[#22c55e]"/> Informacje techniczne</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                       <div className="bg-white p-4 rounded-2xl border border-slate-100"><p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Numer Seryjny</p><p className="text-xs font-black text-[#0f172a]">{selectedTool.serial_number}</p></div>
                       <div className="bg-white p-4 rounded-2xl border border-slate-100"><p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Kategoria</p><p className="text-xs font-black text-[#0f172a]">{selectedTool.category}</p></div>
                       <div className="bg-white p-4 rounded-2xl border border-slate-100"><p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Obecna Baza</p><p className="text-xs font-black text-[#22c55e]">{selectedTool.current_branch?.name || 'HUB'}</p></div>
                       <div className="bg-white p-4 rounded-2xl border border-slate-100"><p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Status</p><p className="text-xs font-black text-slate-500">{selectedTool.status}</p></div>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
      <Lightbox isOpen={!!lightboxImage} imageUrl={lightboxImage || ''} onClose={() => setLightboxImage(null)} />
    </div>
  );
};

const ToolRow = ({ tool, effectiveBranchId, user, onSelect, getToolImageUrl, onZoom, onDelete, onAccept }: any) => {
  const isPhysicallyHere = Number(tool.branch_id) === effectiveBranchId;
  const isHeadingToThisBranch = tool.status === 'W DRODZE' && Number(tool.target_branch_id) === effectiveBranchId;
  const isAdmin = user.role === 'ADMINISTRATOR';

  return (
    <tr className={`group transition-all duration-300 ${isHeadingToThisBranch ? 'bg-blue-50/50' : 'bg-white hover:bg-slate-50'}`}>
      <td className={`px-14 py-10 sticky left-0 z-10 shadow-[10px_0_15px_rgba(0,0,0,0.02)] transition-colors ${isHeadingToThisBranch ? 'bg-blue-50 group-hover:bg-blue-100' : 'bg-white group-hover:bg-slate-50'}`}>
        <div className="flex items-center space-x-10">
          <div className="w-24 h-20 bg-slate-100 rounded-[1.5rem] overflow-hidden shadow-2xl border-4 border-white cursor-zoom-in group/img relative shrink-0" onClick={(e) => { e.stopPropagation(); onZoom(getToolImageUrl(tool.photo_path)); }}>
            <img src={getToolImageUrl(tool.photo_path)} className="w-full h-full object-cover group-hover/img:scale-125 transition-transform duration-700" alt="" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-all backdrop-blur-[2px]"><ZoomIn size={24} className="text-white"/></div>
          </div>
          <div className="min-w-[200px]">
            <p className="font-black text-[#0f172a] uppercase text-xl tracking-tighter italic leading-none truncate mb-2">{tool.name}</p>
            <div className="flex items-center space-x-4"><span className="text-[10px] font-mono font-black text-slate-300 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">S/N: {tool.serial_number}</span></div>
          </div>
        </div>
      </td>
      <td className="px-14 py-10">
         <div className={`inline-flex items-center px-6 py-3 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest shadow-sm ${isPhysicallyHere ? 'bg-green-50 text-[#22c55e] border-green-200' : 'bg-slate-50 text-slate-400 border-slate-100'}`}><MapPin size={14} className="mr-3" /> {(tool.current_branch?.name || 'HUB').toUpperCase()}</div>
         {isHeadingToThisBranch && <div className="mt-3 flex items-center text-[8px] font-black text-blue-600 uppercase tracking-widest animate-pulse"><Truck size={12} className="mr-2"/> W drodze do Państwa</div>}
      </td>
      <td className="px-14 py-10">
         <div className={`flex items-center space-x-4 ${tool.status === 'WOLNE' ? 'text-[#22c55e]' : tool.status === 'KONSERWACJA' ? 'text-amber-500' : tool.status === 'W DRODZE' ? 'text-blue-500 font-black' : 'text-slate-400'}`}>
            <span className={`w-3 h-3 rounded-full bg-current ${tool.status !== 'WOLNE' ? 'animate-pulse' : ''}`}></span><span className="text-[11px] font-black uppercase tracking-widest italic">{tool.status}</span>
         </div>
      </td>
      <td className={`px-14 py-10 text-right backdrop-blur-md sticky right-0 z-10 border-l-4 border-slate-50 shadow-[-15px_0_25px_rgba(0,0,0,0.03)] transition-colors ${isHeadingToThisBranch ? 'bg-blue-50/90 group-hover:bg-blue-100/90' : 'bg-white/90 group-hover:bg-slate-50/90'}`}>
         <div className="flex items-center justify-end space-x-4">
            {isAdmin && <button onClick={() => onDelete(tool.id)} className="p-5 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-xl hover:rotate-6"><Trash2 size={22}/></button>}
            <button onClick={() => isHeadingToThisBranch ? onAccept(tool) : onSelect(tool.id)} className={`px-10 py-5 text-white rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all border-b-8 active:scale-95 shrink-0 shadow-2xl flex items-center space-x-3 ${isHeadingToThisBranch ? 'bg-blue-600 border-blue-900 animate-bounce' : isPhysicallyHere ? 'bg-[#0f172a] border-black hover:bg-[#22c55e] hover:border-green-800' : 'bg-rose-500 border-rose-800 hover:bg-rose-600'}`}>
               {isHeadingToThisBranch && <Check size={16}/>}<span>{isHeadingToThisBranch ? 'POTWIERDŹ ODBIÓR' : (isPhysicallyHere ? 'ZARZĄDZAJ' : 'ZAMÓW')}</span>
            </button>
         </div>
      </td>
    </tr>
  );
};

const PaginationButton = ({ onClick, disabled, icon }: any) => (
  <button onClick={onClick} disabled={disabled} className={`p-4 rounded-xl border-2 transition-all active:scale-90 ${disabled ? 'text-slate-200 border-slate-50 cursor-not-allowed opacity-30' : 'bg-white text-[#22c55e] border-[#22c55e]/20 hover:border-[#22c55e] hover:bg-green-50 shadow-sm'}`}>{icon}</button>
);

const StatCard = ({ label, value, color, icon }: any) => {
  const themes: any = { blue: 'text-blue-600 bg-blue-100', rose: 'text-rose-600 bg-rose-100', amber: 'text-amber-600 bg-amber-100', green: 'text-[#22c55e] bg-green-100' };
  return (
    <div className="p-8 rounded-[3rem] bg-white shadow-2xl flex flex-col items-center text-center border-4 border-slate-50 transition-all hover:-translate-y-4 hover:border-[#22c55e]/20 group">
      <div className={`p-6 rounded-[1.8rem] mb-6 shadow-inner group-hover:scale-110 transition-transform ${themes[color]}`}>{icon}</div>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 italic">{label}</p>
      <h3 className="text-5xl font-black italic text-slate-800 tracking-tighter drop-shadow-sm">{value}</h3>
    </div>
  );
};

export default ToolsModule;
