
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Truck, Search, Plus, User as UserIcon, X, Save, Loader, 
  ZoomIn, CheckCircle, Trash2, Edit2, 
  Settings, Layers, ChevronRight, Package, ArrowLeft,
  Wrench, AlertCircle, Info, LayoutGrid, Building2, PackagePlus, Camera,
  UserCheck, UserPlus, Image as ImageIcon, UploadCloud, Download
} from 'lucide-react';
import { Vehicle, Branch, User, VanDrawerWithItems } from '../types';
import Lightbox from '../components/Lightbox';
import { supabase } from '../supabase';

const SUPABASE_URL = 'https://cuctnnsgvxhomxobpchi.supabase.co';

interface FleetModuleProps {
  user: User;
  simulationBranchId: string;
  branches: Branch[];
  vehicles: Vehicle[];
  refreshTrigger: number;
  onRefresh: () => void;
  allUsers?: User[];
}

const FleetModule: React.FC<FleetModuleProps> = ({ 
  user, 
  simulationBranchId, 
  branches, 
  vehicles, 
  refreshTrigger, 
  onRefresh,
  allUsers = []
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [drawers, setDrawers] = useState<VanDrawerWithItems[]>([]);
  const [isLoadingDrawers, setIsLoadingDrawers] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  // Drawer Editing (Existents)
  const [isEditInventoryOpen, setIsEditInventoryOpen] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<VanDrawerWithItems | null>(null);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);

  // NEW DRAWER MODAL STATE
  const [isAddDrawerModalOpen, setIsAddDrawerModalOpen] = useState(false);
  const [newDrawerName, setNewDrawerName] = useState('');
  const [newDrawerPhoto, setNewDrawerPhoto] = useState<File | null>(null);
  const [newDrawerPhotoPreview, setNewDrawerPhotoPreview] = useState<string | null>(null);
  const [newDrawerItems, setNewDrawerItems] = useState<any[]>([{ lp: 1, name: '', szt: 1 }]);

  // VEHICLE FORM STATE
  const [vPlate, setVPlate] = useState('');
  const [vModel, setVModel] = useState('');
  const [vBranch, setVBranch] = useState('1');
  const [vStatus, setVStatus] = useState<'AKTYWNY' | 'SERWIS' | 'WOLNY'>('AKTYWNY');

  const canManage = user.role === 'ADMINISTRATOR' || user.role === 'DORADCA SERWISOWY';
  const selectedVehicle = useMemo(() => vehicles.find((v) => String(v.id) === String(selectedVehicleId)), [vehicles, selectedVehicleId]);

  const getPhotoUrl = (path: string | null) => {
    if (!path) return `${SUPABASE_URL}/storage/v1/object/public/van-photos/placeholder.jpg`;
    if (path.startsWith('http')) return path;
    return `${SUPABASE_URL}/storage/v1/object/public/van-photos/${path}`;
  };

  const fetchDrawers = async () => {
    if (!selectedVehicleId) return;
    setIsLoadingDrawers(true);
    try {
      const { data: drData } = await supabase.from('van_drawers').select('*').eq('van_id', selectedVehicleId).order('name');
      if (drData) {
        const withItems = await Promise.all(drData.map(async (d: any) => {
          const { data: items } = await supabase.from('van_inventory_items').select('*').eq('drawer_id', d.id).order('lp');
          return { ...d, items: items || [] };
        }));
        setDrawers(withItems as any);
      }
    } catch (e) { console.error("Error fetching drawers:", e); }
    setIsLoadingDrawers(false);
  };

  useEffect(() => {
    if (selectedVehicleId) fetchDrawers();
  }, [selectedVehicleId, refreshTrigger]);

  const handleEditInventory = (drawer: VanDrawerWithItems) => {
    setActiveDrawer(drawer);
    setInventoryItems([...drawer.items]);
    setIsEditInventoryOpen(true);
  };

  const handleSaveInventory = async () => {
    if (!activeDrawer) return;
    setIsSaving(true);
    try {
      await supabase.from('van_inventory_items').delete().eq('drawer_id', activeDrawer.id);
      const toInsert = inventoryItems
        .filter(item => item.name.trim() !== '')
        .map((item, index) => ({
          drawer_id: activeDrawer.id,
          lp: index + 1,
          name: item.name,
          szt: item.szt
        }));
      if (toInsert.length > 0) {
        const { error } = await supabase.from('van_inventory_items').insert(toInsert);
        if (error) throw error;
      }
      await fetchDrawers();
      setIsEditInventoryOpen(false);
    } catch (e: any) { alert(e.message); }
    setIsSaving(false);
  };

  // ATOMIC DRAWER SAVING LOGIC
  const handleSaveNewDrawer = async () => {
    if (!newDrawerName || !selectedVehicleId) {
      alert("Proszę podać etykietę szuflady.");
      return;
    }
    
    setIsSaving(true);
    try {
      let photo_url = null;

      // 1. Upload photo to 'van-photos' bucket if provided
      if (newDrawerPhoto) {
        const fileName = `drawer_${selectedVehicleId}_${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage.from('van-photos').upload(fileName, newDrawerPhoto);
        if (uploadError) throw uploadError;
        photo_url = fileName;
      }

      // 2. Insert into 'van_drawers'
      const { data: drawerData, error: drawerError } = await supabase
        .from('van_drawers')
        .insert([{ 
          van_id: selectedVehicleId, 
          name: newDrawerName, 
          image_url: photo_url 
        }])
        .select()
        .single();

      if (drawerError) throw drawerError;

      // 3. Bulk insert rows from newDrawerItems
      const itemsToInsert = newDrawerItems
        .filter(i => i.name.trim() !== '')
        .map((item, index) => ({
          drawer_id: drawerData.id,
          lp: index + 1,
          name: item.name,
          szt: item.szt
        }));

      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase.from('van_inventory_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;
      }

      // 4. Success handling
      alert("Szuflada dodana pomyślnie!");
      setIsAddDrawerModalOpen(false);
      setNewDrawerName('');
      setNewDrawerPhoto(null);
      setNewDrawerPhotoPreview(null);
      setNewDrawerItems([{ lp: 1, name: '', szt: 1 }]);
      await fetchDrawers();
      onRefresh(); // Trigger global refresh for good measure
    } catch (e: any) { 
      console.error("Error saving drawer:", e);
      alert("Wystąpił błąd podczas zapisywania: " + e.message); 
    }
    setIsSaving(false);
  };

  const handleSaveVehicle = async () => {
    if (!vPlate || !vModel) return;
    setIsSaving(true);
    try {
      const payload = { plate_number: vPlate, model: vModel, branch_id: Number(vBranch), status: vStatus };
      if (editingVehicle) {
        const { error } = await supabase.from('vehicles').update(payload).eq('id', editingVehicle.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('vehicles').insert([payload]);
        if (error) throw error;
      }
      onRefresh();
      setIsVehicleModalOpen(false);
      setEditingVehicle(null);
    } catch (e: any) { alert(e.message); }
    setIsSaving(false);
  };

  const handleDeleteVehicle = async (id: string) => {
    try {
      const { error } = await supabase.from('vehicles').delete().eq('id', id);
      if (error) throw error;
      alert("Pojazd usunięty");
      setConfirmDeleteId(null);
      onRefresh();
      setSelectedVehicleId(null);
    } catch (e: any) { alert(e.message); }
  };

  const handleAssignMechanic = async (mechanicId: string, vehicleId: string | null) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ assigned_van_id: vehicleId })
        .eq('id', mechanicId);
      if (error) throw error;
      onRefresh();
    } catch (e: any) { alert(e.message); }
  };

  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const branchMatch = simulationBranchId === 'all' || Number(v.branch_id) === Number(simulationBranchId);
      const searchMatch = !searchTerm || v.plate_number.toLowerCase().includes(searchTerm.toLowerCase()) || v.model.toLowerCase().includes(searchTerm.toLowerCase());
      return branchMatch && searchMatch;
    });
  }, [vehicles, simulationBranchId, searchTerm]);

  const mechanics = useMemo(() => allUsers.filter(u => u.role === 'MECHANIK'), [allUsers]);

  if (selectedVehicle) {
    return (
      <div className="p-8 lg:p-14 space-y-12 animate-in slide-in-from-right duration-700 pb-32">
        <div className="flex items-center justify-between">
          <button onClick={() => setSelectedVehicleId(null)} className="group flex items-center space-x-4 text-slate-400 hover:text-[#0f172a] font-black uppercase text-[11px] tracking-[0.3em] bg-white px-8 py-4 rounded-3xl shadow-sm border border-slate-100 transition-all">
            <ArrowLeft size={18} className="group-hover:-translate-x-2 transition-transform" /> <span>Lista Pojazdów</span>
          </button>
          {canManage && (
            <button onClick={() => {
              setEditingVehicle(selectedVehicle);
              setVPlate(selectedVehicle.plate_number);
              setVModel(selectedVehicle.model);
              setVBranch(String(selectedVehicle.branch_id));
              setVStatus(selectedVehicle.status as any);
              setIsVehicleModalOpen(true);
            }} className="px-10 py-4 bg-[#0f172a] text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-[#1e293b] shadow-xl flex items-center space-x-3 border-b-4 border-black">
              <Settings size={16} className="text-[#22c55e]" /> <span>Edytuj Auto</span>
            </button>
          )}
        </div>

        <div className="bg-[#0f172a] p-12 rounded-[4rem] shadow-2xl flex flex-col lg:flex-row items-center justify-between border-b-8 border-[#22c55e] relative overflow-hidden">
           <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
              <Truck size={300} className="text-white" />
           </div>
           <div className="flex items-center space-x-10 relative z-10">
              <div className="w-32 h-32 bg-[#22c55e] rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-green-500/20 rotate-3"><Truck size={56} /></div>
              <div>
                <h2 className="text-6xl font-black text-white uppercase tracking-tighter italic leading-none drop-shadow-lg">{selectedVehicle.plate_number}</h2>
                <p className="text-[#22c55e] text-sm font-black uppercase tracking-[0.5em] mt-4 flex items-center">
                  <Info size={16} className="mr-3" /> {selectedVehicle.model}
                </p>
              </div>
           </div>
           <div className="mt-10 lg:mt-0 flex items-center space-x-8 bg-white/5 p-6 rounded-[3rem] border border-white/10 backdrop-blur-xl relative z-10">
              <div className="text-center px-6 border-r border-white/10">
                <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-1">Status</p>
                <p className={`text-white font-black uppercase italic text-lg ${selectedVehicle.status === 'SERWIS' ? 'animate-pulse text-rose-500' : ''}`}>{selectedVehicle.status}</p>
              </div>
              <div className="text-center px-6">
                <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-1">Baza</p>
                <p className="text-[#22c55e] font-black uppercase italic text-lg">{branches.find(b => Number(b.id) === Number(selectedVehicle.branch_id))?.name || 'HUB'}</p>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-12">
                <div className="flex items-center justify-between">
                  <h3 className="text-3xl font-black text-[#0f172a] uppercase tracking-tighter italic border-l-8 border-[#22c55e] pl-8 py-2">Wyposażenie</h3>
                  {canManage && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsAddDrawerModalOpen(true); }}
                      className="px-8 py-3 bg-[#22c55e] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-[#1eb354] transition-all flex items-center space-x-3 active:scale-95"
                    >
                      <Plus size={16}/> <span>Dodaj Szufladę</span>
                    </button>
                  )}
                </div>

                {isLoadingDrawers ? (
                  <div className="flex justify-center p-32"><Loader className="animate-spin text-[#22c55e]" size={56} /></div>
                ) : drawers.length === 0 ? (
                  <div className="p-20 bg-white rounded-[4rem] border-4 border-dashed border-slate-100 text-center flex flex-col items-center justify-center space-y-8">
                    <Package size={64} className="text-slate-100" />
                    <p className="text-slate-300 font-black uppercase tracking-widest text-sm">Brak zdefiniowanych szuflad</p>
                    {canManage && (
                       <button 
                        onClick={(e) => { e.stopPropagation(); setIsAddDrawerModalOpen(true); }}
                        className="px-12 py-5 bg-[#22c55e] text-white rounded-3xl font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center space-x-4 active:scale-95"
                       >
                         <Plus size={20}/> <span>DODAJ PIERWSZĄ SZUFLADĘ</span>
                       </button>
                    )}
                  </div>
                ) : (
                  drawers.map(drawer => (
                    <div key={drawer.id} className="bg-white rounded-[4rem] shadow-2xl border border-slate-100 overflow-hidden group transition-all hover:border-[#22c55e]/30">
                       <div className="bg-slate-50/80 p-10 flex justify-between items-center border-b border-slate-200">
                          <div className="flex items-center space-x-8">
                              <div className="w-24 h-20 rounded-[1.5rem] bg-white overflow-hidden border-4 border-white shadow-xl cursor-zoom-in relative group/img" onClick={() => setLightboxImage(getPhotoUrl(drawer.image_url || ''))}>
                                  <img src={getPhotoUrl(drawer.image_url || '')} className="w-full h-full object-cover transition-transform group-hover/img:scale-110" alt="" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-all"><ZoomIn size={24} className="text-white"/></div>
                              </div>
                              <div>
                                <h3 className="text-3xl font-black text-[#0f172a] uppercase tracking-tight italic leading-none">{drawer.name}</h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Zawartość techniczna</p>
                              </div>
                          </div>
                          {canManage && (
                            <button onClick={() => handleEditInventory(drawer)} className="p-5 bg-[#0f172a] text-white rounded-2xl shadow-xl hover:bg-[#22c55e] transition-all flex items-center space-x-3 font-black text-[10px] uppercase tracking-widest border-b-4 border-black">
                               <Edit2 size={16}/> <span>Inwentarz</span>
                            </button>
                          )}
                       </div>
                       <div className="p-10 overflow-x-auto no-scrollbar">
                          <table className="w-full text-left">
                            <thead>
                              <tr className="border-b-4 border-slate-50">
                                <th className="py-6 px-10 text-[10px] font-black uppercase text-slate-400 tracking-widest w-24 text-center">Lp</th>
                                <th className="py-6 px-10 text-[10px] font-black uppercase text-slate-400 tracking-widest">Nazwa Przedmiotu</th>
                                <th className="py-6 px-10 text-[10px] font-black uppercase text-slate-400 tracking-widest w-40 text-center">Szt</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y-2 divide-slate-50">
                              {drawer.items.length === 0 ? (
                                <tr><td colSpan={3} className="py-12 text-center text-slate-300 font-black uppercase tracking-widest text-xs italic">Szuflada pusta</td></tr>
                              ) : drawer.items.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-all group/row">
                                  <td className="py-6 px-10 font-mono text-base font-black text-slate-300 text-center">{item.lp}</td>
                                  <td className="py-6 px-10 text-base font-bold uppercase text-slate-800">{item.name}</td>
                                  <td className="py-6 px-10 text-lg font-black text-[#0f172a] text-center uppercase">{item.szt}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                       </div>
                    </div>
                  ))
                )}
            </div>

            <div className="space-y-12">
                <h3 className="text-3xl font-black text-[#0f172a] uppercase tracking-tighter italic border-l-8 border-[#22c55e] pl-8 py-2">Obsługa</h3>
                <div className="bg-white rounded-[4rem] p-10 border border-slate-100 shadow-xl space-y-8">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center italic">
                        <UserCheck size={14} className="mr-3 text-[#22c55e]"/> PRZYPISANI MECHANICY
                    </p>
                    <div className="space-y-4">
                        {mechanics.length === 0 ? (
                          <p className="text-slate-300 font-black uppercase tracking-widest text-xs py-8 text-center border-4 border-dashed border-slate-50 rounded-[2rem]">Brak mechaników w systemie</p>
                        ) : mechanics.map(mech => {
                          const isAssigned = String((mech as any).assigned_van_id) === String(selectedVehicleId);
                          return (
                            <div key={mech.id} className={`flex items-center justify-between p-6 rounded-[2.5rem] border-2 transition-all ${isAssigned ? 'bg-green-50 border-[#22c55e] shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                                <div className="flex items-center space-x-6">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${isAssigned ? 'bg-[#22c55e] text-white' : 'bg-white text-slate-200 border border-slate-100'}`}>
                                        {mech.email.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className={`text-sm font-black uppercase italic leading-none truncate ${isAssigned ? 'text-[#0f172a]' : 'text-slate-400'}`}>{mech.first_name || mech.email.split('@')[0]} {mech.last_name || ''}</p>
                                        <p className="text-[9px] font-black uppercase tracking-widest mt-2">{isAssigned ? 'Operator Pojazdu' : 'Wolny'}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleAssignMechanic(mech.id, isAssigned ? null : selectedVehicleId)}
                                    className={`p-4 rounded-2xl transition-all shrink-0 ${isAssigned ? 'bg-rose-500 text-white shadow-xl hover:bg-rose-600' : 'bg-white text-[#22c55e] border border-slate-200 hover:bg-[#22c55e] hover:text-white shadow-sm'}`}
                                >
                                    {isAssigned ? <X size={20}/> : <UserPlus size={20}/>}
                                </button>
                            </div>
                          );
                        })}
                    </div>
                </div>
            </div>
        </div>

        {/* NOWA SZUFLADA MODAL */}
        {isAddDrawerModalOpen && (
          <div className="fixed inset-0 z-[6000] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-[#0f172a]/95 backdrop-blur-xl" onClick={() => setIsAddDrawerModalOpen(false)}></div>
            <div className="relative w-full max-w-5xl bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
               <div className="bg-[#0f172a] p-10 text-white flex justify-between items-center shrink-0 border-b-8 border-[#22c55e]">
                  <div className="flex items-center space-x-6">
                     <div className="w-16 h-16 bg-[#22c55e] rounded-2xl flex items-center justify-center shadow-xl"><Package size={28}/></div>
                     <div>
                       <h3 className="text-3xl font-black uppercase italic leading-none">Nowa Szuflada</h3>
                       <p className="text-[#22c55e] text-[9px] font-black uppercase tracking-widest mt-2">Rejestracja Wyposażenia Flotowego</p>
                     </div>
                  </div>
                  <button onClick={() => setIsAddDrawerModalOpen(false)} className="p-4 bg-white/10 rounded-full hover:bg-white/20 transition-all active:scale-90"><X size={24}/></button>
               </div>
               
               <div className="flex-1 p-10 overflow-y-auto no-scrollbar space-y-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                     <div className="space-y-8">
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6 italic">Etykieta Szuflady</label>
                           <input 
                             type="text" 
                             value={newDrawerName} 
                             onChange={e => setNewDrawerName(e.target.value)} 
                             placeholder="np. Szuflada Lewa #1" 
                             className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] font-black uppercase outline-none focus:border-[#22c55e] shadow-inner" 
                           />
                        </div>
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6 italic">Dokumentacja Foto</label>
                           <label className="w-full h-48 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center justify-center cursor-pointer hover:border-[#22c55e] transition-all overflow-hidden group shadow-inner">
                              {newDrawerPhotoPreview ? (
                                <img src={newDrawerPhotoPreview} className="w-full h-full object-cover" alt="Preview" />
                              ) : (
                                <>
                                  <UploadCloud size={40} className="text-slate-200 group-hover:scale-110 transition-transform" />
                                  <p className="text-[10px] font-black text-slate-300 uppercase mt-4">Kliknij aby wgrać zdjęcie</p>
                                </>
                              )}
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setNewDrawerPhoto(file);
                                  setNewDrawerPhotoPreview(URL.createObjectURL(file));
                                }
                              }} />
                           </label>
                        </div>
                     </div>
                     <div className="space-y-6">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6 italic">Tabela Inwentarza (Excel-Style)</label>
                         <div className="bg-slate-50 p-6 rounded-[3rem] border border-slate-200 shadow-inner min-h-[300px] flex flex-col">
                            <div className="flex-1 space-y-3 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                               {newDrawerItems.map((item, idx) => (
                                 <div key={idx} className="flex items-center space-x-3 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-right duration-300">
                                    <div className="w-8 text-center font-mono font-black text-slate-200 text-xs">{idx + 1}</div>
                                    <input 
                                      type="text" 
                                      placeholder="Nazwa przedmiotu" 
                                      value={item.name} 
                                      onChange={e => {
                                        const n = [...newDrawerItems]; n[idx].name = e.target.value; setNewDrawerItems(n);
                                      }} 
                                      className="flex-1 bg-transparent border-none outline-none font-bold text-xs uppercase" 
                                    />
                                    <input 
                                      type="number" 
                                      value={item.szt} 
                                      onChange={e => {
                                        const n = [...newDrawerItems]; n[idx].szt = parseInt(e.target.value) || 0; setNewDrawerItems(n);
                                      }} 
                                      className="w-14 bg-slate-50 border-none outline-none font-black text-center rounded-lg text-xs" 
                                    />
                                    <button 
                                      onClick={() => {
                                        if (newDrawerItems.length > 1) {
                                          setNewDrawerItems(newDrawerItems.filter((_, i) => i !== idx));
                                        }
                                      }} 
                                      className="p-2 text-rose-300 hover:text-rose-500 transition-colors"
                                    >
                                      <Trash2 size={16}/>
                                    </button>
                                 </div>
                               ))}
                            </div>
                            <button 
                              onClick={() => setNewDrawerItems([...newDrawerItems, { lp: newDrawerItems.length + 1, name: '', szt: 1 }])} 
                              className="mt-6 w-full py-3 border-2 border-dashed border-slate-200 text-slate-300 rounded-2xl font-black uppercase text-[9px] tracking-widest hover:border-[#22c55e] hover:text-[#22c55e] transition-all flex items-center justify-center space-x-2 active:scale-95"
                            >
                              <Plus size={14}/> <span>Dodaj Wiersz</span>
                            </button>
                         </div>
                     </div>
                  </div>
               </div>
               
               <div className="p-10 border-t border-slate-100 flex justify-end shrink-0">
                   <button 
                    onClick={handleSaveNewDrawer} 
                    disabled={isSaving} 
                    className="px-16 py-6 bg-[#22c55e] text-white rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl flex items-center justify-center space-x-4 active:scale-95 transition-all disabled:opacity-50"
                   >
                     {isSaving ? <Loader className="animate-spin" size={24}/> : <Save size={24}/>}
                     <span>Zapisz Szufladę</span>
                   </button>
               </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-8 lg:p-14 space-y-16 animate-in fade-in duration-1000 pb-32">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 bg-[#0f172a] p-12 rounded-[4rem] shadow-2xl relative overflow-hidden border-b-8 border-[#22c55e]">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <Truck size={400} className="text-white" />
        </div>
        <div className="relative z-10">
            <h2 className="text-6xl font-black text-white tracking-tighter uppercase mb-4 italic leading-none drop-shadow-lg">Moja Flota</h2>
            <p className="text-[#22c55e] text-[11px] font-black uppercase tracking-[0.5em] flex items-center">
              <Layers size={16} className="mr-4" /> Globalny system zarządzania pojazdami
            </p>
        </div>
        <div className="relative z-10 flex items-center space-x-6 w-full lg:w-auto">
          <div className="relative group flex-1 lg:w-[400px]">
             <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#22c55e] transition-colors" size={22} />
             <input type="text" placeholder="Szukaj po rejestracji..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-20 pr-8 py-5 bg-slate-800 text-white border border-slate-700 rounded-[2.2rem] text-sm font-black outline-none focus:border-[#22c55e] transition-all uppercase" />
          </div>
          {canManage && (
            <button 
              onClick={() => { setEditingVehicle(null); setVPlate(''); setVModel(''); setIsVehicleModalOpen(true); }}
              className="px-12 py-6 bg-[#22c55e] text-white rounded-[2.2rem] text-[11px] font-black uppercase tracking-widest shadow-2xl hover:bg-[#1eb354] transition-all border-b-4 border-green-800 active:scale-95 flex items-center space-x-4"
            >
              <Plus size={20}/><span>Dodaj Auto</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12 relative z-10">
        {filteredVehicles.map((v) => {
          const isConfirming = confirmDeleteId === v.id;
          return (
            <div key={v.id} onClick={() => setSelectedVehicleId(v.id)} className="bg-white rounded-[3.5rem] p-10 border border-slate-100 group transition-all duration-500 hover:shadow-3xl hover:-translate-y-4 cursor-pointer shadow-xl relative overflow-hidden h-[420px] flex flex-col">
                <div className="flex items-center justify-between mb-10 relative z-10">
                    <div className="p-6 bg-slate-50 rounded-[1.8rem] group-hover:bg-[#22c55e] group-hover:text-white transition-all text-slate-300 shadow-inner border border-slate-100">
                      <Truck size={36} />
                    </div>
                    {canManage && (
                      <div className="flex items-center space-x-3">
                        {isConfirming ? (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteVehicle(v.id); }}
                            className="px-6 py-3 bg-[#22c55e] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg animate-in fade-in zoom-in"
                          >
                            POTWIERDŹ?
                          </button>
                        ) : (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(v.id); setTimeout(() => setConfirmDeleteId(null), 3000); }}
                            className="p-4 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-all"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>
                    )}
                </div>
                
                <div className="flex-1 px-2 relative z-10">
                  <h3 className="text-4xl font-black text-[#0f172a] uppercase tracking-tighter italic mb-3 leading-none group-hover:text-[#22c55e] transition-colors">{v.plate_number}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] italic">{v.model}</p>
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-6 flex items-center"><Building2 size={12} className="mr-2"/> {branches.find(b => Number(b.id) === Number(v.branch_id))?.name || 'HUB'}</p>
                </div>

                <div className="mt-auto pt-8 border-t-2 border-slate-50 flex items-center justify-between relative z-10">
                    <div className="flex -space-x-3">
                       {[1,2].map(i => (
                         <div key={i} className="w-10 h-10 rounded-xl bg-slate-100 border-2 border-white flex items-center justify-center text-slate-300 text-[10px] font-black"><UserIcon size={14}/></div>
                       ))}
                    </div>
                    <div className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 ${v.status === 'AKTYWNY' ? 'bg-green-50 text-green-500 border-green-100' : v.status === 'SERWIS' ? 'bg-rose-50 text-rose-500 border-rose-100 animate-pulse' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                      {v.status}
                    </div>
                </div>
            </div>
          );
        })}
      </div>

      {/* VEHICLE ADD/EDIT MODAL */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-[#0f172a]/95 backdrop-blur-xl" onClick={() => setIsVehicleModalOpen(false)}></div>
           <div className="relative w-full max-w-3xl bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
              <div className="bg-[#0f172a] p-12 text-white flex justify-between items-center shrink-0 border-b-8 border-[#22c55e]">
                 <div className="flex items-center space-x-8">
                   <div className="w-24 h-24 bg-[#22c55e] rounded-[1.8rem] flex items-center justify-center shadow-2xl shadow-green-500/20"><Truck size={36}/></div>
                   <div>
                     <h3 className="text-4xl font-black uppercase tracking-tighter italic leading-none">{editingVehicle ? 'Zasób Flotowy' : 'Nowe Auto'}</h3>
                     <p className="text-[#22c55e] text-[10px] font-black uppercase tracking-[0.5em] mt-3">Konfiguracja Pojazdu</p>
                   </div>
                 </div>
                 <button onClick={() => setIsVehicleModalOpen(false)} className="p-6 bg-white/10 rounded-full hover:bg-white/20 border border-white/10"><X size={30} /></button>
              </div>
              <div className="flex-1 p-12 space-y-10 overflow-y-auto no-scrollbar">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6 italic">Nr Rejestracyjny</label>
                      <input type="text" value={vPlate} onChange={e => setVPlate(e.target.value)} placeholder="np. BI 12345" className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] font-black uppercase outline-none focus:border-[#22c55e] shadow-inner transition-all" />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6 italic">Model Pojazdu</label>
                      <input type="text" value={vModel} onChange={e => setVModel(e.target.value)} placeholder="np. Mercedes Sprinter" className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] font-black uppercase outline-none focus:border-[#22c55e] shadow-inner transition-all" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6 italic">Stacja Bazowa</label>
                      <select value={vBranch} onChange={e => setVBranch(e.target.value)} className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] font-black uppercase outline-none focus:border-[#22c55e] appearance-none shadow-inner cursor-pointer">
                        {branches.map(b => <option key={b.id} value={String(b.id)}>{b.name.toUpperCase()}</option>)}
                      </select>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6 italic">Status Operacyjny</label>
                      <select value={vStatus} onChange={e => setVStatus(e.target.value as any)} className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] font-black uppercase outline-none focus:border-[#22c55e] appearance-none shadow-inner cursor-pointer">
                        <option value="AKTYWNY">AKTYWNY</option>
                        <option value="SERWIS">SERWIS</option>
                        <option value="WOLNY">WOLNY</option>
                      </select>
                    </div>
                  </div>
                  <div className="pt-6 flex space-x-4">
                    <button 
                      onClick={handleSaveVehicle} 
                      disabled={isSaving}
                      className="flex-1 py-7 bg-[#22c55e] text-white rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl hover:bg-[#1eb354] transition-all border-b-8 border-green-800 flex items-center justify-center space-x-4 active:scale-95"
                    >
                      {isSaving ? <Loader className="animate-spin" size={24} /> : <Save size={24} />}
                      <span>{editingVehicle ? 'Zapisz Zmiany' : 'Utwórz Zasób'}</span>
                    </button>
                  </div>
              </div>
           </div>
        </div>
      )}

      {/* INVENTORY EDIT MODAL (EXISTING) */}
      {isEditInventoryOpen && activeDrawer && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-[#0f172a]/95 backdrop-blur-xl" onClick={() => setIsEditInventoryOpen(false)}></div>
           <div className="relative w-full max-w-4xl bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
              <div className="bg-[#0f172a] p-10 text-white flex justify-between items-center shrink-0 border-b-8 border-[#22c55e]">
                 <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 bg-[#22c55e] rounded-2xl flex items-center justify-center"><Package size={28}/></div>
                    <div>
                      <h3 className="text-3xl font-black uppercase italic leading-none">{activeDrawer.name}</h3>
                      <p className="text-[#22c55e] text-[9px] font-black uppercase tracking-widest mt-2">Zarządzanie Inwentarzem</p>
                    </div>
                 </div>
                 <button onClick={() => setIsEditInventoryOpen(false)} className="p-4 bg-white/10 rounded-full hover:bg-white/20 transition-all active:scale-90"><X size={24}/></button>
              </div>
              <div className="flex-1 p-10 overflow-y-auto no-scrollbar space-y-8">
                 <div className="space-y-4">
                    {inventoryItems.map((item, idx) => (
                      <div key={idx} className="flex items-center space-x-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 group">
                         <div className="w-12 text-center font-mono font-black text-slate-300">{idx + 1}</div>
                         <input 
                           type="text" 
                           value={item.name} 
                           placeholder="Przedmiot"
                           onChange={e => {
                             const n = [...inventoryItems];
                             n[idx].name = e.target.value;
                             setInventoryItems(n);
                           }}
                           className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold uppercase outline-none focus:border-[#22c55e]"
                         />
                         <input 
                           type="number" 
                           value={item.szt} 
                           onChange={e => {
                             const n = [...inventoryItems];
                             n[idx].szt = parseInt(e.target.value) || 0;
                             setInventoryItems(n);
                           }}
                           className="w-24 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-black text-center outline-none focus:border-[#22c55e]"
                         />
                         <button onClick={() => setInventoryItems(inventoryItems.filter((_, i) => i !== idx))} className="p-2 text-rose-300 hover:text-rose-500 transition-colors"><Trash2 size={20}/></button>
                      </div>
                    ))}
                 </div>
                 <button onClick={() => setInventoryItems([...inventoryItems, { name: '', szt: '1' }])} className="w-full py-4 border-4 border-dashed border-slate-100 text-slate-300 rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:border-[#22c55e] hover:text-[#22c55e] transition-all flex items-center justify-center space-x-3 active:scale-95">
                   <PackagePlus size={18}/> <span>Dodaj Przedmiot</span>
                 </button>
              </div>
              <div className="p-10 border-t border-slate-100 flex justify-end shrink-0">
                  <button onClick={handleSaveInventory} disabled={isSaving} className="px-12 py-5 bg-[#22c55e] text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl flex items-center space-x-3 active:scale-95 disabled:opacity-50">
                    {isSaving ? <Loader className="animate-spin" size={20}/> : <Save size={20}/>}
                    <span>Zapisz Inwentarz</span>
                  </button>
              </div>
           </div>
        </div>
      )}

      <Lightbox isOpen={!!lightboxImage} imageUrl={lightboxImage || ''} onClose={() => setLightboxImage(null)} />
    </div>
  );
};

export default FleetModule;
