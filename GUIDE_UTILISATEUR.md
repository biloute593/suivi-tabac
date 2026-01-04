# 🚭 Suivi Tabac - Application de Réduction du Tabagisme

Application web progressive (PWA) pour suivre et réduire intelligemment votre consommation de cigarettes.

## ✨ Fonctionnalités

### 📝 Saisie Quotidienne
- **Sélection du type de journée** : Travail, Télétravail, Week-end
- **Enregistrement rapide** de chaque cigarette (< 30 secondes)
- **Informations complètes** : heure, lieu, type, intensité du besoin, satisfaction, quantité fumée
- **Score automatique** pour chaque cigarette

### 📊 Analyses Intelligentes
- **Évolution sur 7 jours** : graphique de progression
- **Analyse par type de journée** : comparez travail vs télétravail vs week-end
- **Analyse par lieu** : identifiez où vous fumez le plus
- **Analyse par horaire** : découvrez vos pics de consommation
- **Top cigarettes à supprimer** : recommandations personnalisées

### 🎯 Recommandations Personnalisées
- **Identification automatique** des cigarettes "inutiles" (score faible)
- **Suggestions concrètes** pour remplacer chaque cigarette
- **Cigarette du jour à éviter** : focus quotidien
- **Impact estimé** de la suppression

### 📱 Progressive Web App
- **Fonctionne hors ligne** : données stockées localement
- **Installable** sur mobile et desktop
- **Rapide et réactive** : expérience native
- **Sécurisé** : vos données restent privées

### 📥 Import/Export
- **Import Excel** : migrez vos données historiques
- **Export CSV** : analysez dans un tableur
- **Sauvegarde** : exportez régulièrement vos données

## 🚀 Installation

### Prérequis
- Node.js 18+ 
- npm ou yarn

### Installation des dépendances
```bash
npm install
```

### Lancement en développement
```bash
npm run dev
```

L'application sera disponible sur `http://localhost:5173`

### Build pour production
```bash
npm run build
```

### Prévisualisation du build
```bash
npm run preview
```

## 🛠️ Technologies Utilisées

- **React 19** : Framework UI moderne
- **TypeScript** : Typage statique pour plus de robustesse
- **Vite** : Build tool ultra-rapide
- **TailwindCSS** : Framework CSS utilitaire
- **Dexie.js** : Wrapper IndexedDB pour stockage local
- **Chart.js** : Graphiques interactifs
- **date-fns** : Manipulation des dates
- **Lucide React** : Icônes modernes
- **XLSX** : Import/export Excel

## 📖 Guide d'utilisation

### Premier lancement
1. Sélectionnez le type de journée (Travail/Télétravail/Week-end)
2. Définissez votre objectif quotidien dans les Paramètres
3. Enregistrez chaque cigarette au fur et à mesure

### Enregistrer une cigarette
1. Cliquez sur le bouton **+ Ajouter**
2. Remplissez les informations :
   - Heure (pré-remplie automatiquement)
   - Lieu (icônes rapides)
   - Type : Besoin / Automatique / Plaisir
   - Intensité du besoin (1-10)
   - Satisfaction ressentie (1-10)
   - Quantité fumée
   - Situation
3. Ajoutez un commentaire (optionnel)
4. Cochez "Kudzu pris" si applicable
5. Enregistrez

Le score est calculé automatiquement et vous indique l'importance de cette cigarette.

### Comprendre le score

**Formule** : `Score = (Besoin × 2) + Satisfaction + Bonus Type × Facteur Quantité`

**Interprétation** :
- 🔴 **0-10** : À supprimer EN PRIORITÉ
- 🟠 **11-15** : À supprimer bientôt
- 🟡 **16-20** : Cigarette moyenne
- 🟢 **21-25** : Cigarette importante
- 💚 **26+** : Cigarette à garder (pour l'instant)

### Analyser vos données
1. Allez dans l'onglet **Analyses**
2. Explorez les différentes vues :
   - **Vue d'ensemble** : évolution et répartition
   - **Par type de journée** : comparaison travail/télétravail/week-end
   - **Par lieu** : où fumez-vous le plus ?
   - **Par horaire** : quels sont vos pics ?
   - **À supprimer** : top 10 des cigarettes à supprimer

### Importer vos données Excel
1. Allez dans **Paramètres**
2. Cliquez sur **Importer depuis Excel**
3. Sélectionnez votre fichier `.xlsx`
4. Vérifiez que le format correspond aux colonnes attendues

**Colonnes requises** :
- Date (JJ/MM/AAAA ou AAAA-MM-JJ)
- Type Journée (travail/teletravail/weekend)
- Numéro (1, 2, 3...)
- Heure (HH:MM)
- Lieu (maison/travail/exterieur/voiture/restaurant/chez_quelquun)
- Type cigarette (besoin/automatique/plaisir)
- Besoin (1-10)
- Satisfaction (1-10)
- Quantité (entiere/3/4/1/2/1/4/taffes)
- Situation (apres_repas/pause/trajet/ennui/stress/social/attente/autre)

## 🔐 Confidentialité

- **Toutes les données sont stockées localement** dans votre navigateur (IndexedDB)
- **Aucune donnée n'est envoyée sur internet**
- **Vous êtes le seul propriétaire** de vos données
- **Export possible** à tout moment pour backup

## 🎯 Objectif

L'application vous aide à :
1. **Prendre conscience** de votre consommation réelle
2. **Identifier** les cigarettes "inutiles" (automatiques, faible satisfaction)
3. **Réduire progressivement** en supprimant d'abord les moins importantes
4. **Mesurer vos progrès** avec des statistiques claires
5. **Rester motivé** avec des recommandations personnalisées

## 📝 Licence

Ce projet est privé et personnel.

## 👥 Support

Pour toute question ou suggestion, n'hésitez pas à ouvrir une issue.

---

**Rappel** : Cette application est un outil d'aide. Pour un accompagnement complet, consultez un professionnel de santé spécialisé dans le sevrage tabagique.
