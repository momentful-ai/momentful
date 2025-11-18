import { describe, it, expect } from 'vitest';
import { isMediaAsset, isEditedImage, isGeneratedVideo } from '../../../lib/type-guards';
import { MediaAsset, EditedImage, GeneratedVideo } from '../../../types';

describe('Type Guard Functions', () => {
  describe('isMediaAsset', () => {
    it('should return true for valid MediaAsset objects', () => {
      const validMediaAsset: MediaAsset = {
        id: '1',
        project_id: 'project-1',
        user_id: 'user-1',
        file_name: 'image.jpg',
        file_type: 'image',
        file_size: 1000,
        storage_path: '/path/to/file',
        sort_order: 1,
        created_at: '2024-01-01T00:00:00Z'
      };

      expect(isMediaAsset(validMediaAsset)).toBe(true);
    });

    it('should return true for MediaAsset with optional fields', () => {
      const mediaAssetWithOptionals: MediaAsset = {
        id: '1',
        project_id: 'project-1',
        user_id: 'user-1',
        file_name: 'image.jpg',
        file_type: 'image',
        file_size: 1000,
        storage_path: '/path/to/file',
        sort_order: 1,
        created_at: '2024-01-01T00:00:00Z',
        thumbnail_url: 'thumb.jpg',
        width: 800,
        height: 600,
        duration: 30,
        lineage_id: 'lineage-1'
      };

      expect(isMediaAsset(mediaAssetWithOptionals)).toBe(true);
    });

    it('should return false for objects with prompt property', () => {
      const invalidObject = {
        id: '1',
        project_id: 'project-1',
        user_id: 'user-1',
        file_name: 'image.jpg',
        file_type: 'image',
        file_size: 1000,
        storage_path: '/path/to/file',
        sort_order: 1,
        created_at: '2024-01-01T00:00:00Z',
        prompt: 'some prompt' // This makes it invalid for MediaAsset
      };

      expect(isMediaAsset(invalidObject)).toBe(false);
    });

    it('should return false for objects with status property', () => {
      const invalidObject = {
        id: '1',
        project_id: 'project-1',
        user_id: 'user-1',
        file_name: 'image.jpg',
        file_type: 'image',
        file_size: 1000,
        storage_path: '/path/to/file',
        sort_order: 1,
        created_at: '2024-01-01T00:00:00Z',
        status: 'completed' // This makes it invalid for MediaAsset
      };

      expect(isMediaAsset(invalidObject)).toBe(false);
    });

    it('should return false for objects missing file_type', () => {
      const invalidObject = {
        id: '1',
        project_id: 'project-1',
        user_id: 'user-1',
        file_name: 'image.jpg',
        file_size: 1000,
        storage_path: '/path/to/file',
        sort_order: 1,
        created_at: '2024-01-01T00:00:00Z'
        // Missing file_type
      };

      expect(isMediaAsset(invalidObject)).toBe(false);
    });
  });

  describe('isEditedImage', () => {
    it('should return true for valid EditedImage objects', () => {
      const validEditedImage: EditedImage = {
        id: '1',
        project_id: 'project-1',
        user_id: 'user-1',
        prompt: 'enhance this image',
        context: { brightness: 1.2 },
        ai_model: 'model-v1',
        storage_path: '/path/to/edited/image',
        width: 800,
        height: 600,
        version: 1,
        created_at: '2024-01-01T00:00:00Z'
      };

      expect(isEditedImage(validEditedImage)).toBe(true);
    });

    it('should return true for EditedImage with optional fields', () => {
      const editedImageWithOptionals: EditedImage = {
        id: '1',
        project_id: 'project-1',
        user_id: 'user-1',
        prompt: 'enhance this image',
        context: { brightness: 1.2 },
        ai_model: 'model-v1',
        storage_path: '/path/to/edited/image',
        width: 800,
        height: 600,
        version: 1,
        created_at: '2024-01-01T00:00:00Z',
        thumbnail_url: 'thumb.jpg',
        parent_id: 'parent-1',
        lineage_id: 'lineage-1',
        edited_url: 'signed-url'
      };

      expect(isEditedImage(editedImageWithOptionals)).toBe(true);
    });

    it('should return false for objects missing prompt', () => {
      const invalidObject = {
        id: '1',
        project_id: 'project-1',
        user_id: 'user-1',
        context: { brightness: 1.2 },
        ai_model: 'model-v1',
        storage_path: '/path/to/edited/image',
        width: 800,
        height: 600,
        version: 1,
        created_at: '2024-01-01T00:00:00Z'
        // Missing prompt
      };

      expect(isEditedImage(invalidObject)).toBe(false);
    });

    it('should return false for MediaAsset objects', () => {
      const mediaAsset: MediaAsset = {
        id: '1',
        project_id: 'project-1',
        user_id: 'user-1',
        file_name: 'image.jpg',
        file_type: 'image',
        file_size: 1000,
        storage_path: '/path/to/file',
        sort_order: 1,
        created_at: '2024-01-01T00:00:00Z'
      };

      expect(isEditedImage(mediaAsset)).toBe(false);
    });
  });

  describe('isGeneratedVideo', () => {
    it('should return true for valid GeneratedVideo objects', () => {
      const validGeneratedVideo: GeneratedVideo = {
        id: '1',
        project_id: 'project-1',
        user_id: 'user-1',
        name: 'generated-video',
        ai_model: 'video-model-v1',
        aspect_ratio: '16:9',
        status: 'completed',
        created_at: '2024-01-01T00:00:00Z'
      };

      expect(isGeneratedVideo(validGeneratedVideo)).toBe(true);
    });

    it('should return true for GeneratedVideo with optional fields', () => {
      const videoWithOptionals: GeneratedVideo = {
        id: '1',
        project_id: 'project-1',
        user_id: 'user-1',
        name: 'generated-video',
        ai_model: 'video-model-v1',
        aspect_ratio: '16:9',
        status: 'completed',
        created_at: '2024-01-01T00:00:00Z',
        storage_path: '/path/to/video',
        thumbnail_url: 'thumb.jpg',
        duration: 30,
        version: 1,
        parent_id: 'parent-1',
        runway_task_id: 'task-123',
        completed_at: '2024-01-01T00:30:00Z',
        lineage_id: 'lineage-1'
      };

      expect(isGeneratedVideo(videoWithOptionals)).toBe(true);
    });

    it('should return false for objects missing status', () => {
      const invalidObject = {
        id: '1',
        project_id: 'project-1',
        user_id: 'user-1',
        name: 'generated-video',
        ai_model: 'video-model-v1',
        aspect_ratio: '16:9',
        created_at: '2024-01-01T00:00:00Z'
        // Missing status
      };

      expect(isGeneratedVideo(invalidObject)).toBe(false);
    });

    it('should return false for MediaAsset objects', () => {
      const mediaAsset: MediaAsset = {
        id: '1',
        project_id: 'project-1',
        user_id: 'user-1',
        file_name: 'image.jpg',
        file_type: 'image',
        file_size: 1000,
        storage_path: '/path/to/file',
        sort_order: 1,
        created_at: '2024-01-01T00:00:00Z'
      };

      expect(isGeneratedVideo(mediaAsset)).toBe(false);
    });

    it('should return false for EditedImage objects', () => {
      const editedImage: EditedImage = {
        id: '1',
        project_id: 'project-1',
        user_id: 'user-1',
        prompt: 'enhance this image',
        context: { brightness: 1.2 },
        ai_model: 'model-v1',
        storage_path: '/path/to/edited/image',
        width: 800,
        height: 600,
        version: 1,
        created_at: '2024-01-01T00:00:00Z'
      };

      expect(isGeneratedVideo(editedImage)).toBe(false);
    });
  });

  describe('Cross-contamination tests', () => {
    it('should not misclassify objects with mixed properties', () => {
      // Object with properties from multiple types should not match any type guard
      const mixedObject = {
        id: '1',
        project_id: 'project-1',
        user_id: 'user-1',
        file_name: 'image.jpg',
        file_type: 'image',     // MediaAsset property
        file_size: 1000,
        storage_path: '/path/to/file',
        sort_order: 1,
        created_at: '2024-01-01T00:00:00Z',
        prompt: 'some prompt',  // EditedImage property - makes it invalid for MediaAsset
        status: 'completed'     // GeneratedVideo property - makes it invalid for MediaAsset
      };

      expect(isMediaAsset(mixedObject)).toBe(false);
      expect(isEditedImage(mixedObject)).toBe(true); // Still valid as EditedImage due to prompt
      expect(isGeneratedVideo(mixedObject)).toBe(true); // Still valid as GeneratedVideo due to status
    });
  });

  describe('Edge cases', () => {
    it('should return false for null', () => {
      expect(isMediaAsset(null)).toBe(false);
      expect(isEditedImage(null)).toBe(false);
      expect(isGeneratedVideo(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isMediaAsset(undefined)).toBe(false);
      expect(isEditedImage(undefined)).toBe(false);
      expect(isGeneratedVideo(undefined)).toBe(false);
    });

    it('should return false for primitive values', () => {
      expect(isMediaAsset('string')).toBe(false);
      expect(isMediaAsset(42)).toBe(false);
      expect(isMediaAsset(true)).toBe(false);
      expect(isEditedImage('string')).toBe(false);
      expect(isEditedImage(42)).toBe(false);
      expect(isEditedImage(true)).toBe(false);
      expect(isGeneratedVideo('string')).toBe(false);
      expect(isGeneratedVideo(42)).toBe(false);
      expect(isGeneratedVideo(true)).toBe(false);
    });

    it('should return false for arrays', () => {
      expect(isMediaAsset([])).toBe(false);
      expect(isEditedImage([])).toBe(false);
      expect(isGeneratedVideo([])).toBe(false);
    });

    it('should return false for empty objects', () => {
      expect(isMediaAsset({})).toBe(false);
      expect(isEditedImage({})).toBe(false);
      expect(isGeneratedVideo({})).toBe(false);
    });
  });
});
