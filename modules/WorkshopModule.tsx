
import React, { useState, useMemo } from 'react';
import { 
  Warehouse, 
  MapPin, 
  ChevronRight, 
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Settings,
  LayoutGrid,
  ZoomIn,
  Wrench,
  X,
  Package
} from 'lucide-react';
import { WorkshopStation, Branch, InventoryItem, User } from '../types';
import Lightbox from '../components/Lightbox';

interface WorkshopModuleProps {
  user: User;
  simulationBranchId: string;
  branches: Branch[];
}

const MOCK_STATIONS: WorkshopStation[] = [
  { id: 'S1', name: 'Stanowisko Ślusarskie A-1', branch_id: '1', status: 'AKTYWNY', image_url: 'https://picsum.photos/seed/ws1/800/600', inventory: [] },
  { id: 'S2', name: 'Stanowisko Spawalnicze MAG', branch_id: '2', status: 'WOLNY', image_url: 'https://picsum.photos/seed/ws2/800/600', inventory: [] },
];

const StatCard = ({ label, count, color, icon }: any) => {
  const themes: any = {
    slate: 'bg-[#0f172a] text-white border-slate-700',
    green: 'bg-green-50 text-[#22c55e] border-white',
    rose: 'bg-rose-50 text-rose-600 border-white',
    amber: 'bg-amber-50 text-amber-600 border-white',
  };
  return (
    <div className={`p-6 lg:p-10 rounded-[2.5rem] lg:rounded-[3.5rem] shadow-sm border flex items-center justify-between transition-transform hover:-translate-y-1 ${themes[color]}`}>
      <div>
        <p className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest mb-2 opacity-70">{label}</p>
        <h3 className="text-3xl lg:text-5xl font-black tracking-tighter">{count}</h3>
      </div>
      <div className={`p-4 lg:p-6 rounded-[1.5rem] border-2 ${color === 'slate' ? 'bg-white/10' : 'bg-current/10'} border-transparent`}>
        {React.cloneElement(icon, { size: 24 })}
      </div>
    </div>
  );
};

const WorkshopModule: React.FC<WorkshopModuleProps> = ({ user, simulationBranchId, branches }) => {
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStations = useMemo(() => {
    let list = MOCK_STATIONS;
    if (simulationBranchId !== 'all') list = list.filter(s => s.branch_id === simulationBranchId);
    if (searchTerm) list = list.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return list;
  }, [simulationBranchId, searchTerm]);

  const selectedStation = useMemo(() => MOCK_STATIONS.find(s => s.id === selectedStationId), [selectedStationId]);

  if (selectedStation) {
    return (
      <div className="p-4 lg:p-12 space-y-8 lg:space-y-12 animate-in slide-in-from-right duration-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center space-x-4 lg:space-x-8">
            <button onClick={() => setSelectedStationId(null)} className="p-4 bg-white shadow-xl rounded-[1.5rem] text-slate-600"><ArrowLeft size={24} /></button>
            <div className="min-w-0">
              <h2 className="text-2xl lg:text-4xl font-black text-[#0f172a] truncate uppercase">{selectedStation.name}</h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center mt-1">
                <MapPin size={12} className="mr-1 text-[#22c55e]" /> {branches.find(b => b.id === selectedStation.branch_id)?.name}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
          <div className="lg:col-span-1">
             <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                <img src={selectedStation.image_url} className="w-full h-56 lg:h-72 object-cover" alt="" />
                <div className="p-8">
                   <span className={`block text-center py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 ${selectedStation.status === 'AKTYWNY' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                    {selectedStation.status}
                  </span>
                </div>
             </div>
          </div>
          
          <div className="lg:col-span-3">
            <div className="bg-white rounded-[2.5rem] lg:rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden h-full min-h-[400px]">
              <div className="p-6 lg:p-10 border-b border-slate-50 flex items-center space-x-6 bg-slate-50/30">
                <Wrench className="text-[#22c55e]" size={32} />
                <h3 className="text-lg lg:text-2xl font-black uppercase">Inwentaryzacja Stacjonarna</h3>
              </div>
              <div className="p-20 text-center text-slate-300 uppercase font-black tracking-widest">
                Widok Inwentaryzacji Stanowiska
              </div>
            </div>
          </div>
        </div>
        <Lightbox isOpen={!!lightboxImage} imageUrl={lightboxImage || ''} onClose={() => setLightboxImage(null)} />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-10 space-y-6 lg:space-y-10 animate-in fade-in duration-1000">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
        <StatCard label="STANOWISKA" count={MOCK_STATIONS.length} color="slate" icon={<Warehouse />} />
        <StatCard label="W UŻYCIU" count={MOCK_STATIONS.filter(s => s.status === 'AKTYWNY').length} color="green" icon={<CheckCircle2 />} />
        <StatCard label="KONSERWACJA" count={MOCK_STATIONS.filter(s => s.status === 'KONSERWACJA').length} color="rose" icon={<AlertTriangle />} />
        <StatCard label="WOLNE" count={MOCK_STATIONS.filter(s => s.status === 'WOLNY').length} color="amber" icon={<LayoutGrid />} />
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 lg:p-10 border-b border-slate-50 flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="relative w-full lg:w-96 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Szukaj stanowiska..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-[2rem] text-sm outline-none shadow-sm"
            />
          </div>
          <button className="w-full lg:w-auto px-10 py-5 bg-[#0f172a] text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center">
            <Plus size={20} className="mr-3 text-[#22c55e]" /> NOWE STANOWISKO
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
          {filteredStations.map(station => (
            <div key={station.id} className="bg-slate-50 rounded-[2.5rem] p-5 border border-slate-100 group transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="relative h-40 rounded-[2rem] overflow-hidden mb-6">
                <img src={station.image_url} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" alt="" />
                <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase border-2 shadow-xl ${station.status === 'AKTYWNY' ? 'bg-green-500 text-white border-green-400' : 'bg-amber-600 text-white border-amber-400'}`}>
                  {station.status}
                </div>
              </div>
              <div className="space-y-4">
                <p className="font-black text-[#0f172a] uppercase truncate">{station.name}</p>
                <button onClick={() => setSelectedStationId(station.id)} className="w-full py-4 bg-white text-[#0f172a] rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-md border border-slate-200 transition-all hover:bg-[#0f172a] hover:text-white">ZOBACZ DETALE</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WorkshopModule;
