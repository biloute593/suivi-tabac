import { useState, useEffect, useRef } from 'react';
import { db } from '../db/database';
import type { Journee, Cigarette, Objectif } from '../types';
import { TYPE_JOURNEE_LABELS } from '../types';
import { format, addDays, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getCigarettesASupprimer } from '../utils/statistiques';
import { tempsDerniereClope } from '../utils/calculs';
import { Clock, Target, AlertCircle, ChevronLeft, ChevronRight, Calendar, MessageCircle, Edit3, Award, Flame } from 'lucide-react';
import SelectionTypeJournee from './SelectionTypeJournee';
import ModifierCigarette from './ModifierCigarette';
import ChatIA from './ChatIA';
import MurPublic from './MurPublic';

// Hook pour animation de compteur
function useCountUp(end: number, duration: number = 1000) {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    startTimeRef.current = null;
    
    const animate = (currentTime: number) => {
      if (!startTimeRef.current) startTimeRef.current = currentTime;
      const progress = Math.min((currentTime - startTimeRef.current) / duration, 1);
      
      setCount(Math.floor(progress * end));
      
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };
    
    frameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [end, duration]);

  return count;
}

// Composant Confetti
function Confetti() {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; rotation: number }>>([]);

  useEffect(() => {
    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899'];
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: -10,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360
    }));
    setParticles(newParticles);

    const timer = setTimeout(() => setParticles([]), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute w-2 h-2 rounded-full animate-confetti"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            backgroundColor: p.color,
            transform: `rotate(${p.rotation}deg)`,
            animation: `confetti-fall 3s ease-out forwards`
          }}
        />
      ))}
    </div>
  );
}

