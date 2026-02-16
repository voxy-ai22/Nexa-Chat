
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { ShieldCheck, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';

const ADMIN_EMAIL_ENC = "TmV4YV9jZW9fcHRfYnVsdWtidWtAQWRtaW4yMDI2Iw==";
const ADMIN_PASS_ENC = "JCZANTUyN0A6I2Y2OjI7QGFkbWluX2NoYXQubXkuZGV2";

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      const decodedAdminEmail = atob(ADMIN_EMAIL_ENC);
      const decodedAdminPass = atob(ADMIN_PASS_ENC);
      
      // Simulate checking a database for existing users
      const userRegistry = JSON.parse(localStorage.getItem('nexa_users') || '{}');

      // Admin check
      if (email === decodedAdminEmail && password === decodedAdminPass) {
        onLogin({
          id: 'admin',
          name: 'CEO NEXA',
          avatar: 'https://picsum.photos/seed/nexa-ceo/200',
          role: 'admin',
          email: email
        });
        setLoading(false);
        return;
      }

      // Gmail uniqueness check
      if (userRegistry[email] && userRegistry[email].password !== password) {
        setError('PELANGGARAN KEAMANAN: IDENTITAS SUDAH TERDAFTAR PADA NODE LAIN.');
        setLoading(false);
        return;
      }

      if (email.includes('@') && password.length >= 6) {
        // Register/Login standard user
        const newUser: User = {
          id: userRegistry[email]?.id || 'user-' + Math.random().toString(36).substr(2, 5),
          name: email.split('@')[0].toUpperCase(),
          avatar: `https://picsum.photos/seed/${email}/200`,
          role: 'user',
          email: email
        };

        // Persist the user registry
        userRegistry[email] = { id: newUser.id, password: password };
        localStorage.setItem('nexa_users', JSON.stringify(userRegistry));

        onLogin(newUser);
      } else {
        setError('KESALAHAN VALIDASI: EMAIL TIDAK VALID ATAU PANJANG TOKEN KURANG.');
      }
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-6 relative">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-white/10 blur-[120px] rounded-full"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-white/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="w-full max-w-sm z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl glass mb-6 border-white/20">
            <ShieldCheck size={40} className="text-white" />
          </div>
          <h1 className="text-5xl font-black italic tracking-tighter text-white mb-2">NEXA</h1>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">JARINGAN AMAN GLOBAL</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ID Aman / Email"
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-white text-sm outline-none focus:border-white transition-all placeholder:text-gray-700"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Token Akses / Kunci"
                className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-white text-sm outline-none focus:border-white transition-all placeholder:text-gray-700"
                required
              />
            </div>
          </div>

          {error && (
            <div className="text-[10px] font-black text-white bg-red-900/20 border border-red-500/50 p-3 rounded-xl flex items-center gap-2 animate-pulse uppercase tracking-widest">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-white text-black rounded-full font-black uppercase tracking-[0.3em] text-xs hover:invert transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "INISIALISASI SESI"}
          </button>
        </form>

        <p className="mt-8 text-center text-[9px] font-bold text-gray-600 uppercase tracking-widest leading-loose">
          Dengan menginisialisasi, Anda menyetujui<br/>
          <span className="text-gray-400">Protokol Keamanan & Standar Privasi Nexa Global</span>
        </p>
      </div>
    </div>
  );
};

export default Login;