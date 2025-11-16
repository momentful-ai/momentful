import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Mock Supabase client
const mockCreateSignedUrl = vi.fn();
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
  },
  storage: {
    from: vi.fn(() => ({
      createSignedUrl: mockCreateSignedUrl,
    })),
  },
};

// Mock the shared supabase module
vi.mock('../shared/supabase.js', () => ({
  supabase: mockSupabaseClient,
}));

// Mock the shared storage module
const mockValidateStoragePath = vi.fn();
const mockHandleStorageError = vi.fn();

vi.mock('../shared/storage.js', () => ({
  validateStoragePath: mockValidateStoragePath,
  handleStorageError: mockHandleStorageError,
}));

// Set environment variables
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SECRET_KEY = 'test-secret-key';

describe('Signed URLs API', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let handler: typeof import('../signed-urls').default;

  beforeAll(async () => {
    const handlerModule = await import('../signed-urls');
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
        error: 'Method not allowed. Use POST to generate signed URLs.',
      });
    });
  });

  describe('Parameter validation', () => {
    beforeEach(() => {
      mockReq.method = 'POST';
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null,
      });
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
        error: 'Invalid bucket. Must be one of: user-uploads, edited-images, generated-videos, thumbnails',
      });
    });

    it('should reject invalid expiresIn - negative value', async () => {
      mockReq.body = { bucket: 'user-uploads', path: 'user123/file.jpg', expiresIn: -1 };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'expiresIn must be a positive number not exceeding 86400 seconds (24 hours)',
      });
    });

    it('should reject invalid expiresIn - too large', async () => {
      mockReq.body = { bucket: 'user-uploads', path: 'user123/file.jpg', expiresIn: 86401 };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'expiresIn must be a positive number not exceeding 86400 seconds (24 hours)',
      });
    });

    it('should reject invalid expiresIn - zero', async () => {
      mockReq.body = { bucket: 'user-uploads', path: 'user123/file.jpg', expiresIn: 0 };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'expiresIn must be a positive number not exceeding 86400 seconds (24 hours)',
      });
    });
  });

  describe('Authentication', () => {
    beforeEach(() => {
      mockReq.method = 'POST';
      mockReq.body = { bucket: 'user-uploads', path: 'user123/file.jpg' };
    });

    it('should reject unauthenticated requests', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
    });

    it('should reject requests with auth errors', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Authentication required' });
    });
  });

  describe('Path validation', () => {
    beforeEach(() => {
      mockReq.method = 'POST';
      mockReq.body = { bucket: 'user-uploads', path: 'user123/file.jpg' };
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null,
      });
    });

    it('should reject invalid storage paths', async () => {
      mockValidateStoragePath.mockReturnValue({
        valid: false,
        error: 'Invalid storage path',
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockValidateStoragePath).toHaveBeenCalledWith('user123', 'user123/file.jpg');
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid storage path' });
    });
  });

  describe('Signed URL generation', () => {
    beforeEach(() => {
      mockReq.method = 'POST';
      mockReq.body = { bucket: 'user-uploads', path: 'user123/file.jpg', expiresIn: 3600 };
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: 'user123' } },
        error: null,
      });
      mockValidateStoragePath.mockReturnValue({ valid: true });
    });

    it('should generate signed URL successfully', async () => {
      const mockSignedUrl = 'https://test.supabase.co/storage/v1/object/sign/user-uploads/user123/file.jpg?token=test-token';

      mockCreateSignedUrl.mockResolvedValue({
        data: { signedUrl: mockSignedUrl },
        error: null,
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('user-uploads');
      expect(mockCreateSignedUrl).toHaveBeenCalledWith('user123/file.jpg', 3600);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const responseData = (mockRes.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(responseData.signedUrl).toBe(mockSignedUrl);
      expect(responseData.expiresIn).toBe(3600);
      expect(responseData.expiresAt).toBeDefined();
    });

    it('should use default expiry time when not specified', async () => {
      mockReq.body = { bucket: 'user-uploads', path: 'user123/file.jpg' };

      const mockSignedUrl = 'https://test.supabase.co/storage/v1/object/sign/user-uploads/user123/file.jpg?token=test-token';

      mockCreateSignedUrl.mockResolvedValue({
        data: { signedUrl: mockSignedUrl },
        error: null,
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockCreateSignedUrl).toHaveBeenCalledWith('user123/file.jpg', 3600);
    });

    it('should handle storage errors', async () => {
      const mockError = { message: 'File not found' };
      mockCreateSignedUrl.mockResolvedValue({
        data: null,
        error: mockError,
      });

      mockHandleStorageError.mockReturnValue({
        success: false,
        error: 'Storage operation failed',
      });

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockHandleStorageError).toHaveBeenCalledWith(mockError, 'signed URL generation');
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Storage operation failed',
      });
    });

    it('should handle missing signed URL data', async () => {
      mockCreateSignedUrl.mockResolvedValue({
        data: null,
        error: null,
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

      // Simulate an unexpected error
      mockSupabaseClient.auth.getUser.mockRejectedValue(new Error('Unexpected error'));

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
});
