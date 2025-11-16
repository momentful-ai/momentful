import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setClerkTokenProvider, supabase } from '../../lib/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('supabase-token-provider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setClerkTokenProvider', () => {
    it('sets a token provider function that returns Clerk tokens', async () => {
      const mockTokenProvider = vi.fn().mockResolvedValue('clerk-jwt-token-123');

      setClerkTokenProvider(mockTokenProvider);

      // The accessToken function should call our provider
      const token = await (supabase as SupabaseClient & { accessToken: () => Promise<string> }).accessToken();

      expect(mockTokenProvider).toHaveBeenCalled();
      expect(token).toBe('clerk-jwt-token-123');
    });

    it('clears token provider when set to null', async () => {
      // First set a provider
      const mockTokenProvider = vi.fn().mockResolvedValue('token-123');
      setClerkTokenProvider(mockTokenProvider);

      // Then clear it
      setClerkTokenProvider(null);

      // Should fall back to publishable key
      const token = await (supabase as SupabaseClient & { accessToken: () => Promise<string> }).accessToken();

      expect(mockTokenProvider).not.toHaveBeenCalled();
      expect(token).toBeDefined(); // Should be the publishable key
    });

    it('handles token provider errors gracefully', async () => {
      const mockTokenProvider = vi.fn().mockRejectedValue(new Error('Token fetch failed'));

      setClerkTokenProvider(mockTokenProvider);

      await expect((supabase as SupabaseClient & { accessToken: () => Promise<string> }).accessToken()).rejects.toThrow('Token fetch failed');
    });

    it('falls back to publishable key when no provider is set', async () => {
      // Ensure no provider is set
      setClerkTokenProvider(null);

      const token = await (supabase as SupabaseClient & { accessToken: () => Promise<string> }).accessToken();

      expect(token).toBeDefined(); // Should be the publishable key
    });
  });
});

