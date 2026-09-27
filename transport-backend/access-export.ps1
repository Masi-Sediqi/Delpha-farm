param([Parameter(Mandatory = $true)][string]$DatabasePath)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)

function Convert-Value($value) {
  if ($null -eq $value -or $value -is [DBNull]) { return $null }
  if ($value -is [DateTime]) { return $value.ToString("yyyy-MM-ddTHH:mm:ss") }
  if ($value -is [byte[]]) { return [Convert]::ToBase64String($value) }
  return $value
}

function Read-Table($database, [string]$name) {
  $rows = @()
  $recordset = $database.OpenRecordset("SELECT * FROM [$name]")
  while (-not $recordset.EOF) {
    $row = [ordered]@{}
    foreach ($field in $recordset.Fields) {
      $row[$field.Name] = Convert-Value $field.Value
    }
    $rows += [pscustomobject]$row
    $recordset.MoveNext()
  }
  $recordset.Close()
  return $rows
}

$engine = New-Object -ComObject DAO.DBEngine.120
$database = $engine.OpenDatabase($DatabasePath, $false, $true)
$available = @{}
foreach ($table in $database.TableDefs) { $available[$table.Name] = $true }
$wanted = @(
  "ItemsTbl", "ItemCoTbl", "ItemGrpTbl", "ItemMadeInTbl", "AcntsLstTbl",
  "AcntsCurTbl", "SupTypTbl", "CustTypTbl", "PurMTbl", "PurSTbl",
  "SaleMTbl", "SaleSTbl"
)
$result = [ordered]@{}
foreach ($name in $wanted) {
  if ($available.ContainsKey($name)) { $result[$name] = @(Read-Table $database $name) }
}
$database.Close()
$result | ConvertTo-Json -Depth 8 -Compress
