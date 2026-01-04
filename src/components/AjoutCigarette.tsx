import { useState, useEffect } from 'react';
import { db } from '../db/database';
import type {
  LieuCigarette,
  TypeCigarette,
  QuantiteCigarette,
  SituationCigarette,
  Journee,
  Cigarette,
  TypeJournee
} from '../types';
import {
  LIEUX_LABELS,
  TYPES_LABELS,
  QUANTITES_LABELS,
  SITUATIONS_LABELS,
  TYPE_JOURNEE_LABELS
} from '../types';
import { calculerScore } from '../utils/calculs';
import { format } from 'date-fns';
import { Save, X, Lightbulb, Clock } from 'lucide-react';
import { getCurrentUser } from '../utils/userContext';

interface Props {
  onSuccess: () => void;
}

interface Suggestion {
  lieu?: LieuCigarette;
  type?: TypeCigarette;
  situation?: SituationCigarette;
  raison: string;
}

export default function AjoutCigarette({ onSuccess }: Props) {
  const [dateSelectionnee, setDateSelectionnee] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [journee, setJournee] = useState<Journee | null>(null);
  const [numeroAuto, setNumeroAuto] = useState(1);
  const [heure, setHeure] = useState('');
  const [lieu, setLieu] = useState<LieuCigarette>('maison');
  const [type, setType] = useState<TypeCigarette>('automatique');
  const [besoin, setBesoin] = useState(5);
  const [satisfaction, setSatisfaction] = useState(5);
  const [quantite, setQuantite] = useState<QuantiteCigarette>('entiere');
  const [situation, setSituation] = useState<SituationCigarette>('pause');
  const [commentaire, setCommentaire] = useState('');
  const [kudzuPris, setKudzuPris] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [derniereCigarette, setDerniereCigarette] = useState<Cigarette | null>(null);

  useEffect(() => {
    chargerDonnees();
  }, [dateSelectionnee]);

  async function chargerDonnees() {
    const journeeSelectionnee = await db.journees.where('date').equals(dateSelectionnee).first();

    if (journeeSelectionnee) {
      setJournee(journeeSelectionnee);
    } else {
      setJournee(null);
    }


    // Récupérer le numéro automatique et la dernière cigarette
    const cigarettes = await db.cigarettes
      .where('journeeId')
      .equals((journeeSelectionnee?.id || (journee?.id as any))!)
      .sortBy('heure');
    setNumeroAuto(cigarettes.length + 1);

    if (cigarettes.length > 0) {
      setDerniereCigarette(cigarettes[cigarettes.length - 1]);
    }

    // Définir l'heure actuelle seulement si c'est aujourd'hui
    const estAujourdhui = dateSelectionnee === format(new Date(), 'yyyy-MM-dd');
    if (estAujourdhui) {
      const maintenant = new Date();
      const heureActuelle = `${maintenant.getHours().toString().padStart(2, '0')}:${maintenant
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;
      setHeure(heureActuelle);
      await genererSuggestions(maintenant.getHours());
    } else {
      setHeure('12:00');
    }

    setLoading(false);
  }

  async function genererSuggestions(heureActuelle: number) {
    try {
      // Récupérer toutes les cigarettes passées pour analyse de patterns
      const toutesLesCigarettes = await db.cigarettes.toArray();
      const newSuggestions: Suggestion[] = [];

      // Analyser les patterns par tranche horaire
      const cigarettesMemeTranche = toutesLesCigarettes.filter(c => {
        const h = parseInt(c.heure.split(':')[0]);
        return h === heureActuelle || h === heureActuelle - 1 || h === heureActuelle + 1;
      });

      if (cigarettesMemeTranche.length > 0) {
        // Lieu le plus fréquent à cette heure
        const lieuxCount: Record<string, number> = {};
        cigarettesMemeTranche.forEach(c => {
          lieuxCount[c.lieu] = (lieuxCount[c.lieu] || 0) + 1;
        });
        const lieuFrequent = Object.entries(lieuxCount).sort((a, b) => b[1] - a[1])[0];
        if (lieuFrequent && lieuFrequent[1] > 2) {
          newSuggestions.push({
            lieu: lieuFrequent[0] as LieuCigarette,
            raison: `Souvent à "${LIEUX_LABELS[lieuFrequent[0] as LieuCigarette]}" vers ${heureActuelle}h (${lieuFrequent[1]} fois)`
          });
        }

        // Situation la plus fréquente
        const situationsCount: Record<string, number> = {};
        cigarettesMemeTranche.forEach(c => {
          situationsCount[c.situation] = (situationsCount[c.situation] || 0) + 1;
        });
        const situationFrequente = Object.entries(situationsCount).sort((a, b) => b[1] - a[1])[0];
        if (situationFrequente && situationFrequente[1] > 2) {
          newSuggestions.push({
            situation: situationFrequente[0] as SituationCigarette,
            raison: `Contexte fréquent: "${SITUATIONS_LABELS[situationFrequente[0] as SituationCigarette]}" (${situationFrequente[1]} fois)`
          });
        }
      }

      // Suggestion basée sur le type de journée
      if (journee) {
        const cigarettesMemType = toutesLesCigarettes.filter(async c => {
          const j = await db.journees.get(c.journeeId);
          return j?.typeJournee === journee.typeJournee;
        });

        if (cigarettesMemType.length > 5) {
          const typesCount: Record<string, number> = {};
          cigarettesMemType.forEach(c => {
            typesCount[c.type] = (typesCount[c.type] || 0) + 1;
          });
          const typeFrequent = Object.entries(typesCount).sort((a, b) => b[1] - a[1])[0];
          if (typeFrequent) {
            newSuggestions.push({
              type: typeFrequent[0] as TypeCigarette,
              raison: `Type courant les jours "${journee.typeJournee}": ${TYPES_LABELS[typeFrequent[0] as TypeCigarette]}`
            });
          }
        }
      }

      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
    } catch (error) {
      console.error('Erreur génération suggestions:', error);
    }
  }

  function appliquerSuggestion(suggestion: Suggestion) {
    if (suggestion.lieu) setLieu(suggestion.lieu);
    if (suggestion.type) setType(suggestion.type);
    if (suggestion.situation) setSituation(suggestion.situation);
    setShowSuggestions(false);
  }

  function reutiliserDernieresCigaret() {
    if (derniereCigarette) {
      setLieu(derniereCigarette.lieu);
      setType(derniereCigarette.type);
      setSituation(derniereCigarette.situation);
      setQuantite(derniereCigarette.quantite);
      setBesoin(derniereCigarette.besoin);
      setSatisfaction(derniereCigarette.satisfaction);
      setKudzuPris(derniereCigarette.kudzuPris);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!journee) return;

    setSaving(true);

    try {
      // Calculer le score
      const score = calculerScore({ besoin, satisfaction, type, quantite });

      // Enregistrer la cigarette
      await db.cigarettes.add({
        journeeId: journee.id!,
        numero: numeroAuto,
        heure,
        lieu,
        type,
        besoin,
        satisfaction,
        quantite,
        situation,
        commentaire,
        kudzuPris,
        scoreCalcule: score,
        createdAt: new Date().toISOString()
      });

      // Retour au dashboard
      onSuccess();
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement:', error);
      alert('Erreur lors de l\'enregistrement. Veuillez réessayer.');
      setSaving(false);
    }
  }


  // Remplacer l'auto-création initiale par une demande explicite




  // Si on est en train de charger ou si on doit choisir le type de jour
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200"></div>
      </div>
    );
  }

  // Si journee n'existe pas encore, on demande le type
  if (!journee) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in p-4">
        <div className="card-gradient text-center">
          <h2 className="text-2xl font-bold mb-4">Nouvelle journée 📅</h2>
          <p className="mb-6 text-gray-600">Pour le {format(new Date(dateSelectionnee), 'dd/MM/yyyy')}, quel type de journée est-ce ?</p>
          <div className="grid grid-cols-1 gap-3">
            {(Object.keys(TYPE_JOURNEE_LABELS) as TypeJournee[]).map(t => (
              <button
                key={t}
                onClick={async () => {
                  await createDayWithType(t);
                }}
                className="p-4 rounded-xl border-2 border-gray-200 hover:border-primary-500 hover:bg-primary-50 font-bold text-lg transition-all"
              >
                {TYPE_JOURNEE_LABELS[t]}
              </button>
            ))}
          </div>
          <button onClick={onSuccess} className="mt-6 text-gray-500 underline">Annuler</button>
        </div>
      </div>
    );
  }

  async function createDayWithType(t: TypeJournee) {
    const user = getCurrentUser();
    if (!user) return;

    const nouvelleId = await db.journees.add({
      date: dateSelectionnee,
      typeJournee: t,
      objectifNombreMax: user.objectifGlobal || 12,
      createdAt: new Date().toISOString()
    } as any);

    const created = await db.journees.get(nouvelleId as any);
    setJournee(created || null);
  }


  const scorePrevu = calculerScore({ besoin, satisfaction, type, quantite });

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="card-gradient">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-3 rounded-xl shadow-lg">
              <span className="text-3xl">🚬</span>
            </div>
            <h2 className="text-3xl font-extrabold text-gradient">
              Cigarette n°{numeroAuto}
            </h2>
          </div>
          <button
            onClick={onSuccess}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all"
          >
            <X size={28} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
          {/* Sélecteur de date */}
          <div className="animate-slide-up bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-4">
            <label className="block text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-2xl">📅</span>
              <span>Date</span>
            </label>
            <input
              type="date"
              value={dateSelectionnee}
              max={format(new Date(), 'yyyy-MM-dd')}
              onChange={(e) => setDateSelectionnee(e.target.value)}
              className="input-field text-lg font-medium"
              required
            />
            <p className="text-xs text-gray-600 mt-2">
              Tu peux ajouter une cigarette pour une journée précédente
            </p>
          </div>

          {/* Suggestions intelligentes */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-4 animate-slide-up">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="text-blue-600" size={24} />
                <h3 className="text-base font-bold text-blue-900">Suggestions intelligentes</h3>
              </div>
              <div className="space-y-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => appliquerSuggestion(s)}
                    className="w-full text-left bg-white hover:bg-blue-100 border border-blue-200 rounded-lg p-3 transition-all text-sm font-medium text-gray-800"
                  >
                    💡 {s.raison}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowSuggestions(false)}
                className="mt-3 text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Masquer les suggestions
              </button>
            </div>
          )}

          {/* Auto-fill dernière cigarette */}
          {derniereCigarette && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={reutiliserDernieresCigaret}
                className="flex-1 bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 border border-purple-300 text-purple-900 px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Clock size={20} />
                Réutiliser dernière cigarette
              </button>
            </div>
          )}

          {/* Heure */}
          <div className="animate-slide-up">
            <label className="block text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-2xl">⏰</span>
              <span>Heure (format 24h)</span>
            </label>
            <input
              type="time"
              value={heure}
              onChange={(e) => setHeure(e.target.value)}
              className="input-field text-lg font-medium"
              step="60"
              required
            />
          </div>

          {/* Lieu */}
          <div className="animate-slide-up" style={{ animationDelay: '50ms' }}>
            <label className="block text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-2xl">📍</span>
              <span>Où ?</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(LIEUX_LABELS) as LieuCigarette[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLieu(l)}
                  className={`py-4 px-5 rounded-xl font-semibold border-2 transition-all duration-300 transform hover:scale-105 ${lieu === l
                    ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100 text-primary-900 shadow-lg'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-primary-200 hover:bg-primary-50 shadow-md'
                    }`}
                >
                  {LIEUX_LABELS[l]}
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
            <label className="block text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-2xl">🎭</span>
              <span>Type de cigarette</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(TYPES_LABELS) as TypeCigarette[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`py-4 px-4 rounded-xl font-semibold border-2 transition-all duration-300 transform hover:scale-105 text-sm ${type === t
                    ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100 text-primary-900 shadow-lg'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-primary-200 hover:bg-primary-50 shadow-md'
                    }`}
                >
                  {TYPES_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Besoin */}
          <div className="bg-gradient-to-br from-red-50 to-orange-50 p-5 rounded-xl border-2 border-red-200 animate-slide-up" style={{ animationDelay: '150ms' }}>
            <label className="block text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <span>Intensité du besoin</span>
              <span className="ml-auto text-2xl font-extrabold text-red-600">{besoin}/10</span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={besoin}
              onChange={(e) => setBesoin(Number(e.target.value))}
              className="w-full h-3 bg-white rounded-lg appearance-none cursor-pointer accent-red-600 shadow-inner"
            />
            <div className="flex justify-between text-sm text-gray-600 mt-2 font-semibold">
              <span>😌 Faible</span>
              <span>🔥 Fort</span>
            </div>
          </div>

          {/* Satisfaction */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-xl border-2 border-blue-200 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <label className="block text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
              <span className="text-2xl">😊</span>
              <span>Satisfaction ressentie</span>
              <span className="ml-auto text-2xl font-extrabold text-blue-600">{satisfaction}/10</span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={satisfaction}
              onChange={(e) => setSatisfaction(Number(e.target.value))}
              className="w-full h-3 bg-white rounded-lg appearance-none cursor-pointer accent-blue-600 shadow-inner"
            />
            <div className="flex justify-between text-sm text-gray-600 mt-2 font-semibold">
              <span>😐 Faible</span>
              <span>😍 Élevée</span>
            </div>
          </div>

          {/* Quantité */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🚬 Quantité fumée
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(QUANTITES_LABELS) as QuantiteCigarette[]).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuantite(q)}
                  className={`py-2 px-3 rounded-lg border-2 transition-all text-sm ${quantite === q
                    ? 'border-green-500 bg-green-50 text-green-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                >
                  {QUANTITES_LABELS[q]}
                </button>
              ))}
            </div>
          </div>

          {/* Situation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              💬 Situation
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 text-[11px]">
              {(Object.keys(SITUATIONS_LABELS) as SituationCigarette[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSituation(s)}
                  className={`py-1.5 px-2 rounded-xl border-2 font-semibold leading-snug transition-all duration-200 ${situation === s
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-indigo-200'
                    }`}
                  title={SITUATIONS_LABELS[s]}
                >
                  {SITUATIONS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Commentaire */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📝 Commentaire (optionnel)
            </label>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              className="input-field"
              rows={3}
              placeholder="Ajouter un commentaire..."
            />
          </div>

          {/* Kudzu */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="kudzu"
              checked={kudzuPris}
              onChange={(e) => setKudzuPris(e.target.checked)}
              className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
            />
            <label htmlFor="kudzu" className="ml-3 text-sm text-gray-700">
              ☑️ Kudzu pris (gélule/tisane)
            </label>
          </div>

          {/* Score prévu */}
          <div className={`bg-gradient-to-br p-6 rounded-2xl border-2 shadow-lg animate-scale-in ${scorePrevu <= 10
            ? 'from-red-100 to-red-200 border-red-300'
            : scorePrevu <= 15
              ? 'from-orange-100 to-orange-200 border-orange-300'
              : scorePrevu <= 20
                ? 'from-yellow-100 to-yellow-200 border-yellow-300'
                : scorePrevu <= 25
                  ? 'from-green-100 to-green-200 border-green-300'
                  : 'from-emerald-100 to-emerald-200 border-emerald-300'
            }`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-base font-bold text-gray-800">
                📈 Score prévu
              </p>
              <span className={`text-5xl font-extrabold ${scorePrevu <= 10 ? 'text-red-700'
                : scorePrevu <= 15 ? 'text-orange-700'
                  : scorePrevu <= 20 ? 'text-yellow-700'
                    : scorePrevu <= 25 ? 'text-green-700'
                      : 'text-emerald-700'
                }`}>
                {scorePrevu}
              </span>
            </div>
            <div className="bg-white/70 px-4 py-3 rounded-xl mt-3">
              <p className={`text-sm font-bold ${scorePrevu <= 10 ? 'text-red-800'
                : scorePrevu <= 15 ? 'text-orange-800'
                  : scorePrevu <= 20 ? 'text-yellow-800'
                    : scorePrevu <= 25 ? 'text-green-800'
                      : 'text-emerald-800'
                }`}>
                {scorePrevu <= 10
                  ? '🔴 À supprimer EN PRIORITÉ'
                  : scorePrevu <= 15
                    ? '🟠 À supprimer bientôt'
                    : scorePrevu <= 20
                      ? '🟡 Cigarette moyenne'
                      : scorePrevu <= 25
                        ? '🟢 Cigarette importante'
                        : '💚 Cigarette à garder (pour l\'instant)'}
              </p>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-4 pt-2">
            <button
              type="button"
              onClick={onSuccess}
              className="flex-1 btn-secondary text-base"
              disabled={saving}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary flex items-center justify-center gap-2 text-base"
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save size={22} />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
