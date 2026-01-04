import { CosmosClient } from '@azure/cosmos';

const endpoint = process.env.COSMOS_ENDPOINT!;
const key = process.env.COSMOS_KEY!;
const databaseId = 'SuiviTabacDB';

const client = new CosmosClient({ endpoint, key });
const database = client.database(databaseId);

export const containers = {
  users: database.container('users'),
  journees: database.container('journees'),
  cigarettes: database.container('cigarettes'),
  objectifs: database.container('objectifs'),
  profils: database.container('profils'),
  journalNotes: database.container('journalNotes')
};
