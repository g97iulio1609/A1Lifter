# Incident Response Runbook

## Overview
This runbook provides procedures for responding to common incidents in the A1Lifter application.

## Severity Levels

- **P0 (Critical)**: Complete outage or data loss
- **P1 (High)**: Major feature broken, significant user impact
- **P2 (Medium)**: Minor feature broken, limited user impact
- **P3 (Low)**: Cosmetic issue, no functional impact

## Emergency Contacts

- **On-call Engineer**: [Your Phone/Slack]
- **Database Admin**: [DBA Contact]
- **Infrastructure Lead**: [Infra Contact]
- **Product Owner**: [PO Contact]

## Common Incidents

### 1. Application is Down (P0)

**Symptoms**: Health check failing, 500 errors, no response

**Steps**:
1. Check application status:
   ```bash
   curl https://a1lifter.app/api/health
   curl https://a1lifter.app/api/ready
   ```

2. Check Vercel deployment status:
   - Visit Vercel dashboard
   - Check latest deployment logs

3. Check database connectivity:
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```

4. If database is down:
   - Check Supabase dashboard
   - Verify connection limits not exceeded
   - Check for ongoing maintenance

5. Rollback if needed:
   ```bash
   # Via Vercel dashboard or CLI
   vercel rollback <deployment-url>
   ```

6. **Communication**:
   - Post in #incidents Slack channel
   - Update status page
   - Notify affected users

### 2. Database Migration Failed (P0)

**Symptoms**: Migration error in CI/CD, schema mismatch

**Steps**:
1. Check migration status:
   ```bash
   npx prisma migrate status
   ```

2. Review migration logs in GitHub Actions

3. If migration is partially applied:
   ```bash
   # Mark as resolved if manually fixed
   npx prisma migrate resolve --applied "migration_name"
   
   # Or roll back if needed
   npx prisma migrate resolve --rolled-back "migration_name"
   ```

4. For production:
   - Take database snapshot first
   - Review SQL manually
   - Apply with transaction:
     ```bash
     BEGIN;
     -- Migration SQL here
     COMMIT; -- or ROLLBACK if issues
     ```

5. Test application after resolution

### 3. Authentication Broken (P1)

**Symptoms**: Users cannot sign in, JWT errors, session issues

**Steps**:
1. Verify environment variables:
   ```bash
   # Check these are set correctly
   echo $NEXTAUTH_SECRET
   echo $NEXTAUTH_URL
   ```

2. Check NextAuth logs in application

3. Test with different users/roles

4. Verify database connectivity to `user_sessions` and `accounts` tables

5. If OAuth issue:
   - Check Google/provider credentials
   - Verify callback URLs
   - Check provider status page

6. Clear sessions if corrupted:
   ```sql
   DELETE FROM user_sessions WHERE expires < NOW();
   ```

### 4. Rate Limiting Issues (P2)

**Symptoms**: Legitimate users blocked, 429 errors

**Steps**:
1. Check rate limit logs

2. Identify affected IPs/users

3. Temporarily increase limits if needed:
   ```typescript
   // In src/lib/rate-limit.ts
   export const RateLimits = {
     auth: {
       maxRequests: 10, // Increased from 5
       windowMs: 15 * 60 * 1000,
     },
   }
   ```

4. Deploy fix

5. Clear rate limit entries:
   ```typescript
   // If using Redis: FLUSHDB
   // If in-memory: restart application
   ```

### 5. Slow Database Queries (P2)

**Symptoms**: High response times, timeouts

**Steps**:
1. Identify slow queries:
   ```sql
   SELECT query, calls, mean_exec_time, max_exec_time
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

2. Check for missing indexes:
   ```sql
   SELECT schemaname, tablename, indexname
   FROM pg_indexes
   WHERE schemaname = 'public';
   ```

3. Add indexes if needed:
   ```sql
   CREATE INDEX CONCURRENTLY idx_table_column ON table(column);
   ```

