# 🚀 Démarrage Rapide - Suivi Tabac

## Installation

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer le serveur de développement
npm run dev
```

L'application sera accessible sur **http://localhost:5173**

## Première Utilisation

### Étape 1 : Sélectionner le type de journée
Au premier lancement, vous devez choisir le type de journée :
- 🏢 **Travail** (au bureau)
- 🏠 **Télétravail** (depuis la maison)
- 🎉 **Week-end**

### Étape 2 : Définir votre objectif
1. Allez dans **⚙️ Réglages** (menu du bas)
2. Définissez votre objectif quotidien (ex: 12 cigarettes max)
3. Cliquez sur **Sauvegarder l'objectif**

### Étape 3 : Enregistrer votre première cigarette
1. Cliquez sur le gros bouton **➕ Ajouter** (au centre du menu)
2. Remplissez le formulaire :
   - ⏰ Heure (pré-remplie automatiquement)
   - 📍 Lieu : Choisissez parmi 🏠 🏢 🚶 🚗 🍽️ 👥
   - 🎭 Type : Besoin / Automatique / Plaisir
   - 📊 Besoin : Déplacez le slider (1-10)
   - 😊 Satisfaction : Déplacez le slider (1-10)
   - 🚬 Quantité : Entière / 3/4 / 1/2 / 1/4 / Quelques taffes
   - 💬 Situation : Sélectionnez dans la liste
   - ☑️ Kudzu pris (optionnel)
3. Le **score** est calculé automatiquement
4. Cliquez sur **Enregistrer**

### Étape 4 : Consulter vos statistiques
- **🏠 Accueil** : Vue d'ensemble du jour
- **📊 Analyses** : Graphiques et statistiques détaillées

## Import de Données Existantes

Si vous avez déjà un fichier Excel avec vos données :

1. Allez dans **⚙️ Réglages**
2. Cliquez sur **📤 Importer depuis Excel**
3. Sélectionnez votre fichier `.xlsx`
4. Vérifiez que les colonnes correspondent au format attendu
5. L'import se fait automatiquement !

### Format Excel attendu

Colonnes requises :
- **Date** : JJ/MM/AAAA (ex: 17/11/2025)
- **Type Journée** : travail / teletravail / weekend
- **Numéro** : 1, 2, 3...
- **Heure** : HH:MM (ex: 14:30)
- **Lieu** : maison / travail / exterieur / voiture / restaurant / chez_quelquun
- **Type cigarette** : besoin / automatique / plaisir
- **Besoin** : 1 à 10
- **Satisfaction** : 1 à 10
- **Quantité** : entiere / 3/4 / 1/2 / 1/4 / taffes
- **Situation** : apres_repas / pause / trajet / ennui / stress / social / attente / autre

## Astuces d'Utilisation

### 💡 Saisie Rapide
- L'heure est pré-remplie avec l'heure actuelle
- Les valeurs par défaut sont déjà sélectionnées
- Vous pouvez enregistrer une cigarette en moins de 30 secondes !

### 📊 Comprendre le Score
- **🔴 0-10** : À supprimer EN PRIORITÉ (cigarettes inutiles)
- **🟠 11-15** : À supprimer bientôt
- **🟡 16-20** : Cigarettes moyennes
- **🟢 21-25** : Cigarettes importantes
- **💚 26+** : Cigarettes à garder (pour l'instant)

Le but est de **supprimer progressivement les cigarettes à faible score** (automatiques, peu satisfaisantes).

### 🎯 Recommandations
- Consultez chaque jour la "**Cigarette à éviter aujourd'hui**" sur le Dashboard
- Explorez l'onglet "**À supprimer**" dans les Analyses
- Suivez les suggestions personnalisées pour chaque cigarette

### 📥 Sauvegarde
- Exportez régulièrement vos données en CSV depuis les Paramètres
- Les données sont stockées localement dans votre navigateur
- Aucune connexion internet requise

## Dépannage

### L'application ne charge pas
1. Vérifiez que le serveur de développement est lancé (`npm run dev`)
2. Ouvrez la console du navigateur (F12) pour voir les erreurs
3. Videz le cache du navigateur (Ctrl+Shift+R)

### Les données ne s'enregistrent pas
1. Vérifiez que votre navigateur supporte IndexedDB
2. Vérifiez que vous n'êtes pas en navigation privée
3. Consultez la console pour les erreurs JavaScript

### L'import Excel échoue
1. Vérifiez que votre fichier est bien au format `.xlsx`
2. Vérifiez que les noms des colonnes correspondent exactement
3. Vérifiez que les valeurs sont dans les formats attendus

## Build pour Production

```bash
# Construire l'application
npm run build

# Le dossier dist/ contiendra l'application prête pour la production
```

Vous pouvez ensuite déployer le contenu du dossier `dist/` sur n'importe quel serveur web statique.

## Support

Pour toute question ou problème :
1. Consultez le fichier `GUIDE_UTILISATEUR.md` pour plus de détails
2. Consultez le fichier `RECAPITULATIF.md` pour la documentation technique

---

**Bon courage dans votre parcours de réduction du tabagisme ! 🚭**
