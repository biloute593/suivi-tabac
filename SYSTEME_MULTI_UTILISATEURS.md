# Système Multi-Utilisateurs - Suivi Tabac

## ✨ Fonctionnalités

### 🔐 Gestion des Profils
- **Création de profil** : Chaque utilisateur crée son propre profil avec un nom et un objectif personnalisé
- **Connexion simplifiée** : Liste des profils existants pour une connexion rapide
- **Isolation des données** : Chaque utilisateur voit uniquement ses propres données
- **Persistance locale** : Les profils sont stockés dans le localStorage du navigateur

### 📊 Données Privées
Chaque utilisateur a son propre espace privé contenant :
- Ses journées enregistrées
- Ses cigarettes fumées
- Ses objectifs
- Ses notes de journal
- Ses statistiques personnelles

### 🏆 Mur Public (Optionnel)
- **Partage volontaire** : L'utilisateur peut activer/désactiver le partage public dans son profil
- **Classement communautaire** : Voir les performances des autres utilisateurs qui partagent leurs données
- **Critère de classement** : Moyenne de cigarettes par jour (du plus bas au plus haut)
- **Anonymat** : Seul le nom du profil est affiché (pas d'informations personnelles)

## 🛠️ Architecture Technique

### Structure des Données

Chaque entité contient maintenant un champ `userId` :

```typescript
interface Journee {
  id?: string;
  userId: string; // Identifiant unique de l'utilisateur
  date: string;
  typeJournee: TypeJournee;
  objectifNombreMax?: number;
  createdAt: string;
}

interface Cigarette {
  id?: string;
  userId: string; // Identifiant unique de l'utilisateur
  journeeId: string;
  // ... autres champs
}
```

### Filtrage Automatique

Le système de base de données filtre automatiquement les données par `userId` :

```typescript
// Récupération automatique des données de l'utilisateur courant
const journees = await db.journees.toArray(); // Retourne uniquement les journées de l'utilisateur connecté
```

### Contexte Utilisateur

Le fichier `utils/userContext.ts` gère :
- Récupération de l'utilisateur courant
- Sauvegarde/suppression du profil actif
- Génération d'ID utilisateur unique

## 📱 Utilisation

### 1. Première Connexion
1. Ouvrir l'application
2. Cliquer sur "Créer un nouveau profil"
3. Entrer votre nom (ex: "Lydie")
4. Définir votre objectif quotidien (ex: 12 cigarettes)
5. Activer/désactiver le partage public
6. Valider

### 2. Utilisation Quotidienne
- Toutes vos données sont automatiquement liées à votre profil
- Personne d'autre ne peut voir vos données privées
- Vous pouvez vous déconnecter à tout moment depuis l'onglet "Profil"

### 3. Connexion avec un Profil Existant
- Sur l'écran d'accueil, sélectionner votre profil dans la liste
- Vos données seront instantanément chargées

### 4. Partage Public (Optionnel)
1. Aller dans l'onglet "Profil"
2. Activer le toggle "Partage public"
3. Vos performances apparaîtront dans le "Mur Public"
4. Désactivable à tout moment

## 🔒 Sécurité & Confidentialité

- ✅ Isolation complète des données entre utilisateurs
- ✅ Aucune donnée partagée sans consentement explicite
- ✅ Stockage local (pas de serveur externe pour les profils)
- ✅ Déconnexion sécurisée
- ✅ Pas d'accès croisé entre profils

## 🚀 Migration des Données Existantes

**Important** : Les données créées avant l'implémentation du système multi-utilisateurs n'ont pas de `userId`.

Pour migrer automatiquement ces données :
1. À la première connexion, l'application créera un profil "Utilisateur par défaut"
2. Toutes les données existantes seront automatiquement associées à ce profil
3. Vous pourrez ensuite créer d'autres profils si nécessaire

## 🎯 Cas d'Usage

### Scénario 1 : Usage Personnel
**Lydie** utilise l'application sur son téléphone :
- Elle crée son profil "Lydie"
- Toutes ses données restent privées
- Elle suit son évolution personnelle

### Scénario 2 : Usage Familial
**Plusieurs personnes sur le même appareil** :
- Lydie crée son profil "Lydie"
- Son conjoint crée "Marc"
- Leurs enfants créent "Sophie" et "Thomas"
- Chacun voit uniquement ses propres statistiques
- Les données ne se mélangent jamais

### Scénario 3 : Motivation Communautaire
**Groupe de soutien** :
- Chaque membre crée son profil
- Ils activent le partage public
- Ils se motivent mutuellement via le mur public
- Les meilleurs progrès sont mis en avant
- Tout le monde garde ses données détaillées privées

## 📋 TODO Futurs

- [ ] Synchronisation cloud des profils (Azure Cosmos DB)
- [ ] Système de challenges entre utilisateurs
- [ ] Exportation/importation de profil
- [ ] Badges de réussite communautaires
- [ ] Messages de support entre utilisateurs (optionnel)
