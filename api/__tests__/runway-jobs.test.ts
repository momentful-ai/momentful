import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Type for Runway task response
interface RunwayTask {
  id: string;
  status: string;
  progress?: number;
  output?: string;
  failure?: string;
}

// Set environment variables before any imports
process.env.RUNWAY_API_KEY = 'test-api-key';
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

// Mock the external signed URLs module
vi.mock('../shared/external-signed-urls', () => ({
  convertStoragePathsToSignedUrls: vi.fn((obj) => Promise.resolve(obj)),
}));

// Create mock Runway client
// NOTE: Type safety is now enforced through:
// 1. Type checking integrated into test command (see package.json "test" script)
// 2. The actual implementation must match RunwayML SDK types - type errors will be caught
//    before tests run
// 3. Test assertions verify correct parameters are passed at runtime
// 
// IMPORTANT: If you change the implementation to pass incorrect types, the integrated
// type checking will catch it and fail the test run before any tests execute.
const mockRunwayClient = {
  textToImage: {
    create: vi.fn(),
  },
  imageToVideo: {
    create: vi.fn(),
  },
  tasks: {
    retrieve: vi.fn(),
  },
} as {
  textToImage: { create: ReturnType<typeof vi.fn> };
  imageToVideo: { create: ReturnType<typeof vi.fn> };
  tasks: { retrieve: ReturnType<typeof vi.fn> };
};

// Mock the Runway SDK
vi.mock('@runwayml/sdk', () => {
  return {
    default: vi.fn(() => mockRunwayClient),
  };
});

// Mock dotenv
vi.mock('dotenv', () => ({
  config: vi.fn(() => ({
    parsed: { RUNWAY_API_KEY: 'test-api-key' },
  })),
}));

// Mock the shared runway module
const mockCreateVideoTask = vi.fn();
const mockCreateImageTask = vi.fn();
const mockGetRunwayTask = vi.fn();

vi.mock('../shared/runway', () => ({
  runway: mockRunwayClient,
  createVideoTask: mockCreateVideoTask,
  createImageTask: mockCreateImageTask,
  getRunwayTask: mockGetRunwayTask,
  Mode: { 'image-to-video': 'image-to-video', 'image-generation': 'image-generation' },
  supportedImageModels: new Set(),
  supportedImageRatios: new Set(['1280:720', '720:1280', '1024:1024', '1920:1080', '1080:1920']),
  defaultImageRatio: '1280:720',
  defaultVideoModel: 'gen4',
  defaultVideoRatio: '1280:720',
  defaultVideoDuration: 4,
  RunwayModels: {
    GEN_4_IMAGE: 'gen4_image',
    GEN_4_IMAGE_TURBO: 'gen4_image_turbo',
    GEMINI_2_5_FLASH: 'gemini_2_5_flash',
    GEN4_TURBO: 'gen4_turbo',
  },
}));

