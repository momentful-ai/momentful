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

// Set environment variable
process.env.REPLICATE_API_TOKEN = 'test-api-token';

  // Mock the shared replicate module
  vi.mock('../shared/replicate', async () => {
    const actual = await vi.importActual('../shared/replicate');
    return {
      ...actual,
      replicate: mockReplicateClient,
    };
  });

  describe('Replicate Predictions Nested Routes', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let indexHandler: typeof import('../replicate/predictions/index').default;
  let idHandler: typeof import('../replicate/predictions/[id]').default;
  let createPredictionFn: typeof import('../shared/replicate').createReplicatePrediction;
  let getPredictionStatusFn: typeof import('../shared/replicate').getReplicatePredictionStatus;

  beforeAll(async () => {
    // Import handlers and functions after mocks are set up
    const indexModule = await import('../replicate/predictions/index');
    indexHandler = indexModule.default;

    const sharedModule = await import('../shared/replicate');
    createPredictionFn = sharedModule.createReplicatePrediction;
    getPredictionStatusFn = sharedModule.getReplicatePredictionStatus;

    const idModule = await import('../replicate/predictions/[id]');
    idHandler = idModule.default;
  });

  beforeEach(() => {
    // Setup mock request
    mockReq = {
      method: 'POST',
      body: {},
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

  describe('POST /api/replicate/predictions (index.ts)', () => {
    it('successfully creates a new prediction', async () => {
      mockReplicateClient.predictions.create.mockResolvedValue({
        id: 'prediction-123',
      });

      mockReq.body = {
        version: 'stability-ai/stable-diffusion',
        input: {
          prompt: 'A beautiful sunset',
        },
      };

      await indexHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockReplicateClient.predictions.create).toHaveBeenCalledWith({
        version: 'stability-ai/stable-diffusion',
        input: {
          prompt: 'A beautiful sunset',
        },
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ id: 'prediction-123' });
    });

    it('returns 400 when version is missing', async () => {
      mockReq.body = {
        input: {
          prompt: 'A beautiful sunset',
        },
      };

      await indexHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockReplicateClient.predictions.create).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Missing required fields: version and input',
      });
    });

    it('returns 400 when input is missing', async () => {
      mockReq.body = {
        version: 'stability-ai/stable-diffusion',
      };

      await indexHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockReplicateClient.predictions.create).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Missing required fields: version and input',
      });
    });

    it('handles Replicate API errors gracefully', async () => {
      const error = new Error('Replicate API error');
      mockReplicateClient.predictions.create.mockRejectedValue(error);

      mockReq.body = {
        version: 'stability-ai/stable-diffusion',
        input: {
          prompt: 'A beautiful sunset',
        },
      };

      await indexHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to create Replicate prediction',
      });
    });
  });

  describe('GET /api/replicate/predictions/[id]', () => {
    it('successfully retrieves prediction status', async () => {
      const mockPrediction = {
        id: 'prediction-123',
        status: 'succeeded',
        output: 'https://example.com/output.jpg',
        created_at: '2025-01-01T00:00:00Z',
      };
      mockReplicateClient.predictions.get.mockResolvedValue(mockPrediction);

      mockReq.method = 'GET';
      mockReq.query = { id: 'prediction-123' };

      await idHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockReplicateClient.predictions.get).toHaveBeenCalledWith('prediction-123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockPrediction);
    });

    it('returns 400 when id is missing', async () => {
      mockReq.method = 'GET';
      mockReq.query = {};

      await idHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockReplicateClient.predictions.get).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Missing or invalid prediction id',
      });
    });

    it('returns 400 when id is not a string', async () => {
      mockReq.method = 'GET';
      mockReq.query = { id: ['array'] };

      await idHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockReplicateClient.predictions.get).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Missing or invalid prediction id',
      });
    });

    it('returns 500 when prediction has error', async () => {
      const mockPrediction = {
        id: 'prediction-123',
        status: 'failed',
        error: 'Model execution failed',
        created_at: '2025-01-01T00:00:00Z',
      };
      mockReplicateClient.predictions.get.mockResolvedValue(mockPrediction);

      mockReq.method = 'GET';
      mockReq.query = { id: 'prediction-123' };

      await idHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        detail: 'Model execution failed',
      });
    });

    it('handles Replicate API errors gracefully', async () => {
      const error = new Error('Replicate API error');
      mockReplicateClient.predictions.get.mockRejectedValue(error);

      mockReq.method = 'GET';
      mockReq.query = { id: 'prediction-123' };

      await idHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to get Replicate prediction status',
        detail: 'Replicate API error',
      });
    });

    it('handles unknown errors', async () => {
      mockReplicateClient.predictions.get.mockRejectedValue('Unknown error');

      mockReq.method = 'GET';
      mockReq.query = { id: 'prediction-123' };

      await idHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to get Replicate prediction status',
        detail: 'Unknown error',
      });
    });
  });

  describe('Helper Functions', () => {
    describe('createReplicatePrediction', () => {
      it('creates a prediction and returns the id', async () => {
        mockReplicateClient.predictions.create.mockResolvedValue({
          id: 'prediction-456',
        });

        const result = await createPredictionFn({
          version: 'stability-ai/stable-diffusion',
          input: { prompt: 'Test' },
        });

        expect(mockReplicateClient.predictions.create).toHaveBeenCalledWith({
          version: 'stability-ai/stable-diffusion',
          input: { prompt: 'Test' },
        });
        expect(result).toEqual({ id: 'prediction-456' });
      });
    });

    describe('getReplicatePredictionStatus', () => {
      it('retrieves prediction status', async () => {
        const mockPrediction = {
          id: 'prediction-789',
          status: 'processing',
          created_at: '2025-01-01T00:00:00Z',
        };
        mockReplicateClient.predictions.get.mockResolvedValue(mockPrediction);

        const result = await getPredictionStatusFn('prediction-789');

        expect(mockReplicateClient.predictions.get).toHaveBeenCalledWith('prediction-789');
        expect(result).toEqual(mockPrediction);
      });
    });
  });

  describe('ReplicateModels Constants', () => {
    it('exports ReplicateModels with correct values', async () => {
      const indexModule = await import('../replicate/predictions/index');
      const { ReplicateModels } = indexModule;

      expect(ReplicateModels.STABLE_DIFFUSION).toBe(
        'stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf'
      );
      expect(ReplicateModels.STABLE_VIDEO_DIFFUSION).toBe(
        'stability-ai/stable-video-diffusion:3f0455e4619daac51287dedb1a3f5dbe6bc8d0a1e6e715b9a49c7d61b7c1b8a8'
      );
      expect(ReplicateModels.FLUX_PRO).toBe('black-forest-labs/flux-kontext-pro');
    });
  });
});

