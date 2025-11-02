# Vite Manual Chunking Configuration

This document explains the manual chunking strategy used in this Vite-based React application to optimize bundle size, loading performance, and caching efficiency.

## Table of Contents

- [What is Manual Chunking?](#what-is-manual-chunking)
- [Current Chunk Configuration](#current-chunk-configuration)
- [Chunk Rationale](#chunk-rationale)
- [Performance Benefits](#performance-benefits)
- [Production Issues Fixed](#production-issues-fixed)
- [Maintenance Guide](#maintenance-guide)
- [Testing Strategy](#testing-strategy)
- [Common Pitfalls](#common-pitfalls)
- [Future-Proofing](#future-proofing)

## What is Manual Chunking?

**Manual chunking** is a Vite build optimization that allows you to control how your application code and dependencies are split into separate JavaScript files (chunks). This is crucial for:

- **Reducing initial bundle size** - Keep the main chunk under browser limits (~500KB)
- **Improving caching** - Separate frequently-changing app code from stable vendor libraries
- **Faster loading** - Load critical code first, lazy-load heavy features
- **Better user experience** - Parallel loading of independent chunks

### Why Manual Chunking?

Vite's automatic chunking is good, but manual control is essential for:
- **Large applications** with many dependencies
- **Performance-critical** user experiences
- **Third-party libraries** with specific loading requirements
- **Lazy-loaded features** that need controlled loading order

## Current Chunk Configuration

Located in `vite.config.ts`, the manual chunking logic uses a function that analyzes each module path and assigns it to the appropriate chunk.

### Code Structure

```typescript
manualChunks: (id) => {
  // Order matters! More specific patterns first, then general ones

  // 1. Database Layer (highest priority)
  if (id.includes('@supabase')) return 'supabase';

  // 2. React-dependent libraries (Clerk, React Query - both need React available)
  if (id.includes('@clerk') || id.includes('@tanstack/react-query')) return 'react-vendor';

  // 4. UI Libraries (before generic react check)
  if (id.includes('lucide-react')) return 'ui-vendor';

  // 5. React Core (exact matches only)
  if (id.includes('/react/') || id.includes('/react-dom/')) return 'react-vendor';

  // 6. Utility Libraries
  if (id.includes('jszip') || id.includes('zod') || /* ... */) return 'utils';

  // Smart defaults for everything else
  if (id.includes('node_modules')) return 'vendor';
  return 'app'; // Application source code
}
```

### Current Chunks

| Chunk | Size (gzipped) | Purpose | Contents |
|-------|----------------|---------|----------|
| `react-vendor` | ~216KB | React ecosystem | React, React DOM, Clerk, React Query, SWR, TanStack Virtual, use-sync-external-store, Lucide React |
| `supabase` | ~34KB | Database | Supabase client |
| `utils` | ~37KB | Utilities | JSZip, Zod, Tailwind utilities |
| `main` | ~30KB | App code | Main application logic |
| `vendor` | ~24KB | Other deps | Miscellaneous node_modules |

## Chunk Rationale

### 1. React Vendor Chunk (`react-vendor`)
**Includes:** React, React DOM, Clerk authentication, React Query, UI libraries (Lucide React)

**Why separate?**
- Clerk, React Query, and UI libraries like Lucide React all depend on React and must load with it
- React is stable and changes infrequently
- Clerk is a large authentication library (prevented "useState undefined" error)
- React Query depends on React.createContext (prevented "createContext undefined" error)
- Lucide React depends on React.forwardRef (prevented "forwardRef undefined" error)

**Critical dependency:** All these libraries will fail if React isn't available when they load.

### 2. Supabase Chunk (`supabase`)
**Includes:** `@supabase/supabase-js`

**Why separate?**
- Large database client (125KB+)
- Independent of React ecosystem
- May update independently of app code
- Better caching when Supabase updates

### 3. React Query Chunk (`react-query`)
**Includes:** `@tanstack/react-query*` packages

**Why separate?**
- Data fetching logic that may change independently
- Small size allows independent caching
- Used throughout the app but separable from core React

### 4. Utils Chunk (`utils`)
**Includes:** JSZip, Zod, Tailwind utilities

**Why separate?**
- Utility libraries used across the app
- Relatively stable dependencies
- Grouping reduces duplication
- Often used together (form validation, file handling)

### 5. UI Vendor Chunk (`ui-vendor`)
**Includes:** Lucide React

**Why separate?**
- UI libraries may change independently of core app
- Icons are static assets that cache well
- Separates presentation concerns from business logic

### 6. Vendor Chunk (`vendor`)
**Includes:** All other `node_modules`

**Why separate?**
- Groups miscellaneous dependencies for better caching
- Allows app code to change without invalidating all vendor libraries
- Provides fallback for new dependencies

### 7. App Chunk (`app`)
**Includes:** All application source code (`src/`)

**Why separate?**
- Contains frequently changing application logic
- Small size ensures fast initial loads
- Allows independent deployment of app updates

## Performance Benefits

### Bundle Size Optimization
- **Main chunk under 30KB** (gzipped) - well under 500KB browser limits
- **Lazy-loaded components** (ImageEditor, VideoGenerator) load on-demand
- **Parallel loading** of independent chunks

### Caching Efficiency
- **Stable vendor chunks** cache longer than app code
- **Independent updates** don't invalidate unrelated chunks
- **CDN-friendly** chunk separation for global distribution

### Loading Performance
- **Critical path optimization** - React loads first
- **Progressive loading** - heavy features load when needed
- **Reduced time-to-interactive** through smart splitting

## Maintenance Guide

### Adding New Dependencies

When adding new packages, follow this decision tree:

1. **Is it React-related?** (uses React hooks, components)
   - → Add to `react-vendor` chunk if it depends on React
   - → Add to `vendor` chunk if it's React-agnostic

2. **Is it a large library?** (>50KB)
   - → Consider separate chunk if it updates independently

3. **Is it UI-related?** (icons, components, styling)
   - → Add to `ui-vendor` chunk

4. **Is it a utility?** (validation, file handling, formatting)
   - → Add to `utils` chunk

5. **Is it data/database related?**
   - → Create new chunk or add to existing (e.g., `supabase`)

6. **Otherwise:**
   - → Goes to `vendor` chunk automatically (smart default)

### Updating Chunk Logic

**Always update tests** in `src/__tests__/config/ViteChunking.test.ts` when modifying chunk logic.

**Test your changes:**
```bash
npm run build          # Verify chunks are created correctly
npm run build:analyze  # Check bundle analysis report
npm test -- --run src/__tests__/config/ViteChunking.test.ts
```

### Monitoring Bundle Size

**Use these commands regularly:**

```bash
# Build and analyze bundle
npm run build:analyze

# Check chunk sizes in dist/
ls -la dist/assets/

# Monitor specific chunk sizes
npm run build && du -sh dist/assets/*-*.js
```

### Performance Budgets

Maintain these limits:
- **Main app chunk**: < 50KB (gzipped)
- **Individual chunks**: < 200KB (gzipped)
- **Total initial load**: < 300KB (gzipped, without lazy chunks)

## Testing Strategy

### Comprehensive Test Coverage

Tests in `src/__tests__/config/ViteChunking.test.ts` cover:

- **Current behavior** - validates existing chunk assignments
- **Dynamic validation** - automatically scans node_modules for React-dependent libraries and ensures proper chunking
- **Future-proofing** - ensures new libraries are handled correctly
- **Edge cases** - handles malformed paths, undefined inputs
- **Performance** - validates grouping and separation logic

### Multi-Layer Testing Approach

1. **Static Logic Tests**: Validate chunking logic with known test cases
2. **Dynamic Dependency Validation**: Automatically detect React-dependent libraries and verify they're bundled with React
3. **Runtime Safety Tests**: Ensure React-dependent libraries can access React functions without "undefined" errors
4. **Integration Testing**: Full build validation with bundle analysis

### Dependency Safety Tests

Tests in `src/__tests__/components/ClerkReactDependency.test.tsx` prevent:
- **React undefined errors** in production
- **Loading order issues** between dependent chunks
- **Bundle-time failures** from incorrect chunking

### Running Tests

```bash
# Test chunking logic only
npm test -- --run src/__tests__/config/ViteChunking.test.ts

# Test dependency safety
npm test -- --run src/__tests__/components/ClerkReactDependency.test.ts
npm test -- --run src/__tests__/components/ReactQueryReactDependency.test.tsx

# Test dynamic chunking validation
npm test -- --run "Vite Manual Chunking Configuration > Dynamic React Dependency Validation"

# Full test suite
npm test
```

## Production Issues Fixed

### Issue 1: Clerk `useState` undefined error
**Error**: `Cannot read properties of undefined (reading 'useState')` at clerk chunk
**Root Cause**: Clerk was chunked separately from React, so when Clerk tried to use React hooks, React wasn't loaded yet.
**Solution**: Group Clerk with React in the `react-vendor` chunk.
**Prevention**: Added `ClerkReactDependency.test.tsx` to test this scenario.

### Issue 2: React Query `createContext` undefined error
**Error**: `Cannot read properties of undefined (reading 'createContext')` at react-query chunk
**Root Cause**: React Query was chunked separately from React, so when React Query tried to use React.createContext, React wasn't loaded yet.
**Solution**: Group React Query with React in the `react-vendor` chunk alongside Clerk.
**Prevention**: Added `ReactQueryReactDependency.test.tsx` to test this scenario.

### Issue 3: Lucide React `forwardRef` undefined error
**Error**: `Cannot read properties of undefined (reading 'forwardRef')` at ui-vendor chunk
**Root Cause**: Lucide React was chunked separately from React, but it depends on React.forwardRef at runtime.
**Solution**: Move Lucide React to the `react-vendor` chunk since it has React as a peer dependency.
**Prevention**: Updated dynamic React dependency validation to detect and prevent this issue.

### Issue 4: Main chunk `createContext` undefined error
**Error**: `Cannot read properties of undefined (reading 'createContext')` at main chunk
**Root Cause**: React context objects were created at module load time (top level), but React wasn't available when the main chunk loaded.
**Solution**: Implement lazy context initialization - move `createContext` calls inside getter functions that are called when contexts are actually used.
**Prevention**: Context creation now happens on-demand, ensuring React is available.

## Common Pitfalls

### 1. Dependency Order Issues
**Problem:** Chunk A depends on Chunk B, but B loads after A
**Solution:** Group dependent libraries (e.g., Clerk with React)
**Prevention:** Always test with `npm run build` after chunking changes

### 2. Over-Chunking
**Problem:** Too many tiny chunks increase HTTP overhead
**Solution:** Balance between caching benefits and request overhead
**Prevention:** Monitor chunk sizes and combine if < 10KB

### 3. Under-Chunking
**Problem:** Main chunk becomes too large (>500KB)
**Solution:** Identify large dependencies and separate them
**Prevention:** Regular bundle analysis and size monitoring

### 4. Pattern Matching Errors
**Problem:** Generic patterns match unintended modules
**Solution:** Use specific patterns and test thoroughly
**Prevention:** Order matters - specific patterns before general ones

### 5. Missing Test Updates
**Problem:** Chunking changes break without test updates
**Solution:** Always update tests when modifying chunk logic
**Prevention:** Tests run in CI/CD pipeline

### 6. Module-Level Context Creation
**Problem:** `createContext()` at top level causes "Cannot read properties of undefined" errors
**Solution:** Use lazy context initialization with getter functions
**Prevention:** Avoid `export const MyContext = createContext()` at module level

## Future-Proofing

### Automated Chunking
Consider implementing automated chunking based on:
- **Package size** (>50KB → separate chunk)
- **Update frequency** (stable packages → vendor chunk)
- **Dependency analysis** (build-time dependency graphs)

### Dynamic Chunking
For very large applications, consider:
- **Route-based chunking** (split by page/feature)
- **Dynamic imports** for heavy features
- **Service worker caching** strategies

### Monitoring & Analytics
Track chunk performance with:
- **Real user monitoring** (chunk load times)
- **Bundle analyzer** reports in CI/CD
- **Performance budgets** with automated checks

## Quick Reference

### Adding a New Large Library

1. **Analyze the library:**
   - Size, dependencies, update frequency
   - Usage patterns in your app

2. **Choose chunk strategy:**
   ```typescript
   // For large, stable libraries
   if (id.includes('new-library')) return 'vendor';

   // For UI libraries
   if (id.includes('new-ui-lib')) return 'ui-vendor';

   // For utilities
   if (id.includes('new-util')) return 'utils';
   ```

3. **Update tests:**
   ```typescript
   it('should assign new library to appropriate chunk', () => {
     expect(getChunkName('node_modules/new-library/index.js')).toBe('vendor');
   });
   ```

4. **Verify:**
   ```bash
   npm run build:analyze
   npm test -- --run ViteChunking
   ```

### Emergency Rollback

If chunking breaks production:

1. **Comment out manual chunks** to use Vite defaults:
   ```typescript
   // manualChunks: (id) => { /* ... */ },
   ```

2. **Deploy fix** with automatic chunking

3. **Debug and fix** chunking logic

4. **Re-enable** with proper testing

---

**Remember:** Chunking is a balance between performance, maintainability, and complexity. Start simple, measure impact, and iterate based on real usage data.