describe('Runway Jobs API - Image Generation', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let handler: typeof import('../runway/jobs/index').default;

  beforeAll(async () => {
    // Import handler after mocks are set up
    const handlerModule = await import('../runway/jobs/index');
    handler = handlerModule.default;
  });

  beforeEach(() => {
    // Ensure environment is set
    process.env.RUNWAY_API_KEY = 'test-api-key';

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
    mockCreateImageTask.mockResolvedValue({ id: 'task-123' });
    mockCreateVideoTask.mockResolvedValue({ id: 'task-456' });
  });

  describe('Image Generation Mode', () => {
    it('creates image generation job with all required fields', async () => {
      const mockTask = {
        id: 'task-123',
        status: 'PROCESSING',
      };

      mockRunwayClient.textToImage.create.mockResolvedValue(mockTask as RunwayTask);

      mockReq.body = {
        mode: 'image-generation',
        promptText: 'A beautiful sunset',
        promptImage: 'https://example.com/source-image.jpg',
        model: 'gen4_image_turbo',
        ratio: '1280:720',
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      // Verify createImageTask was called correctly
      expect(mockCreateImageTask).toHaveBeenCalledWith({
        promptImage: 'https://example.com/source-image.jpg',
        promptText: 'A beautiful sunset',
        model: 'gen4_image_turbo',
        ratio: '1280:720',
      });

      // Verify response
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        taskId: 'task-123',
        status: 'processing',
      });
    });

    it('requires promptText for image-generation mode', async () => {
      mockReq.body = {
        mode: 'image-generation',
        promptImage: 'https://example.com/source-image.jpg',
        ratio: '1280:720',
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            formErrors: expect.arrayContaining([expect.stringContaining('promptText')]),
          }),
        })
      );
    });

    it('requires promptImage for image-generation mode', async () => {
      mockReq.body = {
        mode: 'image-generation',
        promptText: 'A beautiful sunset',
        ratio: '1280:720',
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            formErrors: expect.arrayContaining([expect.stringContaining('promptImage')]),
          }),
        })
      );
    });

    it('requires ratio for image-generation mode', async () => {
      mockReq.body = {
        mode: 'image-generation',
        promptText: 'A beautiful sunset',
        promptImage: 'https://example.com/source-image.jpg',
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            formErrors: expect.arrayContaining([expect.stringContaining('ratio')]),
          }),
        })
      );
    });

    it('validates ratio is a supported value', async () => {
      mockReq.body = {
        mode: 'image-generation',
        promptText: 'A beautiful sunset',
        promptImage: 'https://example.com/source-image.jpg',
        ratio: 'invalid-ratio',
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      // Should fail validation at schema level
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('uses default model when model is not provided', async () => {
      const mockTask = {
        id: 'task-123',
        status: 'PROCESSING',
      };

      mockRunwayClient.textToImage.create.mockResolvedValue(mockTask as RunwayTask);

      mockReq.body = {
        mode: 'image-generation',
        promptText: 'A beautiful sunset',
        promptImage: 'https://example.com/source-image.jpg',
        ratio: '1280:720',
        // model not provided
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      // Should use default model (gen4_image)
      expect(mockCreateImageTask).toHaveBeenCalledWith(
        expect.objectContaining({
          model: undefined, // Should not pass model, let function use default
        })
      );
    });

    it('handles Runway API errors gracefully', async () => {
      const error = new Error('HTTP 400: Bad Request - {"error":"Invalid image URL"}');
      mockCreateImageTask.mockRejectedValue(error);

      mockReq.body = {
        mode: 'image-generation',
        promptText: 'A beautiful sunset',
        promptImage: 'https://example.com/source-image.jpg',
        ratio: '1280:720',
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockCreateImageTask).toHaveBeenCalledWith({
        promptImage: 'https://example.com/source-image.jpg',
        promptText: 'A beautiful sunset',
        model: undefined,
        ratio: '1280:720',
      });
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        })
      );
    });

    it('supports different aspect ratios', async () => {
      const ratios = ['1280:720', '720:1280', '1024:1024', '1920:1080', '1080:1920'];

      for (const ratio of ratios) {
        vi.clearAllMocks();
        const mockTask = {
          id: `task-${ratio}`,
          status: 'PROCESSING',
        };

        mockRunwayClient.textToImage.create.mockResolvedValue(mockTask as RunwayTask);

        mockReq.body = {
          mode: 'image-generation',
          promptText: 'Test prompt',
          promptImage: 'https://example.com/source-image.jpg',
          ratio,
        };

        await handler(mockReq as VercelRequest, mockRes as VercelResponse);

        expect(mockCreateImageTask).toHaveBeenCalledWith(
          expect.objectContaining({
            ratio,
          })
        );
      }
    });
  });

  describe('Other Modes', () => {
    it('still supports image-to-video mode', async () => {
      const mockTask = {
        id: 'task-123',
        status: 'PROCESSING',
      };

      mockRunwayClient.imageToVideo.create.mockResolvedValue(mockTask as RunwayTask);

      mockReq.body = {
        mode: 'image-to-video',
        promptImage: 'https://example.com/source-image.jpg',
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockCreateVideoTask).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

  });

  describe('Validation', () => {
    it('rejects invalid HTTP methods', async () => {
      mockReq.method = 'GET';

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.end).toHaveBeenCalled();
    });

    it('validates request body schema', async () => {
      mockReq.body = {
        mode: 'invalid-mode',
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Object),
        })
      );
    });
  });
});
