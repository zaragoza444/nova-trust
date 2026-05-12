# Nova Contracts

This package contains the first-pass contract suite for `Nova Trust Digital Finance`.

## Modules

- `RoleManager.sol`: shared role registry and administrative modifiers
- `IdentityRegistry.sol`: KYC/KYB participant records
- `ComplianceRegistry.sol`: sanctions, freeze, jurisdiction, and transfer policy checks
- `NovaSettlementToken.sol`: regulated settlement token with mint, burn, and transfer enforcement
- `NovaAssetFactory.sol`: tokenized asset issuance with issuer-level metadata
- `TreasuryController.sol`: maker-checker treasury workflows for mint, redeem, and rebalance actions
- `AuditEvents.sol`: immutable audit event ledger for off-chain and on-chain traceability

## Intended Flow

1. Deploy `RoleManager`
2. Deploy `IdentityRegistry`
3. Deploy `ComplianceRegistry` with the identity registry address
4. Deploy `NovaSettlementToken`
5. Deploy `NovaAssetFactory`
6. Deploy `TreasuryController`
7. Grant operational roles to approved service accounts and admin multisigs

Production deployments should replace direct EOAs with multisigs, service identities, and HSM-backed signing policies.
