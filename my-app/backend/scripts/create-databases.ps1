$ErrorActionPreference = "Stop"

$adminUrl = $env:POSTGRES_ADMIN_URL

if ($adminUrl) {
  $uri = [System.Uri]$adminUrl
  $hostName = $uri.Host
  $port = if ($uri.Port -gt 0) { $uri.Port } else { 5432 }
  $userInfo = $uri.UserInfo.Split(':', 2)
  $user = [System.Uri]::UnescapeDataString($userInfo[0])
  $password = if ($userInfo.Count -gt 1) {
    [System.Uri]::UnescapeDataString($userInfo[1])
  } else {
    ""
  }
} else {
  $hostName = $env:POSTGRES_HOST
  if (-not $hostName) { $hostName = "127.0.0.1" }

  $port = $env:POSTGRES_PORT
  if (-not $port) { $port = "5432" }

  $user = $env:POSTGRES_USER
  if (-not $user) { $user = "postgres" }

  $password = $env:POSTGRES_PASSWORD
}

if (-not $password) {
  throw "Missing required environment variable POSTGRES_PASSWORD or POSTGRES_ADMIN_URL."
}

$env:PGPASSWORD = $password

$dbName = $env:POSTGRES_DB
if (-not $dbName) { $dbName = "flexshift" }

$shadowDbName = $env:POSTGRES_SHADOW_DB

$psql = Get-Command psql -ErrorAction SilentlyContinue

if (-not $psql) {
  throw "PostgreSQL CLI (psql) was not found in PATH. Install PostgreSQL client tools to run db:create."
}
$databases = @($dbName)

if ($shadowDbName) {
  $databases += $shadowDbName
}

$databases | ForEach-Object {
  & $psql.Source -h $hostName -p $port -U $user -d postgres -c "SELECT 'CREATE DATABASE $_' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$_')\\gexec"
}

Write-Host "Verified databases: $($databases -join ', ')"
