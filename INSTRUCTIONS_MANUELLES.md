# Instructions Manuelles - Migration Cloud

## ⚠️ ÉTAPE CRITIQUE : Créer la table user_metadata

**ACTION MANUELLE OBLIGATOIRE AVANT DE DÉPLOYER**

### 1. Ouvrir le Dashboard Supabase

URL directe : https://supabase.com/dashboard/project/azzltzrzmukvyaiyamkc/sql/new

### 2. Exécuter le SQL suivant

Copier-coller ce SQL complet dans l'éditeur et cliquer sur "RUN" :

```sql
-- Créer la table user_metadata
CREATE TABLE IF NOT EXISTS user_metadata (
  user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  date_naissance DATE,
  debut_tabagisme DATE,
  cigarettes_par_jour_max INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activer RLS (Row Level Security)
ALTER TABLE user_metadata ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS pour sécuriser les données
CREATE POLICY "Allow users to view own metadata" ON user_metadata
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert own metadata" ON user_metadata
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own metadata" ON user_metadata
  FOR UPDATE USING (auth.uid() = user_id);

-- Créer l'entrée initiale pour LYDIE
INSERT INTO user_metadata (user_id, cigarettes_par_jour_max)
VALUES ('74f681f0-78e5-49f1-92c6-ee4d1e8cbf03', 20)
ON CONFLICT (user_id) DO NOTHING;
```

### 3. Vérifier la création

Dans PowerShell, exécuter :

```powershell
node create-metadata-table.mjs
```

✅ **Succès** : Message "✅ Table user_metadata créée avec succès"  
❌ **Échec** : Erreur "Could not find the table" → Recommencer l'étape 2

---

## 📦 Modifications Effectuées

### A. API Cloud (src/services/api.ts)

✅ **Ajouté 2 nouvelles méthodes** :

1. `getUserMetadata()` - Récupère les infos santé depuis Supabase
   - Date de naissance
   - Date début tabagisme
   - Nombre max de cigarettes/jour

2. `updateUserMetadata()` - Sauvegarde les infos santé dans Supabase
   - Utilise UPSERT (INSERT ou UPDATE automatique)
   - Met à jour le timestamp updated_at

✅ **Modifié `updateProfil()`** :
   - Accepte maintenant `objectifGlobal` en paramètre
   - Sauvegarde l'objectif dans la colonne `objectif_global` de la table `users`

### B. Composant Santé (src/components/EffetsSante.tsx)

✅ **Supprimé localStorage** :
   - ❌ Plus de `INFO_SANTE_KEY`
   - ❌ Plus de `getInfoSanteLocal()` / `saveInfoSanteLocal()`

✅ **Ajouté synchronisation cloud** :
   - `useEffect` charge les données depuis Supabase au montage
   - État `isLoadingInfo` pour afficher un chargement
   - `saveInfoSante()` est maintenant asynchrone et appelle l'API
   - Gestion d'erreur avec alert en cas de problème

### C. Composant Profil (src/components/Profil.tsx)

✅ **Supprimé localStorage** :
   - ❌ Plus de `PROFIL_KEY`
   - ❌ Plus de `getProfilLocal()` / `saveProfilLocal()`

✅ **Ajouté synchronisation cloud** :
   - `chargerProfil()` est maintenant asynchrone et appelle `apiService.getProfil()`
   - `handleSubmit()` sauvegarde pseudo ET objectifGlobal dans Supabase
   - Gestion d'erreur avec messages utilisateur

---

## 🎯 Résultat Final

### Avant (localStorage)
- ❌ Données uniquement sur l'appareil
- ❌ Perte des données si cache vidé
- ❌ Pas de synchronisation entre appareils

### Après (Supabase Cloud)
- ✅ Données accessibles depuis n'importe quel appareil
- ✅ Synchronisation automatique après connexion
- ✅ Sécurisé avec RLS (chaque user voit uniquement ses données)
- ✅ Sauvegarde permanente dans le cloud

---

## 🚀 Prochaines Étapes

### 1. Exécuter le SQL manuellement (CRITIQUE)

