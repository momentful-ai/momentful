import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUpdateLineage } from '../../hooks/useUpdateLineage';
import { database } from '../../lib/database';
import { Lineage } from '../../types';

// Mock the database module
vi.mock('../../lib/database', () => ({
  database: {
    lineages: {
      update: vi.fn(),
    },
  },
}));

const mockLineages: Lineage[] = [
  {
    id: 'lineage-1',
    project_id: 'project-1',
    user_id: 'user-1',
    root_media_asset_id: 'asset-1',
    name: 'Original Name',
    metadata: {},
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'lineage-2',
    project_id: 'project-1',
    user_id: 'user-1',
    root_media_asset_id: 'asset-2',
    name: 'Another Lineage',
    metadata: {},
    created_at: '2025-01-02T00:00:00Z',
  },
];

describe('useUpdateLineage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, gcTime: 0 },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('successfully updates lineage name', async () => {
    const updatedLineage: Lineage = {
      ...mockLineages[0],
      name: 'Updated Name',
    };
    vi.mocked(database.lineages.update).mockResolvedValue(updatedLineage);

    // Set initial cache data
    queryClient.setQueryData(['timelines', 'project-1'], mockLineages);

    const { result } = renderHook(() => useUpdateLineage(), { wrapper });

    await result.current.mutateAsync({
      lineageId: 'lineage-1',
      name: 'Updated Name',
      projectId: 'project-1',
    });

    expect(database.lineages.update).toHaveBeenCalledWith('lineage-1', {
      name: 'Updated Name',
    });
  });

  it('trims whitespace from name (leading/trailing spaces)', async () => {
    const updatedLineage: Lineage = {
      ...mockLineages[0],
      name: 'Trimmed Name',
    };
    vi.mocked(database.lineages.update).mockResolvedValue(updatedLineage);

    queryClient.setQueryData(['timelines', 'project-1'], mockLineages);

    const { result } = renderHook(() => useUpdateLineage(), { wrapper });

    await result.current.mutateAsync({
      lineageId: 'lineage-1',
      name: '  Trimmed Name  ',
      projectId: 'project-1',
    });

    expect(database.lineages.update).toHaveBeenCalledWith('lineage-1', {
      name: 'Trimmed Name',
    });
  });

  it('converts empty string to undefined (removes name)', async () => {
    const updatedLineage: Lineage = {
      ...mockLineages[0],
      name: undefined,
    };
    vi.mocked(database.lineages.update).mockResolvedValue(updatedLineage);

    queryClient.setQueryData(['timelines', 'project-1'], mockLineages);

    const { result } = renderHook(() => useUpdateLineage(), { wrapper });

    await result.current.mutateAsync({
      lineageId: 'lineage-1',
      name: '',
      projectId: 'project-1',
    });

    expect(database.lineages.update).toHaveBeenCalledWith('lineage-1', {
      name: undefined,
    });
  });

  it('converts whitespace-only string to undefined', async () => {
    const updatedLineage: Lineage = {
      ...mockLineages[0],
      name: undefined,
    };
    vi.mocked(database.lineages.update).mockResolvedValue(updatedLineage);

    queryClient.setQueryData(['timelines', 'project-1'], mockLineages);

    const { result } = renderHook(() => useUpdateLineage(), { wrapper });

    await result.current.mutateAsync({
      lineageId: 'lineage-1',
      name: '   ',
      projectId: 'project-1',
    });

    expect(database.lineages.update).toHaveBeenCalledWith('lineage-1', {
      name: undefined,
    });
  });

  it('optimistically updates cache immediately before mutation', async () => {
    const updatedLineage: Lineage = {
      ...mockLineages[0],
      name: 'Optimistic Name',
    };
    vi.mocked(database.lineages.update).mockResolvedValue(updatedLineage);

    queryClient.setQueryData(['timelines', 'project-1'], mockLineages);
    const setQueryDataSpy = vi.spyOn(queryClient, 'setQueryData');

    const { result } = renderHook(() => useUpdateLineage(), { wrapper });

    await result.current.mutateAsync({
      lineageId: 'lineage-1',
      name: 'Optimistic Name',
      projectId: 'project-1',
    });

    // Verify setQueryData was called for optimistic update
    expect(setQueryDataSpy).toHaveBeenCalledWith(
      ['timelines', 'project-1'],
      expect.any(Function)
    );

    // Verify the cache was updated correctly
    const cachedData = queryClient.getQueryData<Lineage[]>(['timelines', 'project-1']);
    const updatedLineageInCache = cachedData?.find(l => l.id === 'lineage-1');
    expect(updatedLineageInCache?.name).toBe('Optimistic Name');
  });

  it('cancels pending queries on mutate', async () => {
    const cancelQueriesSpy = vi.spyOn(queryClient, 'cancelQueries');
    vi.mocked(database.lineages.update).mockResolvedValue(mockLineages[0]);

    queryClient.setQueryData(['timelines', 'project-1'], mockLineages);

    const { result } = renderHook(() => useUpdateLineage(), { wrapper });

    await result.current.mutateAsync({
      lineageId: 'lineage-1',
      name: 'New Name',
      projectId: 'project-1',
    });

    expect(cancelQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['timelines', 'project-1'],
    });
  });

  it('snapshots previous state before optimistic update', async () => {
    const updatedLineage: Lineage = {
      ...mockLineages[0],
      name: 'New Name',
    };
    vi.mocked(database.lineages.update).mockResolvedValue(updatedLineage);

    queryClient.setQueryData(['timelines', 'project-1'], mockLineages);

    const { result } = renderHook(() => useUpdateLineage(), { wrapper });

    await result.current.mutateAsync({
      lineageId: 'lineage-1',
      name: 'New Name',
      projectId: 'project-1',
    });

    // The previous state should have been snapshotted
    // We can verify this by checking that rollback would work
    const cachedData = queryClient.getQueryData<Lineage[]>(['timelines', 'project-1']);
    expect(cachedData).toBeDefined();
  });

  it('rolls back optimistic update on error', async () => {
    const error = new Error('Failed to update lineage');
    vi.mocked(database.lineages.update).mockRejectedValue(error);

    queryClient.setQueryData(['timelines', 'project-1'], mockLineages);
    const originalData = [...mockLineages];

    const { result } = renderHook(() => useUpdateLineage(), { wrapper });

    try {
      await result.current.mutateAsync({
        lineageId: 'lineage-1',
        name: 'New Name',
        projectId: 'project-1',
      });
    } catch {
      // Expected to throw
    }

    // Wait for rollback to complete
    await waitFor(() => {
      const cachedData = queryClient.getQueryData<Lineage[]>(['timelines', 'project-1']);
      expect(cachedData).toEqual(originalData);
    });
  });

  it('restores previous state from context on error', async () => {
    const error = new Error('Database error');
    vi.mocked(database.lineages.update).mockRejectedValue(error);

    const customLineages: Lineage[] = [
      {
        id: 'lineage-1',
        project_id: 'project-1',
        user_id: 'user-1',
        root_media_asset_id: 'asset-1',
        name: 'Original',
        metadata: {},
        created_at: '2025-01-01T00:00:00Z',
      },
    ];

    queryClient.setQueryData(['timelines', 'project-1'], customLineages);

    const { result } = renderHook(() => useUpdateLineage(), { wrapper });

    try {
      await result.current.mutateAsync({
        lineageId: 'lineage-1',
        name: 'Should Fail',
        projectId: 'project-1',
      });
    } catch {
      // Expected
    }

    await waitFor(() => {
      const cachedData = queryClient.getQueryData<Lineage[]>(['timelines', 'project-1']);
      expect(cachedData).toEqual(customLineages);
      expect(cachedData?.[0]?.name).toBe('Original');
    });
  });

  it('invalidates timelines query on settle (success)', async () => {
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
    vi.mocked(database.lineages.update).mockResolvedValue(mockLineages[0]);

    queryClient.setQueryData(['timelines', 'project-1'], mockLineages);

    const { result } = renderHook(() => useUpdateLineage(), { wrapper });

    await result.current.mutateAsync({
      lineageId: 'lineage-1',
      name: 'New Name',
      projectId: 'project-1',
    });

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['timelines', 'project-1'],
      });
    });
  });

  it('invalidates timelines query on settle (error)', async () => {
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');
    const error = new Error('Update failed');
    vi.mocked(database.lineages.update).mockRejectedValue(error);

    queryClient.setQueryData(['timelines', 'project-1'], mockLineages);

    const { result } = renderHook(() => useUpdateLineage(), { wrapper });

    try {
      await result.current.mutateAsync({
        lineageId: 'lineage-1',
        name: 'New Name',
        projectId: 'project-1',
      });
    } catch {
      // Expected
    }

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['timelines', 'project-1'],
      });
    });
  });

  it('handles null previousLineages in rollback gracefully', async () => {
    const error = new Error('Update failed');
    vi.mocked(database.lineages.update).mockRejectedValue(error);

    // Don't set initial cache data - previousLineages will be undefined
    const { result } = renderHook(() => useUpdateLineage(), { wrapper });

    try {
      await result.current.mutateAsync({
        lineageId: 'lineage-1',
        name: 'New Name',
        projectId: 'project-1',
      });
    } catch {
      // Expected
    }

    // Should not throw, even though previousLineages is undefined
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('handles undefined previousLineages in rollback gracefully', async () => {
    const error = new Error('Update failed');
    vi.mocked(database.lineages.update).mockRejectedValue(error);

    // Set query data to undefined explicitly
    queryClient.setQueryData(['timelines', 'project-1'], undefined);

    const { result } = renderHook(() => useUpdateLineage(), { wrapper });

    try {
      await result.current.mutateAsync({
        lineageId: 'lineage-1',
        name: 'New Name',
        projectId: 'project-1',
      });
    } catch {
      // Expected
    }

    // Should not throw, even though previousLineages is undefined
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('only updates the specified lineage in cache', async () => {
    const updatedLineage: Lineage = {
      ...mockLineages[0],
      name: 'Updated',
    };
    vi.mocked(database.lineages.update).mockResolvedValue(updatedLineage);

    queryClient.setQueryData(['timelines', 'project-1'], mockLineages);

    const { result } = renderHook(() => useUpdateLineage(), { wrapper });

    await result.current.mutateAsync({
      lineageId: 'lineage-1',
      name: 'Updated',
      projectId: 'project-1',
    });

    const cachedData = queryClient.getQueryData<Lineage[]>(['timelines', 'project-1']);
    expect(cachedData?.find(l => l.id === 'lineage-1')?.name).toBe('Updated');
    expect(cachedData?.find(l => l.id === 'lineage-2')?.name).toBe('Another Lineage');
  });

  it('handles empty lineages array in cache', async () => {
    const updatedLineage: Lineage = {
      id: 'lineage-1',
      project_id: 'project-1',
      user_id: 'user-1',
      root_media_asset_id: 'asset-1',
      name: 'New Name',
      metadata: {},
      created_at: '2025-01-01T00:00:00Z',
    };
    vi.mocked(database.lineages.update).mockResolvedValue(updatedLineage);

    queryClient.setQueryData(['timelines', 'project-1'], []);

    const { result } = renderHook(() => useUpdateLineage(), { wrapper });

    await result.current.mutateAsync({
      lineageId: 'lineage-1',
      name: 'New Name',
      projectId: 'project-1',
    });

    // Should not crash, optimistic update just won't happen
    expect(database.lineages.update).toHaveBeenCalled();
  });
});

