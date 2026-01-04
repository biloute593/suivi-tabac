import { TYPE_JOURNEE_LABELS } from '../types';
import type { TypeJournee } from '../types';

interface Props {
  onSelect: (type: string) => void;
}

export default function SelectionTypeJournee({ onSelect }: Props) {
  const types: TypeJournee[] = ['travail', 'teletravail', 'weekend', 'repos'];

  return (
    <div className="card text-center max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Bonjour ! 👋</h2>
      <p className="text-gray-600 mb-6">Quel type de journée aujourd'hui ?</p>

      <div className="grid grid-cols-1 gap-3">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className={`w-full py-4 px-6 border-2 rounded-xl transition-all text-lg font-medium flex items-center justify-center gap-3 ${type === 'weekend' || type === 'repos'
              ? 'bg-purple-50 border-purple-200 hover:border-purple-500 hover:bg-purple-100 text-purple-900'
              : 'bg-white border-gray-200 hover:border-green-500 hover:bg-green-50 text-gray-800'
              }`}
          >
            <span className="text-2xl">{TYPE_JOURNEE_LABELS[type].split(' ')[0]}</span>
            <span>{TYPE_JOURNEE_LABELS[type].split(' ').slice(1).join(' ')}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
