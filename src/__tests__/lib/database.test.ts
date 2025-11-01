import { describe, it, expect, vi, beforeEach } from 'vitest';
import { database } from '../../lib/database';

// Mock Supabase client - must be created inside factory function
vi.mock('../../lib/supabase', () => {
  const mockSupabaseClient = {
    from: vi.fn(() => mockSupabaseClient),
    select: vi.fn(() => mockSupabaseClient),
    insert: vi.fn(() => mockSupabaseClient),
    update: vi.fn(() => mockSupabaseClient),
    delete: vi.fn(() => mockSupabaseClient),
    eq: vi.fn(() => mockSupabaseClient),
    order: vi.fn(() => mockSupabaseClient),
    limit: vi.fn(() => mockSupabaseClient),
    single: vi.fn(),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        remove: vi.fn(),
        getPublicUrl: vi.fn(),
      })),
    },
  };

  return {
    supabase: mockSupabaseClient,
  };
});

// Import the mocked supabase to access the mock in tests
import { supabase } from '../../lib/supabase';
const mockSupabaseClient = supabase;

describe('database', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('projects', () => {
    describe('list', () => {
      it('successfully lists all projects with preview images', async () => {
        const mockProjects = [
          {
            id: 'project-1',
            user_id: 'user-1',
            name: 'Project 1',
            description: 'Description 1',
            thumbnail_url: null,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
          },
          {
            id: 'project-2',
            user_id: 'user-1',
            name: 'Project 2',
            description: null,
            thumbnail_url: 'https://example.com/thumb.jpg',
            created_at: '2025-01-02T00:00:00Z',
            updated_at: '2025-01-02T00:00:00Z',
          },
        ];

        const mockMediaAssets = [
          { storage_path: 'path1.jpg' },
          { storage_path: 'path2.jpg' },
        ];

        // Mock projects query
        mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.order.mockReturnValueOnce({
          data: mockProjects,
          error: null,
        });

        // Mock media assets queries for each project
        mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.order.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.limit.mockReturnValueOnce({
          data: mockMediaAssets,
          error: null,
        });

        mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.order.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.limit.mockReturnValueOnce({
          data: [],
          error: null,
        });

        const result = await database.projects.list();

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('projects');
        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
          ...mockProjects[0],
          previewImages: ['path1.jpg', 'path2.jpg'],
        });
        expect(result[1]).toEqual({
          ...mockProjects[1],
          previewImages: [],
        });
      });

      it('returns empty array when no projects exist', async () => {
        mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.order.mockReturnValueOnce({
          data: [],
          error: null,
        });

        const result = await database.projects.list();

        expect(result).toEqual([]);
      });

      it('handles database errors', async () => {
        const dbError = { message: 'Database error', code: 'PGRST301' };
        mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.order.mockReturnValueOnce({
          data: null,
          error: dbError,
        });

        await expect(database.projects.list()).rejects.toEqual(dbError);
      });
    });

    describe('create', () => {
      it('successfully creates a project with description', async () => {
        const mockProject = {
          id: 'project-new',
          user_id: 'user-1',
          name: 'New Project',
          description: 'New Description',
          thumbnail_url: null,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        };

        mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.insert.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.single.mockReturnValueOnce({
          data: mockProject,
          error: null,
        });

        const result = await database.projects.create('user-1', 'New Project', 'New Description');

        expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
          user_id: 'user-1',
          name: 'New Project',
          description: 'New Description',
        });
        expect(result).toEqual(mockProject);
      });

      it('successfully creates a project without description', async () => {
        const mockProject = {
          id: 'project-new',
          user_id: 'user-1',
          name: 'New Project',
          description: null,
          thumbnail_url: null,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        };

        mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.insert.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.single.mockReturnValueOnce({
          data: mockProject,
          error: null,
        });

        const result = await database.projects.create('user-1', 'New Project');

        expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
          user_id: 'user-1',
          name: 'New Project',
          description: null,
        });
        expect(result).toEqual(mockProject);
      });

      it('handles database errors on create', async () => {
        const dbError = { message: 'Insert failed', code: '23505' };
        mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.insert.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.single.mockReturnValueOnce({
          data: null,
          error: dbError,
        });

        await expect(database.projects.create('user-1', 'New Project')).rejects.toEqual(dbError);
      });
    });

    describe('update', () => {
      it('successfully updates a project', async () => {
        const mockUpdatedProject = {
          id: 'project-1',
          user_id: 'user-1',
          name: 'Updated Project',
          description: 'Updated Description',
          thumbnail_url: null,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z',
        };

        mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.update.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.single.mockReturnValueOnce({
          data: mockUpdatedProject,
          error: null,
        });

        const result = await database.projects.update('project-1', {
          name: 'Updated Project',
          description: 'Updated Description',
        });

        expect(mockSupabaseClient.update).toHaveBeenCalledWith({
          name: 'Updated Project',
          description: 'Updated Description',
        });
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'project-1');
        expect(result).toEqual(mockUpdatedProject);
      });

      it('handles database errors on update', async () => {
        const dbError = { message: 'Update failed', code: '23505' };
        mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.update.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.single.mockReturnValueOnce({
          data: null,
          error: dbError,
        });

        await expect(database.projects.update('project-1', { name: 'Updated' })).rejects.toEqual(dbError);
      });
    });

    describe('delete', () => {
      it('successfully deletes a project', async () => {
        mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.delete.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.eq.mockReturnValueOnce({
          data: null,
          error: null,
        });

        await database.projects.delete('project-1');

        expect(mockSupabaseClient.delete).toHaveBeenCalled();
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'project-1');
      });

      it('handles database errors on delete', async () => {
        const dbError = { message: 'Delete failed', code: '23503' };
        mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.delete.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.eq.mockReturnValueOnce({
          data: null,
          error: dbError,
        });

        await expect(database.projects.delete('project-1')).rejects.toEqual(dbError);
      });
    });
  });

  describe('mediaAssets', () => {
    describe('list', () => {
      it('successfully lists media assets for a project', async () => {
        const mockAssets = [
          {
            id: 'asset-1',
            project_id: 'project-1',
            file_name: 'image.jpg',
            file_type: 'image',
            storage_path: 'path/to/image.jpg',
          },
        ];

        mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.order.mockReturnValueOnce({
          data: mockAssets,
          error: null,
        });

        const result = await database.mediaAssets.list('project-1');

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('media_assets');
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('project_id', 'project-1');
        expect(result).toEqual(mockAssets);
      });

      it('returns empty array when no assets exist', async () => {
        mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.order.mockReturnValueOnce({
          data: [],
          error: null,
        });

        const result = await database.mediaAssets.list('project-1');

        expect(result).toEqual([]);
      });

      it('handles database errors', async () => {
        const dbError = { message: 'Database error', code: 'PGRST301' };
        mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.order.mockReturnValueOnce({
          data: null,
          error: dbError,
        });

        await expect(database.mediaAssets.list('project-1')).rejects.toEqual(dbError);
      });
    });

    describe('create', () => {
      it('successfully creates a media asset', async () => {
        const mockAsset = {
          id: 'asset-new',
          project_id: 'project-1',
          user_id: 'user-1',
          file_name: 'new-image.jpg',
          file_type: 'image' as const,
          file_size: 1024000,
          storage_path: 'path/to/new-image.jpg',
          width: 1920,
          height: 1080,
        };

        mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.insert.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.single.mockReturnValueOnce({
          data: mockAsset,
          error: null,
        });

        const result = await database.mediaAssets.create(mockAsset);

        expect(mockSupabaseClient.insert).toHaveBeenCalledWith(mockAsset);
        expect(result).toEqual(mockAsset);
      });

      it('handles database errors on create', async () => {
        const dbError = { message: 'Insert failed', code: '23505' };
        mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.insert.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.single.mockReturnValueOnce({
          data: null,
          error: dbError,
        });

        await expect(
          database.mediaAssets.create({
            project_id: 'project-1',
            user_id: 'user-1',
            file_name: 'test.jpg',
            file_type: 'image',
            file_size: 1024,
            storage_path: 'path/to/test.jpg',
          })
        ).rejects.toEqual(dbError);
      });
    });

    describe('delete', () => {
      it('successfully deletes a media asset', async () => {
        mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.delete.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.eq.mockReturnValueOnce({
          data: null,
          error: null,
        });

        await database.mediaAssets.delete('asset-1');

        expect(mockSupabaseClient.delete).toHaveBeenCalled();
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'asset-1');
      });

      it('handles database errors on delete', async () => {
        const dbError = { message: 'Delete failed', code: '23503' };
        mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.delete.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.eq.mockReturnValueOnce({
          data: null,
          error: dbError,
        });

        await expect(database.mediaAssets.delete('asset-1')).rejects.toEqual(dbError);
      });
    });
  });

  describe('editedImages', () => {
    describe('list', () => {
      it('successfully lists edited images with public URLs', async () => {
        const mockImages = [
          {
            id: 'image-1',
            project_id: 'project-1',
            storage_path: 'path/to/image1.jpg',
          },
        ];

        mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.order.mockReturnValueOnce({
          data: mockImages,
          error: null,
        });

        // Mock storage.getPublicUrl
        const mockStorageBucket = {
          getPublicUrl: vi.fn(() => ({
            data: { publicUrl: 'https://example.com/user-uploads/path/to/image1.jpg' },
          })),
        };
        mockSupabaseClient.storage.from.mockReturnValueOnce(mockStorageBucket);

        const result = await database.editedImages.list('project-1');

        expect(result[0].edited_url).toBe('https://example.com/user-uploads/path/to/image1.jpg');
      });

      it('handles database errors', async () => {
        const dbError = { message: 'Database error', code: 'PGRST301' };
        mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.order.mockReturnValueOnce({
          data: null,
          error: dbError,
        });

        await expect(database.editedImages.list('project-1')).rejects.toEqual(dbError);
      });
    });

    describe('create', () => {
      it('successfully creates an edited image with context', async () => {
        const mockImage = {
          id: 'image-new',
          project_id: 'project-1',
          user_id: 'user-1',
          storage_path: 'path/to/edited.jpg',
          prompt: 'Test prompt',
          context: { test: 'value' },
          ai_model: 'runway-gen4',
          width: 1920,
          height: 1080,
        };

        mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.insert.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.single.mockReturnValueOnce({
          data: mockImage,
          error: null,
        });

        const mockStorageBucket = {
          getPublicUrl: vi.fn(() => ({
            data: { publicUrl: 'https://example.com/user-uploads/path/to/edited.jpg' },
          })),
        };
        mockSupabaseClient.storage.from.mockReturnValueOnce(mockStorageBucket);

        const result = await database.editedImages.create({
          project_id: 'project-1',
          user_id: 'user-1',
          prompt: 'Test prompt',
          context: { test: 'value' },
          ai_model: 'runway-gen4',
          storage_path: 'path/to/edited.jpg',
          width: 1920,
          height: 1080,
        });

        expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
          project_id: 'project-1',
          user_id: 'user-1',
          prompt: 'Test prompt',
          context: { test: 'value' },
          ai_model: 'runway-gen4',
          storage_path: 'path/to/edited.jpg',
          width: 1920,
          height: 1080,
        });
        expect(result.edited_url).toBe('https://example.com/user-uploads/path/to/edited.jpg');
      });

      it('uses empty object for context when not provided', async () => {
        const mockImage = {
          id: 'image-new',
          project_id: 'project-1',
          user_id: 'user-1',
          storage_path: 'path/to/edited.jpg',
          prompt: 'Test prompt',
          context: {},
          ai_model: 'runway-gen4',
          width: 1920,
          height: 1080,
        };

        mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.insert.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.single.mockReturnValueOnce({
          data: mockImage,
          error: null,
        });

        const mockStorageBucket = {
          getPublicUrl: vi.fn(() => ({
            data: { publicUrl: 'https://example.com/user-uploads/path/to/edited.jpg' },
          })),
        };
        mockSupabaseClient.storage.from.mockReturnValueOnce(mockStorageBucket);

        const result = await database.editedImages.create({
          project_id: 'project-1',
          user_id: 'user-1',
          prompt: 'Test prompt',
          ai_model: 'runway-gen4',
          storage_path: 'path/to/edited.jpg',
          width: 1920,
          height: 1080,
        });

        expect(mockSupabaseClient.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            context: {},
          })
        );
        expect(result).toBeDefined();
      });

      it('throws error when project_id is empty', async () => {
        await expect(
          database.editedImages.create({
            project_id: '',
            user_id: 'user-1',
            prompt: 'Test prompt',
            ai_model: 'runway-gen4',
            storage_path: 'path/to/edited.jpg',
            width: 1920,
            height: 1080,
          })
        ).rejects.toThrow('project_id is required and cannot be empty');

        // Verify insert was never called
        expect(mockSupabaseClient.insert).not.toHaveBeenCalled();
      });

      it('throws error when project_id is whitespace only', async () => {
        await expect(
          database.editedImages.create({
            project_id: '   ',
            user_id: 'user-1',
            prompt: 'Test prompt',
            ai_model: 'runway-gen4',
            storage_path: 'path/to/edited.jpg',
            width: 1920,
            height: 1080,
          })
        ).rejects.toThrow('project_id is required and cannot be empty');

        // Verify insert was never called
        expect(mockSupabaseClient.insert).not.toHaveBeenCalled();
      });

      it('throws error when user_id is empty', async () => {
        await expect(
          database.editedImages.create({
            project_id: 'project-1',
            user_id: '',
            prompt: 'Test prompt',
            ai_model: 'runway-gen4',
            storage_path: 'path/to/edited.jpg',
            width: 1920,
            height: 1080,
          })
        ).rejects.toThrow('user_id is required and cannot be empty');

        // Verify insert was never called
        expect(mockSupabaseClient.insert).not.toHaveBeenCalled();
      });

      it('asserts project_id is always present and non-empty in payload', async () => {
        const mockImage = {
          id: 'image-new',
          project_id: 'project-1',
          user_id: 'user-1',
          storage_path: 'path/to/edited.jpg',
          prompt: 'Test prompt',
          context: {},
          ai_model: 'runway-gen4',
          width: 1920,
          height: 1080,
        };

        mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.insert.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.single.mockReturnValueOnce({
          data: mockImage,
          error: null,
        });

        const mockStorageBucket = {
          getPublicUrl: vi.fn(() => ({
            data: { publicUrl: 'https://example.com/user-uploads/path/to/edited.jpg' },
          })),
        };
        mockSupabaseClient.storage.from.mockReturnValueOnce(mockStorageBucket);

        await database.editedImages.create({
          project_id: 'project-1',
          user_id: 'user-1',
          prompt: 'Test prompt',
          ai_model: 'runway-gen4',
          storage_path: 'path/to/edited.jpg',
          width: 1920,
          height: 1080,
        });

        // Verify the payload sent to database has non-empty project_id
        const insertCall = mockSupabaseClient.insert.mock.calls[0][0];
        expect(insertCall.project_id).toBeDefined();
        expect(insertCall.project_id).toBe('project-1');
        expect(insertCall.project_id.trim()).not.toBe('');
        expect(insertCall.project_id.length).toBeGreaterThan(0);
      });
    });

    describe('delete', () => {
      it('successfully deletes an edited image', async () => {
        mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.delete.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.eq.mockReturnValueOnce({
          data: null,
          error: null,
        });

        await database.editedImages.delete('image-1');

        expect(mockSupabaseClient.delete).toHaveBeenCalled();
        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'image-1');
      });
    });
  });

  describe('generatedVideos', () => {
    describe('list', () => {
      it('successfully lists generated videos', async () => {
        const mockVideos = [
          {
            id: 'video-1',
            project_id: 'project-1',
            name: 'Video 1',
            status: 'completed' as const,
          },
        ];

        mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.order.mockReturnValueOnce({
          data: mockVideos,
          error: null,
        });

        const result = await database.generatedVideos.list('project-1');

        expect(result).toEqual(mockVideos);
      });

      it('returns empty array when no videos exist', async () => {
        mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.order.mockReturnValueOnce({
          data: [],
          error: null,
        });

        const result = await database.generatedVideos.list('project-1');

        expect(result).toEqual([]);
      });
    });

    describe('create', () => {
      it('successfully creates a generated video', async () => {
        const mockVideo = {
          id: 'video-new',
          project_id: 'project-1',
          user_id: 'user-1',
          name: 'New Video',
          ai_model: 'runway-gen2',
          aspect_ratio: '16:9',
          status: 'processing' as const,
        };

        mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.insert.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.single.mockReturnValueOnce({
          data: mockVideo,
          error: null,
        });

        const result = await database.generatedVideos.create({
          project_id: 'project-1',
          user_id: 'user-1',
          name: 'New Video',
          ai_model: 'runway-gen2',
          aspect_ratio: '16:9',
        });

        expect(result).toEqual(mockVideo);
      });

      it('throws error when project_id is empty', async () => {
        await expect(
          database.generatedVideos.create({
            project_id: '',
            user_id: 'user-1',
            name: 'New Video',
            ai_model: 'runway-gen2',
            aspect_ratio: '16:9',
          })
        ).rejects.toThrow('project_id is required and cannot be empty');

        // Verify insert was never called
        expect(mockSupabaseClient.insert).not.toHaveBeenCalled();
      });

      it('throws error when project_id is whitespace only', async () => {
        await expect(
          database.generatedVideos.create({
            project_id: '   ',
            user_id: 'user-1',
            name: 'New Video',
            ai_model: 'runway-gen2',
            aspect_ratio: '16:9',
          })
        ).rejects.toThrow('project_id is required and cannot be empty');

        // Verify insert was never called
        expect(mockSupabaseClient.insert).not.toHaveBeenCalled();
      });

      it('throws error when user_id is empty', async () => {
        await expect(
          database.generatedVideos.create({
            project_id: 'project-1',
            user_id: '',
            name: 'New Video',
            ai_model: 'runway-gen2',
            aspect_ratio: '16:9',
          })
        ).rejects.toThrow('user_id is required and cannot be empty');

        // Verify insert was never called
        expect(mockSupabaseClient.insert).not.toHaveBeenCalled();
      });

      it('asserts project_id is always present and non-empty in payload', async () => {
        const mockVideo = {
          id: 'video-new',
          project_id: 'project-1',
          user_id: 'user-1',
          name: 'New Video',
          ai_model: 'runway-gen2',
          aspect_ratio: '16:9',
          status: 'processing' as const,
        };

        mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.insert.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.single.mockReturnValueOnce({
          data: mockVideo,
          error: null,
        });

        await database.generatedVideos.create({
          project_id: 'project-1',
          user_id: 'user-1',
          name: 'New Video',
          ai_model: 'runway-gen2',
          aspect_ratio: '16:9',
        });

        // Verify the payload sent to database has non-empty project_id
        const insertCall = mockSupabaseClient.insert.mock.calls[0][0];
        expect(insertCall.project_id).toBeDefined();
        expect(insertCall.project_id).toBe('project-1');
        expect(insertCall.project_id.trim()).not.toBe('');
        expect(insertCall.project_id.length).toBeGreaterThan(0);
      });
    });

    describe('update', () => {
      it('successfully updates a generated video', async () => {
        const mockUpdatedVideo = {
          id: 'video-1',
          project_id: 'project-1',
          status: 'completed' as const,
          storage_path: 'path/to/video.mp4',
        };

        mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.update.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.single.mockReturnValueOnce({
          data: mockUpdatedVideo,
          error: null,
        });

        const result = await database.generatedVideos.update('video-1', {
          status: 'completed',
          storage_path: 'path/to/video.mp4',
        });

        expect(result).toEqual(mockUpdatedVideo);
      });
    });

    describe('delete', () => {
      it('successfully deletes a generated video', async () => {
        mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.delete.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.eq.mockReturnValueOnce({
          data: null,
          error: null,
        });

        await database.generatedVideos.delete('video-1');

        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'video-1');
      });
    });
  });

  describe('videoSources', () => {
    describe('list', () => {
      it('successfully lists video sources', async () => {
        const mockSources = [
          {
            id: 'source-1',
            video_id: 'video-1',
            source_type: 'edited_image' as const,
            source_id: 'image-1',
            sort_order: 1,
          },
        ];

        mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.eq.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.order.mockReturnValueOnce({
          data: mockSources,
          error: null,
        });

        const result = await database.videoSources.list('video-1');

        expect(result).toEqual(mockSources);
      });
    });

    describe('create', () => {
      it('successfully creates a video source', async () => {
        const mockSource = {
          id: 'source-new',
          video_id: 'video-1',
          source_type: 'media_asset' as const,
          source_id: 'asset-1',
          sort_order: 1,
        };

        mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.insert.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.select.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.single.mockReturnValueOnce({
          data: mockSource,
          error: null,
        });

        const result = await database.videoSources.create({
          video_id: 'video-1',
          source_type: 'media_asset',
          source_id: 'asset-1',
          sort_order: 1,
        });

        expect(result).toEqual(mockSource);
      });
    });

    describe('delete', () => {
      it('successfully deletes a video source', async () => {
        mockSupabaseClient.from.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.delete.mockReturnValueOnce(mockSupabaseClient);
        mockSupabaseClient.eq.mockReturnValueOnce({
          data: null,
          error: null,
        });

        await database.videoSources.delete('source-1');

        expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'source-1');
      });
    });
  });

  describe('storage', () => {
    describe('upload', () => {
      it('successfully uploads a file', async () => {
        const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
        const mockUploadResult = {
          path: 'path/to/file.jpg',
          id: 'file-id',
        };

        const mockStorageBucket = {
          upload: vi.fn().mockResolvedValue({
            data: mockUploadResult,
            error: null,
          }),
        };
        mockSupabaseClient.storage.from.mockReturnValueOnce(mockStorageBucket);

        const result = await database.storage.upload('bucket-name', 'path/to/file.jpg', mockFile);

        expect(mockStorageBucket.upload).toHaveBeenCalledWith('path/to/file.jpg', mockFile, {
          cacheControl: '3600',
          upsert: false,
        });
        expect(result).toEqual(mockUploadResult);
      });

      it('handles upload errors', async () => {
        const mockFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
        const uploadError = { message: 'Upload failed', statusCode: 400 };

        const mockStorageBucket = {
          upload: vi.fn().mockResolvedValue({
            data: null,
            error: uploadError,
          }),
        };
        mockSupabaseClient.storage.from.mockReturnValueOnce(mockStorageBucket);

        await expect(
          database.storage.upload('bucket-name', 'path/to/file.jpg', mockFile)
        ).rejects.toEqual(uploadError);
      });
    });

    describe('delete', () => {
      it('successfully deletes files', async () => {
        const mockStorageBucket = {
          remove: vi.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        };
        mockSupabaseClient.storage.from.mockReturnValueOnce(mockStorageBucket);

        await database.storage.delete('bucket-name', ['path1.jpg', 'path2.jpg']);

        expect(mockStorageBucket.remove).toHaveBeenCalledWith(['path1.jpg', 'path2.jpg']);
      });

      it('handles delete errors', async () => {
        const deleteError = { message: 'Delete failed', statusCode: 400 };
        const mockStorageBucket = {
          remove: vi.fn().mockResolvedValue({
            data: null,
            error: deleteError,
          }),
        };
        mockSupabaseClient.storage.from.mockReturnValueOnce(mockStorageBucket);

        await expect(database.storage.delete('bucket-name', ['path1.jpg'])).rejects.toEqual(
          deleteError
        );
      });
    });

    describe('getPublicUrl', () => {
      it('successfully generates public URL', () => {
        const mockStorageBucket = {
          getPublicUrl: vi.fn(() => ({
            data: { publicUrl: 'https://example.com/bucket-name/path/to/file.jpg' },
          })),
        };
        mockSupabaseClient.storage.from.mockReturnValueOnce(mockStorageBucket);

        const url = database.storage.getPublicUrl('bucket-name', 'path/to/file.jpg');

        expect(mockStorageBucket.getPublicUrl).toHaveBeenCalledWith('path/to/file.jpg');
        expect(url).toBe('https://example.com/bucket-name/path/to/file.jpg');
      });
    });
  });
});

