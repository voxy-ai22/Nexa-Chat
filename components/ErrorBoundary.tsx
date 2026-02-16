
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("NEXA_CRITICAL_ERROR:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full bg-black flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 rounded-3xl bg-red-900/20 flex items-center justify-center text-red-500 mb-6 border border-red-500/30 animate-pulse">
            <ShieldAlert size={40} />
          </div>
          <h1 className="text-2xl font-black italic tracking-tighter uppercase mb-2">KEGAGALAN SISTEM KRITIS</h1>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mb-8">Data korup atau gangguan jaringan terdeteksi</p>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
          >
            <RefreshCw size={16} /> REBOOT SISTEM
          </button>
        </div>
      );
    }

    // Fixed: children is a property of this.props in React class components
    return this.props.children;
  }
}

export default ErrorBoundary;
