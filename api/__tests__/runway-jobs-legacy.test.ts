import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Mock validation module
const mockCreateJobSchema = {
  safeParse: vi.fn(),
};

vi.mock('../validation', () => ({
  createJobSchema: mockCreateJobSchema,
}));

// Mock the nested jobs module
const mockCreateVideoTask = vi.fn();

vi.mock('../runway/jobs/index', () => ({
  createVideoTask: mockCreateVideoTask,
}));

// Set environment variable
process.env.RUNWAY_API_KEY = 'test-api-key';

describe('Legacy Runway Jobs API (runway-jobs.ts)', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let handler: typeof import('../runway-jobs').default;

  beforeAll(async () => {
    // Import handler after mocks are set up
    const handlerModule = await import('../runway-jobs');
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

  describe('POST /api/runway-jobs', () => {
    it('successfully creates an image-to-video task', async () => {
      const mockTask = {
        id: 'task-123',
        status: 'PROCESSING',
      };
      mockCreateVideoTask.mockResolvedValue(mockTask);
      mockCreateJobSchema.safeParse.mockReturnValue({
        success: true,
        data: {
          mode: 'image-to-video',
          promptImage: 'https://example.com/image.jpg',
        },
      });

      mockReq.body = {
        mode: 'image-to-video',
        promptImage: 'https://example.com/image.jpg',
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockCreateVideoTask).toHaveBeenCalledWith({
        mode: 'image-to-video',
        promptImage: 'https://example.com/image.jpg',
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        taskId: 'task-123',
        status: 'processing',
      });
    });

    it('successfully creates a text-to-video task', async () => {
      const mockTask = {
        id: 'task-456',
        status: 'PROCESSING',
      };
      mockCreateVideoTask.mockResolvedValue(mockTask);
      mockCreateJobSchema.safeParse.mockReturnValue({
        success: true,
        data: {
          mode: 'text-to-video',
          promptText: 'A beautiful landscape',
        },
      });

      mockReq.body = {
        mode: 'text-to-video',
        promptText: 'A beautiful landscape',
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockCreateVideoTask).toHaveBeenCalledWith({
        mode: 'text-to-video',
        promptText: 'A beautiful landscape',
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        taskId: 'task-456',
        status: 'processing',
      });
    });

    it('returns 400 when validation fails', async () => {
      mockCreateJobSchema.safeParse.mockReturnValue({
        success: false,
        error: {
          flatten: () => ({
            fieldErrors: { mode: ['Invalid mode'] },
          }),
        },
      });

      mockReq.body = {
        mode: 'invalid-mode',
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockCreateVideoTask).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: expect.objectContaining({
          fieldErrors: expect.objectContaining({
            mode: expect.arrayContaining(['Invalid mode']),
          }),
        }),
      });
    });

    it('handles task creation errors gracefully', async () => {
      const error = new Error('Runway API error');
      mockCreateVideoTask.mockRejectedValue(error);
      mockCreateJobSchema.safeParse.mockReturnValue({
        success: true,
        data: {
          mode: 'image-to-video',
          promptImage: 'https://example.com/image.jpg',
        },
      });

      mockReq.body = {
        mode: 'image-to-video',
        promptImage: 'https://example.com/image.jpg',
      };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to create Runway task',
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

