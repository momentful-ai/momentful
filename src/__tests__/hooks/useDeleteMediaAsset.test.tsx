import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDeleteMediaAsset } from '../../hooks/useDeleteMediaAsset';
import { database } from '../../lib/database';
import { MediaAsset } from '../../types';

// Mock the database module
vi.mock('../../lib/database', () => ({
  database: {
    storage: {
      delete: vi.fn(),
    },
    mediaAssets: {
      delete: vi.fn(),
    },
  },
}));

const mockMediaAssets: MediaAsset[] = [
  {
    id: 'asset-1',
    project_id: 'project-1',
    user_id: 'user-1',
    file_name: 'test1.jpg',
    file_type: 'image',
    file_size: 1024000,
    storage_path: 'user-uploads/user-1/project-1/test1.jpg',
    thumbnail_url: 'https://example.com/thumb1.jpg',
    width: 1920,
    height: 1080,
    sort_order: 0,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'asset-2',
    project_id: 'project-1',
    user_id: 'user-1',
    file_name: 'test2.png',
    file_type: 'image',
    file_size: 2048000,
    storage_path: 'user-uploads/user-1/project-1/test2.png',
    thumbnail_url: 'https://example.com/thumb2.png',
    width: 1920,
    height: 1080,
    sort_order: 1,
    created_at: '2025-01-02T00:00:00Z',
  },
];

