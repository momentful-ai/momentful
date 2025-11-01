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

// Set environment variable before any imports
process.env.RUNWAY_API_KEY = 'test-api-key';

// Create mock Runway client
const mockRunwayClient = {
  textToImage: {
    create: vi.fn(),
  },
  imageToVideo: {
    create: vi.fn(),
  },
  textToVideo: {
    create: vi.fn(),
  },
  tasks: {
    retrieve: vi.fn(),
  },
} as {
  textToImage: { create: ReturnType<typeof vi.fn> };
  imageToVideo: { create: ReturnType<typeof vi.fn> };
  textToVideo: { create: ReturnType<typeof vi.fn> };
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
vi.mock('../shared/runway', async () => {
  const actual = await vi.importActual('../shared/runway');
  return {
    ...actual,
    runway: mockRunwayClient,
  };
});

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

      // Verify Runway API was called correctly
      expect(mockRunwayClient.textToImage.create).toHaveBeenCalledWith({
        model: 'gen4_image_turbo',
        promptText: 'A beautiful sunset',
        ratio: '1280:720',
        referenceImages: [
          {
            uri: 'https://example.com/source-image.jpg',
            tag: 'source',
          },
        ],
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
      expect(mockRunwayClient.textToImage.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gen4_image',
        })
      );
    });

    it('handles Runway API errors gracefully', async () => {
      const error = new Error('HTTP 400: Bad Request - {"error":"Invalid image URL"}');
      mockRunwayClient.textToImage.create.mockRejectedValue(error);

      mockReq.body = {
        mode: 'image-generation',
        promptText: 'A beautiful sunset',
        promptImage: 'https://example.com/source-image.jpg',
        ratio: '1280:720',
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

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

        expect(mockRunwayClient.textToImage.create).toHaveBeenCalledWith(
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

      expect(mockRunwayClient.imageToVideo.create).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('still supports text-to-video mode', async () => {
      const mockTask = {
        id: 'task-123',
        status: 'PROCESSING',
      };

      mockRunwayClient.textToVideo.create.mockResolvedValue(mockTask as RunwayTask);

      mockReq.body = {
        mode: 'text-to-video',
        promptText: 'A beautiful landscape',
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRunwayClient.textToVideo.create).toHaveBeenCalled();
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
