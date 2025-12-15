# 🚨 ACTION IMMÉDIATE - MIGRATION DONNÉES LYDIE

## ⚡ ÉTAPE 1 : OUVRIR SUPABASE (10 secondes)

**Cliquez sur ce lien** 👇  
https://supabase.com/dashboard/project/azzltzrzmukvyaiyamkc/sql/new

---

## 📋 ÉTAPE 2 : COPIER LE SQL (5 secondes)

**Ouvrez le fichier** : `MIGRATION_LYDIE.sql` (dans ce dossier)

**Sélectionnez TOUT** (Ctrl+A) et **Copiez** (Ctrl+C)

---

## ▶️ ÉTAPE 3 : EXÉCUTER (5 secondes)

1. **Collez** le SQL dans l'éditeur Supabase (Ctrl+V)
2. **Cliquez** sur le bouton **"RUN"** (en haut à droite)
3. **Attendez** 2-3 secondes

---

## ✅ ÉTAPE 4 : VÉRIFIER LE RÉSULTAT

Vous devriez voir **3 tableaux de résultats** :

### Tableau 1 : PROFIL
```
type    | user_id      | pseudo | objectif_global | share_public | created_at
--------|--------------|--------|-----------------|--------------|------------
PROFIL  | 74f681f0-... | LYDIE  | 12              | false        | 2024-...
```

### Tableau 2 : SANTÉ
```
type  | user_id      | date_naissance | debut_tabagisme | cigarettes_par_jour_max
------|--------------|----------------|-----------------|------------------------
SANTÉ | 74f681f0-... | null           | null            | 20
```

### Tableau 3 : SUIVI
```
type  | table_name  | count
------|-------------|-------
SUIVI | journees    | 22
SUIVI | cigarettes  | 267
```

✅ **Si vous voyez ces 3 tableaux = SUCCÈS !**

---

## 🎯 ÉTAPE 5 : VÉRIFIER DANS L'APPLICATION

```powershell
npm run dev
```

1. **Ouvrez** : http://localhost:5173
2. **Connectez-vous** : LYDIE / LYDIE59
3. **Allez dans "Profil"** :
   - Vous devriez voir : **"🎯 Objectif: 12 cigarettes/jour"**
4. **Allez dans "Santé"** :
   - Cliquez sur **"Modifier"** dans la section infos personnelles
   - Remplissez vos vraies dates (naissance + début tabagisme)
   - **Sauvegardez**
5. **Rechargez la page** (F5) :
   - Les infos doivent être **conservées** ✅

---

## 🚀 ÉTAPE 6 : DÉPLOYER

Une fois vérifié localement :

```powershell
npm run build
swa deploy ./dist --deployment-token $env:AZURE_STATIC_WEB_APPS_API_TOKEN_AMBITIOUS_DUNE_0B02F5A03
```

---

## 🎉 C'EST FINI !

Vos données sont maintenant **100% dans le cloud** :

✅ **Profil** (pseudo + objectif) → Table `users`  
✅ **Santé** (dates + cigarettes max) → Table `user_metadata`  
✅ **Journées** (22) → Table `journees`  
✅ **Cigarettes** (267) → Table `cigarettes`

**Accessible depuis n'importe quel appareil après connexion !**

---

## 🆘 EN CAS DE PROBLÈME

### Erreur "relation already exists"
→ **Pas grave**, la table existe déjà. Le reste s'est quand même exécuté.

### Aucun résultat affiché
→ Vérifiez que vous avez bien **cliqué sur RUN** et attendu 2-3 secondes.

### L'objectif ne s'affiche pas dans l'app
→ Vérifiez dans Supabase Dashboard → Table Editor → `users` → Ligne LYDIE → Colonne `objectif_global`

---

## ⏱️ TEMPS TOTAL : 30 SECONDES

1. Ouvrir Supabase (10 sec)
2. Copier SQL (5 sec)
3. Exécuter (5 sec)
4. Vérifier résultats (10 sec)

**C'EST TOUT !** 🎯
