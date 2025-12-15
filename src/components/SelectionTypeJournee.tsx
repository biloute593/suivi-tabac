import { useState } from 'react';
import { TYPE_JOURNEE_LABELS } from '../types';
import type { TypeJournee } from '../types';

interface Props {
  onSelect: (type: string) => void;
}

export default function SelectionTypeJournee({ onSelect }: Props) {
  const [showReposChoice, setShowReposChoice] = useState(false);
  const types: TypeJournee[] = ['travail', 'teletravail', 'weekend'];

  const handleWeekendReposClick = () => {
    setShowReposChoice(true);
  };

  const handleSubChoice = (type: 'weekend' | 'repos') => {
    setShowReposChoice(false);
    onSelect(type);
  };

  if (showReposChoice) {
    return (
      <div className="card text-center max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Type de jour 🤔</h2>
        <p className="text-gray-600 mb-6">C'est un jour de...</p>

        <div className="space-y-3">
          <button
            onClick={() => handleSubChoice('weekend')}
            className="w-full py-4 px-6 bg-white border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all text-lg font-medium"
          >
            🎉 Week-end
          </button>
          <button
            onClick={() => handleSubChoice('repos')}
            className="w-full py-4 px-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-lg font-medium"
          >
            🌙 Repos
          </button>
          <button
            onClick={() => setShowReposChoice(false)}
            className="w-full py-2 px-4 text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card text-center max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Bonjour ! 👋</h2>
      <p className="text-gray-600 mb-6">Quel type de journée aujourd'hui ?</p>

      <div className="space-y-3">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className="w-full py-4 px-6 bg-white border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all text-lg font-medium"
          >
            {TYPE_JOURNEE_LABELS[type]}
          </button>
        ))}
        <button
          onClick={handleWeekendReposClick}
          className="w-full py-4 px-6 bg-white border-2 border-purple-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-lg font-medium"
        >
          🎉🌙 Week-end / Repos
        </button>
      </div>
    </div>
  );
}
