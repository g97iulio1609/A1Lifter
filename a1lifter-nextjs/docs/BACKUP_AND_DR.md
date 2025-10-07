# Backup & Disaster Recovery Playbook

## Objectives

- **Recovery Point Objective (RPO)**: ≤ 1 hour (automated database snapshots + WAL shipping).
- **Recovery Time Objective (RTO)**: ≤ 30 minutes for primary region, ≤ 2 hours for cross-region failover.

## Backup Schedule

| Asset | Frequency | Retention | Notes |
| --- | --- | --- | --- |
| PostgreSQL (Supabase) automated snapshots | Hourly | 7 days | Enable point-in-time recovery. |
| PostgreSQL logical dumps (`pg_dump`) | Daily | 30 days | Store in S3/Backblaze with versioning. |
| Supabase storage buckets | Daily | 30 days | Mirror to cold storage via scheduled job. |
| Environment configuration (`.env.production`) | On change | Infinite | Store encrypted in secret manager. |

## Automation

- Add a GitHub Action (or cron job) that executes `pg_dump --format=custom $DATABASE_URL` and uploads to `s3://a1lifter-backups/$ENVIRONMENT/$DATE.dump`.
- Use object storage lifecycle rules to transition files older than 30 days to Glacier/Coldline.
- Run `scripts/backup/storage-sync.ts` (see sample in `PRODUCTION_DEPLOYMENT.md`) nightly to mirror Supabase storage assets.
- Verify backups weekly by checking checksum reports and successful upload logs.

## Disaster Recovery Procedures

### Database Restore

1. **Assess impact**: determine latest good snapshot and confirm RPO window.
2. **Create staging restore**:
   ```bash
   export RESTORE_URL=postgresql://restore_user:password@restore-host:5432/a1lifter_restore
   pg_restore --clean --if-exists --no-owner \
     --dbname="$RESTORE_URL" \
     s3://a1lifter-backups/production/latest.dump
   ```
3. **Validate data**: run smoke tests (`npm run test:run`) against restore.
4. **Promote**: point Supabase to restored instance or update `DATABASE_URL` secrets to the healthy standby.
5. **Invalidate caches**: run a cache flush (`REDIS_URL=... node -e "require('./dist/lib/redis').disconnectRedis()"`) to avoid stale data.

### Storage Restore

1. Sync latest storage backup from cold storage.
2. Use the Supabase management CLI to re-upload objects or mount them behind the CDN.
3. Confirm checksum parity between restored files and last known good versions.

## Testing & Drills

- **Quarterly**: execute a full failover drill (database + storage) and document lessons learned.
- **Monthly**: restore the most recent snapshot to staging and run automated smoke tests.
- **Post-release**: verify backups succeeded and note artifact IDs in release notes.

## Communication Plan

- Declare incidents in the `#incidents` Slack channel and update the shared status page.
- Provide updates every 15 minutes until service is restored.
- After resolution, publish a post-mortem that includes timeline, root cause, and remediation tasks.

## Quick Reference

- Backup bucket: `s3://a1lifter-backups`
- IAM role with least privilege: `BackupOperator`
- Secrets manager entries: `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `REDIS_URL`
- Cache invalidation command (Redis):
  ```bash
  REDIS_URL=rediss://... tsx scripts/cache/flush.ts
  ```

Maintain this document alongside `docs/RUNBOOK.md` so on-call engineers can quickly enact disaster recovery without tribal knowledge.
