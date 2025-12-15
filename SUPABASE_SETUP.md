# GUIDE DE CONFIGURATION SUPABASE (100% GRATUIT)

## Étape 1 : Créer un compte Supabase gratuit

1. Va sur **https://supabase.com**
2. Clique sur **"Start your project"**
3. Connecte-toi avec GitHub (gratuit)
4. Crée un nouveau projet :
   - **Name** : suivi-tabac
   - **Database Password** : (génère un mot de passe fort)
   - **Region** : Europe (West) - pour France
   - **Pricing Plan** : **FREE** (0€/mois)

5. Attends 2-3 minutes que le projet soit créé

## Étape 2 : Créer les tables

1. Dans le dashboard Supabase, va dans **SQL Editor** (icône de base de données)
2. Clique sur **"New query"**
3. Copie-colle tout le contenu du fichier `supabase-schema.sql`
4. Clique sur **"Run"** (ou appuie sur Ctrl+Enter)

## Étape 3 : Récupérer les clés API

1. Va dans **Settings** > **API**
2. Copie ces deux valeurs :
   - **Project URL** (exemple : `https://xxxxx.supabase.co`)
   - **anon public** key (clé publique)

## Étape 4 : Configurer le projet local

Crée un fichier `.env.local` à la racine du projet avec :

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=ta-cle-anon-ici
```

## Étape 5 : Déployer sur Azure Static Web Apps

Dans les **Configuration** de ton Static Web App `ambitious-dune` :

1. Va dans **Configuration** > **Application settings**
2. Ajoute ces variables :
   - `VITE_SUPABASE_URL` = ton URL Supabase
   - `VITE_SUPABASE_ANON_KEY` = ta clé anon

3. Redéploie l'application

## Limites du plan gratuit (largement suffisant)

✅ **500 MB de stockage** (= ~100 000 cigarettes)
✅ **50 000 utilisateurs actifs/mois**
✅ **500 000 lectures/mois**
✅ **Authentification incluse**
✅ **Pas de carte bancaire requise**

---

**⏱️ Temps d'installation : 5 minutes**
**💰 Coût : 0€ pour toujours**
