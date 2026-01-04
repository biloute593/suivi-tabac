import { useState, useEffect } from 'react';
import { User, LogOut, Share2, UserPlus, TrendingUp, Award, Calendar, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import {
  getCurrentUser,
  setCurrentUser,
  clearCurrentUser,
  createAccount,
  login,
  isPseudoTaken,
  hasLegacyData,
  createLydieProfileForLegacyData,
  updateUserProfile,
  type CurrentUser
} from '../utils/userContext';
import { db } from '../db/database';
import Journal from './Journal';

export default function GestionProfils() {
  const [currentUser, setCurrentUserState] = useState<CurrentUser | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [pseudo, setPseudo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{ totalJours: number; totalCigs: number; moyenne: number } | null>(null);
  const [needsLydieMigration, setNeedsLydieMigration] = useState(false);
  const [dateDebutPartage, setDateDebutPartage] = useState(localStorage.getItem('suivi-tabac-share-start') || '');
  const [dateFinPartage, setDateFinPartage] = useState(localStorage.getItem('suivi-tabac-share-end') || '');

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUserState(user);

    // Vérifier si on a des données legacy et pas de compte Lydie
    if (!user && hasLegacyData()) {
      setNeedsLydieMigration(true);
      setPseudo('Lydie');
    }

    if (user) {
      loadStats(user.userId);
      loadStats(user.userId);
    }
  }, []);

  const loadStats = async (userId: string) => {
    try {
      const journees = await db.journees.toArray();
      const userJournees = journees.filter(j => j.userId === userId);
      let totalCigs = 0;
      for (const journee of userJournees) {
        const cigs = await db.cigarettes.where('journeeId').equals(journee.id!).toArray();
        totalCigs += cigs.length;
      }
      const moyenne = userJournees.length > 0 ? totalCigs / userJournees.length : 0;
      setStats({ totalJours: userJournees.length, totalCigs, moyenne });
    } catch (error) {
      console.error('Erreur chargement stats', error);
    }
  };

  const handleRegister = async () => {
    setError('');
    setLoading(true);

    try {
      if (!pseudo.trim()) {
        throw new Error('Veuillez entrer un pseudo');
      }

      if (pseudo.length < 3) {
        throw new Error('Le pseudo doit contenir au moins 3 caractères');
      }

      if (!password) {
        throw new Error('Veuillez entrer un mot de passe');
      }

      if (password.length < 6) {
        throw new Error('Le mot de passe doit contenir au moins 6 caractères');
      }

      if (password !== confirmPassword) {
        throw new Error('Les mots de passe ne correspondent pas');
      }

      if (isPseudoTaken(pseudo)) {
        throw new Error('Ce pseudo est déjà utilisé');
      }

      let newUser: CurrentUser;

      if (needsLydieMigration && pseudo.toLowerCase() === 'lydie') {
        // Migration des données legacy de Lydie
        newUser = await createLydieProfileForLegacyData(password);
      } else {
        // Création normale d'un compte avec objectif par défaut
        newUser = await createAccount(pseudo, password, 12);
      }

      setCurrentUser(newUser);
      setCurrentUserState(newUser);
      setShowRegister(false);
      setPseudo('');
      setPassword('');
      setConfirmPassword('');
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      if (!pseudo.trim() || !password) {
        throw new Error('Veuillez entrer votre pseudo et mot de passe');
      }

      const user = await login(pseudo, password);

      if (!user) {
        throw new Error('Pseudo ou mot de passe incorrect');
      }

      setCurrentUser(user);
      setCurrentUserState(user);
      setShowLogin(false);
      setPseudo('');
      setPassword('');
      loadStats(user.userId);
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
      clearCurrentUser();
      setCurrentUserState(null);
      setStats(null);
    }
  };

  const handleShareToggle = () => {
    if (currentUser) {
      const newShareValue = !currentUser.sharePublic;
      updateUserProfile(currentUser.userId, { sharePublic: newShareValue });
      const updated = { ...currentUser, sharePublic: newShareValue };
      setCurrentUser(updated);
      setCurrentUserState(updated);

      // Si on désactive, on nettoie les dates
      if (!newShareValue) {
        localStorage.removeItem('suivi-tabac-share-start');
        localStorage.removeItem('suivi-tabac-share-end');
        setDateDebutPartage('');
        setDateFinPartage('');
      }
    }
  };

  const handleDateShareChange = (type: 'start' | 'end', value: string) => {
    if (type === 'start') {
      setDateDebutPartage(value);
      localStorage.setItem('suivi-tabac-share-start', value);
    } else {
      setDateFinPartage(value);
      localStorage.setItem('suivi-tabac-share-end', value);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-4">
              <Lock className="text-white" size={40} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Suivi Tabac</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {needsLydieMigration ? 'Sécurisez vos données avec un mot de passe' : 'Connexion sécurisée'}
            </p>
          </div>

          {needsLydieMigration && !showRegister && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-400 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-amber-600 mt-0.5 flex-shrink-0" size={20} />
                <div className="text-sm">
                  <p className="font-semibold text-gray-900 dark:text-white mb-1">Bienvenue Lydie !</p>
                  <p className="text-gray-700 dark:text-gray-300">
                    Vos données existantes sont prêtes. Créez un mot de passe pour sécuriser votre compte.
                  </p>
                </div>
              </div>
            </div>
          )}

          {!showRegister && !showLogin && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-4">
              <button
                onClick={() => setShowRegister(true)}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <UserPlus size={20} />
                {needsLydieMigration ? 'Créer un mot de passe' : 'Créer un compte'}
              </button>

              {!needsLydieMigration && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">ou</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowLogin(true)}
                    className="w-full bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white py-3 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
                  >
                    <Lock size={20} />
                    J'ai déjà un compte
                  </button>
                </>
              )}
            </div>
          )}

          {showLogin && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Lock size={20} className="text-indigo-600" />
                Connexion
              </h2>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pseudo
                </label>
                <input
                  type="text"
                  value={pseudo}
                  onChange={(e) => setPseudo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Votre pseudo"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-12"
                    placeholder="Votre mot de passe"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setShowLogin(false); setError(''); setPseudo(''); setPassword(''); }}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white py-3 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? 'Connexion...' : 'Se connecter'}
                </button>
              </div>
            </div>
          )}

          {showRegister && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <UserPlus size={20} className="text-indigo-600" />
                {needsLydieMigration ? 'Créer votre mot de passe' : 'Créer votre compte'}
              </h2>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl flex items-start gap-2">
                  <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pseudo
                </label>
                {needsLydieMigration ? (
                  <div className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white font-semibold">
                    Lydie
                  </div>
                ) : (
                  <input
                    type="text"
                    value={pseudo}
                    onChange={(e) => setPseudo(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Choisissez votre pseudo"
                    autoFocus
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-12"
                    placeholder="Au moins 6 caractères"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirmer le mot de passe
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Retapez votre mot de passe"
                />
              </div>



              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowRegister(false);
                    setError('');
                    setPseudo('');
                    setPassword('');
                    setConfirmPassword('');
                  }}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white py-3 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? 'Création...' : (needsLydieMigration ? 'Sécuriser mon compte' : 'Créer le compte')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Logged-in view
  const user = currentUser!; // Type narrowing for JSX - we know currentUser exists here
  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur">
              <User size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user.pseudo}</h2>
              <p className="text-white/80">Objectif: {user.objectifGlobal} cigarettes/jour</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all backdrop-blur"
          >
            <LogOut size={20} />
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-white/20 rounded-xl p-3 backdrop-blur">
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={16} />
                <span className="text-xs opacity-90">Jours enregistrés</span>
              </div>
              <div className="text-2xl font-bold">{stats.totalJours}</div>
            </div>
            <div className="bg-white/20 rounded-xl p-3 backdrop-blur">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp size={16} />
                <span className="text-xs opacity-90">Total cigarettes</span>
              </div>
              <div className="text-2xl font-bold">{stats.totalCigs}</div>
            </div>
            <div className="bg-white/20 rounded-xl p-3 backdrop-blur">
              <div className="flex items-center gap-2 mb-1">
                <Award size={16} />
                <span className="text-xs opacity-90">Moyenne/jour</span>
              </div>
              <div className="text-2xl font-bold">{stats.moyenne.toFixed(1)}</div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Share2 size={20} className="text-indigo-600" />
          Partage public
        </h3>
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Publier mes performances</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user.sharePublic
                ? 'Vos performances sont visibles sur le mur public'
                : 'Vos données restent privées'}
            </p>
          </div>
          <button
            onClick={handleShareToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${user.sharePublic ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${user.sharePublic ? 'translate-x-6' : 'translate-x-1'
              }`} />
          </button>
        </div>

        {user.sharePublic && (
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl animate-fade-in mt-4">
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Calendar size={16} />
              Période à partager (Optionnel)
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-500 mb-1">Du</label>
                <input
                  type="date"
                  value={dateDebutPartage}
                  onChange={(e) => handleDateShareChange('start', e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wide text-gray-500 mb-1">Au</label>
                <input
                  type="date"
                  value={dateFinPartage}
                  onChange={(e) => handleDateShareChange('end', e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2 italic">
              * Si aucune date n'est sélectionnée, tout l'historique est pris en compte.
            </p>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informations</h3>
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <p>✅ Vos données sont isolées et sécurisées</p>
          <p>✅ Authentification par pseudo et mot de passe</p>
          <p>✅ Chaque utilisateur a son propre espace de données</p>
          <p>✅ Le partage public est optionnel et désactivable à tout moment</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
        <Journal />
      </div>
    </div>
  );
}

