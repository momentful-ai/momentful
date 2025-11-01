import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Mock Replicate SDK
const mockReplicateClient = {
  predictions: {
    create: vi.fn(),
    get: vi.fn(),
  },
};

vi.mock('replicate', () => {
  return {
    default: vi.fn(() => mockReplicateClient),
  };
});

// Mock the nested predictions module
const mockCreatePrediction = vi.fn();
const mockGetPredictionStatus = vi.fn();

vi.mock('../replicate/predictions/index', () => ({
  createReplicatePrediction: mockCreatePrediction,
  getReplicatePredictionStatus: mockGetPredictionStatus,
}));

// Set environment variable
process.env.REPLICATE_API_TOKEN = 'test-api-token';

describe('Replicate Predictions API', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let handler: typeof import('../replicate-predictions').default;

  beforeAll(async () => {
    // Import handler after mocks are set up
    const handlerModule = await import('../replicate-predictions');
    handler = handlerModule.default;
  });

  beforeEach(() => {
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
    };

    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('POST /api/replicate-predictions', () => {
    it('successfully creates a new prediction', async () => {
      const mockPrediction = { id: 'prediction-123' };
      mockCreatePrediction.mockResolvedValue(mockPrediction);

      mockReq.body = {
      version: 'stability-ai/stable-diffusion',
      input: {
        prompt: 'A beautiful sunset',
        width: 512,
        height: 512,
      },
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockCreatePrediction).toHaveBeenCalledWith({
        version: 'stability-ai/stable-diffusion',
        input: {
          prompt: 'A beautiful sunset',
          width: 512,
          height: 512,
        },
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockPrediction);
    });

    it('returns 400 when version is missing', async () => {
      mockReq.body = {
        input: {
          prompt: 'A beautiful sunset',
        },
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockCreatePrediction).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Missing required fields: version and input',
      });
    });

    it('returns 400 when input is missing', async () => {
      mockReq.body = {
        version: 'stability-ai/stable-diffusion',
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockCreatePrediction).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Missing required fields: version and input',
      });
    });

    it('returns 400 when both version and input are missing', async () => {
      mockReq.body = {};

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockCreatePrediction).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Missing required fields: version and input',
      });
    });

    it('handles Replicate API errors gracefully', async () => {
      const error = new Error('Replicate API error');
      mockCreatePrediction.mockRejectedValue(error);

      mockReq.body = {
        version: 'stability-ai/stable-diffusion',
        input: {
          prompt: 'A beautiful sunset',
        },
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to create Replicate prediction',
      });
    });

    it('handles network errors', async () => {
      const error = new Error('Network error');
      mockCreatePrediction.mockRejectedValue(error);

      mockReq.body = {
        version: 'stability-ai/stable-diffusion',
        input: {
          prompt: 'A beautiful sunset',
        },
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to create Replicate prediction',
      });
    });
  });

  describe('Unsupported HTTP Methods', () => {
    it('returns 405 for GET method', async () => {
      mockReq.method = 'GET';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.end).toHaveBeenCalled();
    });

    it('returns 405 for PUT method', async () => {
      mockReq.method = 'PUT';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.end).toHaveBeenCalled();
    });

    it('returns 405 for PATCH method', async () => {
      mockReq.method = 'PATCH';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.end).toHaveBeenCalled();
    });

    it('returns 405 for DELETE method', async () => {
      mockReq.method = 'DELETE';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.end).toHaveBeenCalled();
    });
  });
});

