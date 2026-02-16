
import React, { useEffect } from 'react';
import { X, CheckCircle, Info, ShieldAlert } from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationToastProps {
  notification: AppNotification;
  onDismiss: (id: string) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(notification.id), 4000);
    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return <CheckCircle size={14} className="text-white" />;
      case 'alert': return <ShieldAlert size={14} className="text-white" />;
      default: return <Info size={14} className="text-white" />;
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 glass-dark border border-white/10 rounded-2xl shadow-2xl animate-in slide-in-from-top-4 fade-in duration-500 max-w-[90vw] w-max mx-auto pointer-events-auto">
      <div className="shrink-0">
        {getIcon()}
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-white whitespace-nowrap overflow-hidden text-ellipsis">
        {notification.message}
      </p>
      <button 
        onClick={() => onDismiss(notification.id)}
        className="shrink-0 p-1 hover:bg-white/10 rounded-full transition-colors"
      >
        <X size={12} className="text-gray-500" />
      </button>
    </div>
  );
};

export default NotificationToast;
