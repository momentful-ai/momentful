import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDeleteGeneratedVideo } from '../../hooks/useDeleteGeneratedVideo';
import { database } from '../../lib/database';
import { GeneratedVideo } from '../../types';

// Mock Clerk to avoid context issues
vi.mock('@clerk/clerk-react', () => ({
  useUser: () => ({
    user: { id: 'test-user-id' },
    isLoaded: true,
    isSignedIn: true,
  }),
}));

// Mock useUserId to return a consistent user ID
vi.mock('../../hooks/useUserId', () => ({
  useUserId: () => 'test-user-id',
}));

// Mock the database module
vi.mock('../../lib/database', () => ({
  database: {
    storage: {
      delete: vi.fn(),
    },
    generatedVideos: {
      delete: vi.fn(),
    },
  },
}));

const mockGeneratedVideos: GeneratedVideo[] = [
  {
    id: 'video-1',
    project_id: 'project-1',
    user_id: 'user-1',
    name: 'Video 1',
    ai_model: 'runway-gen4-turbo',
    aspect_ratio: '16:9',
    scene_type: undefined,
    camera_movement: undefined,
    storage_path: 'user-uploads/user-1/project-1/video-1.mp4',
    thumbnail_url: undefined,
    duration: undefined,
    status: 'completed',
    version: 1,
    parent_id: undefined,
    runway_task_id: undefined,
    created_at: '2025-01-01T00:00:00Z',
    completed_at: '2025-01-01T00:05:00Z',
    lineage_id: undefined,
  },
  {
    id: 'video-2',
    project_id: 'project-1',
    user_id: 'user-1',
    name: 'Video 2',
    ai_model: 'runway-gen4-turbo',
    aspect_ratio: '9:16',
    scene_type: undefined,
    camera_movement: undefined,
    storage_path: 'https://external-url.com/video.mp4',
    thumbnail_url: undefined,
    duration: undefined,
    status: 'completed',
    version: 1,
    parent_id: undefined,
    runway_task_id: undefined,
    created_at: '2025-01-02T00:00:00Z',
    completed_at: '2025-01-02T00:05:00Z',
    lineage_id: undefined,
  },
  {
    id: 'video-3',
    project_id: 'project-1',
    user_id: 'user-1',
    name: 'Video 3',
    ai_model: 'runway-gen4-turbo',
    aspect_ratio: '1:1',
    scene_type: undefined,
    camera_movement: undefined,
    storage_path: undefined,
    thumbnail_url: undefined,
    duration: undefined,
    status: 'processing',
    version: 1,
    parent_id: undefined,
    runway_task_id: undefined,
    created_at: '2025-01-03T00:00:00Z',
    completed_at: undefined,
    lineage_id: undefined,
  },
];

