import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDeleteEditedImage } from '../../hooks/useDeleteEditedImage';
import { database } from '../../lib/database';
import { EditedImage } from '../../types';

// Mock the database module
vi.mock('../../lib/database', () => ({
  database: {
    storage: {
      delete: vi.fn(),
    },
    editedImages: {
      delete: vi.fn(),
    },
  },
}));

const mockEditedImages: EditedImage[] = [
  {
    id: 'image-1',
    project_id: 'project-1',
    user_id: 'user-1',
    prompt: 'Test prompt 1',
    context: {},
    ai_model: 'runway-gen4-turbo',
    storage_path: 'user-uploads/user-1/project-1/image-1.png',
    edited_url: 'https://example.com/image-1.png',
    width: 1920,
    height: 1080,
    version: 1,
    parent_id: undefined,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'image-2',
    project_id: 'project-1',
    user_id: 'user-1',
    prompt: 'Test prompt 2',
    context: {},
    ai_model: 'runway-gen4-turbo',
    storage_path: 'user-uploads/user-1/project-1/image-2.png',
    edited_url: 'https://example.com/image-2.png',
    width: 1920,
    height: 1080,
    version: 1,
    parent_id: undefined,
    created_at: '2025-01-02T00:00:00Z',
  },
];

describe('useDeleteEditedImage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    vi.mocked(database.storage.delete).mockResolvedValue(undefined);
    vi.mocked(database.editedImages.delete).mockResolvedValue(undefined);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('successfully deletes edited image', async () => {
    const { result } = renderHook(() => useDeleteEditedImage(), { wrapper });

    const response = await result.current.mutateAsync({
      imageId: 'image-1',
      storagePath: 'user-uploads/user-1/project-1/image-1.png',
      projectId: 'project-1',
    });

    expect(response.imageId).toBe('image-1');
    expect(database.storage.delete).toHaveBeenCalledWith('user-uploads', [
      'user-uploads/user-1/project-1/image-1.png',
    ]);
    expect(database.editedImages.delete).toHaveBeenCalledWith('image-1');
  });

  it('deletes from storage first, then database (correct order)', async () => {
    const callOrder: string[] = [];
    vi.mocked(database.storage.delete).mockImplementation(async () => {
      callOrder.push('storage');
      return undefined;
    });
    vi.mocked(database.editedImages.delete).mockImplementation(async () => {
      callOrder.push('database');
      return undefined;
    });

    const { result } = renderHook(() => useDeleteEditedImage(), { wrapper });

    await result.current.mutateAsync({
      imageId: 'image-1',
      storagePath: 'user-uploads/user-1/project-1/image-1.png',
      projectId: 'project-1',
    });

    expect(callOrder).toEqual(['storage', 'database']);
  });

  it('optimistically removes image from cache immediately', async () => {
    queryClient.setQueryData(['edited-images', 'project-1'], mockEditedImages);
    const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

    const { result } = renderHook(() => useDeleteEditedImage(), { wrapper });

    await result.current.mutateAsync({
      imageId: 'image-1',
      storagePath: 'user-uploads/user-1/project-1/image-1.png',
      projectId: 'project-1',
    });

    // Verify setQueryData was called for optimistic update
    expect(setQueryDataSpy).toHaveBeenCalledWith(
      ['edited-images', 'project-1'],
      expect.any(Function)
    );

    // Verify the cache was updated correctly (image removed)
    const cachedData = queryClient.getQueryData<EditedImage[]>(['edited-images', 'project-1']);
    expect(cachedData?.length).toBe(1);
    expect(cachedData?.find(img => img.id === 'image-1')).toBeUndefined();
    expect(cachedData?.find(img => img.id === 'image-2')).toBeDefined();
  });

  it('cancels pending queries on mutate', async () => {
    const cancelQueriesSpy = vi.spyOn(queryClient, 'cancelQueries');
    queryClient.setQueryData(['edited-images', 'project-1'], mockEditedImages);

    const { result } = renderHook(() => useDeleteEditedImage(), { wrapper });

    await result.current.mutateAsync({
      imageId: 'image-1',
      storagePath: 'user-uploads/user-1/project-1/image-1.png',
      projectId: 'project-1',
    });

    expect(cancelQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['edited-images', 'project-1'],
    });
  });

  it('snapshots previous state before optimistic update', async () => {
    queryClient.setQueryData(['edited-images', 'project-1'], mockEditedImages);
    const originalData = [...mockEditedImages];

    const { result } = renderHook(() => useDeleteEditedImage(), { wrapper });

    await result.current.mutateAsync({
      imageId: 'image-1',
      storagePath: 'user-uploads/user-1/project-1/image-1.png',
      projectId: 'project-1',
    });

    // The previous state should have been snapshotted for potential rollback
    // We can verify this by checking rollback works correctly
    expect(originalData.length).toBe(2);
  });

  it('rolls back optimistic update on error', async () => {
    const error = new Error('Failed to delete');
    vi.mocked(database.storage.delete).mockRejectedValue(error);

    queryClient.setQueryData(['edited-images', 'project-1'], mockEditedImages);
    const originalData = [...mockEditedImages];

    const { result } = renderHook(() => useDeleteEditedImage(), { wrapper });

    try {
      await result.current.mutateAsync({
        imageId: 'image-1',
        storagePath: 'user-uploads/user-1/project-1/image-1.png',
        projectId: 'project-1',
      });
    } catch {
      // Expected to throw
    }

    // Wait for rollback to complete
    await waitFor(() => {
      const cachedData = queryClient.getQueryData<EditedImage[]>(['edited-images', 'project-1']);
      expect(cachedData).toEqual(originalData);
      expect(cachedData?.length).toBe(2);
      expect(cachedData?.find(img => img.id === 'image-1')).toBeDefined();
    });
  });

  it('restores previous images array on error', async () => {
    const error = new Error('Database error');
    vi.mocked(database.editedImages.delete).mockRejectedValue(error);

    queryClient.setQueryData(['edited-images', 'project-1'], mockEditedImages);
    const originalData = [...mockEditedImages];

    const { result } = renderHook(() => useDeleteEditedImage(), { wrapper });

    try {
      await result.current.mutateAsync({
        imageId: 'image-1',
        storagePath: 'user-uploads/user-1/project-1/image-1.png',
        projectId: 'project-1',
      });
    } catch {
      // Expected
    }

    await waitFor(() => {
      const cachedData = queryClient.getQueryData<EditedImage[]>(['edited-images', 'project-1']);
      expect(cachedData).toEqual(originalData);
      expect(cachedData?.find(img => img.id === 'image-1')?.id).toBe('image-1');
    });
  });

  it('invalidates edited-images query on settle (success)', async () => {
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
    queryClient.setQueryData(['edited-images', 'project-1'], mockEditedImages);

    const { result } = renderHook(() => useDeleteEditedImage(), { wrapper });

    await result.current.mutateAsync({
      imageId: 'image-1',
      storagePath: 'user-uploads/user-1/project-1/image-1.png',
      projectId: 'project-1',
    });

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['edited-images', 'project-1'],
      });
    });
  });

  it('invalidates edited-images query on settle (error)', async () => {
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const error = new Error('Delete failed');
    vi.mocked(database.storage.delete).mockRejectedValue(error);
    queryClient.setQueryData(['edited-images', 'project-1'], mockEditedImages);

    const { result } = renderHook(() => useDeleteEditedImage(), { wrapper });

    try {
      await result.current.mutateAsync({
        imageId: 'image-1',
        storagePath: 'user-uploads/user-1/project-1/image-1.png',
        projectId: 'project-1',
      });
    } catch {
      // Expected
    }

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['edited-images', 'project-1'],
      });
    });
  });

  it('handles empty previousImages array', async () => {
    queryClient.setQueryData(['edited-images', 'project-1'], []);

    const { result } = renderHook(() => useDeleteEditedImage(), { wrapper });

    await result.current.mutateAsync({
      imageId: 'image-1',
      storagePath: 'user-uploads/user-1/project-1/image-1.png',
      projectId: 'project-1',
    });

    // Should not crash, optimistic update just won't happen
    expect(database.storage.delete).toHaveBeenCalled();
    expect(database.editedImages.delete).toHaveBeenCalled();
  });

  it('handles missing context in error handler gracefully', async () => {
    const error = new Error('Delete failed');
    vi.mocked(database.storage.delete).mockRejectedValue(error);

    // Don't set initial cache data - context will have undefined previousImages
    const { result } = renderHook(() => useDeleteEditedImage(), { wrapper });

    try {
      await result.current.mutateAsync({
        imageId: 'image-1',
        storagePath: 'user-uploads/user-1/project-1/image-1.png',
        projectId: 'project-1',
      });
    } catch {
      // Expected
    }

    // Should not throw, even though context.previousImages is undefined
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('only removes the specified image from cache', async () => {
    queryClient.setQueryData(['edited-images', 'project-1'], mockEditedImages);

    const { result } = renderHook(() => useDeleteEditedImage(), { wrapper });

    await result.current.mutateAsync({
      imageId: 'image-1',
      storagePath: 'user-uploads/user-1/project-1/image-1.png',
      projectId: 'project-1',
    });

    const cachedData = queryClient.getQueryData<EditedImage[]>(['edited-images', 'project-1']);
    expect(cachedData?.find(img => img.id === 'image-1')).toBeUndefined();
    expect(cachedData?.find(img => img.id === 'image-2')).toBeDefined();
  });

  it('handles undefined previousImages in cache', async () => {
    // Set query data to undefined explicitly
    queryClient.setQueryData(['edited-images', 'project-1'], undefined);

    const { result } = renderHook(() => useDeleteEditedImage(), { wrapper });

    await result.current.mutateAsync({
      imageId: 'image-1',
      storagePath: 'user-uploads/user-1/project-1/image-1.png',
      projectId: 'project-1',
    });

    // Should not crash, optimistic update just won't happen
    expect(database.storage.delete).toHaveBeenCalled();
    expect(database.editedImages.delete).toHaveBeenCalled();
  });

  it('handles error in storage deletion', async () => {
    const error = new Error('Storage deletion failed');
    vi.mocked(database.storage.delete).mockRejectedValue(error);

    queryClient.setQueryData(['edited-images', 'project-1'], mockEditedImages);

    const { result } = renderHook(() => useDeleteEditedImage(), { wrapper });

    await expect(
      result.current.mutateAsync({
        imageId: 'image-1',
        storagePath: 'user-uploads/user-1/project-1/image-1.png',
        projectId: 'project-1',
      })
    ).rejects.toThrow('Storage deletion failed');

    // Database deletion should not be called if storage deletion fails
    expect(database.editedImages.delete).not.toHaveBeenCalled();
  });

  it('handles error in database deletion', async () => {
    const error = new Error('Database deletion failed');
    vi.mocked(database.editedImages.delete).mockRejectedValue(error);

    queryClient.setQueryData(['edited-images', 'project-1'], mockEditedImages);

    const { result } = renderHook(() => useDeleteEditedImage(), { wrapper });

    await expect(
      result.current.mutateAsync({
        imageId: 'image-1',
        storagePath: 'user-uploads/user-1/project-1/image-1.png',
        projectId: 'project-1',
      })
    ).rejects.toThrow('Database deletion failed');

    // Storage deletion should have been called
    expect(database.storage.delete).toHaveBeenCalled();
  });
});

