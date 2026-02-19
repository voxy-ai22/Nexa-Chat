
import React, { useState, useEffect, useRef } from 'react';
import { User, Message } from '../types';
import { Send, AlertTriangle, Smile, Star, X, Zap, Heart, Brain, Cpu, MessageSquare, Image as ImageIcon, Flag } from 'lucide-react';
import { saveToDB, broadcastMessage, getDB, toggleFavoriteSticker } from '../utils/storage';
// Import the Gemini AI integration
import { getAISuggestion } from '../lib/gemini';

interface ChatViewProps {
  user: User;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  notify: (msg: string, type?: 'info' | 'success' | 'alert') => void;
}

interface ActiveGame {
  type: 'asahotak' | 'tebakgambar';
  answer: string;
  description?: string;
}

const DEFAULT_STICKERS = [
  "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExOHI5ZzNidmxnMGswODFvNW9sZW15b2x0OHY2bXh6eGZpZnR5enp5ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/u0S44uH95P45N7Vj3q/giphy.gif",
  "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExcWc1bWd0bXdzbWltZ25idWlsbXh6eGZpZnR5enp5ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/hV72l4Y6v0R3vE7W4q/giphy.gif",
  "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3Z0bXdzbWltZ25idWlsbXh6eGZpZnR5enp5ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/L8u0p3p5WpW4E/giphy.gif",
  "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHI5ZzNidmxnMGswODFvNW9sZW15b2x0OHY2bXh6eGZpZnR5enp5ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3o7TKURP8M6jJ9q1Lq/giphy.gif",
  "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHI5ZzNidmxnMGswODFvNW9sZW15b2x0OHY2bXh6eGZpZnR5enp5ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/l41lMvD8p6O2p5F0A/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYncwdHdyMmlyZmlzNnl1ZTVnY280dnV3eGZpZnR5enp5ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/T3VvAsu5P38pT7hY8c/giphy.gif",
  "https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYncwdHdyMmlyZmlzNnl1ZTVnY280dnV3eGZpZnR5enp5ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/joxg7Y1qB69YQYyYmQ/giphy.gif",
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
  const [activeGame, setActiveGame] = useState<ActiveGame | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const API_KEY_NEOXR = "BA1vTv";

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

  const addBotMessage = (text: string, options?: { imageUrl?: string, stickerUrl?: string, role?: string, name?: string, avatar?: string }) => {
    const botMsg: Message = {
      id: 'bot-' + Math.random().toString(36).substr(2, 9),
      userId: 'nexa-bot',
      userName: options?.name || 'NEXA BOT',
      userAvatar: options?.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=Nexa',
      text,
      imageUrl: options?.imageUrl,
      stickerUrl: options?.stickerUrl,
      timestamp: Date.now(),
      role: 'bot'
    };
    
    setMessages(prev => [...prev, botMsg]);
    const db = getDB();
    saveToDB({ messages: [...db.messages, botMsg] });
    broadcastMessage(botMsg);
  };

  const handleSendMessage = async (e?: React.FormEvent, customMsg?: Partial<Message>) => {
    if (e) e.preventDefault();
    
    const text = customMsg?.text || inputText.trim();
    if ((!text && !customMsg?.stickerUrl && !customMsg?.imageUrl) || isBanned || cooldown > 0 || isSending) return;

    if (messageCount >= 60) {
      setIsBanned(true);
      setBanTimeRemaining(300);
      notify("ANTISPAM SECURITY: ACCESS RESTRICTED", "alert");
      return;
    }

    setIsSending(true);
    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatar,
      text: text || "",
      stickerUrl: customMsg?.stickerUrl,
      imageUrl: customMsg?.imageUrl,
      timestamp: Date.now(),
      role: user.role
    };

    setMessages(prev => [...prev, newMessage]);
    const db = getDB();
    saveToDB({ messages: [...db.messages, newMessage] });
    broadcastMessage(newMessage);
    
    setInputText('');
    setCooldown(1);
    setMessageCount(prev => prev + 1);

    try {
      const lowerText = text.toLowerCase().trim();

      // --- JAWABAN GAME CHECKER ---
      if (activeGame && !lowerText.startsWith('.')) {
        if (lowerText === activeGame.answer.toLowerCase().trim()) {
          addBotMessage(`🎉 JAWABAN ANDA BENAR!\n\nJawaban: ${activeGame.answer.toUpperCase()}\n${activeGame.description ? `Deskripsi: ${activeGame.description}` : ''}`, { 
            name: 'NEXA GAME', 
            avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Winner' 
          });
          setActiveGame(null);
        } else {
          addBotMessage(`❌ JAWABAN SALAH!\nCoba lagi atau ketik .nyerah`, { 
            name: 'NEXA GAME', 
            avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Ops' 
          });
        }
        setIsSending(false);
        return;
      }

      // --- COMMAND HANDLERS ---
      
      // 1. .AI (Switching to Gemini model for elite business consulting)
      if (lowerText.startsWith('.ai ')) {
        const query = text.slice(4).trim();
        // Fix: Leverage Gemini AI via the defined business consultant utility
        const aiResponse = await getAISuggestion(query);
        addBotMessage(aiResponse, { 
          name: 'NEXA AI HUB', 
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AIHub' 
        });
      } 
      
      // 2. .NYERAH (SURRENDER)
      else if (lowerText === '.nyerah' && activeGame) {
        addBotMessage(`🏳️ PROTOKOL MENYERAH.\nJawaban yang benar adalah: ${activeGame.answer.toUpperCase()}`, { 
          name: 'NEXA GAME', 
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=WhiteFlag' 
        });
        setActiveGame(null);
      }
      
      // 3. .ASAHOTAK
      else if (lowerText === '.asahotak') {
        const res = await fetch(`https://api.nexray.web.id/games/asahotak`);
        const data = await res.json();
        if (data.status) {
          addBotMessage(`🧩 ASAH OTAK\n\nSoal: ${data.result.soal}\n\nKetik jawaban Anda langsung di sini!`, { 
            name: 'NEXA GAME',
            avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=PuzzleGame'
          });
          setActiveGame({ type: 'asahotak', answer: data.result.jawaban });
        }
      } 
      
      // 4. .TEBAKGAMBAR (NEOXR)
      else if (lowerText === '.tebakgambar') {
        const res = await fetch(`https://api.neoxr.eu/api/whatimg?apikey=${API_KEY_NEOXR}`);
        const data = await res.json();
        if (data.status) {
          // data.data mengandung image, deskripsi, jawaban
          addBotMessage(`🖼️ TEBAK GAMBAR\nApa maksud dari gambar di atas?\n\nKetik jawaban Anda!`, { 
            name: 'NEXA GAME', 
            avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=VisualGame',
            imageUrl: data.data.image 
          });
          setActiveGame({ 
            type: 'tebakgambar', 
            answer: data.data.jawaban,
            description: data.data.deskripsi 
          });
        }
      }
      
      // 5. .BRAT
      else if (lowerText.startsWith('.brat ')) {
        const query = text.slice(6).trim();
        addBotMessage(`GENERATED BRAT: "${query}"`, { imageUrl: `https://api.nexray.web.id/maker/brathd?text=${encodeURIComponent(query)}` });
      }
      
      // 6. .IQC
      else if (lowerText.startsWith('.iqc ')) {
        const query = text.slice(5).trim();
        addBotMessage(`GENERATED IQC: "${query}"`, { imageUrl: `https://api.nexray.web.id/maker/iqc?text=${encodeURIComponent(query)}` });
      }
      
      // 7. .STICKER (RANDOM)
      else if (lowerText === '.sticker') {
        const randomSticker = DEFAULT_STICKERS[Math.floor(Math.random() * DEFAULT_STICKERS.length)];
        addBotMessage("", { stickerUrl: randomSticker });
      }

    } catch (err) {
      console.error("NEXA_CORE_ERROR:", err);
      notify("KESALAHAN TRANSMISI BOT", "alert");
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
    notify(newFavs.includes(url) ? "TERSIMPAN DI KOLEKSI" : "DIHAPUS DARI KOLEKSI", "success");
  };

  return (
    <div className="flex flex-col h-full bg-black relative overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pt-4 pb-56 space-y-6 scroll-smooth">
        <div className="px-4 py-3 glass rounded-2xl mb-4 border-white/5 text-center">
          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/40">
            NEXA SECURE SESSION • AUTOMATIC DATABASE SYNC
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

              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%]`}>
                {!isMe && (
                  <div className="flex items-center gap-2 mb-1 ml-1">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${isBot ? 'text-white/60' : 'text-gray-500'}`}>
                      {msg.userName}
                    </span>
                    {isBot && <span className="bg-white/10 text-white/80 text-[6px] font-black px-1.5 rounded-sm uppercase tracking-tighter">NEXA_BOT</span>}
                  </div>
                )}
                
                {isSticker ? (
                  <div className="relative group cursor-pointer" onClick={(e) => handleToggleFav(e, msg.stickerUrl!)}>
                    <img src={msg.stickerUrl} className="w-32 h-32 object-contain animate-in zoom-in-90 duration-300" alt="sticker" />
                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-all">
                      <div className={`p-1.5 rounded-full glass border-white/20 ${isAlreadyFav ? 'bg-white text-black border-transparent' : 'text-white'}`}>
                        <Star size={10} className={isAlreadyFav ? "fill-current" : ""} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={`relative group px-4 py-3 rounded-2xl text-[13px] font-medium transition-all border whitespace-pre-wrap ${
                    isMe 
                      ? 'bg-white text-black rounded-tr-none border-transparent shadow-lg shadow-white/5' 
                      : isBot 
                        ? 'bg-zinc-900/50 border-white/10 text-white rounded-tl-none'
                        : 'bg-zinc-900 border-white/5 text-white rounded-tl-none'
                  }`}>
                    {msg.text}
                    {isImage && (
                      <div className="mt-3 relative group/img">
                        <div className="rounded-xl overflow-hidden border border-white/10 bg-black shadow-2xl">
                          <img src={msg.imageUrl} className="w-full h-auto max-h-72 object-contain" alt="media" />
                        </div>
                        <button 
                          onClick={(e) => handleToggleFav(e, msg.imageUrl!)}
                          className={`mt-2 w-full py-2.5 rounded-xl glass border-white/10 flex items-center justify-center gap-2 transition-all hover:bg-white/10 active:scale-95 ${isAlreadyFav ? 'bg-white/10 text-white border-white/20' : 'text-gray-500'}`}
                        >
                          <Star size={12} className={isAlreadyFav ? "fill-current" : ""} />
                          <span className="text-[9px] font-black uppercase tracking-[0.2em]">
                            {isAlreadyFav ? "DIKOLEKSI" : "KOLEKSI MEDIA"}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                <span className="text-[7px] text-gray-700 font-bold uppercase tracking-widest mt-1 px-1">
                  {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        {isSending && (
          <div className="flex gap-2 items-center opacity-40 ml-12">
            <div className="flex gap-1">
              <span className="w-1 h-1 bg-white rounded-full animate-bounce"></span>
              <span className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
            <span className="text-[8px] font-black uppercase tracking-widest">NEXA_CORE_PROCESSING...</span>
          </div>
        )}
      </div>

      {/* GAME STATUS OVERLAY */}
      {activeGame && (
        <div className="fixed bottom-52 left-1/2 -translate-x-1/2 z-30 px-6 py-2 glass-dark border border-white/20 rounded-full flex items-center gap-3 animate-in slide-in-from-bottom-2 shadow-2xl">
          <Brain size={14} className="text-white animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">GAME {activeGame.type.toUpperCase()} AKTIF</span>
          <button onClick={() => handleSendMessage(undefined, { text: '.nyerah' })} className="flex items-center gap-1.5 pl-3 border-l border-white/10 text-red-500 hover:text-red-400 transition-colors">
            <Flag size={10} />
            <span className="text-[8px] font-black uppercase tracking-widest">NYERAH</span>
          </button>
        </div>
      )}

      {/* STICKER PANEL */}
      {showStickers && (
        <div className="fixed bottom-48 left-4 right-4 z-[60] max-w-lg mx-auto h-80 glass-dark rounded-[40px] border border-white/10 flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-500 shadow-2xl">
          <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/5">
            <div className="flex gap-6">
              <button onClick={() => setStickerTab('default')} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${stickerTab === 'default' ? 'text-white scale-105' : 'text-gray-600'}`}>
                <Zap size={14} className={stickerTab === 'default' ? 'text-white' : ''} /> Nexa Pack
              </button>
              <button onClick={() => setStickerTab('fav')} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${stickerTab === 'fav' ? 'text-white scale-105' : 'text-gray-600'}`}>
                <Heart size={14} className={favorites.length > 0 ? "text-white fill-white" : ""} /> Saved ({favorites.length})
              </button>
            </div>
            <button onClick={() => setShowStickers(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-colors">
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 grid grid-cols-4 gap-4 content-start bg-black/40">
            {(stickerTab === 'default' ? DEFAULT_STICKERS : favorites).map((url, i) => (
              <div key={url + i} className="relative group aspect-square flex items-center justify-center bg-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                <img src={url} onClick={() => handleSendSticker(url)} className="w-[85%] h-[85%] object-contain cursor-pointer hover:scale-115 transition-transform active:scale-90" alt="sticker" />
                <button onClick={(e) => handleToggleFav(e, url)} className={`absolute -top-1 -right-1 p-1.5 rounded-full glass border-white/20 opacity-0 group-hover:opacity-100 transition-all ${favorites.includes(url) ? 'bg-white text-black border-transparent shadow-lg' : 'text-white'}`}>
                  <Star size={10} className={favorites.includes(url) ? "fill-current" : ""} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QUICK ACTIONS */}
      {!showStickers && !isBanned && !activeGame && inputText.length === 0 && (
        <div className="fixed bottom-48 left-0 right-0 flex justify-center gap-2 px-4 z-30 overflow-x-auto no-scrollbar pb-2">
          <CommandTag icon={<Cpu size={12}/>} label=".ai" onClick={() => setInputText('.ai ')} />
          <CommandTag icon={<Brain size={12}/>} label=".asahotak" onClick={() => handleSendMessage(undefined, { text: '.asahotak' })} />
          <CommandTag icon={<ImageIcon size={12}/>} label=".tebakgambar" onClick={() => handleSendMessage(undefined, { text: '.tebakgambar' })} />
          <CommandTag icon={<Zap size={12}/>} label=".brat" onClick={() => setInputText('.brat ')} />
        </div>
      )}

      {/* INPUT BAR */}
      <div className="fixed bottom-28 left-0 right-0 px-4 z-40 max-w-lg mx-auto w-full">
        <form onSubmit={handleSendMessage} className="glass-dark rounded-full h-16 flex items-center px-2 border border-white/10 shadow-2xl relative">
          <button type="button" onClick={() => setShowStickers(!showStickers)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${showStickers ? 'bg-white text-black scale-90' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
            <Smile size={22} />
          </button>
          <div className="flex-1 flex items-center px-3">
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isBanned || isSending}
              placeholder={isBanned ? "SISTEM TERKUNCI" : activeGame ? "Ketik jawaban Anda..." : "Tanya NEXA .ai / .tebakgambar / .asahotak"}
              className="w-full bg-transparent border-none outline-none text-white text-[13px] font-medium placeholder:text-zinc-800"
            />
          </div>
          <button type="submit" disabled={isBanned || !inputText.trim() || isSending} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${inputText.trim() && !isBanned && !isSending ? 'bg-white text-black shadow-lg shadow-white/20' : 'text-zinc-800 bg-white/5'}`}>
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

const CommandTag: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void }> = ({ icon, label, onClick }) => (
  <button onClick={onClick} className="flex items-center gap-2 px-4 py-2 glass rounded-full border-white/5 hover:bg-white/10 transition-all active:scale-95 shrink-0">
    {icon}
    <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{label}</span>
  </button>
);

export default ChatView;
