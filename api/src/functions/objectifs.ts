import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { containers } from '../cosmosClient';

// GET /api/objectifs - Récupérer tous les objectifs
export async function getObjectifs(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const { resources } = await containers.objectifs.items.readAll().fetchAll();
    return { 
      status: 200,
      jsonBody: resources,
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    context.error('Erreur getObjectifs:', error);
    return { 
      status: 500, 
      jsonBody: { error: 'Erreur serveur' }
    };
  }
}

// POST /api/objectifs - Créer un objectif
export async function createObjectif(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const body = await request.json() as any;
    const objectif = {
      id: crypto.randomUUID(),
      ...body,
      createdAt: new Date().toISOString()
    };
    
    const { resource } = await containers.objectifs.items.create(objectif);
    return { 
      status: 201,
      jsonBody: resource,
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    context.error('Erreur createObjectif:', error);
    return { 
      status: 500, 
      jsonBody: { error: 'Erreur serveur' }
    };
  }
}

// PUT /api/objectifs/{id} - Mettre à jour un objectif
export async function updateObjectif(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const id = request.params.id;
    const body = await request.json() as any;
    
    const { resource: existing } = await containers.objectifs.item(id, id).read();
    if (!existing) {
      return { status: 404, jsonBody: { error: 'Objectif non trouvé' }};
    }
    
    const updated = { ...existing, ...body, id };
    const { resource } = await containers.objectifs.item(id, id).replace(updated);
    
    return { 
      status: 200,
      jsonBody: resource,
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    context.error('Erreur updateObjectif:', error);
    return { 
      status: 500, 
      jsonBody: { error: 'Erreur serveur' }
    };
  }
}

// Enregistrer les routes
app.http('getObjectifs', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'objectifs',
  handler: getObjectifs
});

app.http('createObjectif', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'objectifs',
  handler: createObjectif
});

app.http('updateObjectif', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'objectifs/{id}',
  handler: updateObjectif
});
