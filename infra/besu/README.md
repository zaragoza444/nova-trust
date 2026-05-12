# Nova Besu Infrastructure

This directory defines the local and production-oriented operational shape of the `Nova` permissioned EVM network.

## Local Topology

- `validator-1` to `validator-4`: QBFT validators
- `rpc-1` and `rpc-2`: public and internal read/write RPC nodes
- `bootnode`: peer discovery coordination

## Files

- `config/genesis.json`: genesis block and QBFT validator configuration
- `config/permissions_config.toml`: node and account permissioning policies
- `config/static-nodes.json`: fixed peer relationships for local deterministic startup
- `docker-compose.yml`: local network topology
- `network.env.example`: environment variables for node startup
- `scripts/init-network.ps1`: local initialization guidance
- `scripts/check-health.ps1`: RPC and peer health checks

## Production Notes

- move validator keys into HSM or KMS-backed workflows before production
- separate public RPC ingress from admin RPC access
- pin node images and enforce signed deployment manifests
- mirror logs and metrics to central observability before admitting transaction traffic
