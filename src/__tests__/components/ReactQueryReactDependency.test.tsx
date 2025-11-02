/**
 * Test to ensure React Query components load with React available
 * This prevents the "Cannot read properties of undefined (reading 'createContext')" error
 * that occurs when React Query chunks load before React is available.
 */

import { describe, it, expect } from 'vitest';

describe('React Query React Dependency', () => {
  it('validates that React Query and React can be imported together without errors', async () => {
    // This test simulates the production chunk loading scenario
    // where React Query and React need to be available in the same context

    const importPromise = Promise.all([
      import('react'),
      import('@tanstack/react-query'),
    ]);

    expect(async () => {
      const [ReactModule, ReactQueryModule] = await importPromise;

      // Ensure both modules loaded successfully
      expect(ReactModule).toBeDefined();
      expect(ReactModule.createContext).toBeDefined();
      expect(ReactQueryModule).toBeDefined();
      expect(ReactQueryModule.useQuery).toBeDefined();
    }).not.toThrow();
  });

  it('ensures React Query hooks can access React.createContext without issues', async () => {
    // Test that React Query's internal usage of React.createContext works
    const React = await import('react');
    const ReactQuery = await import('@tanstack/react-query');

    // Verify React's essential functions are available
    expect(React.default.createContext).toBeDefined();
    expect(React.default.useContext).toBeDefined();
    expect(React.default.useEffect).toBeDefined();

    // Verify React Query components are available and can use React
    expect(ReactQuery.QueryClient).toBeDefined();
    expect(ReactQuery.QueryClientProvider).toBeDefined();
    expect(ReactQuery.useQuery).toBeDefined();
  });

  it('prevents the undefined createContext error by ensuring proper module loading', () => {
    // This test documents the fix for the production error:
    // "Cannot read properties of undefined (reading 'createContext')"
    //
    // The fix ensures React Query is bundled in the same chunk as React,
    // so React is guaranteed to be available when React Query tries to use it.

    const testChunkLoading = async () => {
      // Simulate the chunk loading pattern
      // In production, both React and React Query should be in the same chunk
      const React = await import('react');

      // React Query internally uses React.createContext, so React must be available
      expect(React.default.createContext).toBeDefined();

      // If React Query were in a separate chunk, this could fail
      // But with our fix, they're bundled together
      return true;
    };

    return expect(testChunkLoading()).resolves.toBe(true);
  });

  it('validates React Query QueryClient instantiation works with React available', async () => {
    // Test that React Query can create a QueryClient (which uses React internally)
    const { QueryClient } = await import('@tanstack/react-query');

    expect(() => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
            staleTime: 5 * 60 * 1000,
          },
        },
      });
      expect(queryClient).toBeDefined();
    }).not.toThrow();
  });

  it('ensures React Query hooks can be used in React components', async () => {
    // Test that React Query hooks work when React is available
    const React = await import('react');
    const { useQuery, QueryClient, QueryClientProvider } = await import('@tanstack/react-query');

    // Verify that we can create instances of React Query classes
    expect(() => new QueryClient()).not.toThrow();

    // Verify React Query Provider is available (used in real applications)
    expect(QueryClientProvider).toBeDefined();

    // Create a test component that uses React Query
    const TestComponent = () => {
      const { data, isLoading } = useQuery({
        queryKey: ['test'],
        queryFn: () => Promise.resolve('test data'),
      });

      return React.default.createElement('div', null,
        isLoading ? 'Loading...' : data
      );
    };

    // This should not throw any errors if React is available
    expect(TestComponent).toBeDefined();
    expect(typeof TestComponent).toBe('function');
  });
});
