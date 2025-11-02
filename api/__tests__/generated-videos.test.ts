import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => mockSupabaseClient),
  select: vi.fn(() => mockSupabaseClient),
  insert: vi.fn(() => mockSupabaseClient),
  update: vi.fn(() => mockSupabaseClient),
  delete: vi.fn(() => mockSupabaseClient),
  eq: vi.fn(() => mockSupabaseClient),
  order: vi.fn(() => mockSupabaseClient),
  single: vi.fn(),
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// Set environment variables
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';

// Mock console.warn
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('Generated Videos API - Environment Variables', () => {
  it('warns when VITE_SUPABASE_ANON_KEY is missing', async () => {
    // Temporarily remove the environment variable
    const originalKey = process.env.VITE_SUPABASE_ANON_KEY;
    delete process.env.VITE_SUPABASE_ANON_KEY;

    // Re-import the handler to trigger the warning
    const handlerModule = await import('../generated-videos');
    const testHandler = handlerModule.default;

    // Restore the environment variable
    process.env.VITE_SUPABASE_ANON_KEY = originalKey;

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      '⚠️  VITE_SUPABASE_ANON_KEY not set. API endpoints may not work properly.'
    );
  });
});

describe('Generated Videos API', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let handler: typeof import('../generated-videos').default;

  beforeAll(async () => {
    // Import handler after mocks are set up
    const handlerModule = await import('../generated-videos');
    handler = handlerModule.default;
  });

  beforeEach(() => {
    // Setup mock request
    mockReq = {
      method: 'GET',
      query: {},
      body: {},
    };

    // Setup mock response
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      end: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
    };

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('CORS Headers', () => {
    it('sets CORS headers for all requests', async () => {
      mockReq.method = 'OPTIONS';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, PATCH, DELETE, OPTIONS'
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization'
      );
    });
  });

  describe('OPTIONS Request', () => {
    it('handles OPTIONS preflight request', async () => {
      mockReq.method = 'OPTIONS';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.end).toHaveBeenCalled();
    });
  });

  describe('GET /api/generated-videos', () => {
    it('successfully retrieves generated videos by projectId', async () => {
      const mockVideos = [
        {
          id: 'video-1',
          project_id: 'project-123',
          user_id: 'user-1',
          name: 'Test Video',
          storage_path: 'https://example.com/video.mp4',
          status: 'completed',
          created_at: '2025-01-01T00:00:00Z',
        },
        {
          id: 'video-2',
          project_id: 'project-123',
          user_id: 'user-1',
          name: 'Test Video 2',
          storage_path: 'https://example.com/video2.mp4',
          status: 'processing',
          created_at: '2025-01-02T00:00:00Z',
        },
      ];

      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.order.mockReturnValue({
        data: mockVideos,
        error: null,
      });

      mockReq.method = 'GET';
      mockReq.query = { projectId: 'project-123' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('generated_videos');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('project_id', 'project-123');
      expect(mockSupabaseClient.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockVideos);
    });

    it('returns empty array when no videos found', async () => {
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.order.mockReturnValue({
        data: [],
        error: null,
      });

      mockReq.method = 'GET';
      mockReq.query = { projectId: 'project-123' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([]);
    });

    it('returns 400 when projectId is missing', async () => {
      mockReq.method = 'GET';
      mockReq.query = {};

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Missing or invalid projectId parameter',
      });
    });

    it('returns 400 when projectId is not a string', async () => {
      mockReq.method = 'GET';
      mockReq.query = { projectId: ['array'] };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Missing or invalid projectId parameter',
      });
    });

    it('handles database errors gracefully', async () => {
      const dbError = { message: 'Database connection failed', code: 'PGRST301' };

      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.order.mockReturnValue({
        data: null,
        error: dbError,
      });

      mockReq.method = 'GET';
      mockReq.query = { projectId: 'project-123' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to fetch generated videos',
      });
    });
  });

  describe('POST /api/generated-videos', () => {
    it('successfully creates a new generated video', async () => {
      const mockVideo = {
        id: 'video-new',
        project_id: 'project-123',
        user_id: 'user-1',
        name: 'New Video',
        storage_path: 'https://example.com/new-video.mp4',
        status: 'processing',
        created_at: '2025-01-01T00:00:00Z',
      };

      const requestBody = {
        project_id: 'project-123',
        user_id: 'user-1',
        name: 'New Video',
        storage_path: 'https://example.com/new-video.mp4',
        status: 'processing',
      };

      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.insert.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockReturnValue({
        data: mockVideo,
        error: null,
      });

      mockReq.method = 'POST';
      mockReq.body = requestBody;

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('generated_videos');
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith(requestBody);
      expect(mockSupabaseClient.select).toHaveBeenCalled();
      expect(mockSupabaseClient.single).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockVideo);
    });

    it('handles database errors on create', async () => {
      const dbError = { message: 'Insert failed', code: '23505' };

      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.insert.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockReturnValue({
        data: null,
        error: dbError,
      });

      mockReq.method = 'POST';
      mockReq.body = {
        project_id: 'project-123',
        user_id: 'user-123',
        name: 'New Video',
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to create generated video',
      });
    });

    it('handles invalid request body', async () => {
      // Invalid request body (missing required fields) should return 400 (validation error)
      mockReq.method = 'POST';
      mockReq.body = { invalid: 'data' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: expect.stringContaining('project_id is required'),
      });
    });

    it('validates user_id is required and not empty', async () => {
      mockReq.method = 'POST';
      mockReq.body = {
        project_id: 'project-123',
        user_id: '', // Empty string
        name: 'Test Video',
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'user_id is required and cannot be empty',
      });
    });

    it('validates user_id is present', async () => {
      mockReq.method = 'POST';
      mockReq.body = {
        project_id: 'project-123',
        name: 'Test Video',
        // user_id is missing
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'user_id is required and cannot be empty',
      });
    });

    it('validates user_id is a string', async () => {
      mockReq.method = 'POST';
      mockReq.body = {
        project_id: 'project-123',
        user_id: 123, // Number instead of string
        name: 'Test Video',
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'user_id is required and cannot be empty',
      });
    });
  });

  describe('Unsupported HTTP Methods', () => {
    it('returns 405 for PUT method', async () => {
      mockReq.method = 'PUT';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Method not allowed',
      });
    });

    it('returns 405 for PATCH method', async () => {
      mockReq.method = 'PATCH';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Method not allowed',
      });
    });

    it('returns 405 for DELETE method', async () => {
      mockReq.method = 'DELETE';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Method not allowed',
      });
    });
  });
});

