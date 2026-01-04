import { useState, useEffect } from 'react';
import { Brain, AlertTriangle, Lightbulb, Clock, Activity, Target } from 'lucide-react';
import { db } from '../db/database';
import { analyserPatterns, calculerScoreDependance, type Prediction } from '../utils/predictions';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function Insights() {
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [dependance, setDependance] = useState<ReturnType<typeof calculerScoreDependance> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    chargerAnalyses();
  }, []);

  async function chargerAnalyses() {
    try {
      setLoading(true);
      const cigarettes = await db.cigarettes.toArray();
      
      const pred = analyserPatterns(cigarettes);
      const dep = calculerScoreDependance(cigarettes);
      
      setPrediction(pred);
      setDependance(dep);
    } catch (error) {
      console.error('Erreur chargement analyses', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!prediction || !dependance) {
    return (
      <div className="p-6 text-center text-gray-500">
        <Brain size={48} className="mx-auto mb-4 opacity-50" />
        <p>Enregistre plus de données pour voir les insights</p>
      </div>
    );
  }

  const joursNoms = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <Brain size={32} />
          <h2 className="text-2xl font-bold">Insights IA</h2>
        </div>
        <p className="opacity-90">Analyse prédictive de tes patterns de consommation</p>
      </div>

      {/* Score de dépendance */}
      <div className="card bg-gradient-to-br from-white to-gray-50">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity size={24} className="text-indigo-600" />
            <h3 className="font-bold text-lg">Score de Dépendance</h3>
          </div>
          <span className={`text-3xl font-bold ${
            dependance.niveau === 'Faible' ? 'text-green-600' :
            dependance.niveau === 'Modéré' ? 'text-yellow-600' :
            dependance.niveau === 'Élevé' ? 'text-orange-600' :
            'text-red-600'
          }`}>
            {dependance.score}/100
          </span>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="font-medium">Niveau: {dependance.niveau}</span>
            <span className="text-gray-500">{dependance.score}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${
                dependance.niveau === 'Faible' ? 'bg-green-500' :
                dependance.niveau === 'Modéré' ? 'bg-yellow-500' :
                dependance.niveau === 'Élevé' ? 'bg-orange-500' :
                'bg-red-500'
              }`}
              style={{ width: `${dependance.score}%` }}
            />
          </div>
        </div>

        {dependance.facteurs.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">Facteurs identifiés:</p>
            {dependance.facteurs.map((facteur, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 rounded-lg p-2">
                <AlertTriangle size={16} className="text-orange-500 flex-shrink-0" />
                <span>{facteur}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prochaine cigarette probable */}
      {prediction.prochaineCigaretteProbable && (
        <div className="card bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200">
          <div className="flex items-start gap-3">
            <Clock size={24} className="text-orange-600 mt-1" />
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-2">Prochaine cigarette probable</h3>
              <p className="text-2xl font-bold text-orange-600 mb-1">
                {format(prediction.prochaineCigaretteProbable, 'HH:mm', { locale: fr })}
              </p>
              <p className="text-sm text-gray-600">
                Confiance: {Math.round(prediction.confiance)}% • 
                {format(prediction.prochaineCigaretteProbable, "EEEE d MMMM", { locale: fr })}
              </p>
              <div className="mt-3 bg-white/50 rounded-lg p-3">
                <p className="text-sm font-medium text-orange-800">
                  💡 Prépare une alternative maintenant !
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Moments à risque */}
      {prediction.momentsARisque.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={24} className="text-red-600" />
            <h3 className="font-bold text-lg">Moments à Risque Élevé</h3>
          </div>

          <div className="space-y-2">
            {prediction.momentsARisque.slice(0, 5).map((moment, i) => (
              <div 
                key={i} 
                className="flex items-center justify-between bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-3 border border-red-200"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{i === 0 ? '🔥' : i === 1 ? '⚠️' : '⚡'}</span>
                  <div>
                    <p className="font-semibold">
                      {joursNoms[moment.jour]} • {moment.heure}h
                    </p>
                    <p className="text-sm text-gray-600">{moment.raison}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full bg-red-500 rounded-full"
                      style={{ width: `${moment.risque}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-red-600">
                    {Math.round(moment.risque)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommandations */}
      {prediction.recommandations.length > 0 && (
        <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={24} className="text-blue-600" />
            <h3 className="font-bold text-lg">Recommandations Personnalisées</h3>
          </div>

          <div className="space-y-3">
            {prediction.recommandations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 bg-white rounded-lg p-3 shadow-sm">
                <Target size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bouton rafraîchir */}
      <button
        onClick={chargerAnalyses}
        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all"
      >
        🔄 Actualiser les insights
      </button>
    </div>
  );
}
