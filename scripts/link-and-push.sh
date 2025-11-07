#!/bin/bash

# Supabase Link and Push Script (Shell Version)
#
# This script links to a specified Supabase project and pushes all migrations.
#
# Usage:
#   ./scripts/link-and-push.sh <project-id>
#
# Or set environment variable:
#   export SUPABASE_PROJECT_ID=<project-id>
#   ./scripts/link-and-push.sh

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
    echo "Supabase Link and Push Script (Shell Version)"
    echo ""
    echo "Usage:"
    echo "  $0 <project-id>"
    echo ""
    echo "Or use environment variable:"
    echo "  SUPABASE_PROJECT_ID=<project-id> $0"
    echo ""
    echo "Options:"
    echo "  --help, -h    Show this help message"
    echo ""
    echo "Example:"
    echo "  $0 abcdefghijklmnop"
    echo ""
}

# Parse arguments
if [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
    print_help
    exit 0
fi

# Get project ID from argument or environment
SUPABASE_PROJECT_ID="${1:-$SUPABASE_PROJECT_ID}"

# Validate required parameter
if [[ -z "$SUPABASE_PROJECT_ID" ]]; then
    print_error "Missing required parameter!"
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

echo "🚀 Starting Supabase Link and Push"
echo "═══════════════════════════════════"
echo "Project ID: $SUPABASE_PROJECT_ID"
echo "═══════════════════════════════════"

# Step 1: Count migration files
print_info "Step 1: Reading migration files..."
MIGRATION_COUNT=$(find "$PROJECT_ROOT/supabase/migrations" -name "*.sql" | wc -l | tr -d ' ')
print_success "Found $MIGRATION_COUNT migration files"

# Step 2: Link to project
print_info "Step 2: Linking to project $SUPABASE_PROJECT_ID..."
cd "$PROJECT_ROOT"

# Unlink any existing project
"$SUPABASE_CLI" unlink 2>/dev/null || true

# Link to new project
if "$SUPABASE_CLI" link --project-ref "$SUPABASE_PROJECT_ID"; then
    print_success "Successfully linked to project"
else
    print_error "Failed to link to project"
    echo ""
    print_info "Make sure you:"
    echo "  1. Are authenticated: $SUPABASE_CLI login"
    echo "  2. Have access to the project"
    echo "  3. The project ID is correct"
    exit 1
fi

# Step 3: Push migrations
print_info "Step 3: Pushing migrations..."
if "$SUPABASE_CLI" db push; then
    print_success "All migrations pushed successfully"
else
    print_error "Failed to push migrations"
    print_info "Check the error messages above for details"
    exit 1
fi

# Step 4: Summary
echo ""
echo "═══════════════════════════════════"
print_success "Link and Push Complete!"
echo "═══════════════════════════════════"
echo ""
echo "📊 Summary:"
echo "   • Migrations pushed: $MIGRATION_COUNT"
echo "   • Project ID: $SUPABASE_PROJECT_ID"
echo ""
echo "💡 Your project is now linked and up-to-date!"
echo ""






