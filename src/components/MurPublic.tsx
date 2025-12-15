import { useState, useEffect } from 'react';
import { Trophy, TrendingDown, Calendar, Award, Share2 } from 'lucide-react';
import { db } from '../db/database';
import { getCurrentUser } from '../utils/userContext';

interface PublicPerformance {
  userId: string;
  nom: string;
  totalJours: number;
  totalCigarettes: number;
  moyenne: number;
  meilleurStreak: number;
  datePublication: string;
}

export default function MurPublic() {
  const [performances, setPerformances] = useState<PublicPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [myPerformance, setMyPerformance] = useState<PublicPerformance | null>(null);

  useEffect(() => {
    loadPublicPerformances();
  }, []);

  const loadPublicPerformances = async () => {
    try {
      // Charger toutes les performances publiques depuis le localStorage
      const stored = localStorage.getItem('suivi-tabac-public-performances');
      if (stored) {
        const allPerfs: PublicPerformance[] = JSON.parse(stored);
        setPerformances(allPerfs.sort((a, b) => a.moyenne - b.moyenne)); // Trier par meilleure moyenne
      }

      // Calculer ma propre performance
      const user = getCurrentUser();
      if (user && user.sharePublic) {
        const journees = await db.journees.toArray();
        let totalCigs = 0;
        for (const journee of journees) {
          const cigs = await db.cigarettes.where('journeeId').equals(journee.id!).toArray();
          totalCigs += cigs.length;
        }
        const moyenne = journees.length > 0 ? totalCigs / journees.length : 0;
        
        const myPerf: PublicPerformance = {
          userId: user.userId,
          nom: user.pseudo,
          totalJours: journees.length,
          totalCigarettes: totalCigs,
          moyenne,
          meilleurStreak: 0, // TODO: calculer le meilleur streak
          datePublication: new Date().toISOString()
        };
        setMyPerformance(myPerf);
        
        // Mettre à jour le mur public
        publishPerformance(myPerf);
      }
    } catch (error) {
      console.error('Erreur chargement mur public', error);
    } finally {
      setLoading(false);
    }
  };

  const publishPerformance = (perf: PublicPerformance) => {
    const stored = localStorage.getItem('suivi-tabac-public-performances');
    let perfs: PublicPerformance[] = [];
    if (stored) {
      try {
        perfs = JSON.parse(stored);
      } catch {
        perfs = [];
      }
    }
    
    // Mettre à jour ou ajouter
    const index = perfs.findIndex(p => p.userId === perf.userId);
    if (index >= 0) {
      perfs[index] = perf;
    } else {
      perfs.push(perf);
    }
    
    localStorage.setItem('suivi-tabac-public-performances', JSON.stringify(perfs));
    setPerformances(perfs.sort((a, b) => a.moyenne - b.moyenne));
  };

  if (loading) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <Trophy size={32} />
          <div>
            <h2 className="text-2xl font-bold">Mur Public</h2>
            <p className="text-white/80">Performances partagées par la communauté</p>
          </div>
        </div>
      </div>

      {myPerformance && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-500 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <Share2 size={20} className="text-green-600" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Votre performance publique</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{myPerformance.totalJours}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Jours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{myPerformance.totalCigarettes}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Cigarettes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{myPerformance.moyenne.toFixed(1)}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Moyenne/jour</div>
            </div>
          </div>
        </div>
      )}

      {!myPerformance && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center">
          <Share2 size={48} className="mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            Activez le partage public dans votre profil pour apparaître ici
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Award className="text-yellow-500" size={20} />
          Classement communautaire
        </h3>

        {performances.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Trophy size={48} className="mx-auto mb-3 opacity-30" />
            <p>Aucune performance publique pour le moment</p>
            <p className="text-sm mt-2">Soyez le premier à partager vos progrès !</p>
          </div>
        ) : (
          <div className="space-y-3">
            {performances.map((perf, index) => (
              <div
                key={perf.userId}
                className={`p-4 rounded-xl border-2 transition-all ${
                  index === 0
                    ? 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-400'
                    : index === 1
                    ? 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 border-gray-400'
                    : index === 2
                    ? 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-400'
                    : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      index === 0 ? 'bg-yellow-400 text-yellow-900' :
                      index === 1 ? 'bg-gray-400 text-gray-900' :
                      index === 2 ? 'bg-orange-400 text-orange-900' :
                      'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">{perf.nom}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <Calendar size={12} />
                        {perf.totalJours} jour{perf.totalJours > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">{perf.moyenne.toFixed(1)}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">cig/jour</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <TrendingDown className="text-blue-600 mt-0.5" size={20} />
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <p className="font-medium mb-1">Comment fonctionne le classement ?</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Les utilisateurs sont classés par <strong>moyenne de cigarettes par jour</strong> (du plus bas au plus haut).
              Plus votre moyenne est basse, meilleure est votre position ! 🎯
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
