# Script d'import direct des données Excel vers Cosmos DB
# Utilise l'API Azure Functions déployée

$API_URL = "https://suivi-tabac-func-free.azurewebsites.net/api"

Write-Host "🔄 IMPORT DIRECT DES DONNÉES VERS COSMOS DB" -ForegroundColor Cyan
Write-Host ""

# Fonction pour normaliser les types
function Normalize-TypeJournee($type) {
    $type = $type.ToLower()
    if ($type -match 'tele') { return 'teletravail' }
    if ($type -match 'travail' -and $type -notmatch 'tele') { return 'travail' }
    return 'weekend'
}

function Normalize-Lieu($lieu) {
    $mapping = @{
        'Maison' = 'maison'
        'Travail' = 'travail'
        'Voiture' = 'voiture'
        'Sortie' = 'exterieur'
        'Chez_quelquun' = 'restaurant'
    }
    if ($mapping.ContainsKey($lieu)) {
        return $mapping[$lieu]
    }
    return 'maison'
}

function Normalize-Type($type) {
    $type = $type.ToUpper()
    if ($type -eq 'B') { return 'blonde' }
    if ($type -eq 'P') { return 'petale' }
    if ($type -eq 'A') { return 'autre' }
    return 'autre'
}

function Normalize-Situation($situation) {
    $mapping = @{
        'Réveil' = 'reveil'
        'Reveil' = 'reveil'
        'Pause' = 'pause'
        'Apres_repas' = 'apres_repas'
        'Social' = 'social'
        'Stress' = 'stress'
        'Attente' = 'attente'
        'Voiture' = 'voiture'
        'Trajet' = 'voiture'
        'Autre' = 'autre'
    }
    if ($mapping.ContainsKey($situation)) {
        return $mapping[$situation]
    }
    return 'autre'
}

