import { useState, useEffect } from 'react';
import { Home, BarChart3, Plus, User, HeartPulse, Settings, Users } from 'lucide-react';
import Dashboard from './components/Dashboard';
import AjoutCigarette from './components/AjoutCigarette';
import Analyses from './components/Analyses';
import Parametres from './components/Parametres';
import EffetsSante from './components/EffetsSante';
import GestionProfils from './components/GestionProfils';
import SocialPage from './components/SocialPage';
import Notifications, { type Notification } from './components/Notifications';
import { getCurrentUser } from './utils/userContext';
import './App.css';

export default function App() {
  const [page, setPage] = useState<'dashboard' | 'ajout' | 'analyses' | 'effets' | 'parametres' | 'profil' | 'social' | 'journal'>('dashboard');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Vérifier la connexion utilisateur
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      setPage('profil');
    }
  }, [page]);

  function dismissNotification(id: string) {
    setNotifications((prev) => prev.filter(n => n.id !== id));
  }

  return (
    <div className="min-h-screen">
      {/* Notifications */}
      <Notifications notifications={notifications} onDismiss={dismissNotification} />

      {/* Header */}
      <header className="bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 text-white p-5 sticky top-0 z-10 shadow-xl">
        <div className="flex items-center justify-center gap-3">
          <span className="text-3xl">🚭</span>
          <h1 className="text-3xl font-extrabold tracking-tight">Suivi Tabac</h1>
        </div>
      </header>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24 overflow-y-auto scroll-smooth">
        {page === 'dashboard' && <Dashboard />}
        {page === 'ajout' && <AjoutCigarette onSuccess={() => setPage('dashboard')} />}
        {page === 'analyses' && <Analyses />}
        {import.meta.env.DEV && page === 'effets' && <EffetsSante />}
        {page === 'social' && <SocialPage />}
        {page === 'parametres' && <Parametres />}
        {page === 'profil' && <GestionProfils />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-upper pb-safe">
        <div className="max-w-7xl mx-auto px-2">
          <div className={`grid ${import.meta.env.DEV ? 'grid-cols-7' : 'grid-cols-6'} gap-1 py-2`}>
            <button
              onClick={() => setPage('dashboard')}
              className={`flex flex-col items-center justify-center p-1 rounded-2xl transition-all duration-300 ${page === 'dashboard'
                ? 'bg-primary-50'
                : 'hover:bg-gray-50'
                }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${page === 'dashboard'
                ? 'text-primary-600 scale-110'
                : 'text-gray-400'
                }`}>
                <Home size={22} strokeWidth={page === 'dashboard' ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-semibold transition-colors ${page === 'dashboard' ? 'text-primary-600' : 'text-gray-400'
                }`}>Accueil</span>
            </button>

            <button
              onClick={() => setPage('ajout')}
              className={`flex flex-col items-center justify-center p-1 rounded-2xl transition-all duration-300 ${page === 'ajout'
                ? 'bg-primary-50'
                : 'hover:bg-gray-50'
                }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${page === 'ajout'
                ? 'text-primary-600 scale-110'
                : 'text-gray-400'
                }`}>
                <Plus size={22} strokeWidth={page === 'ajout' ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-semibold transition-colors ${page === 'ajout' ? 'text-primary-600' : 'text-gray-400'
                }`}>Ajouter</span>
            </button>

            <button
              onClick={() => setPage('analyses')}
              className={`flex flex-col items-center justify-center p-1 rounded-2xl transition-all duration-300 ${page === 'analyses'
                ? 'bg-primary-50'
                : 'hover:bg-gray-50'
                }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${page === 'analyses'
                ? 'text-primary-600 scale-110'
                : 'text-gray-400'
                }`}>
                <BarChart3 size={22} strokeWidth={page === 'analyses' ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-semibold transition-colors ${page === 'analyses' ? 'text-primary-600' : 'text-gray-400'
                }`}>Analyses</span>
            </button>

            {import.meta.env.DEV && (
              <button
                onClick={() => setPage('effets')}
                className={`flex flex-col items-center justify-center p-1 rounded-2xl transition-all duration-300 ${page === 'effets'
                  ? 'bg-primary-50'
                  : 'hover:bg-gray-50'
                  }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${page === 'effets'
                  ? 'text-primary-600 scale-110'
                  : 'text-gray-400'
                  }`}>
                  <HeartPulse size={22} strokeWidth={page === 'effets' ? 2.5 : 2} />
                </div>
                <span className={`text-[10px] font-semibold transition-colors ${page === 'effets' ? 'text-primary-600' : 'text-gray-400'
                  }`}>Santé</span>
              </button>
            )}

            <button
              onClick={() => setPage('social')}
              className={`flex flex-col items-center justify-center p-1 rounded-2xl transition-all duration-300 ${page === 'social'
                ? 'bg-primary-50'
                : 'hover:bg-gray-50'
                }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${page === 'social'
                ? 'text-primary-600 scale-110'
                : 'text-gray-400'
                }`}>
                <Users size={22} strokeWidth={page === 'social' ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-semibold transition-colors ${page === 'social' ? 'text-primary-600' : 'text-gray-400'
                }`}>Social</span>
            </button>


            <button
              onClick={() => setPage('parametres')}
              className={`flex flex-col items-center justify-center p-1 rounded-2xl transition-all duration-300 ${page === 'parametres'
                ? 'bg-primary-50'
                : 'hover:bg-gray-50'
                }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${page === 'parametres'
                ? 'text-primary-600 scale-110'
                : 'text-gray-400'
                }`}>
                <Settings size={22} strokeWidth={page === 'parametres' ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-semibold transition-colors ${page === 'parametres' ? 'text-primary-600' : 'text-gray-400'
                }`}>Réglages</span>
            </button>

            <button
              onClick={() => setPage('profil')}
              className={`flex flex-col items-center justify-center p-1 rounded-2xl transition-all duration-300 ${page === 'profil'
                ? 'bg-primary-50'
                : 'hover:bg-gray-50'
                }`}
            >
              <div className={`p-1.5 rounded-xl transition-all ${page === 'profil'
                ? 'text-primary-600 scale-110'
                : 'text-gray-400'
                }`}>
                <User size={22} strokeWidth={page === 'profil' ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-semibold transition-colors ${page === 'profil' ? 'text-primary-600' : 'text-gray-400'
                }`}>Profil</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
