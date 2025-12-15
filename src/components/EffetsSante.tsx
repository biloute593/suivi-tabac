import React, { useEffect, useMemo, useState } from 'react';
import { differenceInDays, differenceInHours, differenceInYears } from 'date-fns';
import { db } from '../db/database';
import { Save, Edit3 } from 'lucide-react';
import { apiService } from '../services/api';

interface InfoSante {
  dateNaissance?: string;
  debutTabagisme?: string;
  cigarettesParJourMax?: number;
}

const organesData: Record<string, {
  nom: string;
  risques: string[];
  ameliorations: { delai: string; effet: string }[];
}> = {
  cerveau: {
    nom: 'Cerveau',
    risques: [
      'AVC (risque x2 à x4)',
      'Anévrisme cérébral',
      'Déclin cognitif accéléré',
      'Troubles de la mémoire',
      'Addiction à la nicotine'
    ],
    ameliorations: [
      { delai: '20 min', effet: 'La pression artérielle diminue' },
      { delai: '24h', effet: 'Risque de crise cardiaque commence à diminuer' },
      { delai: '2 semaines', effet: 'Circulation sanguine cérébrale améliorée' },
      { delai: '1 an', effet: "Risque d'AVC réduit de moitié" },
      { delai: '5 ans', effet: "Risque d'AVC identique à un non-fumeur" }
    ]
  },
  yeux: {
    nom: 'Yeux',
    risques: [
      'Cataracte précoce',
      'Dégénérescence maculaire (DMLA)',
      'Sécheresse oculaire',
      'Uvéite (inflammation)',
      'Glaucome'
    ],
    ameliorations: [
      { delai: '2 semaines', effet: "Moins d'irritation oculaire" },
      { delai: '3 mois', effet: 'Meilleure circulation dans les yeux' },
      { delai: '1 an', effet: 'Risque de cataracte commence à diminuer' }
    ]
  },
  bouche: {
    nom: 'Bouche & Gorge',
    risques: [
      'Cancer de la bouche',
      'Cancer de la gorge',
      'Cancer du larynx',
      'Maladies des gencives',
      'Perte de dents',
      'Mauvaise haleine chronique'
    ],
    ameliorations: [
      { delai: '48h', effet: "Goût et odorat s'améliorent" },
      { delai: '2 semaines', effet: 'Gencives plus saines' },
      { delai: '1 an', effet: 'Risque de cancer buccal diminue' },
      { delai: '10 ans', effet: 'Risque de cancer de la bouche divisé par 2' }
    ]
  },
  poumons: {
    nom: 'Poumons',
    risques: [
      'Cancer du poumon (90% des cas)',
      'BPCO (Bronchopneumopathie)',
      'Emphysème',
      'Bronchite chronique',
      'Asthme aggravé',
      'Infections respiratoires fréquentes'
    ],
    ameliorations: [
      { delai: '72h', effet: 'Bronches se détendent, respiration plus facile' },
      { delai: '1-9 mois', effet: 'Cils bronchiques repoussent, moins de toux' },
      { delai: '1 an', effet: 'Capacité pulmonaire augmente de 10%' },
      { delai: '10 ans', effet: 'Risque de cancer du poumon divisé par 2' },
      { delai: '15 ans', effet: 'Risque similaire à un non-fumeur' }
    ]
  },
  coeur: {
    nom: 'Cœur',
    risques: [
      'Infarctus du myocarde (risque x2)',
      'Maladie coronarienne',
      'Artériosclérose',
      'Hypertension artérielle',
      'Arythmie cardiaque',
      'Insuffisance cardiaque'
    ],
    ameliorations: [
      { delai: '20 min', effet: 'Rythme cardiaque redevient normal' },
      { delai: '24h', effet: 'Risque de crise cardiaque commence à baisser' },
      { delai: '1 an', effet: 'Risque cardiovasculaire réduit de 50%' },
      { delai: '5 ans', effet: "Risque d'AVC égal à un non-fumeur" },
      { delai: '15 ans', effet: 'Risque cardiaque identique à un non-fumeur' }
    ]
  },
  estomac: {
    nom: 'Estomac & Intestins',
    risques: [
      "Cancer de l'estomac",
      'Ulcères gastriques',
      'Reflux gastro-œsophagien',
      'Gastrite chronique',
      'Cancer colorectal'
    ],
    ameliorations: [
      { delai: '2 semaines', effet: 'Acidité gastrique diminue' },
      { delai: '1 mois', effet: 'Muqueuse gastrique se régénère' },
      { delai: '1 an', effet: "Risque d'ulcère réduit" }
    ]
  },
  foie: {
    nom: 'Foie',
    risques: [
      'Cancer du foie (risque augmenté)',
      'Cirrhose (surtout avec alcool)',
      'Stéatose hépatique',
      'Détoxification ralentie'
    ],
    ameliorations: [
      { delai: '72h', effet: 'Le foie commence à éliminer les toxines' },
      { delai: '3 mois', effet: 'Fonction hépatique améliorée' },
      { delai: '5 ans', effet: 'Risque de cancer du foie diminue' }
    ]
  },
  pancreas: {
    nom: 'Pancréas',
    risques: [
      'Cancer du pancréas (risque x2 à x3)',
      'Pancréatite',
      'Diabète de type 2'
    ],
    ameliorations: [
      { delai: '5 ans', effet: 'Risque de cancer du pancréas commence à baisser' },
      { delai: '10 ans', effet: 'Risque réduit significativement' }
    ]
  },
  reins: {
    nom: 'Reins',
    risques: [
      'Cancer du rein',
      'Insuffisance rénale',
      'Néphropathie'
    ],
    ameliorations: [
      { delai: '1 an', effet: "Fonction rénale s'améliore" },
      { delai: '10 ans', effet: 'Risque de cancer du rein divisé par 2' }
    ]
  },
  vessie: {
    nom: 'Vessie',
    risques: [
      'Cancer de la vessie (risque x3)',
      'Infections urinaires',
      'Incontinence'
    ],
    ameliorations: [
      { delai: '5 ans', effet: 'Risque de cancer de la vessie diminue' },
      { delai: '10 ans', effet: 'Risque divisé par 2' }
    ]
  },
  peau: {
    nom: 'Peau',
    risques: [
      'Vieillissement prématuré',
      'Rides profondes',
      'Teint grisâtre',
      'Psoriasis aggravé',
      'Cicatrisation ralentie'
    ],
    ameliorations: [
      { delai: '2 semaines', effet: 'Teint plus lumineux' },
      { delai: '1 mois', effet: 'Peau mieux hydratée' },
      { delai: '3 mois', effet: 'Élasticité améliorée' },
      { delai: '1 an', effet: 'Rides moins marquées' }
    ]
  },
  os: {
    nom: 'Os & Squelette',
    risques: [
      'Ostéoporose',
      'Fractures fréquentes',
      'Arthrite aggravée',
      'Douleurs dorsales'
    ],
    ameliorations: [
      { delai: '6 mois', effet: "Densité osseuse commence à s'améliorer" },
      { delai: '5 ans', effet: 'Risque de fracture diminue' }
    ]
  },
  reproduction: {
    nom: 'Système reproducteur',
    risques: [
      'Dysfonction érectile',
      'Infertilité (hommes et femmes)',
      'Ménopause précoce',
      'Complications de grossesse',
      "Cancer du col de l'utérus"
    ],
    ameliorations: [
      { delai: '3 mois', effet: 'Circulation sanguine améliorée' },
      { delai: '1 an', effet: 'Fertilité améliorée' },
      { delai: '5 ans', effet: 'Risque de cancer du col réduit' }
    ]
  },
  sang: {
    nom: 'Sang & Circulation',
    risques: [
      'Sang épaissi',
      'Caillots sanguins',
      'Mauvaise circulation',
      'Artères rétrécies',
      'Leucémie'
    ],
    ameliorations: [
      { delai: '8h', effet: 'Niveau de CO dans le sang redevient normal' },
      { delai: '24h', effet: 'Oxygénation du sang améliorée' },
      { delai: '2 semaines', effet: 'Circulation sanguine améliorée de 30%' },
      { delai: '3 mois', effet: 'Risque de caillots diminue significativement' }
    ]
  }
};

