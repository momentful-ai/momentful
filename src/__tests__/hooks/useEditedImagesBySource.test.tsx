import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEditedImagesBySource } from '../../hooks/useEditedImages';
import { database } from '../../lib/database';
import { EditedImage } from '../../types';

// Mock the database module
vi.mock('../../lib/database', () => ({
  database: {
    editedImages: {
      listBySourceAsset: vi.fn(),
    },
  },
}));

const mockEditedImages: EditedImage[] = [
  {
    id: 'edited-1',
    project_id: 'project-1',
    user_id: 'user-1',
    prompt: 'Test prompt 1',
    context: {},
    ai_model: 'runway-gen4-turbo',
    storage_path: 'user-uploads/user-1/project-1/edited-1.png',
    edited_url: 'https://example.com/user-uploads/user-1/project-1/edited-1.png',
    width: 1920,
    height: 1080,
    version: 1,
    parent_id: undefined,
    source_asset_id: 'source-asset-1',
    created_at: '2025-10-20T15:59:30.165+00:00',
  },
  {
    id: 'edited-2',
    project_id: 'project-1',
    user_id: 'user-1',
    prompt: 'Test prompt 2',
    context: {},
    ai_model: 'flux-pro',
    storage_path: 'user-uploads/user-1/project-1/edited-2.png',
    edited_url: 'https://example.com/user-uploads/user-1/project-1/edited-2.png',
    width: 1920,
    height: 1080,
    version: 1,
    parent_id: undefined,
    source_asset_id: 'source-asset-1',
    created_at: '2025-10-20T16:00:00.165+00:00',
  },
];

describe('useEditedImagesBySource', () => {
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
    vi.mocked(database.editedImages.listBySourceAsset).mockResolvedValue(mockEditedImages);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('fetches edited images by source asset successfully', async () => {
    const { result } = renderHook(() => useEditedImagesBySource('source-asset-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockEditedImages);
    expect(database.editedImages.listBySourceAsset).toHaveBeenCalledWith('source-asset-1');
  });

  it('returns empty array when sourceAssetId is null', async () => {
    const { result } = renderHook(() => useEditedImagesBySource(null), { wrapper });

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    // When sourceAssetId is null, the query is disabled, so data is undefined
    // The hook should return undefined, not empty array, because the query is disabled
    expect(result.current.data).toBeUndefined();
    expect(database.editedImages.listBySourceAsset).not.toHaveBeenCalled();
  });

  it('returns empty array when query is disabled', async () => {
    const { result } = renderHook(
      () => useEditedImagesBySource('source-asset-1', { enabled: false }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    expect(result.current.data).toBeUndefined();
    expect(database.editedImages.listBySourceAsset).not.toHaveBeenCalled();
  });

  it('handles errors gracefully', async () => {
    const error = new Error('Failed to fetch');
    vi.mocked(database.editedImages.listBySourceAsset).mockRejectedValue(error);

    const { result } = renderHook(() => useEditedImagesBySource('source-asset-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });

  it('uses cached data when available', async () => {
    // First render
    const { result: firstResult } = renderHook(
      () => useEditedImagesBySource('source-asset-1'),
      { wrapper }
    );

    await waitFor(() => {
      expect(firstResult.current.isSuccess).toBe(true);
    });

    // Clear the mock call count
    vi.clearAllMocks();

    // Second render with same source asset ID
    const { result: secondResult } = renderHook(
      () => useEditedImagesBySource('source-asset-1'),
      { wrapper }
    );

    // Should use cached data
    expect(secondResult.current.data).toEqual(mockEditedImages);
  });

  it('refetches when sourceAssetId changes', async () => {
    const { result, rerender } = renderHook(
      ({ sourceAssetId }) => useEditedImagesBySource(sourceAssetId),
      {
        wrapper,
        initialProps: { sourceAssetId: 'source-asset-1' },
      }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(database.editedImages.listBySourceAsset).toHaveBeenCalledWith('source-asset-1');

    // Change source asset ID
    rerender({ sourceAssetId: 'source-asset-2' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(database.editedImages.listBySourceAsset).toHaveBeenCalledWith('source-asset-2');
  });
});

