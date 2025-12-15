import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { containers } from '../cosmosClient';

// GET /api/cigarettes - Récupérer toutes les cigarettes
export async function getCigarettes(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const journeeId = request.query.get('journeeId');
    
    let query = 'SELECT * FROM c';
    if (journeeId) {
      query += ` WHERE c.journeeId = "${journeeId}"`;
    }
    query += ' ORDER BY c.heure';
    
    const { resources } = await containers.cigarettes.items.query(query).fetchAll();
    return { 
      status: 200,
      jsonBody: resources,
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    context.error('Erreur getCigarettes:', error);
    return { 
      status: 500, 
      jsonBody: { error: 'Erreur serveur' }
    };
  }
}

// POST /api/cigarettes - Créer une cigarette
export async function createCigarette(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const body = await request.json() as any;
    const cigarette = {
      id: crypto.randomUUID(),
      ...body,
      createdAt: new Date().toISOString()
    };
    
    const { resource } = await containers.cigarettes.items.create(cigarette);
    return { 
      status: 201,
      jsonBody: resource,
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    context.error('Erreur createCigarette:', error);
    return { 
      status: 500, 
      jsonBody: { error: 'Erreur serveur' }
    };
  }
}

// GET /api/cigarettes/{id} - Récupérer une cigarette
export async function getCigarette(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const id = request.params.id;
    const { resource } = await containers.cigarettes.item(id, id).read();
    
    if (!resource) {
      return { status: 404, jsonBody: { error: 'Cigarette non trouvée' }};
    }
    
    return { 
      status: 200,
      jsonBody: resource,
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    context.error('Erreur getCigarette:', error);
    return { 
      status: 500, 
      jsonBody: { error: 'Erreur serveur' }
    };
  }
}

// PUT /api/cigarettes/{id} - Mettre à jour une cigarette
export async function updateCigarette(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const id = request.params.id;
    const body = await request.json() as any;
    
    const { resource: existing } = await containers.cigarettes.item(id, id).read();
    if (!existing) {
      return { status: 404, jsonBody: { error: 'Cigarette non trouvée' }};
    }
    
    const updated = { ...existing, ...body, id };
    const { resource } = await containers.cigarettes.item(id, id).replace(updated);
    
    return { 
      status: 200,
      jsonBody: resource,
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    context.error('Erreur updateCigarette:', error);
    return { 
      status: 500, 
      jsonBody: { error: 'Erreur serveur' }
    };
  }
}

// DELETE /api/cigarettes/{id} - Supprimer une cigarette
export async function deleteCigarette(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const id = request.params.id;
    await containers.cigarettes.item(id, id).delete();
    
    return { status: 204 };
  } catch (error) {
    context.error('Erreur deleteCigarette:', error);
    return { 
      status: 500, 
      jsonBody: { error: 'Erreur serveur' }
    };
  }
}

// Enregistrer les routes
app.http('getCigarettes', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'cigarettes',
  handler: getCigarettes
});

app.http('createCigarette', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'cigarettes',
  handler: createCigarette
});

app.http('getCigarette', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'cigarettes/{id}',
  handler: getCigarette
});

app.http('updateCigarette', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'cigarettes/{id}',
  handler: updateCigarette
});

app.http('deleteCigarette', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'cigarettes/{id}',
  handler: deleteCigarette
});
