import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Set environment variables before any imports
process.env.NODE_ENV = 'development';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(),
      })),
    })),
  })),
};

vi.mock('../shared/supabase', () => ({
  supabase: mockSupabaseClient,
}));

describe('Generation Limits API', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let mockJson: ReturnType<typeof vi.fn>;
  let mockStatus: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockJson = vi.fn();
    mockStatus = vi.fn(() => ({ json: mockJson }));

    mockReq = {
      method: 'GET',
    };
    mockRes = {
      status: mockStatus,
    };
  });

  describe('GET /api/generation-limits', () => {
    it('returns existing user limits successfully', async () => {
      const { default: handler } = await import('../generation-limits/index');

      mockReq.query = { userId: 'user123' };

      // Mock existing limits
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: {
              user_id: 'user123',
              images_remaining: 7,
              videos_remaining: 2,
              images_limit: 10,
              videos_limit: 5,
            },
            error: null,
          }),
        })),
      }));

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        imagesRemaining: 7,
        videosRemaining: 2,
        imagesLimit: 10,
        videosLimit: 5,
      });
    });

    it('creates and returns default limits for new user', async () => {
      const { default: handler } = await import('../generation-limits/index');

      mockReq.query = { userId: 'newuser123' };

      // Mock no existing limits (fetch error)
      const mockSelectExisting = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Not found' },
          }),
        })),
      }));

      // Mock successful insert
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: {
              user_id: 'newuser123',
              images_remaining: 10,
              videos_remaining: 5,
              images_limit: 10,
              videos_limit: 5,
            },
            error: null,
          }),
        })),
      }));

      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: mockSelectExisting,
        })
        .mockReturnValueOnce({
          insert: mockInsert,
        });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        imagesRemaining: 10,
        videosRemaining: 5,
        imagesLimit: 10,
        videosLimit: 5,
      });
    });

    it('handles missing userId parameter', async () => {
      const { default: handler } = await import('../generation-limits/index');

      mockReq.query = {};

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({ error: 'Missing or invalid userId' });
    });

    it('handles database errors during fetch', async () => {
      const { default: handler } = await import('../generation-limits/index');

      mockReq.query = { userId: 'user123' };

      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' },
          }),
        })),
      }));

      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Insert failed' },
          }),
        })),
      }));

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Failed to create user generation limits',
        details: 'Insert failed',
      });
    });

    it('handles database errors during creation', async () => {
      const { default: handler } = await import('../generation-limits/index');

      mockReq.query = { userId: 'newuser123' };

      // Mock fetch failure
      const mockSelectExisting = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Not found' },
          }),
        })),
      }));

      // Mock insert failure
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Insert failed' },
          }),
        })),
      }));

      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: mockSelectExisting,
        })
        .mockReturnValueOnce({
          insert: mockInsert,
        });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Failed to create user generation limits',
        details: 'Insert failed',
      });
    });

    it('handles non-GET methods', async () => {
      const { default: handler } = await import('../generation-limits/index');

      mockReq.method = 'POST';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(405);
    });
  });
});