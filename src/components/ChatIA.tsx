import { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, User, Sparkles, Cigarette, Trash2 } from 'lucide-react';
import { db } from '../db/database';
import { getCurrentUser } from '../utils/userContext';
import type { Cigarette as CigaretteType, Journee } from '../types';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Clé localStorage pour sauvegarder l'historique (par utilisateur)
function getChatHistoryKey(): string {
  const user = getCurrentUser();
  return `chat_history_${user?.userId || 'guest'}`;
}

interface Props {
  onClose: () => void;
  cigaretteContext?: CigaretteType | null;
}

// URL de l'API Azure Functions
const API_URL = 'https://suivi-tabac-func-free.azurewebsites.net/api';

export default function ChatIA({ onClose, cigaretteContext }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [fullContext, setFullContext] = useState<any>(null); // Contexte complet pour l'IA
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Charger l'historique sauvegardé au démarrage
  useEffect(() => {
    const chatKey = getChatHistoryKey();
    const savedHistory = localStorage.getItem(chatKey);
    if (savedHistory && !cigaretteContext) {
      try {
        const parsed = JSON.parse(savedHistory);
        // Convertir les timestamps en Date
        const restoredMessages = parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
        setMessages(restoredMessages);
      } catch (e) {
        console.error('Erreur restauration historique:', e);
        addWelcomeMessage();
      }
    } else {
      addWelcomeMessage();
    }
    chargerContexteComplet();
  }, [cigaretteContext]);

  // Sauvegarder l'historique à chaque changement
  useEffect(() => {
    if (messages.length > 0 && !cigaretteContext) {
      // Garder max 50 messages pour ne pas surcharger
      const toSave = messages.slice(-50);
      const chatKey = getChatHistoryKey();
      localStorage.setItem(chatKey, JSON.stringify(toSave));
    }
  }, [messages, cigaretteContext]);

  function addWelcomeMessage() {
    const user = getCurrentUser();
    const userName = user?.pseudo || 'toi';
    const welcomeMessage: Message = {
      id: '1',
      role: 'assistant',
      content: cigaretteContext
        ? `Bonjour ${userName} ! 💚 Je vois que tu souhaites discuter de ta cigarette n°${cigaretteContext.numero} (${cigaretteContext.heure}). Comment te sens-tu par rapport à celle-ci ?`
        : `Bonjour ${userName} ! 💚 Je suis ton assistant IA personnel pour t'accompagner dans ta réduction du tabac.\n\n💬 **Je peux t'aider à** :\n• Analyser tes habitudes de consommation\n• Gérer tes envies de fumer\n• Te motiver dans ta démarche\n• Répondre à tes questions\n\nN'hésite pas à me parler de ce qui te préoccupe. Je suis là pour toi ! 🌟`,
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
  }

  function clearHistory() {
    const chatKey = getChatHistoryKey();
    localStorage.removeItem(chatKey);
    addWelcomeMessage();
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Charger TOUTES les données pour l'IA
  async function chargerContexteComplet() {
    try {
      const dateAujourdhui = format(new Date(), 'yyyy-MM-dd');
      const dateHier = format(subDays(new Date(), 1), 'yyyy-MM-dd');

      // Journée d'aujourd'hui
      const journeeAujourdhui = await db.journees.where('date').equals(dateAujourdhui).first();
      let cigarettesAujourdhui: CigaretteType[] = [];
      if (journeeAujourdhui) {
        cigarettesAujourdhui = await db.cigarettes.where('journeeId').equals(journeeAujourdhui.id!).toArray();
      }

      // Journée d'hier (pour le contexte matinal)
      const journeeHier = await db.journees.where('date').equals(dateHier).first();
      let cigarettesHier: CigaretteType[] = [];
      if (journeeHier) {
        cigarettesHier = await db.cigarettes.where('journeeId').equals(journeeHier.id!).toArray();
      }

      // 7 derniers jours
      const journees7j: Journee[] = [];
      const stats7j: { date: string; count: number; type: string }[] = [];
      for (let i = 0; i < 7; i++) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        const j = await db.journees.where('date').equals(date).first();
        if (j) {
          journees7j.push(j);
          const count = await db.cigarettes.where('journeeId').equals(j.id!).count();
          stats7j.push({ date, count, type: j.typeJournee });
        }
      }

      // Objectifs
      const objectifs = await db.objectifs.toArray();

      // Notes du journal
      const journalNotes = await db.journalNotes.toArray();

      // Profil de l'utilisateur connecté
      const currentUser = getCurrentUser();
      const profilInfo = {
        pseudo: currentUser?.pseudo || 'Utilisateur',
        userId: currentUser?.userId,
        objectifGlobal: currentUser?.objectifGlobal
      };

      // Calculer moyenne
      const totalCig = stats7j.reduce((sum, s) => sum + s.count, 0);
      const moyenne = stats7j.length > 0 ? (totalCig / stats7j.length).toFixed(1) : 'N/A';

      // Analyse des cigarettes d'aujourd'hui
      const analyseAujourdhui = cigarettesAujourdhui.map(c => ({
        numero: c.numero,
        heure: c.heure,
        lieu: c.lieu,
        type: c.type,
        besoin: c.besoin,
        satisfaction: c.satisfaction,
        score: c.scoreCalcule,
        commentaire: c.commentaire
      }));

      const context = {
        aujourdhui: cigarettesAujourdhui.length,
        hier: cigarettesHier.length, // Ajout du contexte d'hier
        moyenne7j: moyenne,
        typeJournee: journeeAujourdhui?.typeJournee || 'inconnue',
        typeJourneeHier: journeeHier?.typeJournee || 'inconnue', // Type de journée d'hier
        stats7jours: stats7j,
        cigarettesDetailAujourdhui: analyseAujourdhui,
        profil: profilInfo,
        objectifs: objectifs.map(o => ({
          nombreMax: o.nombreMax,
          actif: o.actif
        })),
        journal: journalNotes.map(n => ({
          date: n.date,
          contenu: n.contenu.substring(0, 200), // Limite pour ne pas surcharger
          createdAt: n.createdAt
        }))
      };

      setStats({
        aujourdhui: cigarettesAujourdhui.length,
        hier: cigarettesHier.length,
        moyenne7j: moyenne,
        typeJournee: journeeAujourdhui?.typeJournee
      });
      setFullContext(context);
    } catch (error) {
      console.error('Erreur chargement contexte:', error);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const heureActuelle = new Date().getHours();
      const estMatin = heureActuelle < 11;

      // Construire le contexte COMPLET pour l'IA
      const currentUser = getCurrentUser();
      const contexte = {
        pseudo: currentUser?.pseudo || fullContext?.profil?.pseudo || 'Lydie',
        heureAppel: heureActuelle,
        estMatin: estMatin,

        // Stats prioritaires
        cigarettesAujourdhui: stats?.aujourdhui || 0,
        cigarettesHier: stats?.hier || 0, // Passer explicitement hier

        moyenne7jours: stats?.moyenne7j || 'N/A',
        typeJournee: stats?.typeJournee || 'inconnue',
        typeJourneeHier: fullContext?.typeJourneeHier || 'inconnue',

        // Données complètes
        stats7jours: fullContext?.stats7jours || [],
        cigarettesDetailAujourdhui: fullContext?.cigarettesDetailAujourdhui || [],
        profil: fullContext?.profil || null,
        objectifs: fullContext?.objectifs || [],
        journal: fullContext?.journal || [],
        cigaretteDiscutee: cigaretteContext ? {
          numero: cigaretteContext.numero,
          heure: cigaretteContext.heure,
          lieu: cigaretteContext.lieu,
          type: cigaretteContext.type,
          besoin: cigaretteContext.besoin,
          satisfaction: cigaretteContext.satisfaction,
          score: cigaretteContext.scoreCalcule
        } : null
      };

      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input.trim(),
          contexte,
          historique: messages.slice(-6).map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Erreur API');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || "Désolé, je n'ai pas pu générer de réponse. Réessaie !",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Erreur chat:', error);
      // Réponse de fallback si l'API n'est pas disponible
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getFallbackResponse(input.trim(), cigaretteContext),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setLoading(false);
    }
  }

  function getFallbackResponse(userInput: string, cig: CigaretteType | null | undefined): string {
    const lowerInput = userInput.toLowerCase();

    // Récupérer le pseudo à jour directement
    const user = getCurrentUser();
    const pseudo = user?.pseudo || 'toi';

    if (lowerInput.includes('envie') || lowerInput.includes('craquer') || lowerInput.includes('fumer')) {
      return `Je t'écoute ${pseudo}. C'est tout à fait normal de ressentir cette envie, elle fait partie du processus.\n\nDis-moi, qu'est-ce qui se passe autour de toi en ce moment précis ? Est-ce que quelque chose t'a contrarié ou est-ce juste une habitude qui revient ?\n\nRespire un bon coup, je suis là. 💚`;
    }

    if (lowerInput.includes('conseil') || lowerInput.includes('aide') || lowerInput.includes('astuce')) {
      return `Tu sais ${pseudo}, il n'y a pas de solution magique, mais il y a ta propre force.\n\nSouvent, quand on cherche un conseil, c'est qu'on se sent un peu perdu face à une émotion. De quoi as-tu besoin là, tout de suite ? De calme ? De distraction ? D'énergie ?\n\nEn identifiant ce besoin réel, l'envie de fumer disparaît souvent d'elle-même. Tu veux qu'on essaie de trouver ça ensemble ?`;
    }

    if (cig) {
      const score = cig.scoreCalcule;
      const ressentis = score <= 10 ? "plutôt automatique" : score <= 20 ? "liée à un besoin modéré" : "importante pour toi";

      return `Alors ${pseudo}, regardons cette cigarette de ${cig.heure}. Elle semble être ${ressentis}.\n\nComment tu te sentais juste après l'avoir allumée ? Est-ce qu'elle t'a vraiment apporté le soulagement que tu attendais, ou est-ce que c'était juste "comme ça" ?\n\nPas de jugement ici, juste de l'observation pour t'aider à mieux te comprendre.`;
    }

    if (lowerInput.includes('stress') || lowerInput.includes('anxieux') || lowerInput.includes('nerveux') || lowerInput.includes('peur')) {
      return `Je sens que c'est un moment tendu pour toi ${pseudo}. 🫂\n\nLe stress nous fait souvent croire que la cigarette est la seule bouée de sauvetage. Mais en vrai, tu as déjà tout ce qu'il faut en toi pour t'apaiser.\n\nFerme les yeux une seconde. Imagine que tu déposes ce sac de stress par terre, juste pour une minute. Ça va aller. Tu veux m'en dire plus sur ce qui te préoccupe ?`;
    }

    if (lowerInput.includes('bilan') || lowerInput.includes('progression') || lowerInput.includes('stats')) {
      // Logique temporelle (matin vs reste de la journée)
      const heure = new Date().getHours();
      const estMatin = heure < 11;

      if (estMatin) {
        return `Bonjour ${pseudo} ! Prêt(e) à démarrer cette nouvelle journée ?\n\nSi on regarde hier, tu as fumé **${stats?.hier || 0} cigarettes**. Comment tu te sens par rapport à ça ? Est-ce qu'il y a un moment d'hier dont tu es particulièrement fier(e) ? 🌟`;
      } else {
        return `On fait un petit point ${pseudo} ?\n\nPour l'instant aujourd'hui, le compteur est à **${stats?.aujourdhui || 0} cigarettes**.\n\nComment tu te sens ? Est-ce que tu as l'impression de subir ta journée ou est-ce que tu arrives à garder le cap ? N'oublie pas que chaque cigarette évitée est une immense victoire, peu importe le chiffre final. 💪`;
      }
    }

    return `Je suis là ${pseudo}. 💚\n\nJe ne suis pas juste un robot qui compte des points. Je suis là pour t'écouter vraiment.\n\nQue ce soit une victoire, un doute, ou juste une envie de discuter pour penser à autre chose, je suis avec toi.\nDe quoi veux-tu qu'on parle ?`;
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Entrée seule = saut de ligne (comportement par défaut du textarea)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <Sparkles className="text-white" size={24} />
            </div>
            <div>
              <span className="text-lg font-bold text-white">Mon IA Perso</span>
              <p className="text-xs text-white/80">Parle-moi de tout ! 💬</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!cigaretteContext && messages.length > 1 && (
              <button
                onClick={clearHistory}
                className="bg-white/20 text-white hover:bg-white/30 p-2 rounded-full transition-all"
                title="Effacer l'historique"
              >
                <Trash2 size={18} />
              </button>
            )}
            <button
              onClick={onClose}
              className="bg-white text-red-600 hover:bg-red-500 hover:text-white p-2.5 rounded-full transition-all hover:scale-110 shadow-lg"
              title="Fermer"
            >
              <X size={24} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* Context bar */}
        {cigaretteContext && (
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-2 border-b flex items-center gap-2">
            <Cigarette size={16} className="text-orange-600" />
            <span className="text-sm text-orange-800 font-medium">
              Discussion sur la cigarette #{cigaretteContext.numero} ({cigaretteContext.heure})
            </span>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 animate-fade-in ${message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'user'
                ? 'bg-primary-600'
                : 'bg-gradient-to-br from-green-500 to-emerald-600'
                }`}>
                {message.role === 'user' ? (
                  <User size={16} className="text-white" />
                ) : (
                  <Bot size={16} className="text-white" />
                )}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
                ? 'bg-primary-600 rounded-br-sm'
                : 'bg-white shadow-md rounded-bl-sm border border-gray-100'
                }`}>
                <p className={`text-sm whitespace-pre-line ${message.role === 'user' ? 'text-gray-900' : 'text-gray-800'
                  }`}>
                  {message.content}
                </p>
                <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-gray-600' : 'text-gray-400'
                  }`}>
                  {format(message.timestamp, 'HH:mm', { locale: fr })}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <Bot size={16} className="text-white" />
              </div>
              <div className="bg-white shadow-md rounded-2xl rounded-bl-sm px-4 py-3 border border-gray-100">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick actions */}
        <div className="px-4 py-2 border-t bg-white flex gap-2 overflow-x-auto">
          <button
            onClick={() => setInput("J'ai envie de fumer")}
            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-medium whitespace-nowrap hover:bg-red-200 transition-all"
          >
            🔥 J'ai envie
          </button>
          <button
            onClick={() => setInput("Comment je me sens aujourd'hui")}
            className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium whitespace-nowrap hover:bg-blue-200 transition-all"
          >
            😊 Mon humeur
          </button>
          <button
            onClick={() => setInput("Raconte-moi une blague")}
            className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium whitespace-nowrap hover:bg-yellow-200 transition-all"
          >
            😄 Blague
          </button>
          <button
            onClick={() => setInput("Donne-moi un conseil motivation")}
            className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium whitespace-nowrap hover:bg-green-200 transition-all"
          >
            💪 Motivation
          </button>
          <button
            onClick={() => setInput("Comment va ma progression ?")}
            className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium whitespace-nowrap hover:bg-purple-200 transition-all"
          >
            📊 Bilan
          </button>
        </div>

        {/* Input */}
        <div className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Écris ton message... (Shift+Entrée pour envoyer)"
              className="flex-1 input-field py-3 resize-none"
              rows={1}
              disabled={loading}
              style={{ minHeight: '44px', maxHeight: '120px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="btn-primary px-4 disabled:opacity-50 disabled:cursor-not-allowed self-end"
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">Shift+Entrée pour envoyer</p>
        </div>
      </div>
    </div>
  );
}
