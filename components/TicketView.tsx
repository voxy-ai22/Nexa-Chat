
import React, { useState } from 'react';
import { User, Ticket } from '../types';
import { Plus, Ticket as TicketIcon, Clock, CheckCircle, Trash2, Inbox, X, Send } from 'lucide-react';

interface TicketViewProps {
  user: User;
  tickets: Ticket[];
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  notify: (msg: string, type?: 'info' | 'success' | 'alert') => void;
}

const TicketView: React.FC<TicketViewProps> = ({ user, tickets, setTickets, notify }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const isAdmin = user.role === 'admin';

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim()) return;

    const newTicket: Ticket = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      userName: user.name,
      subject: newSubject,
      status: 'open',
      timestamp: Date.now()
    };

    setTickets(prev => [newTicket, ...prev]);
    setNewSubject('');
    setIsCreating(false);
    notify("TIKET DISIARKAN: PUSAT TELAH DIBERITAHU", "success");
  };

  const deleteTicket = (id: string) => {
    if (confirm("Hapus permanen tiket ini dari sistem?")) {
      setTickets(prev => prev.filter(t => t.id !== id));
      notify("PROTOKOL: TIKET DIHENTIKAN", "alert");
    }
  };

  const myTickets = isAdmin ? tickets : tickets.filter(t => t.userId === user.id);

  return (
    <div className="p-6 h-full overflow-y-auto relative">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-black italic tracking-tighter">
            {isAdmin ? "KOTAK MASUK TIKET" : "PUSAT BANTUAN"}
          </h2>
          <p className="text-gray-500 text-xs font-bold tracking-widest uppercase mt-1">
            {isAdmin ? "Dasbor Protokol Keamanan Admin" : "Komunikasi Langsung ke Pusat"}
          </p>
        </div>
        {!isAdmin && (
          <button 
            onClick={() => setIsCreating(true)}
            className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl shadow-white/10"
          >
            <Plus size={24} />
          </button>
        )}
      </div>

      <div className="space-y-4 pb-20">
        {myTickets.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center glass rounded-[40px] opacity-30 border-dashed border-2">
            <Inbox size={48} className="mb-4" />
            <span className="text-[12px] font-black tracking-[0.3em] uppercase">Tidak Ada Transmisi Aktif</span>
          </div>
        ) : (
          myTickets.map(ticket => (
            <div key={ticket.id} className="glass p-5 rounded-3xl flex items-center gap-4 group hover:bg-white/5 transition-all border border-white/5 hover:border-white/20">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${ticket.status === 'open' ? 'bg-white/10 text-white' : 'bg-gray-900 text-gray-700'}`}>
                <TicketIcon size={24} />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-sm font-black text-white uppercase tracking-tight truncate">{ticket.subject}</h3>
                  {isAdmin && (
                    <span className="text-[8px] bg-white text-black px-1.5 py-0.5 rounded font-black uppercase whitespace-nowrap">{ticket.userName}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">
                    ID:{ticket.id.toUpperCase()}
                  </span>
                  <span className="text-gray-800">•</span>
                  <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">
                    {new Date(ticket.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border ${
                  ticket.status === 'open' ? 'border-white text-white' : 'border-gray-800 text-gray-800'
                }`}>
                  {ticket.status === 'open' ? <Clock size={10} /> : <CheckCircle size={10} />}
                  {ticket.status === 'open' ? 'Terbuka' : 'Selesai'}
                </div>
                {isAdmin && (
                  <button 
                    onClick={() => deleteTicket(ticket.id)}
                    className="w-10 h-10 rounded-xl bg-red-900/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all"
                    title="Hapus Tiket"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isCreating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setIsCreating(false)}></div>
          <div className="glass w-full max-w-sm rounded-[40px] p-8 relative border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setIsCreating(false)}
              className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="mb-8">
              <h3 className="text-2xl font-black italic tracking-tighter uppercase">TIKET BARU</h3>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Permintaan Protokol Terbuka</p>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Subjek</label>
                <input 
                  autoFocus
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Jelaskan masalahnya..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm text-white outline-none focus:border-white transition-all placeholder:text-gray-800"
                />
              </div>

              <button 
                type="submit"
                disabled={!newSubject.trim()}
                className="w-full h-14 bg-white text-black rounded-full font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
              >
                <Send size={16} /> SIARKAN TIKET
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketView;