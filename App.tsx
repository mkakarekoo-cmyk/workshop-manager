
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
  { id: '2', name: 'Karniewo', location: 'Karniewo', email: 'serwis.karniewo@contractus.com.pl' },
  { id: '3', name: 'Łomża', location: 'Łomża', email: 'mateusz.nicikowski@contractus.com.pl' },
  { id: '4', name: 'Brzozów', location: 'Brzozów', email: 'paulina.zlotkowska@contractus.com.pl, serwis@contractus.com.pl' },
  { id: '5', name: 'Suwałki', location: 'Suwałki', email: 'serwis.suwalki@contractus.com.pl' },
  { id: '6', name: 'Serwis Porosły', location: 'Porosły', email: 'adam.wnorowski@contractus.com.pl' },
];

const MASTER_ADMIN_EMAIL = 'm.kakarekoo@gmail.com';
const SPECIAL_USER_ADAM = 'adam.wnorowski@contractus.com.pl';

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
      if (isSidebarOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
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
      } else if (userEmail === SPECIAL_USER_ADAM.toLowerCase()) {
        finalRole = 'DORADCA SERWISOWY';
        finalBranch = '6'; 
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
          let title = log.action;
          let message = `${log.tool?.name || 'Zasób'}: ${log.action}`;
          let type: 'INFO' | 'WARNING' | 'SUCCESS' = 'INFO';

          const logTime = new Date(log.created_at).getTime();
          const isRead = logTime <= lastReadAt;

          if (log.action === 'PRZESUNIĘCIE') {
            const isToMyBranch = Number(log.to_branch_id) === branchNum;
            const toolWaiting = log.tool?.status === ToolStatus.IN_TRANSIT && Number(log.tool?.target_branch_id) === Number(log.to_branch_id);
            
            if (isToMyBranch && toolWaiting) {
              title = 'PRZESYŁKA DOTARŁA';
              message = `Narzędzie ${log.tool?.name} jest w Twoim oddziale. Potwierdź odbiór!`;
              type = 'SUCCESS';
            } else if (isToMyBranch) {
              title = 'NARZĘDZIE W DRODZE';
              message = `Wysłano do Ciebie: ${log.tool?.name} z ${log.from_branch?.name}`;
              type = 'INFO';
            } else {
              title = 'WYSYŁKA Z ODDZIAŁU';
              message = `Narzędzie ${log.tool?.name} wysłane do ${log.to_branch?.name}`;
              type = 'INFO';
            }
          } 
          else if (log.action === 'PRZYJĘCIE') {
            title = 'ODEBRANO';
            message = `Potwierdzono przyjęcie ${log.tool?.name} w oddziale ${log.to_branch?.name}`;
            type = 'SUCCESS';
          }

          return {
            id: log.id,
            title,
            message,
            type,
            created_at: log.created_at,
            is_read: isRead,
            tool_id: log.tool?.id
          };
        });
        setNotifications(mapped);
      }
    } catch (e) {
      console.error("Notification Error:", e);
    }
  }, [user, simulationBranchId, lastReadAt]);

  const markNotificationsRead = () => {
    setLastReadAt(Date.now());
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleNotificationClick = (n: AppNotification) => {
    if (n.tool_id) {
      setActiveModule('BAZA NARZĘDZI');
      setTargetToolId(n.tool_id);
    }
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
      }
    });
    return () => authListener.subscription.unsubscribe();
  }, [fetchProfile]);

  useEffect(() => {
    const interval = setInterval(() => {
        fetchNotifications();
        if (user?.role === 'ADMINISTRATOR') fetchAllUsers();
    }, 10000);
    fetchNotifications();
    return () => clearInterval(interval);
  }, [fetchNotifications, fetchAllUsers, user?.role]);

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center space-y-8">
      <div className="w-20 h-20 sm:w-24 sm:h-24 border-8 border-white/5 border-t-[#22c55e] rounded-full animate-spin"></div>
      <p className="font-black text-[#22c55e] uppercase tracking-[0.5em] sm:tracking-[1em] animate-pulse text-[10px] sm:text-xs text-center px-6">Synchronizacja logistyki...</p>
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
    <div className="min-h-screen flex bg-[#f8fafc] text-slate-900 font-inter overflow-x-hidden">
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
      <div className="flex-1 flex flex-col min-w-0 min-h-screen relative">
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
        <main className="flex-1 scroll-smooth">
          <div className="max-w-[1920px] mx-auto px-0 sm:px-4">
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
          <footer className="w-full py-16 sm:py-24 flex flex-col items-center justify-center space-y-4 sm:space-y-6 mt-10 sm:mt-20 border-t border-slate-100 bg-white/50 backdrop-blur-sm">
            <p className="text-slate-300 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.5em] sm:tracking-[1em] leading-none text-center px-4">
              © 2026 Menadżer Narzędzi - System Logistyczny
            </p>
            <div className="flex items-center space-x-4 sm:space-x-6">
              <div className="h-[1px] w-8 sm:w-16 bg-slate-100"></div>
              <p className="text-slate-400 text-[9px] sm:text-[11px] font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] italic flex items-center">
                Created by <span className="text-[#22c55e] ml-2 sm:ml-4">Mateusz Kakareko</span>
              </p>
              <div className="h-[1px] w-8 sm:w-16 bg-slate-100"></div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default App;
