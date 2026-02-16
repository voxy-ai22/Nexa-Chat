
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  MessageCircle, 
  Ticket as TicketIcon, 
  Lightbulb, 
  User as UserIcon,
  LogOut
} from 'lucide-react';
import { View, User, Message, Ticket, Suggestion, AppNotification } from './types';
import { initAntiDebug } from './utils/security';
import { getDB, saveToDB, onlineChannel } from './utils/storage';
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
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [onlineCount, setOnlineCount] = useState(1);

  const messagesRef = useRef(messages);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const addNotification = useCallback((message: string, type: 'info' | 'success' | 'alert' = 'info') => {
    const newNotif = { id: Math.random().toString(36).substr(2, 9), message, type };
    setNotifications(prev => [...prev, newNotif]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Sync Messages from other tabs
  useEffect(() => {
    const handleSync = (event: MessageEvent) => {
      if (event.data.type === 'new_message') {
        const incomingMsg = event.data.message;
        setMessages(prev => {
          if (prev.some(m => m.id === incomingMsg.id)) return prev;
          return [...prev, incomingMsg];
        });
      }
    };
    onlineChannel.addEventListener('message', handleSync);
    return () => onlineChannel.removeEventListener('message', handleSync);
  }, []);

  // Initial Boot Sequence
  useEffect(() => {
    const initialize = async () => {
      try {
        initAntiDebug();
        const db = getDB();
        setMessages(db.messages || []);
        setTickets(db.tickets || []);
        setSuggestions(db.suggestions || []);
        
        // Cek login session yang tersimpan
        const savedUser = localStorage.getItem('nexa_active_session');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (err) {
        console.error("BOOT_FAILURE:", err);
      } finally {
        // Simulasi waktu loading jaringan agar splash screen terlihat
        setTimeout(() => setIsInitializing(false), 2000);
      }
    };

    initialize();

    const resetTimer = setInterval(() => {
      const db = getDB();
      if (db.messages && db.messages.length === 0 && messagesRef.current.length > 0) {
        setMessages([]);
        addNotification("PEMBERSIHAN DATA: RESET 07:00 SELESAI", "info");
      }
    }, 30000);

    return () => clearInterval(resetTimer);
  }, [addNotification]);

  // Real-time Online Sync
  useEffect(() => {
    if (!user) return;
    const ping = () => onlineChannel.postMessage({ type: 'heartbeat', userId: user.id });
    const interval = setInterval(ping, 2000);
    const activeNodes = new Set<string>();
    activeNodes.add(user.id);
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'heartbeat') activeNodes.add(event.data.userId);
    };
    onlineChannel.addEventListener('message', handleMessage);
    const countInterval = setInterval(() => {
      setOnlineCount(activeNodes.size);
      activeNodes.clear();
      activeNodes.add(user.id);
    }, 5000);
    return () => {
      clearInterval(interval);
      clearInterval(countInterval);
      onlineChannel.removeEventListener('message', handleMessage);
    };
  }, [user]);

  // Persistence Sync
  useEffect(() => {
    if (user) {
      saveToDB({ messages, tickets, suggestions });
    }
  }, [messages, tickets, suggestions, user]);

  const handleLogin = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    localStorage.setItem('nexa_active_session', JSON.stringify(authenticatedUser));
    addNotification(`PROTOKOL DIAKTIFKAN: ${authenticatedUser.name}`, "success");
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('nexa_active_session');
    setNotifications([]);
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
                  <span className={`w-1.5 h-1.5 rounded-full bg-white animate-pulse`}></span>
                  <span className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">
                    {onlineCount} NODE AKTIF
                  </span>
                </div>
              </div>
              <button onClick={handleLogout} className="p-2 rounded-full glass hover:bg-white/10 transition-all">
                <LogOut size={18} className="text-white" />
              </button>
            </header>

            <main className="flex-1 overflow-y-auto pb-32">
              {activeView === View.CHAT && <ChatView user={user} messages={messages} setMessages={setMessages} notify={addNotification} />}
              {activeView === View.TICKET && <TicketView user={user} tickets={tickets} setTickets={setTickets} notify={addNotification} />}
              {activeView === View.SARAN && <SaranView user={user} suggestions={suggestions} setSuggestions={setSuggestions} notify={addNotification} />}
              {activeView === View.PROFILE && <ProfileView user={user} setUser={setUser} notify={addNotification} />}
            </main>

            <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md h-16 glass rounded-full flex items-center justify-around px-4 z-50">
              <NavItem active={activeView === View.CHAT} onClick={() => setActiveView(View.CHAT)} icon={<MessageCircle size={24} />} label="Obrolan" />
              <NavItem active={activeView === View.TICKET} onClick={() => setActiveView(View.TICKET)} icon={<TicketIcon size={24} />} label="Bantuan" />
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
  <button onClick={onClick} className={`flex flex-col items-center justify-center transition-all duration-300 ${active ? 'text-white scale-110' : 'text-gray-500'}`}>
    {icon}
    <span className={`text-[9px] mt-0.5 font-bold uppercase tracking-wider transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`}>{label}</span>
  </button>
);

export default App;
