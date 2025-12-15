import { useState, useEffect } from 'react';
import { db } from '../db/database';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TrendingDown, TrendingUp, Minus, Calendar, BarChart3, Target, Award, MapPin, Clock, Home, DollarSign, FileDown, LineChart, PieChart, Brain } from 'lucide-react';
import type { Cigarette, SituationCigarette, LieuCigarette } from '../types';
import { SITUATIONS_LABELS, LIEUX_LABELS } from '../types';
import jsPDF from 'jspdf';
import { domToJpeg } from 'modern-screenshot';
import { GraphiqueTendance, GraphiqueSituations, GraphiqueHoraires, GraphiqueLieux } from './GraphiquesAnalyses';
import Insights from './Insights';

// Tranches horaires de 3h à partir de 6h
const TRANCHES_HORAIRES = [
  { id: '06h-09h', label: '06h - 09h', emoji: '🌅', debut: 6, fin: 9 },
  { id: '09h-12h', label: '09h - 12h', emoji: '☀️', debut: 9, fin: 12 },
  { id: '12h-15h', label: '12h - 15h', emoji: '🍽️', debut: 12, fin: 15 },
  { id: '15h-18h', label: '15h - 18h', emoji: '☕', debut: 15, fin: 18 },
  { id: '18h-21h', label: '18h - 21h', emoji: '🌆', debut: 18, fin: 21 },
  { id: '21h-00h', label: '21h - 00h', emoji: '🌙', debut: 21, fin: 24 },
  { id: '00h-06h', label: '00h - 06h', emoji: '🌃', debut: 0, fin: 6 },
];

function getTrancheHoraire(heure: string): string {
  const h = parseInt(heure.split(':')[0]);
  if (h >= 6 && h < 9) return '06h-09h';
  if (h >= 9 && h < 12) return '09h-12h';
  if (h >= 12 && h < 15) return '12h-15h';
  if (h >= 15 && h < 18) return '15h-18h';
  if (h >= 18 && h < 21) return '18h-21h';
  if (h >= 21 && h < 24) return '21h-00h';
  return '00h-06h';
}

interface SituationAnalyseComplete {
  total: number;
  pourcentage: number;
  moyenneParJour: number;
  parLieu: Record<string, number>;
  parHoraire: Record<string, number>;
  parType: Record<string, number>;
  joursAvec: number;
  scoreMoyen: number;
}

interface LieuAnalyseComplete {
  total: number;
  pourcentage: number;
  moyenneParJour: number;
  parSituation: Record<string, number>;
  parHoraire: Record<string, number>;
  parType: Record<string, number>;
  joursAvec: number;
  scoreMoyen: number;
}

interface HoraireAnalyseComplete {
  total: number;
  pourcentage: number;
  moyenneParJour: number;
  parLieu: Record<string, number>;
  parSituation: Record<string, number>;
  parType: Record<string, number>;
  joursAvec: number;
  scoreMoyen: number;
}

interface TypeAnalyseComplete {
  total: number;
  pourcentage: number;
  moyenneParJour: number;
  parLieu: Record<string, number>;
  parSituation: Record<string, number>;
  parHoraire: Record<string, number>;
  joursAvec: number;
  scoreMoyen: number;
}

interface AnalyseComplete {
  totalCigarettes: number;
  nombreJours: number;
  moyenneJour: number;
  tendance: 'up' | 'down' | 'stable';
  meilleurJour: { date: string; total: number } | null;
  pireJour: { date: string; total: number } | null;
  dateDebut: string;
  dateFin: string;
  parSituation: Record<string, SituationAnalyseComplete>;
  parLieu: Record<string, LieuAnalyseComplete>;
  parHoraire: Record<string, HoraireAnalyseComplete>;
  parType: Record<string, TypeAnalyseComplete>;
  scoreMoyen: number;
  statsParJour: Array<{ date: string; total: number }>;
}

