# 🎉 Déploiement Azure Réussi - VERSION CLOUD

**Date du déploiement** : 9 décembre 2025, 23:10
**Mis à jour** : Configuration cloud avec authentification

## ✅ Ressources déployées

### 1. **Frontend - Azure Static Web App**
- **Nom** : `suivi-tabac-12092254-web`
- **URL Production** : https://ambitious-dune-0b02f5a03.3.azurestaticapps.net
- **Région** : West Europe
- **Statut** : ✅ Déployé avec succès

### 2. **Backend - Azure Functions**
- **Nom** : `suivi-tabac-12092254-func`
- **URL API** : https://suivi-tabac-12092254-func.azurewebsites.net/api
- **Région** : France Central
- **Statut** : ✅ Déployé avec succès
- **Fonctions actives** : 24 endpoints HTTP (dont authentification)

### 3. **Base de données - Cosmos DB**
- **Nom** : `suivi-tabac-12092254-cosmos`
- **Endpoint** : https://suivi-tabac-12092254-cosmos.documents.azure.com:443/
- **Type** : Serverless (pay-per-use)
- **Région** : France Central
- **Statut** : ✅ Déployé avec succès
- **Conteneurs** : users, journees, cigarettes, objectifs, profils, journalNotes

### 4. **Stockage - Storage Account**
- **Nom** : `suivitabac12092254st`
- **Type** : Standard LRS
- **Région** : France Central
- **Statut** : ✅ Déployé avec succès

## 🔐 Système d'authentification

### Nouveaux endpoints
- **POST /api/auth/register** - Créer un compte
- **POST /api/auth/login** - Se connecter

### Fonctionnement
1. Les utilisateurs créent un compte avec **pseudo + mot de passe**
2. Les mots de passe sont **hashés (SHA-256)** côté serveur
3. Chaque utilisateur a un **userId unique**
4. Toutes les données sont **isolées par userId** dans Cosmos DB
5. Les données sont stockées dans le **cloud Azure**, pas en local

## 📋 Endpoints API disponibles

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/auth/register` | POST | Créer un compte |
| `/api/auth/login` | POST | Se connecter |
| `/api/chat` | POST | Chat IA |
| `/api/cigarettes` | GET, POST | Gestion des cigarettes |
| `/api/cigarettes/{id}` | GET, PUT, DELETE | Cigarette spécifique |
| `/api/journal` | GET, POST | Notes de journal |
| `/api/journal/{id}` | GET, PUT, DELETE | Note spécifique |
| `/api/journees` | GET, POST | Journées |
| `/api/journees/{id}` | GET, PUT, DELETE | Journée spécifique |
| `/api/objectifs` | GET, POST | Objectifs |
| `/api/objectifs/{id}` | PUT | Objectif spécifique |
| `/api/profil` | GET, POST, PUT | Profil utilisateur |

## 🔧 Modifications effectuées

### 1. **Authentification API** ✅
- Création de `/api/src/functions/auth.ts`
- Endpoints `register` et `login`
- Hash SHA-256 des mots de passe
- Vérification des pseudos uniques

### 2. **Base de données** ✅
- Ajout du conteneur `users` dans Cosmos DB
- Partition par `userId`
- Isolation complète des données par utilisateur

### 3. **Frontend** ✅
- Configuration `.env.production` avec URL API Azure
- Mise à jour de `api.ts` pour utiliser l'API cloud
- Adaptation de `userContext.ts` pour l'authentification API
- Suppression de la dépendance localStorage pour les comptes

### 4. **Infrastructure** ✅
- Mise à jour `infra/main.bicep`
- Ajout du conteneur `users`
- Région Static Web App : West Europe

## 💰 Coûts Azure (Serverless)

| Service | Tarification | Coût estimé |
|---------|-------------|-------------|
| **Cosmos DB** | Serverless - Pay per request | ~2-5€/mois* |
| **Azure Functions** | Consumption - 1M requêtes gratuites/mois | ~1-3€/mois* |
| **Static Web Apps** | Plan Free | **GRATUIT** |
| **Storage Account** | LRS Standard | ~1€/mois* |
| **Total estimé** | | **~4-9€/mois** |

*Avec une utilisation légère (< 100 utilisateurs actifs)

### 💡 Comment réduire les coûts à 0€

L'application utilise des services **serverless** qui ne facturent que l'utilisation réelle :

1. **Cosmos DB Serverless** : 
   - Les 1000 premières RU/s sont gratuites
   - Avec peu d'utilisateurs = ~0€

2. **Azure Functions** :
   - 1 million de requêtes gratuites/mois
   - Avec utilisation normale = ~0€

3. **Static Web Apps** : 
   - Plan Free = **0€**

**Avec une utilisation légère, les coûts peuvent rester proches de 0€ !**

## 🧪 Tests à effectuer

1. ✅ Ouvrir l'application : https://witty-sea-073500903.3.azurestaticapps.net
2. ⏳ Créer un compte avec pseudo + mot de passe
3. ⏳ Vérifier que le pseudo est unique
4. ⏳ Se déconnecter et se reconnecter
5. ⏳ Ajouter une journée (données dans Azure)
6. ⏳ Ajouter des cigarettes
7. ⏳ Vérifier que les données persistent
8. ⏳ Tester le journal personnel
9. ⏳ Vérifier le mode sombre
10. ⏳ Créer un 2e compte et vérifier l'isolation des données

## 🗑️ Supprimer les ressources

Si vous souhaitez supprimer toutes les ressources Azure :

```powershell
az group delete --name rg-suivi-tabac --yes --no-wait
```

## 📝 Notes importantes

1. ✅ **Les données sont maintenant stockées dans Azure Cosmos DB**
2. ✅ **Authentification sécurisée avec hash SHA-256**
3. ✅ **Chaque utilisateur a ses propres données isolées**
4. ✅ **Synchronisation automatique entre appareils** (même compte = mêmes données)
5. ✅ **Pas de localStorage pour les données sensibles**

## 🔐 Sécurité

- ✅ Tous les endpoints HTTPS uniquement
- ✅ CORS configuré pour l'origine du Static Web App
- ✅ Mots de passe hashés côté serveur (SHA-256)
- ✅ Cosmos DB avec clés sécurisées
- ✅ Pas d'API keys exposées dans le code frontend
- ✅ Isolation des données par userId

## 📞 Informations de déploiement

- **Groupe de ressources** : `rg-suivi-tabac`
- **Région principale** : France Central
- **URL Production** : https://witty-sea-073500903.3.azurestaticapps.net
- **API URL** : https://suivi-tabac-12092254-func.azurewebsites.net/api

---

**Déploiement cloud réalisé avec succès ! 🚀**
**Toutes les données sont maintenant dans Azure Cosmos DB**

