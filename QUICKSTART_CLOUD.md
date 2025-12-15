# 🚀 QUICK START - Migration Cloud

## ⚠️ ACTION IMMÉDIATE REQUISE

**AVANT DE DÉPLOYER**, exécuter ce SQL dans Supabase :

### 1. Ouvrir le Dashboard

👉 https://supabase.com/dashboard/project/azzltzrzmukvyaiyamkc/sql/new

### 2. Copier-Coller ce SQL

```sql
CREATE TABLE IF NOT EXISTS user_metadata (
  user_id UUID PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  date_naissance DATE,
  debut_tabagisme DATE,
  cigarettes_par_jour_max INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view own metadata" ON user_metadata
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert own metadata" ON user_metadata
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own metadata" ON user_metadata
  FOR UPDATE USING (auth.uid() = user_id);

INSERT INTO user_metadata (user_id, cigarettes_par_jour_max)
VALUES ('74f681f0-78e5-49f1-92c6-ee4d1e8cbf03', 20)
ON CONFLICT (user_id) DO NOTHING;
```

### 3. Cliquer "RUN"

### 4. Vérifier

```powershell
node create-metadata-table.mjs
```

✅ Doit afficher : "✅ Table user_metadata créée avec succès"

---

## 📦 CE QUI A ÉTÉ FAIT

✅ **API Cloud** : 2 nouvelles méthodes
- `getUserMetadata()` - Charge infos santé
- `updateUserMetadata()` - Sauvegarde infos santé

✅ **Profil** : Synchronisation cloud
- Pseudo sauvegardé dans Supabase
- Objectif sauvegardé dans Supabase
- Plus de localStorage

✅ **Santé** : Synchronisation cloud
- Date naissance sauvegardée dans Supabase
- Début tabagisme sauvegardé dans Supabase
- Cigarettes max/jour sauvegardé dans Supabase
- Plus de localStorage

---

## 🎯 RÉSULTAT

### Avant
❌ Données uniquement sur cet appareil  
❌ Perdues si cache vidé  
❌ Pas de synchronisation

### Après
✅ Données accessibles partout  
✅ Sauvegarde permanente cloud  
✅ Synchronisation automatique

---

## 🧪 TEST RAPIDE

```powershell
# 1. Développement local
npm run dev

# 2. Tester
# - Profil : Modifier objectif → Recharger page → Vérifier conservation
# - Santé : Remplir infos → Recharger page → Vérifier conservation

# 3. Build
npm run build

# 4. Déployer
swa deploy ./dist --deployment-token $env:AZURE_STATIC_WEB_APPS_API_TOKEN_AMBITIOUS_DUNE_0B02F5A03
```

---

## 📖 Documentation Complète

- **Guide détaillé** : `INSTRUCTIONS_MANUELLES.md`
- **Résumé technique** : `MIGRATION_CLOUD_RESUME.md`
- **Ce guide** : `QUICKSTART_CLOUD.md`

---

## 🆘 Besoin d'Aide ?

### Erreur "Could not find the table"
→ La table n'est pas créée. Exécuter le SQL ci-dessus.

### Le profil ne charge pas
→ Vérifier connexion Supabase. Voir console navigateur (F12).

### Les infos santé ne se sauvegardent pas
→ Vérifier que la table existe : `node create-metadata-table.mjs`

---

## ✅ Checklist

- [ ] SQL exécuté dans Supabase Dashboard
- [ ] Vérification avec node script réussie
- [ ] Test local : Profil fonctionne
- [ ] Test local : Santé fonctionne
- [ ] Build réussie
- [ ] Déploiement réussi
- [ ] Test production : Connexion OK
- [ ] Test production : Données synchronisées

**🎉 Migration terminée !**
