import { useState, useEffect } from 'react';
import { Home, BarChart3, Plus, User, HeartPulse, Trophy, Settings, BookOpen } from 'lucide-react';
import Dashboard from './components/Dashboard';
import AjoutCigarette from './components/AjoutCigarette';
import Analyses from './components/Analyses';
import Parametres from './components/Parametres';
import EffetsSante from './components/EffetsSante';
import GestionProfils from './components/GestionProfils';
import MurPublic from './components/MurPublic';
import Journal from './components/Journal';
import Notifications, { type Notification } from './components/Notifications';
import { db } from './db/database';
import { getCurrentUser } from './utils/userContext';
import './App.css';

export default function App() {
  const [page, setPage] = useState<'dashboard' | 'ajout' | 'analyses' | 'effets' | 'parametres' | 'profil' | 'public' | 'journal'>('dashboard');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Vérifier la connexion utilisateur
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      setPage('profil');
    }
  }, [page]);

  useEffect(() => {
    checkDailyProgress();
    const interval = setInterval(checkDailyProgress, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  async function checkDailyProgress() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const journee = await db.journees.where('date').equals(today).first();
      
      if (!journee) return;

      const cigarettes = await db.cigarettes.where('journeeId').equals(journee.id!).toArray();
      const count = cigarettes.length;
      const objectif = journee.objectifNombreMax || 12;

      // Notification si objectif atteint
      if (count >= objectif && count === objectif) {
        addNotification({
          id: `objectif-${Date.now()}`,
          type: 'warning',
          title: '⚠️ Objectif atteint',
          message: `Tu as fumé ${count} cigarettes aujourd'hui. Essaie de tenir bon !`,
          duration: 8000
        });
      }

      // Notification de félicitations si moins que l'objectif en fin de journée
      const hour = new Date().getHours();
      if (hour >= 20 && count < objectif * 0.8) {
        addNotification({
          id: `success-${Date.now()}`,
          type: 'success',
          title: '🎉 Excellente journée !',
          message: `Seulement ${count} cigarettes aujourd'hui. Continue comme ça !`,
          duration: 8000
        });
      }
    } catch (error) {
      console.error('Erreur vérification progression', error);
    }
  }

  function addNotification(notif: Notification) {
    setNotifications((prev) => {
      // Éviter les doublons
      if (prev.find(n => n.id === notif.id)) return prev;
      return [...prev, notif];
    });
  }

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
        {page === 'public' && <MurPublic />}
        {page === 'journal' && <Journal />}
        {page === 'parametres' && <Parametres />}
        {page === 'profil' && <GestionProfils />}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t-2 border-gray-200 shadow-2xl">
        <div className="max-w-7xl mx-auto px-1">
          <div className={`grid ${import.meta.env.DEV ? 'grid-cols-7' : 'grid-cols-6'} gap-0 py-0.5`}>
            <button
              onClick={() => setPage('dashboard')}
              className={`flex flex-col items-center px-1 py-1 rounded-lg transition-all ${
                page === 'dashboard' 
                  ? 'text-primary-600' 
                  : 'text-gray-500'
              }`}
            >
              <div className={`p-1 rounded-lg transition-all ${
                page === 'dashboard' 
                  ? 'bg-gradient-to-br from-primary-100 to-primary-200' 
                  : 'bg-transparent'
              }`}>
                <Home size={18} />
              </div>
              <span className={`text-[9px] mt-0 font-medium ${
                page === 'dashboard' ? 'text-primary-700' : ''
              }`}>Accueil</span>
            </button>

            <button
              onClick={() => setPage('ajout')}
              className={`flex flex-col items-center px-1 py-1 rounded-lg transition-all ${
                page === 'ajout' 
                  ? 'text-primary-600' 
                  : 'text-gray-500'
              }`}
            >
              <div className={`p-1 rounded-lg transition-all ${
                page === 'ajout' 
                  ? 'bg-gradient-to-br from-primary-100 to-primary-200' 
                  : 'bg-transparent'
              }`}>
                <Plus size={18} />
              </div>
              <span className={`text-[9px] mt-0 font-medium ${
                page === 'ajout' ? 'text-primary-700' : ''
              }`}>Ajouter</span>
            </button>

            <button
              onClick={() => setPage('analyses')}
              className={`flex flex-col items-center px-1 py-1 rounded-lg transition-all ${
                page === 'analyses' 
                  ? 'text-primary-600' 
                  : 'text-gray-500'
              }`}
            >
              <div className={`p-1 rounded-lg transition-all ${
                page === 'analyses' 
                  ? 'bg-gradient-to-br from-primary-100 to-primary-200' 
                  : 'bg-transparent'
              }`}>
                <BarChart3 size={18} />
              </div>
              <span className={`text-[9px] mt-0 font-medium ${
                page === 'analyses' ? 'text-primary-700' : ''
              }`}>Analyses</span>
            </button>

            {import.meta.env.DEV && (
              <button
                onClick={() => setPage('effets')}
                className={`flex flex-col items-center px-1 py-1 rounded-lg transition-all ${
                  page === 'effets' 
                    ? 'text-primary-600' 
                    : 'text-gray-500'
                }`}
              >
                <div className={`p-1 rounded-lg transition-all ${
                  page === 'effets' 
                    ? 'bg-gradient-to-br from-primary-100 to-primary-200' 
                    : 'bg-transparent'
                }`}>
                  <HeartPulse size={18} />
                </div>
                <span className={`text-[9px] mt-0 font-medium ${
                  page === 'effets' ? 'text-primary-700' : ''
                }`}>Santé</span>
              </button>
            )}

            <button
              onClick={() => setPage('public')}
              className={`flex flex-col items-center px-1 py-1 rounded-lg transition-all ${
                page === 'public' 
                  ? 'text-primary-600' 
                  : 'text-gray-500'
              }`}
            >
              <div className={`p-1 rounded-lg transition-all ${
                page === 'public' 
                  ? 'bg-gradient-to-br from-primary-100 to-primary-200' 
                  : 'bg-transparent'
              }`}>
                <Trophy size={16} />
              </div>
              <span className={`text-[9px] mt-0 font-medium ${
                page === 'public' ? 'text-primary-700' : ''
              }`}>Public</span>
            </button>

            <button
              onClick={() => setPage('journal')}
              className={`flex flex-col items-center px-1 py-1 rounded-lg transition-all ${
                page === 'journal' 
                  ? 'text-primary-600' 
                  : 'text-gray-500'
              }`}
            >
              <div className={`p-1 rounded-lg transition-all ${
                page === 'journal' 
                  ? 'bg-gradient-to-br from-primary-100 to-primary-200' 
                  : 'bg-transparent'
              }`}>
                <BookOpen size={18} />
              </div>
              <span className={`text-[9px] mt-0 font-medium ${
                page === 'journal' ? 'text-primary-700' : ''
              }`}>Journal</span>
            </button>

            <button
              onClick={() => setPage('parametres')}
              className={`flex flex-col items-center px-1 py-1 rounded-lg transition-all ${
                page === 'parametres' 
                  ? 'text-primary-600' 
                  : 'text-gray-500'
              }`}
            >
              <div className={`p-1 rounded-lg transition-all ${
                page === 'parametres' 
                  ? 'bg-gradient-to-br from-primary-100 to-primary-200' 
                  : 'bg-transparent'
              }`}>
                <Settings size={18} />
              </div>
              <span className={`text-[9px] mt-0 font-medium ${
                page === 'parametres' ? 'text-primary-700' : ''
              }`}>Réglages</span>
            </button>

            <button
              onClick={() => setPage('profil')}
              className={`flex flex-col items-center px-1 py-1 rounded-lg transition-all ${
                page === 'profil' 
                  ? 'text-primary-600' 
                  : 'text-gray-500'
              }`}
            >
              <div className={`p-1 rounded-lg transition-all ${
                page === 'profil' 
                  ? 'bg-gradient-to-br from-primary-100 to-primary-200' 
                  : 'bg-transparent'
              }`}>
                <User size={18} />
              </div>
              <span className={`text-[9px] mt-0 font-medium ${
                page === 'profil' ? 'text-primary-700' : ''
              }`}>Profil</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
