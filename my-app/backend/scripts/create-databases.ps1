$ErrorActionPreference = "Stop"

$hostName = $env:POSTGRES_HOST
if (-not $hostName) { $hostName = "127.0.0.1" }

$port = $env:POSTGRES_PORT
if (-not $port) { $port = "5432" }

$user = $env:POSTGRES_USER
if (-not $user) { $user = "postgres" }

$password = $env:POSTGRES_PASSWORD
if (-not $password) { $password = "123456" }

$dbName = $env:POSTGRES_DB
if (-not $dbName) { $dbName = "flexshift" }

$shadowDbName = $env:POSTGRES_SHADOW_DB
if (-not $shadowDbName) { $shadowDbName = "flexshift_shadow" }

$psql = Get-Command psql -ErrorAction SilentlyContinue

if (-not $psql) {
  throw "PostgreSQL CLI (psql) was not found in PATH. Install PostgreSQL client tools to run db:create."
}

$env:PGPASSWORD = $password

& $psql.Source -h $hostName -p $port -U $user -d postgres -c "SELECT 'CREATE DATABASE $dbName' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$dbName')\\gexec"
& $psql.Source -h $hostName -p $port -U $user -d postgres -c "SELECT 'CREATE DATABASE $shadowDbName' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$shadowDbName')\\gexec"

Write-Host "Verified databases: $dbName, $shadowDbName"
