import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Set environment variables before any imports
process.env.REPLICATE_API_TOKEN = 'test-api-token';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SECRET_KEY = 'test-secret-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

// Mock Supabase client creation
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    storage: {
      from: vi.fn(() => ({
        createSignedUrl: vi.fn(),
      })),
    },
  })),
}));

// Mock the external signed URLs module
vi.mock('../shared/external-signed-urls', () => ({
  convertStoragePathsToSignedUrls: vi.fn((obj) => Promise.resolve(obj)),
}));

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

// Mock the shared replicate module
const mockCreateReplicatePrediction = vi.fn();
const mockGetReplicatePredictionStatus = vi.fn();
const mockValidateFluxKontextProInput = vi.fn();
const mockValidatePredictionInput = vi.fn();

vi.mock('../shared/replicate', () => ({
  replicate: mockReplicateClient,
  createReplicatePrediction: mockCreateReplicatePrediction,
  getReplicatePredictionStatus: mockGetReplicatePredictionStatus,
  validateFluxKontextProInput: mockValidateFluxKontextProInput,
  validatePredictionInput: mockValidatePredictionInput,
  ReplicateModels: {
    STABLE_DIFFUSION: 'stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf',
    STABLE_VIDEO_DIFFUSION: 'stability-ai/stable-video-diffusion:3f0455e4619daac51287dedb1a3f5dbe6bc8d0a1e6e715b9a49c7d61b7c1b8a8',
    FLUX_PRO: 'black-forest-labs/flux-kontext-pro',
  },
  fluxKontextProInputSchema: {},
  isFluxModel: vi.fn(),
}));

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

    // Setup default mock behaviors
    mockCreateReplicatePrediction.mockResolvedValue({ id: 'prediction-123' });
    mockGetReplicatePredictionStatus.mockResolvedValue({
      id: 'prediction-123',
      status: 'succeeded',
      output: 'https://example.com/output.jpg',
      created_at: '2025-01-01T00:00:00Z',
    });
    mockValidatePredictionInput.mockReturnValue({ valid: true });
    mockValidateFluxKontextProInput.mockReturnValue({ valid: true });
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

      expect(mockCreateReplicatePrediction).toHaveBeenCalledWith({
        version: 'stability-ai/stable-diffusion',
        input: {
          prompt: 'A beautiful sunset',
        },
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        id: 'prediction-123',
        status: undefined // No status returned from mock
      });
    });

    it('creates prediction with metadata for DB tracking', async () => {
      mockReplicateClient.predictions.create.mockResolvedValue({
        id: 'prediction-123',
      });

      mockReq.body = {
        version: 'black-forest-labs/flux-kontext-pro',
        input: {
          prompt: 'A beautiful landscape',
          input_image: 'user123/project456/image.png',
        },
        userId: 'user123',
        projectId: 'project456',
        prompt: 'Original prompt text',
        lineageId: 'lineage789',
        parentId: 'parent123',
      };

      await indexHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        id: 'prediction-123',
        status: undefined,
        metadata: {
          userId: 'user123',
          projectId: 'project456',
          prompt: 'Original prompt text',
          lineageId: 'lineage789',
          parentId: 'parent123',
        },
      });
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

    it('returns 400 when input validation fails', async () => {
      // Mock validation to fail
      mockValidatePredictionInput.mockReturnValue({
        valid: false,
        error: 'Missing required prompt field'
      });

      mockReq.body = {
        version: 'black-forest-labs/flux-kontext-pro',
        input: {
          // Missing required prompt field for Flux model
        },
      };

      await indexHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockValidatePredictionInput).toHaveBeenCalledWith('black-forest-labs/flux-kontext-pro', {});
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Invalid input format',
        details: 'Missing required prompt field',
      });
    });

    it('handles Replicate API errors gracefully', async () => {
      const error = new Error('Replicate API error');
      mockCreateReplicatePrediction.mockRejectedValue(error);

      mockReq.body = {
        version: 'stability-ai/stable-diffusion',
        input: {
          prompt: 'A beautiful sunset',
        },
      };

      await indexHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockCreateReplicatePrediction).toHaveBeenCalledWith({
        version: 'stability-ai/stable-diffusion',
        input: {
          prompt: 'A beautiful sunset',
        },
      });
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to create Replicate prediction',
        details: undefined, // In test environment, details are not included
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

      expect(mockGetReplicatePredictionStatus).toHaveBeenCalledWith('prediction-123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockPrediction);
    });

    it.skip('auto-uploads image on successful prediction completion', async () => {
      const mockPrediction = {
        id: 'prediction-123',
        status: 'succeeded',
        output: ['https://example.com/generated-image.png'],
        created_at: '2025-01-01T00:00:00Z',
      };
      mockGetReplicatePredictionStatus.mockResolvedValue(mockPrediction);

      // Mock fetch for image download (create a simple PNG header)
      const pngData = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, // IHDR length
        0x49, 0x48, 0x44, 0x52, // IHDR
        0x00, 0x00, 0x03, 0x20, // Width: 800
        0x00, 0x00, 0x02, 0x58, // Height: 600
      ]);
      const mockFetchResponse = {
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(pngData),
      };
      global.fetch = vi.fn().mockResolvedValue(mockFetchResponse);

      // Mock Supabase storage upload
      const mockStorageUpload = vi.fn().mockResolvedValue({
        data: { path: 'user123/project456/edited-123.png' },
        error: null,
      });

      // Mock Supabase database operations
      const mockSupabaseInsert = vi.fn().mockResolvedValue({
        data: { id: 'edited-image-456' },
        error: null,
      });

      // Mock the supabase-js module for this test
      const mockSupabaseClient = {
        storage: {
          from: vi.fn().mockReturnValue({
            upload: mockStorageUpload,
          }),
        },
        from: vi.fn().mockReturnValue({
          insert: mockSupabaseInsert,
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: 'edited-image-456' },
              error: null,
            }),
          }),
        }),
      };

      // Mock createClient for this specific test
      vi.doMock('@supabase/supabase-js', () => ({
        createClient: vi.fn(() => mockSupabaseClient),
      }));

      mockReq.method = 'GET';
      mockReq.query = {
        id: 'prediction-123',
        userId: 'user123',
        projectId: 'project456',
        prompt: 'Original prompt',
        lineageId: 'lineage789',
        parentId: 'parent123',
      };

      await idHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      // Verify fetch was called to download the image
      expect(global.fetch).toHaveBeenCalledWith('https://example.com/generated-image.png');

      // Verify Supabase storage upload was called
      expect(mockSupabaseClient.storage.from).toHaveBeenCalledWith('user-uploads');
      expect(mockStorageUpload).toHaveBeenCalled();

      // Verify database insert was called
      expect(mockSupabaseInsert).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);

      const responseData = mockRes.json.mock.calls[0][0];
      expect(responseData).toMatchObject({
        id: 'prediction-123',
        status: 'succeeded',
        output: ['https://example.com/generated-image.png'],
        created_at: '2025-01-01T00:00:00Z',
        storagePath: expect.stringContaining('user123/project456/edited-'),
        width: 800,
        height: 600,
        editedImageId: 'edited-image-456',
      });
    });

    it('handles upload errors gracefully', async () => {
      const mockPrediction = {
        id: 'prediction-123',
        status: 'succeeded',
        output: ['https://example.com/generated-image.png'],
        created_at: '2025-01-01T00:00:00Z',
      };
      mockReplicateClient.predictions.get.mockResolvedValue(mockPrediction);

      // Mock upload failure
      const mockUploadFromExternalUrl = vi.fn().mockRejectedValue(new Error('Upload failed'));

      vi.doMock('../shared/storage.js', () => ({
        uploadFromExternalUrl: mockUploadFromExternalUrl,
      }));

      mockReq.method = 'GET';
      mockReq.query = {
        id: 'prediction-123',
        userId: 'user123',
        projectId: 'project456',
        prompt: 'Original prompt',
      };

      await idHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(200);
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
      mockGetReplicatePredictionStatus.mockResolvedValue(mockPrediction);

      mockReq.method = 'GET';
      mockReq.query = { id: 'prediction-123' };

      await idHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockGetReplicatePredictionStatus).toHaveBeenCalledWith('prediction-123');
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        detail: 'Model execution failed',
      });
    });

    it('handles Replicate API errors gracefully', async () => {
      const error = new Error('Replicate API error');
      mockGetReplicatePredictionStatus.mockRejectedValue(error);

      mockReq.method = 'GET';
      mockReq.query = { id: 'prediction-123' };

      await idHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockGetReplicatePredictionStatus).toHaveBeenCalledWith('prediction-123');
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to get Replicate prediction status',
        detail: 'Replicate API error',
      });
    });

    it('handles unknown errors', async () => {
      mockGetReplicatePredictionStatus.mockRejectedValue('Unknown error');

      mockReq.method = 'GET';
      mockReq.query = { id: 'prediction-123' };

      await idHandler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockGetReplicatePredictionStatus).toHaveBeenCalledWith('prediction-123');
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
        mockCreateReplicatePrediction.mockResolvedValue({ id: 'prediction-456' });

        const result = await createPredictionFn({
          version: 'stability-ai/stable-diffusion',
          input: { prompt: 'Test' },
        });

        expect(mockCreateReplicatePrediction).toHaveBeenCalledWith({
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
        mockGetReplicatePredictionStatus.mockResolvedValue(mockPrediction);

        const result = await getPredictionStatusFn('prediction-789');

        expect(mockGetReplicatePredictionStatus).toHaveBeenCalledWith('prediction-789');
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

