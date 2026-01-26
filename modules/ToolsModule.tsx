
import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowRightLeft,
  AlertTriangle,
  ZoomIn,
  CheckCircle2,
  Clock,
  Filter,
  Trash2,
  Calendar,
  X,
  Info,
  Download,
  Upload,
  Edit2,
  MapPin,
  Settings,
  ShieldAlert,
  Wrench
} from 'lucide-react';
import { Tool, ToolStatus, User, Branch } from '../types';
import Lightbox from '../components/Lightbox';

interface ToolsModuleProps {
  user: User;
  simulationBranchId: string;
  branches: Branch[];
  refreshTrigger: number;
}

const INITIAL_MOCK_TOOLS: Tool[] = [
  { id: 'T1', name: 'Wiertarka Hilti TE 70-ATC', category: 'Elektronarzędzia', serial_number: 'HT-9921-X', status: ToolStatus.FREE, branch_id: '1', image_url: 'https://picsum.photos/seed/hilti/600/400' },
  { id: 'T2', name: 'Szlifierka Bosch GWS 18V-10', category: 'Elektronarzędzia', serial_number: 'BS-4420-P', status: ToolStatus.FREE, branch_id: '1', image_url: 'https://picsum.photos/seed/bosch/600/400' },
  { id: 'T3', name: 'Zagęszczarka Wacker Neuson', category: 'Maszyny Budowlane', serial_number: 'WN-0012-G', status: ToolStatus.OCCUPIED, branch_id: '2', image_url: 'https://picsum.photos/seed/wacker/600/400' },
  { id: 'T4', name: 'Młot Makita HM1812', category: 'Elektronarzędzia', serial_number: 'MK-5588-M', status: ToolStatus.MAINTENANCE, branch_id: '3', image_url: 'https://picsum.photos/seed/makita/600/400' },
  { id: 'T5', name: 'Koparka Caterpillar 301.7', category: 'Maszyny Ciężkie', serial_number: 'CAT-1234-A', status: ToolStatus.OCCUPIED, branch_id: '5', image_url: 'https://picsum.photos/seed/cat/600/400' },
  { id: 'T6', name: 'Niwelator Laserowy Topcon', category: 'Pomiary', serial_number: 'TP-7722-B', status: ToolStatus.IN_TRANSIT, branch_id: '4', image_url: 'https://picsum.photos/seed/laser/600/400' },
];

const StatTile = ({ label, count, color, icon }: any) => {
  const colors: any = {
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    rose: 'text-rose-600 bg-rose-50 border-rose-100',
    green: 'text-[#22c55e] bg-green-50 border-green-100',
  };

  return (
    <div className="bg-white p-6 lg:p-8 rounded-[2rem] border border-slate-100 flex items-center justify-between group shadow-sm">
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <h3 className={`text-2xl lg:text-3xl font-black tracking-tighter ${colors[color]?.split(' ')[0]}`}>{count}</h3>
      </div>
      <div className={`p-4 rounded-2xl border transition-transform group-hover:scale-110 ${colors[color]}`}>
        {React.cloneElement(icon, { size: 24 })}
      </div>
    </div>
  );
};