const hotspots: { key: keyof typeof organesData; left: string; top: string; width: string; height: string }[] = [
  { key: 'cerveau', left: '47%', top: '5%', width: '6%', height: '8%' },
  { key: 'yeux', left: '47%', top: '10%', width: '6%', height: '3.5%' },
  { key: 'bouche', left: '47%', top: '14.5%', width: '6%', height: '4%' },
  { key: 'poumons', left: '44%', top: '21%', width: '16%', height: '15%' },
  { key: 'coeur', left: '50%', top: '27%', width: '7%', height: '6%' },
  { key: 'foie', left: '53%', top: '34%', width: '12%', height: '8%' },
  { key: 'estomac', left: '47%', top: '33%', width: '12%', height: '9%' },
  { key: 'pancreas', left: '48%', top: '41%', width: '12%', height: '5%' },
  { key: 'reins', left: '45%', top: '46%', width: '18%', height: '8%' },
  { key: 'vessie', left: '49%', top: '61%', width: '8%', height: '6%' },
  { key: 'reproduction', left: '49%', top: '66%', width: '8%', height: '6%' },
  { key: 'peau', left: '75%', top: '22%', width: '12%', height: '25%' },
  { key: 'os', left: '13%', top: '22%', width: '10%', height: '55%' },
  { key: 'sang', left: '80%', top: '50%', width: '10%', height: '15%' }
];

