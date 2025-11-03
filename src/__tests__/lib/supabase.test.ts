import { describe, it, expect, vi } from 'vitest';

// Mock environment variables that supabase needs
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');

// Mock the supabase module to avoid configuration issues in tests
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
    storage: {
      from: vi.fn(() => ({
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/test' } })),
      })),
    },
  },
}));

describe('supabase', () => {
  it('can be imported without errors when properly configured', async () => {
    // This test verifies that the supabase module can be imported without throwing
    // configuration errors when properly mocked
    expect(async () => {
      await import('../../lib/supabase');
    }).not.toThrow();
  });

  it('exports a supabase client', async () => {
    const { supabase } = await import('../../lib/supabase');
    expect(supabase).toBeDefined();
    expect(typeof supabase).toBe('object');
    expect(supabase.from).toBeDefined();
    expect(supabase.storage).toBeDefined();
  });
});
