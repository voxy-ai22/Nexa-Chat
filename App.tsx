
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MessageCircle, 
  Ticket as TicketIcon, 
  Lightbulb, 
  User as UserIcon,
  LogOut
} from 'lucide-react';
import { View, User, Message, Ticket, Suggestion, AppNotification } from './types';
import ChatView from './components/ChatView';
import TicketView from './components/TicketView';
import SaranView from './components/SaranView';
import ProfileView from './components/ProfileView';
import Login from './components/Login';
import NotificationToast from './components/NotificationToast';
import ErrorBoundary from './components/ErrorBoundary';
import SplashScreen from './components/SplashScreen';

const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<View>(View.CHAT);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [onlineCount, setOnlineCount] = useState(1);

  const addNotification = useCallback((message: string, type: 'info' | 'success' | 'alert' = 'info') => {
    const newNotif = { id: Math.random().toString(36).substr(2, 9), message, type };
    setNotifications(prev => [...prev, newNotif]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Fetch initial data from Serverless API
  useEffect(() => {
    const boot = async () => {
      try {
        const response = await fetch('/api/index.js?action=ping');
        if (!response.ok) throw new Error("API_UNREACHABLE");
        
        // Auto-login session check
        const saved = localStorage.getItem('nexa_session');
        if (saved) setUser(JSON.parse(saved));
      } catch (err) {
        addNotification("GAGAL MENGHUBUNGKAN KE SERVER", "alert");
      } finally {
        setTimeout(() => setIsInitializing(false), 1500);
      }
    };
    boot();
  }, [addNotification]);

  const handleLogin = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    localStorage.setItem('nexa_session', JSON.stringify(authenticatedUser));
    addNotification(`AKSES DIBERIKAN: ${authenticatedUser.name}`, "success");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('nexa_session');
  };

  if (isInitializing) return <SplashScreen />;

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen w-full bg-black text-white overflow-hidden relative">
        <div className="fixed top-24 left-0 right-0 z-[100] pointer-events-none flex flex-col gap-2 items-center">
          {notifications.map(n => (
            <NotificationToast key={n.id} notification={n} onDismiss={dismissNotification} />
          ))}
        </div>

        {!user ? (
          <Login onLogin={handleLogin} />
        ) : (
          <>
            <header className="pt-12 pb-4 px-6 flex justify-between items-center glass-dark z-50 border-b border-white/5">
              <div>
                <h1 className="text-3xl font-black tracking-tighter">NEXA</h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">NODE AKTIF</span>
                </div>
              </div>
              <button onClick={handleLogout} className="p-2 rounded-full glass hover:bg-white/10 transition-all">
                <LogOut size={18} className="text-white" />
              </button>
            </header>

            <main className="flex-1 overflow-y-auto pb-32">
              {activeView === View.CHAT && <ChatView user={user} messages={messages} setMessages={setMessages} notify={addNotification} />}
              {activeView === View.TICKET && <div className="p-8 text-center opacity-40 uppercase text-xs font-black tracking-widest mt-20">Modul Bantuan Terenkripsi</div>}
              {activeView === View.SARAN && <SaranView user={user} suggestions={[]} setSuggestions={() => {}} notify={addNotification} />}
              {activeView === View.PROFILE && <ProfileView user={user} setUser={setUser} notify={addNotification} />}
            </main>

            <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md h-16 glass rounded-full flex items-center justify-around px-4 z-50">
              <NavItem active={activeView === View.CHAT} onClick={() => setActiveView(View.CHAT)} icon={<MessageCircle size={24} />} label="Obrolan" />
              <NavItem active={activeView === View.TICKET} onClick={() => setActiveView(View.TICKET)} icon={<TicketIcon size={24} />} label="Tiket" />
              <NavItem active={activeView === View.SARAN} onClick={() => setActiveView(View.SARAN)} icon={<Lightbulb size={24} />} label="Saran" />
              <NavItem active={activeView === View.PROFILE} onClick={() => setActiveView(View.PROFILE)} icon={<UserIcon size={24} />} label="Profil" />
            </nav>
          </>
        )}
      </div>
    </ErrorBoundary>
  );
};

const NavItem: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center transition-all ${active ? 'text-white scale-110' : 'text-gray-500'}`}>
    {icon}
    <span className={`text-[8px] mt-0.5 font-bold uppercase transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`}>{label}</span>
  </button>
);

export default App;
