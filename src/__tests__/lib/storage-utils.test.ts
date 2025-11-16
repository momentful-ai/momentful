import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSignedUrl, fetchSignedUrl, clearSignedUrlCache, SIGNED_URL_CONFIG } from '../../lib/storage-utils';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('storage-utils signed URLs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSignedUrlCache();
  });

  afterEach(() => {
    clearSignedUrlCache();
  });

  describe('fetchSignedUrl', () => {
    it('should fetch signed URL successfully', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          signedUrl: 'https://signed-url.example.com/file.jpg',
          expiresAt: '2025-11-16T12:00:00Z',
          expiresIn: 3600,
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await fetchSignedUrl('user-uploads', 'user123/file.jpg');

      expect(mockFetch).toHaveBeenCalledWith('/api/signed-urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bucket: 'user-uploads',
          path: 'user123/file.jpg',
          expiresIn: 3600,
        }),
      });

      expect(result).toEqual({
        success: true,
        signedUrl: 'https://signed-url.example.com/file.jpg',
      });
    });

    it('should use custom expiresIn', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          signedUrl: 'https://signed-url.example.com/file.jpg',
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await fetchSignedUrl('user-uploads', 'user123/file.jpg', 7200);

      expect(mockFetch).toHaveBeenCalledWith('/api/signed-urls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bucket: 'user-uploads',
          path: 'user123/file.jpg',
          expiresIn: 7200,
        }),
      });
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: vi.fn().mockResolvedValue({ error: 'Access denied' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await fetchSignedUrl('user-uploads', 'user123/file.jpg');

      expect(result).toEqual({
        success: false,
        error: 'Access denied',
      });
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const result = await fetchSignedUrl('user-uploads', 'user123/file.jpg');

      expect(result).toEqual({
        success: false,
        error: 'Network error',
      });
    });

    it('should handle malformed response', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await fetchSignedUrl('user-uploads', 'user123/file.jpg');

      expect(result).toEqual({
        success: false,
        error: 'No signed URL returned from server',
      });
    });
  });

  describe('getSignedUrl', () => {
    it('should validate bucket parameter', async () => {
      const result = await getSignedUrl('', 'user123/file.jpg');
      expect(result).toEqual({
        success: false,
        error: 'Bucket parameter is required and must be a string',
      });
    });

    it('should validate path parameter', async () => {
      const result = await getSignedUrl('user-uploads', '');
      expect(result).toEqual({
        success: false,
        error: 'Path parameter is required and must be a string',
      });
    });

    it('should validate bucket name', async () => {
      const result = await getSignedUrl('invalid-bucket', 'user123/file.jpg');
      expect(result).toEqual({
        success: false,
        error: 'Invalid bucket. Must be one of: user-uploads, edited-images, generated-videos, thumbnails',
      });
    });

    it('should validate expiresIn range', async () => {
      const result = await getSignedUrl('user-uploads', 'user123/file.jpg', 0);
      expect(result).toEqual({
        success: false,
        error: 'expiresIn must be a positive number not exceeding 86400 seconds (24 hours)',
      });
    });

    it('should use cached signed URL', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          signedUrl: 'https://signed-url.example.com/file.jpg',
          expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // First call
      await getSignedUrl('user-uploads', 'user123/file.jpg');

      // Second call should use cache
      const result = await getSignedUrl('user-uploads', 'user123/file.jpg');

      expect(mockFetch).toHaveBeenCalledTimes(1); // Only one API call
      expect(result).toEqual({
        success: true,
        signedUrl: 'https://signed-url.example.com/file.jpg',
      });
    });

    it('should fetch new URL when cache is expired', async () => {
      const expiredTime = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 minutes ago
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          signedUrl: 'https://signed-url.example.com/file.jpg',
          expiresAt: expiredTime,
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // This should trigger a new fetch since the cached URL is expired
      const result = await getSignedUrl('user-uploads', 'user123/file.jpg');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(true);
    });
  });

  describe('clearSignedUrlCache', () => {
    it('should clear the cache', async () => {
      const mockResponse = {
        ok: true,
        json: vi.fn().mockResolvedValue({
          signedUrl: 'https://signed-url.example.com/file.jpg',
          expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      // Load URL into cache
      await getSignedUrl('user-uploads', 'user123/file.jpg');

      // Clear cache
      clearSignedUrlCache();

      // Next call should fetch again
      await getSignedUrl('user-uploads', 'user123/file.jpg');

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('SIGNED_URL_CONFIG', () => {
    it('should have correct default values', () => {
      expect(SIGNED_URL_CONFIG).toEqual({
        defaultExpiry: 3600, // 1 hour
        maxExpiry: 24 * 60 * 60, // 24 hours
        cacheExpiry: 50 * 60 * 1000, // 50 minutes
      });
    });
  });
});
