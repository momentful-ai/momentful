# Database Update Guide

This guide outlines the steps to update the remote Supabase database schema using migrations.

## Prerequisites

- Supabase CLI installed (available in `bin/supabase`)
- Project linked to remote Supabase instance
- Access to the remote database

## Steps to Update Database Schema

### 1. Create a Migration File

Create a new migration file in `supabase/migrations/` with a timestamp prefix:

```bash
# Format: YYYYMMDDHHMMSS_description.sql
# Example: 20250101000000_remove_source_asset_id_from_edited_images.sql
```

**Example migration file:**
```sql
-- Remove source_asset_id column from edited_images table
-- This column is no longer needed as the image URL is sufficient

-- Drop the index first
DROP INDEX IF EXISTS idx_edited_images_source_asset;

-- Drop the column
ALTER TABLE edited_images DROP COLUMN IF EXISTS source_asset_id;
```

### 2. Update TypeScript Interfaces

Update the relevant TypeScript interfaces to reflect the schema changes:

- **`src/lib/database.ts`** - Update interface definitions for database operations
- **`src/types/index.ts`** - Update shared type definitions

Remove any references to the dropped column from these interfaces.

### 3. Update Test Files

Update all test files that reference the changed schema:

- Unit tests (`src/__tests__/`)
- E2E test fixtures (`tests/e2e/fixtures/`)

Remove or update any mock data and assertions that reference the removed column.

### 4. Verify Supabase Project Link

Check that your project is linked to the remote database:

```bash
./bin/supabase projects list
```

You should see your project listed with a `●` indicator showing it's linked.

### 5. Push Migrations to Remote Database

Push the new migration(s) to the remote database:

```bash
# For migrations that come after existing ones (standard case)
./bin/supabase db push

# For migrations that need to be inserted before the last migration on remote
# (when migration timestamp is earlier than existing remote migrations)
./bin/supabase db push --include-all
```

The CLI will:
- Connect to the remote database
- Show which migrations will be applied
- Prompt for confirmation
- Apply the migrations in order

### 6. Verify Migration Success

After pushing, verify the migration was successful:

- Check the Supabase dashboard to confirm schema changes
- Run your application and verify it works with the new schema
- Check application logs for any errors

## Important Notes

### Migration Ordering

Migrations are applied in chronological order based on their timestamp prefix. If you create a migration with an earlier timestamp than existing remote migrations, you'll need to use the `--include-all` flag.

### Safety Checks

- Always review migration SQL before pushing
- Test migrations locally first if possible
- Use `IF EXISTS` clauses to prevent errors if objects don't exist
- Backup important data before destructive operations (DROP, ALTER, etc.)

### Rollback

If you need to rollback a migration:

1. Create a new migration that reverses the changes
2. Push it using the same process
3. Or manually revert the changes through the Supabase dashboard

## Example: Complete Workflow

```bash
# 1. Create migration file
touch supabase/migrations/20250101000000_remove_column.sql

# 2. Write migration SQL (edit the file)
# ... SQL code ...

# 3. Update TypeScript code
# ... edit src/lib/database.ts, src/types/index.ts ...

# 4. Update tests
# ... edit test files ...

# 5. Verify link
./bin/supabase projects list

# 6. Push to remote
./bin/supabase db push --include-all

# 7. Verify success
# Check Supabase dashboard and test application
```

## Troubleshooting

### "command not found" error
- Use `./bin/supabase` instead of `supabase` if the CLI is in the `bin/` directory
- Or ensure Supabase CLI is installed globally

### "Found local migration files to be inserted before the last migration"
- Use the `--include-all` flag as suggested
- Or rename the migration with a later timestamp

### Migration conflicts
- Ensure all team members have pulled the latest migrations
- Coordinate schema changes to avoid conflicts
- Use descriptive migration names

## Additional Resources

- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)
- [Supabase Migration Guide](https://supabase.com/docs/guides/database/migrations)

