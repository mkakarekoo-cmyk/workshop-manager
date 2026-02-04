
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Trash2, Search, Plus, Wrench, Truck, AlertTriangle, CheckCircle, Package, 
  MapPin, X, Save, Loader, ZoomIn, History, ArrowRightLeft, 
  Clock, Edit2, PackageCheck, Send, Info, Settings, Building2, 
  ChevronLeft, ChevronRight, MapPinned, Archive, Camera, ArrowRight, ShieldAlert,
  Hammer, BookmarkPlus, ShoppingBag, Eye, UploadCloud, Calendar, MessageSquarePlus, Mail, FileText
} from 'lucide-react';
import { Tool, ToolStatus, User, Branch, ToolLog } from '../types';
import Lightbox from '../components/Lightbox';
import { supabase } from '../supabase';

const SUPABASE_URL = 'https://cuctnnsgvxhomxobpchi.supabase.co';

interface ToolsModuleProps {
  user: User;
  simulationBranchId: string;
  branches: Branch[];
  allUsers: User[];
  refreshTrigger: number;
  onRefresh: () => void;
  viewMode: 'BAZA NARZĘDZI' | 'MOJE NARZĘDZIA' | 'GRAFIK';
  targetToolId?: string | null;
  onTargetToolClear?: () => void;
}

