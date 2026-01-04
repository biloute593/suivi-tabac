import { useEffect, useState } from 'react';
import { X, Bell, TrendingUp, Award, AlertCircle } from 'lucide-react';

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'achievement';
  title: string;
  message: string;
  icon?: React.ReactNode;
  duration?: number;
}

interface Props {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

export default function Notifications({ notifications, onDismiss }: Props) {
  const [visible, setVisible] = useState<Record<string, boolean>>({});

  useEffect(() => {
    notifications.forEach((notif) => {
      setVisible((prev) => ({ ...prev, [notif.id]: true }));
      
      const timer = setTimeout(() => {
        setVisible((prev) => ({ ...prev, [notif.id]: false }));
        setTimeout(() => onDismiss(notif.id), 300);
      }, notif.duration || 5000);

      return () => clearTimeout(timer);
    });
  }, [notifications, onDismiss]);

  const getIcon = (notif: Notification) => {
    if (notif.icon) return notif.icon;
    
    switch (notif.type) {
      case 'success':
        return <TrendingUp size={20} />;
      case 'warning':
        return <AlertCircle size={20} />;
      case 'achievement':
        return <Award size={20} />;
      default:
        return <Bell size={20} />;
    }
  };

  const getColors = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white';
      case 'warning':
        return 'bg-gradient-to-r from-orange-500 to-red-600 text-white';
      case 'achievement':
        return 'bg-gradient-to-r from-purple-500 to-pink-600 text-white';
      default:
        return 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white';
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-3 max-w-sm">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className={`
            transform transition-all duration-300 ease-out
            ${visible[notif.id] ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
          `}
        >
          <div className={`${getColors(notif.type)} rounded-xl shadow-2xl p-4 pr-12 relative overflow-hidden`}>
            {/* Effet de brillance animé */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            
            <div className="flex items-start gap-3 relative z-10">
              <div className="mt-0.5">
                {getIcon(notif)}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm mb-1">{notif.title}</h4>
                <p className="text-sm opacity-90">{notif.message}</p>
              </div>
            </div>
            
            <button
              onClick={() => onDismiss(notif.id)}
              className="absolute top-3 right-3 hover:bg-white/20 rounded-full p-1 transition-colors z-10"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
