import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Mock the nested jobs module
const mockGetRunwayTask = vi.fn();

vi.mock('../runway/jobs/[id]', () => ({
  getRunwayTask: mockGetRunwayTask,
}));

describe('Legacy Runway Jobs API [id] (runway-jobs-id.ts)', () => {
  let mockReq: Partial<VercelRequest>;
  let mockRes: Partial<VercelResponse>;
  let handler: typeof import('../runway-jobs-id').default;

  beforeAll(async () => {
    // Import handler after mocks are set up
    const handlerModule = await import('../runway-jobs-id');
    handler = handlerModule.default;
  });

  beforeEach(() => {
    // Setup mock request
    mockReq = {
      method: 'GET',
      params: {},
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

  describe('GET /api/runway-jobs-id', () => {
    it('successfully retrieves a task', async () => {
      const mockTask = {
        id: 'task-123',
        status: 'SUCCEEDED',
        output: 'https://example.com/video.mp4',
      };
      mockGetRunwayTask.mockResolvedValue(mockTask);

      mockReq.params = { id: 'task-123' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockGetRunwayTask).toHaveBeenCalledWith('task-123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        id: 'task-123',
        status: 'SUCCEEDED',
        output: 'https://example.com/video.mp4',
      });
    });

    it('returns null output when task has no output', async () => {
      const mockTask = {
        id: 'task-456',
        status: 'PROCESSING',
        output: undefined,
      };
      mockGetRunwayTask.mockResolvedValue(mockTask);

      mockReq.params = { id: 'task-456' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        id: 'task-456',
        status: 'PROCESSING',
        output: null,
      });
    });

    it('returns 400 when id is missing', async () => {
      mockReq.params = {};

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockGetRunwayTask).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Missing task id',
      });
    });

    it('handles task retrieval errors gracefully', async () => {
      const error = new Error('Task not found');
      mockGetRunwayTask.mockRejectedValue(error);

      mockReq.params = { id: 'non-existent-task' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Failed to retrieve task',
      });
    });
  });

  describe('Unsupported HTTP Methods', () => {
    it('returns 405 for POST method', async () => {
      mockReq.method = 'POST';
      mockReq.params = { id: 'task-123' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.end).toHaveBeenCalled();
    });

    it('returns 405 for PUT method', async () => {
      mockReq.method = 'PUT';
      mockReq.params = { id: 'task-123' };

      await handler(mockReq as VercelRequest, mockRes as VercelResponse);

      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.end).toHaveBeenCalled();
    });
  });
});

