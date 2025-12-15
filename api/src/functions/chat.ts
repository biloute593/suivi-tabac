import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';

interface CigaretteDetail {
  numero: number;
  heure: string;
  lieu: string;
  type: string;
  envie: number;
  besoin: number;
  satisfaction: number;
  score: number;
  commentaire?: string;
}

interface ChatRequest {
  message: string;
  contexte: {
    pseudo: string;
    cigarettesAujourdhui: number;
    moyenne7jours: string;
    typeJournee: string;
    // Données complètes
    stats7jours?: Array<{ date: string; count: number; type: string }>;
    cigarettesDetailAujourdhui?: CigaretteDetail[];
    profil?: {
      pseudo: string;
      cigarettesParJour?: number;
      prixPaquet?: number;
      dateDebut?: string;
      objectifJournalier?: number;
      createdAt?: string;
    };
    objectifs?: Array<{ nombreMax?: number; actif: boolean }>;
    journal?: Array<{ date: string; contenu: string; createdAt: string }>;
    cigaretteDiscutee?: {
      numero: number;
      heure: string;
      lieu: string;
      type: string;
      besoin: number;
      satisfaction: number;
      score: number;
    };
  };
  historique: Array<{ role: string; content: string }>;
}

interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

// Appel à l'API Google Gemini (GRATUIT)
async function callAI(systemPrompt: string, conversationHistory: Array<{ role: string; content: string }>, userMessage: string): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!geminiKey) {
    throw new Error('Clé API Gemini manquante (GEMINI_API_KEY)');
  }

  // Convertir l'historique au format Gemini
  const geminiHistory: GeminiMessage[] = [];
  
  // Ajouter le system prompt comme premier message utilisateur
  geminiHistory.push({
    role: 'user',
    parts: [{ text: systemPrompt }]
  });
  
  geminiHistory.push({
    role: 'model',
    parts: [{ text: 'Je comprends parfaitement mon rôle. Je suis prête à t\'accompagner !' }]
  });

  // Ajouter l'historique de conversation
  conversationHistory.forEach(msg => {
    geminiHistory.push({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    });
  });

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        ...geminiHistory,
        {
          role: 'user',
          parts: [{ text: userMessage }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json() as GeminiResponse;
  return data.candidates[0]?.content?.parts[0]?.text || 'Désolé, je n\'ai pas pu générer de réponse.';
}

// Génère le prompt système pour le coach
function generateSystemPrompt(contexte: ChatRequest['contexte']): string {
  const pseudo = contexte.pseudo || 'Lydie';
  
  let systemPrompt = `Tu es une IA conversationnelle amicale et empathique qui accompagne ${pseudo}. 

Tu es principalement un coach anti-tabac, mais tu peux discuter de TOUT avec ${pseudo} : sa journée, ses émotions, ses projets, ses questions, ses préoccupations... Sois comme un(e) ami(e) bienveillant(e).

STYLE DE CONVERSATION :
- Sois naturel(le), chaleureux(se) et empathique 💚
- Utilise le prénom ${pseudo} naturellement
- Réponds à TOUTES les questions, même si elles ne concernent pas le tabac
- Sois curieux(se), pose des questions pour mieux comprendre
- Adapte-toi à l'humeur et aux sujets de ${pseudo}
- Utilise des emojis pour rendre la conversation vivante
- Sois concis mais complet (max 400 mots)
- Réponds toujours en français

CONTEXTE TABAC DE ${pseudo} :
- Cigarettes aujourd'hui : ${contexte.cigarettesAujourdhui}
- Moyenne sur 7 jours : ${contexte.moyenne7jours}/jour
- Type de journée : ${contexte.typeJournee}`;

  // Cigarettes d'aujourd'hui avec détails
  if (contexte.cigarettesDetailAujourdhui && contexte.cigarettesDetailAujourdhui.length > 0) {
    systemPrompt += `\n\nCIGARETTES D'AUJOURD'HUI (${contexte.cigarettesDetailAujourdhui.length}) :`;
    contexte.cigarettesDetailAujourdhui.forEach(cig => {
      systemPrompt += `\n- #${cig.numero} à ${cig.heure} (${cig.lieu}, ${cig.type}) - Besoin: ${cig.besoin}/10, Satisfaction: ${cig.satisfaction}/10, Score: ${cig.score}/30`;
      if (cig.commentaire) {
        systemPrompt += `\n  💬 "${cig.commentaire}"`;
      }
    });
  }

  // Notes du journal
  if (contexte.journal && contexte.journal.length > 0) {
    systemPrompt += `\n\nNOTES DU JOURNAL DE ${pseudo} (dernières entrées) :`;
    contexte.journal.slice(0, 5).forEach(note => {
      systemPrompt += `\n- ${note.date} : "${note.contenu}"`;
    });
  }

  // Objectifs
  if (contexte.objectifs && contexte.objectifs.length > 0) {
    const objectifActif = contexte.objectifs.find(o => o.actif);
    if (objectifActif && objectifActif.nombreMax) {
      systemPrompt += `\n\nOBJECTIF ACTUEL : Maximum ${objectifActif.nombreMax} cigarettes/jour`;
    }
  }

  if (contexte.cigaretteDiscutee) {
    const cig = contexte.cigaretteDiscutee;
    systemPrompt += `

CIGARETTE EN DISCUSSION :
- Numéro : #${cig.numero} à ${cig.heure}
- Lieu : ${cig.lieu}, Type : ${cig.type}
- Besoin : ${cig.besoin}/10, Satisfaction : ${cig.satisfaction}/10
- Score : ${cig.score}/30`;
  }

  systemPrompt += `

TU PEUX PARLER DE :
✅ TOUT ! Vie quotidienne, émotions, actualités, conseils, questions diverses...
✅ Réduction du tabac (envies, stress, motivation, Kudzu, techniques)
✅ Développement personnel, bien-être, santé
✅ Écouter et soutenir ${pseudo} dans ses moments difficiles
✅ Célébrer les victoires, encourager sans juger
✅ Référer aux notes du journal et aux commentaires des cigarettes pour des conseils personnalisés

IMPORTANT : Si ${pseudo} te parle d'autre chose que le tabac, réponds naturellement ! Tu es là pour elle sur tous les sujets. 🌟`;

  return systemPrompt;
}

export async function chat(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const body = await request.json() as ChatRequest;
    
    if (!body.message) {
      return {
        status: 400,
        jsonBody: { error: 'Message requis' }
      };
    }

    // Générer le system prompt
    const systemPrompt = generateSystemPrompt(body.contexte);

    // Préparer l'historique pour Gemini
    const conversationHistory = body.historique && Array.isArray(body.historique) 
      ? body.historique.slice(-10).filter(msg => msg.role === 'user' || msg.role === 'assistant')
      : [];

    // Appeler Gemini
    const response = await callAI(systemPrompt, conversationHistory, body.message);

    return { 
      status: 200,
      jsonBody: { response },
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    context.error('Erreur chat:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur serveur';
    return { 
      status: 500, 
      jsonBody: { error: errorMessage }
    };
  }
}

app.http('chat', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'chat',
  handler: chat
});
