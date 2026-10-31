param(
  [Parameter(Mandatory=$true)][string]$JsonFile,
  [string]$Server = 'https://delpha.afghanpower.tech',
  [switch]$Commit
)
$ErrorActionPreference = 'Stop'
if (-not $Server.StartsWith('https://')) { throw 'Use HTTPS for authenticated imports.' }
$source = (Resolve-Path -LiteralPath $JsonFile).Path
$data = Get-Content -Raw -Encoding UTF8 -LiteralPath $source
$obj = $data | ConvertFrom-Json
if (-not $obj.collections) { throw 'Missing collections. Convert with Convert-APGAccess.ps1 first.' }
$base = $Server.TrimEnd('/')
$cred = Get-Credential -Message 'Enter your APG Full Admin email and password (not stored)'
$plain = $cred.GetNetworkCredential().Password
try {
  $payload = @{email=$cred.UserName; password=$plain} | ConvertTo-Json -Compress
  $login = Invoke-RestMethod -Uri "$base/api/auth/login" -Method Post -ContentType 'application/json' -Body $payload -SessionVariable session
} finally { $plain = $null; $payload = $null }
if ($login.user.role -ne 'Admin') { throw 'Full Admin required. Nothing was imported.' }
Write-Host 'Checking import preview. This does not modify PostgreSQL.'
$preview = Invoke-RestMethod -Uri "$base/api/import/json?preview=true" -Method Post -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($data)) -WebSession $session -TimeoutSec 300
$preview.report | ConvertTo-Json -Depth 8 | Write-Host
if ($preview.conflicts.Count -gt 0) { throw 'Conflicts found. No data imported.' }
if (-not $Commit) { Write-Host 'PREVIEW ONLY. No changes to PostgreSQL. Run again with -Commit if approved.' -ForegroundColor Green; exit 0 }
$answer = Read-Host 'Type IMPORT to commit this backup to PostgreSQL'
if ($answer -cne 'IMPORT') { Write-Host 'Cancelled. No changes.'; exit 0 }
$result = Invoke-RestMethod -Uri "$base/api/import/json" -Method Post -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($data)) -WebSession $session -TimeoutSec 300
$result | ConvertTo-Json -Depth 8
