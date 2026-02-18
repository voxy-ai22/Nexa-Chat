
import React, { useState, useEffect, useRef } from 'react';
import { User, Message } from '../types';
import { Send, AlertTriangle, Smile, Star, X, Zap, Image as ImageIcon, Heart } from 'lucide-react';
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
  "https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHI5ZzNidmxnMGswODFvNW9sZW15b2x0OHY2bXh6eGZpZnR5enp5ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3o7TKv6f16Lsh2NnLq/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYncwdHdyMmlyZmlzNnl1ZTVnY280dnV3eGZpZnR5enp5ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/T3VvAsu5P38pT7hY8c/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYncwdHdyMmlyZmlzNnl1ZTVnY280dnV3eGZpZnR5enp5ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/joxg7Y1qB69YQYyYmQ/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZHhyeXp4ZWZpZnR5enp5ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/MDJ9NmCdkZ5F6/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3N2ZXZmZWZpZnR5enp5ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/C9x8gX02SnMIo/giphy.gif"
];

const ChatView: React.FC<ChatViewProps> = ({ user, messages, setMessages, notify }) => {
  const [inputText, setInputText] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [isBanned, setIsBanned] = useState(false);
  const [banTimeRemaining, setBanTimeRemaining] = useState(0);
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
    if ((!text && !customMsg?.stickerUrl && !customMsg?.imageUrl) || isBanned || cooldown > 0 || isSending) return;

    if (messageCount >= 25) {
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
      imageUrl: customMsg?.imageUrl,
      timestamp: Date.now(),
      role: user.role
    };

    try {
      const db = getDB();
      let updatedMessages = [...db.messages, newMessage];
      
      const isBratCommand = text?.toLowerCase().startsWith('.brat ');
      const isStickerCommand = text?.toLowerCase().startsWith('.sticker');
      
      let botMessage: Message | null = null;

      if (isBratCommand) {
        const query = text.slice(6).trim();
        if (query) {
          botMessage = {
            id: 'bot-' + Math.random().toString(36).substr(2, 9),
            userId: 'nexa-bot',
            userName: 'NEXA BOT',
            userAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Nexa',
            text: `GENERATED BRAT: "${query}"`,
            imageUrl: `https://api.nexray.web.id/maker/brathd?text=${encodeURIComponent(query)}`,
            timestamp: Date.now() + 500,
            role: 'bot'
          };
          updatedMessages.push(botMessage);
        }
      } else if (isStickerCommand) {
        const randomSticker = DEFAULT_STICKERS[Math.floor(Math.random() * DEFAULT_STICKERS.length)];
        botMessage = {
          id: 'bot-' + Math.random().toString(36).substr(2, 9),
          userId: 'nexa-bot',
          userName: 'NEXA BOT',
          userAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Nexa',
          text: "",
          stickerUrl: randomSticker,
          timestamp: Date.now() + 500,
          role: 'bot'
        };
        updatedMessages.push(botMessage);
      }

      saveToDB({ messages: updatedMessages });
      broadcastMessage(newMessage);
      if (botMessage) {
        setTimeout(() => {
          broadcastMessage(botMessage!);
          setMessages(prev => {
            if (prev.find(m => m.id === botMessage!.id)) return prev;
            return [...prev, botMessage!];
          });
        }, 500);
      }

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
    notify(newFavs.includes(url) ? "STIKER DISIMPAN KE FAVORIT" : "DIHAPUS DARI FAVORIT", "success");
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
            NEXA SECURE CHAT • RESET OTOMATIS 07:00 AM
          </p>
        </div>

        {messages.map((msg) => {
          const isMe = msg.userId === user.id;
          const isBot = msg.role === 'bot';
          const isSticker = !!msg.stickerUrl;
          const isImage = !!msg.imageUrl;
          const favoritableUrl = msg.stickerUrl || msg.imageUrl;
          const isAlreadyFav = favoritableUrl ? favorites.includes(favoritableUrl) : false;
          
          return (
            <div key={msg.id} className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
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
                    {isBot && <span className="bg-blue-500 text-white text-[6px] font-black px-1 rounded-sm">SYSTEM</span>}
                  </div>
                )}
                
                {isSticker ? (
                  <div className="relative group cursor-pointer" onClick={(e) => handleToggleFav(e, msg.stickerUrl!)}>
                    <img src={msg.stickerUrl} className="w-28 h-28 object-contain animate-in zoom-in-90 duration-300" alt="sticker" />
                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-all">
                      <div className={`p-1.5 rounded-full glass border-white/20 ${isAlreadyFav ? 'bg-yellow-500 text-black border-transparent' : 'text-white'}`}>
                        <Star size={10} className={isAlreadyFav ? "fill-current" : ""} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`relative group px-4 py-2.5 rounded-2xl text-[13px] font-medium transition-all border ${
                    isMe 
                      ? 'bg-white text-black rounded-tr-none border-transparent shadow-lg shadow-white/5' 
                      : isBot 
                        ? 'bg-blue-900/10 border-blue-500/30 text-white rounded-tl-none'
                        : 'bg-zinc-900 border-white/5 text-white rounded-tl-none'
                  }`}>
                    {msg.text}
                    {isImage && (
                      <div className="mt-3 relative group/img">
                        <div className="rounded-lg overflow-hidden border border-white/10 bg-black/50">
                          <img src={msg.imageUrl} className="w-full h-auto max-h-64 object-contain" alt="bot-gen" />
                        </div>
                        <button 
                          onClick={(e) => handleToggleFav(e, msg.imageUrl!)}
                          className={`mt-2 w-full py-2 rounded-xl glass border-white/10 flex items-center justify-center gap-2 transition-all hover:bg-white/10 active:scale-95 ${isAlreadyFav ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' : 'text-gray-400'}`}
                        >
                          <Star size={12} className={isAlreadyFav ? "fill-current" : ""} />
                          <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                            {isAlreadyFav ? "STIKER TERSIMPAN" : "SIMPAN SEBAGAI STIKER"}
                          </span>
                        </button>
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
        <div className="fixed bottom-48 left-4 right-4 z-[60] max-w-lg mx-auto h-80 glass-dark rounded-[40px] border border-white/10 flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-500 shadow-2xl">
          <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/5">
            <div className="flex gap-6">
              <button 
                onClick={() => setStickerTab('default')}
                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${stickerTab === 'default' ? 'text-white scale-105' : 'text-gray-600'}`}
              >
                <Zap size={14} className={stickerTab === 'default' ? 'text-blue-400' : ''} /> Nexa Pack
              </button>
              <button 
                onClick={() => setStickerTab('fav')}
                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${stickerTab === 'fav' ? 'text-white scale-105' : 'text-gray-600'}`}
              >
                <Heart size={14} className={favorites.length > 0 ? "text-red-500 fill-red-500" : ""} /> Saved ({favorites.length})
              </button>
            </div>
            <button onClick={() => setShowStickers(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 grid grid-cols-4 gap-4 content-start bg-black/20">
            {(stickerTab === 'default' ? DEFAULT_STICKERS : favorites).map((url, i) => (
              <div key={url + i} className="relative group aspect-square flex items-center justify-center bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                <img 
                  src={url} 
                  onClick={() => handleSendSticker(url)}
                  className="w-[80%] h-[80%] object-contain cursor-pointer hover:scale-115 transition-transform active:scale-90" 
                  alt="sticker-item"
                />
                <button 
                  onClick={(e) => handleToggleFav(e, url)}
                  className={`absolute -top-1 -right-1 p-1.5 rounded-full glass border-white/20 opacity-0 group-hover:opacity-100 transition-all ${favorites.includes(url) ? 'bg-yellow-500 text-black border-transparent shadow-lg' : 'text-white'}`}
                >
                  <Star size={10} className={favorites.includes(url) ? "fill-current" : ""} />
                </button>
              </div>
            ))}
            
            {stickerTab === 'fav' && favorites.length === 0 && (
              <div className="col-span-4 h-full flex flex-col items-center justify-center py-10 opacity-30 text-center">
                 <div className="w-16 h-16 rounded-3xl border-2 border-dashed border-white/50 flex items-center justify-center mb-4">
                    <Heart size={32} />
                 </div>
                 <p className="text-[9px] font-black uppercase tracking-[0.3em] leading-relaxed">
                   KOLEKSI KOSONG<br/>FAVORITKAN GAMBAR UNTUK DISIMPAN
                 </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* INPUT BAR */}
      <div className="fixed bottom-28 left-0 right-0 px-4 z-40 max-w-lg mx-auto w-full">
        {isBanned && (
          <div className="mb-3 glass-dark border border-red-900/50 rounded-3xl p-4 flex items-center gap-3 animate-in slide-in-from-bottom-4 shadow-xl shadow-red-500/5">
            <AlertTriangle size={18} className="text-red-500" />
            <p className="text-[9px] font-black text-red-500 uppercase tracking-widest flex-1">
              LOCKOUT AKTIF: {Math.floor(banTimeRemaining / 60)}m {banTimeRemaining % 60}s
            </p>
          </div>
        )}
        
        <form 
          onSubmit={handleSendMessage}
          className="glass-dark rounded-full h-16 flex items-center px-2 border border-white/10 shadow-2xl relative"
        >
          <button 
            type="button"
            onClick={() => setShowStickers(!showStickers)}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${showStickers ? 'bg-white text-black scale-90' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
          >
            <Smile size={22} />
          </button>

          <div className="flex-1 flex items-center px-3">
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isBanned || cooldown > 0 || isSending}
              placeholder={isBanned ? "SISTEM TERKUNCI" : "Kirim pesan / .brat / .sticker"}
              className="w-full bg-transparent border-none outline-none text-white text-[13px] font-medium placeholder:text-gray-700"
            />
          </div>
          
          <button 
            type="submit"
            disabled={isBanned || cooldown > 0 || !inputText.trim() || isSending}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              inputText.trim() && !isBanned && !isSending ? 'bg-white text-black shadow-lg shadow-white/20' : 'text-gray-800 bg-white/5'
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
