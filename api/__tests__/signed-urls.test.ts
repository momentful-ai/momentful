import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Mock Supabase client
const mockSupabaseClient = {
  storage: {
    from: vi.fn(() => ({
      createSignedUrl: vi.fn(),
    })),
  },
};

// Mock the createClient function
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// Set environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

describe('Signed URLs API', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let handler: typeof import('../signed-urls-external').default;

  beforeAll(async () => {
    const handlerModule = await import('../signed-urls-external');
    handler = handlerModule.default;
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock request
    mockReq = {
      method: 'POST',
      body: {},
    };

    // Setup mock response
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      end: vi.fn().mockReturnThis(),
      setHeader: vi.fn(),
    };
  });

  describe('OPTIONS request', () => {
    it('should handle OPTIONS request', async () => {
      mockReq.method = 'OPTIONS';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.end).toHaveBeenCalled();
    });
  });

  describe('Method validation', () => {
    it('should reject non-POST methods', async () => {
      mockReq.method = 'GET';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Method not allowed. Use POST to generate external signed URLs.',
      });
    });
  });

  describe('Parameter validation', () => {
    beforeEach(() => {
      mockReq.method = 'POST';
    });

    it('should reject missing bucket parameter', async () => {
      mockReq.body = { path: 'user123/file.jpg' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'bucket parameter is required and must be a string',
      });
    });

    it('should reject invalid bucket type', async () => {
      mockReq.body = { bucket: 123, path: 'user123/file.jpg' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'bucket parameter is required and must be a string',
      });
    });

    it('should reject missing path parameter', async () => {
      mockReq.body = { bucket: 'user-uploads' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'path parameter is required and must be a string',
      });
    });

    it('should reject invalid path type', async () => {
      mockReq.body = { bucket: 'user-uploads', path: 123 };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'path parameter is required and must be a string',
      });
    });

    it('should reject invalid bucket name', async () => {
      mockReq.body = { bucket: 'invalid-bucket', path: 'user123/file.jpg' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid bucket for external access. Must be one of: user-uploads, edited-images, generated-videos, thumbnails',
      });
    });

    it('should reject invalid expiresIn - negative value', async () => {
      mockReq.body = { bucket: 'user-uploads', path: 'user123/file.jpg', expiresIn: -1 };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'expiresIn must be a positive number not exceeding 600 seconds (10 minutes)',
      });
    });

    it('should reject invalid expiresIn - too large', async () => {
      mockReq.body = { bucket: 'user-uploads', path: 'user123/file.jpg', expiresIn: 601 };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'expiresIn must be a positive number not exceeding 600 seconds (10 minutes)',
      });
    });
  });


  describe('Signed URL generation', () => {
    beforeEach(() => {
      mockReq.method = 'POST';
      mockReq.body = { bucket: 'user-uploads', path: 'user123/file.jpg', expiresIn: 300 };
    });

    it('should generate signed URL successfully', async () => {
      const mockSignedUrl = 'https://test.supabase.co/storage/v1/object/sign/user-uploads/user123/file.jpg?token=test-token';

      mockSupabaseClient.storage.from.mockReturnValue({
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: mockSignedUrl },
          error: null,
        }),
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('user-uploads');
      expect(mockSupabaseClient.storage.from('user-uploads').createSignedUrl).toHaveBeenCalledWith('user123/file.jpg', 300);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseData = (mockRes.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(responseData.signedUrl).toBe(mockSignedUrl);
      expect(responseData.expiresIn).toBe(300);
      expect(responseData.expiresAt).toBeDefined();
    });

    it('should use default expiry time when not specified', async () => {
      mockReq.body = { bucket: 'user-uploads', path: 'user123/file.jpg' };

      const mockSignedUrl = 'https://test.supabase.co/storage/v1/object/sign/user-uploads/user123/file.jpg?token=test-token';

      mockSupabaseClient.storage.from.mockReturnValue({
        createSignedUrl: vi.fn().mockResolvedValue({
          data: { signedUrl: mockSignedUrl },
          error: null,
        }),
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockSupabaseClient.storage.from('user-uploads').createSignedUrl).toHaveBeenCalledWith('user123/file.jpg', 300);
    });

    it('should handle storage errors', async () => {
      const mockError = { message: 'File not found' };
      mockSupabaseClient.storage.from.mockReturnValue({
        createSignedUrl: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Failed to generate signed URL' });
    });

    it('should handle missing signed URL data', async () => {
      mockSupabaseClient.storage.from.mockReturnValue({
        createSignedUrl: vi.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'File not found or access denied' });
    });
  });

  describe('Error handling', () => {
    it('should handle unexpected errors', async () => {
      mockReq.method = 'POST';
      mockReq.body = { bucket: 'user-uploads', path: 'user123/file.jpg' };

      // Simulate an unexpected error in storage operations
      mockSupabaseClient.storage.from.mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
});

