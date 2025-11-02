# Chunking Decision Cheat Sheet

## Quick Reference for New Dependencies

| Library Type | Size | Update Frequency | Recommended Chunk | Example |
|-------------|------|------------------|------------------|---------|
| **React UI Libraries** | Any | Any | `ui-vendor` | `lucide-react`, `@radix-ui/*` |
| **React State Mgmt** | Any | Any | `react-vendor` | `@clerk/*`, `react-router-dom` |
| **Database Clients** | Large | Independent | Separate chunk | `@supabase/*`, `firebase` |
| **Data Fetching** | Any | Independent | Separate chunk | `@tanstack/react-query*` |
| **Utilities** | Any | Stable | `utils` | `zod`, `jszip`, `date-fns` |
| **Large Libraries** | >50KB | Any | Separate chunk | `lodash`, `moment` |
| **Small Libraries** | <10KB | Any | `vendor` | `clsx`, `tiny-invariant` |
| **App Code** | Any | Any | `app` | All `src/` files |

## Priority Order (in vite.config.ts)

```typescript
// 1. Database clients (highest priority - before @ check)
if (id.includes('@supabase')) return 'supabase';

// 2. Data fetching libraries
if (id.includes('@tanstack/react-query')) return 'react-query';

// 3. React-dependent libraries
if (id.includes('@clerk')) return 'react-vendor';

// 4. UI libraries (before generic react check)
if (id.includes('lucide-react')) return 'ui-vendor';

// 5. React core (exact path matches)
if (id.includes('/react/') || id.includes('/react-dom/')) return 'react-vendor';

// 6. Utility libraries
if (id.includes('jszip') || id.includes('zod') || /* utils */) return 'utils';

// 7. Smart defaults
if (id.includes('node_modules')) return 'vendor'; // Other npm packages
return 'app'; // Application source code
```

## Emergency Commands

```bash
# Test chunking logic
npm test -- --run ViteChunking

# Build with analysis
npm run build:analyze

# Check chunk sizes
npm run build && ls -lah dist/assets/

# Rollback to auto-chunking (emergency)
# Comment out manualChunks in vite.config.ts
```

## Performance Budgets

- **Main chunk**: < 50KB gzipped
- **Individual chunks**: < 200KB gzipped
- **Total initial load**: < 300KB gzipped

## Common Mistakes to Avoid

❌ **Don't put React-dependent libs in separate chunks**
```typescript
// WRONG - will cause "useState undefined" errors
if (id.includes('@clerk')) return 'clerk'; // Clerk needs React!
```

✅ **Group dependencies together**
```typescript
// RIGHT - Clerk loads with React
if (id.includes('@clerk')) return 'react-vendor';
```

❌ **Don't over-chunk tiny libraries**
```typescript
// WRONG - 5KB library doesn't need its own chunk
if (id.includes('tiny-library')) return 'tiny-chunk';
```

✅ **Use vendor chunk for small libraries**
```typescript
// RIGHT - small libraries go to vendor
// (automatic via smart defaults)
```

❌ **Don't ignore chunking when adding dependencies**
```typescript
// WRONG - forgetting to consider chunking impact
npm install new-heavy-library
```

✅ **Always check chunking impact**
```typescript
npm install new-heavy-library
npm run build:analyze  # Check the impact
npm test -- --run ViteChunking  # Update tests
```
