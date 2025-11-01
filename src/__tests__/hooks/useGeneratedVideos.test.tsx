import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useGeneratedVideos } from '../../hooks/useGeneratedVideos';
import { database } from '../../lib/database';
import { GeneratedVideo } from '../../types';

// Mock the database module
vi.mock('../../lib/database', () => ({
  database: {
    generatedVideos: {
      list: vi.fn(),
    },
  },
}));

const mockGeneratedVideos: GeneratedVideo[] = [
  {
    id: 'video-1',
    project_id: 'project-1',
    user_id: 'user-1',
    name: 'Test Video',
    ai_model: 'runway-gen2',
    aspect_ratio: '16:9',
    scene_type: 'product-showcase',
    camera_movement: 'static',
    storage_path: 'https://example.com/video.mp4',
    thumbnail_url: undefined,
    duration: 30,
    status: 'completed',
    version: 1,
    parent_id: undefined,
    runway_task_id: 'task-123',
    created_at: '2025-10-20T15:59:30.165+00:00',
    completed_at: '2025-10-20T15:59:30.166+00:00',
  },
];

describe('useGeneratedVideos', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
    vi.clearAllMocks();
    vi.mocked(database.generatedVideos.list).mockResolvedValue(mockGeneratedVideos);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('fetches generated videos successfully', async () => {
    const { result } = renderHook(() => useGeneratedVideos('project-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockGeneratedVideos);
    expect(database.generatedVideos.list).toHaveBeenCalledWith('project-1');
  });

  it('returns empty array when query is disabled', async () => {
    const { result } = renderHook(
      () => useGeneratedVideos('project-1', { enabled: false }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    expect(result.current.data).toBeUndefined();
    expect(database.generatedVideos.list).not.toHaveBeenCalled();
  });

  it('handles errors gracefully', async () => {
    const error = new Error('Failed to fetch');
    vi.mocked(database.generatedVideos.list).mockRejectedValue(error);

    const { result } = renderHook(() => useGeneratedVideos('project-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });

  it('uses cached data when available', async () => {
    // First render
    const { result: firstResult } = renderHook(
      () => useGeneratedVideos('project-1'),
      { wrapper }
    );

    await waitFor(() => {
      expect(firstResult.current.isSuccess).toBe(true);
    });

    // Clear the mock call count
    vi.clearAllMocks();

    // Second render with same project ID
    const { result: secondResult } = renderHook(
      () => useGeneratedVideos('project-1'),
      { wrapper }
    );

    // Should use cached data
    expect(secondResult.current.data).toEqual(mockGeneratedVideos);
  });

  it('refetches when enabled changes from false to true', async () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useGeneratedVideos('project-1', { enabled }),
      {
        wrapper,
        initialProps: { enabled: false },
      }
    );

    expect(result.current.data).toBeUndefined();

    rerender({ enabled: true });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(database.generatedVideos.list).toHaveBeenCalledWith('project-1');
    expect(result.current.data).toEqual(mockGeneratedVideos);
  });
});


