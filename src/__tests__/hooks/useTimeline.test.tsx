import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTimeline, useTimelinesByProject } from '../../hooks/useTimeline';
import { database } from '../../lib/database';
import { TimelineData } from '../../types/timeline';
import { Lineage } from '../../types';
import { setupClerkMocks } from '../test-utils.tsx';

// Mock the database module
vi.mock('../../lib/database', () => ({
  database: {
    lineages: {
      getTimelineData: vi.fn(),
      getByProject: vi.fn(),
    },
  },
}));

// Mock useUserId to return a consistent user ID
vi.mock('../../hooks/useUserId', () => ({
  useUserId: () => 'test-user-id',
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
    setupClerkMocks();
    vi.mocked(database.lineages.getTimelineData).mockResolvedValue(mockTimelineData);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('fetches timeline data successfully', async () => {
    const { result } = renderHook(() => useTimeline('lineage-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockTimelineData);
    expect(database.lineages.getTimelineData).toHaveBeenCalledWith('lineage-1', 'test-user-id');
  });

  it('does not fetch when lineageId is empty string', () => {
    const { result } = renderHook(() => useTimeline(''), { wrapper });

    expect(result.current.isFetching).toBe(false);
    expect(database.lineages.getTimelineData).not.toHaveBeenCalled();
  });

  it('does not fetch when lineageId is null', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { result } = renderHook(() => useTimeline(null as any), { wrapper });

    expect(result.current.isFetching).toBe(false);
    expect(database.lineages.getTimelineData).not.toHaveBeenCalled();
  });

  it('does not fetch when lineageId is undefined', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { result } = renderHook(() => useTimeline(undefined as any), { wrapper });

    expect(result.current.isFetching).toBe(false);
    expect(database.lineages.getTimelineData).not.toHaveBeenCalled();
  });

  it('respects enabled option', () => {
    const { result } = renderHook(() => useTimeline('lineage-1', { enabled: false }), { wrapper });

    expect(result.current.isFetching).toBe(false);
    expect(database.lineages.getTimelineData).not.toHaveBeenCalled();
  });
});

describe('useTimelinesByProject', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
    vi.clearAllMocks();
    setupClerkMocks();
    vi.mocked(database.lineages.getByProject).mockResolvedValue(mockLineages);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('fetches lineages by project successfully', async () => {
    const { result } = renderHook(() => useTimelinesByProject('project-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockLineages);
    expect(database.lineages.getByProject).toHaveBeenCalledWith('project-1', 'test-user-id');
  });

  it('does not fetch when projectId is empty string', () => {
    const { result } = renderHook(() => useTimelinesByProject(''), { wrapper });

    expect(result.current.isFetching).toBe(false);
    expect(database.lineages.getByProject).not.toHaveBeenCalled();
  });

  it('does not fetch when projectId is null', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { result } = renderHook(() => useTimelinesByProject(null as any), { wrapper });

    expect(result.current.isFetching).toBe(false);
    expect(database.lineages.getByProject).not.toHaveBeenCalled();
  });

  it('does not fetch when projectId is undefined', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { result } = renderHook(() => useTimelinesByProject(undefined as any), { wrapper });

    expect(result.current.isFetching).toBe(false);
    expect(database.lineages.getByProject).not.toHaveBeenCalled();
  });

  it('respects enabled option', () => {
    const { result } = renderHook(() => useTimelinesByProject('project-1', { enabled: false }), { wrapper });

    expect(result.current.isFetching).toBe(false);
    expect(database.lineages.getByProject).not.toHaveBeenCalled();
  });
});

