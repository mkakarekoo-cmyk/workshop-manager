
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Toast, { ToastProps } from './components/Toast';
import OrderRequestModal from './components/OrderRequestModal';
import ToolsModule from './modules/ToolsModule';
import UsersModule from './modules/UsersModule';
import ScheduleModule from './modules/ScheduleModule';
import DashboardModule from './modules/DashboardModule';
import { User, ModuleType, Branch, AppNotification, ToolStatus } from './types';
import { supabase } from './supabase';

const MOCK_BRANCHES: Branch[] = [
  { id: '1', name: 'Porosły (HUB)', location: 'Porosły' },
  { id: '2', name: 'Karniewo', location: 'Karniewo' },
  { id: '3', name: 'Łomża', location: 'Łomża' },
  { id: '4', name: 'Brzozów', location: 'Brzozów' },
  { id: '5', name: 'Suwałki', location: 'Suwałki' },
  { id: '6', name: 'Serwis Porosły', location: 'Porosły' },
];

const MASTER_ADMIN_EMAIL = 'm.kakarekoo@gmail.com';
const SPECIAL_USER_ADAM = 'adam.wnorowski@contractus.com.pl';
const SPECIAL_USER_KARNIEWO = 'serwis.karniewo@contractus.com.pl';
const SPECIAL_USER_ANDRZEJ = 'andrzej.chlabicz@contractus.com.pl';
const SPECIAL_USER_MATEUSZ_HUB = 'mateusz.kakareko@contractus.com.pl';