**SANS CETTE ÉTAPE, L'APPLICATION NE FONCTIONNERA PAS**

### 2. Tester localement

```powershell
npm run dev
```

- Vérifier que le profil charge correctement
- Modifier l'objectif → Vérifier qu'il se sauvegarde
- Aller dans Santé → Remplir les infos → Vérifier la sauvegarde

### 3. Vérifier dans Supabase Dashboard

- Table `users` : Vérifier que `objectif_global` se met à jour
- Table `user_metadata` : Vérifier que les infos santé apparaissent

### 4. Déployer en production

```powershell
npm run build
swa deploy ./dist --deployment-token $env:AZURE_STATIC_WEB_APPS_API_TOKEN_AMBITIOUS_DUNE_0B02F5A03
```

### 5. Tester cross-device

- Connexion depuis un autre appareil
- Vérifier que les données (objectif + infos santé) sont synchronisées

---

## 📋 Données Migrées vers le Cloud

| Donnée | Avant (localStorage) | Après (Supabase) |
|--------|---------------------|------------------|
| **Pseudo** | `suivi-tabac-profil` | Table `users` → colonne `pseudo` |
| **Objectif** | `suivi-tabac-profil` | Table `users` → colonne `objectif_global` |
| **Date naissance** | `suivi-tabac-info-sante` | Table `user_metadata` → colonne `date_naissance` |
| **Début tabagisme** | `suivi-tabac-info-sante` | Table `user_metadata` → colonne `debut_tabagisme` |
| **Cigarettes max/jour** | `suivi-tabac-info-sante` | Table `user_metadata` → colonne `cigarettes_par_jour_max` |
| **Journées** | IndexedDB | Table `journees` (✅ déjà migré) |
| **Cigarettes** | IndexedDB | Table `cigarettes` (✅ déjà migré) |

---

## ⚠️ Notes Importantes

1. **RLS Policies** : Les politiques RLS garantissent que chaque utilisateur ne peut voir/modifier QUE ses propres données

2. **UPSERT** : La méthode `updateUserMetadata()` utilise UPSERT, donc :
   - Si l'entrée existe → UPDATE
   - Si l'entrée n'existe pas → INSERT
   - Pas besoin de vérifier avant d'insérer

3. **Fallback** : Si la table n'existe pas encore, `getUserMetadata()` retourne des valeurs par défaut sans crash

4. **Service Role Key** : Les opérations utilisent le service_role key pour bypasser RLS pendant le développement (déjà configuré)

---

## 🔒 Sécurité

✅ **Row Level Security (RLS)** activé sur `user_metadata`  
✅ **Policies** : Lecture/Écriture uniquement pour le propriétaire  
✅ **CASCADE DELETE** : Si user supprimé → metadata supprimé automatiquement  
✅ **Validation** : Dates en format ISO, integers pour cigarettes/jour

---

## 📞 En Cas de Problème

### Erreur "Could not find the table 'public.user_metadata'"

**Solution** : Exécuter le SQL manuellement (étape 1-2)

### Erreur "Erreur sauvegarde infos santé"

**Causes possibles** :
1. Table pas encore créée
2. RLS policy bloque l'insertion (vérifier auth.uid())
3. Format de date invalide

**Debug** :
```powershell
node create-metadata-table.mjs
```

### Les données ne se chargent pas

**Vérifier** :
1. Connexion Supabase active (voir console navigateur)
2. user_id correct dans localStorage (`suivi-tabac-current-user`)
3. Table existe et contient des données (Supabase Dashboard)

---

## ✅ Checklist Finale

- [ ] SQL exécuté dans Supabase Dashboard
- [ ] Table `user_metadata` créée (vérifiée avec node script)
- [ ] Test local : Profil charge correctement
- [ ] Test local : Modification objectif fonctionne
- [ ] Test local : Infos santé se sauvegardent
- [ ] Déployement en production réussi
- [ ] Test cross-device : Données synchronisées

**Une fois toutes les cases cochées, la migration cloud est COMPLÈTE !** 🎉
