
import React, { useState, useEffect, useRef } from 'react';
import { User, Message } from '../types';
import { Send, AlertTriangle, ShieldAlert, Cpu, Smile, Star, Trash2, X } from 'lucide-react';
import { saveToDB, broadcastMessage, getDB, toggleFavoriteSticker } from '../utils/storage';

interface ChatViewProps {
  user: User;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  notify: (msg: string, type?: 'info' | 'success' | 'alert') => void;
}

const DEFAULT_STICKERS = [
  "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHI5ZzNidmxnMGswODFvNW9sZW15b2x0OHY2bXh6eGZpZnR5enp5ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/u0S44uH95P45N7Vj3q/giphy.gif",
  "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExcWc1bWd0bXdzbWltZ25idWlsbXh6eGZpZnR5enp5ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/hV72l4Y6v0R3vE7W4q/giphy.gif",
  "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z0bXdzbWltZ25idWlsbXh6eGZpZnR5enp5ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/L8u0p3p5WpW4E/giphy.gif",
  "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHI5ZzNidmxnMGswODFvNW9sZW15b2x0OHY2bXh6eGZpZnR5enp5ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3o7TKURP8M6jJ9q1Lq/giphy.gif",
  "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHI5ZzNidmxnMGswODFvNW9sZW15b2x0OHY2bXh6eGZpZnR5enp5ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/l41lMvD8p6O2p5F0A/giphy.gif",
  "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHI5ZzNidmxnMGswODFvNW9sZW15b2x0OHY2bXh6eGZpZnR5enp5ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3o7TKv6f16Lsh2NnLq/giphy.gif"
];