export default function Analyses() {
  const [periode, setPeriode] = useState<'semaine' | 'mois' | 'tout'>('tout');
  const [analyse, setAnalyse] = useState<AnalyseComplete | null>(null);
  const [loading, setLoading] = useState(true);
  const [prixCigarette, setPrixCigarette] = useState(0.50);
  const [viewMode, setViewMode] = useState<'overview' | 'graphiques' | 'insights'>('overview');

  useEffect(() => {
    chargerAnalyses();
    chargerPrixCigarette();
  }, [periode]);

  async function chargerPrixCigarette() {
    const prix = localStorage.getItem('prixCigarette');
    if (prix) {
      setPrixCigarette(parseFloat(prix));
    }
  }

  async function chargerAnalyses() {
    setLoading(true);
    try {
      const aujourdhui = new Date();
      const hier = subDays(aujourdhui, 1);
      
      // Récupérer la date de la première cigarette enregistrée
      const toutesLesCigarettes = await db.cigarettes.toArray();
      const premiereCigarette = toutesLesCigarettes.length > 0 
        ? toutesLesCigarettes.sort((a, b) => new Date(a.createdAt || '').getTime() - new Date(b.createdAt || '').getTime())[0]
        : null;
      const premiereJournee = premiereCigarette 
        ? await db.journees.get(premiereCigarette.journeeId)
        : null;
      
      let dateDebut: Date;
      let dateFin: Date;
      
      if (periode === 'tout') {
        // Utiliser la date de la première journée si disponible
        dateDebut = premiereJournee ? new Date(premiereJournee.date) : new Date('2025-11-01');
        dateFin = hier; // Exclure le jour actuel
      } else if (periode === 'mois') {
        dateDebut = subDays(hier, 30);
        dateFin = hier; // Exclure le jour actuel
      } else {
        dateDebut = subDays(hier, 6); // 7 jours incluant hier
        dateFin = hier; // Exclure le jour actuel
      }

      const journees = await db.journees
        .where('date')
        .between(format(dateDebut, 'yyyy-MM-dd'), format(dateFin, 'yyyy-MM-dd'), true, true)
        .toArray();

      const cigarettes: Cigarette[] = [];
      const cigarettesParJournee: Record<string, Cigarette[]> = {};
      
      for (const j of journees) {
        const cigs = await db.cigarettes.where('journeeId').equals(j.id!).toArray();
        cigarettes.push(...cigs);
        cigarettesParJournee[j.id!] = cigs;
      }

      const nombreJours = journees.length;

      // Stats par jour pour tendance
      const statsParJour = journees.map(j => ({
        date: j.date,
        total: cigarettesParJournee[j.id!]?.length || 0
      }));

      // Tendance
      const midpoint = Math.floor(statsParJour.length / 2);
      const moyennePremiere = statsParJour.slice(0, midpoint).reduce((acc, s) => acc + s.total, 0) / (midpoint || 1);
      const moyenneSeconde = statsParJour.slice(midpoint).reduce((acc, s) => acc + s.total, 0) / ((statsParJour.length - midpoint) || 1);
      let tendance: 'up' | 'down' | 'stable' = 'stable';
      if (moyenneSeconde < moyennePremiere - 1) tendance = 'down';
      else if (moyenneSeconde > moyennePremiere + 1) tendance = 'up';

      // Meilleur/Pire jour
      const joursNonVides = statsParJour.filter(s => s.total > 0);
      const meilleurJour = joursNonVides.length > 0 ? joursNonVides.reduce((a, b) => a.total < b.total ? a : b) : null;
      const pireJour = joursNonVides.length > 0 ? joursNonVides.reduce((a, b) => a.total > b.total ? a : b) : null;

      // Analyse par SITUATION
      const parSituation: Record<string, SituationAnalyseComplete> = {};
      const situationsJours: Record<string, Set<string>> = {};
      
      for (const c of cigarettes) {
        if (!parSituation[c.situation]) {
          parSituation[c.situation] = {
            total: 0, pourcentage: 0, moyenneParJour: 0,
            parLieu: {}, parHoraire: {}, parType: {},
            joursAvec: 0, scoreMoyen: 0
          };
          situationsJours[c.situation] = new Set();
        }
        
        parSituation[c.situation].total++;
        parSituation[c.situation].parLieu[c.lieu] = (parSituation[c.situation].parLieu[c.lieu] || 0) + 1;
        
        const tranche = getTrancheHoraire(c.heure);
        parSituation[c.situation].parHoraire[tranche] = (parSituation[c.situation].parHoraire[tranche] || 0) + 1;
        parSituation[c.situation].parType[c.type] = (parSituation[c.situation].parType[c.type] || 0) + 1;
        parSituation[c.situation].scoreMoyen += c.scoreCalcule;
        
        situationsJours[c.situation].add(c.journeeId);
      }
      
      for (const sit of Object.keys(parSituation)) {
        parSituation[sit].pourcentage = (parSituation[sit].total / cigarettes.length) * 100;
        parSituation[sit].joursAvec = situationsJours[sit].size;
        parSituation[sit].moyenneParJour = parSituation[sit].total / nombreJours;
        parSituation[sit].scoreMoyen = parSituation[sit].scoreMoyen / parSituation[sit].total;
      }

      // Analyse par LIEU
      const parLieu: Record<string, LieuAnalyseComplete> = {};
      const lieuxJours: Record<string, Set<string>> = {};
      
      for (const c of cigarettes) {
        if (!parLieu[c.lieu]) {
          parLieu[c.lieu] = {
            total: 0, pourcentage: 0, moyenneParJour: 0,
            parSituation: {}, parHoraire: {}, parType: {},
            joursAvec: 0, scoreMoyen: 0
          };
          lieuxJours[c.lieu] = new Set();
        }
        
        parLieu[c.lieu].total++;
        parLieu[c.lieu].parSituation[c.situation] = (parLieu[c.lieu].parSituation[c.situation] || 0) + 1;
        
        const tranche = getTrancheHoraire(c.heure);
        parLieu[c.lieu].parHoraire[tranche] = (parLieu[c.lieu].parHoraire[tranche] || 0) + 1;
        parLieu[c.lieu].parType[c.type] = (parLieu[c.lieu].parType[c.type] || 0) + 1;
        parLieu[c.lieu].scoreMoyen += c.scoreCalcule;
        
        lieuxJours[c.lieu].add(c.journeeId);
      }
      
      for (const lieu of Object.keys(parLieu)) {
        parLieu[lieu].pourcentage = (parLieu[lieu].total / cigarettes.length) * 100;
        parLieu[lieu].joursAvec = lieuxJours[lieu].size;
        parLieu[lieu].moyenneParJour = parLieu[lieu].total / nombreJours;
        parLieu[lieu].scoreMoyen = parLieu[lieu].scoreMoyen / parLieu[lieu].total;
      }

      // Analyse par HORAIRE
      const parHoraire: Record<string, HoraireAnalyseComplete> = {};
      const horairesJours: Record<string, Set<string>> = {};
      
      for (const c of cigarettes) {
        const tranche = getTrancheHoraire(c.heure);
        
        if (!parHoraire[tranche]) {
          parHoraire[tranche] = {
            total: 0, pourcentage: 0, moyenneParJour: 0,
            parLieu: {}, parSituation: {}, parType: {},
            joursAvec: 0, scoreMoyen: 0
          };
          horairesJours[tranche] = new Set();
        }
        
        parHoraire[tranche].total++;
        parHoraire[tranche].parLieu[c.lieu] = (parHoraire[tranche].parLieu[c.lieu] || 0) + 1;
        parHoraire[tranche].parSituation[c.situation] = (parHoraire[tranche].parSituation[c.situation] || 0) + 1;
        parHoraire[tranche].parType[c.type] = (parHoraire[tranche].parType[c.type] || 0) + 1;
        parHoraire[tranche].scoreMoyen += c.scoreCalcule;
        
        horairesJours[tranche].add(c.journeeId);
      }
      
      for (const h of Object.keys(parHoraire)) {
        parHoraire[h].pourcentage = (parHoraire[h].total / cigarettes.length) * 100;
        parHoraire[h].joursAvec = horairesJours[h].size;
        parHoraire[h].moyenneParJour = parHoraire[h].total / nombreJours;
        parHoraire[h].scoreMoyen = parHoraire[h].scoreMoyen / parHoraire[h].total;
      }

      // Analyse par TYPE
      const parType: Record<string, TypeAnalyseComplete> = {};
      const typesJours: Record<string, Set<string>> = {};
      
      for (const c of cigarettes) {
        if (!parType[c.type]) {
          parType[c.type] = {
            total: 0, pourcentage: 0, moyenneParJour: 0,
            parLieu: {}, parSituation: {}, parHoraire: {},
            joursAvec: 0, scoreMoyen: 0
          };
          typesJours[c.type] = new Set();
        }
        
        parType[c.type].total++;
        parType[c.type].parLieu[c.lieu] = (parType[c.type].parLieu[c.lieu] || 0) + 1;
        parType[c.type].parSituation[c.situation] = (parType[c.type].parSituation[c.situation] || 0) + 1;
        
        const tranche = getTrancheHoraire(c.heure);
        parType[c.type].parHoraire[tranche] = (parType[c.type].parHoraire[tranche] || 0) + 1;
        parType[c.type].scoreMoyen += c.scoreCalcule;
        
        typesJours[c.type].add(c.journeeId);
      }
      
      for (const t of Object.keys(parType)) {
        parType[t].pourcentage = (parType[t].total / cigarettes.length) * 100;
        parType[t].joursAvec = typesJours[t].size;
        parType[t].moyenneParJour = parType[t].total / nombreJours;
        parType[t].scoreMoyen = parType[t].scoreMoyen / parType[t].total;
      }

      const scoreMoyen = cigarettes.length > 0 
        ? cigarettes.reduce((acc, c) => acc + c.scoreCalcule, 0) / cigarettes.length 
        : 0;

      setAnalyse({
        totalCigarettes: cigarettes.length,
        nombreJours,
        moyenneJour: cigarettes.length / Math.max(nombreJours, 1),
        tendance,
        meilleurJour,
        pireJour,
        dateDebut: format(dateDebut, 'yyyy-MM-dd'),
        dateFin: format(aujourdhui, 'yyyy-MM-dd'),
        parSituation,
        parLieu,
        parHoraire,
        parType,
        scoreMoyen,
        statsParJour
      });
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !analyse) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Analyse en cours...</p>
        </div>
      </div>
    );
  }

  const situationEmojis: Record<string, string> = {
    apres_repas: '🍽️', pause: '☕', trajet: '🚗', ennui: '😑', stress: '😰',
    social: '👥', attente: '⏳', reveil: '🌅', avant_repas: '🍴', avant_sortie: '🚪',
    film: '🎬', telephone: '📱', voiture: '🚙', autre: '❓'
  };

  const lieuEmojis: Record<string, string> = {
    maison: '🏠', travail: '🏢', exterieur: '🚶', voiture: '🚗', restaurant: '🍽️', chez_quelquun: '👥'
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Période */}
      <div className="flex gap-2">
        {(['tout', 'mois', 'semaine'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriode(p)}
            className={`flex-1 py-3 px-3 rounded-xl font-semibold transition-all text-sm ${
              periode === p
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
          >
            {p === 'tout' ? '📊 Tout' : p === 'mois' ? '📆 30j' : '📅 7j'}
          </button>
        ))}
      </div>

      {/* ===== ZONE A EXPORTER EN PDF ===== */}
      <div id="pdf-content" className="space-y-6">

      {/* Résumé période */}
      <div className="card bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-indigo-200">
        <div className="text-center">
          <p className="text-xs text-indigo-600 font-semibold mb-1">📊 Période analysée</p>
          <p className="font-bold text-indigo-900 text-lg">
            {format(new Date(analyse.dateDebut), 'd MMM', { locale: fr })} → {format(new Date(analyse.dateFin), 'd MMM yyyy', { locale: fr })}
          </p>
          <p className="text-sm text-slate-600 mt-1">{analyse.nombreJours} jours</p>
        </div>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="text-blue-600" size={20} />
            <p className="text-sm font-semibold text-blue-900">Total</p>
          </div>
          <p className="text-3xl font-extrabold text-blue-700">{analyse.totalCigarettes}</p>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="text-orange-600" size={20} />
            <p className="text-sm font-semibold text-orange-900">Coût</p>
          </div>
          <p className="text-3xl font-extrabold text-orange-700">{(analyse.totalCigarettes * prixCigarette).toFixed(2)}€</p>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="text-purple-600" size={20} />
            <p className="text-sm font-semibold text-purple-900">Moyenne/jour</p>
          </div>
          <p className="text-3xl font-extrabold text-purple-700">{analyse.moyenneJour.toFixed(1)}</p>
        </div>
      </div>

      {/* Tendance */}
      <div className={`card ${
        analyse.tendance === 'down' ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
        : analyse.tendance === 'up' ? 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'
        : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {analyse.tendance === 'down' ? <TrendingDown className="text-green-600" size={24} />
             : analyse.tendance === 'up' ? <TrendingUp className="text-red-600" size={24} />
             : <Minus className="text-gray-600" size={24} />}
            <div>
              <p className="text-sm font-semibold text-gray-700">Tendance</p>
              <p className={`text-lg font-bold ${
                analyse.tendance === 'down' ? 'text-green-700'
                : analyse.tendance === 'up' ? 'text-red-700'
                : 'text-gray-700'
              }`}>
                {analyse.tendance === 'down' ? 'En baisse 📉' 
                 : analyse.tendance === 'up' ? 'En hausse 📈' 
                 : 'Stable ➖'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Meilleur/Pire jour */}
      <div className="grid grid-cols-2 gap-4">
        {analyse.meilleurJour && (
          <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Award className="text-green-600" size={20} />
              <p className="text-sm font-semibold text-green-900">Meilleur jour</p>
            </div>
            <p className="text-sm text-green-700 font-medium">{format(new Date(analyse.meilleurJour.date), 'd MMM', { locale: fr })}</p>
            <p className="text-2xl font-extrabold text-green-700">{analyse.meilleurJour.total} cig</p>
          </div>
        )}

        {analyse.pireJour && (
          <div className="card bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <Target className="text-orange-600" size={20} />
              <p className="text-sm font-semibold text-orange-900">Pire jour</p>
            </div>
            <p className="text-sm text-orange-700 font-medium">{format(new Date(analyse.pireJour.date), 'd MMM', { locale: fr })}</p>
            <p className="text-2xl font-extrabold text-orange-700">{analyse.pireJour.total} cig</p>
          </div>
        )}
      </div>

      {/* ============== ONGLETS VUE / GRAPHIQUES / INSIGHTS ============== */}
      <div className="grid grid-cols-3 gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 p-2 rounded-xl border-2 border-indigo-200">
        <button
          onClick={() => setViewMode('overview')}
          className={`py-3 px-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm ${
            viewMode === 'overview'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <BarChart3 size={18} />
          Vue
        </button>
        <button
          onClick={() => setViewMode('graphiques')}
          className={`py-3 px-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm ${
            viewMode === 'graphiques'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <LineChart size={18} />
          Graphiques
        </button>
        <button
          onClick={() => setViewMode('insights')}
          className={`py-3 px-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 text-sm ${
            viewMode === 'insights'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Brain size={18} />
          Insights
        </button>
      </div>

      {/* ============== GRAPHIQUES INTERACTIFS ============== */}
      {viewMode === 'graphiques' && (
        <div className="space-y-6">
          {/* Graphique tendance */}
          <div className="card border-2 border-indigo-300">
            <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-800 mb-4">
              <LineChart className="text-indigo-600" size={22} />
              ÉVOLUTION QUOTIDIENNE
            </h3>
            <GraphiqueTendance data={analyse.statsParJour} />
          </div>

          {/* Graphique situations */}
          <div className="card border-2 border-rose-300">
            <h3 className="text-lg font-bold flex items-center gap-2 text-rose-800 mb-4">
              <PieChart className="text-rose-600" size={22} />
              RÉPARTITION PAR SITUATION
            </h3>
            <GraphiqueSituations data={analyse.parSituation} labels={SITUATIONS_LABELS} />
          </div>

          {/* Graphique horaires */}
          <div className="card border-2 border-amber-300">
            <h3 className="text-lg font-bold flex items-center gap-2 text-amber-800 mb-4">
              <Clock className="text-amber-600" size={22} />
              CONSOMMATION PAR TRANCHE HORAIRE
            </h3>
            <GraphiqueHoraires data={analyse.parHoraire} />
          </div>

          {/* Graphique lieux */}
          <div className="card border-2 border-emerald-300">
            <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-800 mb-4">
              <MapPin className="text-emerald-600" size={22} />
              TOP LIEUX DE CONSOMMATION
            </h3>
            <GraphiqueLieux data={analyse.parLieu} labels={LIEUX_LABELS} />
          </div>
        </div>
      )}

      {/* ============== INSIGHTS IA ============== */}
      {viewMode === 'insights' && (
        <Insights />
      )}

      {/* ============== VUE D'ENSEMBLE (sections détaillées) ============== */}
      {viewMode === 'overview' && (
        <>
      {/* ============== SECTION PAR TYPE ============== */}
      <div className="card border-2 border-rose-300">
        <h3 className="text-lg font-bold flex items-center gap-2 text-rose-800 mb-4">
          <span className="text-xl">🎭</span>
          PAR TYPE DE CIGARETTE
        </h3>
        
        <div className="space-y-3">
          {Object.entries(analyse.parType)
            .sort(([, a], [, b]) => b.total - a.total)
            .map(([type, data]) => {
              const typeConfig: Record<string, { label: string; emoji: string; color: string }> = {
                besoin: { label: 'Besoin', emoji: '🔴', color: 'bg-red-500' },
                plaisir: { label: 'Plaisir', emoji: '💚', color: 'bg-green-500' },
                automatique: { label: 'Automatique', emoji: '⚪', color: 'bg-gray-400' }
              };
              const config = typeConfig[type] || { label: type, emoji: '❓', color: 'bg-gray-400' };
              
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium flex items-center gap-1">
                      <span className="text-lg">{config.emoji}</span> {config.label}
                    </span>
                    <span className="text-sm font-bold">{data.total} <span className="text-xs text-gray-500">({data.pourcentage.toFixed(0)}%)</span></span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${config.color}`}
                      style={{ width: `${data.pourcentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* ============== SECTION PAR SITUATION ============== */}
      <div className="card border-2 border-indigo-300">
        <h3 className="text-lg font-bold flex items-center gap-2 text-indigo-800 mb-4">
          <MapPin size={22} className="text-indigo-600" />
          PAR SITUATION
        </h3>
        
        <div className="space-y-3">
          {Object.entries(analyse.parSituation)
            .sort(([, a], [, b]) => b.total - a.total)
            .slice(0, 6) // Top 6 situations
            .map(([situation, data]) => (
              <div key={situation}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium flex items-center gap-1">
                    <span className="text-lg">{situationEmojis[situation] || '📍'}</span> 
                    {SITUATIONS_LABELS[situation as SituationCigarette] || situation}
                  </span>
                  <span className="text-sm font-bold">{data.total} <span className="text-xs text-gray-500">({data.pourcentage.toFixed(0)}%)</span></span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="h-2.5 rounded-full bg-indigo-500"
                    style={{ width: `${data.pourcentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* ============== SECTION PAR LIEU ============== */}
      <div className="card border-2 border-emerald-300">
        <h3 className="text-lg font-bold flex items-center gap-2 text-emerald-800 mb-4">
          <Home size={22} className="text-emerald-600" />
          PAR LIEU
        </h3>
        
        <div className="space-y-3">
          {Object.entries(analyse.parLieu)
            .sort(([, a], [, b]) => b.total - a.total)
            .map(([lieu, data]) => (
              <div key={lieu}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium flex items-center gap-1">
                    <span className="text-lg">{lieuEmojis[lieu] || '📍'}</span> 
                    {LIEUX_LABELS[lieu as LieuCigarette] || lieu}
                  </span>
                  <span className="text-sm font-bold">{data.total} <span className="text-xs text-gray-500">({data.pourcentage.toFixed(0)}%)</span></span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="h-2.5 rounded-full bg-emerald-500"
                    style={{ width: `${data.pourcentage}%` }}
                  ></div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* ============== SECTION PAR HORAIRE ============== */}
      <div className="card border-2 border-amber-300">
        <h3 className="text-lg font-bold flex items-center gap-2 text-amber-800 mb-4">
          <Clock size={22} className="text-amber-600" />
          PAR HORAIRE (TRANCHES 3H)
        </h3>
        
        <div className="space-y-3">
          {TRANCHES_HORAIRES
            .filter(t => analyse.parHoraire[t.id] && analyse.parHoraire[t.id].total > 0)
            .map(tranche => {
              const data = analyse.parHoraire[tranche.id];
              return (
                <div key={tranche.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium flex items-center gap-1">
                      <span className="text-lg">{tranche.emoji}</span> {tranche.label}
                    </span>
                    <span className="text-sm font-bold">{data.total} <span className="text-xs text-gray-500">({data.pourcentage.toFixed(0)}%)</span></span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="h-2.5 rounded-full bg-amber-500"
                      style={{ width: `${data.pourcentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Score moyen global */}
      <div className={`card ${
        analyse.scoreMoyen <= 12 ? 'bg-gradient-to-br from-red-50 to-orange-50 border-red-200'
        : analyse.scoreMoyen <= 18 ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200'
        : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-600">Score moyen global</p>
            <p className="text-4xl font-extrabold mt-1">{analyse.scoreMoyen.toFixed(1)}</p>
          </div>
          <div className="text-5xl">
            {analyse.scoreMoyen <= 12 ? '🎯' : analyse.scoreMoyen <= 18 ? '📊' : '⭐'}
          </div>
        </div>
        <p className="text-sm mt-2 text-gray-600">
          {analyse.scoreMoyen <= 12 ? 'Beaucoup de cigarettes évitables !'
           : analyse.scoreMoyen <= 18 ? 'Score moyen - continue à identifier les évitables'
           : 'Bon score - cigarettes majoritairement justifiées'}
        </p>
      </div>

      {/* Bouton Export PDF */}
      <button
        onClick={genererPDF}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
      >
        <FileDown size={24} />
        Exporter en PDF ({periode === 'semaine' ? '7j' : periode === 'mois' ? '30j' : 'Tout'})
      </button>
    </>)}

      </div>
      {/* ===== FIN ZONE PDF ===== */}

    </div>
  );

  async function genererPDF() {
    console.log('🚀 Début génération PDF...');
    
    try {
      if (!analyse) {
        alert('Aucune donnée à exporter');
        return;
      }

      // Afficher un message de chargement
      const loadingMsg = document.createElement('div');
      loadingMsg.id = 'pdf-loading';
      loadingMsg.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
      loadingMsg.innerHTML = '<div class="bg-white rounded-xl p-6 shadow-2xl"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div><p class="font-bold text-lg">Génération du PDF HD...</p></div>';
      document.body.appendChild(loadingMsg);

      // Créer le PDF en haute qualité
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - (margin * 2);
      const contentHeight = pageHeight - (margin * 2);

      // Sauvegarder le mode actuel
      const currentMode = viewMode;

      // Fonction pour capturer une vue avec haute qualité
      async function captureView(mode: 'overview' | 'graphiques' | 'insights', title: string, isFirstSection: boolean) {
        // Changer le mode
        setViewMode(mode);
        await new Promise(resolve => setTimeout(resolve, 600)); // Attendre le rendu complet

        const content = document.getElementById('pdf-content') as HTMLElement;
        if (!content) return;

        console.log(`📸 Capture HD ${title}...`);

        // Capture avec haute résolution (scale 3 pour meilleure qualité)
        const dataUrl = await domToJpeg(content, {
          scale: 3,
          quality: 1,
          backgroundColor: '#ffffff'
        });

        const img = new Image();
        img.src = dataUrl;
        await new Promise((resolve) => { img.onload = resolve; });

        // Calculer les dimensions en conservant le ratio
        const imgRatio = img.width / img.height;
        let finalWidth = contentWidth;
        let finalHeight = finalWidth / imgRatio;

        // Si l'image tient sur une page, l'ajouter directement
        if (finalHeight <= contentHeight) {
          if (!isFirstSection) {
            pdf.addPage();
          }
          pdf.addImage(dataUrl, 'PNG', margin, margin, finalWidth, finalHeight);
          console.log(`✅ ${title} capturé (1 page)`);
          return;
        }

        // Sinon, découper en plusieurs pages sans étirement
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Calculer la hauteur source correspondant à une page PDF
        const sourcePageHeight = Math.floor((contentHeight / contentWidth) * img.width);
        
        let sourceY = 0;
        let pageCount = 0;

        while (sourceY < img.height) {
          if (pageCount > 0 || !isFirstSection) {
            pdf.addPage();
          }

          const remainingHeight = img.height - sourceY;
          const heightToCopy = Math.min(sourcePageHeight, remainingHeight);

          // Créer un canvas pour cette portion
          const pageCanvas = document.createElement('canvas');
          const pageCtx = pageCanvas.getContext('2d');
          if (!pageCtx) continue;

          pageCanvas.width = img.width;
          pageCanvas.height = heightToCopy;

          // Fond blanc
          pageCtx.fillStyle = '#ffffff';
          pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          
          // Copier la portion de l'image
          pageCtx.drawImage(
            canvas, 
            0, sourceY, img.width, heightToCopy,  // Source
            0, 0, img.width, heightToCopy          // Destination (même taille = pas d'étirement)
          );

          // Calculer la hauteur finale dans le PDF (proportionnelle)
          const pdfPageHeight = (heightToCopy / img.width) * contentWidth;

          const pageImgData = pageCanvas.toDataURL('image/png');
          pdf.addImage(pageImgData, 'PNG', margin, margin, contentWidth, pdfPageHeight);

          sourceY += heightToCopy;
          pageCount++;
        }

        console.log(`✅ ${title} capturé (${pageCount} pages)`);
      }

      // Capturer les 3 vues
      await captureView('overview', 'Vue d\'ensemble', true);
      await captureView('graphiques', 'Graphiques', false);
      await captureView('insights', 'Insights IA', false);

      // Restaurer le mode initial
      setViewMode(currentMode);

      // Retirer le message de chargement
      const loadingElement = document.getElementById('pdf-loading');
      if (loadingElement) {
        document.body.removeChild(loadingElement);
      }

      // Sauvegarder le PDF
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const filename = periode === 'semaine' ? `analyse_7j_${dateStr}.pdf` :
                       periode === 'mois' ? `analyse_30j_${dateStr}.pdf` :
                       `analyse_complete_${dateStr}.pdf`;
      
      pdf.save(filename);
      console.log('✅ PDF HD généré avec succès !');

    } catch (error) {
      console.error('❌ Erreur génération PDF:', error);
      alert('Erreur lors de la génération du PDF: ' + (error as Error).message);
      const loadingElement = document.getElementById('pdf-loading');
      if (loadingElement) {
        document.body.removeChild(loadingElement);
      }
    }
  }
}