// LISTA KONT MECHANIKÓW DO AUTOMATYCZNEGO PRZYPISANIA STATUSU
const MECHANIC_EMAILS = [
  'marek.hapon@contractus.com.pl',
  'adam.dera@contractus.com.pl',
  'andrzej.romaniuk@contractus.com.pl',
  'pawel.orlowski@contractus.com.pl',
  'mariusz.gromko@contractus.com.pl',
  'mateusz.kakareko@contractus.com.pl',
  'marek.kietlinski@contractus.com.pl',
  'piotr.misko@contractus.com.pl',
  'tomasz.radziwon@contractus.com.pl',
  'jaroslaw.wnorowski@contractus.com.pl',
  'krzysztof.kakareko@contractus.com.pl',
  'maksymilian.czeczko@contractus.com.pl',
  'tomasz.raciborski@contractus.com.pl',
  'konrad.ostrowski@contractus.com.pl',
  'bartlomiej.zajkowski@contractus.com.pl',
  'patryk.sak@contractus.com.pl',
  'kamil.staskiewicz@contractus.com.pl',
  'lukasz.brodowski@contractus.com.pl',
  'przemyslaw.kuligowski@contractus.com.pl',
  'mateusz.zdzichowski@contractus.com.pl',
  'krzysztof.mazur@contractus.com.pl',
  'zbigniew.wolinski@contractus.com.pl',
  'damian.skarzynski@contractus.com.pl',
  'grzegorz.borkowski@contractus.com.pl',
  'marcin.pierzynowski@contractus.com.pl',
  'patryk.pikus@contractus.com.pl',
  'krzysztof.lewicki@contractus.com.pl',
  'przemyslaw.rozicki@contractus.com.pl',
  'robert.dzierzgowski@contractus.com.pl',
  'michal.modzelewski@contractus.com.pl',
  'adam.baginski@contractus.com.pl'
].map(email => email.toLowerCase());

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleType>('BAZA NARZĘDZI');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [simulationBranchId, setSimulationBranchId] = useState<string>('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toasts, setToasts] = useState<Omit<ToastProps, 'onClose'>[]>([]);
  const [lastReadAt, setLastReadAt] = useState<number>(Date.now());
  const [authError, setAuthError] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [targetToolId, setTargetToolId] = useState<string | null>(null);
  const [preselectedTargetBranchId, setPreselectedTargetBranchId] = useState<string | null>(null);
  const [pendingOrder, setPendingOrder] = useState<AppNotification | null>(null);
  
  const lastProcessedIdRef = useRef<string | null>(null);
  const [processedOrderIds, setProcessedOrderIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('processed_order_ids');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('processed_order_ids', JSON.stringify(processedOrderIds));
  }, [processedOrderIds]);

  const fetchAllUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('email');
      if (error) throw error;
      if (data) setAllUsers(data as User[]);
    } catch (e) {
      console.error("Fetch Users Error:", e);
    }
  }, []);

  const fetchProfile = useCallback(async (userId: string, email?: string) => {
    try {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      
      const userEmail = (email || '').toLowerCase();
      let finalRole = profile?.role || 'MECHANIK';
      let finalBranch = profile?.branch_id ? String(profile.branch_id) : '1';

      // HIERARCHIA UPRAWNIEŃ I PRZYPISAŃ
      if (userEmail === MASTER_ADMIN_EMAIL.toLowerCase()) {
        finalRole = 'ADMINISTRATOR';
      } else if (userEmail === SPECIAL_USER_ADAM.toLowerCase()) {
        finalRole = 'DORADCA SERWISOWY';
        finalBranch = '6'; 
      } else if (userEmail === SPECIAL_USER_KARNIEWO.toLowerCase()) {
        finalRole = 'DORADCA SERWISOWY';
        finalBranch = '2'; 
      } else if (userEmail === SPECIAL_USER_ANDRZEJ.toLowerCase()) {
        finalRole = 'DORADCA SERWISOWY';
        finalBranch = '1'; 
      } else if (MECHANIC_EMAILS.includes(userEmail)) {
        // Jeśli email znajduje się na liście mechaników, nadpisujemy rolę
        finalRole = 'MECHANIK';
      }

      const finalUser: User = {
        id: userId,
        email: userEmail,
        role: finalRole as any,
        status: profile?.status || 'AKTYWNY',
        branch_id: finalBranch,
        first_name: profile?.first_name,
        last_name: profile?.last_name
      };
      
      setUser(finalUser);
      if (finalUser.role === 'ADMINISTRATOR') {
        setActiveModule('DASHBOARD');
      }
      
      setSimulationBranchId(finalUser.role === 'ADMINISTRATOR' ? 'all' : finalUser.branch_id || '1');
      if (finalUser.role === 'ADMINISTRATOR') fetchAllUsers();
    } catch (e) {
      console.error("Critical Profile Error:", e);
    } finally {
      setLoading(false);
    }
  }, [fetchAllUsers]);

  const addToast = (notif: AppNotification) => {
    const newToast = {
      id: notif.id,
      title: notif.title,
      message: notif.message,
      type: notif.type
    };
    setToasts(prev => {
      if (prev.some(t => t.id === notif.id)) return prev;
      return [newToast, ...prev].slice(0, 3);
    });
  };

  const fetchNotifications = useCallback(async (showToast = false) => {
    if (!user) return;
    try {
      const branchNum = Number(simulationBranchId === 'all' ? user.branch_id : simulationBranchId);
      
      const { data, error } = await supabase
        .from('tool_logs')
        .select('*, tool:tools(name, status, target_branch_id, id, branch_id), from_branch:branches!tool_logs_from_branch_id_fkey(name), to_branch:branches!tool_logs_to_branch_id_fkey(name)')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      if (data) {
        const mapped: AppNotification[] = data
          .map((log: any) => {
            let title = log.action;
            let message = `${log.tool?.name || 'Zasób'}: ${log.action}`;
            let type: 'INFO' | 'WARNING' | 'SUCCESS' = 'INFO';

            const logTime = new Date(log.created_at).getTime();
            const isRead = logTime <= lastReadAt;

            const isRelevant = 
              user.role === 'ADMINISTRATOR' || 
              Number(log.from_branch_id) === branchNum || 
              Number(log.to_branch_id) === branchNum ||
              Number(log.tool?.branch_id) === branchNum;

            if (!isRelevant) return null;

            if (log.action === 'PRZESUNIĘCIE') {
              const isToMe = Number(log.to_branch_id) === branchNum;
              if (isToMe) {
                title = 'NARZĘDZIE W DRODZE';
                message = `Oddział ${log.from_branch?.name || 'Inny'} wysłał: ${log.tool?.name}`;
                type = 'INFO';
              } else {
                title = 'WYSYŁKA';
                message = `Wysłano ${log.tool?.name} do: ${log.to_branch?.name || 'Inny'}`;
                type = 'INFO';
              }
            } else if (log.action === 'ZAMÓWIENIE') {
              const isOwnerOfRequestedTool = Number(log.from_branch_id) === branchNum;
              title = isOwnerOfRequestedTool ? 'NOWE ZAPOTRZEBOWANIE' : 'TWOJA PROŚBA O NARZĘDZIE';
              message = isOwnerOfRequestedTool 
                ? `Oddział ${log.to_branch?.name || 'Inny'} wysłał zapytanie o: ${log.tool?.name}`
                : `Wysłano Twoją prośbę o narzędzie: ${log.tool?.name}`;
              type = 'WARNING';
            } else if (log.action === 'PRZYJĘCIE') {
              const isToMe = Number(log.to_branch_id) === branchNum;
              title = isToMe ? 'PRZESYŁKA DOTARŁA' : 'ODEBRANO ZASÓB';
              message = isToMe ? `${log.tool?.name} jest w Twoim oddziale!` : `Przyjęto ${log.tool?.name} w ${log.to_branch?.name}`;
              type = 'SUCCESS';
            } else if (log.action === 'ODMOWA') {
               title = 'ODMOWA PRZEKAZANIA';
               message = log.notes;
               type = 'WARNING';
            }

            return {
              id: log.id,
              title,
              message,
              type,
              created_at: log.created_at,
              is_read: isRead,
              tool_id: log.tool?.id,
              raw_log: log
            };
          }).filter(n => n !== null);

        const unhandledOrder = mapped.find(n => 
          n.raw_log?.action === 'ZAMÓWIENIE' && 
          Number(n.raw_log?.from_branch_id) === branchNum &&
          !processedOrderIds.includes(n.id) &&
          n.raw_log?.tool?.status !== 'W DRODZE'
        );

        if (unhandledOrder) {
          setProcessedOrderIds(prev => [...new Set([...prev, unhandledOrder.id])]);
          setPendingOrder(unhandledOrder);
          try { new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play().catch(() => {}); } catch(e){}
        } else if (mapped.length > 0) {
          const newest = mapped[0];
          const logAgeMs = Date.now() - new Date(newest.created_at).getTime();
          const isMyIncomingOrder = newest.raw_log?.action === 'ZAMÓWIENIE' && Number(newest.raw_log?.from_branch_id) === branchNum;
          
          if (newest.id !== lastProcessedIdRef.current && showToast && logAgeMs < 120000 && !isMyIncomingOrder) {
            addToast(newest);
            try { new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3').play().catch(() => {}); } catch(e){}
            lastProcessedIdRef.current = newest.id;
          }
        }
        
        setNotifications(mapped);
      }
    } catch (e) {
      console.error("Sync Error:", e);
    }
  }, [user, simulationBranchId, lastReadAt, processedOrderIds]);

  const handleConfirmOrder = (order: AppNotification) => {
    if (order.tool_id) {
      setActiveModule('BAZA NARZĘDZI');
      setTargetToolId(order.tool_id);
      setPreselectedTargetBranchId(String(order.raw_log.to_branch_id));
    }
    setPendingOrder(null);
  };

  const handleRejectOrder = async (order: AppNotification) => {
    if (!user) return;
    try {
      await supabase.from('tool_logs').insert({
        tool_id: order.tool_id,
        action: 'ODMOWA',
        from_branch_id: Number(order.raw_log?.from_branch_id),
        to_branch_id: Number(order.raw_log?.to_branch_id),
        notes: `Oddział ${order.raw_log?.from_branch?.name || ''} odmówił przekazania narzędzia: ${order.raw_log?.tool?.name}. Zasób niezbędny na miejscu.`,
        operator_id: user.id
      });
      setPendingOrder(null);
      onRefresh();
    } catch (e) {
      console.error("Reject Error:", e);
    }
  };

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('realtime-logistics')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tool_logs' },
        () => {
          fetchNotifications(true);
          setRefreshTrigger(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchNotifications]);

  const markNotificationsRead = () => {
    setLastReadAt(Date.now());
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleNotificationClick = (n: AppNotification) => {
    const branchNum = Number(simulationBranchId === 'all' ? user?.branch_id : simulationBranchId);
    const isOrderDirectedToMe = n.raw_log?.action === 'ZAMÓWIENIE' && Number(n.raw_log?.from_branch_id) === branchNum;

    if (isOrderDirectedToMe) {
      setPendingOrder(n);
    } else if (n.tool_id) {
      setActiveModule('BAZA NARZĘDZI');
      setTargetToolId(n.tool_id);
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) await fetchProfile(session.user.id, session.user.email);
      else setLoading(false);
    };
    init();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        fetchProfile(session.user.id, session.user.email);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('processed_order_ids');
        setProcessedOrderIds([]);
      }
    });
    return () => authListener.subscription.unsubscribe();
  }, [fetchProfile]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(() => fetchNotifications(), 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center space-y-8">
      <div className="w-24 h-24 border-8 border-white/5 border-t-[#22c55e] rounded-full animate-spin"></div>
      <p className="font-black text-[#22c55e] uppercase tracking-[1em] animate-pulse text-xs text-center">Inicjalizacja Systemu...</p>
    </div>
  );

  if (!user) return <Login 
    error={authError}
    onLogin={async (email, password) => {
      setAuthError(null);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setAuthError(error.message.includes("Invalid login") ? "Błędny login lub hasło" : error.message);
    }} 
  />;

  const onRefresh = () => {
    setRefreshTrigger(p => p + 1);
    fetchNotifications();
    if (user.role === 'ADMINISTRATOR') fetchAllUsers();
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafc] text-slate-900 font-inter overflow-hidden">
      
      {pendingOrder && (
        <OrderRequestModal 
          order={pendingOrder} 
          onConfirm={handleConfirmOrder} 
          onReject={handleRejectOrder} 
        />
      )}

      <div className="fixed top-10 right-10 z-[10000] pointer-events-none flex flex-col items-end">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} onClose={removeToast} />
        ))}
      </div>

      <Sidebar 
        user={user}
        branches={MOCK_BRANCHES}
        activeModule={activeModule} 
        onModuleChange={setActiveModule} 
        isOpen={isSidebarOpen} 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        simulationBranchId={simulationBranchId}
        setSimulationBranchId={setSimulationBranchId}
        isSuperAdmin={user.role === 'ADMINISTRATOR'}
      />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header 
          user={user}
          activeModule={activeModule} 
          onLogout={() => supabase.auth.signOut()}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
          onRefresh={onRefresh}
          notifications={notifications}
          onMarkRead={markNotificationsRead}
          onNotificationClick={handleNotificationClick}
        />
        <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          <div className="max-w-[1920px] mx-auto">
             {activeModule === 'DASHBOARD' && user.role === 'ADMINISTRATOR' && (
               <DashboardModule 
                 branches={MOCK_BRANCHES} 
                 refreshTrigger={refreshTrigger} 
               />
             )}
             {(activeModule === 'BAZA NARZĘDZI' || activeModule === 'MOJE NARZĘDZIA') && (
               <ToolsModule 
                  user={user} 
                  simulationBranchId={simulationBranchId} 
                  branches={MOCK_BRANCHES} 
                  refreshTrigger={refreshTrigger} 
                  onRefresh={onRefresh} 
                  viewMode={activeModule as any} 
                  targetToolId={targetToolId}
                  onTargetToolClear={() => setTargetToolId(null)}
                  preselectedTargetBranchId={preselectedTargetBranchId}
                  onPreselectedBranchClear={() => setPreselectedTargetBranchId(null)}
               />
             )}
             {activeModule === 'UŻYTKOWNICY' && (
               <UsersModule 
                user={user} 
                branches={MOCK_BRANCHES} 
                allUsers={allUsers} 
                onRefresh={onRefresh} 
                refreshTrigger={refreshTrigger} 
               />
             )}
             {activeModule === 'GRAFIK' && (
               <ScheduleModule 
                 user={user}
                 branches={MOCK_BRANCHES}
                 refreshTrigger={refreshTrigger}
               />
             )}
          </div>
          <footer className="w-full py-24 flex flex-col items-center justify-center space-y-6 mt-20 border-t border-slate-100 bg-white/50 backdrop-blur-sm">
            <p className="text-slate-300 text-[10px] font-black uppercase tracking-[1em] leading-none">
              © 2026 Menadżer Narzędzi - Realtime System
            </p>
            <div className="flex items-center space-x-6">
              <div className="h-[1px] w-16 bg-slate-100"></div>
              <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.4em] italic flex items-center">
                Created by <span className="text-[#22c55e] ml-4 hover:scale-110 transition-transform cursor-default">Mateusz Kakareko</span>
              </p>
              <div className="h-[1px] w-16 bg-slate-100"></div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default App;
