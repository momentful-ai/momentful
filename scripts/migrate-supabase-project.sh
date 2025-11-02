#!/bin/bash

# Supabase Project Migration Script (Shell Version)
# 
# This script migrates all database migrations from one Supabase project to another.
# 
# Usage:
#   ./scripts/migrate-supabase-project.sh \
#     <old-project-id> <old-anon-key> \
#     <new-project-id> <new-anon-key>
#
# Or set environment variables:
#   export OLD_PROJECT_ID=<id>
#   export OLD_ANON_KEY=<key>
#   export NEW_PROJECT_ID=<id>
#   export NEW_ANON_KEY=<key>
#   ./scripts/migrate-supabase-project.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

# Function to print help
print_help() {
    echo "Supabase Project Migration Script (Shell Version)"
    echo ""
    echo "Usage:"
    echo "  $0 <old-project-id> <old-anon-key> <new-project-id> <new-anon-key>"
    echo ""
    echo "Or use environment variables:"
    echo "  OLD_PROJECT_ID=<id> OLD_ANON_KEY=<key> NEW_PROJECT_ID=<id> NEW_ANON_KEY=<key> $0"
    echo ""
    echo "Options:"
    echo "  --help, -h    Show this help message"
    echo ""
}

# Parse arguments
if [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
    print_help
    exit 0
fi

# Get project IDs and keys from arguments or environment
OLD_PROJECT_ID="${1:-$OLD_PROJECT_ID}"
OLD_ANON_KEY="${2:-$OLD_ANON_KEY}"
NEW_PROJECT_ID="${3:-$NEW_PROJECT_ID}"
NEW_ANON_KEY="${4:-$NEW_ANON_KEY}"

# Validate required parameters
if [[ -z "$OLD_PROJECT_ID" ]] || [[ -z "$OLD_ANON_KEY" ]] || \
   [[ -z "$NEW_PROJECT_ID" ]] || [[ -z "$NEW_ANON_KEY" ]]; then
    print_error "Missing required parameters!"
    echo ""
    print_help
    exit 1
fi

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Check if Supabase CLI exists
if [[ ! -f "$PROJECT_ROOT/bin/supabase" ]]; then
    print_error "Supabase CLI not found at $PROJECT_ROOT/bin/supabase"
    print_info "Make sure you're running this from the project root"
    exit 1
fi

SUPABASE_CLI="$PROJECT_ROOT/bin/supabase"

echo "🚀 Starting Supabase Project Migration"
echo "════════════════════════════════════════════════════════════"
echo "Old Project ID: $OLD_PROJECT_ID"
echo "New Project ID: $NEW_PROJECT_ID"
echo "════════════════════════════════════════════════════════════"

# Step 1: Count migration files
print_info "Step 1: Reading migration files..."
MIGRATION_COUNT=$(find "$PROJECT_ROOT/supabase/migrations" -name "*.sql" | wc -l | tr -d ' ')
print_success "Found $MIGRATION_COUNT migration files"

# Step 2: Verify old project (optional)
print_info "Step 2: Verifying old project connection..."
OLD_URL="https://${OLD_PROJECT_ID}.supabase.co"
if curl -s -o /dev/null -w "%{http_code}" \
    -H "apikey: $OLD_ANON_KEY" \
    -H "Authorization: Bearer $OLD_ANON_KEY" \
    "$OLD_URL/rest/v1/" | grep -q "200\|401\|403"; then
    print_success "Old project connection verified"
else
    print_warning "Could not verify old project connection (continuing anyway)"
fi

# Step 3: Link to new project
print_info "Step 3: Linking to new project $NEW_PROJECT_ID..."
cd "$PROJECT_ROOT"

# Unlink any existing project
"$SUPABASE_CLI" unlink 2>/dev/null || true

# Link to new project
if "$SUPABASE_CLI" link --project-ref "$NEW_PROJECT_ID"; then
    print_success "Successfully linked to new project"
else
    print_error "Failed to link to new project"
    echo ""
    print_info "Make sure you:"
    echo "  1. Are authenticated: $SUPABASE_CLI login"
    echo "  2. Have access to the new project"
    echo "  3. The new project ID is correct"
    exit 1
fi

# Step 4: Apply migrations
print_info "Step 4: Applying migrations..."
if "$SUPABASE_CLI" db push --include-all; then
    print_success "All migrations applied successfully"
else
    print_error "Failed to apply migrations"
    print_info "Check the error messages above for details"
    exit 1
fi

# Step 5: Summary
echo ""
echo "════════════════════════════════════════════════════════════"
print_success "Migration Complete!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📊 Summary:"
echo "   • Migrations applied: $MIGRATION_COUNT"
echo "   • New project ID: $NEW_PROJECT_ID"
echo ""
echo "💡 Next steps:"
echo "   1. Update your environment variables:"
echo "      VITE_SUPABASE_URL=https://${NEW_PROJECT_ID}.supabase.co"
echo "      VITE_SUPABASE_ANON_KEY=${NEW_ANON_KEY}"
echo "   2. Test your application with the new project"
echo "   3. Update any CI/CD pipelines with new credentials"
echo ""