const ToolsModule: React.FC<ToolsModuleProps> = ({ 
  user, simulationBranchId, branches, allUsers, refreshTrigger, onRefresh, viewMode, targetToolId, onTargetToolClear
}) => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [manageTab, setManageTab] = useState<'LOGISTYKA' | 'TIMELINE' | 'INFO'>('LOGISTYKA');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toolHistory, setToolHistory] = useState<ToolLog[]>([]);
  const [transferBranchId, setTransferBranchId] = useState<string>('1');
  const [notes, setNotes] = useState('');
  
  const selectedTool = useMemo(() => tools.find(t => t.id === selectedToolId), [tools, selectedToolId]);
  const effectiveBranchId = useMemo(() => simulationBranchId === 'all' ? Number(user.branch_id) : Number(simulationBranchId), [simulationBranchId, user.branch_id]);
  const isOwner = useMemo(() => selectedTool && Number(selectedTool.branch_id) === effectiveBranchId, [selectedTool, effectiveBranchId]);

  useEffect(() => {
    if (targetToolId) { setSelectedToolId(targetToolId); if (onTargetToolClear) onTargetToolClear(); }
  }, [targetToolId]);

  const fetchTools = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase.from('tools').select('*, current_branch:branches!tools_branch_id_fkey(name), target_branch:branches!tools_target_branch_id_fkey(name)').order('name');
      if (viewMode === 'MOJE NARZĘDZIA') query = query.eq('branch_id', effectiveBranchId);
      if (searchTerm) query = query.or(`name.ilike.%${searchTerm}%,serial_number.ilike.%${searchTerm}%`);
      const { data } = await query;
      if (data) setTools(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [viewMode, effectiveBranchId, searchTerm]);

  useEffect(() => { fetchTools(); }, [fetchTools, refreshTrigger]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (manageTab === 'TIMELINE' && selectedToolId) {
        const { data } = await supabase.from('tool_logs').select('*, from_branch:branches!tool_logs_from_branch_id_fkey(name), to_branch:branches!tool_logs_to_branch_id_fkey(name)').eq('tool_id', selectedToolId).order('created_at', { ascending: false });
        if (data) setToolHistory(data as any);
      }
    };
    fetchHistory();
  }, [manageTab, selectedToolId]);

  const getRecipientEmails = (branchId: string | number) => {
    const bId = String(branchId);
    
    // 1. Doradcy z bazy użytkowników przypisani do tego oddziału
    const activeAdvisors = allUsers
      .filter(u => u.role === 'DORADCA SERWISOWY' && String(u.branch_id) === bId)
      .map(u => u.email.toLowerCase());

    // 2. Fallback z Twojej listy oddziałów (rozbijamy średniki na listę)
    const branchData = branches.find(b => String(b.id) === bId);
    const fallbackEmails = branchData?.email ? branchData.email.split(/[;,]/).map(e => e.trim().toLowerCase()) : [];

    // 3. Unikalny zestaw adresów
    const allEmails = new Set([...activeAdvisors, ...fallbackEmails]);
    return Array.from(allEmails).join(', ');
  };

  const handleLogisticsAction = async (action: 'TRANSFER' | 'RECEIPT' | 'ORDER') => {
    if (!selectedTool) return;
    setIsSubmitting(true);
    try {
      const myBranchName = branches.find(b => Number(b.id) === effectiveBranchId)?.name || 'Nieznany';

      if (action === 'TRANSFER') {
        const targetId = Number(transferBranchId);
        const recipient = getRecipientEmails(targetId);
        await supabase.from('tool_logs').insert({ tool_id: selectedTool.id, action: 'PRZESUNIĘCIE', from_branch_id: selectedTool.branch_id, to_branch_id: targetId, notes: notes || 'Wysyłka', operator_id: user.id });
        await supabase.from('tools').update({ status: ToolStatus.IN_TRANSIT, target_branch_id: targetId, shipped_at: new Date().toISOString() }).eq('id', selectedTool.id);
        alert(`Wysłano! E-mail powitalny poszedł do: ${recipient}`);
      } 
      else if (action === 'ORDER') {
        const recipient = getRecipientEmails(selectedTool.branch_id);
        const ownerName = branches.find(b => Number(b.id) === Number(selectedTool.branch_id))?.name;
        await supabase.from('tool_logs').insert({ tool_id: selectedTool.id, action: 'ZAMÓWIENIE', from_branch_id: selectedTool.branch_id, to_branch_id: effectiveBranchId, notes: notes || 'Zapotrzebowanie', operator_id: user.id });
        alert(`Zamówienie wysłane do oddziału ${ownerName}. Adresaci powiadomienia: ${recipient}`);
      }
      else if (action === 'RECEIPT') {
        await supabase.from('tools').update({ status: ToolStatus.FREE, branch_id: effectiveBranchId, target_branch_id: null }).eq('id', selectedTool.id);
        await supabase.from('tool_logs').insert({ tool_id: selectedTool.id, action: 'PRZYJĘCIE', to_branch_id: effectiveBranchId, notes: 'Odebrano fizycznie', operator_id: user.id });
        alert("Narzędzie przyjęte na stan.");
      }

      onRefresh();
      setSelectedToolId(null);
      setNotes('');
    } catch (e: any) { alert(e.message); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="p-4 sm:p-10 space-y-10">
      <div className="flex justify-between items-center bg-[#0f172a] p-8 rounded-[3rem] shadow-2xl border-b-8 border-[#22c55e]">
        <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">{viewMode}</h2>
        <div className="relative w-96">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input type="text" placeholder="Szukaj..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-slate-800 text-white rounded-full border border-slate-700 outline-none focus:border-[#22c55e] uppercase text-xs font-black" />
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-xl overflow-hidden border border-slate-100 min-h-[500px] relative">
        {loading && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center"><Loader className="animate-spin text-[#22c55e]" size={40}/></div>}
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 italic">
            <tr>
              <th className="px-10 py-6">Narzędzie</th>
              <th className="px-10 py-6">Lokalizacja</th>
              <th className="px-10 py-6">Status</th>
              <th className="px-10 py-6 text-right">Akcja</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {tools.map(tool => {
              const isHere = Number(tool.branch_id) === effectiveBranchId;
              const isToMe = tool.status === ToolStatus.IN_TRANSIT && Number(tool.target_branch_id) === effectiveBranchId;
              return (
                <tr key={tool.id} className={`hover:bg-slate-50 transition-colors ${isToMe ? 'bg-blue-50' : ''}`}>
                  <td className="px-10 py-6">
                    <p className="font-black text-[#0f172a] uppercase italic">{tool.name}</p>
                    <p className="text-[8px] font-mono text-slate-300">S/N: {tool.serial_number}</p>
                  </td>
                  <td className="px-10 py-6">
                    <span className="text-[10px] font-black uppercase flex items-center"><MapPin size={12} className="mr-2 text-[#22c55e]"/> {tool.current_branch?.name || 'HUB'}</span>
                  </td>
                  <td className="px-10 py-6">
                    <span className={`text-[10px] font-black uppercase italic ${tool.status === ToolStatus.FREE ? 'text-[#22c55e]' : 'text-slate-400'}`}>{tool.status}</span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <button onClick={() => setSelectedToolId(tool.id)} className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest text-white border-b-4 ${isToMe ? 'bg-blue-600 border-blue-900 animate-bounce' : isHere ? 'bg-[#0f172a] border-black' : 'bg-rose-500 border-rose-800'}`}>
                      {isToMe ? 'ODBIERZ' : isHere ? 'ZARZĄDZAJ' : 'ZAMÓW'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedTool && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-[#0f172a]/95 backdrop-blur-3xl" onClick={() => setSelectedToolId(null)}></div>
          <div className="relative w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
             <div className="bg-[#0f172a] p-10 text-white flex justify-between items-center border-b-8 border-[#22c55e]">
                <div className="flex items-center space-x-6">
                  <div className="w-20 h-20 bg-[#22c55e] rounded-3xl flex items-center justify-center rotate-3"><Wrench size={32}/></div>
                  <div>
                    <h3 className="text-2xl font-black uppercase italic">{selectedTool.name}</h3>
                    <p className="text-[#22c55e] text-[10px] font-black tracking-widest mt-1">LOGISTYKA ZASOBU</p>
                  </div>
                </div>
                <button onClick={() => setSelectedToolId(null)} className="p-4 bg-white/10 rounded-full hover:bg-white/20"><X size={24}/></button>
             </div>
             
             <div className="p-10 space-y-10">
                <div className="flex space-x-2 bg-slate-50 p-2 rounded-3xl border border-slate-100 shadow-inner">
                   <button onClick={() => setManageTab('LOGISTYKA')} className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${manageTab === 'LOGISTYKA' ? 'bg-[#0f172a] text-[#22c55e] shadow-xl' : 'text-slate-400'}`}>Logistyka</button>
                   <button onClick={() => setManageTab('TIMELINE')} className={`flex-1 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${manageTab === 'TIMELINE' ? 'bg-[#0f172a] text-[#22c55e] shadow-xl' : 'text-slate-400'}`}>Historia</button>
                </div>

                {manageTab === 'LOGISTYKA' && (
                  <div className="animate-in slide-in-from-bottom-4 duration-500">
                    {selectedTool.status === ToolStatus.IN_TRANSIT && Number(selectedTool.target_branch_id) === effectiveBranchId ? (
                      <button onClick={() => handleLogisticsAction('RECEIPT')} disabled={isSubmitting} className="w-full py-10 bg-blue-600 text-white rounded-[2rem] font-black uppercase text-xl shadow-2xl border-b-8 border-blue-900 flex items-center justify-center space-x-4">
                        {isSubmitting ? <Loader className="animate-spin" /> : <PackageCheck size={32}/>}
                        <span>POTWIERDŹ ODBIÓR</span>
                      </button>
                    ) : isOwner ? (
                      <div className="space-y-6">
                        <select value={transferBranchId} onChange={e => setTransferBranchId(e.target.value)} className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2rem] font-black uppercase text-xs outline-none focus:border-[#22c55e]">
                          {branches.filter(b => Number(b.id) !== Number(selectedTool.branch_id)).map(b => <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>)}
                        </select>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Uwagi do transportu..." className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2rem] font-black uppercase text-xs outline-none focus:border-[#22c55e]" rows={3} />
                        <button onClick={() => handleLogisticsAction('TRANSFER')} disabled={isSubmitting} className="w-full py-6 bg-[#22c55e] text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl border-b-8 border-green-800 flex items-center justify-center space-x-4">
                          {isSubmitting ? <Loader className="animate-spin" /> : <Send size={20}/>}
                          <span>WYŚLIJ DO ODDZIAŁU</span>
                        </button>
                      </div>
                    ) : (
                      <div className="p-8 bg-blue-50 border-2 border-blue-100 rounded-[2rem] text-center space-y-6">
                        <ShoppingBag size={48} className="mx-auto text-blue-500" />
                        <h4 className="text-xl font-black text-blue-900 uppercase italic">ZAMÓW TO NARZĘDZIE</h4>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Uzasadnienie prośby..." className="w-full p-6 bg-white border border-blue-100 rounded-[2rem] font-black uppercase text-xs outline-none focus:border-blue-500" rows={2} />
                        <button onClick={() => handleLogisticsAction('ORDER')} disabled={isSubmitting} className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl border-b-8 border-blue-900 flex items-center justify-center space-x-4">
                           {isSubmitting ? <Loader className="animate-spin" /> : <Mail size={20}/>}
                           <span>WYŚLIJ PROŚBĘ E-MAIL</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {manageTab === 'TIMELINE' && (
                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-4 no-scrollbar">
                    {toolHistory.map(log => (
                      <div key={log.id} className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 flex justify-between items-center animate-in fade-in">
                        <div>
                          <p className="text-[10px] font-black uppercase italic text-[#0f172a]">{log.action}</p>
                          <p className="text-[8px] text-slate-400 font-bold uppercase mt-1">{new Date(log.created_at).toLocaleString()}</p>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 italic max-w-xs text-right">"{log.notes || "-"}"</p>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolsModule;
