import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { containers } from '../cosmosClient';

// GET /api/journal - Récupérer toutes les notes
export async function getJournalNotes(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const query = 'SELECT * FROM c ORDER BY c.date DESC';
    
    const { resources } = await containers.journalNotes.items.query(query).fetchAll();
    return { 
      status: 200,
      jsonBody: resources,
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    context.error('Erreur getJournalNotes:', error);
    return { 
      status: 500, 
      jsonBody: { error: 'Erreur serveur' }
    };
  }
}

// POST /api/journal - Créer une note
export async function createJournalNote(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const body = await request.json() as any;
    const note = {
      id: crypto.randomUUID(),
      date: body.date,
      contenu: body.contenu,
      createdAt: new Date().toISOString(),
      updatedAt: body.updatedAt || new Date().toISOString()
    };
    
    const { resource } = await containers.journalNotes.items.create(note);
    return { 
      status: 201,
      jsonBody: resource,
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    context.error('Erreur createJournalNote:', error);
    return { 
      status: 500, 
      jsonBody: { error: 'Erreur serveur' }
    };
  }
}

// GET /api/journal/{id} - Récupérer une note
export async function getJournalNote(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const id = request.params.id;
    const { resource } = await containers.journalNotes.item(id, id).read();
    
    if (!resource) {
      return { status: 404, jsonBody: { error: 'Note non trouvée' }};
    }
    
    return { 
      status: 200,
      jsonBody: resource,
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    context.error('Erreur getJournalNote:', error);
    return { 
      status: 500, 
      jsonBody: { error: 'Erreur serveur' }
    };
  }
}

// PUT /api/journal/{id} - Mettre à jour une note
export async function updateJournalNote(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const id = request.params.id;
    const body = await request.json() as any;
    
    const { resource: existing } = await containers.journalNotes.item(id, id).read();
    if (!existing) {
      return { status: 404, jsonBody: { error: 'Note non trouvée' }};
    }
    
    const updated = { 
      ...existing, 
      ...body, 
      id,
      updatedAt: new Date().toISOString()
    };
    const { resource } = await containers.journalNotes.item(id, id).replace(updated);
    
    return { 
      status: 200,
      jsonBody: resource,
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    context.error('Erreur updateJournalNote:', error);
    return { 
      status: 500, 
      jsonBody: { error: 'Erreur serveur' }
    };
  }
}

// DELETE /api/journal/{id} - Supprimer une note
export async function deleteJournalNote(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const id = request.params.id;
    await containers.journalNotes.item(id, id).delete();
    
    return { status: 204 };
  } catch (error) {
    context.error('Erreur deleteJournalNote:', error);
    return { 
      status: 500, 
      jsonBody: { error: 'Erreur serveur' }
    };
  }
}

// Enregistrer les routes
app.http('getJournalNotes', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'journal',
  handler: getJournalNotes
});

app.http('createJournalNote', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'journal',
  handler: createJournalNote
});

app.http('getJournalNote', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'journal/{id}',
  handler: getJournalNote
});

app.http('updateJournalNote', {
  methods: ['PUT'],
  authLevel: 'anonymous',
  route: 'journal/{id}',
  handler: updateJournalNote
});

app.http('deleteJournalNote', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'journal/{id}',
  handler: deleteJournalNote
});
