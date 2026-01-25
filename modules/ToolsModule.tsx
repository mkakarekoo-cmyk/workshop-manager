
import React, { useState, useMemo } from 'react';
import { 
  ArrowRightLeft,
  AlertTriangle,
  ZoomIn,
  CheckCircle2,
  Clock,
  Filter,
  Trash2,
  Calendar,
  Wrench,
  X,
  Info,
  Download,
  Upload,
  Edit2,
  Save,
  ShieldAlert,
  MapPin,
  MoreVertical,
  Settings
} from 'lucide-react';
import { Tool, ToolStatus, ToolLog, User, Branch } from '../types';
import Lightbox from '../components/Lightbox';

interface ToolsModuleProps {
  user: User;
  simulationBranchId: string;
  branches: Branch[];
}

const MOCK_TOOLS: Tool[] = [
  { id: 'T1', name: 'Wiertarka Hilti TE 70-ATC', category: 'Elektronarzędzia', serial_number: 'HT-9921-X', status: ToolStatus.FREE, branch_id: '1', image_url: 'https://picsum.photos/seed/hilti/600/400' },
  { id: 'T2', name: 'Szlifierka Bosch GWS 18V-10', category: 'Elektronarzędzia', serial_number: 'BS-4420-P', status: ToolStatus.FREE, branch_id: '1', image_url: 'https://picsum.photos/seed/bosch/600/400' },
  { id: 'T3', name: 'Zagęszczarka Wacker Neuson', category: 'Maszyny Budowlane', serial_number: 'WN-0012-G', status: ToolStatus.OCCUPIED, branch_id: '2', image_url: 'https://picsum.photos/seed/wacker/600/400' },
  { id: 'T4', name: 'Młot Makita HM1812', category: 'Elektronarzędzia', serial_number: 'MK-5588-M', status: ToolStatus.MAINTENANCE, branch_id: '3', image_url: 'https://picsum.photos/seed/makita/600/400' },
  { id: 'T5', name: 'Koparka Caterpillar 301.7', category: 'Maszyny Ciężkie', serial_number: 'CAT-1234-A', status: ToolStatus.OCCUPIED, branch_id: '5', image_url: 'https://picsum.photos/seed/cat/600/400' },
  { id: 'T6', name: 'Niwelator Laserowy Topcon', category: 'Pomiary', serial_number: 'TP-7722-B', status: ToolStatus.IN_TRANSIT, branch_id: '4', image_url: 'https://picsum.photos/seed/laser/600/400' },
];

const MOCK_HISTORY: ToolLog[] = [
  { id: 'L1', tool_id: 'T1', action: 'WYDANIE', notes: 'Przekazano brygadzie A.', created_at: '2024-03-24 10:20', from_branch_id: '1', to_branch_id: '2', operator: 'Admin' },
  { id: 'L2', tool_id: 'T4', action: 'KONSERWACJA', notes: 'Wymiana oleju.', created_at: '2024-03-23 15:45', operator: 'Admin' },
];

const StatTile = ({ label, count, color, icon }: any) => {
  const colors: any = {
    blue: 'text-blue-600 bg-blue-50 border-blue-100 shadow-blue-500/10',
    amber: 'text-amber-600 bg-amber-50 border-amber-100 shadow-amber-500/10',
    rose: 'text-rose-600 bg-rose-50 border-rose-100 shadow-rose-500/10',
    green: 'text-[#22c55e] bg-green-50 border-green-100 shadow-green-500/10',
  };

  return (
    <div className="bg-white p-6 lg:p-10 rounded-[2.5rem] lg:rounded-[3rem] shadow-sm border border-slate-100 flex items-center justify-between group">
      <div>
        <p className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
        <h3 className={`text-3xl lg:text-5xl font-black tracking-tighter ${colors[color]?.split(' ')[0] || ''}`}>{count}</h3>
      </div>
      <div className={`p-4 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] border-2 transition-transform group-hover:scale-110 ${colors[color] || ''}`}>
        {React.cloneElement(icon, { size: window.innerWidth < 1024 ? 24 : 32 })}
      </div>
    </div>
  );
};

