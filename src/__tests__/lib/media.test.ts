import { describe, it, expect, vi } from 'vitest';
import { getImageDimensions, isAcceptableImageFile } from '../../lib/media';

// Mock the database module
vi.mock('../../lib/database', () => ({
  database: {
    storage: {
      getPublicUrl: vi.fn((bucket, path) => `https://example.com/${bucket}/${path}`),
    },
  },
}));

describe('media utils', () => {
  describe('isAcceptableImageFile', () => {
    it('should accept valid image MIME types', () => {
      const jpegFile = { type: 'image/jpeg' } as File;
      const pngFile = { type: 'image/png' } as File;
      const webpFile = { type: 'image/webp' } as File;
      const gifFile = { type: 'image/gif' } as File;

      expect(isAcceptableImageFile(jpegFile)).toBe(true);
      expect(isAcceptableImageFile(pngFile)).toBe(true);
      expect(isAcceptableImageFile(webpFile)).toBe(true);
      expect(isAcceptableImageFile(gifFile)).toBe(true);
    });

    it('should reject invalid file types', () => {
      const txtFile = { type: 'text/plain' } as File;
      const pdfFile = { type: 'application/pdf' } as File;
      const videoFile = { type: 'video/mp4' } as File;

      expect(isAcceptableImageFile(txtFile)).toBe(false);
      expect(isAcceptableImageFile(pdfFile)).toBe(false);
      expect(isAcceptableImageFile(videoFile)).toBe(false);
    });
  });

  describe('getImageDimensions', () => {
    it('should return correct dimensions for a valid image', async () => {
      // Mock URL.createObjectURL
      global.URL = {
        createObjectURL: vi.fn(() => 'blob:mock-url'),
        revokeObjectURL: vi.fn(),
      } as unknown as typeof global.URL;

      // Create a mock image that loads successfully
      const mockImage = {
        width: 100,
        height: 200,
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
      };

      // Mock Image constructor
      global.Image = vi.fn(() => mockImage) as unknown as typeof Image;

      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });

      // Create a promise that resolves when the image loads
      const dimensionsPromise = getImageDimensions(file);

      // Simulate image load
      if (mockImage.onload) {
        mockImage.onload();
      }

      const dimensions = await dimensionsPromise;
      expect(dimensions).toEqual({ width: 100, height: 200 });
    });

    it('should reject when image fails to load', async () => {
      // Mock URL.createObjectURL
      global.URL = {
        createObjectURL: vi.fn(() => 'blob:mock-url'),
        revokeObjectURL: vi.fn(),
      } as unknown as typeof global.URL;

      const mockImage = {
        width: 0,
        height: 0,
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        src: '',
      };

      global.Image = vi.fn(() => mockImage) as unknown as typeof Image;

      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });

      const dimensionsPromise = getImageDimensions(file);

      // Simulate image load error
      if (mockImage.onerror) {
        mockImage.onerror();
      }

      await expect(dimensionsPromise).rejects.toThrow();
    });
  });
});
