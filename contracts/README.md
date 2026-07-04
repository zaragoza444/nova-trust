# Nova Contracts

This package contains the first-pass contract suite for `Nova Trust Digital Finance`.

## Modules

- `RoleManager.sol`: shared role registry and administrative modifiers
- `IdentityRegistry.sol`: KYC/KYB participant records
- `ComplianceRegistry.sol`: sanctions, freeze, jurisdiction, and transfer policy checks
- `NovaSettlementToken.sol`: regulated settlement token with mint, burn, and transfer enforcement
- `WrappedNovaOneToken.sol`: WNOVA wrapper for using the native Nova One coin in ERC-20 liquidity pools
- `NovaAssetFactory.sol`: tokenized asset issuance with issuer-level metadata
- `NovaLiquidityPool.sol`: constant-product M1FIAT/WNOVA pool for direct swap and liquidity bootstrap
- `TreasuryController.sol`: maker-checker treasury workflows for mint, redeem, and rebalance actions
- `AuditEvents.sol`: immutable audit event ledger for off-chain and on-chain traceability

## Intended Flow

1. Deploy `RoleManager`
2. Deploy `IdentityRegistry`
3. Deploy `ComplianceRegistry` with the identity registry address
4. Deploy `NovaSettlementToken`
5. Deploy `WrappedNovaOneToken`
6. Deploy `NovaAssetFactory`
7. Deploy `TreasuryController`
8. Grant operational roles to approved service accounts and admin multisigs

Production deployments should replace direct EOAs with multisigs, service identities, and HSM-backed signing policies.

## Nova One and NRW World Liquidity

Nova One is the primary settlement chain with chain ID `22016`. NRW World is the world liquidity and bridge chain with chain ID `33001`.

Issued asset tokens from `NovaAssetFactory` implement the ERC-20 transfer and approval methods required by Uniswap-style routers. An asset such as `M1FIAT` can be paired directly with `WNOVA` on Nova One after the treasury approves the router and supplies both sides of the pool.

The regulated settlement token remains compliance-gated. To support settlement-token liquidity without allowing arbitrary contract transfers, a compliance admin should call `setLiquidityVenue(poolOrRouter, true)` for approved DEX venues. Transfers involving that venue still reject sanctioned, frozen, or ineligible user accounts.

## End-to-End Production Bootstrap

`npm run setup:production --workspace @nova/contracts` performs the production bootstrap in one transaction sequence:

1. Verify the RPC is connected to Nova One chain ID `22016`.
2. Deploy the identity, compliance, settlement, WNOVA, asset factory, treasury, audit, and liquidity pool contracts.
3. Grant operational roles to configured accounts.
4. Register the deployer as an eligible treasury participant.
5. Issue `M1FIAT` as a transferable asset token.
6. Wrap native NOVA into `WNOVA`.
7. Add initial `M1FIAT/WNOVA` liquidity and approve the pool as a compliance liquidity venue.

Required environment:

```bash
export NOVA_RPC_URL="https://your-nova-one-rpc"
export NOVA_DEPLOYER_PRIVATE_KEY="0x..."
export NOVA_M1FIAT_SUPPLY="1000000"
export NOVA_M1FIAT_LIQUIDITY="100000"
export NOVA_WNOVA_LIQUIDITY="100"
```

Optional environment:

```bash
export NOVA_EXPECTED_CHAIN_ID="22016"
export NOVA_INITIAL_OWNER="0xOwner"
export NOVA_COMPLIANCE_ADMIN="0xComplianceAdmin"
export NOVA_TREASURY_OPERATOR="0xTreasuryOperator"
export NOVA_ASSET_ISSUER="0xAssetIssuer"
export NOVA_AUDITOR="0xAuditor"
export NOVA_PRODUCTION_BOOTSTRAP_MANIFEST_PATH="./deployments/nova-one-liquidity.json"
```

The deployer wallet must hold enough native NOVA to pay gas and wrap the configured `NOVA_WNOVA_LIQUIDITY`. Do not commit private keys or production manifests containing sensitive endpoint details.

For the one-command bootstrap, leave `NOVA_INITIAL_OWNER`, `NOVA_COMPLIANCE_ADMIN`, and `NOVA_ASSET_ISSUER` unset or set them to the deployer wallet. The script performs role-gated registration, asset issuance, and venue approval with the deployer key, then role transfers can be handled through governance after bootstrap.
