
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  MapPin, Clock, Info, Building2, Wrench, Search,
  Filter, LayoutGrid, CalendarDays, Loader, X, MoreHorizontal,
  RefreshCw
} from 'lucide-react';
import { ToolReservation, User, Branch } from '../types';
import { supabase } from '../supabase';

interface ScheduleModuleProps {
  user: User;
  branches: Branch[];
  refreshTrigger: number;
}

const ScheduleModule: React.FC<ScheduleModuleProps> = ({ user, branches, refreshTrigger }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [reservations, setReservations] = useState<ToolReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRes, setSelectedRes] = useState<ToolReservation | null>(null);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tool_reservations')
        .select('*, tool:tools(name), branch:branches(name)')
        .order('start_date');
      if (error) throw error;
      if (data) setReservations(data as any);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchReservations();
  }, [refreshTrigger]);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Poniedziałek jako pierwszy dzień
  };

  const monthNames = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];
  const weekDays = ["PON", "WT", "ŚR", "CZW", "PT", "SOB", "ND"];

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const totalDays = daysInMonth(year, month);
    const startOffset = firstDayOfMonth(year, month);
    const days = [];

    const prevMonthDays = daysInMonth(year, month - 1);
    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({ day: prevMonthDays - i, currentMonth: false, date: new Date(year, month - 1, prevMonthDays - i) });
    }

    for (let i = 1; i <= totalDays; i++) {
      days.push({ day: i, currentMonth: true, date: new Date(year, month, i) });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, currentMonth: false, date: new Date(year, month + 1, i) });
    }

    return days;
  }, [currentDate]);

  const isSameDay = (d1: Date, d2: Date) => 
    d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

  const getReservationsForDay = (date: Date) => {
    return reservations
      .filter(res => {
        const start = new Date(res.start_date);
        const end = new Date(res.end_date);
        const current = new Date(date);
        current.setHours(0,0,0,0);
        start.setHours(0,0,0,0);
        end.setHours(0,0,0,0);
        return current >= start && current <= end;
      })
      // Sortowanie po ID jest kluczowe, aby rezerwacja zawsze wpadała w ten sam "slot" pionowy
      .sort((a, b) => a.id.localeCompare(b.id));
  };

  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  return (
    <div className="min-h-screen bg-white animate-in fade-in duration-700">
      <div className="flex items-center justify-between px-10 py-8 border-b border-slate-100">
        <div className="flex items-center space-x-12">
          <div className="flex items-center space-x-4">
             <div className="w-12 h-12 bg-[#22c55e] rounded-xl flex items-center justify-center text-white shadow-lg">
                <CalendarIcon size={24}/>
             </div>
             <h2 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter">
               {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
             </h2>
          </div>
          <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            <button onClick={prevMonth} className="p-3 text-slate-400 hover:text-slate-800 hover:bg-white rounded-xl transition-all"><ChevronLeft size={20}/></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-6 py-2 bg-white text-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border border-slate-100">Dzisiaj</button>
            <button onClick={nextMonth} className="p-3 text-slate-400 hover:text-slate-800 hover:bg-white rounded-xl transition-all"><ChevronRight size={20}/></button>
          </div>
        </div>

        <div className="flex items-center space-x-6">
           <div className="flex -space-x-3">
              {branches.map(b => (
                <div key={b.id} title={b.name} className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-black text-white shadow-md ${
                  b.id === '6' ? 'bg-amber-500' : b.id === '1' ? 'bg-blue-500' : 'bg-green-500'
                }`}>
                  {b.name.charAt(0)}
                </div>
              ))}
           </div>
           <button onClick={fetchReservations} className="p-4 bg-slate-800 text-white rounded-2xl hover:bg-black transition-all shadow-xl">
             <RefreshCw size={18} className={loading ? 'animate-spin' : ''}/>
           </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-slate-100">
         {weekDays.map(day => (
           <div key={day} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{day}</div>
         ))}
      </div>

      <div className="grid grid-cols-7 auto-rows-[160px] bg-slate-100 gap-[1px] border-b border-slate-100">
         {calendarDays.map((item, idx) => {
           const dayReservations = getReservationsForDay(item.date);
           const isToday = isSameDay(item.date, new Date());
           
           return (
             <div key={idx} className={`relative p-0 flex flex-col transition-all overflow-hidden ${item.currentMonth ? 'bg-white' : 'bg-slate-50/50'}`}>
                <div className="flex justify-between items-start p-2 mb-1">
                  <span className={`text-[12px] font-black p-2 rounded-full w-8 h-8 flex items-center justify-center ${isToday ? 'bg-[#22c55e] text-white shadow-lg' : item.currentMonth ? 'text-slate-800' : 'text-slate-300'}`}>
                    {item.day}
                  </span>
                </div>
                
                <div className="space-y-1 relative h-full">
                   {dayReservations.map((res) => {
                     const isStart = isSameDay(new Date(res.start_date), item.date);
                     const isEnd = isSameDay(new Date(res.end_date), item.date);
                     const isMonday = item.date.getDay() === 1; // 1 = Monday
                     
                     // Wyświetlamy tekst tylko w dniu startu LUB w każdy poniedziałek (jeśli event trwa dłużej)
                     const showText = isStart || isMonday;
                     
                     const branchColor = res.branch_id === 6 ? 'bg-amber-500' : res.branch_id === 1 ? 'bg-blue-600' : 'bg-[#22c55e]';
                     
                     return (
                       <div 
                         key={res.id} 
                         onClick={() => setSelectedRes(res)}
                         className={`h-6 flex items-center text-[8px] font-black text-white uppercase tracking-tighter cursor-pointer transition-all hover:brightness-110 shadow-sm
                           ${branchColor} 
                           ${isStart ? 'rounded-l-md ml-1' : 'ml-0'} 
                           ${isEnd ? 'rounded-r-md mr-1' : 'mr-0'}
                         `}
                       >
                         {showText && (
                           <div className="flex items-center px-2 truncate">
                             {isStart && <Wrench size={10} className="mr-2 shrink-0"/>}
                             <span className="truncate">{res.tool?.name} ({res.branch?.name})</span>
                           </div>
                         )}
                       </div>
                     );
                   })}
                </div>
             </div>
           );
         })}
      </div>

      {selectedRes && (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-6 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedRes(null)}></div>
           <div className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
              <div className="bg-[#0f172a] p-10 text-white flex justify-between items-center border-b-8 border-[#22c55e]">
                 <div className="flex items-center space-x-6">
                    <div className="w-14 h-14 bg-[#22c55e] rounded-2xl flex items-center justify-center"><CalendarIcon size={24}/></div>
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter">Informacja o Rezerwacji</h3>
                 </div>
                 <button onClick={() => setSelectedRes(null)} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all"><X size={20}/></button>
              </div>
              <div className="p-10 space-y-8">
                 <div className="flex items-center space-x-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-800 shadow-sm border border-slate-100"><Wrench size={24}/></div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Narzędzie</p>
                      <h4 className="text-xl font-black uppercase italic text-[#0f172a] tracking-tight">{selectedRes.tool?.name}</h4>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Zarezerwował</p>
                       <p className="text-[12px] font-black text-slate-800 uppercase italic leading-none">{selectedRes.branch?.name}</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 italic">Termin</p>
                       <p className="text-[10px] font-black text-slate-800 uppercase italic">{selectedRes.start_date} - {selectedRes.end_date}</p>
                    </div>
                 </div>

                 <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100 italic">
                    <p className="text-amber-800 font-bold uppercase text-[11px] leading-relaxed">Uwagi: {selectedRes.notes || "Brak dodatkowych uwag."}</p>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleModule;
