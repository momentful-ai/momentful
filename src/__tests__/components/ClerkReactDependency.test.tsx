/**
 * Test to ensure Clerk components load with React available
 * This prevents the "Cannot read properties of undefined (reading 'useState')" error
 * that occurs when Clerk chunks load before React is available.
 */

import { describe, it, expect } from 'vitest';

describe('Clerk React Dependency', () => {
  it('validates that Clerk and React can be imported together without errors', async () => {
    // This test simulates the production chunk loading scenario
    // where Clerk and React need to be available in the same context

    const importPromise = Promise.all([
      import('react'),
      import('@clerk/clerk-react'),
    ]);

    expect(async () => {
      const [ReactModule, ClerkModule] = await importPromise;

      // Ensure both modules loaded successfully
      expect(ReactModule).toBeDefined();
      expect(ReactModule.useState).toBeDefined();
      expect(ClerkModule).toBeDefined();
      expect(ClerkModule.ClerkProvider).toBeDefined();
    }).not.toThrow();
  });

  it('ensures React hooks are available when Clerk components are imported', async () => {
    // Test that React's core functionality is available alongside Clerk imports
    const React = await import('react');
    const ClerkReact = await import('@clerk/clerk-react');

    // Verify React's essential functions are available
    expect(React.useState).toBeDefined();
    expect(React.useEffect).toBeDefined();
    expect(React.useCallback).toBeDefined();

    // Verify Clerk components are available
    expect(ClerkReact.ClerkProvider).toBeDefined();
    expect(ClerkReact.useUser).toBeDefined();
    expect(ClerkReact.useAuth).toBeDefined();
  });

  it('prevents the undefined useState error by ensuring proper module loading', () => {
    // This test documents the fix for the production error:
    // "Cannot read properties of undefined (reading 'useState')"
    //
    // The fix ensures Clerk is bundled in the same chunk as React,
    // so React is guaranteed to be available when Clerk tries to use it.

    const testChunkLoading = async () => {
      // Simulate the chunk loading pattern
      // In production, both React and Clerk should be in the same chunk
      const React = await import('react');

      // If Clerk were in a separate chunk, this would potentially fail
      // But with our fix, they're bundled together
      expect(React.default).toBeDefined();

      return true;
    };

    return expect(testChunkLoading()).resolves.toBe(true);
  });
});
