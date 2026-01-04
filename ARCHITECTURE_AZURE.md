# Architecture Azure - Suivi Tabac

## 📋 Vue d'ensemble

Application web progressive (PWA) de suivi de consommation de tabac avec backend Azure pour la synchronisation des données et l'authentification.

## 🏗️ Architecture proposée

### Frontend
- **React + TypeScript** : Application web progressive (PWA)
- **Azure Static Web Apps** : Hébergement du frontend avec CDN global
- **Dexie.js (IndexedDB)** : Cache local pour mode offline

### Backend
- **Azure Functions** (Consumption Plan) : API serverless pour les opérations CRUD
- **Azure Cosmos DB** (API NoSQL) : Base de données distribuée pour stockage des données
- **Azure Key Vault** : Gestion sécurisée des secrets et clés
- **Azure Application Insights** : Monitoring et analytics

### Authentification & Sécurité
- **Azure AD B2C** : Authentification des utilisateurs (optionnel pour application privée)
- **Managed Identity** : Authentification sécurisée entre services Azure
- **HTTPS Only** : Communication chiffrée
- **CORS** : Configuration restrictive

## 📊 Flux de données

```
┌─────────────────┐
│  React PWA      │
│  (Frontend)     │
│  - IndexedDB    │
│  - Service      │
│    Worker       │
└────────┬────────┘
         │
         │ HTTPS/REST
         │
┌────────▼────────┐
│ Azure Static    │
│ Web Apps        │
└────────┬────────┘
         │
         │ API Calls
         │
┌────────▼────────┐
│ Azure Functions │
│ - GET/POST/PUT  │
│ - DELETE        │
│ - Sync          │
└────────┬────────┘
         │
         │ Managed Identity
         │
┌────────▼────────┐
│ Azure Cosmos DB │
│ - journees      │
│ - cigarettes    │
│ - objectifs     │
└─────────────────┘
```

## 🗄️ Structure Cosmos DB

### Container: **journees**
```json
{
  "id": "string (GUID)",
  "userId": "string",
  "date": "string (yyyy-MM-dd)",
  "typeJournee": "travail | teletravail | weekend",
  "createdAt": "datetime",
  "partitionKey": "userId"
}
```

### Container: **cigarettes**
```json
{
  "id": "string (GUID)",
  "userId": "string",
  "journeeId": "string",
  "numero": "number",
  "heure": "string (HH:mm)",
  "lieu": "string",
  "type": "string",
  "besoin": "number (1-10)",
  "satisfaction": "number (1-10)",
  "quantite": "string",
  "situation": "string",
  "commentaire": "string",
  "kudzuPris": "boolean",
  "scoreCalcule": "number",
  "createdAt": "datetime",
  "partitionKey": "userId"
}
```

### Container: **objectifs**
```json
{
  "id": "string (GUID)",
  "userId": "string",
  "nombreMax": "number",
  "actif": "number (0|1)",
  "dateDebut": "string",
  "createdAt": "datetime",
  "partitionKey": "userId"
}
```

## 🔧 Azure Functions (API Endpoints)

### Journées
- `GET /api/journees` - Liste des journées de l'utilisateur
- `GET /api/journees/{date}` - Journée spécifique
- `POST /api/journees` - Créer une journée
- `PUT /api/journees/{id}` - Modifier une journée
- `DELETE /api/journees/{id}` - Supprimer une journée

### Cigarettes
- `GET /api/cigarettes` - Liste des cigarettes
- `GET /api/cigarettes/journee/{journeeId}` - Cigarettes d'une journée
- `POST /api/cigarettes` - Ajouter une cigarette
- `PUT /api/cigarettes/{id}` - Modifier une cigarette
- `DELETE /api/cigarettes/{id}` - Supprimer une cigarette

### Objectifs
- `GET /api/objectifs` - Objectifs de l'utilisateur
- `GET /api/objectifs/actif` - Objectif actif
- `POST /api/objectifs` - Créer un objectif
- `PUT /api/objectifs/{id}` - Modifier un objectif

### Synchronisation
- `POST /api/sync` - Synchroniser données locales → cloud
- `GET /api/sync` - Récupérer données cloud → local

### Export/Import
- `GET /api/export/csv` - Exporter toutes les données en CSV
- `POST /api/import/excel` - Importer depuis Excel

## 💰 Estimation des coûts (mensuel)

### Tier Gratuit (Développement/Usage personnel)
- **Azure Static Web Apps** : Gratuit (100 GB bandwidth)
- **Azure Functions** : Gratuit (1M exécutions/mois)
- **Azure Cosmos DB** : ~5-10€ (400 RU/s serverless)
- **Azure Key Vault** : ~1€ (secrets storage)
- **Application Insights** : Gratuit (1 GB/mois)

**Total estimé : ~6-11€/mois** pour usage personnel

### Production (Usage intensif)
- **Azure Static Web Apps** : 10€/mois (Standard)
- **Azure Functions** : 10-20€/mois (selon usage)
- **Azure Cosmos DB** : 25-50€/mois (provisioned throughput)
- **Azure Key Vault** : 5€/mois
- **Application Insights** : 10-20€/mois

**Total estimé : ~60-105€/mois** pour production

## 🔐 Sécurité & Meilleures pratiques

### Authentification
- Utilisation de **Managed Identity** entre les services Azure
- **Pas de credentials hardcodés** - tout dans Key Vault
- **HTTPS uniquement** avec certificat SSL automatique
- Support **CORS** restrictif (domaine spécifique uniquement)

### Données
- **Chiffrement au repos** : automatique dans Cosmos DB
- **Chiffrement en transit** : TLS 1.2+
- **Partition par userId** : isolation des données par utilisateur
- **Backup automatique** : Cosmos DB backup continu

### Monitoring
- **Application Insights** : traces, métriques, exceptions
- **Alertes** : en cas d'erreur ou de latence élevée
- **Logs** : rétention configurable

## 🚀 Déploiement

### Prérequis
```bash
# Installer Azure CLI
az --version

# Installer Azure Functions Core Tools
func --version

# Se connecter à Azure
az login
```

### Étapes de déploiement
1. **Créer les ressources Azure** via Bicep
2. **Déployer le backend** (Azure Functions)
3. **Déployer le frontend** (Azure Static Web Apps)
4. **Configurer les variables d'environnement**
5. **Tester l'application**

## 📝 Prochaines étapes

1. ✅ Créer les fichiers Bicep pour l'infrastructure
2. ✅ Implémenter les Azure Functions
3. ⏳ Adapter le frontend pour utiliser l'API
4. ⏳ Configurer le mode offline-first avec synchronisation
5. ⏳ Déployer sur Azure

## 🔗 Liens utiles

- [Azure Static Web Apps](https://docs.microsoft.com/azure/static-web-apps/)
- [Azure Functions](https://docs.microsoft.com/azure/azure-functions/)
- [Azure Cosmos DB](https://docs.microsoft.com/azure/cosmos-db/)
- [Azure Key Vault](https://docs.microsoft.com/azure/key-vault/)
- [Application Insights](https://docs.microsoft.com/azure/azure-monitor/app/app-insights-overview)
