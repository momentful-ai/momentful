#!/usr/bin/env node

/**
 * Supabase Link and Push Script
 *
 * This script links to a specified Supabase project and pushes all migrations.
 *
 * Usage:
 *   node scripts/link-and-push.js --project-id <project-id>
 *
 * Or use environment variable:
 *   SUPABASE_PROJECT_ID=<project-id> node scripts/link-and-push.js
 */

import { execSync } from 'child_process';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, '..');

// Parse command line arguments
export function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    projectId: process.env.SUPABASE_PROJECT_ID,
  };

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];

    switch (key) {
      case '--project-id':
        config.projectId = value;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }

  // Validate required parameters
  if (!config.projectId) {
    console.error('❌ Missing required parameter!\n');
    printHelp();
    process.exit(1);
  }

  return config;
}

export function printHelp() {
  console.log(`
Supabase Link and Push Script

This script links to a specified Supabase project and pushes all migrations.

Usage:
  node scripts/link-and-push.js --project-id <project-id>

Or use environment variable:
  SUPABASE_PROJECT_ID=<project-id> node scripts/link-and-push.js

Options:
  --project-id    Supabase project ID (required)
  --help, -h      Show this help message

Example:
  node scripts/link-and-push.js --project-id abcdefghijklmnop

The script will:
1. Link to the specified project
2. Push all migrations to the project
`);
}

// Execute a command and return output
export function execCommand(command, options = {}) {
  try {
    const output = execSync(command, {
      encoding: 'utf-8',
      cwd: PROJECT_ROOT,
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options,
    });
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout || error.stderr };
  }
}

// Get all migration files
export function getMigrationFiles() {
  const migrationsDir = join(PROJECT_ROOT, 'supabase', 'migrations');
  const files = readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Sort alphabetically (which should be by timestamp)

  return files.map(file => ({
    filename: file,
    path: join(migrationsDir, file),
    timestamp: file.split('_')[0],
  }));
}

// Link to a project using Supabase CLI
export function linkToProject(projectId) {
  console.log(`\n🔗 Linking to project ${projectId}...`);

  // First, try to unlink any existing project (ignore errors)
  execCommand('./bin/supabase unlink', { silent: true });

  // Link to the project (non-interactive)
  // Note: This may prompt for database password if not set in config
  const result = execCommand(`./bin/supabase link --project-ref ${projectId}`, {
    env: {
      ...process.env,
      // Suppress prompts where possible
      SUPABASE_DB_PASSWORD: process.env.SUPABASE_DB_PASSWORD || '',
    },
  });

  if (!result.success) {
    console.error(`\n❌ Failed to link to project ${projectId}`);
    console.error('Possible reasons:');
    console.error('  1. Not authenticated: Run ./bin/supabase login');
    console.error('  2. No access to project: Verify project ID and permissions');
    console.error('  3. Database password required: Set SUPABASE_DB_PASSWORD env var');
    console.error('\nError details:', result.error || result.output);
    return false;
  }

  return true;
}

// Apply all migrations
export function applyMigrations() {
  console.log('\n📦 Pushing migrations to project...');

  // Use db push to apply all pending migrations
  const result = execCommand('./bin/supabase db push');

  return result.success;
}

// Main function
async function linkAndPush() {
  const config = parseArgs();

  console.log('🚀 Starting Supabase Link and Push\n');
  console.log('═'.repeat(50));
  console.log(`Project ID: ${config.projectId}`);
  console.log('═'.repeat(50));

  // Step 1: Get migration files
  console.log('\n📋 Step 1: Reading migration files...');
  const migrations = getMigrationFiles();
  console.log(`   Found ${migrations.length} migration files`);

  // Step 2: Link to project
  console.log('\n📋 Step 2: Linking to project...');
  if (!linkToProject(config.projectId)) {
    console.error('\n❌ Failed to link to project');
    console.error('\n💡 Make sure you:');
    console.error('   1. Are authenticated: ./bin/supabase login');
    console.error('   2. Have access to the project');
    console.error('   3. The project ID is correct');
    process.exit(1);
  }
  console.log('   ✅ Successfully linked to project');

  // Step 3: Apply migrations
  console.log('\n📋 Step 3: Pushing migrations...');
  if (!applyMigrations()) {
    console.error('\n❌ Failed to push migrations');
    console.error('\n💡 Check the error messages above for details');
    process.exit(1);
  }
  console.log('   ✅ All migrations pushed successfully');

  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log('✅ Link and Push Complete!');
  console.log('═'.repeat(50));
  console.log(`\n📊 Summary:`);
  console.log(`   • Migrations pushed: ${migrations.length}`);
  console.log(`   • Project ID: ${config.projectId}`);
  console.log(`\n💡 Your project is now linked and up-to-date!`);
}

// Run the script if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  linkAndPush().catch(error => {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  });
}




