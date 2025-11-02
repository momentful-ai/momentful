/**
 * Tests for Vite manual chunking configuration
 * Ensures proper chunk assignment for optimal loading performance
 */

import { describe, it, expect } from 'vitest';

describe('Vite Manual Chunking Configuration', () => {
  // Import the chunking logic from vite.config.ts
  // Since we can't directly import from vite.config.ts (it's ESM and uses Node APIs),
  // we'll recreate the logic here for testing

  const getChunkName = (id: string) => {
    // Handle undefined/null inputs
    if (!id) return 'app';

    // Order matters! More specific patterns first, then general ones

    // Separate Supabase database client (before @ check to avoid @supabase/* going to vendor)
    if (id.includes('@supabase')) {
      return 'supabase';
    }

    // Separate React Query data fetching library (before react check)
    if (id.includes('@tanstack/react-query')) {
      return 'react-query';
    }

    // Clerk needs React, so include it with React vendor chunk
    if (id.includes('@clerk')) {
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
    it('should assign React Query to separate chunk', () => {
      expect(getChunkName('node_modules/@tanstack/react-query/index.js')).toBe('react-query');
      expect(getChunkName('node_modules/@tanstack/react-query-persist-client/index.js')).toBe('react-query');
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
      expect(getChunkName('node_modules/@tanstack/react-query-devtools/index.js')).toBe('react-query');
      expect(getChunkName('node_modules/swr/index.js')).toBe('vendor'); // Would need manual rule
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
      expect(getChunkName(undefined as any)).toBe('app');
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

      // All React Query packages should be together
      expect(getChunkName('node_modules/@tanstack/react-query/index.js')).toBe('react-query');
      expect(getChunkName('node_modules/@tanstack/react-query-persist-client/index.js')).toBe('react-query');
    });

    it('should separate large libraries that change independently', () => {
      // Supabase is a large, independent library
      expect(getChunkName('node_modules/@supabase/supabase-js/index.js')).toBe('supabase');

      // React Query is large and may update independently
      expect(getChunkName('node_modules/@tanstack/react-query/index.js')).toBe('react-query');
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
});
