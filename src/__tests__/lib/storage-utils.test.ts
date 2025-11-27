import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getSignedUrl, fetchSignedUrl, clearSignedUrlCache, SIGNED_URL_CONFIG, ExpiredUrlError } from '../../lib/storage-utils';

// Mock Supabase client
const mockCreateSignedUrl = vi.fn();
const mockSupabaseStorage = {
  from: vi.fn(() => ({
    createSignedUrl: mockCreateSignedUrl,
  })),
};

const mockSupabase = {
  storage: mockSupabaseStorage,
};

vi.mock('../../lib/supabase', () => ({
  supabase: mockSupabase,
}));

describe('storage-utils signed URLs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSignedUrlCache();
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://signed-url.example.com/file.jpg' },
      error: null,
    });
  });

  afterEach(() => {
    clearSignedUrlCache();
  });

  describe('fetchSignedUrl', () => {
    it('should fetch signed URL successfully', async () => {
      const result = await fetchSignedUrl('user-uploads', 'user123/file.jpg');

      expect(mockSupabaseStorage.from).toHaveBeenCalledWith('user-uploads');
      expect(mockCreateSignedUrl).toHaveBeenCalledWith('user123/file.jpg', 86400);

      expect(result).toEqual({
        success: true,
        signedUrl: 'https://signed-url.example.com/file.jpg',
      });
    });

    it('should use custom expiresIn', async () => {
      await fetchSignedUrl('user-uploads', 'user123/file.jpg', 7200);

      expect(mockCreateSignedUrl).toHaveBeenCalledWith('user123/file.jpg', 7200);
    });

    it('should handle Supabase errors', async () => {
      mockCreateSignedUrl.mockResolvedValue({
        data: null,
        error: { message: 'Access denied' },
      });

      const result = await fetchSignedUrl('user-uploads', 'user123/file.jpg');

      expect(result).toEqual({
        success: false,
        error: 'Access denied',
      });
    });

    it('should handle network errors', async () => {
      mockCreateSignedUrl.mockRejectedValue(new Error('Network error'));

      const result = await fetchSignedUrl('user-uploads', 'user123/file.jpg');

      expect(result).toEqual({
        success: false,
        error: 'Network error',
      });
    });

    it('should handle missing signed URL', async () => {
      mockCreateSignedUrl.mockResolvedValue({
        data: { signedUrl: null },
        error: null,
      });

      const result = await fetchSignedUrl('user-uploads', 'user123/file.jpg');

      expect(result).toEqual({
        success: false,
        error: 'No signed URL returned',
      });
    });

    it('should detect expired URL from 403 error and retry', async () => {
      // First call returns 403 (expired)
      mockCreateSignedUrl.mockResolvedValueOnce({
        data: null,
        error: { message: '403 Forbidden - URL expired' },
      });
      // Second call succeeds
      mockCreateSignedUrl.mockResolvedValueOnce({
        data: { signedUrl: 'https://signed-url.example.com/file.jpg' },
        error: null,
      });

      const result = await fetchSignedUrl('user-uploads', 'user123/file.jpg');

      expect(mockCreateSignedUrl).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        success: true,
        signedUrl: 'https://signed-url.example.com/file.jpg',
      });
    });

    it('should detect expired URL from 401 error and retry', async () => {
      // First call returns 401 (unauthorized/expired)
      mockCreateSignedUrl.mockResolvedValueOnce({
        data: null,
        error: { message: '401 Unauthorized - token expired' },
      });
      // Second call succeeds
      mockCreateSignedUrl.mockResolvedValueOnce({
        data: { signedUrl: 'https://signed-url.example.com/file.jpg' },
        error: null,
      });

      const result = await fetchSignedUrl('user-uploads', 'user123/file.jpg');

      expect(mockCreateSignedUrl).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        success: true,
        signedUrl: 'https://signed-url.example.com/file.jpg',
      });
    });

    it('should detect expired URL from "expired" message and retry', async () => {
      // First call returns expired message
      mockCreateSignedUrl.mockResolvedValueOnce({
        data: null,
        error: { message: 'The signed URL has expired' },
      });
      // Second call succeeds
      mockCreateSignedUrl.mockResolvedValueOnce({
        data: { signedUrl: 'https://signed-url.example.com/file.jpg' },
        error: null,
      });

      const result = await fetchSignedUrl('user-uploads', 'user123/file.jpg');

      expect(mockCreateSignedUrl).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        success: true,
        signedUrl: 'https://signed-url.example.com/file.jpg',
      });
    });

    it('should throw ExpiredUrlError after max retries', async () => {
      // All calls return 403 (expired)
      mockCreateSignedUrl.mockResolvedValue({
        data: null,
        error: { message: '403 Forbidden - URL expired' },
      });

      await expect(fetchSignedUrl('user-uploads', 'user123/file.jpg')).rejects.toThrow(ExpiredUrlError);
      expect(mockCreateSignedUrl).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    it('should not retry on non-expired errors', async () => {
      mockCreateSignedUrl.mockResolvedValue({
        data: null,
        error: { message: 'Bucket not found' },
      });

      const result = await fetchSignedUrl('user-uploads', 'user123/file.jpg');

      expect(mockCreateSignedUrl).toHaveBeenCalledTimes(1); // No retry
      expect(result).toEqual({
        success: false,
        error: 'Bucket not found',
      });
    });

    it('should implement exponential backoff for retries', async () => {
      vi.useFakeTimers();

      // Mock setTimeout to track delays
      const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

      // First call returns 403 (expired)
      mockCreateSignedUrl.mockResolvedValueOnce({
        data: null,
        error: { message: '403 Forbidden - URL expired' },
      });
      // Second call also returns 403
      mockCreateSignedUrl.mockResolvedValueOnce({
        data: null,
        error: { message: '403 Forbidden - URL expired' },
      });
      // Third call succeeds
      mockCreateSignedUrl.mockResolvedValueOnce({
        data: { signedUrl: 'https://signed-url.example.com/file.jpg' },
        error: null,
      });

      const promise = fetchSignedUrl('user-uploads', 'user123/file.jpg');

      // Advance timers for retries
      await vi.advanceTimersByTimeAsync(1000); // 1s delay
      await vi.advanceTimersByTimeAsync(2000); // 2s delay

      const result = await promise;

      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000);
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 2000);
      expect(result.success).toBe(true);

      vi.useRealTimers();
      setTimeoutSpy.mockRestore();
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
        error: 'expiresIn must be a positive number not exceeding 86400 seconds (1 day)',
      });
    });

    it('should use cached signed URL', async () => {
      // First call
      await getSignedUrl('user-uploads', 'user123/file.jpg');

      // Reset mock to track second call
      mockCreateSignedUrl.mockClear();

      // Second call should use cache
      const result = await getSignedUrl('user-uploads', 'user123/file.jpg');

      expect(mockCreateSignedUrl).not.toHaveBeenCalled(); // Should use cache
      expect(result).toEqual({
        success: true,
        signedUrl: 'https://signed-url.example.com/file.jpg',
      });
    });

    it('should fetch new URL when cache is expired', async () => {
      // First call with valid expiry
      await getSignedUrl('user-uploads', 'user123/file.jpg');

      // Clear cache to simulate expiry
      clearSignedUrlCache();

      // Reset mock to track new call
      mockCreateSignedUrl.mockClear();

      // This should trigger a new fetch since the cached URL is cleared
      const result = await getSignedUrl('user-uploads', 'user123/file.jpg');

      expect(mockCreateSignedUrl).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });
  });

  describe('clearSignedUrlCache', () => {
    it('should clear the cache', async () => {
      // Load URL into cache
      await getSignedUrl('user-uploads', 'user123/file.jpg');

      // Clear cache
      clearSignedUrlCache();

      // Reset mock to track new call
      mockCreateSignedUrl.mockClear();

      // Next call should fetch again
      await getSignedUrl('user-uploads', 'user123/file.jpg');

      expect(mockCreateSignedUrl).toHaveBeenCalledTimes(1);
    });
  });

  describe('SIGNED_URL_CONFIG', () => {
    it('should have correct default values', () => {
      expect(SIGNED_URL_CONFIG).toEqual({
        defaultExpiry: 86400, // 1 day
        maxExpiry: 24 * 60 * 60, // 24 hours
        cacheExpiry: 12 * 60 * 60 * 1000, // 12 hours
      });
    });
  });
});
