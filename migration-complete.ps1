# Script PowerShell pour désactiver les RLS et importer les données
$supabaseUrl = "https://azzltzrzmukvyaiyamkc.supabase.co"
$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6emx0enJ6bXVrdnlhaXlhbWtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0ODQyMzEsImV4cCI6MjA4MTA2MDIzMX0.JTGjWSiWyGfZj34xBUlSqUoOp2qK3mBD0cMacBc5his"

Write-Host "ATTENTION: Ce script necessite la cle SERVICE_ROLE de Supabase" -ForegroundColor Yellow
Write-Host "La cle ANON ne peut pas modifier les RLS policies" -ForegroundColor Yellow
Write-Host ""
Write-Host "Tu dois aller manuellement sur Supabase Dashboard:" -ForegroundColor Cyan
Write-Host "  1. https://supabase.com/dashboard/project/azzltzrzmukvyaiyamkc" -ForegroundColor White
Write-Host "  2. Clique sur 'SQL Editor'" -ForegroundColor White
Write-Host "  3. Execute ce SQL:" -ForegroundColor White
Write-Host ""
Write-Host "ALTER TABLE journees DISABLE ROW LEVEL SECURITY;" -ForegroundColor Green
Write-Host "ALTER TABLE cigarettes DISABLE ROW LEVEL SECURITY;" -ForegroundColor Green
Write-Host "ALTER TABLE objectifs DISABLE ROW LEVEL SECURITY;" -ForegroundColor Green
Write-Host "ALTER TABLE journal_notes DISABLE ROW LEVEL SECURITY;" -ForegroundColor Green
Write-Host ""
Write-Host "Puis reviens ici et appuie sur ENTRÉE pour lancer l'import..." -ForegroundColor Yellow
Read-Host

Write-Host ""
Write-Host "Lancement de l'import..." -ForegroundColor Cyan
Set-Location "C:\Users\lydie\Videos\LYDIETABAC\suivi-tabac"
node import-sans-rls.mjs

Write-Host ""
Write-Host "Import termine!" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANT: Maintenant tu dois RE-ACTIVER les RLS!" -ForegroundColor Yellow
Write-Host "Retourne sur SQL Editor et exécute:" -ForegroundColor White
Write-Host ""
Write-Host "ALTER TABLE journees ENABLE ROW LEVEL SECURITY;" -ForegroundColor Green
Write-Host "ALTER TABLE cigarettes ENABLE ROW LEVEL SECURITY;" -ForegroundColor Green
Write-Host "ALTER TABLE objectifs ENABLE ROW LEVEL SECURITY;" -ForegroundColor Green
Write-Host "ALTER TABLE journal_notes ENABLE ROW LEVEL SECURITY;" -ForegroundColor Green
