param(
    [string]$ComposeFile = "..\\docker-compose.yml"
)

Write-Host "Starting Nova local QBFT network..."
Write-Host "Before production use, replace placeholder validator enodes and keys."

docker compose -f $ComposeFile up -d

Write-Host "Nova network requested. Run .\\check-health.ps1 after startup."