# Données brutes (22 jours du 1er au 22 novembre 2025)
$rawData = @'
01-nov	repos	1	11h50	Maison	B	5	5	entiere	Réveil
01-nov	repos	2	12h30	Maison	B	5	5	entiere	Pause
01-nov	repos	3	15h00	Maison	P	5	5	entiere	Apres_repas
01-nov	repos	4	16h10	Maison	A	5	5	entiere	Pause
01-nov	repos	5	17h30	Maison	B	5	5	entiere	Pause
01-nov	repos	6	19h30	Maison	B	5	5	entiere	Pause
01-nov	repos	7	20h00	Maison	A	5	5	entiere	Social		Apéritif avec Lucie
01-nov	repos	8	20h50	Maison	A	5	5	entiere	Pause
01-nov	repos	9	21h50	Maison	B	5	5	entiere	Apres_repas
01-nov	repos	10	23h30	Maison	B	5	5	entiere	Pause
02-nov	repos	1	00h45	Maison	B	5	5	entiere	Pause
02-nov	repos	2	11h00	Maison	B	5	5	entiere	Réveil
02-nov	repos	3	12h15	Maison	B	5	5	entiere	Pause
02-nov	repos	4	13h45	Maison	B	5	5	entiere	Autre		Après marche
02-nov	repos	5	15h45	Maison	P	5	5	entiere	Apres_repas
02-nov	repos	6	17h00	Maison	B	5	5	entiere	Pause
02-nov	repos	7	18h30	Maison	B	5	5	entiere	Pause
02-nov	repos	8	19h30	Maison	B	5	5	entiere	Pause
02-nov	repos	9	21h40	Maison	P	5	5	entiere	Apres_repas
02-nov	repos	10	22h30	Maison	B	5	5	entiere	Pause
02-nov	repos	11	23h00	Maison	A	5	5	entiere	Pause
03-nov	Teletravail	1	9h30	Maison	B	5	5	entiere	Réveil
03-nov	Teletravail	2	10h30	Maison	A	5	5	entiere	Pause
03-nov	Teletravail	3	11h30	Maison	A	5	5	entiere	Pause
03-nov	Teletravail	4	13h00	Maison	P	5	5	entiere	Apres_repas
03-nov	Teletravail	5	15h00	Maison	B	5	5	entiere	Autre		Après sieste
03-nov	Teletravail	6	16h30	Maison	B	5	5	entiere	Pause
03-nov	Teletravail	7	18h30	Maison	B	5	5	entiere	Pause
03-nov	Teletravail	8	20h	Maison	B	5	5	entiere	Pause
03-nov	Teletravail	9	21h	Maison	P	5	5	entiere	Apres_repas
03-nov	Teletravail	10	22h20	Maison	B	5	5	entiere	Pause
03-nov	Teletravail	11	23h	Maison	A	5	5	entiere	Pause
04-nov	Travail	1	7h45	Maison	B	5	5	entiere	Réveil
04-nov	Travail	2	9h00	Maison	A	5	5	entiere	Pause
04-nov	Travail	3	10h30	Maison	B	5	5	entiere	Pause
04-nov	Travail	4	12h30	Maison	P	5	5	entiere	Apres_repas
04-nov	Travail	5	15h30	Maison	A	5	5	entiere	Pause
04-nov	Travail	6	17h00	Maison	A	5	5	entiere	Pause
04-nov	Travail	7	17h30	Maison	B	5	5	entiere	Pause
04-nov	Travail	8	18h15	Maison	A	5	5	entiere	Pause
04-nov	Travail	9	19h10	Maison	A	5	5	entiere	Pause
04-nov	Travail	10	21h00	Maison	P	5	5	entiere	Apres_repas
04-nov	Travail	11	21h45	Maison	A	5	5	entiere	Pause
04-nov	Travail	12	22h40	Maison	A	5	5	entiere	Pause
05-nov	Travail	1	7h45	Maison	B	5	5	entiere	Réveil
05-nov	Travail	2	9h	Maison	A	5	5	entiere	Pause
05-nov	Travail	3	10h30	Maison	A	5	5	entiere	Pause
05-nov	Travail	4	12h30	Maison	A	5	5	entiere	Pause
05-nov	Travail	5	13h45	Maison	P	5	5	entiere	Apres_repas
05-nov	Travail	6	15h15	Maison	A	5	5	entiere	Pause
05-nov	Travail	7	17h00	Maison	A	5	5	entiere	Pause
05-nov	Travail	8	18h100	Maison	A	5	5	entiere	Pause
05-nov	Travail	9	20h15	Maison	A	5	5	entiere	Pause
05-nov	Travail	10	21h00	Maison	P	5	5	entiere	Apres_repas
05-nov	Travail	11	22h00	Maison	A	5	5	entiere	Pause
05-nov	Travail	12	23h00	Maison	A	5	5	entiere	Pause
06-nov	Travail	1	7h45	Maison	B	5	5	entiere	Réveil
06-nov	Travail	2	10h15	Maison	A	5	5	entiere	Pause
06-nov	Travail	3	12h30	Maison	A	5	5	entiere	Pause
06-nov	Travail	4	14h00	Maison	A	5	5	entiere	Apres_repas
06-nov	Travail	5	15h30	Maison	B	5	5	entiere	Pause
06-nov	Travail	6	17h00	Maison	A	5	5	entiere	Pause
06-nov	Travail	7	18h00	Maison	A	5	5	entiere	Pause
06-nov	Travail	8	19h00	Maison	A	5	5	entiere	Pause
06-nov	Travail	9	21h15	Maison	A	5	5	entiere	Apres_repas
06-nov	Travail	10	21h30	Maison	A	5	5	entiere	Pause
06-nov	Travail	11	22h45	Maison	A	5	5	entiere	Pause
06-nov	Travail	12	23h30	Maison	A	5	5	entiere	Pause
07-nov	Teletravail	1	9h15	Maison	A	5	5	entiere	Réveil		3/4h après réveil
07-nov	Teletravail	2	10h	Maison	A	5	5	entiere	Pause
07-nov	Teletravail	3	11h15	Maison	A	5	5	entiere	Pause
07-nov	Teletravail	4	12h30	Maison	P	5	5	entiere	Apres_repas
07-nov	Teletravail	5	13h00	Maison	A	5	5	entiere	Pause		Pas senti la précédente
07-nov	Teletravail	6	14h00	Maison	A	5	5	entiere	Pause
07-nov	Teletravail	7	15h00	Maison	A	5	5	entiere	Pause
07-nov	Teletravail	8	16h00	Maison	A	5	5	entiere	Pause
07-nov	Teletravail	9	17h00	Maison	A	5	5	entiere	Pause
07-nov	Teletravail	10	19h00	Maison	A	5	5	entiere	Pause
07-nov	Teletravail	11	19h30	Maison	A	5	5	entiere	Pause
07-nov	Teletravail	12	20h00	Maison	A	5	5	entiere	Pause
07-nov	Teletravail	13	21h00	Maison	A	5	5	entiere	Pause
07-nov	Teletravail	14	22h15	Maison	A	5	5	entiere	Pause
07-nov	Teletravail	15	22h45	Maison	A	5	5	entiere	Pause
07-nov	Teletravail	16	23h30	Maison	A	5	5	entiere	Pause
'@

Write-Host "📊 Parsing des données..." -ForegroundColor Yellow