const EffetsSante: React.FC = () => {
  const [organeSelectionne, setOrganeSelectionne] = useState<keyof typeof organesData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [hoveredOrgane, setHoveredOrgane] = useState<keyof typeof organesData | null>(null);
  const [derniereCigaretteDate, setDerniereCigaretteDate] = useState<Date | null>(null);
  const [imageOk, setImageOk] = useState(true);
  
  // États pour les informations personnelles
  const [infoSante, setInfoSante] = useState<InfoSante>({});
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [tempDateNaissance, setTempDateNaissance] = useState('');
  const [tempDebutTabagisme, setTempDebutTabagisme] = useState('');
  const [tempCigarettesMax, setTempCigarettesMax] = useState(20);

  // Charger les infos santé depuis le cloud
  useEffect(() => {
    const loadInfoSante = async () => {
      try {
        const metadata = await apiService.getUserMetadata();
        setInfoSante({
          dateNaissance: metadata.dateNaissance,
          debutTabagisme: metadata.debutTabagisme,
          cigarettesParJourMax: metadata.cigarettesParJourMax
        });
      } catch (error) {
        console.error('Erreur chargement infos santé', error);
        // Utiliser valeurs par défaut en cas d'erreur
        setInfoSante({ cigarettesParJourMax: 20 });
      } finally {
        setIsLoadingInfo(false);
      }
    };
    loadInfoSante();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const journees = await db.journees.toArray();
        const journeesTriees = [...journees].sort((a, b) => b.date.localeCompare(a.date));
        for (const journee of journeesTriees) {
          const cigs = await db.cigarettes.where('journeeId').equals(journee.id!).toArray();
          if (cigs.length > 0) {
            const triees = [...cigs].sort((a, b) => b.heure.localeCompare(a.heure));
            const derniere = triees[0];
            setDerniereCigaretteDate(new Date(journee.date + 'T' + derniere.heure));
            break;
          }
        }
      } catch (error) {
        console.error('Erreur chargement données santé', error);
      }
    };
    loadData();
  }, []);

  const { heuresSansFumer, joursSansFumer } = useMemo(() => {
    if (!derniereCigaretteDate) {
      return { heuresSansFumer: 0, joursSansFumer: 0 };
    }
    const maintenant = new Date();
    return {
      heuresSansFumer: differenceInHours(maintenant, derniereCigaretteDate),
      joursSansFumer: differenceInDays(maintenant, derniereCigaretteDate)
    };
  }, [derniereCigaretteDate]);

  const calculerEtatOrgane = (organeKey: keyof typeof organesData): { pourcentage: number; etat: 'critique' | 'atteint' | 'recuperation' | 'sain' } => {
    const anneesTabac = 5;
    let impact = Math.min(anneesTabac * 5, 50);
    let recuperation = 0;
    if (heuresSansFumer >= 72) recuperation += 5;
    if (joursSansFumer >= 14) recuperation += 10;
    if (joursSansFumer >= 30) recuperation += 10;
    if (joursSansFumer >= 90) recuperation += 15;
    if (joursSansFumer >= 365) recuperation += 20;
    if (joursSansFumer >= 1825) recuperation += 20;
    const ajustements: Partial<Record<keyof typeof organesData, number>> = {
      poumons: -10,
      coeur: -5,
      peau: 10,
      bouche: 5
    };
    const pourcentage = Math.max(0, Math.min(100, 100 - impact + recuperation + (ajustements[organeKey] || 0)));
    let etat: 'critique' | 'atteint' | 'recuperation' | 'sain';
    if (pourcentage < 30) etat = 'critique';
    else if (pourcentage < 60) etat = 'atteint';
    else if (pourcentage < 85) etat = 'recuperation';
    else etat = 'sain';
    return { pourcentage, etat };
  };

  const statsGlobales = useMemo(() => {
    let total = 0;
    let count = 0;
    Object.keys(organesData).forEach(key => {
      total += calculerEtatOrgane(key as keyof typeof organesData).pourcentage;
      count++;
    });
    return Math.round(total / Math.max(1, count));
  }, [heuresSansFumer, joursSansFumer]);

  const getEtatColor = (etat: string) => {
    switch (etat) {
      case 'sain': return 'from-green-500 to-emerald-600';
      case 'recuperation': return 'from-yellow-500 to-amber-600';
      case 'atteint': return 'from-orange-500 to-red-500';
      case 'critique': return 'from-red-600 to-red-800';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const saveInfoSante = async () => {
    try {
      const newInfo: InfoSante = {
        dateNaissance: tempDateNaissance || undefined,
        debutTabagisme: tempDebutTabagisme || undefined,
        cigarettesParJourMax: tempCigarettesMax
      };
      
      await apiService.updateUserMetadata({
        dateNaissance: newInfo.dateNaissance,
        debutTabagisme: newInfo.debutTabagisme,
        cigarettesParJourMax: newInfo.cigarettesParJourMax
      });
      
      setInfoSante(newInfo);
      setIsEditingInfo(false);
    } catch (error) {
      console.error('Erreur sauvegarde infos santé', error);
      alert('Erreur lors de la sauvegarde des informations');
    }
  };

  const startEditingInfo = () => {
    setTempDateNaissance(infoSante.dateNaissance || '');
    setTempDebutTabagisme(infoSante.debutTabagisme || '');
    setTempCigarettesMax(infoSante.cigarettesParJourMax || 20);
    setIsEditingInfo(true);
  };

  const age = infoSante.dateNaissance ? differenceInYears(new Date(), new Date(infoSante.dateNaissance)) : null;
  const anneesTabac = infoSante.debutTabagisme ? differenceInYears(new Date(), new Date(infoSante.debutTabagisme)) : null;

  const imageUrl = '/anatomie-reference.png';

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <span className="text-3xl">🫀</span> Effets du Tabac sur Votre Corps
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/20 rounded-xl p-3 backdrop-blur">
            <div className="text-3xl font-bold">{statsGlobales}%</div>
            <div className="text-sm opacity-90">Santé globale</div>
          </div>
          <div className="bg-white/20 rounded-xl p-3 backdrop-blur">
            <div className="text-3xl font-bold">{heuresSansFumer}h</div>
            <div className="text-sm opacity-90">Sans fumer</div>
          </div>
          <div className="bg-white/20 rounded-xl p-3 backdrop-blur">
            <div className="text-3xl font-bold">{joursSansFumer}</div>
            <div className="text-sm opacity-90">Jours de récup.</div>
          </div>
          <div className="bg-white/20 rounded-xl p-3 backdrop-blur">
            <div className="text-3xl font-bold">{Object.keys(organesData).length}</div>
            <div className="text-sm opacity-90">Organes suivis</div>
          </div>
        </div>
      </div>

      {/* Informations personnelles */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span>📋</span> Mes Informations de Santé
          </h3>
          {!isEditingInfo && !isLoadingInfo && (
            <button
              onClick={startEditingInfo}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-all"
            >
              <Edit3 size={16} />
              Modifier
            </button>
          )}
        </div>

        {isLoadingInfo ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Chargement...
          </div>
        ) : !isEditingInfo ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">🎂 Âge</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {age !== null ? `${age} ans` : 'Non renseigné'}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">🚬 Années de tabagisme</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {anneesTabac !== null ? `${anneesTabac} ans` : 'Non renseigné'}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">📊 Max/jour</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {infoSante.cigarettesParJourMax || 'Non renseigné'}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                🎂 Date de naissance
              </label>
              <input
                type="date"
                value={tempDateNaissance}
                onChange={(e) => setTempDateNaissance(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                🚬 Date de début du tabagisme
              </label>
              <input
                type="date"
                value={tempDebutTabagisme}
                onChange={(e) => setTempDebutTabagisme(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                📊 Nombre maximum de cigarettes par jour (historique)
              </label>
              <input
                type="number"
                value={tempCigarettesMax}
                onChange={(e) => setTempCigarettesMax(Number(e.target.value))}
                min={1}
                max={100}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsEditingInfo(false)}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
              >
                Annuler
              </button>
              <button
                onClick={saveInfoSante}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-all"
              >
                <Save size={18} />
                Enregistrer
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🧬</span> Corps Anatomique
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Cliquez sur un organe pour voir les détails</p>
          {!imageOk && (
            <p className="text-sm text-red-500 mt-2">Image introuvable. Placez votre image dans /public/anatomie-reference.png</p>
          )}
        </div>

        <div className="relative flex justify-center items-center p-4 bg-slate-50 dark:bg-gray-900">
          <div className="relative w-full max-w-xl aspect-[525/611]">
            <img
              src={imageUrl}
              alt="Anatomie de référence"
              className="absolute inset-0 w-full h-full object-contain rounded-2xl shadow-lg"
              onError={() => setImageOk(false)}
            />

            {hotspots.map(({ key, left, top, width, height }) => {
              const etat = calculerEtatOrgane(key);
              const color =
                etat.etat === 'sain' ? 'bg-green-500' :
                etat.etat === 'recuperation' ? 'bg-yellow-500' :
                etat.etat === 'atteint' ? 'bg-orange-500' :
                'bg-red-500';
              return (
                <button
                  key={key}
                  aria-label={organesData[key].nom}
                  className={`absolute rounded-full opacity-80 hover:opacity-100 transition duration-200 border-2 border-white shadow focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white ${color}`}
                  style={{ left, top, width, height }}
                  onClick={() => { setOrganeSelectionne(key); setShowModal(true); }}
                  onMouseEnter={() => setHoveredOrgane(key)}
                  onMouseLeave={() => setHoveredOrgane(null)}
                />
              );
            })}

            {hoveredOrgane && (
              <div className="absolute top-4 right-4 bg-white dark:bg-gray-700 p-3 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600 max-w-xs z-10">
                <div className="font-semibold text-gray-900 dark:text-white">{organesData[hoveredOrgane].nom}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">État: {calculerEtatOrgane(hoveredOrgane).pourcentage}%</div>
                <div className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block ${
                  calculerEtatOrgane(hoveredOrgane).etat === 'sain' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  calculerEtatOrgane(hoveredOrgane).etat === 'recuperation' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  calculerEtatOrgane(hoveredOrgane).etat === 'atteint' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                  'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {calculerEtatOrgane(hoveredOrgane).etat}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Légende des états de santé</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-green-500"></div><span className="text-sm text-gray-700 dark:text-gray-300">Sain (85-100%)</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-yellow-500"></div><span className="text-sm text-gray-700 dark:text-gray-300">Récupération (60-84%)</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-orange-500"></div><span className="text-sm text-gray-700 dark:text-gray-300">Atteint (30-59%)</span></div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-red-600"></div><span className="text-sm text-gray-700 dark:text-gray-300">Critique (0-29%)</span></div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Object.entries(organesData).map(([key, organe]) => {
          const etat = calculerEtatOrgane(key as keyof typeof organesData);
          return (
            <button
              key={key}
              onClick={() => { setOrganeSelectionne(key as keyof typeof organesData); setShowModal(true); }}
              className={`p-4 rounded-xl text-left transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                etat.etat === 'sain' ? 'bg-green-50 dark:bg-green-900/30 border-2 border-green-200 dark:border-green-800' :
                etat.etat === 'recuperation' ? 'bg-yellow-50 dark:bg-yellow-900/30 border-2 border-yellow-200 dark:border-yellow-800' :
                etat.etat === 'atteint' ? 'bg-orange-50 dark:bg-orange-900/30 border-2 border-orange-200 dark:border-orange-800' :
                'bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800'
              }`}
            >
              <div className="font-semibold text-gray-900 dark:text-white text-sm truncate">{organe.nom}</div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${
                    etat.etat === 'sain' ? 'bg-green-500' :
                    etat.etat === 'recuperation' ? 'bg-yellow-500' :
                    etat.etat === 'atteint' ? 'bg-orange-500' :
                    'bg-red-500'
                  }`} style={{ width: `${etat.pourcentage}%` }} />
                </div>
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{etat.pourcentage}%</span>
              </div>
            </button>
          );
        })}
      </div>

      {showModal && organeSelectionne && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className={`p-6 rounded-t-2xl bg-gradient-to-r ${getEtatColor(calculerEtatOrgane(organeSelectionne).etat)} text-white`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold">{organesData[organeSelectionne].nom}</h3>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="text-4xl font-bold">{calculerEtatOrgane(organeSelectionne).pourcentage}%</div>
                    <div className="text-sm opacity-90">État: {calculerEtatOrgane(organeSelectionne).etat}</div>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2"><span>⚠️</span> Risques liés au tabac</h4>
                <ul className="space-y-2">
                  {organesData[organeSelectionne].risques.map((risque, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"><span className="text-red-500 mt-0.5">•</span>{risque}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-green-600 dark:text-green-400 mb-3 flex items-center gap-2"><span>✨</span> Améliorations après l'arrêt</h4>
                <div className="space-y-3">
                  {organesData[organeSelectionne].ameliorations.map((amelioration, idx) => {
                    let atteinte = false;
                    const delai = amelioration.delai.toLowerCase();
                    if (delai.includes('min') && heuresSansFumer >= 1) atteinte = true;
                    else if (delai.includes('8h') && heuresSansFumer >= 8) atteinte = true;
                    else if (delai.includes('24h') && heuresSansFumer >= 24) atteinte = true;
                    else if (delai.includes('48h') && heuresSansFumer >= 48) atteinte = true;
                    else if (delai.includes('72h') && heuresSansFumer >= 72) atteinte = true;
                    else if (delai.includes('2 semaines') && joursSansFumer >= 14) atteinte = true;
                    else if ((delai.includes('1 mois') || delai.includes('1-9 mois')) && joursSansFumer >= 30) atteinte = true;
                    else if (delai.includes('3 mois') && joursSansFumer >= 90) atteinte = true;
                    else if (delai.includes('6 mois') && joursSansFumer >= 180) atteinte = true;
                    else if (delai.includes('1 an') && joursSansFumer >= 365) atteinte = true;
                    else if (delai.includes('5 ans') && joursSansFumer >= 1825) atteinte = true;
                    else if (delai.includes('10 ans') && joursSansFumer >= 3650) atteinte = true;
                    else if (delai.includes('15 ans') && joursSansFumer >= 5475) atteinte = true;
                    return (
                      <div key={idx} className={`p-3 rounded-xl border-l-4 ${atteinte ? 'bg-green-50 dark:bg-green-900/30 border-green-500' : 'bg-gray-50 dark:bg-gray-700/30 border-gray-300 dark:border-gray-600'}`}>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${atteinte ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}>{amelioration.delai}</span>
                          {atteinte && <span className="text-green-500">✓</span>}
                        </div>
                        <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{amelioration.effet}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EffetsSante;
