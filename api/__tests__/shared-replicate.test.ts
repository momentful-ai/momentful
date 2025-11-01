import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

// Mock Replicate SDK before any imports
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

describe('Shared Replicate Module', () => {
  let replicateModule: typeof import('../shared/replicate');
  let ReplicateModels: typeof import('../shared/models').ReplicateModels;

  beforeAll(async () => {
    const module = await import('../shared/replicate');
    replicateModule = module;
    const modelsModule = await import('../shared/models');
    ReplicateModels = modelsModule.ReplicateModels;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createReplicatePrediction', () => {
    it('creates a prediction with correct parameters', async () => {
      const mockPrediction = { id: 'pred-123' };
      mockReplicateClient.predictions.create.mockResolvedValue(mockPrediction);

      const result = await replicateModule.createReplicatePrediction({
        version: ReplicateModels.FLUX_PRO,
        input: { prompt: 'test prompt' },
      });

      expect(mockReplicateClient.predictions.create).toHaveBeenCalledWith({
        version: ReplicateModels.FLUX_PRO,
        input: { prompt: 'test prompt' },
      });
      expect(result).toEqual({ id: 'pred-123' });
    });

    it('handles API errors', async () => {
      const error = new Error('API error');
      mockReplicateClient.predictions.create.mockRejectedValue(error);

      await expect(
        replicateModule.createReplicatePrediction({
          version: ReplicateModels.STABLE_DIFFUSION,
          input: {},
        })
      ).rejects.toThrow('API error');
    });
  });

  describe('getReplicatePredictionStatus', () => {
    it('retrieves prediction status', async () => {
      const mockPrediction = {
        id: 'pred-123',
        status: 'processing',
        created_at: '2024-01-01T00:00:00Z',
      };
      mockReplicateClient.predictions.get.mockResolvedValue(mockPrediction);

      const result = await replicateModule.getReplicatePredictionStatus('pred-123');

      expect(mockReplicateClient.predictions.get).toHaveBeenCalledWith('pred-123');
      expect(result).toEqual(mockPrediction);
    });

    it('handles API errors', async () => {
      const error = new Error('Not found');
      mockReplicateClient.predictions.get.mockRejectedValue(error);

      await expect(replicateModule.getReplicatePredictionStatus('invalid-id')).rejects.toThrow(
        'Not found'
      );
    });
  });

  describe('validateFluxKontextProInput', () => {
    it('validates correct flux-kontext-pro input', () => {
      const validInput = {
        prompt: 'A beautiful landscape',
        input_image: 'https://example.com/image.jpg',
        aspect_ratio: '16:9',
        output_format: 'jpg',
      };

      const result = replicateModule.validateFluxKontextProInput(validInput);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('validates input with only required prompt', () => {
      const validInput = {
        prompt: 'A beautiful landscape',
      };

      const result = replicateModule.validateFluxKontextProInput(validInput);
      expect(result.valid).toBe(true);
    });

    it('rejects input with missing prompt', () => {
      const invalidInput = {
        input_image: 'https://example.com/image.jpg',
      };

      const result = replicateModule.validateFluxKontextProInput(invalidInput);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('prompt');
    });

    it('rejects input with empty prompt', () => {
      const invalidInput = {
        prompt: '',
      };

      const result = replicateModule.validateFluxKontextProInput(invalidInput);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('validates aspect ratio enum values', () => {
      const validRatios = ['1:1', '16:9', '9:16', 'match_input_image'];
      
      for (const ratio of validRatios) {
        const input = { prompt: 'test', aspect_ratio: ratio };
        const result = replicateModule.validateFluxKontextProInput(input);
        expect(result.valid).toBe(true);
      }
    });

    it('rejects invalid aspect ratio', () => {
      const invalidInput = {
        prompt: 'test',
        aspect_ratio: 'invalid',
      };

      const result = replicateModule.validateFluxKontextProInput(invalidInput);
      expect(result.valid).toBe(false);
    });

    it('validates safety tolerance range', () => {
      const validInput = {
        prompt: 'test',
        safety_tolerance: 3,
      };

      const result = replicateModule.validateFluxKontextProInput(validInput);
      expect(result.valid).toBe(true);
    });

    it('rejects safety tolerance out of range', () => {
      const invalidInput = {
        prompt: 'test',
        safety_tolerance: 7, // Max is 6
      };

      const result = replicateModule.validateFluxKontextProInput(invalidInput);
      expect(result.valid).toBe(false);
    });

    it('allows null for optional fields', () => {
      const input = {
        prompt: 'test',
        input_image: null,
        seed: null,
      };

      const result = replicateModule.validateFluxKontextProInput(input);
      expect(result.valid).toBe(true);
    });
  });

  describe('validatePredictionInput', () => {
    it('validates flux model input', () => {
      const input = {
        prompt: 'test',
        aspect_ratio: '16:9',
      };

      const result = replicateModule.validatePredictionInput(ReplicateModels.FLUX_PRO, input);
      expect(result.valid).toBe(true);
    });

    it('validates flux model with flux-kontext-pro in name', () => {
      const input = {
        prompt: 'test',
      };

      const result = replicateModule.validatePredictionInput(
        'some/flux-kontext-pro-v2',
        input
      );
      expect(result.valid).toBe(true);
    });

    it('rejects invalid flux model input', () => {
      const input = {
        prompt: '', // Invalid: empty prompt
      };

      const result = replicateModule.validatePredictionInput(ReplicateModels.FLUX_PRO, input);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('returns valid for non-flux models (no validation)', () => {
      const input = {
        anyField: 'anyValue',
      };

      const result = replicateModule.validatePredictionInput(
        ReplicateModels.STABLE_DIFFUSION,
        input
      );
      expect(result.valid).toBe(true);
    });
  });

  describe('ReplicateModels export', () => {
    it('exports ReplicateModels from shared module', () => {
      expect(replicateModule.ReplicateModels).toBeDefined();
      expect(replicateModule.ReplicateModels.FLUX_PRO).toBe(ReplicateModels.FLUX_PRO);
    });
  });
});

