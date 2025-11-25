import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Set environment variables before any imports
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(),
};

vi.mock('../shared/supabase', () => ({
  supabase: mockSupabaseClient,
}));

// Mock other dependencies
vi.mock('../shared/replicate', () => ({
  createReplicatePrediction: vi.fn(),
  validatePredictionInput: vi.fn(() => ({ valid: true })),
  ReplicateModels: {},
}));

vi.mock('../shared/external-signed-urls', () => ({
  convertStoragePathsToSignedUrls: vi.fn((input) => Promise.resolve(input)),
}));

describe('Replicate Predictions API - Generation Limits', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let mockJson: ReturnType<typeof vi.fn>;
  let mockStatus: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockJson = vi.fn();
    mockStatus = vi.fn(() => ({ json: mockJson }));

    mockReq = {
      method: 'POST',
      body: {
        version: 'test-version',
        input: { test: 'data' },
        userId: 'user123',
        projectId: 'project456',
        prompt: 'Test prompt',
      },
    };
    mockRes = {
      status: mockStatus,
    };
  });

  describe('POST /api/replicate/predictions - Limits', () => {
    it('allows generation when user has remaining image credits', async () => {
      const { default: handler } = await import('../replicate/predictions/index');

      // Mock user has limits
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { images_remaining: 5 },
            error: null,
          }),
        })),
      }));

      const mockUpdate = vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }));

      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: mockSelect,
        })
        .mockReturnValueOnce({
          update: mockUpdate,
        });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockUpdate).toHaveBeenCalledWith({ images_remaining: 4 });
    });

    it('blocks generation when user has no remaining image credits', async () => {
      const { default: handler } = await import('../replicate/predictions/index');

      // Mock user has no limits
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { images_remaining: 0 },
            error: null,
          }),
        })),
      }));

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Image generation limit reached',
        message: `You’ve maxed out your image credits :(
Message the Momentful crew at hello@momentful.ai to unlock more.`,
      });
    });

    it('creates default limits for new users and allows generation', async () => {
      const { default: handler } = await import('../replicate/predictions/index');

      // Mock no existing limits
      const mockSelect = vi.fn(() => ({
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
            data: { images_remaining: 10 },
            error: null,
          }),
        })),
      }));

      const mockUpdate = vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }));

      mockSupabaseClient.from
        .mockReturnValueOnce({
          select: mockSelect,
        })
        .mockReturnValueOnce({
          insert: mockInsert,
        })
        .mockReturnValueOnce({
          update: mockUpdate,
        });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockUpdate).toHaveBeenCalledWith({ images_remaining: 9 });
    });

    it('handles database errors during limit check', async () => {
      const { default: handler } = await import('../replicate/predictions/index');

      // Mock database error
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' },
          }),
        })),
      }));

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      // Should still proceed with generation despite limit check failure
      expect(mockStatus).toHaveBeenCalledWith(201);
    });

    it('skips limit check when userId is not provided', async () => {
      const { default: handler } = await import('../replicate/predictions/index');

      mockReq.body = {
        ...mockReq.body,
        userId: undefined,
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      // Should not call supabase for limits
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(201);
    });
  });
});