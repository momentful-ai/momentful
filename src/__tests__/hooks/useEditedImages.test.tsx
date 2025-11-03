import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEditedImages } from '../../hooks/useEditedImages';
import { database } from '../../lib/database';
import { EditedImage } from '../../types';

// Mock the database module
vi.mock('../../lib/database', () => ({
  database: {
    editedImages: {
      list: vi.fn(),
    },
  },
}));

const mockEditedImages: EditedImage[] = [
  {
    id: 'edited-1',
    project_id: 'project-1',
    user_id: 'user-1',
    prompt: 'Test prompt',
    context: {},
    ai_model: 'runway-gen4-turbo',
    storage_path: 'user-uploads/user-1/project-1/edited-1.png',
    edited_url: 'https://example.com/user-uploads/user-1/project-1/edited-1.png',
    width: 1920,
      height: 1080,
      version: 1,
      parent_id: undefined,
      created_at: '2025-10-20T15:59:30.165+00:00',
  },
];

describe('useEditedImages', () => {
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
    vi.mocked(database.editedImages.list).mockResolvedValue(mockEditedImages);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('fetches edited images successfully', async () => {
    const { result } = renderHook(() => useEditedImages('project-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockEditedImages);
    expect(database.editedImages.list).toHaveBeenCalledWith('project-1');
  });

  it('returns empty array when query is disabled', async () => {
    const { result } = renderHook(
      () => useEditedImages('project-1', { enabled: false }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    expect(result.current.data).toBeUndefined();
    expect(database.editedImages.list).not.toHaveBeenCalled();
  });

  it('handles errors gracefully', async () => {
    const error = new Error('Failed to fetch');
    vi.mocked(database.editedImages.list).mockRejectedValue(error);

    const { result } = renderHook(() => useEditedImages('project-1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });

  it('uses cached data when available', async () => {
    // First render
    const { result: firstResult } = renderHook(
      () => useEditedImages('project-1'),
      { wrapper }
    );

    await waitFor(() => {
      expect(firstResult.current.isSuccess).toBe(true);
    });

    // Clear the mock call count
    vi.clearAllMocks();

    // Second render with same project ID
    const { result: secondResult } = renderHook(
      () => useEditedImages('project-1'),
      { wrapper }
    );

    // Should use cached data (won't fetch again if data is fresh)
    expect(secondResult.current.data).toEqual(mockEditedImages);
  });

  it('refetches when enabled changes from false to true', async () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useEditedImages('project-1', { enabled }),
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

    expect(database.editedImages.list).toHaveBeenCalledWith('project-1');
    expect(result.current.data).toEqual(mockEditedImages);
  });
});