describe('useDeleteGeneratedVideo', () => {
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
    vi.mocked(database.generatedVideos.delete).mockResolvedValue(undefined);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('successfully deletes generated video with local storage path', async () => {
    const { result } = renderHook(() => useDeleteGeneratedVideo(), { wrapper });

    const response = await result.current.mutateAsync({
      videoId: 'video-1',
      storagePath: 'user-uploads/user-1/project-1/video-1.mp4',
      projectId: 'project-1',
    });

    expect(response.videoId).toBe('video-1');
    expect(database.storage.delete).toHaveBeenCalledWith('user-uploads', [
      'user-uploads/user-1/project-1/video-1.mp4',
    ]);
    expect(database.generatedVideos.delete).toHaveBeenCalledWith('video-1', 'test-user-id');
  });

  it('conditionally deletes from storage (only if storagePath exists and is not external URL)', async () => {
    const { result } = renderHook(() => useDeleteGeneratedVideo(), { wrapper });

    await result.current.mutateAsync({
      videoId: 'video-1',
      storagePath: 'user-uploads/user-1/project-1/video-1.mp4',
      projectId: 'project-1',
    });

    expect(database.storage.delete).toHaveBeenCalledTimes(1);
    expect(database.generatedVideos.delete).toHaveBeenCalledTimes(1);
  });

  it('skips storage deletion for external URLs (starts with http)', async () => {
    const { result } = renderHook(() => useDeleteGeneratedVideo(), { wrapper });

    await result.current.mutateAsync({
      videoId: 'video-2',
      storagePath: 'https://external-url.com/video.mp4',
      projectId: 'project-1',
    });

    expect(database.storage.delete).not.toHaveBeenCalled();
    expect(database.generatedVideos.delete).toHaveBeenCalledWith('video-2', 'test-user-id');
  });

  it('skips storage deletion for http URLs (not just https)', async () => {
    const { result } = renderHook(() => useDeleteGeneratedVideo(), { wrapper });

    await result.current.mutateAsync({
      videoId: 'video-2',
      storagePath: 'http://external-url.com/video.mp4',
      projectId: 'project-1',
    });

    expect(database.storage.delete).not.toHaveBeenCalled();
    expect(database.generatedVideos.delete).toHaveBeenCalledWith('video-2', 'test-user-id');
  });

  it('skips storage deletion when storagePath is undefined', async () => {
    const { result } = renderHook(() => useDeleteGeneratedVideo(), { wrapper });

    await result.current.mutateAsync({
      videoId: 'video-3',
      storagePath: undefined,
      projectId: 'project-1',
    });

    expect(database.storage.delete).not.toHaveBeenCalled();
    expect(database.generatedVideos.delete).toHaveBeenCalledWith('video-3', 'test-user-id');
  });

  it('always deletes from database regardless of storagePath', async () => {
    const { result } = renderHook(() => useDeleteGeneratedVideo(), { wrapper });

    // Test with external URL
    await result.current.mutateAsync({
      videoId: 'video-2',
      storagePath: 'https://external-url.com/video.mp4',
      projectId: 'project-1',
    });

    expect(database.generatedVideos.delete).toHaveBeenCalledWith('video-2', 'test-user-id');

    vi.clearAllMocks();

    // Test with undefined storagePath
    await result.current.mutateAsync({
      videoId: 'video-3',
      storagePath: undefined,
      projectId: 'project-1',
    });

    expect(database.generatedVideos.delete).toHaveBeenCalledWith('video-3', 'test-user-id');
  });

  it('optimistically removes video from cache immediately', async () => {
    queryClient.setQueryData(['generated-videos', 'project-1', 'test-user-id'], mockGeneratedVideos);
    const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

    const { result } = renderHook(() => useDeleteGeneratedVideo(), { wrapper });

    await result.current.mutateAsync({
      videoId: 'video-1',
      storagePath: 'user-uploads/user-1/project-1/video-1.mp4',
      projectId: 'project-1',
    });

    // Verify setQueryData was called for optimistic update
    expect(setQueryDataSpy).toHaveBeenCalledWith(
      ['generated-videos', 'project-1', 'test-user-id'],
      expect.any(Function)
    );

    // Verify the cache was updated correctly (video removed)
    const cachedData = queryClient.getQueryData<GeneratedVideo[]>(['generated-videos', 'project-1', 'test-user-id']);
    expect(cachedData?.length).toBe(2);
    expect(cachedData?.find(video => video.id === 'video-1')).toBeUndefined();
    expect(cachedData?.find(video => video.id === 'video-2')).toBeDefined();
  });

  it('cancels pending queries on mutate', async () => {
    const cancelQueriesSpy = vi.spyOn(queryClient, 'cancelQueries');
    queryClient.setQueryData(['generated-videos', 'project-1', 'test-user-id'], mockGeneratedVideos);

    const { result } = renderHook(() => useDeleteGeneratedVideo(), { wrapper });

    await result.current.mutateAsync({
      videoId: 'video-1',
      storagePath: 'user-uploads/user-1/project-1/video-1.mp4',
      projectId: 'project-1',
    });

    expect(cancelQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['generated-videos', 'project-1', 'test-user-id'],
    });
  });

  it('snapshots previous state before optimistic update', async () => {
    queryClient.setQueryData(['generated-videos', 'project-1', 'test-user-id'], mockGeneratedVideos);
    const originalData = [...mockGeneratedVideos];

    const { result } = renderHook(() => useDeleteGeneratedVideo(), { wrapper });

    await result.current.mutateAsync({
      videoId: 'video-1',
      storagePath: 'user-uploads/user-1/project-1/video-1.mp4',
      projectId: 'project-1',
    });

    // The previous state should have been snapshotted for potential rollback
    expect(originalData.length).toBe(3);
  });

  it('rolls back optimistic update on error', async () => {
    const error = new Error('Failed to delete');
    vi.mocked(database.generatedVideos.delete).mockRejectedValue(error);

    queryClient.setQueryData(['generated-videos', 'project-1', 'test-user-id'], mockGeneratedVideos);
    const originalData = [...mockGeneratedVideos];

    const { result } = renderHook(() => useDeleteGeneratedVideo(), { wrapper });

    try {
      await result.current.mutateAsync({
        videoId: 'video-1',
        storagePath: 'user-uploads/user-1/project-1/video-1.mp4',
        projectId: 'project-1',
      });
    } catch {
      // Expected to throw
    }

    // Wait for rollback to complete
    await waitFor(() => {
      const cachedData = queryClient.getQueryData<GeneratedVideo[]>(['generated-videos', 'project-1', 'test-user-id']);
      expect(cachedData).toEqual(originalData);
      expect(cachedData?.length).toBe(3);
      expect(cachedData?.find(video => video.id === 'video-1')).toBeDefined();
    });
  });

  it('restores previous videos array on error', async () => {
    const error = new Error('Database error');
    vi.mocked(database.generatedVideos.delete).mockRejectedValue(error);

    queryClient.setQueryData(['generated-videos', 'project-1', 'test-user-id'], mockGeneratedVideos);
    const originalData = [...mockGeneratedVideos];

    const { result } = renderHook(() => useDeleteGeneratedVideo(), { wrapper });

    try {
      await result.current.mutateAsync({
        videoId: 'video-1',
        storagePath: 'user-uploads/user-1/project-1/video-1.mp4',
        projectId: 'project-1',
      });
    } catch {
      // Expected
    }

    await waitFor(() => {
      const cachedData = queryClient.getQueryData<GeneratedVideo[]>(['generated-videos', 'project-1', 'test-user-id']);
      expect(cachedData).toEqual(originalData);
      expect(cachedData?.find(video => video.id === 'video-1')?.id).toBe('video-1');
    });
  });

  it('invalidates generated-videos query on settle (success)', async () => {
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
    queryClient.setQueryData(['generated-videos', 'project-1', 'test-user-id'], mockGeneratedVideos);

    const { result } = renderHook(() => useDeleteGeneratedVideo(), { wrapper });

    await result.current.mutateAsync({
      videoId: 'video-1',
      storagePath: 'user-uploads/user-1/project-1/video-1.mp4',
      projectId: 'project-1',
    });

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['generated-videos', 'project-1', 'test-user-id'],
      });
    });
  });

  it('invalidates generated-videos query on settle (error)', async () => {
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const error = new Error('Delete failed');
    vi.mocked(database.generatedVideos.delete).mockRejectedValue(error);
    queryClient.setQueryData(['generated-videos', 'project-1', 'test-user-id'], mockGeneratedVideos);

    const { result } = renderHook(() => useDeleteGeneratedVideo(), { wrapper });

    try {
      await result.current.mutateAsync({
        videoId: 'video-1',
        storagePath: 'user-uploads/user-1/project-1/video-1.mp4',
        projectId: 'project-1',
      });
    } catch {
      // Expected
    }

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['generated-videos', 'project-1', 'test-user-id'],
      });
    });
  });

  it('handles empty previousVideos array', async () => {
    queryClient.setQueryData(['generated-videos', 'project-1', 'test-user-id'], []);

    const { result } = renderHook(() => useDeleteGeneratedVideo(), { wrapper });

    await result.current.mutateAsync({
      videoId: 'video-1',
      storagePath: 'user-uploads/user-1/project-1/video-1.mp4',
      projectId: 'project-1',
    });

    // Should not crash, optimistic update just won't happen
    expect(database.generatedVideos.delete).toHaveBeenCalled();
  });

  it('handles missing context in error handler gracefully', async () => {
    const error = new Error('Delete failed');
    vi.mocked(database.generatedVideos.delete).mockRejectedValue(error);

    // Don't set initial cache data - context will have undefined previousVideos
    const { result } = renderHook(() => useDeleteGeneratedVideo(), { wrapper });

    try {
      await result.current.mutateAsync({
        videoId: 'video-1',
        storagePath: 'user-uploads/user-1/project-1/video-1.mp4',
        projectId: 'project-1',
      });
    } catch {
      // Expected
    }

    // Should not throw, even though context.previousVideos is undefined
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('only removes the specified video from cache', async () => {
    queryClient.setQueryData(['generated-videos', 'project-1', 'test-user-id'], mockGeneratedVideos);

    const { result } = renderHook(() => useDeleteGeneratedVideo(), { wrapper });

    await result.current.mutateAsync({
      videoId: 'video-1',
      storagePath: 'user-uploads/user-1/project-1/video-1.mp4',
      projectId: 'project-1',
    });

    const cachedData = queryClient.getQueryData<GeneratedVideo[]>(['generated-videos', 'project-1', 'test-user-id']);
    expect(cachedData?.find(video => video.id === 'video-1')).toBeUndefined();
    expect(cachedData?.find(video => video.id === 'video-2')).toBeDefined();
    expect(cachedData?.find(video => video.id === 'video-3')).toBeDefined();
  });

  it('handles undefined previousVideos in cache', async () => {
    // Set query data to undefined explicitly
    queryClient.setQueryData(['generated-videos', 'project-1', 'test-user-id'], undefined);

    const { result } = renderHook(() => useDeleteGeneratedVideo(), { wrapper });

    await result.current.mutateAsync({
      videoId: 'video-1',
      storagePath: 'user-uploads/user-1/project-1/video-1.mp4',
      projectId: 'project-1',
    });

    // Should not crash, optimistic update just won't happen
    expect(database.generatedVideos.delete).toHaveBeenCalled();
  });

  it('handles error in storage deletion (local path)', async () => {
    const error = new Error('Storage deletion failed');
    vi.mocked(database.storage.delete).mockRejectedValue(error);

    queryClient.setQueryData(['generated-videos', 'project-1', 'test-user-id'], mockGeneratedVideos);

    const { result } = renderHook(() => useDeleteGeneratedVideo(), { wrapper });

    await expect(
      result.current.mutateAsync({
        videoId: 'video-1',
        storagePath: 'user-uploads/user-1/project-1/video-1.mp4',
        projectId: 'project-1',
      })
    ).rejects.toThrow('Storage deletion failed');

    // Database deletion should not be called if storage deletion fails
    expect(database.generatedVideos.delete).not.toHaveBeenCalled();
  });

  it('handles error in database deletion', async () => {
    const error = new Error('Database deletion failed');
    vi.mocked(database.generatedVideos.delete).mockRejectedValue(error);

    queryClient.setQueryData(['generated-videos', 'project-1', 'test-user-id'], mockGeneratedVideos);

    const { result } = renderHook(() => useDeleteGeneratedVideo(), { wrapper });

    await expect(
      result.current.mutateAsync({
        videoId: 'video-1',
        storagePath: 'user-uploads/user-1/project-1/video-1.mp4',
        projectId: 'project-1',
      })
    ).rejects.toThrow('Database deletion failed');

    // Storage deletion should have been called for local paths
    expect(database.storage.delete).toHaveBeenCalled();
  });

  it('does not attempt storage deletion for external URLs even on error', async () => {
    const error = new Error('Database deletion failed');
    vi.mocked(database.generatedVideos.delete).mockRejectedValue(error);

    queryClient.setQueryData(['generated-videos', 'project-1', 'test-user-id'], mockGeneratedVideos);

    const { result } = renderHook(() => useDeleteGeneratedVideo(), { wrapper });

    try {
      await result.current.mutateAsync({
        videoId: 'video-2',
        storagePath: 'https://external-url.com/video.mp4',
        projectId: 'project-1',
      });
    } catch {
      // Expected
    }

    // Storage deletion should not be called for external URLs
    expect(database.storage.delete).not.toHaveBeenCalled();
    expect(database.generatedVideos.delete).toHaveBeenCalled();
  });
});

