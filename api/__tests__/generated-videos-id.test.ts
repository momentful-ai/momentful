import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => mockSupabaseClient),
  select: vi.fn(() => mockSupabaseClient),
  update: vi.fn(() => mockSupabaseClient),
  delete: vi.fn(() => mockSupabaseClient),
  eq: vi.fn(() => mockSupabaseClient),
  single: vi.fn(),
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// Set environment variables
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = '';

describe('Generated Videos API [id]', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let handler: typeof import('../generated-videos/[id]').default;

  beforeAll(async () => {
    // Import handler after mocks are set up
    const handlerModule = await import('../generated-videos/[id]');
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
      mockReq.query = { id: 'video-1' };

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
      mockReq.query = { id: 'video-1' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.end).toHaveBeenCalled();
    });
  });

  describe('Parameter Validation', () => {
    it('returns 400 when id is missing', async () => {
      mockReq.method = 'GET';
      mockReq.query = {};

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Missing or invalid id parameter',
      });
    });

    it('returns 400 when id is not a string', async () => {
      mockReq.method = 'GET';
      mockReq.query = { id: ['array'] };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Missing or invalid id parameter',
      });
    });
  });

  describe('GET /api/generated-videos/[id]', () => {
    it('successfully retrieves a generated video by id', async () => {
      const mockVideo = {
        id: 'video-1',
        project_id: 'project-123',
        user_id: 'user-1',
        name: 'Test Video',
        storage_path: 'https://example.com/video.mp4',
        status: 'completed',
        created_at: '2025-01-01T00:00:00Z',
      };

      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockReturnValue({
        data: mockVideo,
        error: null,
      });

      mockReq.method = 'GET';
      mockReq.query = { id: 'video-1' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('generated_videos');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'video-1');
      expect(mockSupabaseClient.single).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockVideo);
    });

    it('handles database errors gracefully', async () => {
      const dbError = { message: 'Database connection failed', code: 'PGRST301' };

      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockReturnValue({
        data: null,
        error: dbError,
      });

      mockReq.method = 'GET';
      mockReq.query = { id: 'video-1' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to fetch generated video',
      });
    });

    it('handles video not found', async () => {
      const dbError = { message: 'Row not found', code: 'PGRST116' };

      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockReturnValue({
        data: null,
        error: dbError,
      });

      mockReq.method = 'GET';
      mockReq.query = { id: 'non-existent-video' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to fetch generated video',
      });
    });
  });

  describe('PATCH /api/generated-videos/[id]', () => {
    it('successfully updates a generated video', async () => {
      const mockUpdatedVideo = {
        id: 'video-1',
        project_id: 'project-123',
        user_id: 'user-1',
        name: 'Updated Video',
        storage_path: 'https://example.com/video.mp4',
        status: 'completed',
        created_at: '2025-01-01T00:00:00Z',
      };

      const updateData = {
        name: 'Updated Video',
        status: 'completed',
      };

      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.update.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockReturnValue({
        data: mockUpdatedVideo,
        error: null,
      });

      mockReq.method = 'PATCH';
      mockReq.query = { id: 'video-1' };
      mockReq.body = updateData;

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('generated_videos');
      expect(mockSupabaseClient.update).toHaveBeenCalledWith(updateData);
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'video-1');
      expect(mockSupabaseClient.select).toHaveBeenCalled();
      expect(mockSupabaseClient.single).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockUpdatedVideo);
    });

    it('handles database errors on update', async () => {
      const dbError = { message: 'Update failed', code: '23505' };

      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.update.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.select.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.single.mockReturnValue({
        data: null,
        error: dbError,
      });

      mockReq.method = 'PATCH';
      mockReq.query = { id: 'video-1' };
      mockReq.body = { name: 'Updated Video' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to update generated video',
      });
    });
  });

  describe('DELETE /api/generated-videos/[id]', () => {
    it('successfully deletes a generated video', async () => {
      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.delete.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue({
        data: null,
        error: null,
      });

      mockReq.method = 'DELETE';
      mockReq.query = { id: 'video-1' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('generated_videos');
      expect(mockSupabaseClient.delete).toHaveBeenCalled();
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'video-1');
      expect(mockRes.status).toHaveBeenCalledWith(204);
      expect(mockRes.end).toHaveBeenCalled();
    });

    it('handles database errors on delete', async () => {
      const dbError = { message: 'Delete failed', code: '23503' };

      mockSupabaseClient.from.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.delete.mockReturnValue(mockSupabaseClient);
      mockSupabaseClient.eq.mockReturnValue({
        data: null,
        error: dbError,
      });

      mockReq.method = 'DELETE';
      mockReq.query = { id: 'video-1' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to delete generated video',
      });
    });
  });

  describe('Unsupported HTTP Methods', () => {
    it('returns 405 for POST method', async () => {
      mockReq.method = 'POST';
      mockReq.query = { id: 'video-1' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Method not allowed',
      });
    });

    it('returns 405 for PUT method', async () => {
      mockReq.method = 'PUT';
      mockReq.query = { id: 'video-1' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Method not allowed',
      });
    });
  });

});

