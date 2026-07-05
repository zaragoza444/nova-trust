# Z Block Chain Besu Infrastructure

Production-oriented Besu layout for **Z Block Chain** (chain ID `44002`), aligned with NRW World (`33001`) and Nova One (`22016`).

## Topology

- `validator-1` to `validator-4`: QBFT validators
- `rpc-1` and `rpc-2`: Z Online Bank and partner RPC nodes
- `bootnode`: peer discovery

## Files

- `config/genesis.json`: Z Block Chain genesis (chain ID 44002)
- `network.env.example`: RPC and node startup variables

## Z Online Bank integration

- Native coin: `Z`
- Wrapped liquidity surface: `WZ`
- Tradable tokens: `M1FIAT`, `ACX`, `SHIVA`
- Liquidity pools: `M1FIAT/WZ`, `ACX/WZ`, `SHIVA/WZ`

Bootstrap contracts on Z Block Chain:

```bash
source /tmp/z-block-chain-production.env
npm run setup:z-block-chain:preflight --workspace @nova/contracts
npm run setup:z-block-chain --workspace @nova/contracts
```

Local validation:

```bash
npm run setup:z-block-chain:local --workspace @nova/contracts
```