// Messages motivationnels basés sur la comparaison avec les jours précédents
function getMotivationalMessage(nombreCigarettes: number, moyennePrecedente: number | null): { message: string; emoji: string; color: string } {
  if (moyennePrecedente === null || nombreCigarettes === 0) {
    return { 
      message: "Commence ta journée du bon pied ! 🌅", 
      emoji: "🎯", 
      color: "text-blue-600" 
    };
  }
  
  const pourcentage = ((moyennePrecedente - nombreCigarettes) / moyennePrecedente) * 100;
  
  if (pourcentage >= 30) {
    return { 
      message: `Incroyable ! ${Math.round(pourcentage)}% de moins que d'habitude ! 🌟`, 
      emoji: "🏆", 
      color: "text-green-600" 
    };
  } else if (pourcentage >= 15) {
    return { 
      message: `Super progrès ! ${Math.round(pourcentage)}% de moins ! 💪`, 
      emoji: "⭐", 
      color: "text-blue-600" 
    };
  } else if (pourcentage >= 0) {
    return { 
      message: "Tu es dans la bonne voie ! ✨", 
      emoji: "✅", 
      color: "text-primary-600" 
    };
  } else if (pourcentage >= -15) {
    return { 
      message: "Un peu plus que d'habitude, mais tu peux te rattraper ! 💪", 
      emoji: "⚡", 
      color: "text-orange-600" 
    };
  } else {
    return { 
      message: "Demain est un nouveau jour pour progresser ! 🌅", 
      emoji: "🎯", 
      color: "text-red-600" 
    };
  }
}

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [journeeAujourdhui, setJourneeAujourdhui] = useState<Journee | null>(null);
  const [cigarettesAujourdhui, setCigarettesAujourdhui] = useState<Cigarette[]>([]);
  const [objectif, setObjectif] = useState<Objectif | null>(null);
  const [derniereHeure, setDerniereHeure] = useState<string>('');
  const [cigaretteAEviter, setCigaretteAEviter] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [cigaretteAModifier, setCigaretteAModifier] = useState<Cigarette | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [cigaretteForChat, setCigaretteForChat] = useState<Cigarette | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [streak, setStreak] = useState(0);
  const [badges, setBadges] = useState<Array<{ id: string; emoji: string; label: string; unlocked: boolean }>>([]);
  const [moyennePrecedente, setMoyennePrecedente] = useState<number | null>(null);

  const dateSelectionnee = format(selectedDate, 'yyyy-MM-dd');
  const isToday = dateSelectionnee === format(new Date(), 'yyyy-MM-dd');

  const nombreCigarettes = cigarettesAujourdhui.length;
  // Utiliser l'objectif figé de la journée, sinon l'objectif actif
  const objectifNombre = journeeAujourdhui?.objectifNombreMax || objectif?.nombreMax || 12;
  const progression = Math.min((nombreCigarettes / objectifNombre) * 100, 100);
  const objectifAtteint = nombreCigarettes <= objectifNombre;

  // Animation du compteur
  const countDisplay = useCountUp(nombreCigarettes, 800);

  // Message motivationnel basé sur les jours précédents
  const motivation = getMotivationalMessage(nombreCigarettes, moyennePrecedente);

  useEffect(() => {
    chargerDonnees();
    
    // Recharger toutes les 30 secondes pour mettre à jour le temps
    const interval = setInterval(chargerDonnees, 30000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  // Calculer les badges et streak après chargement des données
  useEffect(() => {
    if (journeeAujourdhui && isToday) {
      calculerBadgesEtStreak();
      
      // Confetti si objectif atteint et première fois de la journée
      if (objectifAtteint && nombreCigarettes > 0 && !localStorage.getItem(`confetti-${dateSelectionnee}`)) {
        setShowConfetti(true);
        localStorage.setItem(`confetti-${dateSelectionnee}`, 'true');
        setTimeout(() => setShowConfetti(false), 3000);
      }
    }
  }, [cigarettesAujourdhui, journeeAujourdhui, objectifAtteint]);

  async function calculerBadgesEtStreak() {
    try {
      // Calculer le streak (jours consécutifs avec objectif respecté)
      const today = new Date();
      let currentStreak = 0;
      
      for (let i = 0; i < 30; i++) {
        const checkDate = format(subDays(today, i), 'yyyy-MM-dd');
        const journee = await db.journees.where('date').equals(checkDate).first();
        
        if (!journee) break;
        
        const cigs = await db.cigarettes.where('journeeId').equals(journee.id!).toArray();
        const objectifJour = journee.objectifNombreMax || 12;
        
        if (cigs.length <= objectifJour) {
          currentStreak++;
        } else {
          break;
        }
      }
      
      setStreak(currentStreak);

      // Calculer les badges basés sur le nombre total de jours enregistrés
      const allJournees = await db.journees.toArray();
      const totalJours = allJournees.length;
      
      const newBadges = [
        { id: 'first-day', emoji: '🌱', label: 'Premier jour', unlocked: totalJours >= 1 },
        { id: 'week-strong', emoji: '💪', label: '7 jours de suivi', unlocked: totalJours >= 7 },
        { id: 'goal-master', emoji: '🎯', label: '3 jours d\'objectif respecté', unlocked: currentStreak >= 3 },
        { id: 'champion', emoji: '🏆', label: '2 semaines de suivi', unlocked: totalJours >= 14 },
        { id: 'perfectionist', emoji: '⭐', label: 'Score moyen > 18', unlocked: nombreCigarettes > 0 && cigarettesAujourdhui.reduce((acc, c) => acc + c.scoreCalcule, 0) / nombreCigarettes > 18 },
        { id: 'warrior', emoji: '🔥', label: '30 jours de streak', unlocked: currentStreak >= 30 }
      ];
      
      setBadges(newBadges);
    } catch (error) {
      console.error('Erreur calcul badges:', error);
    }
  }

  async function chargerDonnees() {
    try {
      // Charger la journée sélectionnée
      const journee = await db.journees.where('date').equals(dateSelectionnee).first();
      setJourneeAujourdhui(journee || null);

      // Charger les cigarettes de la journée
      if (journee) {
        const cigs = await db.cigarettes
          .where('journeeId')
          .equals(journee.id!)
          .sortBy('heure');
        setCigarettesAujourdhui(cigs);

        if (cigs.length > 0) {
          setDerniereHeure(cigs[cigs.length - 1].heure);
        }
      } else {
        setCigarettesAujourdhui([]);
      }

      // Calculer la moyenne des 7 derniers jours (excluant le jour actuel)
      const today = new Date(dateSelectionnee);
      let totalCigarettes = 0;
      let joursComptes = 0;
      
      for (let i = 1; i <= 7; i++) {
        const checkDate = format(subDays(today, i), 'yyyy-MM-dd');
        const journeePrecedente = await db.journees.where('date').equals(checkDate).first();
        
        if (journeePrecedente) {
          const cigsPrecedentes = await db.cigarettes.where('journeeId').equals(journeePrecedente.id!).toArray();
          totalCigarettes += cigsPrecedentes.length;
          joursComptes++;
        }
      }
      
      setMoyennePrecedente(joursComptes > 0 ? totalCigarettes / joursComptes : null);

      // Charger l'objectif actif
      const obj = await db.objectifs.where('actif').equals(1).first();
      setObjectif(obj || null);

      // Charger la cigarette à éviter
      const cigASupprimer = await getCigarettesASupprimer(1);
      if (cigASupprimer.length > 0) {
        const cig = cigASupprimer[0];
        setCigaretteAEviter(`${cig.contexte} (score ${cig.cigarette.scoreCalcule})`);
      }

      setLoading(false);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      setLoading(false);
    }
  }

  function navigateDate(direction: 'prev' | 'next') {
    if (direction === 'prev') {
      setSelectedDate(subDays(selectedDate, 1));
    } else {
      const tomorrow = addDays(selectedDate, 1);
      if (tomorrow <= new Date()) {
        setSelectedDate(tomorrow);
      }
    }
  }

  function goToToday() {
    setSelectedDate(new Date());
  }

  function handleCigaretteClick(cigarette: Cigarette) {
    setCigaretteAModifier(cigarette);
  }

  function handleChatClick(cigarette?: Cigarette) {
    setCigaretteForChat(cigarette || null);
    setShowChat(true);
  }

  async function handleTypeJourneeSelect(type: string) {
    // Récupérer l'objectif actuel pour le figer dans la journée
    const obj = await db.objectifs.where('actif').equals(1).first();
    const objectifActuel = obj?.nombreMax || 12;
    
    const nouvJournee = await db.journees.add({
      date: dateSelectionnee,
      typeJournee: type as any,
      objectifNombreMax: objectifActuel, // Figer l'objectif du jour
      createdAt: new Date().toISOString()
    });

    const journee = await db.journees.get(nouvJournee);
    setJourneeAujourdhui(journee || null);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-primary-600 absolute top-0"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Sélecteur de date */}
      <div className="card-gradient animate-slide-up">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all"
          >
            <ChevronLeft size={24} className="text-gray-600" />
          </button>
          
          <div className="flex-1 text-center">
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className="inline-flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-xl transition-all"
            >
              <Calendar size={20} className="text-primary-600" />
              <div>
                <p className="text-gray-500 text-sm font-medium">
                  {format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr })}
                </p>
                {journeeAujourdhui && (
                  <p className="text-lg font-bold text-gradient">
                    {TYPE_JOURNEE_LABELS[journeeAujourdhui.typeJournee]}
                  </p>
                )}
              </div>
            </button>
            {!isToday && (
              <button
                onClick={goToToday}
                className="mt-2 px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full hover:bg-primary-200 transition-all"
              >
                Aujourd'hui
              </button>
            )}
          </div>
          
          <button
            onClick={() => navigateDate('next')}
            disabled={addDays(selectedDate, 1) > new Date()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Calendrier popup */}
        {showCalendar && (
          <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200 shadow-lg">
            <input
              type="date"
              value={dateSelectionnee}
              max={format(new Date(), 'yyyy-MM-dd')}
              onChange={(e) => {
                setSelectedDate(new Date(e.target.value));
                setShowCalendar(false);
              }}
              className="w-full input-field text-center text-lg"
            />
          </div>
        )}
      </div>

      {/* Si pas de type de journée sélectionné pour aujourd'hui */}
      {!journeeAujourdhui && isToday ? (
        <>
          <SelectionTypeJournee onSelect={handleTypeJourneeSelect} />
          
          {/* Mur Public en dessous de la sélection */}
          <div className="mt-6">
            <MurPublic />
          </div>
        </>
      ) : !journeeAujourdhui && !isToday ? (
        <div className="card-gradient text-center py-8">
          <span className="text-5xl mb-4 block">📅</span>
          <p className="text-gray-600 font-medium">Aucune donnée pour ce jour</p>
          <p className="text-sm text-gray-500 mt-2">Sélectionnez une autre date</p>
        </div>
      ) : (
        <>

      {/* Compteur principal */}
      <div className="card-gradient animate-scale-in relative overflow-hidden">
        {showConfetti && <Confetti />}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-100/50 to-transparent rounded-full blur-2xl"></div>
        <div className="relative text-center">
          <p className="text-gray-600 mb-3 font-medium flex items-center justify-center gap-2">
            <span className="text-2xl">🚬</span>
            <span>Cigarettes aujourd'hui</span>
          </p>
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className={`text-6xl font-extrabold ${objectifAtteint ? 'text-primary-600' : 'text-red-600'} transition-all duration-300`}>
              {countDisplay}
            </span>
            <span className="text-4xl text-gray-300 font-light">/</span>
            <span className="text-4xl text-gray-500 font-bold">{objectifNombre}</span>
            <div className="ml-2">
              {objectifAtteint ? (
                <span className="text-4xl animate-pulse-slow">✅</span>
              ) : (
                <span className="text-4xl animate-pulse">⚠️</span>
              )}
            </div>
          </div>

          {/* Message motivationnel */}
          {isToday && (
            <div className="mb-4 flex items-center justify-center gap-2">
              <span className="text-3xl">{motivation.emoji}</span>
              <p className={`text-base font-bold ${motivation.color}`}>
                {motivation.message}
              </p>
            </div>
          )}

          {/* Streak */}
          {streak > 0 && isToday && (
            <div className="mb-4 inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-red-100 px-4 py-2 rounded-full shadow-sm">
              <Flame className="text-orange-600" size={20} />
              <span className="text-orange-900 font-bold text-base">
                {streak} jour{streak > 1 ? 's' : ''} de streak 🔥
              </span>
            </div>
          )}

          {/* Barre de progression */}
          <div className="mt-6 relative">
            <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
              <div
                className={`h-4 rounded-full transition-all duration-500 ease-out ${
                  objectifAtteint 
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 shadow-glow' 
                    : 'bg-gradient-to-r from-red-500 to-red-600'
                }`}
                style={{ width: `${progression}%` }}
              >
                <div className="h-full w-full rounded-full bg-white/20"></div>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2 font-medium">
              {objectifAtteint ? '🎉 Objectif respecté !' : `${objectifNombre - nombreCigarettes} cigarettes restantes`}
            </p>
          </div>
        </div>
      </div>

      {/* Badges section */}
      {badges.filter(b => b.unlocked).length > 0 && isToday && (
        <div className="card bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300">
          <div className="flex items-center gap-2 mb-3">
            <Award className="text-yellow-600" size={24} />
            <h3 className="text-lg font-bold text-yellow-900">Badges débloqués</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {badges.filter(b => b.unlocked).map(badge => (
              <div 
                key={badge.id}
                className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm animate-scale-in border border-yellow-200"
              >
                <span className="text-2xl">{badge.emoji}</span>
                <span className="text-sm font-semibold text-gray-800">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Infos rapides */}
      <div className="grid grid-cols-2 gap-4">
        {/* Dernière cigarette */}
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200 hover:scale-105 transition-transform duration-300">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="bg-blue-500 p-2 rounded-lg">
                <Clock className="text-white" size={20} />
              </div>
              <p className="text-xs font-semibold text-blue-900">Dernière cigarette</p>
            </div>
            <p className="text-lg font-bold text-blue-900 ml-1">
              {derniereHeure ? tempsDerniereClope(derniereHeure) : 'Aucune'}
            </p>
          </div>
        </div>

        {/* Objectif */}
        <div className="card bg-gradient-to-br from-green-50 to-green-100/50 border-green-200 hover:scale-105 transition-transform duration-300">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="bg-green-500 p-2 rounded-lg">
                <Target className="text-white" size={20} />
              </div>
              <p className="text-xs font-semibold text-green-900">Objectif du jour</p>
            </div>
            <p className="text-lg font-bold text-green-900 ml-1">Max {objectifNombre}</p>
          </div>
        </div>
      </div>

      {/* Cigarette à éviter */}
      {cigaretteAEviter && (
        <div className="card bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-300 animate-pulse-slow">
          <div className="flex items-start gap-3">
            <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-3 rounded-xl shadow-lg">
              <AlertCircle className="text-white" size={24} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🎯</span>
                <p className="text-base font-bold text-orange-900">
                  Cigarette à éviter aujourd'hui
                </p>
              </div>
              <p className="text-sm text-orange-800 font-medium bg-white/50 p-2 rounded-lg">
                {cigaretteAEviter}
              </p>
              <div className="flex items-start gap-1 mt-2 bg-amber-100/50 p-2 rounded-lg">
                <span className="text-base">💡</span>
                <p className="text-xs text-orange-700 font-medium">
                  Essayez de sauter celle-ci pour améliorer votre score
                </p>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Liste des cigarettes d'aujourd'hui */}
      {cigarettesAujourdhui.length > 0 && (
        <div className="card-gradient">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📋</span>
              <h3 className="text-xl font-bold text-gradient">Cigarettes {isToday ? "d'aujourd'hui" : 'du jour'}</h3>
              <span className="bg-gradient-to-r from-primary-500 to-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">{cigarettesAujourdhui.length}</span>
            </div>
            <span className="text-sm text-gray-500 font-medium">✏️ Modifier</span>
          </div>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {/* Trier par heure croissante pour respecter la chronologie */}
            {[...cigarettesAujourdhui].sort((a, b) => a.heure.localeCompare(b.heure)).map((cig, index, sortedArr) => {
              const cigPrecedente = index > 0 ? sortedArr[index - 1] : null;
              const numeroChronologique = index + 1;
              
              let delaiMinutes = 0;
              if (cigPrecedente) {
                const [h1, m1] = cigPrecedente.heure.split(/[h:]/).map(n => parseInt(n) || 0);
                const [h2, m2] = cig.heure.split(/[h:]/).map(n => parseInt(n) || 0);
                const minutes1 = h1 * 60 + m1;
                const minutes2 = h2 * 60 + m2;
                delaiMinutes = minutes2 - minutes1;
              }

              return (
                <div key={cig.id}>
                  {/* Afficher le délai si cigarette précédente */}
                  {cigPrecedente && delaiMinutes > 0 && (
                    <div className="flex items-center justify-center py-2">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        delaiMinutes < 60 
                          ? 'bg-red-100 text-red-700' 
                          : delaiMinutes < 90
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        ⏱️ {delaiMinutes < 60 
                          ? `${delaiMinutes} min depuis la précédente`
                          : `${Math.floor(delaiMinutes / 60)}h${(delaiMinutes % 60).toString().padStart(2, '0')} depuis la précédente`
                        }
                      </div>
                    </div>
                  )}
                  
                  <div
                    onClick={() => handleCigaretteClick(cig)}
                    className="p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl shadow-soft hover:shadow-lg transition-all duration-300 border border-gray-200 hover:scale-102 animate-fade-in cursor-pointer hover:border-primary-300 group"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-2 rounded-lg group-hover:from-primary-100 group-hover:to-primary-200 transition-all">
                          <span className="text-xl">
                            {cig.type === 'besoin' ? '🔴' : cig.type === 'plaisir' ? '💚' : '⚪'}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">#{numeroChronologique} - {cig.heure}</p>
                          <p className="text-xs text-gray-500">{cig.type === 'besoin' ? 'Besoin' : cig.type === 'plaisir' ? 'Plaisir' : 'Automatique'}</p>
                        </div>
                      </div>
                      <span
                        className={`text-sm font-bold px-3 py-1 rounded-lg ${
                          cig.scoreCalcule <= 10
                            ? 'bg-red-100 text-red-800'
                            : cig.scoreCalcule <= 15
                            ? 'bg-orange-100 text-orange-800'
                            : cig.scoreCalcule <= 20
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        Score {cig.scoreCalcule}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div className="bg-gray-100 px-2 py-1 rounded text-center">
                        <span className="block text-gray-500">Lieu</span>
                        <span className="font-medium text-gray-800">{cig.lieu === 'maison' ? '🏠' : cig.lieu === 'travail' ? '🏢' : cig.lieu === 'exterieur' ? '🚶' : cig.lieu === 'voiture' ? '🚗' : cig.lieu === 'restaurant' ? '🍽️' : '👥'}</span>
                      </div>
                      <div className="bg-gray-100 px-2 py-1 rounded text-center">
                        <span className="block text-gray-500">Besoin</span>
                        <span className="font-medium text-gray-800">{cig.besoin}/10</span>
                      </div>
                      <div className="bg-gray-100 px-2 py-1 rounded text-center">
                        <span className="block text-gray-500">Satisf.</span>
                        <span className="font-medium text-gray-800">{cig.satisfaction}/10</span>
                      </div>
                      <div className="bg-gray-100 px-2 py-1 rounded text-center">
                        <span className="block text-gray-500">Qté</span>
                        <span className="font-medium text-gray-800">{cig.quantite === 'entiere' ? '1' : cig.quantite}</span>
                      </div>
                    </div>
                    {cig.commentaire && (
                      <p className="mt-2 text-xs text-gray-600 italic bg-gray-50 p-2 rounded whitespace-pre-wrap">💬 {cig.commentaire}</p>
                    )}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                      <span className="text-xs text-gray-500">📍 {cig.situation.replace('_', ' ')}{cig.kudzuPris ? ' • ☑️ Kudzu' : ''}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleChatClick(cig);
                          }}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                          title="Discuter de cette cigarette"
                        >
                          <MessageCircle size={16} />
                        </button>
                        <div className="p-1.5 text-gray-400 group-hover:text-primary-600 transition-all">
                          <Edit3 size={16} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bouton flottant Chat IA - bien visible */}
      <button
        onClick={() => handleChatClick()}
        className="fixed bottom-24 right-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-5 py-3 rounded-full shadow-2xl hover:shadow-3xl hover:scale-105 transition-all duration-300 flex items-center gap-2 z-40 animate-pulse-slow"
        title="Discuter avec le coach IA"
      >
        <MessageCircle size={22} />
        <span className="font-bold text-sm">Coach IA</span>
      </button>

      </>
      )}

      {/* Modal modifier cigarette */}
      {cigaretteAModifier && (
        <ModifierCigarette
          cigarette={cigaretteAModifier}
          onSuccess={() => {
            setCigaretteAModifier(null);
            chargerDonnees();
          }}
          onCancel={() => setCigaretteAModifier(null)}
        />
      )}

      {/* Modal Chat IA */}
      {showChat && (
        <ChatIA
          onClose={() => {
            setShowChat(false);
            setCigaretteForChat(null);
          }}
          cigaretteContext={cigaretteForChat}
        />
      )}
    </div>
  );
}
