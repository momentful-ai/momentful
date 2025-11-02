import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createReplicatePrediction,
  getReplicatePredictionStatus,
  pollReplicatePrediction,
  createReplicateImageJob,
  extractImageUrl,
  ReplicateModels,
  type ReplicatePrediction,
} from '../../../../services/aiModels/replicate/api-client';

// Mock fetch globally
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('Replicate API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createReplicatePrediction', () => {
    it('successfully creates a prediction', async () => {
      const mockResponse = { id: 'pred-123', status: 'starting' };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await createReplicatePrediction({
        version: 'test-model',
        input: { prompt: 'test prompt' },
      });

      expect(result).toEqual(mockResponse);
      expect(fetchMock).toHaveBeenCalledWith('/api/replicate/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: 'test-model',
          input: { prompt: 'test prompt' },
        }),
      });
    });

    it('handles API error responses', async () => {
      const errorResponse = { error: 'Invalid model version' };
      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve(errorResponse),
      });

      await expect(createReplicatePrediction({
        version: 'invalid-model',
        input: {},
      })).rejects.toThrow('Invalid model version');
    });

    it('handles network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      await expect(createReplicatePrediction({
        version: 'test-model',
        input: {},
      })).rejects.toThrow('Network error');
    });

    it('uses default error message when error field is missing', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      });

      await expect(createReplicatePrediction({
        version: 'test-model',
        input: {},
      })).rejects.toThrow('Failed to create prediction');
    });
  });

  describe('getReplicatePredictionStatus', () => {
    it('successfully retrieves prediction status', async () => {
      const mockPrediction: ReplicatePrediction = {
        id: 'pred-123',
        status: 'succeeded',
        output: 'https://example.com/image.jpg',
        created_at: '2025-01-01T00:00:00Z',
      };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPrediction),
      });

      const result = await getReplicatePredictionStatus('pred-123');

      expect(result).toEqual(mockPrediction);
      expect(fetchMock).toHaveBeenCalledWith('/api/replicate/predictions/pred-123');
    });

    it('handles API error responses', async () => {
      const errorResponse = { error: 'Prediction not found' };
      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve(errorResponse),
      });

      await expect(getReplicatePredictionStatus('invalid-id')).rejects.toThrow('Prediction not found');
    });

    it('uses default error message when error field is missing', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      });

      await expect(getReplicatePredictionStatus('pred-123')).rejects.toThrow('Failed to get prediction status');
    });
  });

  describe('pollReplicatePrediction', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns prediction when it succeeds immediately', async () => {
      const mockPrediction: ReplicatePrediction = {
        id: 'pred-123',
        status: 'succeeded',
        output: 'https://example.com/image.jpg',
        created_at: '2025-01-01T00:00:00Z',
      };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPrediction),
      });

      const result = await pollReplicatePrediction('pred-123');

      expect(result).toEqual(mockPrediction);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('polls until prediction succeeds', async () => {
      const processingPrediction: ReplicatePrediction = {
        id: 'pred-123',
        status: 'processing',
        created_at: '2025-01-01T00:00:00Z',
      };
      const successPrediction: ReplicatePrediction = {
        id: 'pred-123',
        status: 'succeeded',
        output: 'https://example.com/image.jpg',
        created_at: '2025-01-01T00:00:00Z',
      };

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(processingPrediction),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(successPrediction),
        });

      const pollPromise = pollReplicatePrediction('pred-123', undefined, 10, 100);
      await vi.advanceTimersByTimeAsync(100); // First poll
      const result = await pollPromise;

      expect(result).toEqual(successPrediction);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('throws error when prediction fails', async () => {
      const failedPrediction: ReplicatePrediction = {
        id: 'pred-123',
        status: 'failed',
        error: 'Model error occurred',
        created_at: '2025-01-01T00:00:00Z',
      };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(failedPrediction),
      });

      await expect(pollReplicatePrediction('pred-123')).rejects.toThrow('Model error occurred');
    });

    it('throws error when prediction fails with non-string error', async () => {
      const failedPrediction: ReplicatePrediction = {
        id: 'pred-123',
        status: 'failed',
        error: { code: 500, message: 'Internal error' },
        created_at: '2025-01-01T00:00:00Z',
      };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(failedPrediction),
      });

      await expect(pollReplicatePrediction('pred-123')).rejects.toThrow('Prediction failed');
    });

    it('throws error when prediction is canceled', async () => {
      const canceledPrediction: ReplicatePrediction = {
        id: 'pred-123',
        status: 'canceled',
        created_at: '2025-01-01T00:00:00Z',
      };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(canceledPrediction),
      });

      await expect(pollReplicatePrediction('pred-123')).rejects.toThrow('Prediction was canceled');
    });

    it('calls onProgress callback with prediction status', async () => {
      const processingPrediction: ReplicatePrediction = {
        id: 'pred-123',
        status: 'processing',
        created_at: '2025-01-01T00:00:00Z',
      };
      const successPrediction: ReplicatePrediction = {
        id: 'pred-123',
        status: 'succeeded',
        output: 'https://example.com/image.jpg',
        created_at: '2025-01-01T00:00:00Z',
      };

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(processingPrediction),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(successPrediction),
        });

      const onProgress = vi.fn();
      const pollPromise = pollReplicatePrediction('pred-123', onProgress, 10, 100);
      await vi.advanceTimersByTimeAsync(100);
      await pollPromise;

      expect(onProgress).toHaveBeenCalledWith(processingPrediction);
      expect(onProgress).toHaveBeenCalledWith(successPrediction);
    });

    it('throws timeout error when max attempts exceeded', async () => {
      const processingPrediction: ReplicatePrediction = {
        id: 'pred-123',
        status: 'processing',
        created_at: '2025-01-01T00:00:00Z',
      };

      fetchMock.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(processingPrediction),
      });

      // Mock setTimeout to resolve immediately
      const originalSetTimeout = global.setTimeout;
      global.setTimeout = vi.fn((cb: () => void) => {
        // Call callback immediately
        cb();
        return 1 as any;
      }) as any;

      try {
        await expect(pollReplicatePrediction('pred-123', undefined, 1, 1)).rejects.toThrow('Prediction polling timed out');
      } finally {
        global.setTimeout = originalSetTimeout;
      }
    });

    it('handles network errors during polling', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      await expect(pollReplicatePrediction('pred-123')).rejects.toThrow('Network error');
    });
  });

  describe('createReplicateImageJob', () => {
    it('creates image job with minimal required parameters', async () => {
      const mockResponse = { id: 'pred-456', status: 'starting' };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await createReplicateImageJob({
        imageUrl: 'https://example.com/input.jpg',
        prompt: 'A beautiful landscape',
      });

      expect(result).toEqual(mockResponse);
      expect(fetchMock).toHaveBeenCalledWith('/api/replicate/predictions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: ReplicateModels.FLUX_PRO,
          input: {
            prompt: 'A beautiful landscape',
            input_image: 'https://example.com/input.jpg',
            aspect_ratio: 'match_input_image',
          },
        }),
      });
    });

    it('maps aspect ratio correctly', async () => {
      const mockResponse = { id: 'pred-456', status: 'starting' };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await createReplicateImageJob({
        imageUrl: 'https://example.com/input.jpg',
        prompt: 'Test',
        aspectRatio: '1920:1080',
      });

      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody.input.aspect_ratio).toBe('16:9');
    });

    it('falls back to match_input_image for unmapped aspect ratios', async () => {
      const mockResponse = { id: 'pred-456', status: 'starting' };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await createReplicateImageJob({
        imageUrl: 'https://example.com/input.jpg',
        prompt: 'Test',
        aspectRatio: 'unknown:ratio',
      });

      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody.input.aspect_ratio).toBe('match_input_image');
    });

    it('includes all optional parameters when provided', async () => {
      const mockResponse = { id: 'pred-456', status: 'starting' };
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await createReplicateImageJob({
        imageUrl: 'https://example.com/input.jpg',
        prompt: 'Test prompt',
        aspectRatio: '1024:1024',
        seed: 42,
        outputFormat: 'jpg',
        safetyTolerance: 3,
        promptUpsampling: true,
      });

      const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(callBody.input).toEqual({
        prompt: 'Test prompt',
        input_image: 'https://example.com/input.jpg',
        aspect_ratio: '1:1',
        seed: 42,
        output_format: 'jpg',
        safety_tolerance: 3,
        prompt_upsampling: true,
      });
    });
  });

  describe('extractImageUrl', () => {
    it('returns null when prediction has no output', () => {
      const prediction: ReplicatePrediction = {
        id: 'pred-123',
        status: 'succeeded',
        created_at: '2025-01-01T00:00:00Z',
      };

      expect(extractImageUrl(prediction)).toBeNull();
    });

    it('returns string URL directly', () => {
      const prediction: ReplicatePrediction = {
        id: 'pred-123',
        status: 'succeeded',
        output: 'https://example.com/image.jpg',
        created_at: '2025-01-01T00:00:00Z',
      };

      expect(extractImageUrl(prediction)).toBe('https://example.com/image.jpg');
    });

    it('returns first string from array', () => {
      const prediction: ReplicatePrediction = {
        id: 'pred-123',
        status: 'succeeded',
        output: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        created_at: '2025-01-01T00:00:00Z',
      };

      expect(extractImageUrl(prediction)).toBe('https://example.com/image1.jpg');
    });

    it('returns url property from array object', () => {
      const prediction = {
        id: 'pred-123',
        status: 'succeeded' as const,
        output: [{ url: 'https://example.com/image.jpg' }] as unknown,
        created_at: '2025-01-01T00:00:00Z',
      } as ReplicatePrediction;

      expect(extractImageUrl(prediction)).toBe('https://example.com/image.jpg');
    });

    it('returns null for array with non-string/non-object items', () => {
      const prediction = {
        id: 'pred-123',
        status: 'succeeded' as const,
        output: [123, null] as unknown,
        created_at: '2025-01-01T00:00:00Z',
      } as ReplicatePrediction;

      expect(extractImageUrl(prediction)).toBeNull();
    });

    it('returns url from object output', () => {
      const prediction = {
        id: 'pred-123',
        status: 'succeeded' as const,
        output: { url: 'https://example.com/image.jpg' } as unknown,
        created_at: '2025-01-01T00:00:00Z',
      } as ReplicatePrediction;

      expect(extractImageUrl(prediction)).toBe('https://example.com/image.jpg');
    });

    it('returns imageUrl from object output', () => {
      const prediction = {
        id: 'pred-123',
        status: 'succeeded' as const,
        output: { imageUrl: 'https://example.com/image.jpg' } as unknown,
        created_at: '2025-01-01T00:00:00Z',
      } as ReplicatePrediction;

      expect(extractImageUrl(prediction)).toBe('https://example.com/image.jpg');
    });

    it('returns image_url from object output', () => {
      const prediction = {
        id: 'pred-123',
        status: 'succeeded' as const,
        output: { image_url: 'https://example.com/image.jpg' } as unknown,
        created_at: '2025-01-01T00:00:00Z',
      } as ReplicatePrediction;

      expect(extractImageUrl(prediction)).toBe('https://example.com/image.jpg');
    });

    it('returns null for object without url properties', () => {
      const prediction = {
        id: 'pred-123',
        status: 'succeeded' as const,
        output: { someOtherField: 'value' } as unknown,
        created_at: '2025-01-01T00:00:00Z',
      } as ReplicatePrediction;

      expect(extractImageUrl(prediction)).toBeNull();
    });
  });

  describe('ReplicateModels', () => {
    it('exports expected model constants', () => {
      expect(ReplicateModels.STABLE_DIFFUSION).toBe('stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf');
      expect(ReplicateModels.STABLE_VIDEO_DIFFUSION).toBe('stability-ai/stable-video-diffusion:3f0455e4619daac51287dedb1a3f5dbe6bc8d0a1e6e715b9a49c7d61b7c1b8a8');
      expect(ReplicateModels.FLUX_PRO).toBe('black-forest-labs/flux-kontext-pro');
    });
  });
});
