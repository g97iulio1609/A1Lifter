# Database Setup and Migrations

## Overview
This project uses **Prisma** for database management with PostgreSQL on Supabase.

## Migration Strategy
We use **Prisma Migrate** for version-controlled schema changes:
- Development: `prisma migrate dev`
- Production: `prisma migrate deploy`

### Milestone 6 Optimisations

Migration `20251006234000_database_optimizations` introduces composite indexes that specifically target high traffic workflows (live attempts, judge scheduling, inbox triage). Apply the migration with `npm run db:migrate:deploy` to ensure dashboards benefit from the new indexes. See `docs/PERFORMANCE.md` for the detailed index matrix.

### Initial Setup (New Environment)

1. **Set Environment Variables**:
   ```bash
   DATABASE_URL="postgresql://user:password@host:port/database"
   ```

2. **Run Migrations**:
   ```bash
   npm run db:migrate:deploy
   ```

3. **Seed Database** (optional for dev):
   ```bash
   npm run db:seed
   ```

### Creating New Migrations

When you modify `prisma/schema.prisma`:

```bash
# Generate and apply migration
npm run db:migrate

# Or specify a name
npx prisma migrate dev --name add_new_field
```

### Production Deployment

```bash
# Deploy pending migrations (safe for production)
npm run db:migrate:deploy

# Verify schema is up to date
npx prisma migrate status
```

## Row Level Security (RLS)

We use Supabase RLS policies for fine-grained access control.

### Applying RLS Policies

```bash
npm run setup:rls
```

Or manually:
```bash
psql $DATABASE_URL < scripts/setup-rls-policies.sql
```

### RLS Policy Structure

- **Users**: Can view own profile; admins manage all users
- **Events**: Public view for published events; organizers manage own events  
- **Registrations**: Athletes manage own; organizers approve for their events
- **Attempts**: Public view for live events; judges and organizers can modify
- **Notifications**: Users can only view/update their own notifications

See `scripts/setup-rls-policies.sql` for complete policy definitions.

## Common Operations

### Reset Database (⚠️ Destructive)
```bash
npm run db:reset
```

### Prisma Studio (Database GUI)
```bash
npm run db:studio
```

### Generate Prisma Client
```bash
npm run db:generate
```

## Troubleshooting

### Migration Drift
If you see "drift detected" warnings:

1. Check current status:
   ```bash
   npx prisma migrate status
   ```

2. For development, reset and re-apply:
   ```bash
   npm run db:reset
   ```

3. For production, carefully review and resolve:
   ```bash
   npx prisma migrate resolve --help
   ```

### Connection Issues
- Verify `DATABASE_URL` is correct
- Check Supabase project is running
- Ensure firewall allows connections
- For local dev: `supabase start`

## Best Practices

1. **Always create migrations** instead of using `db:push` in production
2. **Test migrations** in staging before production
3. **Backup database** before running migrations in production
4. **Review generated SQL** before applying
5. **Keep migrations small** and focused on single changes
6. **Never edit** applied migrations
7. **Use transactions** for data migrations
8. **Monitor new composite indexes** (`20251006234000_database_optimizations`) with `EXPLAIN ANALYZE` to ensure planners pick the intended paths.

## Schema Conventions

- **ID fields**: Use `cuid()` for unique identifiers
- **Timestamps**: Include `createdAt` and `updatedAt` where applicable
- **Soft delete**: Use `isDeleted` boolean flag
- **Relations**: Always define both sides with proper `onDelete` behavior
- **Indexes**: Add indexes for foreign keys and frequently queried fields

## CI/CD Integration

Migrations run automatically in the deployment pipeline:

```yaml
- name: Run migrations
  run: npm run db:migrate:deploy
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

See `.github/workflows/ci.yml` for complete CI configuration.
