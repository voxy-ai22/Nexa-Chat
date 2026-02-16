
import React from 'react';
import { ShieldCheck } from 'lucide-react';

const SplashScreen: React.FC = () => {
  return (
    <div className="h-screen w-full bg-black flex flex-col items-center justify-center animate-in fade-in duration-700">
      <div className="relative">
        <div className="absolute inset-0 bg-white/10 blur-[60px] rounded-full animate-pulse"></div>
        <div className="w-24 h-24 rounded-[32px] glass border-white/20 flex items-center justify-center relative z-10 animate-bounce">
          <ShieldCheck size={48} className="text-white" />
        </div>
      </div>
      <div className="mt-12 text-center">
        <h1 className="text-4xl font-black italic tracking-tighter text-white">NEXA</h1>
        <div className="flex items-center gap-2 mt-2 justify-center">
          <div className="w-1 h-1 rounded-full bg-white animate-ping"></div>
          <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.5em]">MENGHUBUNGKAN KE JARINGAN...</span>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
