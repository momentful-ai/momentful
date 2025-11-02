import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTimeline, useTimelinesByProject } from '../../hooks/useTimeline';
import { database } from '../../lib/database';
import { TimelineData } from '../../types/timeline';
import { Lineage } from '../../types';

// Mock the database module
vi.mock('../../lib/database', () => ({
  database: {
    lineages: {
      getTimelineData: vi.fn(),
      getByProject: vi.fn(),
    },
  },
}));

const mockTimelineData: TimelineData = {
  nodes: [],
  edges: [],
};

const mockLineages: Lineage[] = [
  {
    id: 'lineage-1',
    project_id: 'project-1',
    user_id: 'user-1',
    root_media_asset_id: 'asset-1',
    name: 'Test Lineage',
    metadata: {},
    created_at: '2025-01-01T00:00:00Z',
  },
];

describe('useTimeline', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
    vi.clearAllMocks();
    vi.mocked(database.lineages.getTimelineData).mockResolvedValue(mockTimelineData);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('fetches timeline data successfully', async () => {
    const { result } = renderHook(() => useTimeline('lineage-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockTimelineData);
    expect(database.lineages.getTimelineData).toHaveBeenCalledWith('lineage-1');
  });
});

describe('useTimelinesByProject', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
    vi.clearAllMocks();
    vi.mocked(database.lineages.getByProject).mockResolvedValue(mockLineages);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('fetches lineages by project successfully', async () => {
    const { result } = renderHook(() => useTimelinesByProject('project-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockLineages);
    expect(database.lineages.getByProject).toHaveBeenCalledWith('project-1');
  });
});

