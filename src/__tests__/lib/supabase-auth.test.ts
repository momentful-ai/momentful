import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setSupabaseAuth } from '../../lib/supabase-auth';

// Mock Supabase client
vi.mock('../../lib/supabase', () => {
  const mockAuth = {
    setSession: vi.fn(),
  };

  const mockSupabaseClient = {
    auth: mockAuth,
  };

  return {
    supabase: mockSupabaseClient,
  };
});

// Import the mocked supabase to access the mock in tests
import { supabase } from '../../lib/supabase';
const mockSupabaseClient = supabase;

describe('supabase-auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setSupabaseAuth', () => {
    it('successfully sets Supabase session with Clerk token', async () => {
      const mockSessionData = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
        session: {
          access_token: 'clerk-token-123',
          refresh_token: 'clerk-token-123',
        },
      };

      mockSupabaseClient.auth.setSession.mockResolvedValue({
        data: mockSessionData,
        error: null,
      });

      const result = await setSupabaseAuth('clerk-token-123');

      expect(mockSupabaseClient.auth.setSession).toHaveBeenCalledWith({
        access_token: 'clerk-token-123',
        refresh_token: 'clerk-token-123',
      });
      expect(result).toEqual(mockSessionData);
    });

    it('handles errors and logs them without throwing', async () => {
      const authError = {
        message: 'Invalid token',
        status: 401,
      };

      mockSupabaseClient.auth.setSession.mockResolvedValue({
        data: null,
        error: authError,
      });

      const result = await setSupabaseAuth('invalid-token');

      expect(mockSupabaseClient.auth.setSession).toHaveBeenCalledWith({
        access_token: 'invalid-token',
        refresh_token: 'invalid-token',
      });
      expect(console.error).toHaveBeenCalledWith('Error setting Supabase session:', authError);
      expect(result).toBeNull();
    });

    it('handles network errors gracefully', async () => {
      const networkError = {
        message: 'Network error',
        status: 500,
      };

      mockSupabaseClient.auth.setSession.mockResolvedValue({
        data: null,
        error: networkError,
      });

      const result = await setSupabaseAuth('token-123');

      expect(console.error).toHaveBeenCalledWith('Error setting Supabase session:', networkError);
      expect(result).toBeNull();
    });

    it('returns null when error occurs but does not throw', async () => {
      const authError = {
        message: 'Authentication failed',
        status: 403,
      };

      mockSupabaseClient.auth.setSession.mockResolvedValue({
        data: null,
        error: authError,
      });

      // Should not throw, just return null
      const result = await setSupabaseAuth('token-123');

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });
});

