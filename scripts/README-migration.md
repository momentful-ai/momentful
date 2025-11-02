# Supabase Project Migration Guide

This guide explains how to migrate your Supabase project from one account to another using the migration script.

## Overview

The migration script (`migrate-supabase-project.js`) applies all database migrations from your local `supabase/migrations/` directory to a new Supabase project. This is useful when:

- Moving projects between Supabase accounts
- Creating a fresh copy of your database schema
- Setting up a new environment with the same schema

## Prerequisites

1. **Supabase CLI installed** - Available in `bin/supabase` or install globally
2. **Authenticated with Supabase CLI** - Run `./bin/supabase login` or `supabase login`
3. **Access to both projects** - You need admin access to both the old and new projects
4. **New project created** - Create a new Supabase project in your target account

## Usage

You can use either the Node.js script or the Shell script:

### Option 1: Node.js Script (Recommended)

**Method 1: Command Line Arguments**

```bash
node scripts/migrate-supabase-project.js \
  --old-project-id <old-project-id> \
  --old-anon-key <old-anon-key> \
  --new-project-id <new-project-id> \
  --new-anon-key <new-anon-key>
```

**Method 2: Environment Variables**

```bash
OLD_PROJECT_ID=<old-id> \
OLD_ANON_KEY=<old-key> \
NEW_PROJECT_ID=<new-id> \
NEW_ANON_KEY=<new-key> \
node scripts/migrate-supabase-project.js
```

**Method 3: NPM Script**

```bash
OLD_PROJECT_ID=<old-id> \
OLD_ANON_KEY=<old-key> \
NEW_PROJECT_ID=<new-id> \
NEW_ANON_KEY=<new-key> \
npm run migrate:supabase
```

### Option 2: Shell Script

```bash
./scripts/migrate-supabase-project.sh \
  <old-project-id> <old-anon-key> \
  <new-project-id> <new-anon-key>
```

Or with environment variables:

```bash
export OLD_PROJECT_ID=<old-id>
export OLD_ANON_KEY=<old-key>
export NEW_PROJECT_ID=<new-id>
export NEW_ANON_KEY=<new-key>
./scripts/migrate-supabase-project.sh
```

### Example

```bash
node scripts/migrate-supabase-project.js \
  --old-project-id abcdefghijklmnop \
  --old-anon-key eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... \
  --new-project-id qrstuvwxyz123456 \
  --new-anon-key eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## What the Script Does

1. **Reads all migrations** - Scans `supabase/migrations/` directory
2. **Verifies old project** - (Optional) Checks connection to old project
3. **Links to new project** - Uses Supabase CLI to link to the new project
4. **Applies migrations** - Runs `supabase db push --include-all` to apply all migrations
5. **Verifies migration** - Checks that the migration completed successfully

## Getting Your Project Credentials

### Project ID
- Found in your Supabase project dashboard URL: `https://app.supabase.com/project/<project-id>`
- Or in Project Settings → General → Reference ID

### Anon Key
- Found in Project Settings → API → Project API keys → `anon` `public`
- **Note**: This is safe to use in client-side code, but keep it secure

## Step-by-Step Process

### 1. Authenticate with Supabase CLI

```bash
./bin/supabase login
# or
supabase login
```

### 2. Create a New Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in project details
4. Copy the new project ID and anon key

### 3. Run the Migration Script

```bash
node scripts/migrate-supabase-project.js \
  --old-project-id <old-id> \
  --old-anon-key <old-key> \
  --new-project-id <new-id> \
  --new-anon-key <new-key>
```

### 4. Update Environment Variables

After migration, update your `.env` or `.env.local`:

```bash
VITE_SUPABASE_URL=https://<new-project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<new-anon-key>
```

### 5. Test Your Application

Run your application and verify it works with the new project:

```bash
npm run dev
```

## Troubleshooting

### Error: "Failed to link to new project"

**Solution:**
- Make sure you're authenticated: `./bin/supabase login`
- Verify you have access to the new project
- Check that the project ID is correct

### Error: "Migration conflicts"

**Solution:**
- The new project should be empty (fresh project)
- If migrations already exist, you may need to reset the project or use `--include-all` flag

### Error: "Foreign key constraint violation"

**Solution:**
- Ensure migrations are applied in order
- Check that all prerequisite tables exist
- Review migration files for dependencies

### Script fails silently

**Solution:**
- Check that all migration files are valid SQL
- Verify Supabase CLI is working: `./bin/supabase --version`
- Run with more verbose output if needed

## Important Notes

⚠️ **This script only migrates the database schema (migrations). It does NOT:**

- Migrate data (rows in tables)
- Migrate storage buckets or files
- Migrate authentication users
- Migrate Edge Functions
- Migrate webhooks or other project settings

### Migrating Data (Optional)

If you need to migrate data as well, you'll need to:

1. **Export data from old project:**
   ```bash
   # Use pg_dump or Supabase CLI
   ./bin/supabase db dump --project-ref <old-project-id> > backup.sql
   ```

2. **Import data to new project:**
   ```bash
   # Use psql or Supabase CLI
   ./bin/supabase db reset --project-ref <new-project-id>
   psql -h <new-project-host> -U postgres -d postgres -f backup.sql
   ```

### Migrating Storage

Storage buckets and files need to be migrated separately:

1. Download files from old project storage
2. Upload to new project storage
3. Update storage bucket policies in new project

## Security Best Practices

1. **Never commit credentials** - Use environment variables or a secure secret manager
2. **Use service role key sparingly** - Only for server-side operations
3. **Rotate keys regularly** - Especially after migration
4. **Review RLS policies** - Ensure they're correctly applied in the new project

## Additional Resources

- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)
- [Database Migrations Guide](https://supabase.com/docs/guides/database/migrations)
- [Project Migration Best Practices](https://supabase.com/docs/guides/platform/migrations)

