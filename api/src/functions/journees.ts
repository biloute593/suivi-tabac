import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { containers } from '../cosmosClient';

// GET /api/journees - Récupérer toutes les journées
export async function getJournees(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const { resources } = await containers.journees.items.readAll().fetchAll();
    return { 
      status: 200,
      jsonBody: resources,
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    context.error('Erreur getJournees:', error);
    return { 
      status: 500, 
      jsonBody: { error: 'Erreur serveur' }
    };
  }
}

// POST /api/journees - Créer une journée
export async function createJournee(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const body = await request.json() as any;
    const journee = {
      id: crypto.randomUUID(),
      ...body,
      createdAt: new Date().toISOString()
    };
    
    const { resource } = await containers.journees.items.create(journee);
    return { 
      status: 201,
      jsonBody: resource,
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    context.error('Erreur createJournee:', error);
    return { 
      status: 500, 
      jsonBody: { error: 'Erreur serveur' }
    };
  }
}

// GET /api/journees/{id} - Récupérer une journée
export async function getJournee(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const id = request.params.id;
    const { resource } = await containers.journees.item(id, id).read();
    
    if (!resource) {
      return { status: 404, jsonBody: { error: 'Journée non trouvée' }};
    }
    
    return { 
      status: 200,
      jsonBody: resource,
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    context.error('Erreur getJournee:', error);
    return { 
      status: 500, 
      jsonBody: { error: 'Erreur serveur' }
    };
  }
}

// PUT /api/journees/{id} - Mettre à jour une journée
export async function updateJournee(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const id = request.params.id;
    const body = await request.json() as any;
    
    const { resource: existing } = await containers.journees.item(id, id).read();
    if (!existing) {
      return { status: 404, jsonBody: { error: 'Journée non trouvée' }};
    }
    
    const updated = { ...existing, ...body, id };
    const { resource } = await containers.journees.item(id, id).replace(updated);
    
    return { 
      status: 200,
      jsonBody: resource,
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    context.error('Erreur updateJournee:', error);
    return { 
      status: 500, 
      jsonBody: { error: 'Erreur serveur' }
    };
  }
}

// DELETE /api/journees/{id} - Supprimer une journée
export async function deleteJournee(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const id = request.params.id;
    await containers.journees.item(id, id).delete();
    
    return { status: 204 };
  } catch (error) {
    context.error('Erreur deleteJournee:', error);
    return { 
      status: 500, 
      jsonBody: { error: 'Erreur serveur' }
    };
  }
}

// Enregistrer les routes
app.http('getJournees', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'journees',
  handler: getJournees
});

app.http('createJournee', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'journees',
  handler: createJournee
});

app.http('getJournee', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'journees/{id}',
  handler: getJournee
});

app.http('updateJournee', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'journees/{id}',
  handler: updateJournee
});

app.http('deleteJournee', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'journees/{id}',
  handler: deleteJournee
});
