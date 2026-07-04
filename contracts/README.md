# Nova Contracts

This package contains the first-pass contract suite for `Nova Trust Digital Finance`.

## Modules

- `RoleManager.sol`: shared role registry and administrative modifiers
- `IdentityRegistry.sol`: KYC/KYB participant records
- `ComplianceRegistry.sol`: sanctions, freeze, jurisdiction, and transfer policy checks
- `NovaSettlementToken.sol`: regulated settlement token with mint, burn, and transfer enforcement
- `WrappedChain138Token.sol`: W138 wrapper for using the native Chain 138 coin in ERC-20 liquidity pools
- `NovaAssetFactory.sol`: tokenized asset issuance with issuer-level metadata
- `TreasuryController.sol`: maker-checker treasury workflows for mint, redeem, and rebalance actions
- `AuditEvents.sol`: immutable audit event ledger for off-chain and on-chain traceability

## Intended Flow

1. Deploy `RoleManager`
2. Deploy `IdentityRegistry`
3. Deploy `ComplianceRegistry` with the identity registry address
4. Deploy `NovaSettlementToken`
5. Deploy `WrappedChain138Token`
6. Deploy `NovaAssetFactory`
7. Deploy `TreasuryController`
8. Grant operational roles to approved service accounts and admin multisigs

Production deployments should replace direct EOAs with multisigs, service identities, and HSM-backed signing policies.

## Chain 138 Liquidity Pools

Issued asset tokens from `NovaAssetFactory` implement the ERC-20 transfer and approval methods required by Uniswap-style routers. An asset such as `M1FIAT` can be paired directly with `W138` after the treasury approves the router and supplies both sides of the pool.

The regulated settlement token remains compliance-gated. To support settlement-token liquidity without allowing arbitrary contract transfers, a compliance admin should call `setLiquidityVenue(poolOrRouter, true)` for approved DEX venues. Transfers involving that venue still reject sanctioned, frozen, or ineligible user accounts.
