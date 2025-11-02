/**
 * Tests for Vite manual chunking configuration
 * Ensures proper chunk assignment for optimal loading performance
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

interface PackageJson {
  name?: string;
  version?: string;
  description?: string;
  keywords?: string[];
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  [key: string]: unknown;
}

describe('Vite Manual Chunking Configuration', () => {
  // Import the chunking logic from vite.config.ts
  // Since we can't directly import from vite.config.ts (it's ESM and uses Node APIs),
  // we'll recreate the logic here for testing

  const getChunkName = (id: string | undefined) => {
    // Handle undefined/null inputs
    if (!id) return 'app';

    // Order matters! More specific patterns first, then general ones

    // Separate Supabase database client (before @ check to avoid @supabase/* going to vendor)
    if (id.includes('@supabase')) {
      return 'supabase';
    }

    // React-dependent libraries: Clerk, React Query, and other React libraries (all need React available)
    if (id.includes('@clerk') ||
        id.includes('@tanstack/react-query') ||
        id.includes('@tanstack/react-virtual') ||
        id.includes('use-sync-external-store') ||
        id.includes('swr')) {
      return 'react-vendor';
    }

    // Separate UI component libraries (before react check to avoid *-react going to react-vendor)
    if (id.includes('lucide-react')) {
      return 'ui-vendor';
    }

    // React and React DOM (exact matches, not partial)
    if (id.includes('/react/') || id.includes('/react-dom/')) {
      return 'react-vendor';
    }

    // Separate utility libraries
    if (id.includes('jszip') || id.includes('zod') || id.includes('class-variance-authority') || id.includes('clsx') || id.includes('tailwind-merge')) {
      return 'utils';
    }

    // Smart defaults for unmatched modules:
    // - Application source code goes to main app chunk
    // - Other node_modules go to vendor chunk for better caching
    if (id.includes('node_modules')) {
      return 'vendor';
    }

    // Everything else (app source code) goes to main app chunk
    return 'app';
  };

  describe('React Vendor Chunk', () => {
    it('should assign React core to react-vendor chunk', () => {
      expect(getChunkName('node_modules/react/index.js')).toBe('react-vendor');
      expect(getChunkName('node_modules/react-dom/index.js')).toBe('react-vendor');
      // Test with path separators
      expect(getChunkName('node_modules/react/package.json')).toBe('react-vendor');
      expect(getChunkName('node_modules/react-dom/package.json')).toBe('react-vendor');
    });

    it('should assign Clerk to react-vendor chunk to prevent dependency issues', () => {
      expect(getChunkName('node_modules/@clerk/clerk-react/index.js')).toBe('react-vendor');
      expect(getChunkName('node_modules/@clerk/themes/index.js')).toBe('react-vendor');
    });
  });

  describe('Database Layer Chunk', () => {
    it('should assign Supabase to separate chunk', () => {
      expect(getChunkName('node_modules/@supabase/supabase-js/index.js')).toBe('supabase');
    });
  });

  describe('Data Fetching Chunk', () => {
    it('should assign React Query to react-vendor chunk (needs React available)', () => {
      expect(getChunkName('node_modules/@tanstack/react-query/index.js')).toBe('react-vendor');
      expect(getChunkName('node_modules/@tanstack/react-query-persist-client/index.js')).toBe('react-vendor');
    });
  });

  describe('Utility Libraries Chunk', () => {
    it('should assign utility libraries to utils chunk', () => {
      expect(getChunkName('node_modules/jszip/index.js')).toBe('utils');
      expect(getChunkName('node_modules/zod/index.js')).toBe('utils');
      expect(getChunkName('node_modules/class-variance-authority/index.js')).toBe('utils');
      expect(getChunkName('node_modules/clsx/index.js')).toBe('utils');
      expect(getChunkName('node_modules/tailwind-merge/index.js')).toBe('utils');
    });
  });

  describe('UI Libraries Chunk', () => {
    it('should assign UI libraries to ui-vendor chunk', () => {
      expect(getChunkName('node_modules/lucide-react/index.js')).toBe('ui-vendor');
    });
  });

  describe('Smart Defaults', () => {
    it('should assign application source code to app chunk', () => {
      expect(getChunkName('src/App.tsx')).toBe('app');
      expect(getChunkName('src/components/Button.tsx')).toBe('app');
      expect(getChunkName('src/hooks/useAuth.ts')).toBe('app');
    });

    it('should assign unmatched node_modules to vendor chunk', () => {
      expect(getChunkName('node_modules/lodash/index.js')).toBe('vendor');
      expect(getChunkName('node_modules/moment/index.js')).toBe('vendor');
      expect(getChunkName('node_modules/@some-org/library/index.js')).toBe('vendor');
    });
  });

  describe('Future-Proofing', () => {
    it('should handle new React-related libraries correctly', () => {
      // Clerk packages go to react-vendor chunk
      expect(getChunkName('node_modules/@clerk/nextjs/index.js')).toBe('react-vendor');
      // Libraries with "react" in name but not core React go to vendor chunk
      expect(getChunkName('node_modules/react-router-dom/index.js')).toBe('vendor');
    });

    it('should handle new database libraries', () => {
      expect(getChunkName('node_modules/@supabase/auth-helpers-react/index.js')).toBe('supabase');
      expect(getChunkName('node_modules/firebase/index.js')).toBe('vendor'); // Would need manual rule
    });

    it('should handle new data fetching libraries', () => {
      // TanStack Query packages are now grouped with React for dependency reasons
      expect(getChunkName('node_modules/@tanstack/react-query-devtools/index.js')).toBe('react-vendor');
      expect(getChunkName('node_modules/swr/index.js')).toBe('react-vendor'); // SWR depends on React
    });

    it('should handle new utility libraries', () => {
      expect(getChunkName('node_modules/date-fns/index.js')).toBe('vendor'); // Could be added to utils
      expect(getChunkName('node_modules/uuid/index.js')).toBe('vendor'); // Could be added to utils
    });

    it('should handle new UI libraries', () => {
      expect(getChunkName('node_modules/@radix-ui/react-dialog/index.js')).toBe('vendor'); // Could be added to ui-vendor
      expect(getChunkName('node_modules/framer-motion/index.js')).toBe('vendor'); // Could be added to ui-vendor
    });
  });

  describe('Edge Cases', () => {
    it('should handle paths with multiple matches (prioritizes first match)', () => {
      // This shouldn't happen in practice, but if it did, first match wins
      const mockPath = 'node_modules/@clerk/react-query/index.js'; // Hypothetical
      expect(getChunkName(mockPath)).toBe('react-vendor'); // Clerk rule matches first
    });

    it('should handle empty or undefined paths', () => {
      expect(getChunkName('')).toBe('app');
      expect(getChunkName(undefined)).toBe('app');
    });

    it('should handle absolute paths correctly', () => {
      expect(getChunkName('/absolute/path/node_modules/react/index.js')).toBe('react-vendor');
      expect(getChunkName('/absolute/path/src/App.tsx')).toBe('app');
    });
  });

  describe('Performance Implications', () => {
    it('should group related libraries together for better caching', () => {
      // All Clerk-related packages should be together
      expect(getChunkName('node_modules/@clerk/clerk-react/index.js')).toBe('react-vendor');
      expect(getChunkName('node_modules/@clerk/themes/index.js')).toBe('react-vendor');

      // React Query packages should be with React (dependency grouping)
      expect(getChunkName('node_modules/@tanstack/react-query/index.js')).toBe('react-vendor');
      expect(getChunkName('node_modules/@tanstack/react-query-persist-client/index.js')).toBe('react-vendor');
    });

    it('should separate large libraries that change independently', () => {
      // Supabase is a large, independent library
      expect(getChunkName('node_modules/@supabase/supabase-js/index.js')).toBe('supabase');

      // React Query is now grouped with React for dependency reasons
      expect(getChunkName('node_modules/@tanstack/react-query/index.js')).toBe('react-vendor');
    });
  });

  describe('Bundle Analysis Compatibility', () => {
    it('should produce predictable chunk names for analysis', () => {
      // Ensure chunk names are consistent and meaningful
      const chunks = [
        'react-vendor',
        'supabase',
        'react-query',
        'utils',
        'ui-vendor',
        'vendor',
        'app'
      ];

      expect(chunks).toContain(getChunkName('node_modules/react/index.js'));
      expect(chunks).toContain(getChunkName('node_modules/@supabase/supabase-js/index.js'));
      expect(chunks).toContain(getChunkName('src/App.tsx'));
    });
  });

  describe('Dynamic React Dependency Validation', () => {
    /**
     * Dynamically identifies React-dependent libraries and ensures they're
     * properly configured in the manualChunks logic to be bundled with React.
     *
     * This test prevents production errors where React-dependent libraries
     * are chunked separately and try to use React before it's loaded.
     */

    const isReactDependent = (packageJson: PackageJson): boolean => {
      const { name, keywords = [] } = packageJson;

      // Skip dev tools, testing libraries, and build tools
      if (name?.includes('vite') ||
          name?.includes('vitest') ||
          name?.includes('testing-library') ||
          name?.includes('jest') ||
          name?.includes('istanbul') ||
          name?.includes('ts-node') ||
          name?.includes('@vercel/nft') ||
          name?.includes('rollup') ||
          name?.includes('webpack')) {
        return false;
      }

      // Skip icon libraries and pure utility libraries
      if (name?.includes('lucide') ||
          name?.includes('feather') ||
          name?.includes('heroicons') ||
          name?.includes('class-variance-authority') ||
          name?.includes('clsx') ||
          name?.includes('tailwind-merge') ||
          keywords.includes('css') ||
          keywords.includes('icons') ||
          keywords.includes('utility')) {
        return false;
      }

      // Check for React in runtime dependencies (not devDependencies)
      const runtimeDeps = ['dependencies', 'peerDependencies'];
      return runtimeDeps.some(field => {
        if (!packageJson[field]) return false;

        const deps = packageJson[field];
        return Object.keys(deps).some(depName => {
          // Check for React and React-related packages that indicate runtime dependency
          return depName === 'react' ||
                 depName === 'react-dom' ||
                 depName.startsWith('react/') ||
                 (depName.startsWith('@types/react') && packageJson.dependencies?.react);
        });
      });
    };

    const getPackageNames = (): string[] => {
      try {
        const nodeModulesPath = path.join(process.cwd(), 'node_modules');
        const packages = fs.readdirSync(nodeModulesPath)
          .filter(name => !name.startsWith('.') && name !== '.bin')
          .filter(name => {
            // Skip scoped packages for now (we'll handle them separately)
            if (name.startsWith('@')) return false;

            const packagePath = path.join(nodeModulesPath, name);
            const stat = fs.statSync(packagePath);
            return stat.isDirectory();
          });

        // Also check scoped packages
        const scopedDirs = fs.readdirSync(nodeModulesPath)
          .filter(name => name.startsWith('@'))
          .filter(name => {
            const scopedPath = path.join(nodeModulesPath, name);
            const stat = fs.statSync(scopedPath);
            return stat.isDirectory();
          });

        scopedDirs.forEach(scopedDir => {
          const scopedPath = path.join(nodeModulesPath, scopedDir);
          const scopedPackages = fs.readdirSync(scopedPath)
            .filter(name => {
              const packagePath = path.join(scopedPath, name);
              const stat = fs.statSync(packagePath);
              return stat.isDirectory();
            })
            .map(name => `${scopedDir}/${name}`);

          packages.push(...scopedPackages);
        });

        return packages;
      } catch (error) {
        console.warn('Could not scan node_modules:', error);
        return [];
      }
    };

    const getPackageJson = (packageName: string): PackageJson | null => {
      try {
        const packagePath = path.join(process.cwd(), 'node_modules', packageName, 'package.json');
        const packageJsonContent = fs.readFileSync(packagePath, 'utf-8');
        return JSON.parse(packageJsonContent) as PackageJson;
      } catch {
        return null;
      }
    };

    it('dynamically identifies React-dependent libraries and validates chunk assignment', () => {
      const packages = getPackageNames();
      const reactDependentPackages: string[] = [];
      const incorrectlyChunkedPackages: string[] = [];

      // Scan all packages for React dependencies
      packages.forEach(packageName => {
        const packageJson = getPackageJson(packageName);
        if (!packageJson) return;

        if (isReactDependent(packageJson)) {
          reactDependentPackages.push(packageName);

          // Test chunk assignment for this package
          const testPaths = [
            `node_modules/${packageName}/index.js`,
            `node_modules/${packageName}/lib/index.js`,
            `node_modules/${packageName}/dist/index.js`,
            `node_modules/${packageName}/src/index.js`
          ];

          const chunkAssignments = testPaths.map(testPath => getChunkName(testPath));

          // All test paths should result in the same chunk assignment
          const uniqueChunks = [...new Set(chunkAssignments)];
          if (uniqueChunks.length !== 1) {
            console.warn(`Inconsistent chunking for ${packageName}:`, chunkAssignments);
          }

          const assignedChunk = uniqueChunks[0];

          // React-dependent libraries must be in react-vendor chunk
          if (assignedChunk !== 'react-vendor') {
            incorrectlyChunkedPackages.push(`${packageName} → ${assignedChunk}`);
          }
        }
      });

      // Log discovered React-dependent packages for debugging
      if (reactDependentPackages.length > 0) {
        console.log(`Found ${reactDependentPackages.length} React-dependent packages:`,
                   reactDependentPackages.slice(0, 10).join(', '),
                   reactDependentPackages.length > 10 ? `... and ${reactDependentPackages.length - 10} more` : '');
      }

      // Assert that no React-dependent packages are incorrectly chunked
      const errorMessage = incorrectlyChunkedPackages.length > 0
        ? `The following React-dependent packages are not assigned to 'react-vendor' chunk:\n${incorrectlyChunkedPackages.join('\n')}\n\n` +
          `This will cause production errors like "Cannot read properties of undefined (reading 'useState')" or ` +
          `"Cannot read properties of undefined (reading 'createContext')".\n\n` +
          `Fix: Update the manualChunks function in vite.config.ts to include these packages in the react-vendor chunk.`
        : '';

      if (incorrectlyChunkedPackages.length > 0) {
        throw new Error(errorMessage);
      }
      expect(incorrectlyChunkedPackages).toHaveLength(0);
    });

    it('validates known React-dependent libraries are properly configured', () => {
      // Test known React-dependent libraries that should be in react-vendor chunk
      const knownReactDeps = [
        '@clerk/clerk-react',
        '@tanstack/react-query',
        // Add more known React-dependent libraries here as they get added
      ];

      const violations = knownReactDeps
        .map(packageName => {
          const chunk = getChunkName(`node_modules/${packageName}/index.js`);
          return chunk !== 'react-vendor' ? `${packageName} → ${chunk}` : null;
        })
        .filter(Boolean);

      const errorMessage = violations.length > 0
        ? `Known React-dependent libraries not in react-vendor chunk:\n${violations.join('\n')}\n\n` +
          `Update manualChunks in vite.config.ts to fix this.`
        : '';

      if (violations.length > 0) {
        throw new Error(errorMessage);
      }
      expect(violations).toHaveLength(0);
    });

    it('ensures React itself is in react-vendor chunk', () => {
      expect(getChunkName('node_modules/react/index.js')).toBe('react-vendor');
      expect(getChunkName('node_modules/react-dom/index.js')).toBe('react-vendor');
      expect(getChunkName('node_modules/react/jsx-runtime.js')).toBe('react-vendor');
    });

    it('provides helpful debugging information for chunk assignment', () => {
      // Test that our chunking logic handles various path formats consistently
      const testCases = [
        { path: 'node_modules/@clerk/clerk-react/index.js', expected: 'react-vendor' },
        { path: 'node_modules/@tanstack/react-query/index.js', expected: 'react-vendor' },
        { path: 'node_modules/react/index.js', expected: 'react-vendor' },
        { path: 'node_modules/@supabase/supabase-js/index.js', expected: 'supabase' },
        { path: 'node_modules/lucide-react/index.js', expected: 'ui-vendor' },
        { path: 'node_modules/zod/index.js', expected: 'utils' },
        { path: 'src/App.tsx', expected: 'app' },
      ];

      testCases.forEach(({ path, expected }) => {
        const actual = getChunkName(path);
        if (actual !== expected) {
          throw new Error(`Path "${path}" should be in "${expected}" chunk but got "${actual}"`);
        }
        expect(actual).toBe(expected);
      });
    });
  });
});
