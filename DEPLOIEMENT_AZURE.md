# Guide de déploiement Azure

## Prérequis

1. Azure CLI installé
2. Compte Azure actif
3. Node.js 20+ installé

## Étape 1: Se connecter à Azure

```powershell
az login
az account set --subscription "VOTRE_SUBSCRIPTION_ID"
```

## Étape 2: Créer un groupe de ressources

```powershell
az group create --name rg-suivi-tabac --location francecentral
```

## Étape 3: Déployer l'infrastructure

```powershell
az deployment group create `
  --resource-group rg-suivi-tabac `
  --template-file infra/main.bicep `
  --parameters appName=suivi-tabac environment=prod
```

## Étape 4: Installer les dépendances de l'API

```powershell
cd api
npm install
```

## Étape 5: Déployer l'Azure Function

```powershell
# Compiler le TypeScript
npm run build

# Récupérer le nom de la Function App
$functionAppName = az deployment group show `
  --resource-group rg-suivi-tabac `
  --name main `
  --query properties.outputs.functionAppName.value `
  --output tsv

# Déployer
func azure functionapp publish $functionAppName
```

## Étape 6: Builder le frontend

```powershell
cd ..
npm run build
```

## Étape 7: Déployer le Static Web App

```powershell
# Récupérer le nom du Static Web App
$staticWebAppName = az deployment group show `
  --resource-group rg-suivi-tabac `
  --name main `
  --query properties.outputs.staticWebAppName.value `
  --output tsv

# Obtenir le token de déploiement
$deploymentToken = az staticwebapp secrets list `
  --name $staticWebAppName `
  --query properties.apiKey `
  --output tsv

# Déployer (installer Azure Static Web Apps CLI si nécessaire: npm install -g @azure/static-web-apps-cli)
swa deploy ./dist `
  --deployment-token $deploymentToken `
  --app-location "/" `
  --output-location "dist"
```

## Étape 8: Mettre à jour la configuration frontend

Récupérer l'URL de l'API:

```powershell
$apiUrl = az deployment group show `
  --resource-group rg-suivi-tabac `
  --name main `
  --query properties.outputs.functionAppUrl.value `
  --output tsv

Write-Host "URL de l'API: $apiUrl"
```

Créer un fichier `.env.production`:

```
VITE_API_URL=https://votre-function-app.azurewebsites.net
```

## Vérification

1. Ouvrir l'URL du Static Web App
2. Tester l'ajout d'une journée
3. Vérifier que les données sont sauvegardées dans Cosmos DB

## Coûts estimés

- **Cosmos DB Serverless**: ~2-5€/mois (selon utilisation)
- **Azure Functions Consumption**: ~1-3€/mois
- **Static Web Apps Free**: 0€
- **Storage Account**: ~1€/mois

**Total: 4-9€/mois**

## Suppression des ressources

```powershell
az group delete --name rg-suivi-tabac --yes --no-wait
```
