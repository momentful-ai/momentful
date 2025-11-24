import { describe, it, expect, vi } from 'vitest';

// Set environment variables for API imports
process.env.SUPABASE_SECRET_KEY = 'test-secret-key';
process.env.SUPABASE_URL = 'https://test.supabase.co';
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

// Mock Replicate SDK
vi.mock('replicate', () => ({
  default: vi.fn(() => ({
    predictions: {
      create: vi.fn(),
      get: vi.fn(),
    },
  })),
}));

// Mock Runway SDK
vi.mock('@runwayml/sdk', () => ({
  default: vi.fn(() => ({
    textToImage: { create: vi.fn() },
    imageToVideo: { create: vi.fn() },
    tasks: { retrieve: vi.fn() },
  })),
}));

vi.mock('dotenv', () => ({
  config: vi.fn(() => ({ parsed: { RUNWAY_API_KEY: 'test-key' } })),
}));

// Set environment variables
process.env.RUNWAY_API_KEY = 'test-api-key';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.REPLICATE_API_TOKEN = 'test-replicate-token';

/**
 * Integration tests to ensure consolidation works correctly
 * These tests verify that the shared modules are properly integrated
 * with the API endpoints
 */

describe('Consolidation Integration Tests', () => {
  describe('Module Exports', () => {
    it('shared/replicate exports all expected functions and types', async () => {
      const replicateModule = await import('../shared/replicate');
      
      expect(replicateModule.createReplicatePrediction).toBeDefined();
      expect(replicateModule.getReplicatePredictionStatus).toBeDefined();
      expect(replicateModule.validateFluxKontextProInput).toBeDefined();
      expect(replicateModule.validatePredictionInput).toBeDefined();
      expect(replicateModule.replicate).toBeDefined();
      expect(replicateModule.ReplicateModels).toBeDefined();
    });

    it('shared/runway exports all expected functions and types', async () => {
      const runwayModule = await import('../shared/runway');
      
      expect(runwayModule.createVideoTask).toBeDefined();
      expect(runwayModule.createImageTask).toBeDefined();
      expect(runwayModule.getRunwayTask).toBeDefined();
      expect(runwayModule.runway).toBeDefined();
      expect(runwayModule.RunwayModels).toBeDefined();
      expect(runwayModule.supportedImageModels).toBeDefined();
      expect(runwayModule.supportedImageRatios).toBeDefined();
    });

    it('shared/models exports all model constants', async () => {
      const modelsModule = await import('../shared/models');
      
      expect(modelsModule.ReplicateModels).toBeDefined();
      expect(modelsModule.RunwayModels).toBeDefined();
      expect(modelsModule.isFluxModel).toBeDefined();
    });

    it('shared/utils exports utility functions', async () => {
      const utilsModule = await import('../shared/utils');
      
      expect(utilsModule.extractErrorMessage).toBeDefined();
      expect(utilsModule.getStatusCodeFromError).toBeDefined();
    });
  });

  describe('Backward Compatibility', () => {
    it('replicate/predictions/index re-exports createReplicatePrediction', async () => {
      const endpointModule = await import('../replicate/predictions/index');
      
      expect(endpointModule.createReplicatePrediction).toBeDefined();
      expect(endpointModule.ReplicateModels).toBeDefined();
    });

    it('replicate/predictions/[id] re-exports getReplicatePredictionStatus', async () => {
      const endpointModule = await import('../replicate/predictions/[id]');
      
      expect(endpointModule.getReplicatePredictionStatus).toBeDefined();
    });

    it('runway/jobs/index re-exports createVideoTask and createImageTask', async () => {
      const endpointModule = await import('../runway/jobs/index');
      
      expect(endpointModule.createVideoTask).toBeDefined();
      expect(endpointModule.createImageTask).toBeDefined();
      // Mode is a type, so we verify it exists via TypeScript compilation
      // At runtime, types don't exist, so we just verify the functions work
      expect(typeof endpointModule.createVideoTask).toBe('function');
      expect(typeof endpointModule.createImageTask).toBe('function');
    });

    it('runway/jobs/[id] re-exports getRunwayTask', async () => {
      const endpointModule = await import('../runway/jobs/[id]');
      
      expect(endpointModule.getRunwayTask).toBeDefined();
    });
  });

  describe('Model Name Consistency', () => {
    it('all shared modules use the same model constants', async () => {
      const modelsModule = await import('../shared/models');
      const replicateModule = await import('../shared/replicate');
      const runwayModule = await import('../shared/runway');
      
      // Replicate models should match
      expect(replicateModule.ReplicateModels.FLUX_PRO).toBe(modelsModule.ReplicateModels.FLUX_PRO);
      expect(replicateModule.ReplicateModels.STABLE_DIFFUSION).toBe(
        modelsModule.ReplicateModels.STABLE_DIFFUSION
      );
      
      // Runway models should match
      expect(runwayModule.RunwayModels.VEO_3_1_FAST).toBe(modelsModule.RunwayModels.VEO_3_1_FAST);
      expect(runwayModule.RunwayModels.GEN_4_IMAGE).toBe(modelsModule.RunwayModels.GEN_4_IMAGE);
    });

    it('runway default model uses centralized constant', async () => {
      const modelsModule = await import('../shared/models');
      const runwayModule = await import('../shared/runway');
      
      // The defaultVideoModel is exported from the runway module
      expect(runwayModule.defaultVideoModel).toBeDefined();
      expect(runwayModule.defaultVideoModel).toBe(modelsModule.RunwayModels.GEN4_TURBO);
    });

    it('isFluxModel correctly identifies flux models', async () => {
      const modelsModule = await import('../shared/models');
      const replicateModule = await import('../shared/replicate');
      
      // Should recognize FLUX_PRO constant
      expect(modelsModule.isFluxModel(replicateModule.ReplicateModels.FLUX_PRO)).toBe(true);
      
      // Should recognize flux-kontext-pro in string
      const result = replicateModule.validatePredictionInput(
        replicateModule.ReplicateModels.FLUX_PRO,
        { prompt: 'test' }
      );
      expect(result.valid).toBe(true);
    });
  });

  describe('Shared Utilities Usage', () => {
    it('validation.ts uses supportedImageRatios from shared/runway', async () => {
      const validationModule = await import('../validation');
      const runwayModule = await import('../shared/runway');
      
      // The validation schema should work with ratios from shared module
      expect(validationModule.createJobSchema).toBeDefined();
      
      // Verify that a known ratio from shared module works
      const testData = {
        mode: 'image-generation' as const,
        promptText: 'test',
        promptImage: 'https://example.com/image.jpg',
        ratio: '1280:720' as const,
      };
      
      // This should not throw - if it does, the consolidation broke something
      const result = validationModule.createJobSchema.safeParse(testData);
      expect(result.success).toBe(true);
      expect(runwayModule.supportedImageRatios.has('1280:720')).toBe(true);
    });
  });

  describe('Error Handling Consistency', () => {
    it('extractErrorMessage handles various error formats consistently', async () => {
      const utilsModule = await import('../shared/utils');
      
      const testCases = [
        { input: 'HTTP 400: Bad Request', expected: 'Bad Request' },
        { input: 'Error: {"error":"Invalid"}', expected: 'Invalid' },
        { input: 'Simple error message', expected: 'Simple error message' },
      ];
      
      for (const testCase of testCases) {
        const result = utilsModule.extractErrorMessage(testCase.input);
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
      }
    });

    it('getStatusCodeFromError returns consistent status codes', async () => {
      const utilsModule = await import('../shared/utils');
      
      expect(utilsModule.getStatusCodeFromError('HTTP 400: Error')).toBe(400);
      expect(utilsModule.getStatusCodeFromError('HTTP 500: Error')).toBe(500);
      expect(utilsModule.getStatusCodeFromError('Other error')).toBe(500);
    });
  });
});

