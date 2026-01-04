import { useState } from 'react';
import { db } from '../db/database';
import type {
  LieuCigarette,
  TypeCigarette,
  QuantiteCigarette,
  SituationCigarette,
  Cigarette
} from '../types';
import {
  LIEUX_LABELS,
  TYPES_LABELS,
  QUANTITES_LABELS,
  SITUATIONS_LABELS
} from '../types';
import { calculerScore } from '../utils/calculs';
import { Save, X, Trash2 } from 'lucide-react';

interface Props {
  cigarette: Cigarette;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ModifierCigarette({ cigarette, onSuccess, onCancel }: Props) {
  const [heure, setHeure] = useState(cigarette.heure);
  const [lieu, setLieu] = useState<LieuCigarette>(cigarette.lieu);
  const [type, setType] = useState<TypeCigarette>(cigarette.type);
  const [besoin, setBesoin] = useState(cigarette.besoin);
  const [satisfaction, setSatisfaction] = useState(cigarette.satisfaction);
  const [quantite, setQuantite] = useState<QuantiteCigarette>(cigarette.quantite);
  const [situation, setSituation] = useState<SituationCigarette>(cigarette.situation);
  const [commentaire, setCommentaire] = useState(cigarette.commentaire || '');
  const [kudzuPris, setKudzuPris] = useState(cigarette.kudzuPris);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const score = calculerScore({ besoin, satisfaction, type, quantite });

      await db.cigarettes.update(cigarette.id!, {
        heure,
        lieu,
        type,
        besoin,
        satisfaction,
        quantite,
        situation,
        commentaire,
        kudzuPris,
        scoreCalcule: score
      });

      onSuccess();
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      alert('Erreur lors de la modification. Veuillez réessayer.');
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await db.cigarettes.delete(cigarette.id!);
      onSuccess();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression.');
    }
  }

  const scorePrevu = calculerScore({ besoin, satisfaction, type, quantite });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-2 rounded-xl">
              <span className="text-2xl">✏️</span>
            </div>
            <h2 className="text-xl font-bold text-gradient">
              Modifier cigarette #{cigarette.numero}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-3 space-y-3">
          {/* Heure */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span>⏰</span>
              <span>Heure</span>
            </label>
            <input
              type="time"
              value={heure}
              onChange={(e) => setHeure(e.target.value)}
              className="input-field"
              step="60"
              required
            />
          </div>

          {/* Lieu */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span>📍</span>
              <span>Lieu</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(LIEUX_LABELS) as LieuCigarette[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLieu(l)}
                  className={`py-3 px-4 rounded-xl font-medium border-2 transition-all text-sm ${
                    lieu === l
                      ? 'border-primary-500 bg-primary-50 text-primary-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-primary-200'
                  }`}
                >
                  {LIEUX_LABELS[l]}
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
              <span>🎭</span>
              <span>Type</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(TYPES_LABELS) as TypeCigarette[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`py-3 px-3 rounded-xl font-medium border-2 transition-all text-xs ${
                    type === t
                      ? 'border-primary-500 bg-primary-50 text-primary-900'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-primary-200'
                  }`}
                >
                  {TYPES_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Besoin */}
          <div className="bg-red-50 p-3 rounded-xl border border-red-200">
            <label className="block text-sm font-bold text-gray-800 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>📊</span>
                <span>Besoin</span>
              </span>
              <span className="text-lg font-extrabold text-red-600">{besoin}/10</span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={besoin}
              onChange={(e) => setBesoin(Number(e.target.value))}
              className="w-full h-2 bg-white rounded-lg cursor-pointer accent-red-600"
            />
          </div>

          {/* Satisfaction */}
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
            <label className="block text-sm font-bold text-gray-800 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>😊</span>
                <span>Satisfaction</span>
              </span>
              <span className="text-lg font-extrabold text-blue-600">{satisfaction}/10</span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={satisfaction}
              onChange={(e) => setSatisfaction(Number(e.target.value))}
              className="w-full h-2 bg-white rounded-lg cursor-pointer accent-blue-600"
            />
          </div>

          {/* Quantité */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">
              🚬 Quantité fumée
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(QUANTITES_LABELS) as QuantiteCigarette[]).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuantite(q)}
                  className={`py-2 px-3 rounded-lg border-2 transition-all text-xs ${
                    quantite === q
                      ? 'border-green-500 bg-green-50 text-green-900'
                      : 'border-gray-200 bg-white text-gray-700'
                  }`}
                >
                  {QUANTITES_LABELS[q]}
                </button>
              ))}
            </div>
          </div>

          {/* Situation */}
          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">
              💬 Situation
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 text-[11px]">
              {(Object.keys(SITUATIONS_LABELS) as SituationCigarette[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSituation(s)}
                  className={`py-1.5 px-2 rounded-xl border-2 font-semibold leading-snug transition-all duration-200 ${
                    situation === s
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
            <label className="block text-sm font-bold text-gray-800 mb-2">
              📝 Commentaire
            </label>
            <textarea
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              className="input-field"
              rows={2}
              placeholder="Ajouter un commentaire..."
            />
          </div>

          {/* Kudzu */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="kudzu-edit"
              checked={kudzuPris}
              onChange={(e) => setKudzuPris(e.target.checked)}
              className="w-5 h-5 text-green-600 rounded"
            />
            <label htmlFor="kudzu-edit" className="ml-3 text-sm text-gray-700">
              ☑️ Kudzu pris
            </label>
          </div>

          {/* Score */}
          <div className={`p-4 rounded-xl border-2 ${
            scorePrevu <= 10 
              ? 'bg-red-100 border-red-300' 
              : scorePrevu <= 15
              ? 'bg-orange-100 border-orange-300'
              : scorePrevu <= 20
              ? 'bg-yellow-100 border-yellow-300'
              : 'bg-green-100 border-green-300'
          }`}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-800">📈 Score</p>
              <span className={`text-3xl font-extrabold ${
                scorePrevu <= 10 ? 'text-red-700' 
                : scorePrevu <= 15 ? 'text-orange-700'
                : scorePrevu <= 20 ? 'text-yellow-700'
                : 'text-green-700'
              }`}>
                {scorePrevu}
              </span>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-3 bg-red-100 text-red-700 rounded-xl font-medium hover:bg-red-200 transition-all flex items-center gap-2"
            >
              <Trash2 size={18} />
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 btn-secondary"
              disabled={saving}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary flex items-center justify-center gap-2"
              disabled={saving}
            >
              {saving ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <Save size={18} />
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </form>

        {/* Modal de confirmation suppression */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <div className="text-center">
                <div className="text-5xl mb-4">🗑️</div>
                <h3 className="text-xl font-bold mb-2">Supprimer cette cigarette ?</h3>
                <p className="text-gray-600 mb-6">Cette action est irréversible.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 btn-secondary"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 bg-red-600 text-white py-3 rounded-xl font-medium hover:bg-red-700 transition-all"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
