
import React, { useState, useEffect, useRef } from 'react';
import { User, Message } from '../types';
import { Send, AlertTriangle, Smile, Star, X, Zap, Heart, Brain, Cpu, MessageSquare, Image as ImageIcon, Flag, List } from 'lucide-react';
import { saveToDB, broadcastMessage, getDB, toggleFavoriteSticker } from '../utils/storage';
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
  "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExNHI5ZzNidmxnMGswODFvNW9sZW15b2x0OHY2bXh6eGZpZnR5enp5ZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/3o7TKURP8M6jJ9q1Lq/giphy.gif"
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

  // Helper untuk konversi URL gambar ke Base64 PNG menggunakan Canvas agar format tetap solid
  const convertToPngBase64 = async (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject(new Error("Canvas context failed"));
        }
      };
      img.onerror = () => reject(new Error("Image load failed"));
      img.src = url;
    });
  };

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
      notify("ANTISPAM SECURITY: SISTEM DIKUNCI", "alert");
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

      // GAME JAWABAN CHECKER
      if (activeGame && !lowerText.startsWith('.')) {
        if (lowerText === activeGame.answer.toLowerCase().trim()) {
          addBotMessage(`🎉 JAWABAN BENAR!\n\nTarget: ${activeGame.answer.toUpperCase()}\n${activeGame.description ? `Info: ${activeGame.description}` : ''}`, { 
            name: 'NEXA GAME', 
            avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Winner' 
          });
          setActiveGame(null);
        } else {
          addBotMessage(`❌ SALAH! Ketik jawaban lagi atau .nyerah`, { 
            name: 'NEXA GAME', 
            avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Ops' 
          });
        }
        setIsSending(false);
        return;
      }

      // .MENU COMMAND
      if (lowerText === '.menu') {
        const menuText = `📂 *NEXA GLOBAL SYSTEM MENU*\n\n` +
          `🤖 *AI HUB*\n` +
          `└ .ai <pertanyaan>\n\n` +
          `🎮 *GAMES*\n` +
          `├ .tebakgambar\n` +
          `├ .asahotak\n` +
          `└ .nyerah\n\n` +
          `✨ *MAKER*\n` +
          `├ .brat <teks>\n` +
          `└ .sticker\n\n` +
          `🛠️ *UTILITY*\n` +
          `└ .menu\n\n` +
          `_Sistem reset otomatis setiap jam 07.00 AM_`;
        
        addBotMessage(menuText, { 
          name: 'NEXA SYSTEM', 
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=System' 
        });
      }

      // .AI (NEOXR)
      else if (lowerText.startsWith('.ai ')) {
        const query = text.slice(4).trim();
        const aiResponse = await getAISuggestion(query);
        addBotMessage(aiResponse, { 
          name: 'NEXA AI HUB', 
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=AIHub' 
        });
      } 
      
      // .TEBAKGAMBAR (CONVERT PNG)
      else if (lowerText === '.tebakgambar') {
        notify("MENGUNDUH MEDIA GAMBAR...", "info");
        const res = await fetch(`https://api.neoxr.eu/api/whatimg?apikey=${API_KEY_NEOXR}`);
        const data = await res.json();
        if (data.status) {
          try {
            const pngData = await convertToPngBase64(data.data.image);
            addBotMessage(`🖼️ TEBAK GAMBAR\nApa maksud dari gambar di atas?`, { 
              name: 'NEXA GAME', 
              avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=VisualGame',
              imageUrl: pngData 
            });
            setActiveGame({ 
              type: 'tebakgambar', 
              answer: data.data.jawaban,
              description: data.data.deskripsi 
            });
          } catch (err) {
            addBotMessage(`Gagal memproses gambar. Menggunakan URL langsung.`, { imageUrl: data.data.image });
          }
        }
      }

      // .ASAHOTAK
      else if (lowerText === '.asahotak') {
        const res = await fetch(`https://api.nexray.web.id/games/asahotak`);
        const data = await res.json();
        if (data.status) {
          addBotMessage(`🧩 ASAH OTAK\n\nSoal: ${data.result.soal}`, { 
            name: 'NEXA GAME',
            avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=PuzzleGame'
          });
          setActiveGame({ type: 'asahotak', answer: data.result.jawaban });
        }
      }

      // .NYERAH
      else if (lowerText === '.nyerah' && activeGame) {
        addBotMessage(`🏳️ MENYERAH.\nJawaban: ${activeGame.answer.toUpperCase()}`, { 
          name: 'NEXA GAME', 
          avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=WhiteFlag' 
        });
        setActiveGame(null);
      }

      // .BRAT (CONVERT PNG)
      else if (lowerText.startsWith('.brat ')) {
        const query = text.slice(6).trim();
        notify("MEMBUAT MEDIA BRAT...", "info");
        const rawUrl = `https://api.nexray.web.id/maker/brathd?text=${encodeURIComponent(query)}`;
        try {
          const pngData = await convertToPngBase64(rawUrl);
          addBotMessage(``, { imageUrl: pngData });
        } catch (err) {
          addBotMessage(`BRAT GENERATED:`, { imageUrl: rawUrl });
        }
      }

      // .STICKER
      else if (lowerText === '.sticker') {
        const randomSticker = DEFAULT_STICKERS[Math.floor(Math.random() * DEFAULT_STICKERS.length)];
        addBotMessage("", { stickerUrl: randomSticker });
      }

    } catch (err) {
      console.error("NEXA_CORE_ERROR:", err);
      notify("KESALAHAN TRANSMISI", "alert");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendSticker = (url: string) => {
    handleSendMessage(undefined, { stickerUrl: url });
  };

  const handleToggleFav = (e: React.MouseEvent, url: string) => {
    if (e) e.stopPropagation();
    const newFavs = toggleFavoriteSticker(url);
    setFavorites(newFavs);
    notify(newFavs.includes(url) ? "SIMPAN" : "HAPUS", "success");
  };

  return (
    <div className="flex flex-col h-full bg-black relative overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pt-4 pb-56 space-y-6 scroll-smooth">
        <div className="px-4 py-3 glass rounded-2xl mb-4 border-white/5 text-center">
          <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white/40">
            NEXA GLOBAL JARINGAN AMAN • RESET OTOMATIS 07:00 AM
          </p>
        </div>

        {messages.map((msg) => {
          const isMe = msg.userId === user.id;
          const isBot = msg.role === 'bot';
          const isSticker = !!msg.stickerUrl;
          const isImage = !!msg.imageUrl;
          const isAlreadyFav = favorites.includes(msg.stickerUrl || msg.imageUrl || "");
          
          return (
            <div key={msg.id} className={`flex items-end gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} animate-in fade-in slide-in-from-bottom-2`}>
              {!isMe && (
                <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-white/10 bg-zinc-900">
                  <img src={msg.userAvatar} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%]`}>
                {!isMe && <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1 ml-1">{msg.userName}</span>}
                
                {isSticker ? (
                  <img src={msg.stickerUrl} onClick={() => handleToggleFav(null as any, msg.stickerUrl!)} className="w-32 h-32 object-contain cursor-pointer" alt="sticker" />
                ) : (
                  <div className={`px-4 py-3 rounded-2xl text-[13px] font-medium transition-all border whitespace-pre-wrap ${
                    isMe ? 'bg-white text-black border-transparent' : 'bg-zinc-900 border-white/5 text-white'
                  }`}>
                    {msg.text}
                    {isImage && (
                      <div className="mt-3 rounded-xl overflow-hidden border border-white/10 bg-black">
                        <img src={msg.imageUrl} className="w-full h-auto max-h-72 object-contain" alt="media" />
                        <button onClick={(e) => handleToggleFav(e, msg.imageUrl!)} className="w-full py-2 bg-white/5 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">
                          {isAlreadyFav ? "TERSIMPAN" : "SIMPAN MEDIA"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <span className="text-[7px] text-gray-800 font-bold uppercase mt-1 px-1">
                  {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        {isSending && <div className="text-[8px] font-black uppercase tracking-widest text-white/20 ml-12 animate-pulse">Sinkronisasi Jaringan...</div>}
      </div>

      {activeGame && (
        <div className="fixed bottom-52 left-1/2 -translate-x-1/2 z-30 px-6 py-2 glass-dark border border-white/10 rounded-full flex items-center gap-4 shadow-2xl">
          <Brain size={12} className="text-white animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-widest text-white">{activeGame.type.toUpperCase()} AKTIF</span>
          <button onClick={() => handleSendMessage(undefined, { text: '.nyerah' })} className="text-red-500 text-[8px] font-black border-l border-white/10 pl-3">NYERAH</button>
        </div>
      )}

      {/* QUICK ACTIONS BAR */}
      <div className="fixed bottom-48 left-0 right-0 flex justify-center gap-2 px-4 z-30 overflow-x-auto no-scrollbar pb-2">
        <button onClick={() => handleSendMessage(undefined, { text: '.menu' })} className="flex items-center gap-2 px-4 py-2 glass rounded-full border-white/5 hover:bg-white/10 transition-all active:scale-95 shrink-0">
          <List size={12} className="text-white"/>
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60">.menu</span>
        </button>
        <button onClick={() => setInputText('.ai ')} className="flex items-center gap-2 px-4 py-2 glass rounded-full border-white/5 hover:bg-white/10 transition-all active:scale-95 shrink-0">
          <Cpu size={12} className="text-white"/>
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60">.ai</span>
        </button>
        <button onClick={() => handleSendMessage(undefined, { text: '.tebakgambar' })} className="flex items-center gap-2 px-4 py-2 glass rounded-full border-white/5 hover:bg-white/10 transition-all active:scale-95 shrink-0">
          <ImageIcon size={12} className="text-white"/>
          <span className="text-[10px] font-black uppercase tracking-widest text-white/60">.tebak</span>
        </button>
      </div>

      <div className="fixed bottom-28 left-0 right-0 px-4 z-40 max-w-lg mx-auto">
        <form onSubmit={handleSendMessage} className="glass-dark rounded-full h-16 flex items-center px-2 border border-white/10 relative">
          <button type="button" onClick={() => setShowStickers(!showStickers)} className="w-12 h-12 rounded-full flex items-center justify-center text-gray-500 hover:text-white">
            <Smile size={22} />
          </button>
          <input 
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isBanned || isSending}
            placeholder={activeGame ? "Jawaban..." : "Ketik .menu untuk daftar perintah"}
            className="flex-1 bg-transparent border-none outline-none text-white text-[13px] px-3 placeholder:text-zinc-800"
          />
          <button type="submit" className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center">
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatView;
