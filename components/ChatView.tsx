
import React, { useState, useEffect, useRef } from 'react';
import { User, Message } from '../types';
import { Send, Shield, AlertTriangle, Clock } from 'lucide-react';
import { onlineChannel } from '../utils/storage';

interface ChatViewProps {
  user: User;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  notify: (msg: string, type?: 'info' | 'success' | 'alert') => void;
}

const ChatView: React.FC<ChatViewProps> = ({ user, messages, setMessages, notify }) => {
  const [inputText, setInputText] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [isBanned, setIsBanned] = useState(false);
  const [banTimeRemaining, setBanTimeRemaining] = useState(0);
  const [glowMessageId, setGlowMessageId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll tetap di bawah
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle Cooldown
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Handle Ban
  useEffect(() => {
    if (isBanned && banTimeRemaining > 0) {
      const timer = setTimeout(() => setBanTimeRemaining(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isBanned && banTimeRemaining === 0) {
      setIsBanned(false);
      setMessageCount(0);
    }
  }, [isBanned, banTimeRemaining]);

  // Deteksi pesan baru untuk efek glow
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      // Hanya aktifkan glow jika pesan diterima dalam 5 detik terakhir (realtime)
      if (Date.now() - lastMsg.timestamp < 3000) {
        setGlowMessageId(lastMsg.id);
        const timer = setTimeout(() => setGlowMessageId(null), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [messages.length]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isBanned || cooldown > 0) return;

    if (messageCount >= 20) {
      setIsBanned(true);
      setBanTimeRemaining(300);
      notify("PROTOKOL SPAM: AKSES DITANGGUHKAN", "alert");
      return;
    }

    try {
      const msgId = Math.random().toString(36).substr(2, 9);
      const newMessage: Message = {
        id: msgId,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        text: inputText,
        timestamp: Date.now(),
        role: user.role
      };

      // Penting: Gunakan fungsional update untuk mencegah data hilang
      setMessages(prev => [...prev, newMessage]);
      onlineChannel.postMessage({ type: 'new_message', message: newMessage });
      
      setInputText('');
      setCooldown(3);
      setMessageCount(prev => prev + 1);
    } catch (err) {
      notify("KESALAHAN TRANSMISI", "alert");
    }
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-full bg-black relative overflow-hidden">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 pt-4 pb-48 space-y-6 scroll-smooth"
      >
        {messages.map((msg) => {
          const isMe = msg.userId === user.id;
          const isAdmin = msg.role === 'admin';
          const isGlowing = msg.id === glowMessageId;
          
          return (
            <div key={msg.id} className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row animate-in slide-in-from-bottom-2 duration-300'}`}>
              {!isMe && (
                <div className={`w-9 h-9 rounded-full overflow-hidden shrink-0 border border-white/10 shadow-lg ${isAdmin ? 'admin-bubble-anim' : ''}`}>
                  <img src={msg.userAvatar} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                {!isMe && (
                  <div className="flex items-center gap-2 mb-1 ml-1">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${isAdmin ? 'admin-text-anim' : 'text-gray-500'}`}>
                      {msg.userName}
                    </span>
                    {isAdmin && (
                      <span className="bg-white text-black text-[6px] font-black px-1 rounded-sm flex items-center h-3">
                        PEMILIK
                      </span>
                    )}
                  </div>
                )}
                
                <div 
                  className={`px-4 py-2.5 rounded-2xl text-[13px] font-medium leading-relaxed transition-all border ${
                    isMe 
                      ? `bg-white text-black rounded-tr-none border-transparent ${isGlowing ? 'nexa-glow' : ''}` 
                      : isAdmin 
                        ? 'bg-black border border-white/30 text-white rounded-tl-none admin-bubble-anim'
                        : `bg-zinc-900 border-white/5 text-white rounded-tl-none ${isGlowing ? 'nexa-glow' : ''}`
                  }`}
                >
                  {msg.text}
                </div>
                
                <div className="flex items-center gap-1 mt-1 px-1 opacity-40">
                  <span className="text-[7px] text-gray-500 font-bold tracking-widest">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-28 left-0 right-0 px-4 z-40 max-w-lg mx-auto w-full">
        {isBanned && (
          <div className="mb-3 glass-dark border border-red-900/50 rounded-3xl p-4 flex items-center gap-3 animate-in slide-in-from-bottom-4 shadow-2xl">
            <AlertTriangle size={18} className="text-red-500" />
            <div className="flex-1">
              <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">PROTOKOL SPAM AKTIF</p>
              <p className="text-[8px] text-gray-500 font-bold uppercase">Pulih dalam {Math.floor(banTimeRemaining/60)}:{ (banTimeRemaining%60).toString().padStart(2,'0') }</p>
            </div>
          </div>
        )}
        
        <form 
          onSubmit={handleSendMessage}
          className={`glass-dark rounded-full h-16 flex items-center px-2 border transition-all duration-500 ${
            isBanned ? 'border-red-900/30 opacity-40' : 'border-white/10 shadow-2xl'
          }`}
        >
          <div className="flex-1 flex items-center px-4">
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isBanned || cooldown > 0}
              placeholder={isBanned ? "SISTEM TERKUNCI" : cooldown > 0 ? `SYNC... (${cooldown}d)` : "KETIK PESAN..."}
              className="w-full bg-transparent border-none outline-none text-white text-[13px] placeholder:text-gray-800 font-medium"
            />
          </div>
          
          <button 
            type="submit"
            disabled={isBanned || cooldown > 0 || !inputText.trim()}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              inputText.trim() && !isBanned && cooldown === 0 
              ? 'bg-white text-black hover:scale-105 active:scale-95 shadow-lg' 
              : 'bg-white/5 text-gray-800'
            }`}
          >
            {cooldown > 0 ? <span className="text-[10px] font-black">{cooldown}</span> : <Send size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatView;
