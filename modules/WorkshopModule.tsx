
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Warehouse, ArrowLeft, Search, Plus, Wrench, Package, X, Save, 
  Loader, UploadCloud, ZoomIn, Layers, LayoutGrid, Settings,
  Trash2, Info, Building2, MapPin, Edit2, PackagePlus, Camera,
  ChevronDown
} from 'lucide-react';
import { WorkshopStation, Branch, User, WorkshopDrawerWithItems } from '../types';
import Lightbox from '../components/Lightbox';
import { supabase } from '../supabase';

const SUPABASE_URL = 'https://cuctnnsgvxhomxobpchi.supabase.co';

interface WorkshopModuleProps {
  user: User;
  simulationBranchId: string;
  branches: Branch[];
  stations: WorkshopStation[];
  onRefresh: () => void;
  refreshTrigger: number;
}

const WorkshopModule: React.FC<WorkshopModuleProps> = ({ user, simulationBranchId, branches, stations, onRefresh, refreshTrigger }) => {
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isStationModalOpen, setIsStationModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<WorkshopStation | null>(null);
  const [drawers, setDrawers] = useState<WorkshopDrawerWithItems[]>([]);
  const [isLoadingDrawers, setIsLoadingDrawers] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Drawer Edit state (Existing)
  const [isEditInventoryOpen, setIsEditInventoryOpen] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<WorkshopDrawerWithItems | null>(null);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);

  // NEW DRAWER MODAL STATE (Mirroring Fleet Logic)
  const [isAddDrawerModalOpen, setIsAddDrawerModalOpen] = useState(false);
  const [newDrawerName, setNewDrawerName] = useState('');
  const [newDrawerPhoto, setNewDrawerPhoto] = useState<File | null>(null);
  const [newDrawerPhotoPreview, setNewDrawerPhotoPreview] = useState<string | null>(null);
  const [newDrawerItems, setNewDrawerItems] = useState<any[]>([{ lp: 1, name: '', szt: 1 }]);

  // STATION FORM STATE
  const [sName, setSName] = useState('');
  const [sType, setSType] = useState<'szafka' | 'sprzet'>('szafka');
  const [sBranch, setSBranch] = useState('1');
  const [sStatus, setSStatus] = useState<'AKTYWNY' | 'KONSERWACJA' | 'WOLNY'>('AKTYWNY');

  const canManage = user.role === 'ADMINISTRATOR' || user.role === 'DORADCA SERWISOWY';
  const selectedStation = useMemo(() => stations.find(s => String(s.id) === String(selectedStationId)), [stations, selectedStationId]);

  const getPhotoUrl = (path: string | null) => {
    if (!path) return `${SUPABASE_URL}/storage/v1/object/public/garage-photos/placeholder.jpg`;
    if (path.startsWith('http')) return path;
    return `${SUPABASE_URL}/storage/v1/object/public/garage-photos/${path}`;
  };

  const fetchDrawers = async () => {
    if (!selectedStationId) return;
    setIsLoadingDrawers(true);
    try {
      const { data: drData } = await supabase.from('workshop_drawers').select('*').eq('station_id', selectedStationId).order('name');
      if (drData) {
        const withItems = await Promise.all(drData.map(async (d: any) => {
          const { data: items } = await supabase.from('workshop_inventory_items').select('*').eq('drawer_id', d.id).order('lp');
          return { ...d, items: items || [] };
        }));
        setDrawers(withItems as any);
      }
    } catch (e) { console.error("Error fetching workshop drawers:", e); }
    setIsLoadingDrawers(false);
  };

  useEffect(() => {
    if (selectedStationId) fetchDrawers();
  }, [selectedStationId, refreshTrigger]);

  const handleEditInventory = (drawer: WorkshopDrawerWithItems) => {
    setActiveDrawer(drawer);
    setInventoryItems([...drawer.items]);
    setIsEditInventoryOpen(true);
  };

  const handleSaveInventory = async () => {
    if (!activeDrawer) return;
    setIsSaving(true);
    try {
      await supabase.from('workshop_inventory_items').delete().eq('drawer_id', activeDrawer.id);
      const toInsert = inventoryItems
        .filter(item => item.name.trim() !== '')
        .map((item, index) => ({
          drawer_id: activeDrawer.id,
          lp: index + 1,
          name: item.name,
          szt: item.szt
        }));
      if (toInsert.length > 0) {
        const { error } = await supabase.from('workshop_inventory_items').insert(toInsert);
        if (error) throw error;
      }
      await fetchDrawers();
      setIsEditInventoryOpen(false);
    } catch (e: any) { alert(e.message); }
    setIsSaving(false);
  };

  // ATOMIC WORKSHOP DRAWER SAVING LOGIC
  const handleSaveNewDrawer = async () => {
    if (!newDrawerName || !selectedStationId) {
      alert("Proszę podać etykietę szuflady.");
      return;
    }
    
    setIsSaving(true);
    try {
      let photo_url = null;

      // 1. Upload photo to 'garage-photos' bucket
      if (newDrawerPhoto) {
        const fileName = `ws_drawer_${selectedStationId}_${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage.from('garage-photos').upload(fileName, newDrawerPhoto);
        if (uploadError) throw uploadError;
        photo_url = fileName;
      }

      // 2. Insert into 'workshop_drawers'
      const { data: drawerData, error: drawerError } = await supabase
        .from('workshop_drawers')
        .insert([{ 
          station_id: selectedStationId, 
          name: newDrawerName, 
          image_url: photo_url 
        }])
        .select()
        .single();

      if (drawerError) throw drawerError;

      // 3. Bulk insert items
      const itemsToInsert = newDrawerItems
        .filter(i => i.name.trim() !== '')
        .map((item, index) => ({
          drawer_id: drawerData.id,
          lp: index + 1,
          name: item.name,
          szt: item.szt
        }));

      if (itemsToInsert.length > 0) {
        const { error: itemsError } = await supabase.from('workshop_inventory_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;
      }

      alert("Szuflada warsztatowa dodana!");
      setIsAddDrawerModalOpen(false);
      setNewDrawerName('');
      setNewDrawerPhoto(null);
      setNewDrawerPhotoPreview(null);
      setNewDrawerItems([{ lp: 1, name: '', szt: 1 }]);
      await fetchDrawers();
    } catch (e: any) { 
      alert("Błąd: " + e.message); 
    }
    setIsSaving(false);
  };

  const handleSaveStation = async () => {
    if (!sName) return;
    setIsSaving(true);
    try {
      const payload = { name: sName, type: sType, branch_id: Number(sBranch), status: sStatus };
      if (editingStation) {
        const { error } = await supabase.from('workshop_stations').update(payload).eq('id', editingStation.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('workshop_stations').insert([payload]);
        if (error) throw error;
      }
      onRefresh();
      setIsStationModalOpen(false);
      setEditingStation(null);
    } catch (e: any) { alert(e.message); }
    setIsSaving(false);
  };

  const handleDeleteStation = async (id: string) => {
    if (!confirm('USUNĄĆ ZASÓB WARSZTATOWY?')) return;
    try {
      const { error } = await supabase.from('workshop_stations').delete().eq('id', id);
      if (error) throw error;
      onRefresh();
      setSelectedStationId(null);
    } catch (e: any) { alert(e.message); }
  };

  const filteredStations = useMemo(() => {
    return stations.filter(s => {
      const branchMatch = simulationBranchId === 'all' || Number(s.branch_id) === Number(simulationBranchId);
      const searchMatch = !searchTerm || s.name?.toLowerCase().includes(searchTerm.toLowerCase());
      return branchMatch && searchMatch;
    });
  }, [stations, simulationBranchId, searchTerm]);

  if (selectedStation) {
    return (
      <div className="p-8 lg:p-14 space-y-12 animate-in slide-in-from-right duration-700 pb-32">
        <button onClick={() => setSelectedStationId(null)} className="group flex items-center space-x-4 text-slate-400 hover:text-[#0f172a] font-black uppercase text-[11px] tracking-[0.3em] bg-white px-8 py-4 rounded-3xl shadow-sm border border-slate-100 transition-all">
          <ArrowLeft size={18} className="group-hover:-translate-x-2 transition-transform" /> <span>Lista Stanowisk</span>
        </button>
        
        <div className="bg-[#0f172a] p-12 rounded-[4rem] shadow-2xl flex flex-col lg:flex-row items-center gap-12 border-b-8 border-[#22c55e] relative overflow-hidden">
           <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
              <Warehouse size={300} className="text-white" />
           </div>
           <div className="w-48 h-48 bg-slate-50 rounded-[3rem] overflow-hidden cursor-zoom-in group relative border-8 border-white/10 shadow-2xl shrink-0 z-10" onClick={() => setLightboxImage(getPhotoUrl(selectedStation.photo_path || null))}>
               <img src={getPhotoUrl(selectedStation.photo_path || null)} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" alt="" />
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-sm"><ZoomIn size={32} className="text-white"/></div>
           </div>
           <div className="flex-1 z-10">
              <h2 className="text-6xl font-black text-white uppercase italic tracking-tighter leading-none drop-shadow-lg">{selectedStation.name}</h2>
              <div className="flex items-center space-x-6 mt-6">
                <p className="text-[#22c55e] text-xs font-black uppercase tracking-[0.5em]">{selectedStation.type.toUpperCase()}</p>
                <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${selectedStation.status === 'AKTYWNY' ? 'bg-green-500 text-white' : 'bg-rose-500 text-white animate-pulse'}`}>{selectedStation.status}</div>
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center italic"><MapPin size={12} className="mr-2"/> {branches.find(b => String(b.id) === String(selectedStation.branch_id))?.name || 'HUB'}</p>
              </div>
           </div>
           {canManage && (
              <button onClick={() => { setEditingStation(selectedStation); setSName(selectedStation.name); setSType(selectedStation.type); setSBranch(String(selectedStation.branch_id)); setSStatus(selectedStation.status); setIsStationModalOpen(true); }} className="relative z-10 p-8 bg-white/5 text-white rounded-[2.5rem] shadow-2xl hover:bg-[#22c55e] transition-all border border-white/10">
                <Settings size={24}/>
              </button>
           )}
        </div>

        <div className="space-y-16">
            <div className="flex items-center justify-between">
              <h3 className="text-3xl font-black text-[#0f172a] uppercase tracking-tighter italic border-l-8 border-[#22c55e] pl-8 py-2">Ewidencja Wewnętrzna</h3>
              {canManage && selectedStation.type === 'szafka' && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsAddDrawerModalOpen(true); }}
                  className="px-8 py-4 bg-[#22c55e] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-[#1eb354] transition-all flex items-center space-x-3 active:scale-95"
                >
                  <Plus size={16}/> <span>Dodaj Szufladę</span>
                </button>
              )}
            </div>
            
            {selectedStation.type === 'sprzet' ? (
              <div className="p-20 bg-slate-50 rounded-[4rem] border-4 border-dashed border-slate-200 text-center space-y-6">
                <Wrench size={64} className="mx-auto text-slate-200" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-sm italic">To urządzenie nie posiada szuflad inwentaryzacyjnych</p>
              </div>
            ) : isLoadingDrawers ? (
              <div className="flex justify-center p-32"><Loader className="animate-spin text-[#22c55e]" size={56} /></div>
            ) : drawers.length === 0 ? (
               <div className="p-20 bg-white rounded-[4rem] border-4 border-dashed border-slate-200 text-center flex flex-col items-center justify-center space-y-8">
                  <Package size={64} className="text-slate-100" />
                  <p className="text-slate-300 font-black uppercase tracking-widest text-sm italic">Brak zdefiniowanych szuflad</p>
                  {canManage && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsAddDrawerModalOpen(true); }}
                      className="px-12 py-5 bg-[#22c55e] text-white rounded-3xl font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center space-x-4 active:scale-95"
                    >
                      <Plus size={20}/> <span>DODAJ PIERWSZĄ SZUFLADĘ</span>
                    </button>
                  )}
               </div>
            ) : drawers.map(drawer => (
              <div key={drawer.id} className="bg-white rounded-[4rem] shadow-2xl border border-slate-100 overflow-hidden relative group hover:border-[#22c55e]/30 transition-all">
                 <div className="bg-slate-50/80 p-10 flex justify-between items-center border-b border-slate-200">
                    <div className="flex items-center space-x-10">
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
                        <Edit2 size={16}/> <span>Edytuj Inwentarz</span>
                      </button>
                    )}
                 </div>
                 <div className="p-12 overflow-x-auto no-scrollbar">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b-4 border-slate-50">
                          <th className="py-6 px-8 text-[11px] font-black uppercase text-slate-400 tracking-[0.3em] w-28 text-center">Lp</th>
                          <th className="py-6 px-8 text-[11px] font-black uppercase text-slate-400 tracking-[0.3em]">Wyposażenie / Nazwa Systemowa</th>
                          <th className="py-6 px-8 text-[11px] font-black uppercase text-slate-400 tracking-[0.3em] text-center w-44">Ilość Stanowa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-slate-50">
                        {drawer.items.length === 0 ? (
                          <tr><td colSpan={3} className="py-12 text-center text-slate-300 font-black uppercase tracking-widest text-xs italic">Szuflada pusta</td></tr>
                        ) : drawer.items.map(item => (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-all group/row">
                            <td className="py-6 px-8 font-mono text-base font-black text-slate-400 text-center">{item.lp}</td>
                            <td className="py-6 px-8 text-base font-bold uppercase text-slate-800">{item.name}</td>
                            <td className="py-6 px-8 text-xl font-black text-[#0f172a] text-center uppercase tracking-tighter">
                              {item.szt} <span className="text-[10px] text-slate-300 ml-1 italic">SZT</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                 </div>
              </div>
            ))}
        </div>

        {/* NOWA SZUFLADA WARSZTATOWA MODAL (Mirroring Fleet) */}
        {isAddDrawerModalOpen && (
          <div className="fixed inset-0 z-[6000] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-[#0f172a]/95 backdrop-blur-xl" onClick={() => setIsAddDrawerModalOpen(false)}></div>
            <div className="relative w-full max-w-5xl bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
               <div className="bg-[#0f172a] p-10 text-white flex justify-between items-center shrink-0 border-b-8 border-[#22c55e]">
                  <div className="flex items-center space-x-6">
                     <div className="w-16 h-16 bg-[#22c55e] rounded-2xl flex items-center justify-center shadow-xl"><Package size={28}/></div>
                     <div>
                       <h3 className="text-3xl font-black uppercase italic leading-none">Nowa Szuflada Warsztatowa</h3>
                       <p className="text-[#22c55e] text-[9px] font-black uppercase tracking-widest mt-2">Inwentaryzacja Wyposażenia Stacjonarnego</p>
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
                             placeholder="np. Szuflada Górna #1" 
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
                                  <p className="text-[10px] font-black text-slate-300 uppercase mt-4 italic">Kliknij aby wgrać zdjęcie</p>
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
    <div className="p-8 lg:p-14 space-y-20 animate-in fade-in duration-1000 pb-32">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 bg-[#0f172a] p-12 rounded-[4rem] shadow-2xl relative overflow-hidden border-b-8 border-[#22c55e]">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <Warehouse size={400} className="text-white" />
        </div>
        <div className="relative z-10">
            <h2 className="text-6xl font-black text-white tracking-tighter uppercase mb-4 italic leading-none drop-shadow-lg">Mój Warsztat</h2>
            <p className="text-[#22c55e] text-[11px] font-black uppercase tracking-[0.5em] flex items-center">
              <Warehouse size={16} className="mr-4" /> Zarządzanie infrastrukturą stacjonarną HUB
            </p>
        </div>
        <div className="relative z-10 flex items-center space-x-6 w-full lg:w-auto">
          <div className="relative group flex-1 lg:w-[400px]">
             <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-[#22c55e] transition-colors" size={22} />
             <input type="text" placeholder="Szukaj stanowiska..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-20 pr-8 py-5 bg-slate-800 text-white border border-slate-700 rounded-[2.2rem] text-sm font-black outline-none focus:border-[#22c55e] transition-all uppercase" />
          </div>
          {canManage && (
            <button 
              onClick={() => { setEditingStation(null); setSName(''); setSType('szafka'); setIsStationModalOpen(true); }}
              className="px-12 py-6 bg-[#22c55e] text-white rounded-[2.2rem] text-[11px] font-black uppercase tracking-widest shadow-2xl hover:bg-[#1eb354] transition-all border-b-4 border-green-800 active:scale-95 flex items-center space-x-4"
            >
              <Plus size={20}/><span>Dodaj Zasób</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12 relative z-10">
        {filteredStations.map((s: any) => (
          <div key={s.id} onClick={() => setSelectedStationId(s.id)} className="bg-white rounded-[4rem] p-10 border border-slate-100 group transition-all duration-700 hover:shadow-3xl hover:-translate-y-6 cursor-pointer shadow-2xl relative overflow-hidden flex flex-col h-[520px]">
            <div className="relative h-64 rounded-[3rem] overflow-hidden mb-10 border-8 border-slate-50 shadow-2xl group/img">
              <img src={getPhotoUrl(s.photo_path || null)} className="w-full h-full object-cover transition-transform group-hover:scale-125 duration-1000" alt="" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                <ZoomIn className="text-white" size={48} />
              </div>
            </div>
            <div className="flex flex-col flex-1 px-2">
              <h4 className="font-black text-[#0f172a] uppercase text-3xl mb-4 italic group-hover:text-[#22c55e] transition-colors leading-none tracking-tighter">{s.name}</h4>
              <div className="mt-auto pt-8 border-t-2 border-slate-50 flex items-center justify-between">
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] leading-none italic">Typ Zasobu</p>
                  <p className="text-sm font-black text-[#0f172a] uppercase tracking-widest flex items-center">
                    {s.type === 'sprzet' ? <Wrench size={14} className="mr-2 text-blue-500" /> : <Warehouse size={14} className="mr-2 text-[#22c55e]" />}
                    {s.type === 'sprzet' ? 'URZĄDZENIE' : 'SZAFKA'}
                  </p>
                </div>
                {canManage && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditingStation(s); setSName(s.name); setSType(s.type); setSBranch(String(s.branch_id)); setSStatus(s.status); setIsStationModalOpen(true); }}
                    className="p-5 bg-slate-50 text-slate-300 hover:text-[#0f172a] rounded-[1.8rem] transition-all hover:rotate-12 border border-slate-100"
                  >
                    <Settings size={22} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* DRAWER INVENTORY MODAL (EXISTING) */}
      {isEditInventoryOpen && activeDrawer && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-[#0f172a]/95 backdrop-blur-xl" onClick={() => setIsEditInventoryOpen(false)}></div>
           <div className="relative w-full max-w-4xl bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
              <div className="bg-[#0f172a] p-10 text-white flex justify-between items-center shrink-0 border-b-8 border-[#22c55e]">
                 <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 bg-[#22c55e] rounded-2xl flex items-center justify-center"><Package size={28}/></div>
                    <div>
                      <h3 className="text-3xl font-black uppercase italic leading-none">{activeDrawer.name}</h3>
                      <p className="text-[#22c55e] text-[9px] font-black uppercase tracking-widest mt-2">Zarządzanie Stanem Szuflady Warsztatowej</p>
                    </div>
                 </div>
                 <button onClick={() => setIsEditInventoryOpen(false)} className="p-4 bg-white/10 rounded-full hover:bg-white/20"><X size={24}/></button>
              </div>
              <div className="flex-1 p-10 overflow-y-auto no-scrollbar space-y-8">
                 {inventoryItems.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 group">
                       <div className="w-12 text-center font-mono font-black text-slate-300">{idx + 1}</div>
                       <input 
                         type="text" 
                         value={item.name} 
                         placeholder="Nazwa wyposażenia"
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
                 <button onClick={() => setInventoryItems([...inventoryItems, { name: '', szt: '1' }])} className="w-full py-4 border-4 border-dashed border-slate-100 text-slate-300 rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:border-[#22c55e] hover:text-[#22c55e] transition-all flex items-center justify-center space-x-3 active:scale-95">
                   <PackagePlus size={18}/> <span>Dodaj Pozycję Inwentarzową</span>
                 </button>
              </div>
              <div className="p-10 border-t border-slate-100 flex justify-end shrink-0">
                  <button onClick={handleSaveInventory} disabled={isSaving} className="px-12 py-5 bg-[#22c55e] text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl flex items-center space-x-3 active:scale-95 disabled:opacity-50">
                    {isSaving ? <Loader className="animate-spin" size={20}/> : <Save size={20}/>}
                    <span>Zapisz Zmiany</span>
                  </button>
              </div>
           </div>
        </div>
      )}

      {/* STATION MODAL */}
      {isStationModalOpen && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-[#0f172a]/95 backdrop-blur-xl" onClick={() => setIsStationModalOpen(false)}></div>
           <div className="relative w-full max-w-3xl bg-white rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 flex flex-col max-h-[90vh]">
              <div className="bg-[#0f172a] p-12 text-white flex justify-between items-center shrink-0 border-b-8 border-[#22c55e]">
                 <div className="flex items-center space-x-8">
                   <div className="w-24 h-24 bg-[#22c55e] rounded-[1.8rem] flex items-center justify-center shadow-2xl shadow-green-500/20"><Warehouse size={36}/></div>
                   <div>
                     <h3 className="text-4xl font-black uppercase tracking-tighter italic leading-none">{editingStation ? 'Edytuj Zasób' : 'Nowy Zasób'}</h3>
                     <p className="text-[#22c55e] text-[10px] font-black uppercase tracking-[0.5em] mt-3 italic">Konfiguracja Stanowiska Warsztatowego</p>
                   </div>
                 </div>
                 <button onClick={() => setIsStationModalOpen(false)} className="p-6 bg-white/10 rounded-full hover:bg-white/20 border border-white/10 transition-all active:scale-90"><X size={30} /></button>
              </div>
              <div className="flex-1 p-12 space-y-10 overflow-y-auto no-scrollbar">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6 italic">Nazwa Stanowiska / Opis</label>
                    <input type="text" value={sName} onChange={e => setSName(e.target.value)} placeholder="np. Szafka Narzędziowa Beta #4" className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] font-black uppercase outline-none focus:border-[#22c55e] shadow-inner transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6 italic">Typ</label>
                      <select value={sType} onChange={e => setSType(e.target.value as any)} className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] font-black uppercase outline-none focus:border-[#22c55e] appearance-none shadow-inner cursor-pointer">
                        <option value="szafka">SZAFKA Z SZUFLADAMI</option>
                        <option value="sprzet">URZĄDZENIE / SPRZĘT</option>
                      </select>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6 italic">Stacja Bazowa</label>
                      <select value={sBranch} onChange={e => setSBranch(e.target.value)} className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] font-black uppercase outline-none focus:border-[#22c55e] appearance-none shadow-inner cursor-pointer">
                        {branches.map(b => <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-6 italic">Status Operacyjny</label>
                    <select value={sStatus} onChange={e => setSStatus(e.target.value as any)} className="w-full px-8 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] font-black uppercase outline-none focus:border-[#22c55e] appearance-none shadow-inner cursor-pointer">
                      <option value="AKTYWNY">AKTYWNY</option>
                      <option value="KONSERWACJA">KONSERWACJA</option>
                      <option value="WOLNY">WOLNY</option>
                    </select>
                  </div>
                  <div className="pt-6 flex space-x-4">
                    {editingStation && (
                       <button onClick={() => handleDeleteStation(editingStation.id)} className="p-7 bg-rose-50 text-rose-500 rounded-[2.5rem] hover:bg-rose-500 hover:text-white transition-all shadow-xl active:scale-95"><Trash2 size={24}/></button>
                    )}
                    <button 
                      onClick={handleSaveStation} 
                      disabled={isSaving}
                      className="flex-1 py-7 bg-[#22c55e] text-white rounded-[2.5rem] font-black uppercase tracking-widest shadow-2xl hover:bg-[#1eb354] transition-all border-b-8 border-green-800 flex items-center justify-center space-x-4 active:scale-95 disabled:opacity-50"
                    >
                      {isSaving ? <Loader className="animate-spin" size={24} /> : <Save size={24} />}
                      <span>{editingStation ? 'Zapisz Zmiany' : 'Dodaj Zasób'}</span>
                    </button>
                  </div>
              </div>
           </div>
        </div>
      )}

      <Lightbox isOpen={!!lightboxImage} imageUrl={lightboxImage || ''} onClose={() => setLightboxImage(null)} />
    </div>
  );
};

export default WorkshopModule;
