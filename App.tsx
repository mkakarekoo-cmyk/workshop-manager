
import React, { useState, useEffect, useCallback } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ToolsModule from './modules/ToolsModule';
import UsersModule from './modules/UsersModule';
import ScheduleModule from './modules/ScheduleModule';
import { User, ModuleType, Branch, AppNotification, ToolStatus } from './types';
import { supabase } from './supabase';

const MOCK_BRANCHES: Branch[] = [
  { id: '1', name: 'Porosły (HUB)', location: 'Porosły', email: 'andrzej.chlabicz@contractus.com.pl, mateusz.kakareko@contractus.com.pl' },
  { id: '2', name: 'Karniewo', location: 'Karniewo', email: 'serwis.karniewo@contrantus.com.pl' },
  { id: '3', name: 'Łomża', location: 'Łomża', email: 'mateusz.nicikowski@contractus.com.pl' },
  { id: '4', name: 'Brzozów', location: 'Brzozów', email: 'paulina.zlotkowska@contractus.com.pl, serwis@contractus.com.pl' },
  { id: '5', name: 'Suwałki', location: 'Suwałki', email: 'serwis.suwalki@contractus.com.pl' },
  { id: '6', name: 'Serwis Porosły', location: 'Porosły', email: 'adam.wnorowski@contractus.com.pl' },
];

const MASTER_ADMIN_EMAIL = 'm.kakarekoo@gmail.com';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleType>('BAZA NARZĘDZI');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [simulationBranchId, setSimulationBranchId] = useState<string>('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [lastReadAt, setLastReadAt] = useState<number>(Date.now());
  const [authError, setAuthError] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [targetToolId, setTargetToolId] = useState<string | null>(null);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      document.body.style.overflow = isSidebarOpen ? 'hidden' : '';
    }
  }, [isSidebarOpen]);

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

      if (userEmail === MASTER_ADMIN_EMAIL.toLowerCase()) {
        finalRole = 'ADMINISTRATOR';
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
      setSimulationBranchId(finalUser.role === 'ADMINISTRATOR' ? 'all' : finalUser.branch_id || '1');
      fetchAllUsers();
    } catch (e) {
      console.error("Critical Profile Error:", e);
    } finally {
      setLoading(false);
    }
  }, [fetchAllUsers]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const isGlobal = simulationBranchId === 'all' && user.role === 'ADMINISTRATOR';
      const branchNum = Number(simulationBranchId === 'all' ? user.branch_id : simulationBranchId);
      
      const { data, error } = await supabase
        .from('tool_logs')
        .select('*, tool:tools(name, status, target_branch_id, id), from_branch:branches!tool_logs_from_branch_id_fkey(name), to_branch:branches!tool_logs_to_branch_id_fkey(name)')
        .order('created_at', { ascending: false })
        .limit(isGlobal ? 30 : 15);

      if (error) throw error;

      if (data) {
        const mapped: AppNotification[] = data.filter((log: any) => {
          if (isGlobal) return true;
          return Number(log.to_branch_id) === branchNum || Number(log.from_branch_id) === branchNum;
        }).map((log: any) => {
          const logTime = new Date(log.created_at).getTime();
          const isRead = logTime <= lastReadAt;
          let title = log.action;
          let type: 'INFO' | 'WARNING' | 'SUCCESS' = 'INFO';
          let message = `${log.tool?.name || 'Zasób'}: ${log.action}`;

          if (log.action === 'PRZESUNIĘCIE') {
            const isToMyBranch = Number(log.to_branch_id) === branchNum;
            if (isToMyBranch && log.tool?.status === ToolStatus.IN_TRANSIT) {
               title = 'PRZESYŁKA DOTARŁA';
               message = `Narzędzie ${log.tool?.name} jest w Twoim oddziale. Potwierdź odbiór!`;
               type = 'SUCCESS';
            }
          }
          return { id: log.id, title, message, type, created_at: log.created_at, is_read: isRead, tool_id: log.tool?.id };
        });
        setNotifications(mapped);
      }
    } catch (e) { console.error(e); }
  }, [user, simulationBranchId, lastReadAt]);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) await fetchProfile(session.user.id, session.user.email);
      else setLoading(false);
    };
    init();
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) fetchProfile(session.user.id, session.user.email);
      else if (event === 'SIGNED_OUT') setUser(null);
    });
    return () => authListener.subscription.unsubscribe();
  }, [fetchProfile]);

  useEffect(() => {
    const interval = setInterval(() => { fetchNotifications(); fetchAllUsers(); }, 10000);
    fetchNotifications();
    return () => clearInterval(interval);
  }, [fetchNotifications, fetchAllUsers]);

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center space-y-8">
      <div className="w-20 h-20 border-8 border-white/5 border-t-[#22c55e] rounded-full animate-spin"></div>
      <p className="font-black text-[#22c55e] uppercase tracking-[1em] animate-pulse text-xs text-center">Inicjalizacja Systemu...</p>
    </div>
  );

  if (!user) return <Login error={authError} onLogin={async (email, password) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError("Błąd logowania: " + error.message);
  }} />;

  return (
    <div className="min-h-[100dvh] flex bg-[#f8fafc] overflow-x-hidden">
      <Sidebar 
        user={user} branches={MOCK_BRANCHES} activeModule={activeModule} onModuleChange={setActiveModule} 
        isOpen={isSidebarOpen} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        simulationBranchId={simulationBranchId} setSimulationBranchId={setSimulationBranchId}
        isSuperAdmin={user.role === 'ADMINISTRATOR'}
      />
      <div className="flex-1 flex flex-col min-w-0 min-h-[100dvh]">
        <Header 
          user={user} activeModule={activeModule} onLogout={() => supabase.signOut()} 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onRefresh={() => setRefreshTrigger(p => p+1)}
          notifications={notifications} onMarkRead={() => setLastReadAt(Date.now())}
          onNotificationClick={(n) => { if(n.tool_id) { setActiveModule('BAZA NARZĘDZI'); setTargetToolId(n.tool_id); } }}
        />
        <main className="flex-1 p-0">
          <ToolsModule 
            user={user} simulationBranchId={simulationBranchId} branches={MOCK_BRANCHES} allUsers={allUsers}
            refreshTrigger={refreshTrigger} onRefresh={() => setRefreshTrigger(p => p+1)} viewMode={activeModule as any}
            targetToolId={targetToolId} onTargetToolClear={() => setTargetToolId(null)}
          />
        </main>
      </div>
    </div>
  );
};

export default App;
