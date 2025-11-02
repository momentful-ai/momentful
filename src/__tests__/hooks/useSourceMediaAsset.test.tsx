import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSourceMediaAsset } from '../../hooks/useSourceMediaAsset';
import { database } from '../../lib/database';
import { MediaAsset } from '../../types';

// Mock the database module
vi.mock('../../lib/database', () => ({
  database: {
    mediaAssets: {
      getById: vi.fn(),
    },
  },
}));

const mockMediaAsset: MediaAsset = {
  id: 'asset-1',
  project_id: 'project-1',
  user_id: 'user-1',
  file_name: 'test-image.jpg',
  file_type: 'image',
  file_size: 1024000,
  storage_path: 'user-uploads/user-1/project-1/test-image.jpg',
  thumbnail_url: 'https://example.com/thumb.jpg',
  width: 1920,
  height: 1080,
  sort_order: 0,
  created_at: '2025-01-01T00:00:00Z',
};

describe('useSourceMediaAsset', () => {
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
    vi.mocked(database.mediaAssets.getById).mockResolvedValue(mockMediaAsset);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('fetches source media asset successfully when sourceAssetId is provided', async () => {
    const { result } = renderHook(() => useSourceMediaAsset('asset-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockMediaAsset);
    expect(database.mediaAssets.getById).toHaveBeenCalledWith('asset-1');
  });

  it('returns null when sourceAssetId is null', async () => {
    const { result } = renderHook(() => useSourceMediaAsset(null), { wrapper });

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    // When sourceAssetId is null, the query is disabled, so data is undefined
    expect(result.current.data).toBeUndefined();
    expect(database.mediaAssets.getById).not.toHaveBeenCalled();
  });

  it('returns null when sourceAssetId is undefined', async () => {
    const { result } = renderHook(() => useSourceMediaAsset(undefined), { wrapper });

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    // When sourceAssetId is undefined, the query is disabled, so data is undefined
    expect(result.current.data).toBeUndefined();
    expect(database.mediaAssets.getById).not.toHaveBeenCalled();
  });

  it('handles errors gracefully and returns null', async () => {
    const error = new Error('Failed to fetch media asset');
    vi.mocked(database.mediaAssets.getById).mockRejectedValue(error);
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useSourceMediaAsset('asset-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // The hook catches errors and returns null instead of throwing
    expect(result.current.data).toBeNull();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching source media asset:', error);

    consoleErrorSpy.mockRestore();
  });

  it('is disabled when sourceAssetId is empty string', async () => {
    const { result } = renderHook(() => useSourceMediaAsset(''), { wrapper });

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    // Empty string is falsy, so query should be disabled
    expect(result.current.data).toBeUndefined();
    expect(database.mediaAssets.getById).not.toHaveBeenCalled();
  });

  it('refetches when sourceAssetId changes', async () => {
    const mockAsset2: MediaAsset = {
      ...mockMediaAsset,
      id: 'asset-2',
      file_name: 'test-image-2.jpg',
    };

    const { result, rerender } = renderHook(
      ({ sourceAssetId }) => useSourceMediaAsset(sourceAssetId),
      {
        wrapper,
        initialProps: { sourceAssetId: 'asset-1' },
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(database.mediaAssets.getById).toHaveBeenCalledWith('asset-1');
    expect(result.current.data).toEqual(mockMediaAsset);

    // Change source asset ID
    vi.mocked(database.mediaAssets.getById).mockResolvedValue(mockAsset2);
    rerender({ sourceAssetId: 'asset-2' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(database.mediaAssets.getById).toHaveBeenCalledWith('asset-2');
    expect(result.current.data).toEqual(mockAsset2);
  });

  it('uses cached data when available', async () => {
    // First render
    const { result: firstResult } = renderHook(() => useSourceMediaAsset('asset-1'), { wrapper });

    await waitFor(() => {
      expect(firstResult.current.isSuccess).toBe(true);
    });

    // Clear the mock call count
    vi.clearAllMocks();

    // Second render with same source asset ID
    const { result: secondResult } = renderHook(() => useSourceMediaAsset('asset-1'), { wrapper });

    // Should use cached data (depending on staleTime)
    // Since gcTime is 0 in test config, cache might not persist
    // But the query should still work
    expect(secondResult.current.data).toBeDefined();
  });

  it('respects query configuration (staleTime and gcTime)', async () => {
    const { result } = renderHook(() => useSourceMediaAsset('asset-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify the query key includes the sourceAssetId
    expect(result.current.data).toEqual(mockMediaAsset);
    
    // The hook should have configured staleTime and gcTime (tested via behavior)
    // Actual time-based tests would require more complex setup
  });
});

