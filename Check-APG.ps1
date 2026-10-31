param([string]$ProjectPath = 'D:\Delpha-farm', [string]$BaseUrl = 'http://127.0.0.1:5000')
$ErrorActionPreference = 'Continue'
Write-Host 'APG Phase 7 - READ ONLY checks' -ForegroundColor Cyan
if (-not (Test-Path $ProjectPath)) { throw "Project path not found: $ProjectPath" }
Push-Location $ProjectPath
try {
  Write-Host '1. Node and frontend compile checks'
  node --check transport-backend/server.js
  if ($LASTEXITCODE -ne 0) { Write-Warning 'Backend syntax failed' }
  npm run build:production
  if ($LASTEXITCODE -ne 0) { Write-Warning 'Production build failed' }
  Write-Host '2. Environment configuration (nonsecret flags only)'
  $envFiles = '.env', '.env.production'
  foreach ($file in $envFiles) {
    if (Test-Path $file) {
      $vars = Get-Content $file | Where-Object { $_ -match '^VITE_(APP_MODE|USE_BROWSER_STORAGE|API_ROOT)=' }
      Write-Host "[$file]"; $vars | ForEach-Object { Write-Host $_ }
    }
  }
  Write-Host '3. Backend health'
  try {
    $health = Invoke-RestMethod "$BaseUrl/api/health" -TimeoutSec 8
    Write-Host ('Health: ' + ($health | ConvertTo-Json -Compress))
    if ($health.storage -ne 'postgresql') { Write-Warning 'Backend is not in PostgreSQL mode' }
  } catch { Write-Warning ('Backend health failed: ' + $_.Exception.Message) }
  Write-Host '4. Public authentication setup (safe read-only)'
  try {
    $status = Invoke-RestMethod "$BaseUrl/api/auth/status" -TimeoutSec 8
    Write-Host ('Auth setup: ' + ($status | ConvertTo-Json -Compress))
  } catch { Write-Warning ('Auth status failed: ' + $_.Exception.Message) }
  Write-Host '5. Auth protection - request without cookie should not reveal data'
  try {
    $res = Invoke-WebRequest "$BaseUrl/api/collections/suppliers" -TimeoutSec 8
    Write-Warning "Unexpected unauthenticated HTTP $($res.StatusCode)"
  } catch {
    $statusCode = [int]$_.Exception.Response.StatusCode
    if ($statusCode -in @(401,403)) { Write-Host "Protected: HTTP $statusCode" -ForegroundColor Green }
    else { Write-Warning "Unexpected result: HTTP $statusCode" }
  }
  Write-Host '6. Source inspection: prohibited data persistence references (manual review required)'
  Get-ChildItem src -Recurse -File -Include *.js,*.jsx,*.ts,*.tsx |
    Select-String -Pattern 'indexedDB|localStorage\.setItem' |
    Select-Object -First 40 Path,LineNumber,Line | Format-Table -AutoSize
  Write-Host 'Finished. No data writes or migrations performed.' -ForegroundColor Cyan
} finally { Pop-Location }
