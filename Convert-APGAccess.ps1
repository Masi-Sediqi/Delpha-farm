param(
  [Parameter(Mandatory=$true)][string]$AccessFile,
  [string]$OutputFile = ""
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$source = (Resolve-Path -LiteralPath $AccessFile).Path
if ([IO.Path]::GetExtension($source).ToLowerInvariant() -notin @('.accdb','.accde')) { throw 'Only ACCDB and ACCDE are supported.' }
if (-not $OutputFile) { $OutputFile = Join-Path (Split-Path -Parent $source) ('APG-import-' + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.json') }
if (Test-Path -LiteralPath $OutputFile) { throw 'Output exists. Specify a new OutputFile.' }
$node = Get-Command node -ErrorAction Stop
$raw = Join-Path $env:TEMP ('apg-raw-' + [guid]::NewGuid().ToString('N') + '.json')
try {
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $root 'transport-backend\access-export.ps1') -DatabasePath $source | Out-File -LiteralPath $raw -Encoding utf8
  if ($LASTEXITCODE -ne 0) { throw 'Microsoft Access export failed. Install matching Access Runtime (32/64 bit).' }
  & $node.Source (Join-Path $root 'tools\map-access.mjs') $raw $OutputFile
  if ($LASTEXITCODE -ne 0) { throw 'Conversion failed. No server data was changed.' }
  Write-Host 'SUCCESS: JSON created. No data uploaded.' -ForegroundColor Green
} finally { Remove-Item -LiteralPath $raw -Force -ErrorAction SilentlyContinue }
