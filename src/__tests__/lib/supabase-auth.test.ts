import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setSupabaseAuth } from '../../lib/supabase-auth';
import type { User, Session, AuthError, AuthResponse } from '@supabase/supabase-js';

// Mock Supabase client - must be defined inside the factory
vi.mock('../../lib/supabase', () => {
  const mockSetSession = vi.fn();
  const mockAuth = {
    setSession: mockSetSession,
  };
  const mockSupabaseClient = {
    auth: mockAuth,
  };
  return {
    supabase: mockSupabaseClient,
  };
});

// Import after mock to get the mocked version
import { supabase } from '../../lib/supabase';
const mockSetSession = vi.mocked(supabase.auth.setSession);

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
        } as User,
        session: {
          access_token: 'clerk-token-123',
          refresh_token: 'clerk-token-123',
        } as Session,
      };

      mockSetSession.mockResolvedValue({
        data: mockSessionData,
        error: null,
      } as AuthResponse);

      const result = await setSupabaseAuth('clerk-token-123');

      expect(mockSetSession).toHaveBeenCalledWith({
        access_token: 'clerk-token-123',
        refresh_token: 'clerk-token-123',
      });
      expect(result).toEqual(mockSessionData);
    });

    it('handles errors and logs them without throwing', async () => {
      const authError = {
        message: 'Invalid token',
        status: 401,
        code: 'invalid_token',
        __isAuthError: true,
        name: 'AuthError',
      } as unknown as AuthError;

      mockSetSession.mockResolvedValue({
        data: { user: null, session: null },
        error: authError,
      } as AuthResponse);

      const result = await setSupabaseAuth('invalid-token');

      expect(mockSetSession).toHaveBeenCalledWith({
        access_token: 'invalid-token',
        refresh_token: 'invalid-token',
      });
      expect(console.error).toHaveBeenCalledWith('Error setting Supabase session:', authError);
      expect(result).toEqual({ user: null, session: null });
    });

    it('handles network errors gracefully', async () => {
      const networkError = {
        message: 'Network error',
        status: 500,
        code: 'network_error',
        __isAuthError: true,
        name: 'AuthError',
      } as unknown as AuthError;

      mockSetSession.mockResolvedValue({
        data: { user: null, session: null },
        error: networkError,
      } as AuthResponse);

      const result = await setSupabaseAuth('token-123');

      expect(console.error).toHaveBeenCalledWith('Error setting Supabase session:', networkError);
      expect(result).toEqual({ user: null, session: null });
    });

    it('returns null when error occurs but does not throw', async () => {
      const authError = {
        message: 'Authentication failed',
        status: 403,
        code: 'auth_failed',
        __isAuthError: true,
        name: 'AuthError',
      } as unknown as AuthError;

      mockSetSession.mockResolvedValue({
        data: { user: null, session: null },
        error: authError,
      } as AuthResponse);

      // Should not throw, just return null user/session
      const result = await setSupabaseAuth('token-123');

      expect(result).toEqual({ user: null, session: null });
      expect(console.error).toHaveBeenCalled();
    });
  });
});

