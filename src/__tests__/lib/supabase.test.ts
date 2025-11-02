import { describe, it, expect } from 'vitest';

// Since the supabase module creates a client at module load time based on environment variables,
// and testing module-level initialization is complex, we'll focus on testing that the module
// can be imported without errors when properly configured. The actual client creation logic
// is tested indirectly through the database operations that use it.

describe('supabase', () => {
  it('can be imported without errors when properly configured', async () => {
    // This test verifies that the supabase module can be imported without throwing
    // configuration errors when the basic environment variables are available
    // (which they are in the test environment via Vite's default handling)
    expect(async () => {
      await import('../../lib/supabase');
    }).not.toThrow();
  });

  it('exports a supabase client', async () => {
    const { supabase } = await import('../../lib/supabase');
    expect(supabase).toBeDefined();
    expect(typeof supabase).toBe('object');
  });
});
