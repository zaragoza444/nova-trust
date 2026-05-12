param(
    [string]$RpcUrl = "http://localhost:8545"
)

$payload = @{
    jsonrpc = "2.0"
    method = "net_peerCount"
    params = @()
    id = 1
} | ConvertTo-Json -Depth 4

try {
    $response = Invoke-RestMethod -Uri $RpcUrl -Method Post -ContentType "application/json" -Body $payload
    Write-Host "Nova RPC reachable at $RpcUrl"
    Write-Host "Peer count:" $response.result
}
catch {
    Write-Error "Failed to reach Nova RPC at $RpcUrl. $_"
    exit 1
}
