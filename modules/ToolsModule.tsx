
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Trash2, Search, Plus, Wrench, Truck, AlertTriangle, CheckCircle, Package, 
  MapPin, X, Save, Loader, ZoomIn, History, ArrowRightLeft, 
  Clock, Edit2, PackageCheck, Send, Info, Settings, Building2, 
  ChevronLeft, ChevronRight, MapPinned, Archive, Camera, ArrowRight, ShieldAlert,
  Hammer, BookmarkPlus, ShoppingBag, Eye, UploadCloud, Calendar, MessageSquarePlus, Mail, FileText, Database, Copy,
  Tag, Filter
} from 'lucide-react';
import { Tool, ToolStatus, User, Branch, ToolLog } from '../types';
import Lightbox from '../components/Lightbox';
import { supabase } from '../supabase';

const PAGE_SIZE = 50;
const SUPABASE_URL = 'https://cuctnnsgvxhomxobpchi.supabase.co';

const BRANDS = {
  JD: 'JOHN DEERE',
  CLAAS: 'CLAAS',
  GENERAL: 'NARZĘDZIA OGÓLNE'
} as const;

type BrandCategory = 'ALL' | typeof BRANDS.JD | typeof BRANDS.CLAAS | typeof BRANDS.GENERAL;

interface ToolsModuleProps {
  user: User;
  simulationBranchId: string;
  branches: Branch[];
  refreshTrigger: number;
  onRefresh: () => void;
  viewMode: 'BAZA NARZĘDZI' | 'MOJE NARZĘDZIA' | 'GRAFIK';
  targetToolId?: string | null;
  onTargetToolClear?: () => void;
  preselectedTargetBranchId?: string | null;
  onPreselectedBranchClear?: () => void;
}

