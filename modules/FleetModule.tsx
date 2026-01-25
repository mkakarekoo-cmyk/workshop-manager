
import React, { useState, useMemo } from 'react';
import { 
  Truck, 
  MapPin, 
  ChevronRight, 
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Settings,
  Plus,
  ZoomIn,
  X,
  UserCheck,
  Package
} from 'lucide-react';
import { Vehicle, Mechanic, Branch, InventoryItem, User } from '../types';
import Lightbox from '../components/Lightbox';

interface FleetModuleProps {
  user: User;
  simulationBranchId: string;
  branches: Branch[];
}

const MOCK_MECHANICS: Mechanic[] = [
  { id: 'M1', name: 'Jan Kowalski', specialization: 'Mechanik Silnikowy', avatar_url: 'https://i.pravatar.cc/150?u=M1' },
];

const MOCK_VEHICLES: Vehicle[] = [
  { id: 'V1', plate_number: 'BIA 10221', model: 'Mercedes Sprinter', branch_id: '1', mechanic_id: 'M1', status: 'AKTYWNY', image_url: 'https://picsum.photos/seed/van1/800/600', inventory: [] },
  { id: 'V2', plate_number: 'WKA 55212', model: 'Renault Master', branch_id: '2', status: 'SERWIS', image_url: 'https://picsum.photos/seed/van2/800/600', inventory: [] },
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

const FleetModule: React.FC<FleetModuleProps> = ({ user, simulationBranchId, branches }) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVehicles = useMemo(() => {
    let list = MOCK_VEHICLES;
    if (simulationBranchId !== 'all') list = list.filter(v => v.branch_id === simulationBranchId);
    if (searchTerm) list = list.filter(v => v.model.toLowerCase().includes(searchTerm.toLowerCase()));
    return list;
  }, [simulationBranchId, searchTerm]);

  const selectedVehicle = useMemo(() => MOCK_VEHICLES.find(v => v.id === selectedVehicleId), [selectedVehicleId]);

  if (selectedVehicle) {
    return (
      <div className="p-4 lg:p-12 space-y-8 lg:space-y-12 animate-in slide-in-from-right duration-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center space-x-4 lg:space-x-8">
            <button onClick={() => setSelectedVehicleId(null)} className="p-4 bg-white shadow-xl rounded-[1.5rem] text-slate-600"><ArrowLeft size={24} /></button>
            <div className="min-w-0">
              <h2 className="text-2xl lg:text-4xl font-black text-[#0f172a] truncate uppercase">{selectedVehicle.model}</h2>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center mt-1">
                <MapPin size={12} className="mr-1 text-[#22c55e]" /> {branches.find(b => b.id === selectedVehicle.branch_id)?.name}
              </p>
            </div>
          </div>
          {user.role === 'ADMINISTRATOR' && (
            <button className="w-full lg:w-auto px-10 py-5 bg-[#0f172a] text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center">
              <UserCheck size={20} className="mr-3 text-[#22c55e]" /> ZARZĄDZAJ OPERATOREM
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">
          <div className="lg:col-span-1">
             <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                <img src={selectedVehicle.image_url} className="w-full h-56 lg:h-72 object-cover" alt="" />
                <div className="p-8 space-y-6">
                  <div className="bg-slate-50 p-6 rounded-2xl">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">Tablice</p>
                    <p className="text-xl font-black text-[#0f172a] font-mono">{selectedVehicle.plate_number}</p>
                  </div>
                  <span className={`block text-center py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 ${selectedVehicle.status === 'AKTYWNY' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                    {selectedVehicle.status}
                  </span>
                </div>
             </div>
          </div>

          <div className="lg:col-span-3 space-y-8">
            <div className="bg-white rounded-[2.5rem] lg:rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 lg:p-10 border-b border-slate-50 flex items-center space-x-6 bg-slate-50/30">
                <Package className="text-[#22c55e]" size={32} />
                <h3 className="text-lg lg:text-2xl font-black uppercase">System Szuflad</h3>
              </div>
              <div className="overflow-x-auto p-4 lg:p-0">
                <table className="w-full text-left min-w-[500px]">
                  <thead className="bg-slate-50 text-slate-400 text-[9px] font-black uppercase">
                    <tr>
                      <th className="px-6 lg:px-10 py-6">Nazwa Zasobu</th>
                      <th className="px-6 lg:px-10 py-6">Sztuki</th>
                      <th className="px-6 lg:px-10 py-6 text-right">Zarządzaj</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    <tr><td colSpan={3} className="px-10 py-20 text-center text-slate-300 uppercase font-black text-xs">Pusta baza szuflad</td></tr>
                  </tbody>
                </table>
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
        <StatCard label="FLOTA" count={MOCK_VEHICLES.length} color="slate" icon={<Truck />} />
        <StatCard label="AKTYWNE" count={MOCK_VEHICLES.filter(v => v.status === 'AKTYWNY').length} color="green" icon={<CheckCircle2 />} />
        <StatCard label="SERWIS" count={MOCK_VEHICLES.filter(v => v.status === 'SERWIS').length} color="rose" icon={<AlertCircle />} />
        <StatCard label="WOLNE" count={MOCK_VEHICLES.filter(v => v.status === 'WOLNY').length} color="amber" icon={<Clock />} />
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 lg:p-10 border-b border-slate-50 flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="relative w-full lg:w-96 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Szukaj pojazdu..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-white border border-slate-200 rounded-[2rem] text-sm outline-none shadow-sm"
            />
          </div>
          <button className="w-full lg:w-auto px-10 py-5 bg-[#0f172a] text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center">
            <Plus size={20} className="mr-3 text-[#22c55e]" /> NOWY POJAZD
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
          {filteredVehicles.map(v => (
            <div key={v.id} className="bg-slate-50 rounded-[2.5rem] p-5 border border-slate-100 group transition-all hover:shadow-xl hover:-translate-y-1">
              <div className="relative h-40 rounded-[2rem] overflow-hidden mb-6">
                <img src={v.image_url} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" alt="" />
                <div className={`absolute top-4 right-4 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase border-2 shadow-xl ${v.status === 'AKTYWNY' ? 'bg-green-500 text-white border-green-400' : 'bg-rose-600 text-white border-rose-400'}`}>
                  {v.status}
                </div>
              </div>
              <div className="space-y-4">
                <div className="min-w-0">
                  <p className="font-black text-[#0f172a] uppercase truncate">{v.model}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">{v.plate_number}</p>
                </div>
                <button onClick={() => setSelectedVehicleId(v.id)} className="w-full py-4 bg-white text-[#0f172a] rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-md border border-slate-200 transition-all hover:bg-[#0f172a] hover:text-white">ZOBACZ DETALE</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FleetModule;
