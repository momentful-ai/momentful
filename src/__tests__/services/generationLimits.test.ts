import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserGenerationLimits } from '../../services/generationLimits';

// Mock fetch globally
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('Generation Limits Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserGenerationLimits', () => {
    it('successfully fetches user generation limits', async () => {
      const mockResponse = {
        imagesRemaining: 8,
        videosRemaining: 3,
        imagesLimit: 10,
        videosLimit: 5,
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await getUserGenerationLimits('user123');

      expect(result).toEqual(mockResponse);
      expect(fetchMock).toHaveBeenCalledWith('/api/generation-limits?userId=user123', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('handles API errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ error: 'Database connection failed' }),
      });

      await expect(getUserGenerationLimits('user123')).rejects.toThrow('Database connection failed');
    });

    it('handles network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      await expect(getUserGenerationLimits('user123')).rejects.toThrow('Network error');
    });

    it('handles malformed JSON responses', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await expect(getUserGenerationLimits('user123')).rejects.toThrow('HTTP 400: Bad Request');
    });

    it('properly encodes userId in query parameters', async () => {
      const mockResponse = {
        imagesRemaining: 10,
        videosRemaining: 5,
        imagesLimit: 10,
        videosLimit: 5,
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await getUserGenerationLimits('user@123.com');

      expect(fetchMock).toHaveBeenCalledWith('/api/generation-limits?userId=user%40123.com', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });
  });
});