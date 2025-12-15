# 🚀 DÉPLOIEMENT MANUEL

## ✅ BUILD RÉUSSI !

Le build a été créé dans le dossier `dist/`

---

## 📦 OPTIONS DE DÉPLOIEMENT

### OPTION 1 : Azure Static Web Apps (Automatique via GitHub)

Si vous avez un repo GitHub connecté :

```powershell
# Initialiser Git si pas déjà fait
git init
git add .
git commit -m "Migration cloud - Toutes données dans Supabase"

# Push vers GitHub (remplacez par votre URL)
git remote add origin https://github.com/VOTRE_USERNAME/suivi-tabac.git
git push -u origin main
```

GitHub Actions déploiera automatiquement vers :
👉 https://ambitious-dune-0b02f5a03.3.azurestaticapps.net

---

### OPTION 2 : Upload Manuel des Fichiers

**Méthode FTP/Portal Azure :**

1. Connectez-vous à : https://portal.azure.com
2. Recherchez "ambitious-dune-0b02f5a03"
3. Allez dans "Deployment Center"
4. Uploadez le contenu du dossier `dist/`

---

### OPTION 3 : Test Local d'Abord

Avant de déployer, testez localement :

```powershell
# Installer un serveur HTTP simple
npm install -g serve

# Servir le build
serve -s dist -p 3000
```

Ouvrez : http://localhost:3000
- Connectez-vous : LYDIE / LYDIE59
- Vérifiez que tout fonctionne

---

## 🎯 VÉRIFICATIONS AVANT DÉPLOIEMENT

✅ Build réussi (`dist/` créé)  
✅ Table `user_metadata` créée dans Supabase  
✅ Migration vérifiée (267 cigarettes, 22 journées)  
⏳ Test local recommandé

---

## 📊 CONTENU DU BUILD

Le dossier `dist/` contient :
- `index.html` - Page principale
- `assets/` - CSS, JS, images minifiés
- `manifest.json` - Configuration PWA

**Taille totale** : ~2 MB (optimisé pour production)

---

## 🆘 SI VOUS AVEZ BESOIN D'AIDE

### Pour déployer via Azure CLI :

```powershell
# Installer Azure CLI
winget install Microsoft.AzureCLI

# Se connecter
az login

# Déployer
az staticwebapp upload --name ambitious-dune-0b02f5a03 --resource-group VOTRE_RESOURCE_GROUP --source ./dist
```

### Pour obtenir le token de déploiement :

1. Portail Azure → Static Web Apps
2. Sélectionnez "ambitious-dune-0b02f5a03"
3. "Manage deployment token"
4. Copiez le token
5. Définissez la variable d'environnement :

```powershell
$env:AZURE_STATIC_WEB_APPS_API_TOKEN_AMBITIOUS_DUNE_0B02F5A03 = "VOTRE_TOKEN_ICI"
swa deploy ./dist --deployment-token $env:AZURE_STATIC_WEB_APPS_API_TOKEN_AMBITIOUS_DUNE_0B02F5A03
```

---

## ✅ RÉSUMÉ

🎉 **L'application est prête à être déployée !**

📦 **Build** : ✅ Réussi  
🗄️ **Base de données** : ✅ Migrée  
🔒 **Sécurité** : ✅ RLS activé  
📊 **Données LYDIE** : ✅ 267 cigarettes, 22 journées

**Prochaine étape** : Choisissez une option de déploiement ci-dessus.