const ToolsModule: React.FC<ToolsModuleProps> = ({ user, simulationBranchId, branches, refreshTrigger }) => {
  const [tools, setTools] = useState<Tool[]>(INITIAL_MOCK_TOOLS);
  const [isLoading, setIsLoading] = useState(false);
  const [subTab, setSubTab] = useState<'ALL' | 'MY' | 'CALENDAR'>('ALL');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [manageToolId, setManageToolId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Handle Refresh Logic
  useEffect(() => {
    if (refreshTrigger > 0) {
      setIsLoading(true);
      setTimeout(() => {
        const refreshedTools = tools.map(t => ({
          ...t,
          status: Math.random() > 0.8 ? ToolStatus.FREE : t.status
        }));
        setTools(refreshedTools);
        setIsLoading(false);
      }, 800);
    }
  }, [refreshTrigger]);

  const filteredTools = useMemo(() => {
    let list = tools;
    if (subTab === 'MY') {
      list = list.filter(t => simulationBranchId === 'all' || String(t.branch_id) === String(simulationBranchId));
    }
    if (searchTerm) {
      list = list.filter(t => 
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        t.serial_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return list;
  }, [tools, subTab, simulationBranchId, searchTerm]);

  const stats = useMemo(() => ({
    inTransit: tools.filter(t => t.status === ToolStatus.IN_TRANSIT).length,
    occupied: tools.filter(t => t.status === ToolStatus.OCCUPIED).length,
    maintenance: tools.filter(t => t.status === ToolStatus.MAINTENANCE).length,
    free: tools.filter(t => t.status === ToolStatus.FREE).length,
  }), [tools]);

  const selectedTool = useMemo(() => tools.find(t => t.id === manageToolId), [tools, manageToolId]);

  return (
    <div className={`flex-1 flex flex-col p-4 lg:p-10 space-y-6 lg:space-y-8 animate-in fade-in duration-700 ${isLoading ? 'opacity-50 pointer-events-none grayscale-[0.2]' : ''}`}>
      {/* Stats Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatTile label="W DRODZE" count={stats.inTransit} color="blue" icon={<ArrowRightLeft />} />
        <StatTile label="ZAJĘTE" count={stats.occupied} color="amber" icon={<Clock />} />
        <StatTile label="KONSERWACJA" count={stats.maintenance} color="rose" icon={<AlertTriangle />} />
        <StatTile label="WOLNE" count={stats.free} color="green" icon={<CheckCircle2 />} />
      </div>

      <div className="flex-1 bg-white rounded-[2rem] lg:rounded-[3rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-[2px]">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-[#22c55e] border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-[#0f172a]">Odświeżanie...</p>
            </div>
          </div>
        )}

        {/* Sub-Navigation Strip */}
        <div className="p-4 lg:p-6 border-b border-slate-50 flex flex-col lg:flex-row justify-between items-center gap-4 bg-slate-50/30">
          <div className="flex bg-slate-100 p-1 rounded-2xl w-full lg:w-auto shadow-inner overflow-x-auto no-scrollbar">
            {['ALL', 'MY', 'CALENDAR'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setSubTab(tab as any)}
                className={`px-6 py-3 rounded-xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all ${subTab === tab ? 'bg-[#0f172a] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {tab === 'ALL' ? 'Wszystkie' : tab === 'MY' ? 'Moje' : 'Grafik'}
              </button>
            ))}
          </div>
          
          <div className="relative w-full lg:w-72">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Filtruj listę..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          {subTab !== 'CALENDAR' ? (
            <div className="flex-1 flex flex-col overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/80 text-slate-400 text-[10px] font-black uppercase tracking-widest sticky top-0 z-10 backdrop-blur-sm">
                  <tr>
                    <th className="px-10 py-5">Podgląd</th>
                    <th className="px-10 py-5">Zasób</th>
                    <th className="px-10 py-5">Lokalizacja</th>
                    <th className="px-10 py-5 text-right">Zarządzaj</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 flex-1">
                  {filteredTools.map((tool) => {
                    const branch = branches.find(b => b.id === tool.branch_id);
                    const isHub = tool.branch_id === '1';
                    return (
                      <tr key={tool.id} className="group hover:bg-slate-50/50 transition-colors">
                        <td className="px-10 py-4">
                          <div className="relative w-24 h-16 rounded-xl overflow-hidden bg-slate-100">
                            <img src={tool.image_url} className="w-full h-full object-cover" alt="" />
                            <button onClick={() => setLightboxImage(tool.image_url)} className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all">
                              <ZoomIn className="text-white" size={20} />
                            </button>
                          </div>
                        </td>
                        <td className="px-10 py-4">
                          <p className="font-black text-[#0f172a] uppercase text-sm">{tool.name}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{tool.serial_number}</p>
                        </td>
                        <td className="px-10 py-4">
                          <span className={`px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${isHub ? 'bg-[#22c55e] text-white' : 'bg-rose-600 text-white'}`}>
                            {isHub ? 'WOLNY' : branch?.name}
                          </span>
                        </td>
                        <td className="px-10 py-4 text-right">
                          <button onClick={() => setManageToolId(tool.id)} className="px-6 py-2.5 bg-[#0f172a] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md">ZARZĄDZAJ</button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredTools.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-10 py-20 text-center text-slate-300 font-black uppercase tracking-widest">Brak wyników wyszukiwania</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-20 text-slate-300 space-y-4">
              <Calendar size={64} className="opacity-20" />
              <p className="font-black uppercase tracking-widest text-sm">Grafik Rezerwacji w Budowie</p>
            </div>
          )}
        </div>
      </div>

      {/* Management Modal */}
      {selectedTool && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center lg:p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-[#0f172a]/95 backdrop-blur-xl hidden lg:block" onClick={() => { setManageToolId(null); setDeleteConfirm(false); }}></div>
           <div className="relative w-full h-full lg:h-[90vh] lg:max-w-6xl bg-white lg:rounded-[4rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
              <div className="bg-[#0f172a] p-6 lg:p-10 text-white flex justify-between items-center shrink-0">
                 <div className="flex items-center space-x-6">
                    <div className="p-4 bg-[#22c55e] rounded-[1.5rem]"><Settings size={28} /></div>
                    <div>
                       <h3 className="text-xl lg:text-3xl font-black uppercase tracking-tighter truncate max-w-[200px] lg:max-w-none">{selectedTool.name}</h3>
                       <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">{selectedTool.serial_number}</p>
                    </div>
                 </div>
                 <button onClick={() => { setManageToolId(null); setDeleteConfirm(false); }} className="p-4 lg:p-5 bg-white/10 rounded-full hover:bg-white/20 transition-all"><X size={24} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 lg:p-12 space-y-12 no-scrollbar">
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* INFO */}
                    <div className="space-y-8">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center"><Info size={14} className="mr-2 text-[#22c55e]" /> INFORMACJE</label>
                       <div className="relative group/img">
                        <img src={selectedTool.image_url} className="w-full aspect-square object-cover rounded-[2.5rem] border-4 border-slate-50 shadow-inner" alt="" />
                        <button onClick={() => setLightboxImage(selectedTool.image_url)} className="absolute inset-0 bg-black/40 rounded-[2.5rem] opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-all">
                          <ZoomIn className="text-white" size={32} />
                        </button>
                       </div>
                       <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-3">Lokalizacja</p>
                          <div className="flex items-center space-x-3 text-rose-600 font-black uppercase tracking-tight">
                             <MapPin size={20} />
                             <span className="text-sm">{branches.find(b => b.id === selectedTool.branch_id)?.name}</span>
                          </div>
                       </div>
                    </div>
                    {/* LOGISTYKA */}
                    <div className="space-y-8">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center"><ArrowRightLeft size={14} className="mr-2 text-[#22c55e]" /> LOGISTYKA</label>
                       <div className="space-y-4">
                          <button className="w-full py-6 bg-[#22c55e] text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-lg flex items-center justify-center active:scale-95 transition-transform">
                             <Download size={20} className="mr-3" /> Przekaż narzędzie
                          </button>
                          <button className="w-full py-6 bg-blue-600 text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-lg flex items-center justify-center active:scale-95 transition-transform">
                             <Upload size={20} className="mr-3" /> Potwierdź odbiór
                          </button>
                          <button className="w-full py-6 bg-slate-100 text-slate-600 rounded-[2rem] text-xs font-black uppercase tracking-widest flex items-center justify-center border-2 border-slate-200">
                             <Calendar size={20} className="mr-3" /> Zarezerwuj / Grafik
                          </button>
                       </div>
                    </div>
                    {/* ADMIN */}
                    <div className="space-y-8">
                       {user.role === 'ADMINISTRATOR' ? (
                         <div className="bg-rose-50/50 border-2 border-rose-100 p-8 lg:p-10 rounded-[3rem] space-y-6">
                            <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center mb-2"><ShieldAlert size={16} className="mr-2" /> STREFA ADMINA</label>
                            <button className="w-full py-5 bg-white border border-slate-200 text-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center"><Edit2 size={16} className="mr-3" /> Edytuj dane</button>
                            <button className="w-full py-5 bg-white border border-rose-100 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 transition-all flex items-center justify-center"><Wrench size={16} className="mr-3" /> Konserwacja</button>
                            <div className="pt-6 border-t border-rose-200">
                               <button 
                                 onClick={() => {
                                   if (deleteConfirm) {
                                      setTools(prev => prev.filter(t => t.id !== selectedTool.id));
                                      setManageToolId(null);
                                      setDeleteConfirm(false);
                                   } else setDeleteConfirm(true);
                                 }}
                                 className={`w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${deleteConfirm ? 'bg-rose-700 text-white shadow-xl' : 'bg-white text-rose-500 border-2 border-rose-500 hover:bg-rose-500 hover:text-white'}`}
                               >
                                  {deleteConfirm ? 'POTWIERDZAM USUNIĘCIE' : 'USUŃ NARZĘDZIE'}
                               </button>
                               {deleteConfirm && <button onClick={() => setDeleteConfirm(false)} className="w-full mt-3 text-[9px] font-black text-slate-400 uppercase underline">Anuluj</button>}
                            </div>
                         </div>
                       ) : (
                         <div className="h-full bg-slate-50 rounded-[3rem] border-2 border-dashed flex flex-col items-center justify-center p-10 text-center text-slate-300">
                            <ShieldAlert size={48} className="mb-4 opacity-20" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Strefa Administracyjna Zablokowana</p>
                         </div>
                       )}
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

export default ToolsModule;