const ChatView: React.FC<ChatViewProps> = ({ user, messages, setMessages, notify }) => {
  const [inputText, setInputText] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [isBanned, setIsBanned] = useState(false);
  const [banTimeRemaining, setBanTimeRemaining] = useState(0);
  const [glowMessageId, setGlowMessageId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [stickerTab, setStickerTab] = useState<'default' | 'fav'>('default');
  const [favorites, setFavorites] = useState<string[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const db = getDB();
    setFavorites(db.favoriteStickers || []);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  useEffect(() => {
    if (isBanned && banTimeRemaining > 0) {
      const timer = setTimeout(() => setBanTimeRemaining(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isBanned && banTimeRemaining === 0) {
      setIsBanned(false);
      setMessageCount(0);
    }
  }, [isBanned, banTimeRemaining]);

  const handleSendMessage = async (e?: React.FormEvent, customMsg?: Partial<Message>) => {
    if (e) e.preventDefault();
    
    const text = customMsg?.text || inputText.trim();
    if ((!text && !customMsg?.stickerUrl) || isBanned || cooldown > 0 || isSending) return;

    if (messageCount >= 20) {
      setIsBanned(true);
      setBanTimeRemaining(300);
      notify("PROTOKOL SPAM: AKSES DITANGGUHKAN", "alert");
      return;
    }

    setIsSending(true);
    const msgId = Math.random().toString(36).substr(2, 9);
    const newMessage: Message = {
      id: msgId,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      text: text || "",
      stickerUrl: customMsg?.stickerUrl,
      timestamp: Date.now(),
      role: user.role
    };

    try {
      const db = getDB();
      let updatedMessages = [...db.messages, newMessage];
      
      const isBratCommand = text?.startsWith('.Brat ');
      let botMessage: Message | null = null;

      if (isBratCommand) {
        const query = text.slice(6).trim();
        if (query) {
          botMessage = {
            id: 'bot-' + Math.random().toString(36).substr(2, 9),
            userId: 'nexa-bot',
            userName: 'NEXA BOT',
            userAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Nexa',
            text: `Hasil generate untuk: "${query}"`,
            imageUrl: `https://api.nexray.web.id/maker/brathd?text=${encodeURIComponent(query)}`,
            timestamp: Date.now() + 500,
            role: 'bot'
          };
          updatedMessages.push(botMessage);
        }
      }

      saveToDB({ messages: updatedMessages });
      broadcastMessage(newMessage);
      if (botMessage) setTimeout(() => broadcastMessage(botMessage!), 500);

      setMessages(updatedMessages);
      setInputText('');
      setCooldown(1);
      setMessageCount(prev => prev + 1);
      setShowStickers(false);
    } catch (err: any) {
      notify("GAGAL MENYIMPAN PESAN", "alert");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendSticker = (url: string) => {
    handleSendMessage(undefined, { stickerUrl: url });
  };

  const handleToggleFav = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    const newFavs = toggleFavoriteSticker(url);
    setFavorites(newFavs);
    notify(newFavs.includes(url) ? "DITAMBAH KE FAVORIT" : "DIHAPUS DARI FAVORIT", "info");
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-black relative overflow-hidden">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 pt-4 pb-48 space-y-6 scroll-smooth"
      >
        <div className="px-4 py-3 glass rounded-2xl mb-4 border-blue-500/20 text-center">
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-blue-400">
            Pesan direset otomatis setiap pukul 07:00 AM
          </p>
        </div>

        {messages.map((msg) => {
          const isMe = msg.userId === user.id;
          const isAdmin = msg.role === 'admin';
          const isBot = msg.role === 'bot';
          const isSticker = !!msg.stickerUrl;
          
          return (
            <div key={msg.id} className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              {!isMe && (
                <div className={`w-9 h-9 rounded-full overflow-hidden shrink-0 border border-white/10 ${isBot ? 'bg-blue-900/20 p-1' : ''}`}>
                  <img src={msg.userAvatar} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                {!isMe && (
                  <div className="flex items-center gap-2 mb-1 ml-1">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${isBot ? 'text-blue-400' : 'text-gray-500'}`}>
                      {msg.userName}
                    </span>
                    {isBot && <span className="bg-blue-500 text-white text-[6px] font-black px-1 rounded-sm">AI</span>}
                  </div>
                )}
                
                {isSticker ? (
                  <div className="relative group cursor-pointer" onClick={(e) => handleToggleFav(e, msg.stickerUrl!)}>
                    <img src={msg.stickerUrl} className="w-28 h-28 object-contain animate-in zoom-in-90 duration-300" alt="sticker" />
                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Star size={12} className={favorites.includes(msg.stickerUrl!) ? "fill-yellow-500 text-yellow-500" : "text-white"} />
                    </div>
                  </div>
                ) : (
                  <div className={`px-4 py-2.5 rounded-2xl text-[13px] font-medium transition-all border ${
                    isMe 
                      ? 'bg-white text-black rounded-tr-none border-transparent' 
                      : isBot 
                        ? 'bg-blue-900/10 border-blue-500/30 text-white rounded-tl-none'
                        : 'bg-zinc-900 border-white/5 text-white rounded-tl-none'
                  }`}>
                    {msg.text}
                    {msg.imageUrl && (
                      <div className="mt-3 rounded-lg overflow-hidden border border-white/10">
                        <img src={msg.imageUrl} className="w-full h-auto max-h-64 object-contain" alt="img" />
                      </div>
                    )}
                  </div>
                )}
                
                <span className="text-[7px] text-gray-700 font-bold uppercase tracking-widest mt-1 px-1">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* STICKER PANEL */}
      {showStickers && (
        <div className="fixed bottom-48 left-4 right-4 z-[60] max-w-lg mx-auto h-72 glass-dark rounded-[32px] border border-white/10 flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-500 shadow-2xl">
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <div className="flex gap-4">
              <button 
                onClick={() => setStickerTab('default')}
                className={`text-[10px] font-black uppercase tracking-widest transition-all ${stickerTab === 'default' ? 'text-white' : 'text-gray-600'}`}
              >
                Nexa Pack
              </button>
              <button 
                onClick={() => setStickerTab('fav')}
                className={`text-[10px] font-black uppercase tracking-widest transition-all ${stickerTab === 'fav' ? 'text-white' : 'text-gray-600'}`}
              >
                Saved ({favorites.length})
              </button>
            </div>
            <button onClick={() => setShowStickers(false)} className="text-gray-500 hover:text-white">
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 grid grid-cols-4 gap-4">
            {(stickerTab === 'default' ? DEFAULT_STICKERS : favorites).map((url, i) => (
              <div key={i} className="relative group aspect-square">
                <img 
                  src={url} 
                  onClick={() => handleSendSticker(url)}
                  className="w-full h-full object-contain cursor-pointer hover:scale-110 transition-transform active:scale-90" 
                  alt="sticker-item"
                />
                <button 
                  onClick={(e) => handleToggleFav(e, url)}
                  className="absolute -top-1 -right-1 p-1 bg-black/80 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Star size={10} className={favorites.includes(url) ? "fill-yellow-500 text-yellow-500" : "text-white"} />
                </button>
              </div>
            ))}
            {stickerTab === 'fav' && favorites.length === 0 && (
              <div className="col-span-4 h-full flex flex-col items-center justify-center opacity-20 text-center">
                 <Star size={32} className="mb-2" />
                 <p className="text-[8px] font-black uppercase tracking-widest">Belum ada stiker favorit</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* INPUT BAR */}
      <div className="fixed bottom-28 left-0 right-0 px-4 z-40 max-w-lg mx-auto w-full">
        {isBanned && (
          <div className="mb-3 glass-dark border border-red-900/50 rounded-3xl p-4 flex items-center gap-3 animate-in slide-in-from-bottom-4">
            <AlertTriangle size={18} className="text-red-500" />
            <p className="text-[9px] font-black text-red-500 uppercase tracking-widest flex-1">SPAM DETECTED: ACCESS DENIED</p>
          </div>
        )}
        
        <form 
          onSubmit={handleSendMessage}
          className="glass-dark rounded-full h-16 flex items-center px-2 border border-white/10 shadow-2xl"
        >
          <button 
            type="button"
            onClick={() => setShowStickers(!showStickers)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${showStickers ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
          >
            <Smile size={22} />
          </button>

          <div className="flex-1 flex items-center px-2">
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isBanned || cooldown > 0 || isSending}
              placeholder={isBanned ? "SISTEM TERKUNCI" : "Kirim pesan / .Brat [teks]"}
              className="w-full bg-transparent border-none outline-none text-white text-[13px] font-medium"
            />
          </div>
          
          <button 
            type="submit"
            disabled={isBanned || cooldown > 0 || !inputText.trim() || isSending}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              inputText.trim() && !isBanned && !isSending ? 'bg-white text-black' : 'text-gray-800 bg-white/5'
            }`}
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatView;
