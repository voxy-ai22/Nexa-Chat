
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { 
  MessageCircle, 
  Ticket as TicketIcon, 
  Lightbulb, 
  User as UserIcon,
  LogOut,
  WifiOff
} from 'lucide-react';
import { View, User, Message, AppNotification } from './types';

// Lazy loading components for better boot performance
const ChatView = lazy(() => import('./components/ChatView'));
const TicketView = lazy(() => import('./components/TicketView'));
const SaranView = lazy(() => import('./components/SaranView'));
const ProfileView = lazy(() => import('./components/ProfileView'));
const Login = lazy(() => import('./components/Login'));

import NotificationToast from './components/NotificationToast';
import ErrorBoundary from './components/ErrorBoundary';
import SplashScreen from './components/SplashScreen';

const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<View>(View.CHAT);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const addNotification = useCallback((message: string, type: 'info' | 'success' | 'alert' = 'info') => {
    const newNotif = { id: Math.random().toString(36).substr(2, 9), message, type };
    setNotifications(prev => [...prev, newNotif]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const syncData = useCallback(async () => {
    try {
      // Menambahkan cache-buster untuk menghindari respon stale
      const res = await fetch(`/api?action=get_messages&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setMessages(data);
      }
    } catch (e) {
      console.error("SYNC_FAILED", e);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initApp = async () => {
      try {
        // Coba hubungi API dengan timeout 10 detik
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const res = await fetch('/api?action=ping', { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) throw new Error(`HTTP_ERROR_${res.status}`);
        
        if (mounted) {
          const saved = localStorage.getItem('nexa_session');
          if (saved) {
            try {
              setUser(JSON.parse(saved));
            } catch (e) {
              localStorage.removeItem('nexa_session');
            }
          }
          
          await syncData();
          setIsInitializing(false);
        }
      } catch (err) {
        console.error("BOOT_FAILURE_DETAILS:", err);
        if (mounted) {
          setApiError(true);
          setIsInitializing(false);
        }
      }
    };

    initApp();
    return () => { mounted = false; };
  }, [syncData]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(syncData, 5000);
    return () => clearInterval(interval);
  }, [user, syncData]);

  const handleLogin = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    localStorage.setItem('nexa_session', JSON.stringify(authenticatedUser));
    addNotification(`ACCESS GRANTED: ${authenticatedUser.name}`, "success");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('nexa_session');
  };

  if (isInitializing) return <SplashScreen />;

  if (apiError) {
    return (
      <div className="h-[100dvh] w-full bg-black flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
        <div className="w-24 h-24 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
          <WifiOff size={48} className="text-red-500 animate-pulse" />
        </div>
        <h1 className="text-2xl font-black uppercase tracking-widest text-white mb-2">SISTEM OFFLINE</h1>
        <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] leading-relaxed max-w-xs">
          Gagal membangun jabat tangan dengan infrastruktur Nexa Cloud. Pastikan koneksi internet stabil atau coba lagi nanti.
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-10 px-10 py-4 bg-white text-black font-black text-[10px] rounded-full uppercase tracking-[0.4em] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-white/5"
        >
          RE-INITIALIZE
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-[100dvh] w-full bg-black text-white overflow-hidden relative">
        <div className="fixed top-24 left-0 right-0 z-[100] pointer-events-none flex flex-col gap-2 items-center">
          {notifications.map(n => (
            <NotificationToast key={n.id} notification={n} onDismiss={dismissNotification} />
          ))}
        </div>

        {!user ? (
          <Suspense fallback={<SplashScreen />}>
            <Login onLogin={handleLogin} />
          </Suspense>
        ) : (
          <>
            <header className="pt-12 pb-4 px-6 flex justify-between items-center glass-dark z-50 border-b border-white/5">
              <div>
                <h1 className="text-3xl font-black tracking-tighter">NEXA</h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">CLOUD CONNECTED</span>
                </div>
              </div>
              <button onClick={handleLogout} className="p-2 rounded-full glass hover:bg-white/10 transition-all">
                <LogOut size={18} className="text-white" />
              </button>
            </header>

            <main className="flex-1 overflow-y-auto pb-32">
              <Suspense fallback={<div className="p-20 text-center animate-pulse uppercase text-[10px] tracking-[0.5em] text-gray-500">Decrypting Module...</div>}>
                {activeView === View.CHAT && <ChatView user={user} messages={messages} setMessages={setMessages} notify={addNotification} />}
                {activeView === View.TICKET && <TicketView user={user} tickets={[]} setTickets={() => {}} notify={addNotification} />}
                {activeView === View.SARAN && <SaranView user={user} suggestions={[]} setSuggestions={() => {}} notify={addNotification} />}
                {activeView === View.PROFILE && <ProfileView user={user} setUser={setUser} notify={addNotification} />}
              </Suspense>
            </main>

            <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md h-16 glass rounded-full flex items-center justify-around px-4 z-50 border border-white/10 shadow-2xl shadow-black">
              <NavItem active={activeView === View.CHAT} onClick={() => setActiveView(View.CHAT)} icon={<MessageCircle size={22} />} label="Chat" />
              <NavItem active={activeView === View.TICKET} onClick={() => setActiveView(View.TICKET)} icon={<TicketIcon size={22} />} label="Ticket" />
              <NavItem active={activeView === View.SARAN} onClick={() => setActiveView(View.SARAN)} icon={<Lightbulb size={22} />} label="Idea" />
              <NavItem active={activeView === View.PROFILE} onClick={() => setActiveView(View.PROFILE)} icon={<UserIcon size={22} />} label="Node" />
            </nav>
          </>
        )}
      </div>
    </ErrorBoundary>
  );
};

const NavItem: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center transition-all duration-300 ${active ? 'text-white scale-110' : 'text-gray-600 hover:text-gray-400'}`}>
    {icon}
    <span className={`text-[7px] mt-1 font-black uppercase transition-all tracking-[0.2em] ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>{label}</span>
  </button>
);

export default App;
