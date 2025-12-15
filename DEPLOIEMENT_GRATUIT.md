# Déploiement GRATUIT sur Azure

## ✅ Ce qui est gratuit

- **Azure Static Web Apps (Free tier)** - Hébergement frontend
- **Azure Functions Consumption** - 1 million d'exécutions/mois gratuit
- **Cosmos DB Free tier** - 1000 RU/s + 25 GB gratuit

## 📋 Prérequis

1. **Azure CLI** installé
2. **Compte Azure** (gratuit)
3. **Node.js 20+** installé
4. **Azure Functions Core Tools** : `npm install -g azure-functions-core-tools@4`
5. **Static Web Apps CLI** : `npm install -g @azure/static-web-apps-cli`

## 🚀 Étape 1: Connexion Azure

```powershell
# Se connecter
az login

# Créer un groupe de ressources
az group create --name rg-suivi-tabac-free --location francecentral
```

## 🗄️ Étape 2: Créer Cosmos DB (Free Tier)

```powershell
# Créer le compte Cosmos DB avec Free Tier
az cosmosdb create `
  --name suivi-tabac-cosmos-free `
  --resource-group rg-suivi-tabac-free `
  --enable-free-tier true `
  --default-consistency-level Session `
  --locations regionName=francecentral failoverPriority=0 `
  --capabilities EnableServerless

# Créer la base de données
az cosmosdb sql database create `
  --account-name suivi-tabac-cosmos-free `
  --resource-group rg-suivi-tabac-free `
  --name SuiviTabacDB

# Créer les containers
az cosmosdb sql container create `
  --account-name suivi-tabac-cosmos-free `
  --resource-group rg-suivi-tabac-free `
  --database-name SuiviTabacDB `
  --name journees `
  --partition-key-path "/id"

az cosmosdb sql container create `
  --account-name suivi-tabac-cosmos-free `
  --resource-group rg-suivi-tabac-free `
  --database-name SuiviTabacDB `
  --name cigarettes `
  --partition-key-path "/id"

az cosmosdb sql container create `
  --account-name suivi-tabac-cosmos-free `
  --resource-group rg-suivi-tabac-free `
  --database-name SuiviTabacDB `
  --name objectifs `
  --partition-key-path "/id"

# Récupérer l'endpoint et la clé
az cosmosdb show `
  --name suivi-tabac-cosmos-free `
  --resource-group rg-suivi-tabac-free `
  --query documentEndpoint `
  --output tsv

az cosmosdb keys list `
  --name suivi-tabac-cosmos-free `
  --resource-group rg-suivi-tabac-free `
  --query primaryMasterKey `
  --output tsv
```

## ⚡ Étape 3: Créer et déployer Azure Functions

```powershell
cd api

# Installer les dépendances
npm install

# Créer un Storage Account (requis pour Functions)
az storage account create `
  --name suivitabacst `
  --resource-group rg-suivi-tabac-free `
  --location francecentral `
  --sku Standard_LRS

# Créer la Function App (Consumption Plan = GRATUIT)
az functionapp create `
  --name suivi-tabac-func-free `
  --resource-group rg-suivi-tabac-free `
  --consumption-plan-location francecentral `
  --runtime node `
  --runtime-version 20 `
  --functions-version 4 `
  --storage-account suivitabacst

# Configurer les variables d'environnement
az functionapp config appsettings set `
  --name suivi-tabac-func-free `
  --resource-group rg-suivi-tabac-free `
  --settings `
    COSMOS_ENDPOINT="<VOTRE_COSMOS_ENDPOINT>" `
    COSMOS_KEY="<VOTRE_COSMOS_KEY>"

# Configurer CORS
az functionapp cors add `
  --name suivi-tabac-func-free `
  --resource-group rg-suivi-tabac-free `
  --allowed-origins "*"

# Compiler TypeScript
npm run build

# Déployer
func azure functionapp publish suivi-tabac-func-free
```

## 🌐 Étape 4: Déployer Static Web App (GRATUIT)

```powershell
cd ..

# Mettre à jour l'URL de l'API dans .env.production
# Remplacer par: https://suivi-tabac-func-free.azurewebsites.net/api

# Builder le frontend
npm run build

# Créer la Static Web App
az staticwebapp create `
  --name suivi-tabac-web-free `
  --resource-group rg-suivi-tabac-free `
  --location francecentral `
  --sku Free

# Récupérer le token de déploiement
$deploymentToken = az staticwebapp secrets list `
  --name suivi-tabac-web-free `
  --query properties.apiKey `
  --output tsv

# Déployer
swa deploy ./dist `
  --deployment-token $deploymentToken `
  --app-location "/" `
  --output-location "dist"
```

## 🎯 Étape 5: Récupérer l'URL de l'application

```powershell
az staticwebapp show `
  --name suivi-tabac-web-free `
  --query defaultHostname `
  --output tsv
```

## 💰 Coût final

**0€/mois** tant que vous restez dans les limites gratuites :
- ✅ Static Web Apps Free: 100 GB bande passante/mois
- ✅ Functions: 1 million exécutions/mois
- ✅ Cosmos DB: 1000 RU/s + 25 GB stockage

## 🗑️ Supprimer les ressources

```powershell
az group delete --name rg-suivi-tabac-free --yes --no-wait
```

## 📝 Notes importantes

1. **Un seul Cosmos DB Free tier par compte Azure**
2. Les limites gratuites sont largement suffisantes pour un usage personnel
3. Vous recevrez des alertes si vous approchez des limites
