
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Trash2, Search, Plus, Wrench, Truck, AlertTriangle, CheckCircle, Package, 
  MapPin, X, Save, Loader, ZoomIn, History, ArrowRightLeft, 
  Clock, Edit2, PackageCheck, Send, Info, Settings, Building2, 
  ChevronLeft, ChevronRight, MapPinned, Archive, Camera, ArrowRight, ShieldAlert,
  Hammer, BookmarkPlus, ShoppingBag, Eye
} from 'lucide-react';
import { Tool, ToolStatus, User, Branch, ToolLog } from '../types';
import Lightbox from '../components/Lightbox';
import { supabase } from '../supabase';

const PAGE_SIZE = 50;
const SUPABASE_URL = 'https://cuctnnsgvxhomxobpchi.supabase.co';

interface ToolsModuleProps {
  user: User;
  simulationBranchId: string;
  branches: Branch[];
  refreshTrigger: number;
  onRefresh: () => void;
  viewMode: 'BAZA NARZĘDZI' | 'MOJE NARZĘDZIA' | 'GRAFIK';
}

const ToolsModule: React.FC<ToolsModuleProps> = ({ 
  user, simulationBranchId, branches, refreshTrigger, onRefresh, viewMode 
}) => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [manageTab, setManageTab] = useState<'LOGISTYKA' | 'TIMELINE' | 'INFO'>('LOGISTYKA');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toolHistory, setToolHistory] = useState<ToolLog[]>([]);
  
  const [transferBranchId, setTransferBranchId] = useState<string>('2');
  const [notes, setNotes] = useState('');
  const [toolDescription, setToolDescription] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // NOWE NARZĘDZIE STATE
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSerialNumber, setNewSerialNumber] = useState('');
  const [newBranchId, setNewBranchId] = useState('1');
  const [newDescription, setNewDescription] = useState('');

  // LOGIKA RÓL (RBAC) - ABSOLUTNA
  const isAdmin = user.role === 'ADMINISTRATOR';
  const isAdvisor = user.role === 'DORADCA SERWISOWY';
  const isMechanic = user.role === 'MECHANIK';

  const selectedTool = useMemo(() => tools.find(t => t.id === selectedToolId), [tools, selectedToolId]);

  useEffect(() => {
    if (selectedToolId) {
      if (isMechanic) setManageTab('TIMELINE');
      else setManageTab('LOGISTYKA');
    }
  }, [selectedToolId, isMechanic]);

  useEffect(() => {
    if (selectedTool) {
      setToolDescription(selectedTool.description || '');
      setIsDeleting(false);
    }
  }, [selectedTool]);

  const effectiveBranchId = useMemo(() => {
    return simulationBranchId === 'all' ? Number(user.branch_id) : Number(simulationBranchId);
  }, [simulationBranchId, user.branch_id]);

  const fetchTools = useCallback(async (isLoadMore = false) => {
    if (!isLoadMore) {
      setLoading(true);
      setOffset(0);
    } else {
      setLoadingMore(true);
    }
    const currentOffset = isLoadMore ? offset + PAGE_SIZE : 0;

    try {
      let query = supabase
        .from('tools')
        .select('*, current_branch:branches!tools_branch_id_fkey(name), target_branch:branches!tools_target_branch_id_fkey(name)')
        .order('name', { ascending: true })
        .range(currentOffset, currentOffset + PAGE_SIZE - 1);

      if (viewMode === 'MOJE NARZĘDZIA') {
        query = query.eq('branch_id', Number(user.branch_id));
      } else if (simulationBranchId !== 'all' && viewMode !== 'BAZA NARZĘDZI') {
        query = query.eq('branch_id', effectiveBranchId);
      }

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,serial_number.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      if (data) {
        setTools(prev => isLoadMore ? [...prev, ...data] : data);
        if (isLoadMore) setOffset(currentOffset);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [viewMode, simulationBranchId, searchTerm, effectiveBranchId, offset, user.branch_id]);

  useEffect(() => {
    fetchTools();
  }, [refreshTrigger, viewMode, simulationBranchId, searchTerm]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (manageTab === 'TIMELINE' && selectedToolId) {
        const { data } = await supabase
          .from('tool_logs')
          .select('*, from_branch:branches!tool_logs_from_branch_id_fkey(name), to_branch:branches!tool_logs_to_branch_id_fkey(name)')
          .eq('tool_id', selectedToolId)
          .order('created_at', { ascending: false });
        if (data) setToolHistory(data as any);
      }
    };
    fetchHistory();
  }, [manageTab, selectedToolId]);

  const handleAddTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newSerialNumber) return alert("Wypełnij wymagane pola!");
    setIsSubmitting(true);
    try {
      const { data: tool, error } = await supabase.from('tools').insert([{
        name: newName,
        serial_number: newSerialNumber,
        branch_id: Number(newBranchId),
        status: ToolStatus.FREE,
        description: newDescription,
        category: 'NARZĘDZIA WARSZTATOWE'
      }]).select().single();

      if (error) throw error;

      await supabase.from('tool_logs').insert({
        tool_id: tool.id,
        action: 'PRZYJĘCIE',
        to_branch_id: Number(newBranchId),
        notes: 'Wprowadzenie nowego zasobu do systemu przez Administratora',
        operator_id: user.id
      });

      alert("Narzędzie dodane pomyślnie!");
      setIsAddModalOpen(false);
      setNewName('');
      setNewSerialNumber('');
      setNewDescription('');
      onRefresh();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogisticsAction = async (action: 'TRANSFER' | 'RECEIPT' | 'ORDER' | 'MAINTENANCE') => {
    if (!selectedTool || isMechanic) return;
    setIsSubmitting(true);
    try {
      const myBranchId = Number(user.branch_id);

      if (action === 'MAINTENANCE') {
        await supabase.from('tool_logs').insert({ 
          tool_id: selectedTool.id, action: 'KONSERWACJA', notes: `Przegląd techniczny. ${notes}`, operator_id: user.id 
        });
        await supabase.from('tools').update({ status: ToolStatus.MAINTENANCE }).eq('id', selectedTool.id);
      } else if (action === 'TRANSFER') {
        await supabase.from('tool_logs').insert({ 
          tool_id: selectedTool.id, action: 'PRZESUNIĘCIE', from_branch_id: selectedTool.branch_id, to_branch_id: Number(transferBranchId), notes: notes || 'Zlecenie transportu', operator_id: user.id 
        });
        await supabase.from('tools').update({ status: ToolStatus.IN_TRANSIT, target_branch_id: Number(transferBranchId), shipped_at: new Date().toISOString() }).eq('id', selectedTool.id);
      } else if (action === 'ORDER') {
        const isOccupied = selectedTool.status === ToolStatus.OCCUPIED;
        await supabase.from('tool_logs').insert({ 
          tool_id: selectedTool.id, action: isOccupied ? 'REZERWACJA' : 'ZAMÓWIENIE', from_branch_id: selectedTool.branch_id, to_branch_id: myBranchId, notes: notes || 'Potrzeba operacyjna', operator_id: user.id 
        });
      } else {
        const newStatus = myBranchId === 1 ? ToolStatus.FREE : ToolStatus.OCCUPIED;
        await supabase.from('tools').update({ status: newStatus, branch_id: myBranchId, target_branch_id: null, shipped_at: null }).eq('id', selectedTool.id);
        await supabase.from('tool_logs').insert({ tool_id: selectedTool.id, action: 'PRZYJĘCIE', to_branch_id: myBranchId, notes: `Przyjęcie na stan oddziału.`, operator_id: user.id });
      }
      onRefresh();
      setSelectedToolId(null);
      setNotes('');
    } catch (e: any) { alert(e.message); } finally { setIsSubmitting(false); }
  };

  const handleSaveDescription = async () => {
    if (!selectedTool || !isAdmin) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('tools').update({ description: toolDescription }).eq('id', selectedTool.id);
      if (error) throw error;
      alert("Dokumentacja zaktualizowana.");
      onRefresh();
    } catch (e: any) { alert(e.message); } finally { setIsSubmitting(false); }
  };

  const handleDeleteTool = async () => {
    if (!selectedTool || !isAdmin) return;
    if (!isDeleting) {
      setIsDeleting(true);
      return;
    }
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('tools').delete().eq('id', selectedTool.id);
      if (error) throw error;
      alert("Narzędzie usunięte na stałe.");
      setSelectedToolId(null);
      onRefresh();
    } catch (e: any) { alert(e.message); } finally { setIsSubmitting(false); setIsDeleting(false); }
  };

  const getToolImageUrl = (path: string | null | undefined) => {
    if (!path) return `${SUPABASE_URL}/storage/v1/object/public/tool-photos/placeholder.jpg`;
    if (path.startsWith('http')) return path;
    return `${SUPABASE_URL}/storage/v1/object/public/tool-photos/${path}`;
  };

  return (
    <div className="p-4 sm:p-8 lg:p-14 space-y-8 sm:space-y-12 pb-40 animate-in fade-in duration-700">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
        <StatCard label="TRANSPORT" color="blue" icon={<Truck size={20}/>} value={tools.filter(t => t.status === ToolStatus.IN_TRANSIT).length} />
        <StatCard label="ZAJĘTE" color="rose" icon={<Package size={20}/>} value={tools.filter(t => t.status === ToolStatus.OCCUPIED).length} />
        <StatCard label="SERWIS" color="amber" icon={<AlertTriangle size={20}/>} value={tools.filter(t => t.status === ToolStatus.MAINTENANCE).length} />
        <StatCard label="HUB" color="green" icon={<CheckCircle size={20}/>} value={tools.filter(t => t.status === ToolStatus.FREE).length} />
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6 bg-[#0f172a] p-6 sm:p-10 rounded-[2rem] lg:rounded-[4rem] shadow-2xl border-b-8 border-[#22c55e]">
        <div className="relative z-10">
          <h2 className="text-2xl sm:text-5xl font-black text-white uppercase italic tracking-tighter leading-none mb-2 sm:mb-3">{viewMode}</h2>
          <p className="text-[#22c55e] text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] flex items-center italic">
            <Archive size={12} className="mr-2 sm:mr-3"/> 
            {viewMode === 'BAZA NARZĘDZI' ? 'WIDOK GLOBALNY' : `ODDZIAŁ: ${branches.find(b => Number(b.id) === effectiveBranchId)?.name.toUpperCase()}`}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto z-10">
          <div className="relative group w-full lg:w-[450px]">
             <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
             <input type="text" placeholder="Szukaj zasobu..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 py-4 sm:py-6 bg-slate-800 text-white border border-slate-700 rounded-[1.5rem] sm:rounded-[2.5rem] text-xs sm:text-sm font-black outline-none focus:border-[#22c55e] uppercase transition-all" />
          </div>
          {isAdmin && (
            <button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto px-8 py-4 sm:py-6 bg-[#22c55e] text-white rounded-[1.5rem] sm:rounded-[2.2rem] text-[10px] font-black uppercase tracking-widest shadow-2xl border-b-4 border-green-800 flex items-center justify-center space-x-3 transition-all active:scale-95"><Plus size={18}/><span>Dodaj</span></button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[2rem] lg:rounded-[4rem] shadow-3xl border border-slate-100 overflow-hidden relative min-h-[400px]">
        {loading && !loadingMore && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-20">
             <Loader className="animate-spin text-[#22c55e]" size={40}/>
          </div>
        )}
        
        <div className="hidden lg:block overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] border-b border-slate-100 italic">
                <th className="px-12 py-8">Zasób / Opis</th>
                <th className="px-12 py-8">Lokalizacja</th>
                <th className="px-12 py-8">Status</th>
                <th className="px-12 py-8 text-right">Akcja</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-50">
              {tools.map(tool => (
                <ToolRow key={tool.id} tool={tool} effectiveBranchId={effectiveBranchId} user={user} onSelect={setSelectedToolId} getToolImageUrl={getToolImageUrl} />
              ))}
            </tbody>
          </table>
        </div>

        <div className="lg:hidden p-4 space-y-4">
           {tools.map(tool => (
             <ToolCard key={tool.id} tool={tool} effectiveBranchId={effectiveBranchId} user={user} onSelect={setSelectedToolId} getToolImageUrl={getToolImageUrl} />
           ))}
        </div>
      </div>

      {/* MODAL DODAWANIA (TYLKO ADMIN) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[6000] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#0f172a]/95 backdrop-blur-3xl" onClick={() => setIsAddModalOpen(false)}></div>
          <div className="relative w-full max-w-2xl bg-white rounded-t-[2rem] sm:rounded-[4rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500">
             <div className="bg-[#0f172a] p-8 sm:p-12 text-white flex justify-between items-center border-b-8 border-[#22c55e]">
                <div className="flex items-center space-x-6">
                  <div className="w-16 h-16 bg-[#22c55e] rounded-2xl flex items-center justify-center shadow-xl rotate-3"><Plus size={28}/></div>
                  <div>
                    <h3 className="text-xl sm:text-3xl font-black uppercase italic italic leading-none">Dodaj Narzędzie</h3>
                    <p className="text-[#22c55e] text-[9px] font-black uppercase tracking-widest mt-2">Nowy Zasób Systemowy</p>
                  </div>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="p-3 bg-white/10 rounded-full"><X size={24}/></button>
             </div>
             <form onSubmit={handleAddTool} className="p-8 sm:p-12 space-y-6 sm:space-y-10">
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nazwa Narzędzia</label>
                   <input required type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="np. KLUCZ DYNAMOMETRYCZNY BETA" className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] font-black uppercase outline-none focus:border-[#22c55e]" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nr Seryjny</label>
                      <input required type="text" value={newSerialNumber} onChange={e => setNewSerialNumber(e.target.value)} placeholder="S/N" className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] font-black uppercase outline-none focus:border-[#22c55e]" />
                   </div>
                   <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Oddział</label>
                      <select value={newBranchId} onChange={e => setNewBranchId(e.target.value)} className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] font-black uppercase outline-none appearance-none cursor-pointer">
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>)}
                      </select>
                   </div>
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Instrukcja / Opis</label>
                   <textarea rows={3} value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Przeznaczenie narzędzia..." className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] font-black uppercase outline-none focus:border-[#22c55e]"></textarea>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full py-6 sm:py-8 bg-[#22c55e] text-white rounded-[2rem] sm:rounded-[3rem] font-black uppercase tracking-widest shadow-2xl border-b-8 border-green-800 flex items-center justify-center space-x-4 active:scale-95 transition-all">
                  {isSubmitting ? <Loader className="animate-spin" size={24}/> : <Save size={24}/>}
                  <span>Zapisz w Bazie</span>
                </button>
             </form>
          </div>
        </div>
      )}

      {selectedTool && (
        <div className="fixed inset-0 z-[5000] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#0f172a]/95 backdrop-blur-3xl" onClick={() => setSelectedToolId(null)}></div>
          <div className="relative w-full max-w-5xl bg-white rounded-t-[2.5rem] sm:rounded-[4rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500 flex flex-col max-h-[95vh] sm:max-h-[92vh]">
            <div className="bg-[#0f172a] p-6 sm:p-12 text-white flex justify-between items-center relative border-b-8 border-[#22c55e] shrink-0">
               <div className="flex items-center space-x-4 sm:space-x-10 relative z-10">
                 <div className="w-16 h-16 sm:w-32 sm:h-32 bg-[#22c55e] rounded-[1.2rem] sm:rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl rotate-3 shrink-0"><Wrench size={28} className="sm:size-[56px]"/></div>
                 <div className="min-w-0">
                   <h3 className="text-lg sm:text-4xl font-black uppercase tracking-tighter italic leading-none truncate">{selectedTool.name}</h3>
                   <p className="text-[#22c55e] text-[8px] sm:text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.5em] mt-2 sm:mt-4">{user.role}: {isMechanic ? 'PODGLĄD' : 'ZARZĄDZANIE'}</p>
                 </div>
               </div>
               <button onClick={() => setSelectedToolId(null)} className="p-3 sm:p-6 bg-white/10 rounded-full hover:bg-white/20 active:scale-90 transition-all shrink-0"><X size={20} className="sm:size-8" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 sm:p-12 space-y-8 sm:space-y-12">
               <div className="flex bg-slate-50 p-1.5 rounded-[1.5rem] sm:rounded-[3rem] border border-slate-100 shadow-inner overflow-x-auto no-scrollbar gap-1 shrink-0">
                 {!isMechanic && <ManageTab active={manageTab === 'LOGISTYKA'} onClick={() => setManageTab('LOGISTYKA')} icon={<ArrowRightLeft size={16} />} label="Logistyka" />}
                 <ManageTab active={manageTab === 'TIMELINE'} onClick={() => setManageTab('TIMELINE')} icon={<History size={16} />} label="Historia" />
                 <ManageTab active={manageTab === 'INFO'} onClick={() => setManageTab('INFO')} icon={<Info size={16} />} label="Dokumentacja" />
               </div>

               <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {manageTab === 'LOGISTYKA' && !isMechanic && (
                    <div className="space-y-8 sm:space-y-12">
                      {selectedTool.status === ToolStatus.IN_TRANSIT && Number(selectedTool.target_branch_id) === Number(user.branch_id) ? (
                         <div className="p-8 sm:p-12 bg-blue-50 border-4 border-dashed border-blue-200 rounded-[2rem] sm:rounded-[4rem] text-center space-y-6 sm:space-y-12">
                            <Truck size={48} className="mx-auto text-blue-500 animate-bounce" />
                            <h4 className="text-xl sm:text-4xl font-black text-blue-900 uppercase italic">Oczekuje na odbiór</h4>
                            <button onClick={() => handleLogisticsAction('RECEIPT')} disabled={isSubmitting} className="w-full py-6 sm:py-10 bg-blue-600 text-white rounded-[1.5rem] sm:rounded-[3.5rem] font-black uppercase shadow-2xl border-b-8 border-blue-900">PRZYJMIJ NA STAN ODDZIAŁU</button>
                         </div>
                      ) : (Number(selectedTool.branch_id) === Number(user.branch_id) || isAdmin) ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                          <div className="space-y-6 sm:space-y-10">
                            <label className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 sm:ml-10 italic">WYŚLIJ DO ODDZIAŁU</label>
                            <select value={transferBranchId} onChange={e => setTransferBranchId(e.target.value)} className="w-full px-6 py-4 sm:px-10 sm:py-7 bg-slate-50 border border-slate-200 rounded-[1.2rem] sm:rounded-[3rem] text-xs sm:text-sm font-black uppercase outline-none focus:border-[#22c55e]">
                                {branches.filter(b => Number(b.id) !== Number(selectedTool.branch_id)).map(b => <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>)}
                            </select>
                            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Uwagi (komu, nr zlecenia)..." className="w-full p-6 sm:p-10 bg-slate-50 border border-slate-200 rounded-[1.5rem] sm:rounded-[3.5rem] text-xs sm:text-sm font-black uppercase outline-none focus:border-[#22c55e]"></textarea>
                            <button onClick={() => handleLogisticsAction('TRANSFER')} disabled={isSubmitting} className="w-full py-6 sm:py-10 bg-[#22c55e] text-white rounded-[1.5rem] sm:rounded-[3.5rem] font-black uppercase shadow-2xl border-b-8 border-green-800 flex items-center justify-center space-x-3"><Send size={20}/> <span>WYŚLIJ W DROGĘ</span></button>
                          </div>
                          <div className="flex flex-col justify-center p-8 sm:p-14 bg-amber-50/50 rounded-[2rem] sm:rounded-[5rem] border-4 border-dashed border-amber-200 text-center space-y-6 sm:space-y-10">
                             <Hammer size={32} className="mx-auto text-amber-500 animate-pulse"/>
                             <h4 className="text-xl sm:text-3xl font-black text-[#0f172a] uppercase italic">SERWIS / PRZEGLĄD</h4>
                             <button onClick={() => handleLogisticsAction('MAINTENANCE')} disabled={isSubmitting} className="w-full py-6 sm:py-10 bg-amber-500 text-white rounded-[1.5rem] sm:rounded-[3.5rem] font-black uppercase border-b-8 border-amber-800">WYŁĄCZ Z EKSPLOATACJI</button>
                          </div>
                        </div>
                      ) : (
                        <div className={`flex flex-col items-center p-8 sm:p-14 rounded-[2rem] sm:rounded-[5rem] border-4 border-dashed text-center space-y-6 sm:space-y-10 ${selectedTool.status === ToolStatus.OCCUPIED ? 'bg-rose-50 border-rose-200' : 'bg-amber-50/50 border-amber-200'}`}>
                            {selectedTool.status === ToolStatus.OCCUPIED ? <BookmarkPlus size={40} className="text-rose-500 animate-pulse"/> : <ShoppingBag size={40} className="text-amber-500"/>}
                            <h4 className="text-xl sm:text-4xl font-black text-[#0f172a] uppercase italic leading-none">{selectedTool.status === ToolStatus.OCCUPIED ? 'REZERWACJA' : 'ZAMÓWIENIE'}</h4>
                            <button onClick={() => handleLogisticsAction('ORDER')} disabled={isSubmitting} className={`w-full py-6 sm:py-10 text-white rounded-[1.5rem] sm:rounded-[3.5rem] font-black uppercase shadow-2xl border-b-8 ${selectedTool.status === ToolStatus.OCCUPIED ? 'bg-rose-500 border-rose-800' : 'bg-amber-500 border-amber-800'}`}>
                               {selectedTool.status === ToolStatus.OCCUPIED ? 'POTWIERDŹ REZERWACJĘ' : 'WYŚLIJ ZAMÓWIENIE'}
                            </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {manageTab === 'TIMELINE' && (
                    <div className="space-y-6 max-h-[400px] sm:max-h-[550px] overflow-y-auto no-scrollbar pr-2 relative pl-10 sm:pl-20 before:absolute before:left-5 sm:before:left-10 before:top-4 before:bottom-4 before:w-1 before:bg-slate-100">
                      {toolHistory.map(log => (
                        <div key={log.id} className="relative bg-white border-2 border-slate-50 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[3rem] shadow-xl border-l-8 border-l-[#22c55e]">
                           <div className="absolute -left-[2.2rem] sm:-left-[3.75rem] top-6 sm:top-8 w-8 h-8 sm:w-12 sm:h-12 bg-white border-4 border-slate-50 rounded-xl flex items-center justify-center text-[#22c55e] shadow-lg"><Clock size={16}/></div>
                           <h4 className="text-sm sm:text-xl font-black uppercase italic mb-2 leading-none">{log.action}</h4>
                           <p className="text-[10px] sm:text-[12px] font-bold text-slate-500 uppercase italic leading-tight">"{log.notes || "Operacja systemowa"}"</p>
                           <p className="mt-3 text-[7px] sm:text-[8px] font-black uppercase text-slate-300 italic">{new Date(log.created_at).toLocaleString('pl-PL')}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {manageTab === 'INFO' && (
                    <div className="space-y-8 sm:space-y-12 pb-10">
                       <div className="space-y-4 sm:space-y-8">
                          <label className="text-[9px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4 sm:ml-10 flex items-center italic">
                            <Info size={14} className="mr-2 text-[#22c55e]"/> PRZEZNACZENIE I INSTRUKCJA
                          </label>
                          {isAdmin ? (
                            <div className="space-y-6">
                              <textarea rows={6} value={toolDescription} onChange={e => setToolDescription(e.target.value)} placeholder="Opisz przeznaczenie narzędzia..." className="w-full p-6 sm:p-10 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] sm:rounded-[3.5rem] text-xs sm:text-sm font-bold uppercase outline-none focus:border-[#22c55e] shadow-inner"></textarea>
                              <button onClick={handleSaveDescription} disabled={isSubmitting} className="w-full sm:w-auto px-10 py-5 bg-[#0f172a] text-[#22c55e] rounded-[1.5rem] sm:rounded-[2.5rem] font-black uppercase text-[10px] tracking-widest shadow-2xl flex items-center justify-center space-x-4 hover:bg-[#22c55e] hover:text-white transition-all border-b-6 border-black">
                                 {isSubmitting ? <Loader className="animate-spin" size={18}/> : <Save size={18}/>}
                                 <span>Zapisz Zmiany Dokumentacji</span>
                              </button>
                            </div>
                          ) : (
                            <div className="p-8 sm:p-12 bg-slate-50 rounded-[1.5rem] sm:rounded-[4rem] border-2 border-slate-100 italic min-h-[120px] shadow-inner flex items-center justify-center text-center">
                               <p className="text-slate-600 font-bold uppercase text-xs sm:text-sm leading-relaxed">
                                  {selectedTool.description || "Brak instrukcji przeznaczenia w bazie."}
                                </p>
                            </div>
                          )}
                       </div>

                       {isAdmin && (
                         <div className="bg-rose-50 p-6 sm:p-12 rounded-[1.5rem] sm:rounded-[4rem] border-4 border-dashed border-rose-100 flex flex-col md:flex-row items-center justify-between gap-6 mt-10 sm:mt-20">
                            <div className="flex items-center space-x-6">
                               <ShieldAlert size={40} className="text-rose-500 shrink-0"/>
                               <div>
                                 <h4 className="text-xl sm:text-3xl font-black text-rose-900 uppercase italic leading-none">Likwidacja Zasobu</h4>
                                 <p className="text-rose-400 text-[8px] sm:text-[10px] font-black uppercase mt-2 italic">Opcja dostępna tylko dla Administratora</p>
                               </div>
                            </div>
                            <button onClick={handleDeleteTool} disabled={isSubmitting} className={`w-full md:w-auto px-10 py-6 rounded-[1.5rem] sm:rounded-[3rem] font-black uppercase text-[10px] sm:text-[12px] tracking-[0.2em] shadow-2xl transition-all border-b-8 border-black active:scale-95 flex items-center justify-center space-x-3 ${isDeleting ? 'bg-rose-600 text-white animate-bounce' : 'bg-white text-rose-500 hover:bg-rose-500 hover:text-white'}`}>
                               {isDeleting ? <CheckCircle size={20}/> : <Trash2 size={20}/>}
                               <span>{isDeleting ? 'POTWIERDZAM USUNIĘCIE' : 'USUŃ Z BAZY'}</span>
                            </button>
                         </div>
                       )}
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}

      <Lightbox isOpen={!!lightboxImage} imageUrl={lightboxImage || ''} onClose={() => setLightboxImage(null)} />
    </div>
  );
};

const ToolRow = ({ tool, effectiveBranchId, user, onSelect, getToolImageUrl }: any) => {
  const isAdmin = user.role === 'ADMINISTRATOR';
  const isAdvisor = user.role === 'DORADCA SERWISOWY';
  const isMechanic = user.role === 'MECHANIK';

  const myRealBranchId = Number(user.branch_id);
  const isPhysicallyInMyBranch = Number(tool.branch_id) === myRealBranchId;
  const isHeadingToMe = tool.status === ToolStatus.IN_TRANSIT && Number(tool.target_branch_id) === myRealBranchId;

  const canManageHere = isAdmin || (isAdvisor && isPhysicallyInMyBranch);

  return (
    <tr className="group hover:bg-slate-50/50 transition-all duration-300">
      <td className="px-12 py-8">
        <div className="flex items-center space-x-8">
          <div className="w-20 h-16 bg-slate-100 rounded-[1.2rem] overflow-hidden shadow-inner border border-slate-200">
            <img src={getToolImageUrl(tool.photo_path)} className="w-full h-full object-cover" alt="" />
          </div>
          <div className="max-w-md">
            <p className="font-black text-[#0f172a] uppercase text-base tracking-tighter italic leading-none">{tool.name}</p>
            <p className="text-[8px] font-mono font-black text-slate-300 uppercase tracking-widest mt-1">S/N: {tool.serial_number}</p>
          </div>
        </div>
      </td>
      <td className="px-12 py-8">
         <div className={`inline-flex items-center px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest ${isPhysicallyInMyBranch ? 'bg-green-50 text-[#22c55e] border-green-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
            <MapPin size={12} className="mr-2" /> {(tool.current_branch?.name || 'HUB').toUpperCase()}
         </div>
      </td>
      <td className="px-12 py-8">
         <div className={`flex items-center space-x-3 ${tool.status === ToolStatus.FREE ? 'text-[#22c55e]' : tool.status === ToolStatus.MAINTENANCE ? 'text-amber-500' : 'text-rose-500'}`}>
            <span className={`w-2 h-2 rounded-full bg-current ${tool.status !== ToolStatus.FREE ? 'animate-pulse' : ''}`}></span>
            <span className="text-[10px] font-black uppercase tracking-widest italic">{tool.status}</span>
         </div>
      </td>
      <td className="px-12 py-8 text-right">
         <button onClick={() => onSelect(tool.id)} className={`px-8 py-4 text-white rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all border-b-4 active:scale-95 ${isMechanic ? 'bg-slate-400 border-slate-600' : (isHeadingToMe || canManageHere ? 'bg-[#0f172a] border-black hover:bg-[#22c55e]' : 'bg-rose-500 border-rose-800')}`}>
            {isMechanic ? (
                <span className="flex items-center space-x-2"><Eye size={12}/> <span>SZCZEGÓŁY</span></span>
            ) : (
                isHeadingToMe ? 'ODBIERZ' : (canManageHere ? 'ZARZĄDZAJ' : (tool.status === ToolStatus.OCCUPIED ? 'REZERWACJA' : 'ZAMÓW'))
            )}
         </button>
      </td>
    </tr>
  );
};

const ToolCard = ({ tool, effectiveBranchId, user, onSelect, getToolImageUrl }: any) => {
  const isAdmin = user.role === 'ADMINISTRATOR';
  const isAdvisor = user.role === 'DORADCA SERWISOWY';
  const isMechanic = user.role === 'MECHANIK';
  const myRealBranchId = Number(user.branch_id);
  const isPhysicallyInMyBranch = Number(tool.branch_id) === myRealBranchId;
  const isHeadingToMe = tool.status === ToolStatus.IN_TRANSIT && Number(tool.target_branch_id) === myRealBranchId;
  const canManageHere = isAdmin || (isAdvisor && isPhysicallyInMyBranch);

  return (
    <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-lg flex flex-col space-y-4">
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 bg-slate-50 rounded-xl overflow-hidden shrink-0 border border-slate-100 shadow-inner">
           <img src={getToolImageUrl(tool.photo_path)} className="w-full h-full object-cover" alt="" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-black uppercase italic tracking-tighter text-[#0f172a] truncate">{tool.name}</h4>
          <div className="flex items-center space-x-2 mt-1">
             <div className={`w-2 h-2 rounded-full ${tool.status === ToolStatus.FREE ? 'bg-[#22c55e]' : tool.status === ToolStatus.MAINTENANCE ? 'bg-amber-500' : 'bg-rose-500'}`}></div>
             <p className="text-[8px] font-black uppercase text-slate-400 italic">{tool.status} • {tool.current_branch?.name || 'HUB'}</p>
          </div>
        </div>
      </div>
      <button onClick={() => onSelect(tool.id)} className={`w-full py-4 text-white rounded-[1.2rem] text-[9px] font-black uppercase tracking-widest border-b-4 ${isMechanic ? 'bg-slate-400 border-slate-600' : (isHeadingToMe || canManageHere ? 'bg-[#0f172a] border-black' : 'bg-rose-500 border-rose-800')}`}>
        {isMechanic ? 'SZCZEGÓŁY' : (isHeadingToMe ? 'ODBIERZ' : (canManageHere ? 'ZARZĄDZAJ' : 'ZAMÓW'))}
      </button>
    </div>
  );
};

const StatCard = ({ label, value, color, icon }: any) => {
  const themes: any = { 
    blue: 'text-blue-600 bg-blue-50', 
    rose: 'text-rose-600 bg-rose-50', 
    amber: 'text-amber-600 bg-amber-50', 
    green: 'text-[#22c55e] bg-green-50' 
  };
  return (
    <div className="p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] bg-white shadow-xl flex flex-col items-center text-center relative overflow-hidden group border border-slate-50">
      <div className={`p-3 sm:p-5 rounded-xl sm:rounded-2xl mb-2 sm:mb-4 ${themes[color]} group-hover:scale-110 transition-transform`}>{icon}</div>
      <p className="text-[7px] sm:text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 italic leading-none">{label}</p>
      <h3 className="text-2xl sm:text-5xl font-black italic text-slate-800 tracking-tighter leading-none">{value}</h3>
    </div>
  );
};

const ManageTab = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 sm:px-8 sm:py-6 rounded-[1.2rem] sm:rounded-[2.5rem] text-[10px] font-black uppercase tracking-widest transition-all italic shrink-0 ${active ? 'bg-[#0f172a] text-[#22c55e] shadow-xl' : 'text-slate-400'}`}>
    {icon}<span className="hidden sm:inline">{label}</span>
  </button>
);

export default ToolsModule;