const ToolsModule: React.FC<ToolsModuleProps> = ({ 
  user, simulationBranchId, branches, refreshTrigger, onRefresh, viewMode, targetToolId, onTargetToolClear, preselectedTargetBranchId, onPreselectedBranchClear
}) => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<BrandCategory>('ALL');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const [globalStats, setGlobalStats] = useState({ inTransit: 0, occupied: 0, maintenance: 0, free: 0 });
  
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [manageTab, setManageTab] = useState<'LOGISTYKA' | 'TIMELINE' | 'INFO' | 'ZAMÓWIENIE'>('LOGISTYKA');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toolHistory, setToolHistory] = useState<ToolLog[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const [transferBranchId, setTransferBranchId] = useState<string>('1');
  const [notes, setNotes] = useState('');
  const [resStartDate, setResStartDate] = useState('');
  const [resEndDate, setResEndDate] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSerialNumber, setNewSerialNumber] = useState('');
  const [newBranchId, setNewBranchId] = useState('1');
  const [newCategory, setNewCategory] = useState<string>(BRANDS.JD);
  const [newDescription, setNewDescription] = useState('');
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [newPhotoPreview, setNewPhotoPreview] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [editName, setEditName] = useState('');
  const [editSerialNumber, setEditSerialNumber] = useState('');
  const [editBranchId, setEditBranchId] = useState('1');
  const [editCategory, setEditCategory] = useState<string>(BRANDS.JD);
  const [editDescription, setEditDescription] = useState('');
  const [editPhoto, setEditPhoto] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);

  const [showRlsFix, setShowRlsFix] = useState(false);

  const isAdmin = user.role === 'ADMINISTRATOR';
  const isServiceAdvisor = user.role === 'DORADCA SERWISOWY';
  const canManageLogistics = isAdmin || isServiceAdvisor;

  const selectedTool = useMemo(() => tools.find(t => t.id === selectedToolId), [tools, selectedToolId]);

  const effectiveBranchId = useMemo(() => {
    if (simulationBranchId === 'all') return Number(user.branch_id);
    return Number(simulationBranchId);
  }, [simulationBranchId, user.branch_id]);

  const isOwner = useMemo(() => {
    if (!selectedTool) return false;
    return Number(selectedTool.branch_id) === effectiveBranchId;
  }, [selectedTool, effectiveBranchId]);

  const isRecipient = useMemo(() => {
    if (!selectedTool) return false;
    return selectedTool.status === ToolStatus.IN_TRANSIT && Number(selectedTool.target_branch_id) === effectiveBranchId;
  }, [selectedTool, effectiveBranchId]);

  // FIX: Reset formularza przy zmianie narzędzia
  useEffect(() => {
    setNotes('');
    setResStartDate('');
    setResEndDate('');
  }, [selectedToolId]);

  const fetchGlobalStats = useCallback(async () => {
    try {
      const { count: transit } = await supabase.from('tools').select('*', { count: 'exact', head: true }).eq('status', ToolStatus.IN_TRANSIT);
      const { count: occupied } = await supabase.from('tools').select('*', { count: 'exact', head: true }).eq('status', ToolStatus.OCCUPIED);
      const { count: maint } = await supabase.from('tools').select('*', { count: 'exact', head: true }).eq('status', ToolStatus.MAINTENANCE);
      const { count: free } = await supabase.from('tools').select('*', { count: 'exact', head: true }).eq('status', ToolStatus.FREE);
      
      setGlobalStats({
        inTransit: transit || 0,
        occupied: occupied || 0,
        maintenance: maint || 0,
        free: free || 0
      });
    } catch (e) {
      console.error("Stats fetch error:", e);
    }
  }, []);

  useEffect(() => {
    if (targetToolId) {
      setSelectedToolId(targetToolId);
      if (onTargetToolClear) onTargetToolClear();
    }
  }, [targetToolId, onTargetToolClear]);

  useEffect(() => {
    if (selectedTool && preselectedTargetBranchId) {
      setTransferBranchId(preselectedTargetBranchId);
      if (onPreselectedBranchClear) onPreselectedBranchClear();
    } else if (selectedTool) {
      const firstOther = branches.find(b => Number(b.id) !== Number(selectedTool.branch_id));
      if (firstOther) setTransferBranchId(firstOther.id);
    }
  }, [selectedTool, preselectedTargetBranchId, branches, onPreselectedBranchClear]);

  useEffect(() => {
    if (selectedToolId) {
      if ((isOwner || isRecipient) && canManageLogistics) {
        setManageTab('LOGISTYKA');
      } else {
        setManageTab('INFO');
      }
    }
  }, [selectedToolId, isOwner, isRecipient, canManageLogistics]);

  const getToolImageUrl = (path: string | null | undefined) => {
    if (!path) return `${SUPABASE_URL}/storage/v1/object/public/tool-photos/placeholder.jpg`;
    if (path.startsWith('http')) return path;
    return `${SUPABASE_URL}/storage/v1/object/public/tool-photos/${path}`;
  };

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
        query = query.eq('branch_id', effectiveBranchId);
      } 

      if (selectedBrand !== 'ALL') {
        query = query.eq('category', selectedBrand);
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
      
      fetchGlobalStats();
    } catch (e) { console.error(e); } finally { setLoading(false); setLoadingMore(false); }
  }, [viewMode, simulationBranchId, searchTerm, selectedBrand, effectiveBranchId, offset, fetchGlobalStats]);

  useEffect(() => {
    fetchTools();
  }, [refreshTrigger, viewMode, simulationBranchId, searchTerm, selectedBrand, effectiveBranchId]);

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

  const createLog = async (data: any) => {
    const { error } = await supabase.from('tool_logs').insert(data);
    if (error) {
      console.error("SUPABASE LOG ERROR:", error);
      if (error.code === '42501') {
        setShowRlsFix(true);
      }
      return false;
    }
    return true;
  };

  const handleDeleteTool = async (id: string) => {
    try {
      const { error } = await supabase.from('tools').delete().eq('id', id);
      if (error) throw error;
      setConfirmDeleteId(null);
      onRefresh();
    } catch (e: any) { alert(e.message); }
  };

  const handleLogisticsAction = async (action: 'TRANSFER' | 'RECEIPT' | 'ORDER' | 'MAINTENANCE' | 'RESERVE') => {
    if (!selectedTool || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const targetId = effectiveBranchId;

      if (action === 'RESERVE') {
        if (!resStartDate || !resEndDate) throw new Error("Wybierz zakres dat!");
        await supabase.from('tool_reservations').insert({
           tool_id: selectedTool.id,
           branch_id: targetId,
           start_date: resStartDate,
           end_date: resEndDate,
           notes: notes || 'Rezerwacja terminowa',
           operator_id: user.id
        });
        await createLog({
          tool_id: selectedTool.id,
          action: 'REZERWACJA',
          from_branch_id: selectedTool.branch_id,
          to_branch_id: targetId,
          notes: `Rezerwacja od ${resStartDate} do ${resEndDate}. ${notes}`,
          operator_id: user.id
        });
        await supabase.from('tools').update({ status: ToolStatus.RESERVED }).eq('id', selectedTool.id);
        alert("Rezerwacja zapisana.");
      } 
      else if (action === 'MAINTENANCE') {
        await createLog({ tool_id: selectedTool.id, action: 'KONSERWACJA', notes: `Przegląd/Serwis: ${notes}`, operator_id: user.id });
        await supabase.from('tools').update({ status: ToolStatus.MAINTENANCE }).eq('id', selectedTool.id);
        alert("Narzędzie przekazane do konserwacji.");
      } 
      else if (action === 'TRANSFER') {
        // UPEWNIAMY SIĘ ŻE LECI TYLKO LOG PRZESUNIĘCIA
        await createLog({ 
          tool_id: selectedTool.id, 
          action: 'PRZESUNIĘCIE', 
          from_branch_id: selectedTool.branch_id, 
          to_branch_id: Number(transferBranchId), 
          notes: notes || 'Transfer logistyczny (akceptacja prośby)', 
          operator_id: user.id 
        });
        await supabase.from('tools').update({ 
          status: ToolStatus.IN_TRANSIT, 
          target_branch_id: Number(transferBranchId), 
          shipped_at: new Date().toISOString() 
        }).eq('id', selectedTool.id);
        alert(`Narzędzie wysłane!`);
      } 
      else if (action === 'RECEIPT') {
        const myLoc = Number(simulationBranchId === 'all' ? user.branch_id : simulationBranchId);
        const newStatus = myLoc === 1 ? ToolStatus.FREE : ToolStatus.OCCUPIED;
        await supabase.from('tools').update({ status: newStatus, branch_id: myLoc, target_branch_id: null, shipped_at: null }).eq('id', selectedTool.id);
        await createLog({ tool_id: selectedTool.id, action: 'PRZYJĘCIE', to_branch_id: myLoc, notes: `Przyjęto fizycznie w bazie oddziału.`, operator_id: user.id });
        alert("Narzędzie przyjęte na stan.");
      } 
      else if (action === 'ORDER') {
        let orderNote = notes || 'Potrzeba oddziału';
        if (resStartDate && resEndDate) {
          await supabase.from('tool_reservations').insert({
             tool_id: selectedTool.id,
             branch_id: targetId,
             start_date: resStartDate,
             end_date: resEndDate,
             notes: `Zapotrzebowanie: ${orderNote}`,
             operator_id: user.id
          });
          orderNote = `[REZERWACJA ${resStartDate} - ${resEndDate}] ${orderNote}`;
        }
        
        await createLog({ 
          tool_id: selectedTool.id, 
          action: 'ZAMÓWIENIE', 
          from_branch_id: selectedTool.branch_id, 
          to_branch_id: targetId, 
          notes: orderNote, 
          operator_id: user.id 
        });
        alert(`Zapytanie zostało wysłane!`);
      }
      
      // FIX: Czyścimy stan pól po udanej akcji
      setNotes('');
      setResStartDate('');
      setResEndDate('');
      onRefresh();
      setSelectedToolId(null);
    } catch (e: any) { 
      alert(e.message); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleAddTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newSerialNumber) return alert("Wypełnij wymagane pola!");
    setIsSubmitting(true);
    try {
      let photo_path = null;
      if (newPhoto) {
        const fileName = `tool_${Date.now()}_${newSerialNumber.replace(/\s+/g, '_')}.jpg`;
        const { error: uploadError } = await supabase.storage.from('tool-photos').upload(fileName, newPhoto);
        if (uploadError) throw uploadError;
        photo_path = fileName;
      }
      const { data: tool, error } = await supabase.from('tools').insert([{
        name: newName,
        serial_number: newSerialNumber,
        branch_id: Number(newBranchId),
        status: ToolStatus.FREE,
        description: newDescription,
        photo_path,
        category: newCategory
      }]).select().single();
      
      if (error) throw error;
      
      await createLog({
        tool_id: tool.id,
        action: 'PRZYJĘCIE',
        to_branch_id: Number(newBranchId),
        notes: `Wprowadzono do zasobów centralnych (${newCategory})`,
        operator_id: user.id
      });
      
      alert(`Dodano narzędzie ${newName} do kategorii ${newCategory}.`);
      setIsAddModalOpen(false);
      setNewName('');
      setNewSerialNumber('');
      setNewDescription('');
      setNewPhoto(null);
      setNewPhotoPreview(null);
      setSelectedBrand('ALL');
      onRefresh();
    } catch (e: any) { alert(e.message); } finally { setIsSubmitting(false); }
  };

  const handleOpenEdit = (tool: Tool) => {
    setEditingTool(tool);
    setEditName(tool.name);
    setEditSerialNumber(tool.serial_number);
    setEditBranchId(String(tool.branch_id));
    setEditCategory(tool.category || BRANDS.JD);
    setEditDescription(tool.description || '');
    setEditPhoto(null);
    setEditPhotoPreview(getToolImageUrl(tool.photo_path));
    setIsEditModalOpen(true);
  };

  const handleUpdateTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTool || !editName || !editSerialNumber) return;
    setIsSubmitting(true);
    try {
      let photo_path = editingTool.photo_path;
      if (editPhoto) {
        const fileName = `tool_${Date.now()}_${editSerialNumber.replace(/\s+/g, '_')}.jpg`;
        const { error: uploadError } = await supabase.storage.from('tool-photos').upload(fileName, editPhoto);
        if (uploadError) throw uploadError;
        photo_path = fileName;
      }

      const { error } = await supabase
        .from('tools')
        .update({
          name: editName,
          serial_number: editSerialNumber,
          branch_id: Number(editBranchId),
          description: editDescription,
          category: editCategory,
          photo_path
        })
        .eq('id', editingTool.id);

      if (error) throw error;

      await createLog({
        tool_id: editingTool.id,
        action: 'PRZYJĘCIE',
        notes: `Aktualizacja danych technicznych/wizualnych (${editCategory}). Operator: ${user.email}`,
        operator_id: user.id
      });

      alert("Dane narzędzia zaktualizowane.");
      setIsEditModalOpen(false);
      onRefresh();
    } catch (e: any) { alert(e.message); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="p-4 sm:p-8 lg:p-14 space-y-8 sm:space-y-12 pb-40 animate-in fade-in duration-700">
      
      {showRlsFix && isAdmin && (
        <div className="bg-rose-600 p-8 sm:p-14 rounded-[2.5rem] sm:rounded-[4rem] shadow-2xl border-b-8 border-rose-900 text-white animate-in slide-in-from-top-12 duration-700 relative overflow-hidden">
           <div className="absolute top-0 right-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
              <Database size={300} />
           </div>
           <div className="relative z-10 space-y-8">
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center animate-pulse">
                   <ShieldAlert size={40} />
                </div>
                <h3 className="text-2xl sm:text-4xl font-black uppercase italic leading-none tracking-tight">Wykryto Błąd Uprawnień (RLS 42501)</h3>
              </div>
              <p className="text-sm sm:text-lg font-bold opacity-90 max-w-4xl leading-relaxed">
                Baza danych blokuje logi. Skopiuj skrypt z panelu pomocy i uruchom w Supabase SQL Editor.
              </p>
              <button onClick={() => setShowRlsFix(false)} className="px-10 py-5 bg-white text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Rozumiem</button>
           </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
        <StatCard label="W TRANSPORCIE" color="blue" icon={<Truck size={20}/>} value={globalStats.inTransit} />
        <StatCard label="WYDANE" color="rose" icon={<Package size={20}/>} value={globalStats.occupied} />
        <StatCard label="W SERWISIE" color="amber" icon={<AlertTriangle size={20}/>} value={globalStats.maintenance} />
        <StatCard label="DOSTĘPNE" color="green" icon={<CheckCircle size={20}/>} value={globalStats.free} />
      </div>

      <div className="flex bg-slate-100 p-2 rounded-[2rem] sm:rounded-[3rem] shadow-inner overflow-x-auto no-scrollbar gap-2">
         <BrandTab active={selectedBrand === 'ALL'} onClick={() => setSelectedBrand('ALL')} icon={<Filter size={16}/>} label="WSZYSTKIE" color="bg-slate-800" />
         <BrandTab active={selectedBrand === BRANDS.JD} onClick={() => setSelectedBrand(BRANDS.JD)} icon={<div className="w-3 h-3 bg-yellow-400 rounded-full"/>} label="JOHN DEERE" color="bg-green-700" />
         <BrandTab active={selectedBrand === BRANDS.CLAAS} onClick={() => setSelectedBrand(BRANDS.CLAAS)} icon={<div className="w-3 h-3 bg-white rounded-full"/>} label="CLAAS" color="bg-red-600" />
         <BrandTab active={selectedBrand === BRANDS.GENERAL} onClick={() => setSelectedBrand(BRANDS.GENERAL)} icon={<Hammer size={16}/>} label="OGÓLNE" color="bg-slate-600" />
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-6 bg-[#0f172a] p-6 sm:p-10 rounded-[2rem] lg:rounded-[4rem] shadow-2xl border-b-8 border-[#22c55e]">
        <div className="relative z-10">
          <h2 className="text-2xl sm:text-5xl font-black text-white uppercase italic tracking-tighter leading-none mb-2 sm:mb-3">{viewMode}</h2>
          <div className="flex items-center mt-2 sm:mt-4">
             <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#22c55e]/10 rounded-xl flex items-center justify-center text-[#22c55e] mr-4 shadow-inner">
                <MapPinned size={16}/>
             </div>
             <p className="text-[#22c55e] text-[9px] sm:text-[11px] font-black uppercase tracking-[0.3em] sm:tracking-[0.5em] italic">
               {selectedBrand !== 'ALL' ? `KATEGORIA: ${selectedBrand}` : viewMode === 'BAZA NARZĘDZI' ? 'WSZYSTKIE ODDZIAŁY' : `TWOJA LOKALIZACJA: ${branches.find(b => String(b.id) === String(effectiveBranchId))?.name.toUpperCase()}`}
             </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto z-10">
          <div className="relative group w-full lg:w-[450px]">
             <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
             <input type="text" placeholder="Szukaj zasobu..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 py-4 sm:py-6 bg-slate-800 text-white border border-slate-700 rounded-[1.5rem] sm:rounded-[2.5rem] text-xs sm:text-sm font-black outline-none focus:border-[#22c55e] uppercase transition-all" />
          </div>
          {isAdmin && (
            <button onClick={() => setIsAddModalOpen(true)} className="w-full sm:w-auto px-8 py-4 sm:py-6 bg-[#22c55e] text-white rounded-[1.5rem] sm:rounded-[2.2rem] text-[10px] font-black uppercase tracking-widest shadow-2xl border-b-4 border-green-800 flex items-center justify-center space-x-3 transition-all active:scale-95"><Plus size={18}/><span>Dodaj Narzędzie</span></button>
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
                <th className="px-12 py-8 w-2/5">Zasób / Specyfikacja</th>
                <th className="px-12 py-8">Lokalizacja</th>
                <th className="px-12 py-8">Status</th>
                <th className="px-12 py-8 text-right">Akcja Systemowa</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-50">
              {tools.length === 0 && !loading ? (
                <tr>
                   <td colSpan={4} className="px-12 py-32 text-center">
                      <Package size={64} className="mx-auto text-slate-100 mb-6" />
                      <p className="text-slate-300 font-black uppercase tracking-widest text-xs italic">Brak narzędzi w tej kategorii</p>
                   </td>
                </tr>
              ) : tools.map(tool => (
                <ToolRow 
                  key={tool.id} 
                  tool={tool} 
                  effectiveBranchId={effectiveBranchId} 
                  user={user} 
                  canManageLogistics={canManageLogistics}
                  onSelect={setSelectedToolId} 
                  getToolImageUrl={getToolImageUrl} 
                  onZoom={setLightboxImage} 
                  onDelete={(id: string) => setConfirmDeleteId(id)}
                  onEdit={() => handleOpenEdit(tool)}
                  confirmDeleteId={confirmDeleteId}
                  handleDeleteTool={handleDeleteTool}
                  simulationBranchId={simulationBranchId}
                  BRANDS={BRANDS}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="lg:hidden p-4 space-y-4">
           {tools.map(tool => (
             <ToolCard key={tool.id} tool={tool} effectiveBranchId={effectiveBranchId} user={user} canManageLogistics={canManageLogistics} onSelect={setSelectedToolId} onEdit={() => handleOpenEdit(tool)} getToolImageUrl={getToolImageUrl} simulationBranchId={simulationBranchId} BRANDS={BRANDS} />
           ))}
        </div>
      </div>

      {selectedTool && (
        <div className="fixed inset-0 z-[5000] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#0f172a]/95 backdrop-blur-3xl" onClick={() => setSelectedToolId(null)}></div>
          <div className="relative w-full max-w-5xl bg-white rounded-t-[2.5rem] sm:rounded-[4rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500 flex flex-col max-h-[95vh] sm:max-h-[92vh]">
            <div className="bg-[#0f172a] p-6 sm:p-12 text-white flex justify-between items-center relative border-b-8 border-[#22c55e] shrink-0">
               <div className="flex items-center space-x-4 sm:space-x-10 relative z-10">
                 <div className="w-16 h-16 sm:w-32 sm:h-32 bg-[#22c55e] rounded-[1.2rem] sm:rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl rotate-3 shrink-0 overflow-hidden border-4 border-white/10">
                    <img src={getToolImageUrl(selectedTool.photo_path)} className="w-full h-full object-cover opacity-80" alt="" />
                 </div>
                 <div className="min-w-0">
                   <div className="flex items-center space-x-3 mb-2">
                     <span className={`px-3 py-1 rounded-lg text-[7px] font-black uppercase tracking-widest ${selectedTool.category === BRANDS.JD ? 'bg-green-600' : selectedTool.category === BRANDS.CLAAS ? 'bg-red-600' : 'bg-slate-600'}`}>{selectedTool.category}</span>
                   </div>
                   <h3 className="text-lg sm:text-4xl font-black uppercase tracking-tighter italic leading-none truncate">{selectedTool.name}</h3>
                   <div className="flex items-center space-x-4 mt-2 sm:mt-4">
                      <span className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest ${(isOwner || isRecipient) ? 'bg-[#22c55e] text-white' : 'bg-amber-50 text-white'}`}>
                        {(isOwner || isRecipient) ? 'TWÓJ ZASÓB' : 'NARZĘDZIE ODDZIAŁU'}
                      </span>
                   </div>
                 </div>
               </div>
               <button onClick={() => setSelectedToolId(null)} className="p-3 sm:p-6 bg-white/10 rounded-full hover:bg-white/20 transition-all shrink-0"><X size={20} className="sm:size-8" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 sm:p-12 space-y-8 sm:space-y-12">
               <div className="flex bg-slate-50 p-1.5 rounded-[1.5rem] sm:rounded-[3rem] border border-slate-100 shadow-inner overflow-x-auto no-scrollbar gap-1 shrink-0">
                 {canManageLogistics && (isOwner || isRecipient) && (
                   <ManageTab active={manageTab === 'LOGISTYKA'} onClick={() => setManageTab('LOGISTYKA')} icon={<ArrowRightLeft size={16} />} label="Wysyłka / Serwis / Odbiór" />
                 )}
                 {canManageLogistics && (!isOwner && !isRecipient) && (
                   <ManageTab active={manageTab === 'ZAMÓWIENIE'} onClick={() => setManageTab('ZAMÓWIENIE')} icon={<ShoppingBag size={16} />} label="Zapotrzebowanie" />
                 )}
                 <ManageTab active={manageTab === 'TIMELINE'} onClick={() => setManageTab('TIMELINE')} icon={<History size={16} />} label="Historia" />
                 <ManageTab active={manageTab === 'INFO'} onClick={() => setManageTab('INFO')} icon={<Info size={16} />} label="Specyfikacja" />
               </div>

               <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {manageTab === 'LOGISTYKA' && canManageLogistics && (isOwner || isRecipient) && (
                    <div className="space-y-8">
                       {selectedTool.status === ToolStatus.IN_TRANSIT && Number(selectedTool.target_branch_id) === (simulationBranchId === 'all' ? Number(user.branch_id) : Number(simulationBranchId)) ? (
                         <div className="p-10 bg-blue-50 rounded-[3rem] text-center space-y-6">
                            <Truck size={48} className="mx-auto text-blue-500 animate-bounce" />
                            <h4 className="text-3xl font-black text-blue-900 uppercase italic">PRZESYŁKA CZEKA NA ODBIÓR</h4>
                            <p className="text-blue-600 font-bold uppercase tracking-widest text-xs italic">Narzędzie zostało wysłane do Twojego oddziału.</p>
                            <button onClick={() => handleLogisticsAction('RECEIPT')} className="w-full py-8 bg-blue-600 text-white rounded-[2rem] font-black uppercase shadow-xl border-b-8 border-blue-900">ZATWIERDŹ PRZYJĘCIE NA STAN</button>
                         </div>
                       ) : (
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                            <div className="space-y-6">
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic">WYŚLIJ DO ODDZIAŁU</label>
                               <select value={transferBranchId} onChange={e => setTransferBranchId(e.target.value)} className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] font-black uppercase outline-none focus:border-[#22c55e]">
                                   {branches.filter(b => Number(b.id) !== Number(selectedTool.branch_id)).map(b => <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>)}
                               </select>
                               <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Uwagi dla odbiorcy..." className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] text-xs font-black uppercase outline-none focus:border-[#22c55e]"></textarea>
                               <div className="grid grid-cols-2 gap-4">
                                  <button onClick={() => handleLogisticsAction('TRANSFER')} className="py-6 bg-[#22c55e] text-white rounded-[2rem] font-black uppercase border-b-8 border-green-800 active:scale-95 transition-all"><Send size={20} className="mx-auto mb-2" />WYŚLIJ</button>
                                  <button onClick={() => handleLogisticsAction('MAINTENANCE')} className="py-6 bg-amber-500 text-white rounded-[2rem] font-black uppercase border-b-8 border-amber-800 active:scale-95 transition-all"><Wrench size={20} className="mx-auto mb-2" />SERWIS</button>
                               </div>
                            </div>
                            <div className="p-8 bg-rose-50 rounded-[3rem] space-y-6">
                               <div className="flex items-center space-x-4"><Calendar className="text-rose-500" size={24}/><h4 className="text-xl font-black text-rose-900 uppercase italic">REZERWACJA</h4></div>
                               <div className="grid grid-cols-2 gap-4">
                                  <input type="date" value={resStartDate} onChange={e => setResStartDate(e.target.value)} className="w-full p-4 bg-white border border-rose-100 rounded-xl text-xs font-black uppercase outline-none"/>
                                  <input type="date" value={resEndDate} onChange={e => setResEndDate(e.target.value)} className="w-full p-4 bg-white border border-rose-100 rounded-xl text-xs font-black uppercase outline-none"/>
                                </div>
                                <button onClick={() => handleLogisticsAction('RESERVE')} className="w-full py-6 bg-rose-500 text-white rounded-[2rem] font-black uppercase tracking-widest border-b-6 border-rose-800">REZERWUJ</button>
                            </div>
                         </div>
                       )}
                    </div>
                  )}

                  {manageTab === 'ZAMÓWIENIE' && canManageLogistics && (!isOwner && !isRecipient) && (
                    <div className="p-8 sm:p-12 bg-amber-50 rounded-[3rem] border-2 border-amber-100 space-y-8 animate-in zoom-in duration-300">
                       <div className="flex items-center space-x-6">
                          <div className="p-6 bg-amber-500 text-white rounded-3xl shadow-xl"><ShoppingBag size={32}/></div>
                          <div>
                            <h4 className="text-3xl font-black text-amber-900 uppercase italic">POPROŚ O NARZĘDZIE</h4>
                            <p className="text-amber-600 font-bold uppercase tracking-widest text-xs mt-1 italic">Zasób jest obecnie w oddziale: {(selectedTool.current_branch?.name || '').toUpperCase()}</p>
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                         <div className="space-y-4">
                           <label className="text-[10px] font-black text-amber-700 uppercase tracking-widest ml-6 italic">Treść zapytania</label>
                           <textarea rows={6} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Dlaczego potrzebujesz tego narzędzia? (Pojawi się u mechanika w innym oddziale)" className="w-full p-10 bg-white border-2 border-amber-100 rounded-[3rem] text-sm font-black uppercase outline-none focus:border-amber-500 shadow-inner"></textarea>
                         </div>
                         
                         <div className="p-8 bg-white/50 rounded-[3rem] border-2 border-amber-100 space-y-6">
                            <div className="flex items-center space-x-4">
                               <Calendar className="text-amber-600" size={24}/>
                               <h4 className="text-xl font-black text-amber-900 uppercase italic">PLANOWANY TERMIN</h4>
                            </div>
                            <p className="text-[10px] font-bold text-amber-600 uppercase italic leading-tight px-2">Jeśli wybierzesz daty, narzędzie zostanie zarezerwowane w Twoim grafiku po wysłaniu prośby.</p>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2">
                                  <label className="text-[8px] font-black text-amber-400 uppercase tracking-widest ml-2">DATA OD</label>
                                  <input type="date" value={resStartDate} onChange={e => setResStartDate(e.target.value)} className="w-full p-4 bg-white border border-amber-100 rounded-2xl text-xs font-black uppercase outline-none focus:border-amber-500 shadow-sm"/>
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[8px] font-black text-amber-400 uppercase tracking-widest ml-2">DATA DO</label>
                                  <input type="date" value={resEndDate} onChange={e => setResEndDate(e.target.value)} className="w-full p-4 bg-white border border-amber-100 rounded-2xl text-xs font-black uppercase outline-none focus:border-amber-500 shadow-sm"/>
                               </div>
                            </div>
                         </div>
                       </div>

                       <button 
                        onClick={() => handleLogisticsAction('ORDER')} 
                        disabled={isSubmitting}
                        className="w-full py-10 bg-amber-500 text-white rounded-[3rem] font-black uppercase tracking-widest shadow-2xl border-b-8 border-amber-800 active:scale-95 transition-all flex items-center justify-center space-x-4 disabled:opacity-50"
                       >
                          {isSubmitting ? <Loader className="animate-spin" size={28}/> : <MessageSquarePlus size={28}/>}
                          <span>{isSubmitting ? 'WYSYŁANIE...' : `WYŚLIJ ZAPOTRZEBOWANIE ${resStartDate ? '& REZERWUJ' : ''}`}</span>
                       </button>
                    </div>
                  )}
                  
                  {manageTab === 'TIMELINE' && (
                    <div className="space-y-6 max-h-[400px] overflow-y-auto no-scrollbar pr-2 relative pl-10 sm:pl-20 before:absolute before:left-5 sm:before:left-10 before:top-4 before:bottom-4 before:w-1 before:bg-slate-100">
                      {toolHistory.map(log => (
                        <div key={log.id} className={`relative bg-white border-2 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[3rem] shadow-xl border-l-8 ${log.action === 'ODMOWA' ? 'border-rose-500' : 'border-[#22c55e]'}`}>
                           <div className="absolute -left-[2.2rem] sm:-left-[3.75rem] top-6 sm:top-8 w-8 h-8 sm:w-12 sm:h-12 bg-white border-4 border-slate-50 rounded-xl flex items-center justify-center text-[#22c55e] shadow-lg"><Clock size={16}/></div>
                           <h4 className="text-sm sm:text-xl font-black uppercase italic mb-2 leading-none">{log.action}</h4>
                           <p className="text-[10px] sm:text-[12px] font-bold text-slate-500 uppercase italic leading-tight">{log.notes}</p>
                           <p className="mt-3 text-[8px] font-black uppercase text-slate-300 italic">{new Date(log.created_at).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {manageTab === 'INFO' && (
                    <div className="p-8 sm:p-12 bg-slate-50 rounded-[1.5rem] sm:rounded-[4rem] border-2 border-slate-100 shadow-inner">
                        {!canManageLogistics && (isOwner || isRecipient) && (
                          <div className="mb-8 p-6 bg-[#22c55e]/10 rounded-2xl border border-[#22c55e]/20 flex items-center space-x-4">
                            <Info size={20} className="text-[#22c55e]" />
                            <p className="text-[10px] font-black text-[#22c55e] uppercase italic">Widzisz ten zasób ponieważ jest przypisany do Twojej bazy.</p>
                          </div>
                        )}
                        <div className="prose prose-slate max-w-none">
                          <p className="text-slate-600 font-bold uppercase text-xs sm:text-sm leading-relaxed italic">
                            {selectedTool.description || "Brak szczegółowej specyfikacji."}
                          </p>
                        </div>
                        <div className="mt-8 pt-8 border-t border-slate-200 grid grid-cols-2 gap-6">
                           <div>
                             <p className="text-[9px] font-black text-slate-300 uppercase italic">Ostatnia Lokalizacja</p>
                             <p className="text-xs font-black text-slate-700 uppercase italic mt-1">{selectedTool.current_branch?.name}</p>
                           </div>
                           <div>
                             <p className="text-[9px] font-black text-slate-300 uppercase italic">Numer Seryjny</p>
                             <p className="text-xs font-black text-slate-700 uppercase italic mt-1">{selectedTool.serial_number}</p>
                           </div>
                        </div>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 z-[6000] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#0f172a]/95 backdrop-blur-3xl" onClick={() => setIsAddModalOpen(false)}></div>
          <div className="relative w-full max-w-4xl bg-white rounded-t-[2rem] sm:rounded-[4rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500 flex flex-col max-h-[95vh]">
             <div className="bg-[#0f172a] p-8 sm:p-12 text-white flex justify-between items-center border-b-8 border-[#22c55e] shrink-0">
                <div className="flex items-center space-x-6">
                  <div className="w-16 h-16 bg-[#22c55e] rounded-2xl flex items-center justify-center shadow-xl rotate-3"><Plus size={28}/></div>
                  <div>
                    <h3 className="text-xl sm:text-3xl font-black uppercase italic leading-none">Nowy Zasób</h3>
                  </div>
                </div>
                <button onClick={() => setIsAddModalOpen(false)} className="p-3 bg-white/10 rounded-full"><X size={24}/></button>
             </div>
             <form onSubmit={handleAddTool} className="p-8 sm:p-12 space-y-8 overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Marka / Kategoria</label>
                        <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border rounded-xl font-black uppercase outline-none focus:border-[#22c55e]">
                          <option value={BRANDS.JD}>{BRANDS.JD}</option>
                          <option value={BRANDS.CLAAS}>{BRANDS.CLAAS}</option>
                          <option value={BRANDS.GENERAL}>{BRANDS.GENERAL}</option>
                        </select>
                      </div>
                      <input required type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nazwa Narzędzia" className="w-full px-8 py-5 bg-slate-50 border rounded-[2rem] font-black uppercase outline-none focus:border-[#22c55e]" />
                      <div className="grid grid-cols-2 gap-4">
                         <input required type="text" value={newSerialNumber} onChange={e => setNewSerialNumber(e.target.value)} placeholder="S/N" className="w-full px-6 py-4 bg-slate-50 border rounded-xl font-black uppercase outline-none focus:border-[#22c55e]" />
                         <select value={newBranchId} onChange={e => setNewBranchId(e.target.value)} className="w-full px-6 py-4 bg-slate-50 border rounded-xl font-black uppercase outline-none focus:border-[#22c55e]">
                           {branches.map(b => <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>)}
                         </select>
                      </div>
                   </div>
                   <div className="relative">
                      <label className="relative block w-full h-40 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[2rem] cursor-pointer overflow-hidden group hover:border-[#22c55e] transition-colors">
                        <div className="flex flex-col items-center justify-center w-full h-full">
                           {newPhotoPreview ? <img src={newPhotoPreview} className="w-full h-full object-cover" /> : <Camera size={32} className="text-slate-300" />}
                        </div>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all pointer-events-none">
                           <UploadCloud size={32} className="text-white mb-2" />
                           <span className="text-white text-[8px] font-black uppercase tracking-widest">Wgraj Zdjęcie</span>
                        </div>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                           const file = e.target.files?.[0];
                           if (file) { setNewPhoto(file); setNewPhotoPreview(URL.createObjectURL(file)); }
                        }} />
                      </label>
                   </div>
                </div>
                <textarea rows={3} value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Specyfikacja techniczna..." className="w-full p-8 bg-slate-50 border rounded-[2rem] font-black uppercase outline-none focus:border-[#22c55e]"></textarea>
                <button type="submit" disabled={isSubmitting} className="w-full py-8 bg-[#22c55e] text-white rounded-[3rem] font-black uppercase tracking-widest shadow-2xl border-b-8 border-green-800">
                  {isSubmitting ? <Loader className="animate-spin mx-auto" size={24}/> : "DODAJ DO SYSTEMU"}
                </button>
             </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 z-[6000] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#0f172a]/95 backdrop-blur-3xl" onClick={() => setIsEditModalOpen(false)}></div>
          <div className="relative w-full max-w-4xl bg-white rounded-t-[2rem] sm:rounded-[4rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500 flex flex-col max-h-[95vh]">
             <div className="bg-[#0f172a] p-8 sm:p-12 text-white flex justify-between items-center border-b-8 border-amber-500 shrink-0">
                <div className="flex items-center space-x-6">
                  <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center shadow-xl rotate-3"><Edit2 size={28}/></div>
                  <div>
                    <h3 className="text-xl sm:text-3xl font-black uppercase italic leading-none">Edytuj Zasób</h3>
                  </div>
                </div>
                <button onClick={() => setIsEditModalOpen(false)} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all"><X size={24}/></button>
             </div>
             <form onSubmit={handleUpdateTool} className="p-8 sm:p-12 space-y-8 overflow-y-auto no-scrollbar relative">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Marka</label>
                           <select value={editCategory} onChange={e => setEditCategory(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-black uppercase outline-none focus:border-amber-500">
                             <option value={BRANDS.JD}>{BRANDS.JD}</option>
                             <option value={BRANDS.CLAAS}>{BRANDS.CLAAS}</option>
                             <option value={BRANDS.GENERAL}>{BRANDS.GENERAL}</option>
                           </select>
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Lokalizacja</label>
                            <select value={editBranchId} onChange={e => setEditBranchId(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black uppercase outline-none focus:border-amber-500 shadow-inner">
                              {branches.map(b => <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>)}
                            </select>
                         </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic leading-none">Nazwa Zasobu</label>
                        <input required type="text" value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nazwa Narzędzia" className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] font-black uppercase outline-none focus:border-amber-500 shadow-inner" />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic leading-none">Numer Seryjny</label>
                          <input required type="text" value={editSerialNumber} onChange={e => setEditSerialNumber(e.target.value)} placeholder="S/N" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl font-black uppercase outline-none focus:border-amber-500 shadow-inner" />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 italic leading-none">Dokumentacja Wizualna</label>
                      <label className="relative block w-full h-48 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[2rem] cursor-pointer overflow-hidden group hover:border-amber-500 transition-colors shadow-inner">
                          <div className="flex flex-col items-center justify-center w-full h-full">
                            {editPhotoPreview ? <img src={editPhotoPreview} className="w-full h-full object-cover" /> : <Camera size={32} className="text-slate-300" />}
                          </div>
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all pointer-events-none">
                            <UploadCloud size={32} className="text-white mb-2" />
                            <span className="text-white text-[8px] font-black uppercase tracking-widest">Zmień Zdjęcie</span>
                          </div>
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) { setEditPhoto(file); setEditPhotoPreview(URL.createObjectURL(file)); }
                          }} />
                      </label>
                   </div>
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6 italic leading-none">Specyfikacja Techniczna / Komentarz</label>
                   <textarea rows={4} value={editDescription} onChange={e => setEditDescription(e.target.value)} placeholder="Opisz narzędzie lub dodaj ważne uwagi..." className="w-full p-8 bg-slate-50 border border-slate-200 rounded-[2rem] font-black uppercase outline-none focus:border-amber-500 shadow-inner min-h-[150px] resize-none"></textarea>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full py-8 bg-amber-500 text-white rounded-[3rem] font-black uppercase tracking-widest shadow-2xl border-b-8 border-amber-800 active:scale-95 flex items-center justify-center space-x-4 transition-all">
                  {isSubmitting ? <Loader className="animate-spin" size={24}/> : <Save size={24}/>}
                  <span>ZAPISZ ZMIANY</span>
                </button>
             </form>
          </div>
        </div>
      )}

      <Lightbox isOpen={!!lightboxImage} imageUrl={lightboxImage || ''} onClose={() => setLightboxImage(null)} />
    </div>
  );
};

const ToolRow = ({ tool, effectiveBranchId, user, canManageLogistics, onSelect, getToolImageUrl, onZoom, onDelete, onEdit, confirmDeleteId, handleDeleteTool, simulationBranchId, BRANDS }: any) => {
  const isPhysicallyHere = Number(tool.branch_id) === Number(effectiveBranchId);
  const myLoc = Number(simulationBranchId === 'all' ? user.branch_id : simulationBranchId);
  const isHeadingToThisBranch = tool.status === ToolStatus.IN_TRANSIT && Number(tool.target_branch_id) === myLoc;
  const isHeadingElsewhere = tool.status === ToolStatus.IN_TRANSIT && Number(tool.target_branch_id) !== myLoc;
  const isAdmin = user.role === 'ADMINISTRATOR';
  const isConfirming = confirmDeleteId === tool.id;

  const brandStyles: any = {
    [BRANDS.JD]: 'bg-green-600 text-white',
    [BRANDS.CLAAS]: 'bg-red-600 text-white',
    [BRANDS.GENERAL]: 'bg-slate-600 text-white'
  };

  return (
    <tr className={`group hover:bg-slate-50/50 transition-all duration-300 ${isPhysicallyHere ? 'bg-green-50/20 border-l-8 border-l-[#22c55e]' : ''} ${isHeadingToThisBranch ? 'bg-blue-50/50 ring-4 ring-blue-500/20' : ''}`}>
      <td className="px-12 py-8">
        <div className="flex items-center space-x-8">
          <div className="w-20 h-16 bg-white rounded-[1.2rem] overflow-hidden shadow-xl border border-slate-100 cursor-zoom-in relative group/img" onClick={(e) => { e.stopPropagation(); onZoom(getToolImageUrl(tool.photo_path)); }}>
            <img src={getToolImageUrl(tool.photo_path)} className="w-full h-full object-cover group-hover/img:scale-110 transition-transform" alt="" />
          </div>
          <div className="max-w-md">
            <div className="flex items-center space-x-3 mb-2">
               <span className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-widest ${brandStyles[tool.category] || 'bg-slate-100 text-slate-500'}`}>{tool.category || 'INNE'}</span>
            </div>
            <p className="font-black text-[#0f172a] uppercase text-base tracking-tighter italic leading-none">{tool.name}</p>
            <div className="flex items-center mt-2">
               {(isPhysicallyHere || isHeadingToThisBranch) && <span className="text-[8px] font-black text-[#22c55e] uppercase tracking-widest mr-3 flex items-center bg-white px-2 py-0.5 rounded border border-green-100"><CheckCircle size={10} className="mr-1"/> {isHeadingToThisBranch ? 'TWOJA PRZESYŁKA' : 'TWÓJ ZASÓB'}</span>}
               <p className="text-[8px] font-mono font-black text-slate-300 uppercase tracking-widest">S/N: {tool.serial_number}</p>
            </div>
          </div>
        </div>
      </td>
      <td className="px-12 py-8">
         <div className={`inline-flex items-center px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest ${isPhysicallyHere ? 'bg-white text-[#22c55e] border-[#22c55e]/30' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
            <MapPin size={12} className="mr-2" /> {(tool.current_branch?.name || 'HUB').toUpperCase()}
         </div>
      </td>
      <td className="px-12 py-8">
         <div className={`flex items-center space-x-3 ${tool.status === ToolStatus.FREE ? 'text-[#22c55e]' : tool.status === ToolStatus.MAINTENANCE ? 'text-amber-500' : tool.status === ToolStatus.IN_TRANSIT ? 'text-blue-500 font-black' : tool.status === ToolStatus.RESERVED ? 'text-rose-500 font-black' : 'text-slate-400'}`}>
            <span className={`w-2 h-2 rounded-full bg-current ${tool.status !== ToolStatus.FREE ? 'animate-pulse' : ''}`}></span>
            <span className="text-[10px] font-black uppercase tracking-widest italic">{tool.status}</span>
         </div>
      </td>
      <td className="px-12 py-8 text-right">
         <div className="flex items-center justify-end space-x-3">
            {isAdmin && (
              <>
                <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  className="p-4 bg-amber-50 text-amber-500 rounded-xl hover:bg-amber-500 hover:text-white transition-all shadow-xl"
                  title="Edytuj zasób"
                >
                  <Edit2 size={16}/>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); isConfirming ? handleDeleteTool(tool.id) : onDelete(tool.id); }}
                  className={`p-4 rounded-xl transition-all ${isConfirming ? 'bg-rose-600 text-white px-8' : 'bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white'}`}
                  title="Usuń zasób"
                >
                  {isConfirming ? "TAK" : <Trash2 size={16}/>}
                </button>
              </>
            )}
            
            {isHeadingToThisBranch ? (
              <button 
                onClick={() => onSelect(tool.id)} 
                className={`px-10 py-5 ${canManageLogistics ? 'bg-blue-600 animate-bounce active:scale-95' : 'bg-slate-100 text-slate-400'} text-white rounded-[1.8rem] text-[9px] font-black uppercase tracking-widest border-b-4 ${canManageLogistics ? 'border-blue-900 shadow-xl' : 'border-slate-200'}`}
              >
                 {canManageLogistics ? 'ODBIERZ' : 'SZCZEGÓŁY'}
              </button>
            ) : isHeadingElsewhere ? (
              <button onClick={() => onSelect(tool.id)} className="px-10 py-5 bg-slate-100 text-slate-400 rounded-[1.8rem] text-[9px] font-black uppercase tracking-widest border-b-4 border-slate-200">
                 W DRODZE
              </button>
            ) : isPhysicallyHere ? (
              <button 
                onClick={() => onSelect(tool.id)} 
                className={`px-10 py-5 ${canManageLogistics ? 'bg-[#0f172a] hover:bg-[#22c55e] active:scale-95 border-black shadow-xl' : 'bg-slate-100 text-slate-600 border-slate-200'} text-white rounded-[1.8rem] text-[9px] font-black uppercase tracking-widest border-b-4`}
              >
                 {canManageLogistics ? 'ZARZĄDZAJ' : 'SZCZEGÓŁY'}
              </button>
            ) : (
              <button 
                onClick={() => onSelect(tool.id)} 
                className={`px-10 py-5 ${canManageLogistics ? 'bg-amber-500 hover:bg-amber-600 active:scale-95 border-amber-800 shadow-xl' : 'bg-slate-100 text-slate-400 border-slate-200'} text-white rounded-[1.8rem] text-[9px] font-black uppercase tracking-widest border-b-4`}
              >
                 {canManageLogistics ? 'ZAMÓW' : 'PODGLĄD'}
              </button>
            )}
         </div>
      </td>
    </tr>
  );
};

const ToolCard = ({ tool, effectiveBranchId, user, canManageLogistics, onSelect, onEdit, getToolImageUrl, simulationBranchId, BRANDS }: any) => {
  const isPhysicallyHere = Number(tool.branch_id) === Number(effectiveBranchId);
  const myLoc = Number(simulationBranchId === 'all' ? user.branch_id : simulationBranchId);
  const isHeadingToThisBranch = tool.status === ToolStatus.IN_TRANSIT && Number(tool.target_branch_id) === myLoc;
  const isHeadingElsewhere = tool.status === ToolStatus.IN_TRANSIT && Number(tool.target_branch_id) !== myLoc;
  const isAdmin = user.role === 'ADMINISTRATOR';
  
  const brandStyles: any = {
    [BRANDS.JD]: 'bg-green-600 text-white',
    [BRANDS.CLAAS]: 'bg-red-600 text-white',
    [BRANDS.GENERAL]: 'bg-slate-600 text-white'
  };

  return (
    <div className={`bg-white p-5 sm:p-6 rounded-[2rem] border-2 shadow-xl flex flex-col space-y-5 relative overflow-hidden ${isPhysicallyHere ? 'border-[#22c55e]/40' : 'border-slate-100'}`}>
      {isAdmin && (
         <button 
           onClick={(e) => { e.stopPropagation(); onEdit(); }}
           className="absolute top-4 right-4 p-3 bg-amber-50 text-amber-500 rounded-xl shadow-md hover:bg-amber-500 hover:text-white transition-all z-20 border border-amber-100"
         >
            <Edit2 size={16}/>
         </button>
      )}

      <div className="flex items-start space-x-4 pr-10">
        <div className="w-20 h-20 bg-slate-50 rounded-2xl overflow-hidden shrink-0 border-2 border-white shadow-lg relative">
           <img src={getToolImageUrl(tool.photo_path)} className="w-full h-full object-cover" alt="" />
           <div className={`absolute top-0 left-0 px-2 py-0.5 rounded-br-lg text-[6px] font-black uppercase tracking-widest ${brandStyles[tool.category] || 'bg-slate-100'}`}>
             {tool.category === BRANDS.GENERAL ? 'OGÓLNE' : tool.category === BRANDS.JD ? 'JD' : 'CLAAS'}
           </div>
        </div>
        <div className="min-w-0 flex-1 py-1">
          <h4 className="text-base font-black uppercase italic tracking-tighter text-[#0f172a] break-words leading-[1.1] mb-2">{tool.name}</h4>
          <p className={`text-[8px] font-black uppercase italic flex items-center ${(isPhysicallyHere || isHeadingToThisBranch) ? 'text-[#22c55e]' : 'text-slate-400'}`}>
            {isHeadingToThisBranch ? '● Twoja Przesyłka' : isPhysicallyHere ? '● Twój Oddział' : `○ ${tool.current_branch?.name}`}
          </p>
          <p className="text-[7px] font-mono font-black text-slate-300 uppercase mt-1">S/N: {tool.serial_number}</p>
        </div>
      </div>
      
      <div className="pt-2">
        {isHeadingToThisBranch ? (
          <button onClick={() => onSelect(tool.id)} className={`w-full py-4 ${canManageLogistics ? 'bg-blue-600 animate-pulse border-blue-900' : 'bg-slate-100 text-slate-400 border-slate-200'} text-white rounded-[1.2rem] text-[9px] font-black uppercase tracking-widest border-b-4`}>
            {canManageLogistics ? 'ODBIERZ ZASÓB' : 'SZCZEGÓŁY PRZESYŁKI'}
          </button>
        ) : isHeadingElsewhere ? (
          <button onClick={() => onSelect(tool.id)} className="w-full py-4 bg-slate-100 text-slate-400 rounded-[1.2rem] text-[9px] font-black uppercase tracking-widest border-b-4 border-slate-200">
            W DRODZE
          </button>
        ) : isPhysicallyHere ? (
          <button onClick={() => onSelect(tool.id)} className={`w-full py-4 ${canManageLogistics ? 'bg-[#0f172a] border-black' : 'bg-slate-100 text-slate-600 border-slate-200'} text-white rounded-[1.2rem] text-[9px] font-black uppercase tracking-widest border-b-4`}>
            {canManageLogistics ? 'ZARZĄDZAJ' : 'SZCZEGÓŁY ZASOBU'}
          </button>
        ) : (
          <button onClick={() => onSelect(tool.id)} className={`w-full py-4 ${canManageLogistics ? 'bg-amber-500 border-amber-800' : 'bg-slate-100 text-slate-400 border-slate-200'} text-white rounded-[1.2rem] text-[9px] font-black uppercase tracking-widest border-b-4`}>
            {canManageLogistics ? 'ZAMÓW DO SIEBIE' : 'PODGLĄD'}
          </button>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color, icon }: any) => {
  const themes: any = { blue: 'text-blue-600 bg-blue-50', rose: 'text-rose-600 bg-rose-50', amber: 'text-amber-600 bg-amber-50', green: 'text-[#22c55e] bg-green-50' };
  return (
    <div className="p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] bg-white shadow-xl flex flex-col items-center text-center border border-slate-50">
      <div className={`p-3 sm:p-5 rounded-xl sm:rounded-2xl mb-2 sm:mb-4 ${themes[color]}`}>{icon}</div>
      <p className="text-[7px] sm:text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 italic">{label}</p>
      <h3 className="text-2xl sm:text-5xl font-black italic text-slate-800 tracking-tighter">{value}</h3>
    </div>
  );
};

const ManageTab = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex-1 flex items-center justify-center space-x-3 px-4 py-4 sm:px-10 sm:py-7 rounded-[1.2rem] sm:rounded-[2.5rem] text-[10px] font-black uppercase tracking-widest transition-all italic shrink-0 ${active ? 'bg-[#0f172a] text-[#22c55e] shadow-xl' : 'text-slate-400'}`}>
    {icon}<span className="hidden sm:inline">{label}</span>
  </button>
);

const BrandTab = ({ active, onClick, icon, label, color }: any) => (
  <button 
    onClick={onClick} 
    className={`flex items-center space-x-3 px-8 py-4 rounded-[1.5rem] sm:rounded-[2.5rem] text-[10px] font-black uppercase tracking-widest transition-all italic shrink-0 shadow-sm border-2 ${
      active 
        ? `${color} text-white border-white/20 shadow-xl scale-105` 
        : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
    }`}
  >
    {icon} <span>{label}</span>
  </button>
);

export default ToolsModule;
