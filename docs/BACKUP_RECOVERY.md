# Backup and Recovery Runbook

The system contains medical, personal, company, audit, and authentication data. Backups must be encrypted, access-controlled, and stored off-host.

## Backup scope

- Production database
- `storage/app/private`
- Required `storage/app/public` uploads, including signatures and company logos
- Environment configuration and encryption keys stored in a secrets manager
- ML models and source datasets required to reproduce forecasts
- Deployed source revision and dependency lock files

Do not treat cache, compiled assets, logs, sessions, or queue tables as the only copy of business data.

## Schedule and retention

The system owner must approve an RPO and RTO. A starting policy is daily full backups plus database point-in-time recovery where supported, with daily, weekly, and monthly retention tiers. Backup jobs must alert on failure.

## Database procedures

For MySQL, use a transaction-consistent backup mechanism such as `mysqldump --single-transaction` or the managed database provider's snapshot/PITR service. Do not place credentials directly in shell history.

For SQLite, prevent writes or use SQLite's online backup API. Copying a live database file with an ordinary filesystem copy is not an approved consistency guarantee.

## File consistency

Record the database backup time and back up persistent uploaded files from the same recovery window. Store checksums and encrypt the resulting archive before transferring it off-host.

## Restore drill

1. Create an isolated environment with no outbound email or OAuth callbacks.
2. Restore the database, private files, public uploads, application key, and matching release.
3. Run database integrity and foreign-key checks.
4. Verify logins, role restrictions, appointments, clinical documents, reports, imports, downloads, and audit records.
5. Record elapsed recovery time, data-loss window, failures, and corrective actions.
6. Destroy the isolated copy securely after approval.

Run and document a restore drill before launch and at a recurring interval. A backup is not considered verified until restoration succeeds.