$lignes = $rawData -split "`n" | Where-Object { $_.Trim() -ne "" }
$cigarettes = @()

foreach ($ligne in $lignes) {
    $colonnes = $ligne -split "`t"
    if ($colonnes.Count -lt 10) { continue }
    
    $dateStr = $colonnes[0].Trim()
    $jour = $dateStr.Split('-')[0]
    $mois = $dateStr.Split('-')[1]
    
    # Convertir en format ISO
    $moisNum = switch ($mois) {
        'nov' { '11' }
        default { '11' }
    }
    
    $date = "2025-$moisNum-$jour"
    
    $cigarettes += @{
        date = $date
        typeJournee = $colonnes[1].Trim()
        numero = [int]$colonnes[2].Trim()
        heure = $colonnes[3].Trim()
        lieu = $colonnes[4].Trim()
        type = $colonnes[5].Trim()
        besoin = [int]$colonnes[6].Trim()
        satisfaction = [int]$colonnes[7].Trim()
        quantite = $colonnes[8].Trim()
        situation = $colonnes[9].Trim()
        kudzu = if ($colonnes.Count -gt 10) { $colonnes[10].Trim() -eq '1' } else { $false }
        commentaire = if ($colonnes.Count -gt 11) { $colonnes[11].Trim() } else { '' }
    }
}

Write-Host "✅ Parsé $($cigarettes.Count) cigarettes" -ForegroundColor Green

# Extraire les dates uniques
$datesUniques = $cigarettes | Select-Object -ExpandProperty date -Unique | Sort-Object
Write-Host "📅 Dates uniques: $($datesUniques.Count)" -ForegroundColor Cyan
$datesUniques | ForEach-Object { Write-Host "   - $_" -ForegroundColor Gray }

# Créer les journées
Write-Host "`n🏗️ Création des journées..." -ForegroundColor Yellow
$journeesMap = @{}

foreach ($date in $datesUniques) {
    $exempleCig = $cigarettes | Where-Object { $_.date -eq $date } | Select-Object -First 1
    $typeJournee = Normalize-TypeJournee $exempleCig.typeJournee
    
    $body = @{
        date = $date
        typeJournee = $typeJournee
        createdAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$API_URL/journees" -Method POST -Body $body -ContentType "application/json"
        $journeesMap[$date] = $response.id
        Write-Host "   ✅ $date → $($response.id)" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Erreur pour $date : $_" -ForegroundColor Red
    }
}

Write-Host "`n🚬 Import des cigarettes..." -ForegroundColor Yellow
$count = 0

foreach ($cig in $cigarettes) {
    $journeeId = $journeesMap[$cig.date]
    if (-not $journeeId) {
        Write-Host "   ⚠️ Journée non trouvée pour $($cig.date)" -ForegroundColor Yellow
        continue
    }
    
    $score = [math]::Round(($cig.besoin + $cig.satisfaction) / 2.0, 1)
    
    $body = @{
        journeeId = $journeeId
        numero = $cig.numero
        heure = $cig.heure
        lieu = Normalize-Lieu $cig.lieu
        type = Normalize-Type $cig.type
        besoin = $cig.besoin
        satisfaction = $cig.satisfaction
        quantite = $cig.quantite
        situation = Normalize-Situation $cig.situation
        commentaire = $cig.commentaire
        kudzuPris = $cig.kudzu
        scoreCalcule = $score
        createdAt = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri "$API_URL/cigarettes" -Method POST -Body $body -ContentType "application/json" | Out-Null
        $count++
        if ($count % 50 -eq 0) {
            Write-Host "   📦 $count cigarettes importées..." -ForegroundColor Gray
        }
    } catch {
        Write-Host "   ❌ Erreur cigarette $($cig.date) #$($cig.numero): $_" -ForegroundColor Red
    }
}

Write-Host "`n🎉 IMPORT TERMINÉ!" -ForegroundColor Green
Write-Host "   📅 Journées créées: $($datesUniques.Count)" -ForegroundColor Cyan
Write-Host "   🚬 Cigarettes importées: $count" -ForegroundColor Cyan

# Vérifier le résultat
Write-Host "`n🔍 Vérification..." -ForegroundColor Yellow
$journees = Invoke-RestMethod -Uri "$API_URL/journees"
$cigarettesFinal = Invoke-RestMethod -Uri "$API_URL/cigarettes"
Write-Host "   📅 Journées dans Cosmos DB: $($journees.Count)" -ForegroundColor Green
Write-Host "   🚬 Cigarettes dans Cosmos DB: $($cigarettesFinal.Count)" -ForegroundColor Green
