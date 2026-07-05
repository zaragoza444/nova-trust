# Nova Network Foundation

## Network Identity

- Primary network name: `Nova One`
- Primary chain ID: `22016`
- Paired world network: `NRW World`
- Paired world chain ID: `33001`
- Z Online Bank world network: `Z Blockchain`
- Z Online Bank world chain ID: `44002`
- Consensus: `QBFT`
- Chain family: permissioned EVM
- Primary use case: all-in-one digital finance platform spanning settlement, asset tokenization, wallet operations, treasury control, and regulated participant management
- Environments: `local`, `uat`, `prod`

## Validator Topology

Nova starts with a consortium validator model:

- `4` validator nodes for deterministic finality and fault tolerance
- `2` RPC/read nodes for explorer and wallet traffic
- `1` bootnode for discovery coordination
- optional `1` backup validator per consortium member in production

Validator membership should be restricted to approved institutional operators. Every validator change must pass through a formal governance workflow with dual approval and auditable change records.

## Governance Baseline

- Validator admission requires legal onboarding, key ceremony completion, IP allowlisting, and signed operating standards.
- Contract admin roles must be separated from validator operator roles.
- Emergency powers must be time-limited and logged on-chain where possible.
- All privileged actions must feed immutable audit records plus off-chain SIEM logs.

## Environment Strategy

### Local

- Runs on Docker Compose with fixed validator identities
- uses demo treasury, settlement, and compliance accounts
- supports seeded explorer data and mocked external compliance decisions

### UAT

- mirrors production topology with lower capacity
- uses non-production KMS/HSM boundaries
- validates upgrade runbooks, backup tests, and business approval flows

### Production

- dedicated validator operators with separated infra accounts
- mandatory KMS-backed signing, observability, WAF, VPN or private ingress, and incident paging
- full backup, restore, replay, and disaster-recovery rehearsals

## Security Baseline

- privileged keys stored in HSM or cloud KMS, never in application config
- RPC endpoints segmented into public-read, partner-read, and admin-private classes
- contract roles isolated into `SUPER_ADMIN`, `COMPLIANCE_ADMIN`, `TREASURY_OPERATOR`, `ASSET_ISSUER`, `AUDITOR`
- all admin workflows require authentication plus role checks, with maker-checker approval for high-risk actions
- every deployment must produce signed artifacts, config checksums, and an operator change log

## Gas and Policy Defaults

- zero or near-zero gas for approved internal workflows in controlled environments
- production gas schedule should still meter usage for anomaly detection and abuse control
- contract size, deployment authority, and RPC method exposure should be explicitly allowlisted
- native-coin liquidity should use the deployed `WNOVA` wrapper so AMM routers can interact with an ERC-20 surface
- regulated settlement liquidity venues must be approved in `ComplianceRegistry` before pools or routers can receive settlement-token transfers

## Data and Reporting Baseline

- explorer must index blocks, transactions, addresses, validator state, asset issuance, compliance actions, and treasury movements
- operational dashboards must expose settlement volume, failed transfers, validator health, bridge readiness, and governance changes
- reporting data must be replayable from chain events and signed operator records
