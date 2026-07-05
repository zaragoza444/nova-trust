# Nova Security Controls

## Identity and Access

- staff and operator access must flow through SSO with MFA
- privileged application roles map to chain roles, but never share the same keys
- sensitive actions require maker-checker approvals and immutable audit capture

## Role Model

- `SUPER_ADMIN`: emergency controls, contract administration, policy approval
- `COMPLIANCE_ADMIN`: onboarding, freeze, sanctions, and transfer policy management
- `TREASURY_OPERATOR`: settlement mint, burn, rebalance proposal creation
- `ASSET_ISSUER`: create and manage tokenized asset programs
- `AUDITOR`: view audit exports and attest event streams

## Key Management

- validator and treasury signing keys must live in HSM or cloud KMS
- deploy keys must be separated by environment and rotated on a fixed schedule
- test and development keys must never be promoted into UAT or production
- Chain 138 production administration should use the local Safe registry at `config/compliance/gnosis-safe-chain138-deployed.v1.json`
- `OMNL Admin Safe` (`0xf1f77bcce4646ffe14ba4c7fad53a11c57edce67`) is the preferred owner for privileged admin roles
- `OMNL Vault Recovery Safe` (`0xeC5Da3249c896733b06fc6904488Fdd24b06054d`) is reserved for vault recovery and emergency treasury operations

## Infrastructure Controls

- private network paths for validators and admin APIs
- WAF and rate limiting on any public explorer surface
- signed artifacts and reproducible deployment manifests
- continuous vulnerability scanning across containers and dependencies

## Recovery Controls

- chain state backups and replay validation on a scheduled cadence
- database point-in-time recovery for indexer and reporting stores
- quarterly disaster-recovery exercise covering node loss, key compromise, and data restore
