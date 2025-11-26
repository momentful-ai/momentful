import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Set environment variables before any imports
process.env.RUNWAY_API_KEY = 'test-api-key';
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
    update: vi.fn(() => ({
      eq: vi.fn(),
    })),
  })),
};

vi.mock('../shared/supabase', () => ({
  supabase: mockSupabaseClient,
}));

// Mock Runway dependencies
vi.mock('@runwayml/sdk', () => ({
  default: vi.fn(() => ({
    textToImage: { create: vi.fn() },
    imageToVideo: { create: vi.fn() },
  })),
}));

vi.mock('../shared/runway', () => ({
  createVideoTask: vi.fn(() => ({ id: 'task123' })),
  createImageTask: vi.fn(),
  Mode: { 'image-to-video': 'image-to-video' },
}));

vi.mock('../shared/external-signed-urls', () => ({
  convertStoragePathsToSignedUrls: vi.fn((obj) => Promise.resolve(obj)),
}));

vi.mock('../validation', () => ({
  createJobSchema: {
    safeParse: vi.fn(() => ({ success: true, data: {} })),
  },
}));

describe('Runway Jobs API - Generation Limits', () => {
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
        mode: 'image-to-video',
        userId: 'user123',
        projectId: 'project456',
        name: 'Test Video',
        aiModel: 'gen4',
        aspectRatio: '9:16',
        cameraMovement: 'dynamic',
      },
    };
    mockRes = {
      status: mockStatus,
    };
  });

  describe('POST /api/runway/jobs - Video Limits', () => {
    it.skip('allows video generation when user has remaining video credits', async () => {
      const { default: handler } = await import('../runway/jobs/index');

      // Mock user has limits
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { videos_remaining: 3 },
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

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockUpdate).toHaveBeenCalledWith({ videos_remaining: 2 });
    });

    it.skip('blocks video generation when user has no remaining video credits', async () => {
      const { default: handler } = await import('../runway/jobs/index');

      // Mock user has no limits
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { videos_remaining: 0 },
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
        error: 'Video generation limit reached',
        message: `You’ve maxed out your video credits :(
Message the Momentful crew at hello@momentful.ai to unlock more.`,
      });
    });

    it.skip('creates default limits for new users and allows video generation', async () => {
      const { default: handler } = await import('../runway/jobs/index');

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
            data: { videos_remaining: 5 },
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

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockUpdate).toHaveBeenCalledWith({ videos_remaining: 4 });
    });

    it.skip('only checks limits for image-to-video mode', async () => {
      const { default: handler } = await import('../runway/jobs/index');

      mockReq.body = {
        ...mockReq.body,
        mode: 'image-generation', // Not image-to-video
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      // Should not check video limits for image generation
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('handles database errors during limit check', async () => {
      const { default: handler } = await import('../runway/jobs/index');

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
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    it('skips limit check when userId is not provided', async () => {
      const { default: handler } = await import('../runway/jobs/index');

      mockReq.body = {
        ...mockReq.body,
        userId: undefined,
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      // Should not call supabase for limits
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
    });
  });
});