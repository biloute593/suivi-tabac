# 📋 MIGRATION DES DONNÉES DÉCEMBRE - INSTRUCTIONS

## ⚠️ PROBLÈME IDENTIFIÉ

Les données du **1er au 11 décembre 2025** ne sont **PAS dans Supabase**.

Elles sont dans le **localStorage/IndexedDB de votre navigateur**.

---

## 🔍 OÙ SONT VOS DONNÉES ?

Les données peuvent être :
1. **Dans IndexedDB du navigateur** (si vous avez utilisé l'app localement)
2. **Sur un autre appareil** (téléphone, autre PC)
3. **Dans un fichier Excel** que vous avez exporté

---

## ✅ SOLUTION : UTILISER LA FONCTION D'IMPORT

### Option 1 : Import depuis Excel

Si vous avez un fichier Excel avec vos données de décembre :

1. **Ouvrez l'application** : http://localhost:56511
2. **Connectez-vous** : LYDIE / LYDIE59
3. **Allez dans "Paramètres"** (⚙️)
4. **Cliquez sur "Importer depuis Excel"**
5. **Sélectionnez votre fichier**
6. **Validez l'import**

### Option 2 : Ajouter Manuellement

1. **Ouvrez l'application**
2. **Connectez-vous**
3. **Allez dans "Dashboard"**
4. **Cliquez sur "Ajouter une cigarette"** (bouton +)
5. **Remplissez** : Date, Heure, Lieu
6. **Répétez** pour chaque cigarette

### Option 3 : Export depuis Ancien Compte

Si vous aviez un autre compte avec les données :

1. **Connectez-vous avec l'ancien compte**
2. **Allez dans "Paramètres" → "Exporter les données"**
3. **Téléchargez le fichier Excel**
4. **Déconnectez-vous**
5. **Connectez-vous avec LYDIE / LYDIE59**
6. **Importez le fichier Excel**

---

## 📊 FORMAT EXCEL ATTENDU

Si vous créez un fichier Excel manuellement :

| Date       | Heure  | Lieu   | Avec café |
|------------|--------|--------|-----------|
| 2025-12-01 | 08:00  | maison | oui       |
| 2025-12-01 | 10:30  | travail| non       |
| 2025-12-02 | 09:15  | maison | oui       |
| ...        | ...    | ...    | ...       |

Colonnes requises :
- **Date** : Format `YYYY-MM-DD` (ex: 2025-12-01)
- **Heure** : Format `HH:MM` (ex: 08:00)
- **Lieu** : Texte libre
- **Avec café** : "oui" ou "non"

---

## 🔧 VÉRIFICATION APRÈS IMPORT

Une fois les données importées :

```powershell
node verifier-toutes-donnees.mjs
```

Vous devriez voir les cigarettes de décembre apparaître.

---

## 💡 ALTERNATIVE : COPIER DEPUIS NAVIGATEUR

Si vous avez les données dans votre navigateur :

1. **Ouvrez** : http://localhost:56511
2. **Appuyez sur F12** (ouvrir DevTools)
3. **Allez dans "Console"**
4. **Collez ce code** :

```javascript
// Exporter IndexedDB vers JSON
async function exporterVersJSON() {
  const db = await new Dexie('suivi-tabac-db');
  db.version(1).stores({
    journees: '++id, date, typeJournee',
    cigarettes: '++id, journeeId, heure, lieu'
  });
  
  await db.open();
  
  const journees = await db.journees.toArray();
  const cigarettes = await db.cigarettes.toArray();
  
  const data = { journees, cigarettes };
  
  // Télécharger JSON
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'donnees-decembre.json';
  a.click();
  
  console.log('✅ Fichier téléchargé !');
}

exporterVersJSON();
```

5. **Envoyez-moi le fichier JSON** pour que je le convertisse en import SQL

---

## 📞 BESOIN D'AIDE ?

Si vous ne trouvez pas vos données de décembre :

1. Vérifiez quel navigateur vous utilisiez en décembre
2. Vérifiez quel appareil (PC, téléphone, tablette)
3. Vérifiez si vous avez des exports Excel de cette période

Les données de **novembre sont OK** (267 cigarettes dans Supabase).
Il ne manque que **décembre** (1er au 11).

---

📊 **Données actuelles dans Supabase** :
- ✅ Novembre 2025 : 267 cigarettes, 22 journées
- ❌ Décembre 2025 : 0 cigarettes (à importer)
