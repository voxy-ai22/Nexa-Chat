
import React, { useState } from 'react';
import { User, Suggestion } from '../types';
import { Send, Inbox, Trash2, User as UserIcon, MessageSquareQuote } from 'lucide-react';

interface SaranViewProps {
  user: User;
  suggestions: Suggestion[];
  setSuggestions: React.Dispatch<React.SetStateAction<Suggestion[]>>;
  notify: (msg: string, type?: 'info' | 'success' | 'alert') => void;
}

const SaranView: React.FC<SaranViewProps> = ({ user, suggestions, setSuggestions, notify }) => {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const isAdmin = user.role === 'admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    setSending(true);
    
    try {
      const newSuggestion: Suggestion = {
        id: Math.random().toString(36).substr(2, 9),
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        content: input,
        timestamp: Date.now()
      };

      setSuggestions(prev => [newSuggestion, ...prev]);
      setInput('');
      notify("SARAN DIKIRIM KE PUSAT", "success");
    } catch (err) {
      notify("PROTOKOL GAGAL: ULANGI TRANSMISI", "alert");
    } finally {
      setSending(false);
    }
  };

  const deleteSuggestion = (id: string) => {
    if (confirm("Hapus permanen data ini dari basis data?")) {
      setSuggestions(prev => prev.filter(s => s.id !== id));
      notify("REKOR DIHAPUS", "alert");
    }
  };

  if (isAdmin) {
    return (
      <div className="p-6 h-full flex flex-col animate-in fade-in duration-500">
        <div className="mb-8">
          <h2 className="text-2xl font-black italic tracking-tighter uppercase">KOTAK MASUK SARAN</h2>
          <p className="text-gray-500 text-[10px] font-bold tracking-[0.3em] uppercase mt-1">Umpan balik langsung dari node jaringan</p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto pb-24">
          {suggestions.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center glass rounded-[40px] opacity-20 border-dashed border-2">
              <Inbox size={48} className="mb-4" />
              <span className="text-[12px] font-black tracking-[0.3em] uppercase">Tidak Ada Data Masuk</span>
            </div>
          ) : (
            suggestions.map(s => (
              <div key={s.id} className="glass rounded-[32px] p-6 border-white/5 space-y-4 group hover:bg-white/5 transition-all">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shrink-0">
                      <img src={s.userAvatar} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black text-white uppercase tracking-widest">{s.userName}</h4>
                      <p className="text-[8px] text-gray-600 font-bold uppercase tracking-tight">{new Date(s.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteSuggestion(s.id)} 
                    className="p-2 text-gray-700 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="relative">
                  <MessageSquareQuote size={16} className="absolute -top-1 -left-1 text-white/10" />
                  <p className="text-xs font-medium text-gray-300 leading-relaxed pl-5">
                    {s.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col animate-in fade-in duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-black italic tracking-tighter uppercase">SARAN & KRITIK</h2>
        <p className="text-gray-500 text-[10px] font-bold tracking-[0.3em] uppercase mt-1">Saluran Pengiriman Pusat Terenkripsi</p>
      </div>

      <div className="flex-1 space-y-6">
        <div className="glass rounded-[40px] p-8 border-white/10 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center">
              <UserIcon size={20} />
            </div>
            <div>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Identitas Pengirim</span>
              <span className="text-sm font-black uppercase tracking-tight">{user.name}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-600 uppercase tracking-[0.3em] ml-2">Isi Pesan</label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Kirimkan ide, kritik, atau saran bisnis Anda di sini..."
                className="w-full h-40 bg-white/5 border border-white/10 rounded-3xl p-6 text-sm text-white outline-none focus:border-white/40 transition-all placeholder:text-gray-800 resize-none leading-relaxed"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="w-full h-14 rounded-full bg-white text-black font-black uppercase tracking-[0.4em] text-xs flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:grayscale shadow-xl shadow-white/5"
            >
              {sending ? "TRANSMISI..." : <><Send size={16} /> KIRIM KE PUSAT</>}
            </button>
          </form>
        </div>

        <div className="px-6 py-4 glass rounded-3xl opacity-50 flex items-center gap-4">
           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
           <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Koneksi Stabil: Terowongan AES 256-bit Aktif</p>
        </div>
      </div>
    </div>
  );
};

export default SaranView;