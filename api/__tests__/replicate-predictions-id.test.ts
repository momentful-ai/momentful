import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Mock the nested predictions module
const mockGetPredictionStatus = vi.fn();

vi.mock('../replicate/predictions/index', () => ({
  getReplicatePredictionStatus: mockGetPredictionStatus,
}));

describe('Replicate Predictions API [id]', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let handler: typeof import('../replicate-predictions-id').default;

  beforeAll(async () => {
    // Import handler after mocks are set up
    const handlerModule = await import('../replicate-predictions-id');
    handler = handlerModule.default;
  });

  beforeEach(() => {
    // Setup mock request
    mockReq = {
      method: 'GET',
      query: {},
    };

    // Setup mock response
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      end: vi.fn().mockReturnThis(),
    };

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('GET /api/replicate-predictions-id', () => {
    it('successfully retrieves prediction status', async () => {
      const mockPrediction = {
        id: 'prediction-123',
        status: 'succeeded',
        output: 'https://example.com/output.jpg',
        created_at: '2025-01-01T00:00:00Z',
      };
      mockGetPredictionStatus.mockResolvedValue(mockPrediction);

      mockReq.query = { id: 'prediction-123' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockGetPredictionStatus).toHaveBeenCalledWith('prediction-123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockPrediction);
    });

    it('returns 400 when id is missing', async () => {
      mockReq.query = {};

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockGetPredictionStatus).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Missing or invalid prediction id',
      });
    });

    it('returns 400 when id is not a string', async () => {
      mockReq.query = { id: ['array'] };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockGetPredictionStatus).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Missing or invalid prediction id',
      });
    });

    it('handles Replicate API errors gracefully', async () => {
      const error = new Error('Replicate API error');
      mockGetPredictionStatus.mockRejectedValue(error);

      mockReq.query = { id: 'prediction-123' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to get Replicate prediction status',
      });
    });

    it('handles network errors', async () => {
      const error = new Error('Network error');
      mockGetPredictionStatus.mockRejectedValue(error);

      mockReq.query = { id: 'prediction-123' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to get Replicate prediction status',
      });
    });

    it('handles prediction not found', async () => {
      const error = new Error('Prediction not found');
      mockGetPredictionStatus.mockRejectedValue(error);

      mockReq.query = { id: 'non-existent-prediction' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to get Replicate prediction status',
      });
    });

    it('handles different prediction statuses', async () => {
      const statuses = ['starting', 'processing', 'succeeded', 'failed', 'canceled', 'aborted'] as const;

      for (const status of statuses) {
        vi.clearAllMocks();
        const mockPrediction = {
          id: 'prediction-123',
          status,
          created_at: '2025-01-01T00:00:00Z',
        };
        mockGetPredictionStatus.mockResolvedValue(mockPrediction);

        mockReq.query = { id: 'prediction-123' };

        await handler(mockReq as VercelRequest, mockRes as VercelResponse);

        expect(mockRes.status).toHaveBeenCalledWith(200);
        expect(mockRes.json).toHaveBeenCalledWith(mockPrediction);
      }
    });
  });

  describe('Unsupported HTTP Methods', () => {
    it('returns 405 for POST method', async () => {
      mockReq.method = 'POST';
      mockReq.query = { id: 'prediction-123' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.end).toHaveBeenCalled();
    });

    it('returns 405 for PUT method', async () => {
      mockReq.method = 'PUT';
      mockReq.query = { id: 'prediction-123' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.end).toHaveBeenCalled();
    });

    it('returns 405 for PATCH method', async () => {
      mockReq.method = 'PATCH';
      mockReq.query = { id: 'prediction-123' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.end).toHaveBeenCalled();
    });

    it('returns 405 for DELETE method', async () => {
      mockReq.method = 'DELETE';
      mockReq.query = { id: 'prediction-123' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.end).toHaveBeenCalled();
    });
  });
});

