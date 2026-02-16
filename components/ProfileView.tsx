
import React, { useState, useRef, useCallback } from 'react';
import { User } from '../types';
import { Camera, Shield, Globe, Moon, Upload, Image as ImageIcon } from 'lucide-react';

interface ProfileViewProps {
  user: User;
  setUser: (user: User) => void;
  notify: (msg: string, type?: 'info' | 'success' | 'alert') => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, setUser, notify }) => {
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdate = () => {
    setUser({ ...user, name, avatar });
    notify("PROFIL DISIMPAN: ENKRIPSI ULANG SELESAI", "success");
  };

  const processFile = (file: File) => {
    if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
      notify("KESALAHAN: HANYA PROTOKOL JPG/PNG YANG DIDUKUNG", "alert");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      notify("KESALAHAN: BERKAS MELEBIHI BATAS 2MB", "alert");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setAvatar(result);
      notify("AVATAR DIUNGGUH: SIAP UNTUK ENKRIPSI", "info");
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="p-6 h-full flex flex-col items-center animate-in fade-in duration-700">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={onFileSelect} 
        accept=".jpg,.jpeg,.png" 
        className="hidden" 
      />

      <div 
        className={`relative mt-8 group cursor-pointer transition-all duration-500 ${isDragging ? 'scale-110' : ''}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={triggerUpload}
      >
        <div className={`w-36 h-36 rounded-full overflow-hidden border-4 transition-all duration-500 ${isDragging ? 'border-white border-dashed bg-white/10' : 'border-white/10 glass'} p-1`}>
          {isDragging ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2">
              <Upload size={32} className="text-white animate-bounce" />
              <span className="text-[8px] font-black uppercase">Lepas berkas</span>
            </div>
          ) : (
            <img 
              src={avatar} 
              alt="Profil" 
              className="w-full h-full object-cover rounded-full transition-all duration-700" 
            />
          )}
        </div>
        
        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
          <Upload size={24} className="text-white" />
        </div>

        <button className="absolute bottom-1 right-1 w-12 h-12 rounded-full bg-white text-black flex items-center justify-center border-4 border-black shadow-lg hover:scale-110 transition-transform">
          <Camera size={20} />
        </button>
      </div>

      <div className="mt-8 text-center">
        <h2 className="text-2xl font-black italic tracking-tighter uppercase">{user.name}</h2>
        <div className="flex items-center justify-center gap-2 mt-1">
          <Globe size={12} className="text-gray-500" />
          <span className="text-[10px] font-bold text-gray-500 tracking-[0.3em] uppercase">ID JARINGAN: {user.id.toUpperCase()}</span>
        </div>
        <p className="text-[8px] text-gray-700 font-bold uppercase tracking-widest mt-2">Ketuk avatar untuk unggah JPG/PNG</p>
      </div>

      <div className="w-full mt-10 space-y-6">
        <div className="space-y-4">
          <div className="glass p-6 rounded-[32px] space-y-4 border border-white/5">
             <div className="flex flex-col gap-2">
               <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] ml-2">Nama Tampilan</label>
               <input 
                 type="text" 
                 value={name} 
                 onChange={(e) => setName(e.target.value)}
                 className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-sm text-white focus:border-white outline-none transition-all placeholder:text-gray-800"
               />
             </div>
             <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5 opacity-60">
                <ImageIcon size={18} className="text-gray-500" />
                <div className="flex-1 overflow-hidden">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Protokol Avatar</span>
                  <p className="text-[9px] text-gray-700 font-bold truncate">PENYIMPANAN_BINER_LOKAL_AKTIF</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
             </div>
          </div>

          <div className="glass p-6 rounded-[32px] flex items-center justify-between border border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                <Moon size={22} className="text-white" />
              </div>
              <div>
                <span className="text-sm font-black uppercase tracking-tight block">Mode Senyap</span>
                <span className="text-[9px] text-gray-500 font-bold uppercase">Selalu aktif untuk privasi</span>
              </div>
            </div>
            <div 
              onClick={() => {
                setIsDarkMode(!isDarkMode);
                notify(`MODE SENYAP: ${!isDarkMode ? 'DIAKTIFKAN' : 'DINONAKTIFKAN'}`, "info");
              }}
              className={`w-14 h-8 rounded-full transition-all duration-300 relative cursor-pointer ${isDarkMode ? 'bg-white' : 'bg-gray-800'}`}
            >
              <div className={`absolute top-1.5 w-5 h-5 rounded-full transition-all duration-500 ${isDarkMode ? 'left-7 bg-black shadow-inner' : 'left-1.5 bg-gray-400'}`}></div>
            </div>
          </div>

          <button 
            onClick={handleUpdate}
            disabled={!name.trim()}
            className="w-full h-16 rounded-full bg-white text-black font-black uppercase tracking-[0.4em] text-xs flex items-center justify-center gap-3 hover:invert transition-all shadow-2xl shadow-white/5 disabled:opacity-20"
          >
            <Shield size={20} /> SIMPAN PERUBAHAN
          </button>
        </div>

        <div className="flex flex-col items-center gap-2 opacity-20 py-8">
           <span className="text-[8px] font-bold tracking-[1em] uppercase">SESI TERENKRIPSI AES-256</span>
           <span className="text-[7px] font-bold tracking-[0.2em] uppercase">TITIK AKHIR AMAN TERVERIFIKASI</span>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;