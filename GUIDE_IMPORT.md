# 📥 Guide d'Import du Fichier Tabac.xlsx

## 🎯 Objectif

Importer toutes vos données historiques du fichier **Tabac.xlsx** dans l'application web.

## 📋 Étapes d'Import

### Étape 1 : Préparer le fichier Excel

1. Ouvrez votre fichier `Tabac.xlsx`
2. Vérifiez qu'il contient les colonnes suivantes (l'ordre n'est pas important) :
   - Date
   - Type Journée (ou Type)
   - Numéro (ou N°)
   - Heure
   - Lieu
   - Type cigarette (ou Type)
   - Besoin
   - Satisfaction
   - Quantité
   - Situation
   - Commentaire (optionnel)
   - Kudzu (optionnel)

### Étape 2 : Vérifier les formats

#### Date
✅ Formats acceptés :
- `17/11/2025`
- `2025-11-17`
- `17-11-2025`

#### Type Journée
✅ Valeurs acceptées :
- `travail` ou `Travail` ou `TRAVAIL`
- `teletravail` ou `télétravail` ou `Télétravail`
- `weekend` ou `week-end` ou `Weekend`

#### Heure
✅ Format : `HH:MM`
- Exemples : `14:30`, `07:15`, `22:00`

#### Lieu
✅ Valeurs acceptées :
- `maison` (ou `home`)
- `travail` (ou `bureau`)
- `exterieur` (ou `dehors`, `ext`)
- `voiture` (ou `car`)
- `restaurant` (ou `bar`)
- `chez_quelquun` (ou `chez quelqu'un`)

#### Type cigarette
✅ Valeurs acceptées :
- `besoin` (ou `need`)
- `automatique` (ou `automatic`)
- `plaisir` (ou `pleasure`)

#### Besoin & Satisfaction
✅ Nombres de **1 à 10**

#### Quantité
✅ Valeurs acceptées :
- `entiere` (ou `entière`, `1`)
- `3/4`
- `1/2` (ou `moitié`)
- `1/4` (ou `quart`)
- `taffes` (ou `quelques taffes`)

#### Situation
✅ Valeurs acceptées :
- `apres_repas` (ou `après repas`, `meal`)
- `pause` (ou `break`)
- `trajet` (ou `commute`)
- `ennui` (ou `bored`)
- `stress`
- `social`
- `attente` (ou `wait`)
- `autre` (ou `other`)

### Étape 3 : Importer dans l'application

1. **Lancez l'application**
   ```bash
   npm run dev
   ```
   Ouvrez http://localhost:5173

2. **Allez dans les Paramètres**
   - Cliquez sur l'onglet **⚙️ Réglages** en bas de l'écran

3. **Cliquez sur "Importer depuis Excel"**
   - Un nouvel écran s'affiche

4. **Sélectionnez votre fichier**
   - Cliquez sur **"Sélectionner un fichier Excel"**
   - Choisissez `Tabac.xlsx`

5. **L'import démarre automatiquement**
   - Une barre de progression s'affiche
   - Attendez quelques secondes

6. **Vérification**
   - Un message de succès s'affiche : "✅ Import réussi !"
   - Exemple : "82 journées et 847 cigarettes importées"

7. **Retour aux Paramètres**
   - Cliquez sur "← Retour aux paramètres"

8. **Consultez vos données**
   - Allez dans **🏠 Accueil** pour voir le dashboard
   - Allez dans **📊 Analyses** pour voir toutes vos statistiques !

## 🔧 Normalisation Automatique

L'application normalise automatiquement les données pour gérer les variations :

### Exemples de normalisation

| Votre valeur | Normalisée en |
|--------------|---------------|
| `17/11/2025` | `2025-11-17` |
| `Télétravail` | `teletravail` |
| `14h30` | `14:30` |
| `Bureau` | `travail` |
| `Need` | `besoin` |
| `Moitié` | `1/2` |
| `Après repas` | `apres_repas` |

