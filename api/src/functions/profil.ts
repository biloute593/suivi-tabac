import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { containers } from '../cosmosClient';

// GET /api/profil - Récupérer le profil utilisateur (unique)
export async function getProfil(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const { resources } = await containers.profils.items.readAll().fetchAll();
    
    // Retourne le premier profil trouvé ou un objet vide (pas null pour éviter erreur JSON)
    const profil = resources.length > 0 ? resources[0] : { pseudo: '', createdAt: '' };
    
    return { 
      status: 200,
      jsonBody: profil,
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    context.error('Erreur getProfil:', error);
    return { 
      status: 500, 
      jsonBody: { error: 'Erreur serveur' }
    };
  }
}

// POST /api/profil - Créer le profil utilisateur
export async function createProfil(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const body = await request.json() as any;
    
    if (!body.pseudo || body.pseudo.trim().length === 0) {
      return {
        status: 400,
        jsonBody: { error: 'Le pseudo est requis' }
      };
    }
    
    // Vérifie si un profil existe déjà
    const { resources } = await containers.profils.items.readAll().fetchAll();
    if (resources.length > 0) {
      return {
        status: 409,
        jsonBody: { error: 'Un profil existe déjà. Utilisez PUT pour le modifier.' }
      };
    }
    
    const profil = {
      id: 'profil-unique',
      pseudo: body.pseudo.trim(),
      createdAt: new Date().toISOString()
    };
    
    const { resource } = await containers.profils.items.create(profil);
    return { 
      status: 201,
      jsonBody: resource,
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    context.error('Erreur createProfil:', error);
    return { 
      status: 500, 
      jsonBody: { error: 'Erreur serveur' }
    };
  }
}

// PUT /api/profil - Mettre à jour le profil utilisateur
export async function updateProfil(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const body = await request.json() as any;
    
    if (!body.pseudo || body.pseudo.trim().length === 0) {
      return {
        status: 400,
        jsonBody: { error: 'Le pseudo est requis' }
      };
    }
    
    // Récupère le profil existant
    const { resources } = await containers.profils.items.readAll().fetchAll();
    
    if (resources.length === 0) {
      return {
        status: 404,
        jsonBody: { error: 'Aucun profil trouvé. Créez-en un d\'abord.' }
      };
    }
    
    const profilExistant = resources[0];
    const profilMisAJour = {
      ...profilExistant,
      pseudo: body.pseudo.trim(),
      updatedAt: new Date().toISOString()
    };
    
    const { resource } = await containers.profils.items.upsert(profilMisAJour);
    return { 
      status: 200,
      jsonBody: resource,
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    context.error('Erreur updateProfil:', error);
    return { 
      status: 500, 
      jsonBody: { error: 'Erreur serveur' }
    };
  }
}

// Enregistrement des routes
app.http('getProfil', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'profil',
  handler: getProfil
});

app.http('createProfil', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'profil',
  handler: createProfil
});

app.http('updateProfil', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'profil',
  handler: updateProfil
});
