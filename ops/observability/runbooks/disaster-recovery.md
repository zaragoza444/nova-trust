# Nova Disaster Recovery Runbook

## Incident Classes

1. Validator outage
2. RPC cluster degradation
3. Indexer or reporting data corruption
4. Treasury or admin key compromise
5. Compliance workflow outage

## Immediate Response

1. Freeze non-essential privileged operations.
2. Confirm network finality and validator quorum.
3. Notify security, operations, and compliance leads.
4. Snapshot current state for forensic review.

## Recovery Sequence

### Validator Failure

1. remove unhealthy validator from rotation using the governance process
2. restore node from the latest approved backup
3. rejoin only after peer count, sync, and signing health are confirmed

### Indexer Failure

1. isolate the failing ingestion worker
2. restore the database from the latest verified backup if data integrity is compromised
3. replay events from the last trusted block checkpoint
4. compare dashboard metrics against chain truth before reopening reports

### Key Compromise

1. revoke affected credentials and rotate the relevant role mappings
2. freeze treasury and compliance actions if privileged scopes were exposed
3. reissue secrets from KMS or HSM workflows
4. publish an internal incident timeline and remediation record

## Recovery Exit Criteria

- validator quorum restored
- explorer and API data reconciled with chain state
- privileged access rotated and revalidated
- compliance, treasury, and audit stakeholders sign off on reopening operations