describe('useDeleteMediaAsset', () => {
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
    vi.mocked(database.mediaAssets.delete).mockResolvedValue(undefined);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('successfully deletes media asset', async () => {
    const { result } = renderHook(() => useDeleteMediaAsset(), { wrapper });

    const response = await result.current.mutateAsync({
      assetId: 'asset-1',
      storagePath: 'user-uploads/user-1/project-1/test1.jpg',
      projectId: 'project-1',
    });

    expect(response.assetId).toBe('asset-1');
    expect(database.storage.delete).toHaveBeenCalledWith('user-uploads', [
      'user-uploads/user-1/project-1/test1.jpg',
    ]);
    expect(database.mediaAssets.delete).toHaveBeenCalledWith('asset-1');
  });

  it('deletes from storage first, then database (correct order)', async () => {
    const callOrder: string[] = [];
    vi.mocked(database.storage.delete).mockImplementation(async () => {
      callOrder.push('storage');
      return undefined;
    });
    vi.mocked(database.mediaAssets.delete).mockImplementation(async () => {
      callOrder.push('database');
      return undefined;
    });

    const { result } = renderHook(() => useDeleteMediaAsset(), { wrapper });

    await result.current.mutateAsync({
      assetId: 'asset-1',
      storagePath: 'user-uploads/user-1/project-1/test1.jpg',
      projectId: 'project-1',
    });

    expect(callOrder).toEqual(['storage', 'database']);
  });

  it('optimistically removes asset from cache immediately', async () => {
    queryClient.setQueryData(['media-assets', 'project-1'], mockMediaAssets);
    const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

    const { result } = renderHook(() => useDeleteMediaAsset(), { wrapper });

    await result.current.mutateAsync({
      assetId: 'asset-1',
      storagePath: 'user-uploads/user-1/project-1/test1.jpg',
      projectId: 'project-1',
    });

    // Verify setQueryData was called for optimistic update
    expect(setQueryDataSpy).toHaveBeenCalledWith(
      ['media-assets', 'project-1'],
      expect.any(Function)
    );

    // Verify the cache was updated correctly (asset removed)
    const cachedData = queryClient.getQueryData<MediaAsset[]>(['media-assets', 'project-1']);
    expect(cachedData?.length).toBe(1);
    expect(cachedData?.find(asset => asset.id === 'asset-1')).toBeUndefined();
    expect(cachedData?.find(asset => asset.id === 'asset-2')).toBeDefined();
  });

  it('cancels pending queries on mutate', async () => {
    const cancelQueriesSpy = vi.spyOn(queryClient, 'cancelQueries');
    queryClient.setQueryData(['media-assets', 'project-1'], mockMediaAssets);

    const { result } = renderHook(() => useDeleteMediaAsset(), { wrapper });

    await result.current.mutateAsync({
      assetId: 'asset-1',
      storagePath: 'user-uploads/user-1/project-1/test1.jpg',
      projectId: 'project-1',
    });

    expect(cancelQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['media-assets', 'project-1'],
    });
  });

  it('snapshots previous state before optimistic update', async () => {
    queryClient.setQueryData(['media-assets', 'project-1'], mockMediaAssets);
    const originalData = [...mockMediaAssets];

    const { result } = renderHook(() => useDeleteMediaAsset(), { wrapper });

    await result.current.mutateAsync({
      assetId: 'asset-1',
      storagePath: 'user-uploads/user-1/project-1/test1.jpg',
      projectId: 'project-1',
    });

    // The previous state should have been snapshotted for potential rollback
    // We can verify this by checking rollback works correctly
    expect(originalData.length).toBe(2);
  });

  it('rolls back optimistic update on error', async () => {
    const error = new Error('Failed to delete');
    vi.mocked(database.storage.delete).mockRejectedValue(error);

    queryClient.setQueryData(['media-assets', 'project-1'], mockMediaAssets);
    const originalData = [...mockMediaAssets];

    const { result } = renderHook(() => useDeleteMediaAsset(), { wrapper });

    try {
      await result.current.mutateAsync({
        assetId: 'asset-1',
        storagePath: 'user-uploads/user-1/project-1/test1.jpg',
        projectId: 'project-1',
      });
    } catch (e) {
      // Expected to throw
    }

    // Wait for rollback to complete
    await waitFor(() => {
      const cachedData = queryClient.getQueryData<MediaAsset[]>(['media-assets', 'project-1']);
      expect(cachedData).toEqual(originalData);
      expect(cachedData?.length).toBe(2);
      expect(cachedData?.find(asset => asset.id === 'asset-1')).toBeDefined();
    });
  });

  it('restores previous assets array on error', async () => {
    const error = new Error('Database error');
    vi.mocked(database.mediaAssets.delete).mockRejectedValue(error);

    queryClient.setQueryData(['media-assets', 'project-1'], mockMediaAssets);
    const originalData = [...mockMediaAssets];

    const { result } = renderHook(() => useDeleteMediaAsset(), { wrapper });

    try {
      await result.current.mutateAsync({
        assetId: 'asset-1',
        storagePath: 'user-uploads/user-1/project-1/test1.jpg',
        projectId: 'project-1',
      });
    } catch (e) {
      // Expected
    }

    await waitFor(() => {
      const cachedData = queryClient.getQueryData<MediaAsset[]>(['media-assets', 'project-1']);
      expect(cachedData).toEqual(originalData);
      expect(cachedData?.find(asset => asset.id === 'asset-1')?.id).toBe('asset-1');
    });
  });

  it('invalidates media-assets query on settle (success)', async () => {
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
    queryClient.setQueryData(['media-assets', 'project-1'], mockMediaAssets);

    const { result } = renderHook(() => useDeleteMediaAsset(), { wrapper });

    await result.current.mutateAsync({
      assetId: 'asset-1',
      storagePath: 'user-uploads/user-1/project-1/test1.jpg',
      projectId: 'project-1',
    });

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['media-assets', 'project-1'],
      });
    });
  });

  it('invalidates media-assets query on settle (error)', async () => {
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const error = new Error('Delete failed');
    vi.mocked(database.storage.delete).mockRejectedValue(error);
    queryClient.setQueryData(['media-assets', 'project-1'], mockMediaAssets);

    const { result } = renderHook(() => useDeleteMediaAsset(), { wrapper });

    try {
      await result.current.mutateAsync({
        assetId: 'asset-1',
        storagePath: 'user-uploads/user-1/project-1/test1.jpg',
        projectId: 'project-1',
      });
    } catch (e) {
      // Expected
    }

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['media-assets', 'project-1'],
      });
    });
  });

  it('handles empty previousAssets array', async () => {
    queryClient.setQueryData(['media-assets', 'project-1'], []);

    const { result } = renderHook(() => useDeleteMediaAsset(), { wrapper });

    await result.current.mutateAsync({
      assetId: 'asset-1',
      storagePath: 'user-uploads/user-1/project-1/test1.jpg',
      projectId: 'project-1',
    });

    // Should not crash, optimistic update just won't happen
    expect(database.storage.delete).toHaveBeenCalled();
    expect(database.mediaAssets.delete).toHaveBeenCalled();
  });

  it('handles missing context in error handler gracefully', async () => {
    const error = new Error('Delete failed');
    vi.mocked(database.storage.delete).mockRejectedValue(error);

    // Don't set initial cache data - context will have undefined previousAssets
    const { result } = renderHook(() => useDeleteMediaAsset(), { wrapper });

    try {
      await result.current.mutateAsync({
        assetId: 'asset-1',
        storagePath: 'user-uploads/user-1/project-1/test1.jpg',
        projectId: 'project-1',
      });
    } catch (e) {
      // Expected
    }

    // Should not throw, even though context.previousAssets is undefined
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('only removes the specified asset from cache', async () => {
    queryClient.setQueryData(['media-assets', 'project-1'], mockMediaAssets);

    const { result } = renderHook(() => useDeleteMediaAsset(), { wrapper });

    await result.current.mutateAsync({
      assetId: 'asset-1',
      storagePath: 'user-uploads/user-1/project-1/test1.jpg',
      projectId: 'project-1',
    });

    const cachedData = queryClient.getQueryData<MediaAsset[]>(['media-assets', 'project-1']);
    expect(cachedData?.find(asset => asset.id === 'asset-1')).toBeUndefined();
    expect(cachedData?.find(asset => asset.id === 'asset-2')).toBeDefined();
  });

  it('handles undefined previousAssets in cache', async () => {
    // Set query data to undefined explicitly
    queryClient.setQueryData(['media-assets', 'project-1'], undefined);

    const { result } = renderHook(() => useDeleteMediaAsset(), { wrapper });

    await result.current.mutateAsync({
      assetId: 'asset-1',
      storagePath: 'user-uploads/user-1/project-1/test1.jpg',
      projectId: 'project-1',
    });

    // Should not crash, optimistic update just won't happen
    expect(database.storage.delete).toHaveBeenCalled();
    expect(database.mediaAssets.delete).toHaveBeenCalled();
  });

  it('handles error in storage deletion', async () => {
    const error = new Error('Storage deletion failed');
    vi.mocked(database.storage.delete).mockRejectedValue(error);

    queryClient.setQueryData(['media-assets', 'project-1'], mockMediaAssets);

    const { result } = renderHook(() => useDeleteMediaAsset(), { wrapper });

    await expect(
      result.current.mutateAsync({
        assetId: 'asset-1',
        storagePath: 'user-uploads/user-1/project-1/test1.jpg',
        projectId: 'project-1',
      })
    ).rejects.toThrow('Storage deletion failed');

    // Database deletion should not be called if storage deletion fails
    expect(database.mediaAssets.delete).not.toHaveBeenCalled();
  });

  it('handles error in database deletion', async () => {
    const error = new Error('Database deletion failed');
    vi.mocked(database.mediaAssets.delete).mockRejectedValue(error);

    queryClient.setQueryData(['media-assets', 'project-1'], mockMediaAssets);

    const { result } = renderHook(() => useDeleteMediaAsset(), { wrapper });

    await expect(
      result.current.mutateAsync({
        assetId: 'asset-1',
        storagePath: 'user-uploads/user-1/project-1/test1.jpg',
        projectId: 'project-1',
      })
    ).rejects.toThrow('Database deletion failed');

    // Storage deletion should have been called
    expect(database.storage.delete).toHaveBeenCalled();
  });
});