## ⚠️ Problèmes Courants

### ❌ "Erreur lors de l'import"

**Causes possibles :**
1. Le fichier n'est pas au format `.xlsx`
2. Les colonnes ont des noms différents
3. Certaines valeurs sont dans un format non reconnu

**Solutions :**
1. Vérifiez que le fichier est bien `.xlsx` (pas `.xls` ou `.csv`)
2. Renommez les colonnes pour qu'elles correspondent exactement aux noms attendus
3. Corrigez les valeurs qui ne sont pas dans les formats acceptés

### ❌ "Certaines lignes sont ignorées"

**Cause :** Données manquantes ou invalides sur certaines lignes

**Solution :**
1. Ouvrez le fichier Excel
2. Vérifiez que toutes les lignes ont au minimum :
   - Une date valide
   - Un numéro
   - Une heure
3. Complétez ou supprimez les lignes incomplètes

### ❌ "Les dates ne sont pas reconnues"

**Solution :**
1. Formatez la colonne Date en `JJ/MM/AAAA`
2. Ou utilisez le format `AAAA-MM-JJ`
3. Assurez-vous qu'il n'y a pas de texte dans la colonne Date

## 📝 Exemple de Fichier Excel Valide

```
| Date       | Type Journée | Numéro | Heure | Lieu    | Type cigarette | Besoin | Satisfaction | Quantité | Situation    | Commentaire | Kudzu |
|------------|--------------|--------|-------|---------|----------------|--------|--------------|----------|--------------|-------------|-------|
| 10/11/2025 | travail      | 1      | 07:30 | maison  | automatique    | 3      | 4            | 3/4      | pause        |             | Non   |
| 10/11/2025 | travail      | 2      | 09:45 | travail | besoin         | 6      | 7            | entiere  | pause        | Stressée    | Oui   |
| 10/11/2025 | travail      | 3      | 12:45 | restaurant | plaisir     | 5      | 8            | entiere  | apres_repas  |             | Non   |
```

## ✅ Vérification Après Import

1. **Allez dans Paramètres**
   - Vérifiez les statistiques :
     - Nombre de journées
     - Nombre de cigarettes
     - Nombre d'objectifs

2. **Allez dans Analyses**
   - Onglet "Vue d'ensemble" : Graphique d'évolution
   - Vérifiez que les données sont cohérentes

3. **Allez dans Accueil**
   - Si aujourd'hui a des données, elles doivent s'afficher

## 🎯 Conseils

### Avant l'import
- ✅ Faites une copie de sauvegarde de votre fichier Excel
- ✅ Nettoyez les données (supprimez les lignes vides)
- ✅ Vérifiez les formats (dates, heures)
- ✅ Uniformisez les valeurs (tout en minuscules si possible)

### Après l'import
- ✅ Vérifiez que le nombre de cigarettes est correct
- ✅ Consultez les analyses pour détecter d'éventuelles anomalies
- ✅ Exportez immédiatement vos données en CSV (backup)

## 🚀 Import Réussi !

Une fois l'import terminé, vous aurez :
- ✅ Toutes vos données historiques dans l'application
- ✅ Des graphiques d'évolution complets
- ✅ Des analyses détaillées
- ✅ Des recommandations personnalisées basées sur votre historique

**Vous pouvez maintenant utiliser pleinement l'application pour suivre et réduire votre consommation ! 🚭**

---

## 📞 Besoin d'Aide ?

Si l'import échoue malgré ces instructions :
1. Ouvrez la console du navigateur (F12)
2. Regardez les erreurs affichées
3. Vérifiez le fichier `Tabac.xlsx` ligne par ligne
4. Essayez d'importer avec un fichier de test contenant seulement quelques lignes

---

📅 Date : 17 novembre 2025
✍️ Guide créé pour l'import de Tabac.xlsx
