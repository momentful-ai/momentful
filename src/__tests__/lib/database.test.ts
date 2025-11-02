import { describe, it, expect, vi, beforeEach } from 'vitest';
import { database } from '../../lib/database';

// Mock Supabase client - must be created inside factory function
vi.mock('../../lib/supabase', () => {
  // Create a query builder mock that chains methods
  const createQueryBuilder = () => ({
    select: vi.fn(() => createQueryBuilder()),
    insert: vi.fn(() => createQueryBuilder()),
    update: vi.fn(() => createQueryBuilder()),
    delete: vi.fn(() => createQueryBuilder()),
    eq: vi.fn(() => createQueryBuilder()),
    order: vi.fn(() => createQueryBuilder()),
    limit: vi.fn(() => createQueryBuilder()),
    single: vi.fn(),
  });

  const mockSupabaseClient = {
    from: vi.fn(() => createQueryBuilder()),
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockSupabaseClient = supabase as any; // Type assertion needed for test mocks

describe('database', () => {
  // Helper to create a query builder mock
  const createQueryBuilder = (finalResult: { data: unknown; error: unknown | null }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const builder: any = {
      select: vi.fn(() => builder),
      insert: vi.fn(() => builder),
      update: vi.fn(() => builder),
      delete: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      order: vi.fn(() => finalResult), // Queries ending with order() return result
      limit: vi.fn(() => finalResult), // Queries ending with limit() return result
      single: vi.fn(() => finalResult), // Queries ending with single() return result
    };
    return builder;
  };

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

        // Create query builder mocks
        const queryBuilder1 = {
          select: vi.fn(() => queryBuilder1),
          order: vi.fn(() => ({ data: mockProjects, error: null })),
        };
        const queryBuilder2 = {
          select: vi.fn(() => queryBuilder2),
          eq: vi.fn(() => queryBuilder2),
          order: vi.fn(() => queryBuilder2),
          limit: vi.fn(() => ({ data: mockMediaAssets, error: null })),
        };
        const queryBuilder3 = {
          select: vi.fn(() => queryBuilder3),
          eq: vi.fn(() => queryBuilder3),
          order: vi.fn(() => queryBuilder3),
          limit: vi.fn(() => ({ data: [], error: null })),
        };

        // Mock projects query
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder1);

        // Mock media assets queries for each project
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder2);
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder3);

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
        const queryBuilder = {
          select: vi.fn(() => queryBuilder),
          order: vi.fn(() => ({ data: [], error: null })),
        };
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

        const result = await database.projects.list();

        expect(result).toEqual([]);
      });

      it('handles database errors', async () => {
        const dbError = { message: 'Database error', code: 'PGRST301' };
        const queryBuilder = createQueryBuilder({ data: null, error: dbError });
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

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

        const queryBuilder = createQueryBuilder({ data: mockProject, error: null });
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

        const result = await database.projects.create('user-1', 'New Project', 'New Description');

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('projects');
        expect(queryBuilder.insert).toHaveBeenCalledWith({
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

        const queryBuilder = createQueryBuilder({ data: mockProject, error: null });
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

        const result = await database.projects.create('user-1', 'New Project');

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('projects');
        expect(queryBuilder.insert).toHaveBeenCalledWith({
          user_id: 'user-1',
          name: 'New Project',
          description: null,
        });
        expect(result).toEqual(mockProject);
      });

      it('handles database errors on create', async () => {
        const dbError = { message: 'Insert failed', code: '23505' };
        const queryBuilder = createQueryBuilder({ data: null, error: dbError });
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

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

        const queryBuilder = createQueryBuilder({ data: mockUpdatedProject, error: null });
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

        const result = await database.projects.update('project-1', {
          name: 'Updated Project',
          description: 'Updated Description',
        });

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('projects');
        expect(queryBuilder.update).toHaveBeenCalledWith({
          name: 'Updated Project',
          description: 'Updated Description',
        });
        expect(queryBuilder.eq).toHaveBeenCalledWith('id', 'project-1');
        expect(result).toEqual(mockUpdatedProject);
      });

      it('handles database errors on update', async () => {
        const dbError = { message: 'Update failed', code: '23505' };
        const queryBuilder = createQueryBuilder({ data: null, error: dbError });
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

        await expect(database.projects.update('project-1', { name: 'Updated' })).rejects.toEqual(dbError);
      });
    });

    describe('delete', () => {
      it('successfully deletes a project', async () => {
        // For delete operations, delete() returns a builder, and eq() returns the result
        const deleteBuilder = {
          eq: vi.fn(() => ({ data: null, error: null })),
        };
        const queryBuilder = {
          delete: vi.fn(() => deleteBuilder),
        };
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

        await database.projects.delete('project-1');

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('projects');
        expect(queryBuilder.delete).toHaveBeenCalled();
        expect(deleteBuilder.eq).toHaveBeenCalledWith('id', 'project-1');
      });

      it('handles database errors on delete', async () => {
        const dbError = { message: 'Delete failed', code: '23503' };
        const deleteBuilder = {
          eq: vi.fn(() => ({ data: null, error: dbError })),
        };
        const queryBuilder = {
          delete: vi.fn(() => deleteBuilder),
        };
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

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

        const queryBuilder = createQueryBuilder({ data: mockAssets, error: null });
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

        const result = await database.mediaAssets.list('project-1');

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('media_assets');
        expect(queryBuilder.eq).toHaveBeenCalledWith('project_id', 'project-1');
        expect(result).toEqual(mockAssets);
      });

      it('returns empty array when no assets exist', async () => {
        const queryBuilder = createQueryBuilder({ data: [], error: null });
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

        const result = await database.mediaAssets.list('project-1');

        expect(result).toEqual([]);
      });

      it('handles database errors', async () => {
        const dbError = { message: 'Database error', code: 'PGRST301' };
        const queryBuilder = createQueryBuilder({ data: null, error: dbError });
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

        await expect(database.mediaAssets.list('project-1')).rejects.toEqual(dbError);
      });
    });

    describe('getById', () => {
      it('successfully retrieves a media asset by id', async () => {
        const mockAsset = {
          id: 'asset-1',
          project_id: 'project-1',
          user_id: 'user-1',
          file_name: 'image.jpg',
          file_type: 'image' as const,
          file_size: 1024000,
          storage_path: 'path/to/image.jpg',
          thumbnail_url: 'https://example.com/thumb.jpg',
          width: 1920,
          height: 1080,
          sort_order: 0,
          created_at: '2025-01-01T00:00:00Z',
        };

        const queryBuilder = createQueryBuilder({ data: mockAsset, error: null });
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

        const result = await database.mediaAssets.getById('asset-1');

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('media_assets');
        expect(queryBuilder.select).toHaveBeenCalledWith('*');
        expect(queryBuilder.eq).toHaveBeenCalledWith('id', 'asset-1');
        expect(queryBuilder.single).toHaveBeenCalled();
        expect(result).toEqual(mockAsset);
      });

      it('handles database errors when asset not found', async () => {
        const dbError = { message: 'No rows returned', code: 'PGRST116' };
        const queryBuilder = createQueryBuilder({ data: null, error: dbError });
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

        await expect(database.mediaAssets.getById('non-existent-asset')).rejects.toEqual(dbError);
      });

      it('handles other database errors', async () => {
        const dbError = { message: 'Database connection error', code: 'PGRST301' };
        const queryBuilder = createQueryBuilder({ data: null, error: dbError });
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

        await expect(database.mediaAssets.getById('asset-1')).rejects.toEqual(dbError);
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

        const mockLineage = {
          id: 'lineage-1',
          project_id: 'project-1',
          user_id: 'user-1',
          root_media_asset_id: 'asset-new',
          name: 'new-image.jpg',
        };

        const mockUpdatedAsset = {
          ...mockAsset,
          lineage_id: 'lineage-1',
        };

        // Mock the first insert (media_asset)
        const insertBuilder1 = createQueryBuilder({ data: mockAsset, error: null });
        mockSupabaseClient.from.mockReturnValueOnce(insertBuilder1);

        // Mock the lineage creation
        const insertBuilder2 = createQueryBuilder({ data: mockLineage, error: null });
        mockSupabaseClient.from.mockReturnValueOnce(insertBuilder2);

        // Mock the update (media_asset with lineage_id)
        const updateBuilder = createQueryBuilder({ data: mockUpdatedAsset, error: null });
        mockSupabaseClient.from.mockReturnValueOnce(updateBuilder);

        const result = await database.mediaAssets.create(mockAsset);

        expect(insertBuilder1.insert).toHaveBeenCalledWith(mockAsset);
        expect(result).toEqual(mockUpdatedAsset);
      });

      it('handles database errors on create', async () => {
        const dbError = { message: 'Insert failed', code: '23505' };
        const queryBuilder = createQueryBuilder({ data: null, error: dbError });
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

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
        // For delete operations, delete() returns a builder, and eq() returns the result
        const deleteBuilder = {
          eq: vi.fn(() => ({ data: null, error: null })),
        };
        const queryBuilder = {
          delete: vi.fn(() => deleteBuilder),
        };
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

        await database.mediaAssets.delete('asset-1');

        expect(queryBuilder.delete).toHaveBeenCalled();
        expect(deleteBuilder.eq).toHaveBeenCalledWith('id', 'asset-1');
      });

      it('handles database errors on delete', async () => {
        const dbError = { message: 'Delete failed', code: '23503' };
        const deleteBuilder = {
          eq: vi.fn(() => ({ data: null, error: dbError })),
        };
        const queryBuilder = {
          delete: vi.fn(() => deleteBuilder),
        };
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

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

        const queryBuilder = createQueryBuilder({ data: mockImages, error: null });
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

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
        const queryBuilder = createQueryBuilder({ data: null, error: dbError });
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

        await expect(database.editedImages.list('project-1')).rejects.toEqual(dbError);
      });
    });

    describe('listBySourceAsset', () => {
      it('successfully lists edited images by source asset with public URLs', async () => {
        const mockImages = [
          {
            id: 'image-1',
            project_id: 'project-1',
            source_asset_id: 'source-asset-1',
            storage_path: 'path/to/image1.jpg',
          },
          {
            id: 'image-2',
            project_id: 'project-1',
            source_asset_id: 'source-asset-1',
            storage_path: 'path/to/image2.jpg',
          },
        ];

        const queryBuilder = createQueryBuilder({ data: mockImages, error: null });
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

        // Mock storage.getPublicUrl for each image
        const mockStorageBucket = {
          getPublicUrl: vi.fn((path) => ({
            data: { publicUrl: `https://example.com/user-uploads/${path}` },
          })),
        };
        mockSupabaseClient.storage.from.mockReturnValue(mockStorageBucket);

        const result = await database.editedImages.listBySourceAsset('source-asset-1');

        expect(mockSupabaseClient.from).toHaveBeenCalledWith('edited_images');
        expect(queryBuilder.eq).toHaveBeenCalledWith('source_asset_id', 'source-asset-1');
        expect(result).toHaveLength(2);
        expect(result[0].edited_url).toBe('https://example.com/user-uploads/path/to/image1.jpg');
        expect(result[1].edited_url).toBe('https://example.com/user-uploads/path/to/image2.jpg');
      });

      it('returns empty array when no images exist for source asset', async () => {
        const queryBuilder = createQueryBuilder({ data: [], error: null });
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

        const result = await database.editedImages.listBySourceAsset('source-asset-1');

        expect(result).toEqual([]);
      });

      it('handles database errors', async () => {
        const dbError = { message: 'Database error', code: 'PGRST301' };
        const queryBuilder = createQueryBuilder({ data: null, error: dbError });
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

        await expect(database.editedImages.listBySourceAsset('source-asset-1')).rejects.toEqual(dbError);
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

        const queryBuilder = createQueryBuilder({ data: mockImage, error: null });
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

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

        expect(queryBuilder.insert).toHaveBeenCalledWith({
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

        const queryBuilder = createQueryBuilder({ data: mockImage, error: null });
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

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

        expect(queryBuilder.insert).toHaveBeenCalledWith(
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
        // When validation fails, insert is never called
        expect(mockSupabaseClient.from).not.toHaveBeenCalled();
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
        // When validation fails, insert is never called
        expect(mockSupabaseClient.from).not.toHaveBeenCalled();
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
        // When validation fails, insert is never called
        expect(mockSupabaseClient.from).not.toHaveBeenCalled();
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

        const queryBuilder = createQueryBuilder({ data: mockImage, error: null });
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

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
        const insertCall = queryBuilder.insert.mock.calls[0][0];
        expect(insertCall.project_id).toBeDefined();
        expect(insertCall.project_id).toBe('project-1');
        expect(insertCall.project_id.trim()).not.toBe('');
        expect(insertCall.project_id.length).toBeGreaterThan(0);
      });
    });

    describe('delete', () => {
      it('successfully deletes an edited image', async () => {
        // For delete operations, delete() returns a builder, and eq() returns the result
        const deleteBuilder = {
          eq: vi.fn(() => ({ data: null, error: null })),
        };
        const queryBuilder = {
          delete: vi.fn(() => deleteBuilder),
        };
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

        await database.editedImages.delete('image-1');

        expect(queryBuilder.delete).toHaveBeenCalled();
        expect(deleteBuilder.eq).toHaveBeenCalledWith('id', 'image-1');
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

        // Create a query builder that chains select -> eq -> order
        const queryBuilder = {
          select: vi.fn(() => queryBuilder),
          eq: vi.fn(() => queryBuilder),
          order: vi.fn(() => ({ data: mockVideos, error: null })),
        };
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

        const result = await database.generatedVideos.list('project-1');

        expect(result).toEqual(mockVideos);
      });

      it('returns empty array when no videos exist', async () => {
        // Create a query builder that chains select -> eq -> order
        const queryBuilder = {
          select: vi.fn(() => queryBuilder),
          eq: vi.fn(() => queryBuilder),
          order: vi.fn(() => ({ data: [], error: null })),
        };
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

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

        const queryBuilder = createQueryBuilder({ data: mockVideo, error: null });
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

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
        // When validation fails, insert is never called
        expect(mockSupabaseClient.from).not.toHaveBeenCalled();
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
        // When validation fails, insert is never called
        expect(mockSupabaseClient.from).not.toHaveBeenCalled();
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
        // When validation fails, insert is never called
        expect(mockSupabaseClient.from).not.toHaveBeenCalled();
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

        const queryBuilder = createQueryBuilder({ data: mockVideo, error: null });
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

        await database.generatedVideos.create({
          project_id: 'project-1',
          user_id: 'user-1',
          name: 'New Video',
          ai_model: 'runway-gen2',
          aspect_ratio: '16:9',
        });

        // Verify the payload sent to database has non-empty project_id
        const insertCall = queryBuilder.insert.mock.calls[0][0];
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

        const queryBuilder = createQueryBuilder({ data: mockUpdatedVideo, error: null });
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

        const result = await database.generatedVideos.update('video-1', {
          status: 'completed',
          storage_path: 'path/to/video.mp4',
        });

        expect(result).toEqual(mockUpdatedVideo);
      });
    });

    describe('delete', () => {
      it('successfully deletes a generated video', async () => {
        // For delete operations, delete() returns a builder, and eq() returns the result
        const deleteBuilder = {
          eq: vi.fn(() => ({ data: null, error: null })),
        };
        const queryBuilder = {
          delete: vi.fn(() => deleteBuilder),
        };
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

        await database.generatedVideos.delete('video-1');

        expect(queryBuilder.delete).toHaveBeenCalled();
        expect(deleteBuilder.eq).toHaveBeenCalledWith('id', 'video-1');
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

        // Create a query builder that chains select -> eq -> order
        const queryBuilder = {
          select: vi.fn(() => queryBuilder),
          eq: vi.fn(() => queryBuilder),
          order: vi.fn(() => ({ data: mockSources, error: null })),
        };
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

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

        const queryBuilder = createQueryBuilder({ data: mockSource, error: null });
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

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
        // For delete operations, delete() returns a builder, and eq() returns the result
        const deleteBuilder = {
          eq: vi.fn(() => ({ data: null, error: null })),
        };
        const queryBuilder = {
          delete: vi.fn(() => deleteBuilder),
        };
        mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

        await database.videoSources.delete('source-1');

        expect(queryBuilder.delete).toHaveBeenCalled();
        expect(deleteBuilder.eq).toHaveBeenCalledWith('id', 'source-1');
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

describe('lineages', () => {
  // Helper to create a query builder mock (same as in database describe block)
  const createQueryBuilder = (finalResult: { data: unknown; error: unknown | null }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const builder: any = {
      select: vi.fn(() => builder),
      insert: vi.fn(() => builder),
      update: vi.fn(() => builder),
      delete: vi.fn(() => builder),
      eq: vi.fn(() => builder),
      order: vi.fn(() => finalResult), // Queries ending with order() return result
      limit: vi.fn(() => finalResult), // Queries ending with limit() return result
      single: vi.fn(() => finalResult), // Queries ending with single() return result
    };
    return builder;
  };

  describe('create', () => {
    it('successfully creates a lineage', async () => {
      const mockLineage = {
        id: 'lineage-1',
        project_id: 'project-1',
        user_id: 'user-1',
        root_media_asset_id: 'asset-1',
        name: 'Test Lineage',
        metadata: {},
        created_at: '2025-01-01T00:00:00Z',
      };

      const queryBuilder = createQueryBuilder({ data: mockLineage, error: null });
      mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

      const result = await database.lineages.create({
        project_id: 'project-1',
        user_id: 'user-1',
        root_media_asset_id: 'asset-1',
        name: 'Test Lineage',
      });

      expect(queryBuilder.insert).toHaveBeenCalledWith({
        project_id: 'project-1',
        user_id: 'user-1',
        root_media_asset_id: 'asset-1',
        name: 'Test Lineage',
        metadata: {},
      });
      expect(result).toEqual(mockLineage);
    });

    // Add more tests for error handling, etc.
  });

  describe('getByProject', () => {
    it('successfully retrieves lineages by project ID', async () => {
      const mockLineages = [
        {
          id: 'lineage-1',
          project_id: 'project-1',
          user_id: 'user-1',
          root_media_asset_id: 'asset-1',
          name: 'Lineage 1',
          metadata: {},
          created_at: '2025-01-01T00:00:00Z',
        },
        {
          id: 'lineage-2',
          project_id: 'project-1',
          user_id: 'user-1',
          root_media_asset_id: 'asset-2',
          name: 'Lineage 2',
          metadata: {},
          created_at: '2025-01-02T00:00:00Z',
        },
      ];

      const queryBuilder = createQueryBuilder({ data: mockLineages, error: null });
      mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

      const result = await database.lineages.getByProject('project-1');

      expect(queryBuilder.select).toHaveBeenCalledWith('*');
      expect(queryBuilder.eq).toHaveBeenCalledWith('project_id', 'project-1');
      expect(queryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockLineages);
    });

    it('returns empty array when no lineages found', async () => {
      const queryBuilder = createQueryBuilder({ data: null, error: null });
      mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

      const result = await database.lineages.getByProject('project-1');

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('successfully retrieves a lineage by ID', async () => {
      const mockLineage = {
        id: 'lineage-1',
        project_id: 'project-1',
        user_id: 'user-1',
        root_media_asset_id: 'asset-1',
        name: 'Test Lineage',
        metadata: {},
        created_at: '2025-01-01T00:00:00Z',
      };

      const queryBuilder = createQueryBuilder({ data: mockLineage, error: null });
      mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

      const result = await database.lineages.getById('lineage-1');

      expect(queryBuilder.select).toHaveBeenCalledWith('*');
      expect(queryBuilder.eq).toHaveBeenCalledWith('id', 'lineage-1');
      expect(queryBuilder.single).toHaveBeenCalled();
      expect(result).toEqual(mockLineage);
    });
  });

  describe('getByRootAsset', () => {
    it('successfully retrieves a lineage by root asset ID', async () => {
      const mockLineage = {
        id: 'lineage-1',
        project_id: 'project-1',
        user_id: 'user-1',
        root_media_asset_id: 'asset-1',
        name: 'Test Lineage',
        metadata: {},
        created_at: '2025-01-01T00:00:00Z',
      };

      const queryBuilder = createQueryBuilder({ data: mockLineage, error: null });
      mockSupabaseClient.from.mockReturnValueOnce(queryBuilder);

      const result = await database.lineages.getByRootAsset('asset-1');

      expect(queryBuilder.select).toHaveBeenCalledWith('*');
      expect(queryBuilder.eq).toHaveBeenCalledWith('root_media_asset_id', 'asset-1');
      expect(queryBuilder.single).toHaveBeenCalled();
      expect(result).toEqual(mockLineage);
    });
  });

  describe('getTimelineData', () => {
    it('fetches and builds timeline data correctly', async () => {
      // Mock data for each table
      const mockMediaAssets = [
        {
          id: 'asset-1',
          storage_path: 'path/to/asset.jpg',
          created_at: '2025-01-01T00:00:00Z',
          lineage_id: 'lineage-1',
        },
      ];
      const mockEditedImages = [
        {
          id: 'edit-1',
          source_asset_id: 'asset-1',
          storage_path: 'path/to/edit.jpg',
          created_at: '2025-01-02T00:00:00Z',
          lineage_id: 'lineage-1',
        },
      ];
      const mockGeneratedVideos = [
        {
          id: 'video-1',
          storage_path: 'path/to/video.mp4',
          created_at: '2025-01-03T00:00:00Z',
          lineage_id: 'lineage-1',
        },
      ];
      const mockVideoSources = [{ video_id: 'video-1', source_id: 'edit-1', source_type: 'edited_image' }];

      // Mock queries - each needs a query builder that chains select -> eq
      const mediaAssetsBuilder = {
        select: vi.fn(() => mediaAssetsBuilder),
        eq: vi.fn(() => ({ data: mockMediaAssets, error: null })),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mediaAssetsBuilder);

      const editedImagesBuilder = {
        select: vi.fn(() => editedImagesBuilder),
        eq: vi.fn(() => ({ data: mockEditedImages, error: null })),
      };
      mockSupabaseClient.from.mockReturnValueOnce(editedImagesBuilder);

      const generatedVideosBuilder = {
        select: vi.fn(() => generatedVideosBuilder),
        eq: vi.fn(() => ({ data: mockGeneratedVideos, error: null })),
      };
      mockSupabaseClient.from.mockReturnValueOnce(generatedVideosBuilder);

      // For video sources, we need to mock multiple calls (one per video)
      const videoSourcesBuilder1 = {
        select: vi.fn(() => videoSourcesBuilder1),
        eq: vi.fn(() => ({ data: mockVideoSources, error: null })),
      };
      mockSupabaseClient.from.mockReturnValueOnce(videoSourcesBuilder1);

      const result = await database.lineages.getTimelineData('lineage-1');

      expect(result.nodes).toHaveLength(3);
      expect(result.edges).toEqual([
        { from: 'asset-1', to: 'edit-1' },
        { from: 'edit-1', to: 'video-1' },
      ]);
    });

    it('creates edges using parent_id when source_asset_id is missing', async () => {
      // Mock data with an edited image that has parent_id but no source_asset_id
      const mockMediaAssets = [
        {
          id: 'asset-1',
          storage_path: 'path/to/asset.jpg',
          created_at: '2025-01-01T00:00:00Z',
          lineage_id: 'lineage-1',
        },
      ];
      const mockEditedImages = [
        {
          id: 'edit-1',
          source_asset_id: null, // No source_asset_id
          parent_id: 'edit-parent', // Has parent_id instead
          storage_path: 'path/to/edit.jpg',
          created_at: '2025-01-02T00:00:00Z',
          lineage_id: 'lineage-1',
        },
      ];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockGeneratedVideos: any[] = [];

      // Mock queries
      const mediaAssetsBuilder = {
        select: vi.fn(() => mediaAssetsBuilder),
        eq: vi.fn(() => ({ data: mockMediaAssets, error: null })),
      };
      mockSupabaseClient.from.mockReturnValueOnce(mediaAssetsBuilder);

      const editedImagesBuilder = {
        select: vi.fn(() => editedImagesBuilder),
        eq: vi.fn(() => ({ data: mockEditedImages, error: null })),
      };
      mockSupabaseClient.from.mockReturnValueOnce(editedImagesBuilder);

      const generatedVideosBuilder = {
        select: vi.fn(() => generatedVideosBuilder),
        eq: vi.fn(() => ({ data: mockGeneratedVideos, error: null })),
      };
      mockSupabaseClient.from.mockReturnValueOnce(generatedVideosBuilder);

      const result = await database.lineages.getTimelineData('lineage-1');

      expect(result.nodes).toHaveLength(2);
      expect(result.edges).toEqual([
        { from: 'edit-parent', to: 'edit-1' }, // Should use parent_id
      ]);
    });

    // Add error handling tests, empty data, etc.
  });
});

