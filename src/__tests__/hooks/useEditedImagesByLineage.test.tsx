import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEditedImagesByLineage } from '../../hooks/useEditedImages';
import { database } from '../../lib/database';
import { EditedImage } from '../../types';

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
    editedImages: {
      listByLineage: vi.fn(),
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
    lineage_id: 'lineage-1',
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
    parent_id: 'edited-1',
    lineage_id: 'lineage-1',
    created_at: '2025-10-20T16:00:00.165+00:00',
  },
];

describe('useEditedImagesByLineage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
    vi.clearAllMocks();
    vi.mocked(database.editedImages.listByLineage).mockResolvedValue(mockEditedImages);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('fetches edited images successfully', async () => {
    const { result } = renderHook(() => useEditedImagesByLineage('lineage-1'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockEditedImages);
    expect(database.editedImages.listByLineage).toHaveBeenCalledWith('lineage-1', 'test-user-id');
  });

  it('does not fetch when lineageId is empty string', () => {
    const { result } = renderHook(() => useEditedImagesByLineage(''), { wrapper });

    expect(result.current.isFetching).toBe(false);
    expect(database.editedImages.listByLineage).not.toHaveBeenCalled();
  });

  it('does not fetch when lineageId is null', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { result } = renderHook(() => useEditedImagesByLineage(null as any), { wrapper });

    expect(result.current.isFetching).toBe(false);
    expect(database.editedImages.listByLineage).not.toHaveBeenCalled();
  });


  it('respects enabled option', () => {
    const { result } = renderHook(() => useEditedImagesByLineage('lineage-1', { enabled: false }), { wrapper });

    expect(result.current.isFetching).toBe(false);
    expect(database.editedImages.listByLineage).not.toHaveBeenCalled();
  });
});
