import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { containers } from '../cosmosClient';
import * as crypto from 'crypto';

// Types
interface UserAccount {
  id: string;
  userId: string;
  pseudo: string;
  passwordHash: string;
  objectifGlobal: number;
  sharePublic: boolean;
  createdAt: string;
}

interface LoginRequest {
  pseudo: string;
  password: string;
}

interface RegisterRequest {
  pseudo: string;
  password: string;
  objectifGlobal?: number;
}

// Hash du mot de passe
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// POST /api/auth/register - Créer un compte
export async function register(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const body = await request.json() as RegisterRequest;
    
    if (!body.pseudo || body.pseudo.trim().length < 3) {
      return {
        status: 400,
        jsonBody: { error: 'Le pseudo doit contenir au moins 3 caractères' }
      };
    }

    if (!body.password || body.password.length < 6) {
      return {
        status: 400,
        jsonBody: { error: 'Le mot de passe doit contenir au moins 6 caractères' }
      };
    }

    // Vérifier si le pseudo existe déjà
    const querySpec = {
      query: 'SELECT * FROM c WHERE LOWER(c.pseudo) = LOWER(@pseudo)',
      parameters: [{ name: '@pseudo', value: body.pseudo.trim() }]
    };

    const { resources: existingUsers } = await containers.users.items
      .query(querySpec)
      .fetchAll();

    if (existingUsers.length > 0) {
      return {
        status: 409,
        jsonBody: { error: 'Ce pseudo est déjà utilisé' }
      };
    }

    // Créer le compte
    const userId = `user_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const newUser: UserAccount = {
      id: userId,
      userId: userId,
      pseudo: body.pseudo.trim(),
      passwordHash: hashPassword(body.password),
      objectifGlobal: body.objectifGlobal || 12,
      sharePublic: false,
      createdAt: new Date().toISOString()
    };

    await containers.users.items.create(newUser);

    // Retourner les infos (sans le hash du mot de passe)
    const { passwordHash, ...userInfo } = newUser;
    
    return {
      status: 201,
      jsonBody: userInfo,
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    context.error('Erreur register:', error);
    return {
      status: 500,
      jsonBody: { error: 'Erreur serveur' }
    };
  }
}

// POST /api/auth/login - Connexion
export async function login(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const body = await request.json() as LoginRequest;
    
    if (!body.pseudo || !body.password) {
      return {
        status: 400,
        jsonBody: { error: 'Pseudo et mot de passe requis' }
      };
    }

    // Rechercher l'utilisateur
    const querySpec = {
      query: 'SELECT * FROM c WHERE LOWER(c.pseudo) = LOWER(@pseudo)',
      parameters: [{ name: '@pseudo', value: body.pseudo.trim() }]
    };

    const { resources: users } = await containers.users.items
      .query(querySpec)
      .fetchAll();

    if (users.length === 0) {
      return {
        status: 401,
        jsonBody: { error: 'Pseudo ou mot de passe incorrect' }
      };
    }

    const user = users[0] as UserAccount;
    const passwordHash = hashPassword(body.password);

    if (user.passwordHash !== passwordHash) {
      return {
        status: 401,
        jsonBody: { error: 'Pseudo ou mot de passe incorrect' }
      };
    }

    // Connexion réussie
    const { passwordHash: _, ...userInfo } = user;
    
    return {
      status: 200,
      jsonBody: userInfo,
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    context.error('Erreur login:', error);
    return {
      status: 500,
      jsonBody: { error: 'Erreur serveur' }
    };
  }
}

// Enregistrer les fonctions
app.http('register', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/register',
  handler: register
});

app.http('login', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/login',
  handler: login
});
