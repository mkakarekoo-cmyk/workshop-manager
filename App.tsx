
import React, { useState, useEffect, useCallback } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ToolsModule from './modules/ToolsModule';
import UsersModule from './modules/UsersModule';
import { User, ModuleType, Branch, AppNotification, ToolStatus } from './types';
import { supabase } from './supabase';

const MOCK_BRANCHES: Branch[] = [
  { id: '1', name: 'Porosły (HUB)', location: 'Porosły' },
  { id: '2', name: 'Karniewo', location: 'Karniewo' },
  { id: '3', name: 'Łomża', location: 'Łomża' },
  { id: '4', name: 'Brzozów', location: 'Brzozów' },
  { id: '5', name: 'Suwałki', location: 'Suwałki' },
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
  const [authError, setAuthError] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);

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
      
      const userEmail = email || '';
      const finalRole = userEmail.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase() ? 'ADMINISTRATOR' : (profile?.role || 'MECHANIK');

      const finalUser: User = {
        id: userId,
        email: userEmail,
        role: finalRole as any,
        status: profile?.status || 'AKTYWNY',
        branch_id: profile?.branch_id ? String(profile.branch_id) : '1',
        first_name: profile?.first_name,
        last_name: profile?.last_name
      };
      
      setUser(finalUser);
      
      if (finalUser.role !== 'ADMINISTRATOR') {
        setSimulationBranchId(finalUser.branch_id || '1');
      } else {
        setSimulationBranchId('all');
        fetchAllUsers();
      }
    } catch (e) {
      console.error("Critical Profile Error:", e);
    } finally {
      setLoading(false);
    }
  }, [fetchAllUsers]);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const branchNum = simulationBranchId === 'all' ? Number(user.branch_id) : Number(simulationBranchId);
      
      const { data, error } = await supabase
        .from('tool_logs')
        .select('*, tool:tools(name, status, target_branch_id), from_branch:branches!tool_logs_from_branch_id_fkey(name), to_branch:branches!tool_logs_to_branch_id_fkey(name)')
        .or(`to_branch_id.eq.${branchNum},and(action.in.(ZAMÓWIENIE,REZERWACJA),from_branch_id.eq.${branchNum})`)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (data) {
        const mapped: AppNotification[] = data.map((log: any) => {
          let title = log.action;
          let message = `Zdarzenie: ${log.action} dla ${log.tool?.name || 'zasobu'}`;
          let type: 'INFO' | 'WARNING' | 'SUCCESS' = 'INFO';

          if (log.action === 'PRZESUNIĘCIE' && log.to_branch_id === branchNum) {
            const isWaiting = log.tool?.status === ToolStatus.IN_TRANSIT && Number(log.tool?.target_branch_id) === branchNum;
            title = isWaiting ? 'OCZEKUJE NA ODBIÓR' : 'NARZĘDZIE W DRODZE';
            message = isWaiting 
              ? `Narzędzie ${log.tool?.name} dotarło! Potwierdź odbiór.` 
              : `Narzędzie ${log.tool?.name} wysłane do Ciebie.`;
            type = isWaiting ? 'SUCCESS' : 'INFO';
          } 
          else if (log.action === 'ZAMÓWIENIE' && log.from_branch_id === branchNum) {
            title = 'PILNE ZAMÓWIENIE';
            message = `Oddział ${log.to_branch?.name || 'Inny'} prosi o: ${log.tool?.name}.`;
            type = 'WARNING';
          } 

          return {
            id: log.id,
            title,
            message,
            type,
            created_at: log.created_at,
            is_read: false
          };
        });
        setNotifications(mapped);
      }
    } catch (e) {
      console.error("Notification Error:", e);
    }
  }, [user, simulationBranchId]);

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
      }
    });
    return () => authListener.subscription.unsubscribe();
  }, [fetchProfile]);

  useEffect(() => {
    const interval = setInterval(() => {
        fetchNotifications();
        if (user?.role === 'ADMINISTRATOR') fetchAllUsers();
    }, 15000);
    fetchNotifications();
    return () => clearInterval(interval);
  }, [fetchNotifications, fetchAllUsers, user?.role]);

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center space-y-8">
      <div className="w-24 h-24 border-8 border-white/5 border-t-[#22c55e] rounded-full animate-spin"></div>
      <p className="font-black text-[#22c55e] uppercase tracking-[1em] animate-pulse text-xs text-center">Inicjalizacja systemu KROK 1...</p>
    </div>
  );

  if (!user) return <Login 
    error={authError}
    onLogin={async (email, password) => {
      setAuthError(null);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setAuthError(error.message.includes("Invalid login") ? "Błędny login lub hasło" : error.message);
      }
    }} 
  />;

  const onRefresh = () => {
    setRefreshTrigger(p => p + 1);
    fetchNotifications();
    if (user.role === 'ADMINISTRATOR') fetchAllUsers();
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafc] text-slate-900 font-inter overflow-hidden">
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
        />
        <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          <div className="max-w-[1920px] mx-auto">
             {activeModule !== 'UŻYTKOWNICY' && (
               <ToolsModule 
                  user={user} 
                  simulationBranchId={simulationBranchId} 
                  branches={MOCK_BRANCHES} 
                  refreshTrigger={refreshTrigger} 
                  onRefresh={onRefresh} 
                  viewMode={activeModule as any} 
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
          </div>
          <footer className="w-full py-12 text-center text-slate-300 text-[10px] font-black uppercase tracking-[0.8em] mt-20">
            © 2026 Menadżer Narzędzi - System Logistyczny (KROK 1)
          </footer>
        </main>
      </div>
    </div>
  );
};

export default App;
