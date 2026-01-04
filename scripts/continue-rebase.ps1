<#
  scripts/continue-rebase.ps1
  Aide pour terminer le rebase interactif en cours de manière sûre.

  Usage (dans le dossier racine du repo):
    powershell -ExecutionPolicy Bypass -File .\scripts\continue-rebase.ps1

  Le script :
  - vérifie qu'un rebase est en cours,
  - affiche le statut et les fichiers staged,
  - propose de désindexer les fichiers .env, local.settings.json et les zip,
  - propose d'ajouter les workflows et le script non suivis,
  - ajoute des règles .gitignore si nécessaire,
  - lance `git rebase --continue` et en cas de succès propose un push `--force-with-lease`.
#>

Set-StrictMode -Version Latest
cd $PSScriptRoot/.. 2>$null

function Run-Command($cmd) {
  Write-Host "=> $cmd" -ForegroundColor Cyan
  $out = & cmd /c $cmd 2>&1
  Write-Host $out
  return $LASTEXITCODE
}

if (-not (Test-Path .git)) {
  Write-Host "ERREUR: Ce dossier n'est pas un dépôt Git (pas de .git)." -ForegroundColor Red
  exit 1
}

# Detect rebase in progress
if (-not (Test-Path .git\rebase-apply -PathType Container -ErrorAction SilentlyContinue) -and -not (Test-Path .git\rebase-merge -PathType Container -ErrorAction SilentlyContinue)) {
  Write-Host "Aucun rebase interactif en cours détecté. Rien à faire." -ForegroundColor Yellow
  git status
  exit 0
}

Write-Host "Rebase en cours détecté. Voici le statut Git actuel :" -ForegroundColor Green
git status --short

Write-Host "Fichiers staged (diff --staged) :" -ForegroundColor Green
git diff --staged --name-only

$unstage = @('.env.development','.env.local.template','.env.production','api/local.settings.json','suivi-tabac-api-deploy.zip','suivi-tabac-deploy.zip')

Write-Host "Les fichiers que je propose de désindexer (sécurisé) :" -ForegroundColor Yellow
$unstage | ForEach-Object { Write-Host " - $_" }

$answer = Read-Host "Désindexer ces fichiers maintenant ? (O/N)"
if ($answer -match '^[Oo]') {
  foreach ($f in $unstage) {
    if (Test-Path $f) {
      Run-Command "git restore --staged -- $f"
    }
  }
  Write-Host "Fichiers sensibles désindexés." -ForegroundColor Green
} else {
  Write-Host "Ignoré : les fichiers sensibles restent staged." -ForegroundColor Yellow
}

# Add the untracked workflows and script
$toAdd = @('.github/workflows/deploy-api-with-storage.yml','.github/workflows/migrate-and-deploy.yml','scripts/migrate-json-to-supabase.mjs')
Write-Host "Fichiers non suivis proposés pour ajout :" -ForegroundColor Yellow
$toAdd | ForEach-Object { Write-Host " - $_" }
$answer2 = Read-Host "Ajouter ces fichiers non suivis au commit ? (O/N)"
if ($answer2 -match '^[Oo]') {
  foreach ($f in $toAdd) {
    if (Test-Path $f) {
      Run-Command "git add -- $f"
    } else {
      Write-Host "Fichier absent : $f" -ForegroundColor Yellow
    }
  }
  Write-Host "Fichiers non suivis ajoutés." -ForegroundColor Green
} else {
  Write-Host "Ignoré : fichiers non suivis non ajoutés." -ForegroundColor Yellow
}

# Ensure .gitignore contains safe patterns
$ignoreLines = @('# Ignore env and deployment zips','.env*','*.zip')
$gitignorePath = '.gitignore'
if (-not (Test-Path $gitignorePath)) { New-Item -Path $gitignorePath -ItemType File -Force | Out-Null }

$existing = Get-Content $gitignorePath -ErrorAction SilentlyContinue
$toAppend = @()
foreach ($line in $ignoreLines) {
  if ($existing -notcontains $line) { $toAppend += $line }
}
if ($toAppend.Count -gt 0) {
  Write-Host "Les lignes suivantes seront ajoutées à .gitignore :" -ForegroundColor Yellow
  $toAppend | ForEach-Object { Write-Host " - $_" }
  $ans = Read-Host "Ajouter ces lignes à .gitignore ? (O/N)"
  if ($ans -match '^[Oo]') {
    Add-Content -Path $gitignorePath -Value "`n$($toAppend -join "`n")"
    Write-Host ".gitignore mis à jour." -ForegroundColor Green
    git add .gitignore
  } else { Write-Host ".gitignore non modifié." -ForegroundColor Yellow }
} else { Write-Host ".gitignore déjà à jour." -ForegroundColor Green }

Write-Host "Statut Git avant rebase --continue :" -ForegroundColor Cyan
git status --short

$cont = Read-Host "Exécuter 'git rebase --continue' maintenant ? (O/N)"
if ($cont -notmatch '^[Oo]') { Write-Host "Abandon: rebase non continué." -ForegroundColor Yellow; exit 0 }

Write-Host "Lancement de 'git rebase --continue'..." -ForegroundColor Cyan
$code = Run-Command "git rebase --continue"
if ($code -ne 0) {
  Write-Host "git rebase --continue a échoué. Résoudre manuellement les conflits, puis relancer le script ou exécuter 'git rebase --continue'." -ForegroundColor Red
  exit $code
}

Write-Host "Rebase terminé (si aucune erreur). Statut actuel :" -ForegroundColor Green
git status --short

$push = Read-Host "Pousser la branche 'main' vers 'origin' avec --force-with-lease ? (O/N)"
if ($push -match '^[Oo]') {
  Write-Host "git push --force-with-lease origin main" -ForegroundColor Cyan
  Run-Command "git push --force-with-lease origin main"
} else { Write-Host "Push ignoré. Tu peux pousser manuellement plus tard." -ForegroundColor Yellow }

Write-Host "Script terminé." -ForegroundColor Green
