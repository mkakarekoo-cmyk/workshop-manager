
import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ToolsModule from './modules/ToolsModule';
import FleetModule from './modules/FleetModule';
import WorkshopModule from './modules/WorkshopModule';
import UsersModule from './modules/UsersModule';
import { User, ModuleType, Branch } from './types';

const MOCK_BRANCHES: Branch[] = [
  { id: '1', name: 'Porosły (HUB)', location: 'Porosły' },
  { id: '2', name: 'Karniewo', location: 'Karniewo' },
  { id: '3', name: 'Łomża', location: 'Łomża' },
  { id: '4', name: 'Brzozów', location: 'Brzozów' },
  { id: '5', name: 'Suwałki', location: 'Suwałki' },
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleType>('NARZĘDZIA');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [simulationBranchId, setSimulationBranchId] = useState<string>('all');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('wm_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Błąd podczas ładowania sesji:", error);
      localStorage.removeItem('wm_user'); // Czyścimy błędne dane
    }

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogin = (email: string) => {
    const isSuperAdmin = email === 'm.kakarekoo@gmail.com';
    const newUser: User = {
      id: 'u-session-' + Date.now(),
      email,
      role: isSuperAdmin ? 'ADMINISTRATOR' : 'USER',
      name: email.split('@')[0].toUpperCase(),
      status: 'AKTYWNY',
      branch_id: isSuperAdmin ? '1' : '2'
    };
    setUser(newUser);
    localStorage.setItem('wm_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderModule = () => {
    const commonProps = { 
      refreshTrigger, 
      user, 
      simulationBranchId, 
      branches: MOCK_BRANCHES 
    };

    switch (activeModule) {
      case 'NARZĘDZIA':
        return <ToolsModule {...commonProps} />;
      case 'MOJA FLOTA':
        return <FleetModule {...commonProps} />;
      case 'MÓJ WARSZTAT':
        return <WorkshopModule {...commonProps} />;
      case 'UŻYTKOWNICY':
        return <UsersModule user={user} branches={MOCK_BRANCHES} />;
      default:
        return <ToolsModule {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafc] selection:bg-[#22c55e]/30 relative overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && window.innerWidth < 1024 && (
        <div 
          className="fixed inset-0 bg-[#0f172a]/60 backdrop-blur-sm z-[45]"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar 
        activeModule={activeModule} 
        onModuleChange={(m) => {
          setActiveModule(m);
          if (window.innerWidth < 1024) setIsSidebarOpen(false);
        }} 
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        user={user}
        branches={MOCK_BRANCHES}
        simulationBranchId={simulationBranchId}
        setSimulationBranchId={setSimulationBranchId}
      />
      
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header 
          user={user} 
          onLogout={handleLogout} 
          activeModule={activeModule}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onRefresh={handleRefresh}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col bg-[#f8fafc]">
          <div className="flex-1 w-full max-w-[1920px] mx-auto flex flex-col">
            {renderModule()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