const ToolsModule: React.FC<ToolsModuleProps> = ({ user, simulationBranchId, branches }) => {
  const [tools, setTools] = useState<Tool[]>(MOCK_TOOLS);
  const [subTab, setSubTab] = useState<'ALL' | 'MY' | 'CALENDAR'>('ALL');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [manageToolId, setManageToolId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const selectedTool = useMemo(() => tools.find(t => t.id === manageToolId), [tools, manageToolId]);

  const filteredTools = useMemo(() => {
    let list = tools;
    if (subTab === 'MY') {
      list = list.filter(t => String(t.branch_id) === String(simulationBranchId));
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

  const handleDelete = (id: string) => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    setTools(prev => prev.filter(t => t.id !== id));
    alert("Sukces! Narzędzie usunięte.");
    setManageToolId(null);
    setDeleteConfirm(false);
  };

  const toggleMaintenance = (id: string) => {
    setTools(prev => prev.map(t => {
      if (t.id === id) {
        const newStatus = t.status === ToolStatus.MAINTENANCE ? ToolStatus.FREE : ToolStatus.MAINTENANCE;
        return { ...t, status: newStatus };
      }
      return t;
    }));
  };

  return (
    <div className="p-4 lg:p-10 space-y-6 lg:space-y-10 animate-in fade-in duration-1000">
      {/* Stats Tiles - 2 columns on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
        <StatTile label="W DRODZE" count={stats.inTransit} color="blue" icon={<ArrowRightLeft />} />
        <StatTile label="ZAJĘTE" count={stats.occupied} color="amber" icon={<Clock />} />
        <StatTile label="KONSERWACJA" count={stats.maintenance} color="rose" icon={<AlertTriangle />} />
        <StatTile label="WOLNE" count={stats.free} color="green" icon={<CheckCircle2 />} />
      </div>

      <div className="bg-white rounded-[2.5rem] lg:rounded-[3.5rem] shadow-sm border border-slate-100 flex flex-col min-h-[500px] overflow-hidden">
        {/* Adaptive Sub-Navigation */}
        <div className="p-4 lg:p-8 border-b border-slate-50 flex flex-col lg:flex-row justify-between items-center gap-6 lg:gap-8 bg-slate-50/30">
          <div className="flex bg-slate-100 p-1.5 rounded-[2rem] w-full lg:w-auto shadow-inner overflow-x-auto no-scrollbar whitespace-nowrap">
            {['ALL', 'MY', 'CALENDAR'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setSubTab(tab as any)}
                className={`px-6 lg:px-10 py-3 lg:py-4 rounded-[1.8rem] text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all ${subTab === tab ? 'bg-[#0f172a] text-white shadow-lg' : 'text-slate-500'}`}
              >
                {tab === 'ALL' ? 'Wszystkie' : tab === 'MY' ? 'Moje' : 'Grafik'}
              </button>
            ))}
          </div>
          
          <div className="relative w-full lg:w-80 group">
            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Szukaj..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-[2rem] text-sm font-bold outline-none shadow-sm"
            />
          </div>
        </div>

        <div className="flex-1">
          {subTab !== 'CALENDAR' ? (
            <div className="p-4 lg:p-0">
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.25em]">
                    <tr>
                      <th className="px-10 py-6">Podgląd</th>
                      <th className="px-10 py-6">Zasób</th>
                      <th className="px-10 py-6">Lokalizacja</th>
                      <th className="px-10 py-6 text-right">Zarządzaj</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredTools.map((tool) => {
                      const branch = branches.find(b => b.id === tool.branch_id);
                      const isHub = tool.branch_id === '1';
                      return (
                        <tr key={tool.id} className="group hover:bg-slate-50 transition-colors">
                          <td className="px-10 py-6">
                            <div className="relative w-28 h-20 rounded-[1.5rem] overflow-hidden bg-slate-100">
                              <img src={tool.image_url} className="w-full h-full object-cover" alt="" />
                              <button onClick={() => setLightboxImage(tool.image_url)} className="absolute inset-0 opacity-0 group-hover:opacity-100 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all">
                                <ZoomIn className="text-white" />
                              </button>
                            </div>
                          </td>
                          <td className="px-10 py-6">
                            <p className="font-black text-[#0f172a] uppercase">{tool.name}</p>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{tool.serial_number}</p>
                          </td>
                          <td className="px-10 py-6">
                            <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${isHub ? 'bg-green-500 text-white' : 'bg-rose-600 text-white'}`}>
                              {isHub ? 'WOLNY' : branch?.name}
                            </span>
                          </td>
                          <td className="px-10 py-6 text-right">
                            <button onClick={() => setManageToolId(tool.id)} className="px-6 py-3 bg-[#0f172a] text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">ZARZĄDZAJ</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {filteredTools.map((tool) => {
                  const branch = branches.find(b => b.id === tool.branch_id);
                  const isHub = tool.branch_id === '1';
                  return (
                    <div key={tool.id} className="bg-slate-50 rounded-[2rem] p-5 border border-slate-100 space-y-4">
                      <div className="flex items-center space-x-4">
                        <img src={tool.image_url} className="w-20 h-20 rounded-[1.5rem] object-cover shrink-0" alt="" />
                        <div className="min-w-0 flex-1">
                          <p className="font-black text-[#0f172a] uppercase text-sm truncate">{tool.name}</p>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{tool.serial_number}</p>
                          <span className={`inline-block mt-2 px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${isHub ? 'bg-green-500 text-white' : 'bg-rose-600 text-white'}`}>
                            {isHub ? 'WOLNY' : branch?.name}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => setManageToolId(tool.id)} className="w-full py-4 bg-[#0f172a] text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-md">ZARZĄDZAJ</button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-8 lg:p-16 text-center text-slate-400 uppercase font-black tracking-widest">
              Grafik Obciążenia Zasobów (Widok Kalendarza)
            </div>
          )}
        </div>
      </div>

      {/* Responsive Management Modal */}
      {selectedTool && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center lg:p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-[#0f172a]/95 backdrop-blur-xl hidden lg:block" onClick={() => setManageToolId(null)}></div>
           <div className="relative w-full h-full lg:h-auto lg:max-w-5xl bg-white lg:rounded-[4rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
              {/* Header */}
              <div className="bg-[#0f172a] p-6 lg:p-10 text-white flex justify-between items-center shrink-0">
                 <div className="flex items-center space-x-4 lg:space-x-6">
                    <div className="p-3 lg:p-4 bg-[#22c55e] rounded-2xl">
                       <Settings size={24} />
                    </div>
                    <div>
                       <h3 className="text-xl lg:text-3xl font-black uppercase truncate max-w-[200px] lg:max-w-none">{selectedTool.name}</h3>
                       <p className="text-slate-400 text-[9px] lg:text-[10px] font-black uppercase mt-1">{selectedTool.serial_number}</p>
                    </div>
                 </div>
                 <button onClick={() => setManageToolId(null)} className="p-3 lg:p-5 bg-white/10 rounded-full"><X size={20} /></button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 lg:p-12 space-y-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12">
                  <div className="space-y-6">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                      <Info size={14} className="mr-2 text-[#22c55e]" /> INFO
                    </label>
                    <img src={selectedTool.image_url} className="w-full h-56 lg:h-72 object-cover rounded-[2rem] lg:rounded-[3rem] border-4 border-slate-50 shadow-inner" alt="" />
                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Lokalizacja</p>
                      <p className="text-sm font-black text-[#0f172a] uppercase tracking-tight flex items-center">
                        <MapPin size={16} className="mr-2 text-rose-600" />
                        {branches.find(b => b.id === selectedTool.branch_id)?.name}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                      <ArrowRightLeft size={14} className="mr-2 text-[#22c55e]" /> LOGISTYKA
                    </label>
                    <div className="grid grid-cols-1 gap-4">
                      <button className="w-full py-5 bg-[#22c55e] text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center">
                        <Download size={18} className="mr-3" /> PRZEKAŻ
                      </button>
                      <button className="w-full py-5 bg-blue-600 text-white rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center">
                        <Upload size={18} className="mr-3" /> ODBIERZ
                      </button>
                    </div>

                    {user.role === 'ADMINISTRATOR' && (
                      <div className="pt-6 border-t border-slate-100 space-y-4">
                        <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center">
                          <ShieldAlert size={14} className="mr-2" /> ADMIN ZONE
                        </label>
                        <button onClick={() => toggleMaintenance(selectedTool.id)} className={`w-full py-5 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest border-2 transition-all ${selectedTool.status === ToolStatus.MAINTENANCE ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-rose-600 border-rose-100'}`}>
                           {selectedTool.status === ToolStatus.MAINTENANCE ? 'ZAKOŃCZ SERWIS' : 'START SERWIS'}
                        </button>
                        <button onClick={() => handleDelete(selectedTool.id)} className={`w-full py-5 rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest transition-all ${deleteConfirm ? 'bg-rose-800 text-white' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}>
                           {deleteConfirm ? 'POTWIERDZAM USUNIĘCIE' : 'USUŃ ZASÓB'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Mobile Fix */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 lg:hidden shrink-0 pb-10">
                <button onClick={() => setManageToolId(null)} className="w-full py-5 bg-[#0f172a] text-white rounded-[1.8rem] font-black text-xs uppercase tracking-widest shadow-xl">ZAMKNIJ PODGLĄD</button>
              </div>
           </div>
        </div>
      )}

      <Lightbox isOpen={!!lightboxImage} imageUrl={lightboxImage || ''} onClose={() => setLightboxImage(null)} />
    </div>
  );
};

export default ToolsModule;
