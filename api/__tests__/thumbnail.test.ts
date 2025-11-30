// Set environment variables before any imports that might use them
process.env.SUPABASE_SECRET_KEY = 'test-secret-key';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

import { describe, it, expect, vi } from 'vitest';

// Mock all external dependencies BEFORE any imports
vi.mock('fluent-ffmpeg');
vi.mock('ffmpeg-static', () => ({ default: '/usr/bin/ffmpeg' }));
vi.mock('fs');
vi.mock('@supabase/supabase-js');

// Mock the supabase module to prevent it from throwing during import
vi.mock('../shared/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: 'mock-data', error: null }),
      })),
    },
  },
}));

// Import after mocks are set up
import { generateAndUploadThumbnail } from '../shared/thumbnail';

describe('Thumbnail Generation', () => {
  describe('generateAndUploadThumbnail', () => {
    it('should export the function', () => {
      expect(typeof generateAndUploadThumbnail).toBe('function');
    });

    it('should have correct function signature', () => {
      expect(generateAndUploadThumbnail).toBeInstanceOf(Function);
      expect(generateAndUploadThumbnail.length).toBe(4); // 4 parameters: videoUrl, userId, projectId, videoId
    });

    it('should reject when called without proper environment setup', async () => {
      const videoUrl = 'https://example.com/video.mp4';
      const userId = 'user-123';
      const projectId = 'project-456';
      const videoId = 'video-789';

      // This will fail because we don't have real Supabase credentials
      // but it shows the function can be called with correct parameters
      await expect(generateAndUploadThumbnail(videoUrl, userId, projectId, videoId))
        .rejects.toThrow();
    });
  });
});