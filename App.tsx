
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Toast, { ToastProps } from './components/Toast';
import OrderRequestModal from './components/OrderRequestModal';
import ChangePasswordModal from './components/ChangePasswordModal';
import ToolsModule from './modules/ToolsModule';
import UsersModule from './modules/UsersModule';
import ScheduleModule from './modules/ScheduleModule';
import DashboardModule from './modules/DashboardModule';
import FleetRedirect from './components/FleetRedirect';
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
const SPECIAL_USER_ADAM = 'adam.wnorowski@contractus.com.pl'; // Serwis Porosły (6)
const SPECIAL_USER_KARNIEWO = 'serwis.karniewo@contractus.com.pl'; // Karniewo (2)
const SPECIAL_USER_ANDRZEJ = 'andrzej.chlabicz@contractus.com.pl'; // Porosły (1)
const SPECIAL_USER_LOMZA = 'serwis.lomza@contractus.com.pl'; // Łomża (3)

const MECHANIC_DATA: Record<string, { branchId: string }> = {
  'marek.hapon@contractus.com.pl': { branchId: '1' },
  'adam.dera@contractus.com.pl': { branchId: '1' },
  'andrzej.romaniuk@contractus.com.pl': { branchId: '1' },
  'pawel.orlowski@contractus.com.pl': { branchId: '1' },
  'mariusz.gromko@contractus.com.pl': { branchId: '1' },
  'mateusz.kakareko@contractus.com.pl': { branchId: '1' },
  'marek.kietlinski@contractus.com.pl': { branchId: '1' },
  'piotr.misko@contractus.com.pl': { branchId: '1' },
  'tomasz.radziwon@contractus.com.pl': { branchId: '1' },
  'jaroslaw.wnorowski@contractus.com.pl': { branchId: '1' },
  'krzysztof.kakareko@contractus.com.pl': { branchId: '1' },
  'maksymilian.czeczko@contractus.com.pl': { branchId: '1' },
  'tomasz.raciborski@contractus.com.pl': { branchId: '1' },
  'konrad.ostrowski@contractus.com.pl': { branchId: '1' },
  'bartlomiej.zajkowski@contractus.com.pl': { branchId: '1' },
  'patryk.sak@contractus.com.pl': { branchId: '1' },
  'mateusz.grabek@contractus.com.pl': { branchId: '5' },
  'kamil.staskiewicz@contractus.com.pl': { branchId: '5' },
  'lukasz.brodowski@contractus.com.pl': { branchId: '5' },
  'przemyslaw.kuligowski@contractus.com.pl': { branchId: '4' },
  'mateusz.zdzichowski@contractus.com.pl': { branchId: '4' },
  'krzysztof.mazur@contractus.com.pl': { branchId: '4' },
  'zbigniew.wolinski@contractus.com.pl': { branchId: '4' },
  'damian.skarzynski@contractus.com.pl': { branchId: '4' },
  'grzegorz.borkowski@contractus.com.pl': { branchId: '4' },
  'cezary.wiacek@contractus.com.pl': { branchId: '4' },
  'pawel.pytlak@contractus.com.pl': { branchId: '4' },
  'marcin.pierzynowski@contractus.com.pl': { branchId: '2' },
  'patryk.pikus@contractus.com.pl': { branchId: '2' },
  'krzysztof.lewicki@contractus.com.pl': { branchId: '2' },
  'przemyslaw.rozicki@contractus.com.pl': { branchId: '2' },
  'robert.dzierzgowski@contractus.com.pl': { branchId: '3' },
  'michal.modzelewski@contractus.com.pl': { branchId: '3' },
  'adam.baginski@contractus.com.pl': { branchId: '3' }
};

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
  const [activeOrderRequest, setActiveOrderRequest] = useState<AppNotification | null>(null);
  
  // KOLEJKA POWIADOMIEŃ
  const [pendingOrdersQueue, setPendingOrdersQueue] = useState<AppNotification[]>([]);
  const notifiedOrderIds = useRef<Set<string>>(new Set());
  
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  
  const [processedOrderIds, setProcessedOrderIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('processed_order_ids');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('processed_order_ids', JSON.stringify(processedOrderIds));
  }, [processedOrderIds]);

  const addToast = useCallback((title: string, message: string, type: 'INFO' | 'WARNING' | 'SUCCESS', onClick?: () => void) => {
    const id = Date.now().toString() + Math.random();
    setToasts(prev => [...prev, { id, title, message, type, onClick: onClick ? () => { onClick(); setToasts(current => current.filter(t => t.id !== id)); } : undefined }]);
  }, []);

  const fetchAllUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').order('email');
      if (error) throw error;
      if (data) setAllUsers(data as User[]);
    } catch (e) { console.error("Fetch Users Error:", e); }
  }, []);

  const fetchProfile = useCallback(async (userId: string, email?: string, registrationData?: { firstName: string, lastName: string }) => {
    try {
      let { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      const userEmail = (email || '').toLowerCase();
      let finalRole = profile?.role || 'MECHANIK';
      let finalBranch = profile?.branch_id ? String(profile.branch_id) : '1';

      if (userEmail === MASTER_ADMIN_EMAIL.toLowerCase()) {
        finalRole = 'ADMINISTRATOR';
        finalBranch = '1';
      } else if (userEmail === SPECIAL_USER_ADAM.toLowerCase()) {
        finalRole = 'DORADCA SERWISOWY';
        finalBranch = '6'; 
      } else if (userEmail === SPECIAL_USER_KARNIEWO.toLowerCase()) {
        finalRole = 'DORADCA SERWISOWY';
        finalBranch = '2'; 
      } else if (userEmail === SPECIAL_USER_ANDRZEJ.toLowerCase()) {
        finalRole = 'DORADCA SERWISOWY';
        finalBranch = '1'; 
      } else if (userEmail === SPECIAL_USER_LOMZA.toLowerCase()) {
        finalRole = 'DORADCA SERWISOWY';
        finalBranch = '3';
      } else if (MECHANIC_DATA[userEmail]) {
        finalRole = 'MECHANIK';
        finalBranch = MECHANIC_DATA[userEmail].branchId;
      }

      if (!profile) {
        const { data: newProfile, error: insertError } = await supabase.from('profiles').upsert({
          id: userId,
          email: userEmail,
          role: finalRole,
          branch_id: Number(finalBranch),
          first_name: registrationData?.firstName || 'Nowy',
          last_name: registrationData?.lastName || 'Pracownik',
          status: 'AKTYWNY'
        }, { onConflict: 'id' }).select().single();
        if (!insertError) profile = newProfile;
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
      if (finalUser.role === 'ADMINISTRATOR') setActiveModule('DASHBOARD');
      setSimulationBranchId(finalUser.role === 'ADMINISTRATOR' ? 'all' : finalUser.branch_id || '1');
      if (finalUser.role === 'ADMINISTRATOR') fetchAllUsers();
    } catch (e) { console.error("Critical Profile Error:", e); } finally { setLoading(false); }
  }, [fetchAllUsers]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const branchNum = Number(simulationBranchId === 'all' ? user.branch_id : simulationBranchId);
      const isManager = user.role === 'ADMINISTRATOR' || user.role === 'DORADCA SERWISOWY';

      const { data, error } = await supabase
        .from('tool_logs')
        .select('*, tool:tools(name, status, target_branch_id, id, branch_id), from_branch:branches!tool_logs_from_branch_id_fkey(name), to_branch:branches!tool_logs_to_branch_id_fkey(name)')
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      if (data) {
        const discoveredOrders: AppNotification[] = [];
        const newOrderIds: string[] = [];

        const mapped: AppNotification[] = data.map((log: any) => {
          const isRelevantBranch = user.role === 'ADMINISTRATOR' || 
            Number(log.from_branch_id) === branchNum || 
            Number(log.to_branch_id) === branchNum ||
            Number(log.tool?.branch_id) === branchNum;

          if (!isRelevantBranch) return null;
          
          // Jeśli zamówienie zostało już obsłużone (zaakceptowane/odrzucone), nie pokazujemy go w liście powiadomień
          if (log.action === 'ZAMÓWIENIE' && processedOrderIds.includes(log.id)) return null;

          // Mechanik nie widzi zamówień
          if (log.action === 'ZAMÓWIENIE' && !isManager) return null;

          // Wykrywanie nowych zamówień dla MANAGERA
          if (log.action === 'ZAMÓWIENIE' && 
              isManager && 
              Number(log.from_branch_id) === branchNum && 
              log.tool?.status !== 'W DRODZE' &&
              !processedOrderIds.includes(log.id)) {
            
            const newOrder: AppNotification = {
              id: log.id,
              title: 'NOWE ZAPYTANIE!',
              message: `Oddział ${log.to_branch?.name} potrzebuje narzędzia: ${log.tool?.name}.`,
              type: 'WARNING',
              created_at: log.created_at,
              is_read: false,
              tool_id: log.tool?.id,
              raw_log: log
            };

            // Sprawdzamy czy już go nie ma w kolejce
            if (!pendingOrdersQueue.some(po => po.id === log.id)) {
              discoveredOrders.push(newOrder);
              
              // Toast tylko raz na sesję dla danego ID
              if (!notifiedOrderIds.current.has(log.id)) {
                notifiedOrderIds.current.add(log.id);
                addToast(
                  "Nowe zapytanie!", 
                  `Oddział ${log.to_branch?.name} prosi o ${log.tool?.name}. Kliknij aby zobaczyć.`, 
                  "WARNING",
                  () => setActiveOrderRequest(newOrder)
                );
              }
            }
          }

          return {
            id: log.id,
            title: log.action,
            message: `${log.tool?.name || 'Zasób'}: ${log.action}`,
            type: log.action === 'ZAMÓWIENIE' ? 'WARNING' : log.action === 'PRZYJĘCIE' ? 'SUCCESS' : 'INFO',
            created_at: log.created_at,
            is_read: new Date(log.created_at).getTime() <= lastReadAt,
            tool_id: log.tool?.id,
            raw_log: log
          };
        }).filter(n => n !== null) as AppNotification[];
        
        // Dodajemy wszystkie znalezione zamówienia do kolejki
        if (discoveredOrders.length > 0) {
           setPendingOrdersQueue(prev => {
             const existingIds = new Set(prev.map(p => p.id));
             const uniqueNew = discoveredOrders.filter(d => !existingIds.has(d.id));
             return [...prev, ...uniqueNew];
           });
        }
        setNotifications(mapped);
      }
    } catch (e) { console.error("Notification Error:", e); }
  }, [user, simulationBranchId, lastReadAt, processedOrderIds, addToast, pendingOrdersQueue]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(() => fetchNotifications(), 30000); 
      return () => clearInterval(interval);
    }
  }, [user, simulationBranchId, fetchNotifications, refreshTrigger]);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) await fetchProfile(session.user.id, session.user.email);
      else setLoading(false);
    };
    init();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) fetchProfile(session.user.id, session.user.email);
      else if (event === 'SIGNED_OUT') { setUser(null); setProcessedOrderIds([]); setNotifications([]); setPendingOrdersQueue([]); }
    });
    return () => authListener.subscription.unsubscribe();
  }, [fetchProfile]);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {!user ? (
        <Login 
          error={authError}
          onLogin={async (email, password) => {
            setAuthError(null);
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) setAuthError("Błędny login lub hasło");
          }}
        />
      ) : (
        <div className="min-h-screen flex overflow-hidden">
           <div className="fixed top-6 right-6 z-[100001] pointer-events-none flex flex-col items-end">
             {toasts.map(toast => (
               <Toast key={toast.id} {...toast} onClose={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
             ))}
           </div>

           {/* WYŚWIETLANIE MODALA ZAPOTRZEBOWANIA TYLKO GDY WYBRANE */}
           {activeOrderRequest && (
            <OrderRequestModal 
              order={activeOrderRequest} 
              onConfirm={(o) => { 
                setActiveModule('BAZA NARZĘDZI'); 
                setTargetToolId(o.tool_id || null); 
                setProcessedOrderIds(prev => [...new Set([...prev, o.id])]);
                setPendingOrdersQueue(prev => prev.filter(p => p.id !== o.id));
                setActiveOrderRequest(null);
              }} 
              onReject={async (o) => {
                try {
                  // Tworzymy log odmowy w bazie danych
                  const branchName = MOCK_BRANCHES.find(b => String(b.id) === String(user.branch_id))?.name || "Oddział";
                  await supabase.from('tool_logs').insert({
                    tool_id: o.tool_id,
                    action: 'ODMOWA',
                    from_branch_id: Number(user.branch_id),
                    to_branch_id: Number(o.raw_log?.to_branch_id),
                    notes: `Oddział ${branchName} odmówił przekazania narzędzia.`,
                    operator_id: user.id
                  });
                } catch (e) {
                  console.error("Error creating refusal log:", e);
                }

                setProcessedOrderIds(prev => [...new Set([...prev, o.id])]);
                setPendingOrdersQueue(prev => prev.filter(p => p.id !== o.id));
                setActiveOrderRequest(null);
                
                // Pokaż następne jeśli jest w kolejce
                if (pendingOrdersQueue.length > 1) {
                  const next = pendingOrdersQueue.find(p => p.id !== o.id);
                  if (next) setActiveOrderRequest(next);
                }
              }} 
            />
          )}

          {isChangePasswordModalOpen && (
            <ChangePasswordModal onClose={() => setIsChangePasswordModalOpen(false)} />
          )}

          <Sidebar 
            user={user} branches={MOCK_BRANCHES} activeModule={activeModule} 
            onModuleChange={setActiveModule} isOpen={isSidebarOpen} 
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
            simulationBranchId={simulationBranchId} setSimulationBranchId={setSimulationBranchId}
            isSuperAdmin={user.role === 'ADMINISTRATOR'}
          />
          <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
            <Header 
              user={user} activeModule={activeModule} onLogout={() => supabase.auth.signOut()}
              toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onRefresh={() => setRefreshTrigger(t => t + 1)}
              notifications={notifications} onMarkRead={() => setLastReadAt(Date.now())}
              onNotificationClick={(n) => { 
                if (n.title.includes('ZAMÓWIENIE')) {
                  setActiveOrderRequest(n);
                } else if (n.tool_id) { 
                  setActiveModule('BAZA NARZĘDZI'); 
                  setTargetToolId(n.tool_id); 
                } 
              }}
              onChangePasswordClick={() => setIsChangePasswordModalOpen(true)}
            />
            <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
               {activeModule === 'DASHBOARD' && user.role === 'ADMINISTRATOR' && <DashboardModule branches={MOCK_BRANCHES} refreshTrigger={refreshTrigger} />}
                {(activeModule === 'BAZA NARZĘDZI' || activeModule === 'MOJE NARZĘDZIA') && (
                  <ToolsModule 
                    user={user} simulationBranchId={simulationBranchId} branches={MOCK_BRANCHES} 
                    refreshTrigger={refreshTrigger} onRefresh={() => setRefreshTrigger(t => t + 1)} 
                    viewMode={activeModule as any} targetToolId={targetToolId} 
                    onTargetToolClear={() => setTargetToolId(null)}
                    onActionComplete={() => {
                      if (pendingOrdersQueue.length > 0) {
                        setActiveOrderRequest(pendingOrdersQueue[0]);
                      }
                    }}
                  />
                )}
               {activeModule === 'UŻYTKOWNICY' && <UsersModule user={user} branches={MOCK_BRANCHES} allUsers={allUsers} onRefresh={() => setRefreshTrigger(t => t + 1)} refreshTrigger={refreshTrigger} />}
               {activeModule === 'GRAFIK' && <ScheduleModule user={user} branches={MOCK_BRANCHES} refreshTrigger={refreshTrigger} />}
               {activeModule === 'MOJA FLOTA' && <FleetRedirect />}
            </main>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