4. Optimize query or add caching

5. Monitor impact

### 6. Memory Leak / High Resource Usage (P1)

**Symptoms**: Increasing memory usage, crashes

**Steps**:
1. Check Vercel metrics dashboard

2. Review application logs for patterns

3. Check for:
   - Unclosed database connections
   - Large in-memory caches
   - Memory-intensive operations

4. Restart affected instances

5. Deploy fix with proper cleanup

6. Monitor resource usage

## Rollback Procedure

### Quick Rollback (Vercel)
```bash
# Find recent deployments
vercel list

# Rollback to previous
vercel rollback <deployment-url>
```

### Database Rollback
⚠️ **Caution**: Database rollbacks are risky

1. Restore from backup:
   ```bash
   # Via Supabase dashboard or CLI
   supabase db restore --backup-id <backup-id>
   ```

2. Or manually revert migration:
   ```bash
   npx prisma migrate resolve --rolled-back "migration_name"
   ```

## Monitoring & Alerts

### Key Metrics to Watch
- Health check endpoint uptime
- API response times (p50, p95, p99)
- Error rates
- Database connection pool usage
- Active users

### Setting Up Alerts
```yaml
# Example alert rules
alerts:
  - name: High Error Rate
    condition: error_rate > 5%
    severity: P1
    
  - name: Slow Response Time
    condition: p95_response_time > 2s
    severity: P2
    
  - name: Database Connection Pool Full
    condition: db_connections > 90%
    severity: P0
```

## Post-Incident

### After Resolution
1. **Document** what happened in incident log
2. **Root cause analysis** - why did it happen?
3. **Action items** - what can prevent recurrence?
4. **Update runbook** with lessons learned
5. **Communicate** resolution to stakeholders

### Incident Report Template
```markdown
## Incident Report: [Title]

**Date**: YYYY-MM-DD
**Duration**: X hours
**Severity**: PX
**Status**: Resolved

### Summary
[Brief description]

### Timeline
- HH:MM - Incident detected
- HH:MM - Team notified
- HH:MM - Root cause identified
- HH:MM - Fix deployed
- HH:MM - Incident resolved

### Root Cause
[Detailed analysis]

### Impact
- Users affected: X
- Revenue impact: $X
- Data loss: Yes/No

### Resolution
[What was done to fix]

### Prevention
- [ ] Action item 1
- [ ] Action item 2

### Lessons Learned
[What we learned]
```

## Useful Commands

### Database
```bash
# Check connection
psql $DATABASE_URL -c "SELECT version();"

# Check active connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Kill long-running queries
psql $DATABASE_URL -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'active' AND query_start < NOW() - INTERVAL '5 minutes';"
```

### Application
```bash
# Check logs (Vercel)
vercel logs <deployment-url>

# Test API endpoints
curl -X GET https://a1lifter.app/api/health
curl -X GET https://a1lifter.app/api/ready

# Test with auth
curl -H "Authorization: Bearer $TOKEN" https://a1lifter.app/api/athletes
```

### Prisma
```bash
# Check migration status
npx prisma migrate status

# Generate client
npx prisma generate

# Open Prisma Studio
npx prisma studio
```

## Resources

- [Vercel Dashboard](https://vercel.com/dashboard)
- [Supabase Dashboard](https://app.supabase.com)
- [GitHub Repository](https://github.com/g97iulio1609/A1Lifter)
- [Documentation](./docs/)
## Observability Notes (P2 groundwork)

- Use `src/lib/observability.ts` helpers:
  - `initObservability()` to initialize lightweight tracking (no external SDKs yet)
  - `captureException(err, { tags, extra })` to record errors with context
  - `captureMessage(message, { tags, extra })` for important warnings
- Example integration added in `src/app/api/dashboard/stats/route.ts`.
- Future: wire real providers (e.g., Sentry) behind these helpers.
