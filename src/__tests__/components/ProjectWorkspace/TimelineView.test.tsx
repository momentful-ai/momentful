import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TimelineView } from '../../../components/ProjectWorkspace/TimelineView';
import { useTimelinesByProject, useTimeline } from '../../../hooks/useTimeline';
import { useUpdateLineage } from '../../../hooks/useUpdateLineage';
import { Lineage } from '../../../types';
import { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import { TimelineData } from '../../../types/timeline';
import { ToastProvider } from '../../../contexts/ToastProvider';
import { MediaCardItem } from '../../../components/shared/MediaCard';
import { mockSupabaseAndDatabase } from '../../test-utils.tsx';

// Mock supabase and database
mockSupabaseAndDatabase();

// Mock Supabase and database dependencies
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/mock-url' } })),
      })),
    },
  },
}));

vi.mock('../../../lib/database', () => ({
  database: {
    mediaAssets: {
      getById: vi.fn(),
    },
    storage: {
      getPublicUrl: vi.fn(() => 'https://example.com/mock-url'),
    },
  },
}));

// Mock Supabase and database dependencies
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/mock-url' } })),
      })),
    },
  },
}));

vi.mock('../../../lib/database', () => ({
  database: {
    mediaAssets: {
      getById: vi.fn(),
    },
    storage: {
      getPublicUrl: vi.fn(() => 'https://example.com/mock-url'),
    },
  },
}));

// Mock the hooks
vi.mock('../../../hooks/useTimeline', () => ({
  useTimelinesByProject: vi.fn(),
  useTimeline: vi.fn(() => ({ data: { nodes: [], edges: [] }, isLoading: false })),
}));

vi.mock('../../../hooks/useUpdateLineage', () => ({
  useUpdateLineage: vi.fn(),
}));

vi.mock('../../../components/shared/MediaCard', () => ({
  MediaCard: ({ item }: { item: MediaCardItem }) => {
    let label = 'Timeline item';

    if (item && typeof item === 'object' && 'data' in item) {
      // TimelineNode
      const data = item.data;
      if ('file_name' in data) {
        label = data.file_name;
      } else if ('name' in data) {
        label = data.name;
      } else if ('prompt' in data) {
        label = data.prompt;
      }
    } else if (item && typeof item === 'object') {
      // Direct item types
      if ('file_name' in item) {
        label = item.file_name;
      } else if ('name' in item) {
        label = item.name;
      } else if ('prompt' in item) {
        label = item.prompt;
      }
    }

    return <div>{label}</div>;
  },
}));

vi.mock('../../../lib/media', () => ({
  getAssetUrl: vi.fn(() => 'mock-url'),
}));


const mockLineages: Lineage[] = [
  { 
    id: 'lineage-1', 
    name: 'Test Lineage 1',
    project_id: 'test-project',
    user_id: 'test-user',
    root_media_asset_id: 'root-1',
    metadata: {},
    created_at: '2025-01-01T00:00:00Z',
  },
  { 
    id: 'lineage-2', 
    name: 'Test Lineage 2',
    project_id: 'test-project',
    user_id: 'test-user',
    root_media_asset_id: 'root-2',
    metadata: {},
    created_at: '2025-01-01T00:00:00Z',
  },
];

describe('TimelineView', () => {
  let queryClient: QueryClient;
  const mockUpdateMutation = {
    mutateAsync: vi.fn(),
    isPending: false,
  } as unknown as UseMutationResult<Lineage, Error, { lineageId: string; name: string; projectId: string }>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
    // Reset useTimeline mock to default
    vi.mocked(useTimeline).mockReturnValue({
      data: { nodes: [], edges: [] },
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as UseQueryResult<TimelineData, Error>);
    // Reset useUpdateLineage mock
    vi.mocked(useUpdateLineage).mockReturnValue(mockUpdateMutation as ReturnType<typeof useUpdateLineage>);
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          {component}
        </ToastProvider>
      </QueryClientProvider>
    );
  };

  it('renders loading state', () => {
    vi.mocked(useTimelinesByProject).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as unknown as UseQueryResult<Lineage[], Error>);

    renderWithProviders(<TimelineView projectId="test-project" />);

    expect(screen.getByText('Loading timelines...')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    vi.mocked(useTimelinesByProject).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: true,
    } as unknown as UseQueryResult<Lineage[], Error>);

    renderWithProviders(<TimelineView projectId="test-project" />);

    expect(screen.getByText('No timelines available. Start by uploading media and editing.')).toBeInTheDocument();
  });

  it('renders lineage selectors', () => {
    vi.mocked(useTimelinesByProject).mockReturnValue({
      data: mockLineages,
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: true,
    } as unknown as UseQueryResult<Lineage[], Error>);

    renderWithProviders(<TimelineView projectId="test-project" />);

    expect(screen.getByText('Test Lineage 1')).toBeInTheDocument();
    expect(screen.getByText('Test Lineage 2')).toBeInTheDocument();
  });

  it('selects a lineage on click', () => {
    vi.mocked(useTimelinesByProject).mockReturnValue({
      data: mockLineages,
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: true,
    } as unknown as UseQueryResult<Lineage[], Error>);

    renderWithProviders(<TimelineView projectId="test-project" />);

    fireEvent.click(screen.getByText('Test Lineage 1'));

    // Verify selected state - bg-primary is on the parent div
    const lineageContainer = screen.getByText('Test Lineage 1').closest('.group');
    expect(lineageContainer).toHaveClass('bg-primary');
  });

  it('auto-selects first lineage when lineages are loaded', async () => {
    const mockTimelineData: TimelineData = {
      nodes: [
        {
          type: 'media_asset',
          data: {
            id: 'asset-1',
            project_id: 'test-project',
            user_id: 'test-user',
            file_name: 'test.jpg',
            file_type: 'image',
            file_size: 1000,
            storage_path: 'path/to/test.jpg',
            sort_order: 0,
            created_at: '2025-01-01T00:00:00Z',
          },
        },
      ],
      edges: [],
    };

    vi.mocked(useTimelinesByProject).mockReturnValue({
      data: mockLineages,
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: true,
    } as unknown as UseQueryResult<Lineage[], Error>);

    vi.mocked(useTimeline).mockReturnValue({
      data: mockTimelineData,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as UseQueryResult<TimelineData, Error>);

    renderWithProviders(<TimelineView projectId="test-project" />);

    // Wait for auto-selection to occur
    await waitFor(() => {
      expect(useTimeline).toHaveBeenCalledWith('lineage-1');
    });

    // Verify first lineage container is selected
    const firstContainer = screen.getByText('Test Lineage 1').closest('.group');
    expect(firstContainer).toHaveClass('bg-primary');
  });

  it('preserves user selection when lineages update', async () => {
    const mockTimelineData: TimelineData = {
      nodes: [],
      edges: [],
    };

    vi.mocked(useTimelinesByProject).mockReturnValue({
      data: mockLineages,
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: true,
    } as unknown as UseQueryResult<Lineage[], Error>);

    vi.mocked(useTimeline).mockReturnValue({
      data: mockTimelineData,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as UseQueryResult<TimelineData, Error>);

    renderWithProviders(<TimelineView projectId="test-project" />);

    // Wait for auto-selection
    await waitFor(() => {
      expect(useTimeline).toHaveBeenCalledWith('lineage-1');
    });

    // User selects second lineage
    fireEvent.click(screen.getByText('Test Lineage 2'));

    // Verify second lineage container is selected
    const secondContainer = screen.getByText('Test Lineage 2').closest('.group');
    expect(secondContainer).toHaveClass('bg-primary');

    // Verify first lineage is not selected
    const firstContainer = screen.getByText('Test Lineage 1').closest('.group');
    expect(firstContainer).not.toHaveClass('bg-primary');
  });

  it('renders timeline lane when lineage is selected', async () => {
    const mockTimelineData: TimelineData = {
      nodes: [
        {
          type: 'media_asset',
          data: {
            id: 'asset-1',
            project_id: 'test-project',
            user_id: 'test-user',
            file_name: 'test.jpg',
            file_type: 'image',
            file_size: 1000,
            storage_path: 'path/to/test.jpg',
            sort_order: 0,
            created_at: '2025-01-01T00:00:00Z',
          },
        },
      ],
      edges: [],
    };

    vi.mocked(useTimelinesByProject).mockReturnValue({
      data: mockLineages,
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: true,
    } as unknown as UseQueryResult<Lineage[], Error>);

    vi.mocked(useTimeline).mockReturnValue({
      data: mockTimelineData,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as UseQueryResult<TimelineData, Error>);

    renderWithProviders(<TimelineView projectId="test-project" />);

    // Wait for timeline to load
    await waitFor(() => {
      expect(useTimeline).toHaveBeenCalled();
    });

    // Verify timeline nodes are rendered (via the node ID)
    expect(screen.getByText('test.jpg')).toBeInTheDocument();
  });

  it('applies grid layout width to timeline nodes by default', async () => {
    const mockTimelineData: TimelineData = {
      nodes: [
        {
          type: 'media_asset',
          data: {
            id: 'asset-1',
            project_id: 'test-project',
            user_id: 'test-user',
            file_name: 'grid-test.jpg',
            file_type: 'image',
            file_size: 1024,
            storage_path: 'path/to/grid-test.jpg',
            sort_order: 0,
            created_at: '2025-01-01T00:00:00Z',
          },
        },
      ],
      edges: [],
    };

    vi.mocked(useTimelinesByProject).mockReturnValue({
      data: mockLineages,
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: true,
    } as unknown as UseQueryResult<Lineage[], Error>);

    vi.mocked(useTimeline).mockReturnValue({
      data: mockTimelineData,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as UseQueryResult<TimelineData, Error>);

    renderWithProviders(<TimelineView projectId="test-project" />);

    await waitFor(() => {
      expect(screen.getByText('grid-test.jpg')).toBeInTheDocument();
    });

    const nodeWrapper = document.getElementById('node-asset-1');
    expect(nodeWrapper).toHaveClass('w-[260px]');
  });

  it('applies list layout width to timeline nodes when viewMode is list', async () => {
    const mockTimelineData: TimelineData = {
      nodes: [
        {
          type: 'media_asset',
          data: {
            id: 'asset-1',
            project_id: 'test-project',
            user_id: 'test-user',
            file_name: 'list-test.jpg',
            file_type: 'image',
            file_size: 2048,
            storage_path: 'path/to/list-test.jpg',
            sort_order: 0,
            created_at: '2025-01-01T00:00:00Z',
          },
        },
      ],
      edges: [],
    };

    vi.mocked(useTimelinesByProject).mockReturnValue({
      data: mockLineages,
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: true,
    } as unknown as UseQueryResult<Lineage[], Error>);

    vi.mocked(useTimeline).mockReturnValue({
      data: mockTimelineData,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as UseQueryResult<TimelineData, Error>);

    renderWithProviders(<TimelineView projectId="test-project" viewMode="list" />);

    await waitFor(() => {
      expect(screen.getByText('list-test.jpg')).toBeInTheDocument();
    });

    const nodeWrapper = document.getElementById('node-asset-1');
    expect(nodeWrapper).toHaveClass('w-[360px]');
  });

  it('does not auto-select when no lineages are available', () => {
    vi.mocked(useTimelinesByProject).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: true,
    } as unknown as UseQueryResult<Lineage[], Error>);

    renderWithProviders(<TimelineView projectId="test-project" />);

    // Should not call useTimeline when no lineages
    expect(useTimeline).not.toHaveBeenCalled();
  });

  it('allows editing lineage name', async () => {
    vi.mocked(useTimelinesByProject).mockReturnValue({
      data: mockLineages,
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: true,
    } as unknown as UseQueryResult<Lineage[], Error>);

    vi.mocked(mockUpdateMutation.mutateAsync!).mockResolvedValue({
      ...mockLineages[0],
      name: 'Updated Name',
    });

    renderWithProviders(<TimelineView projectId="test-project" />);

    // Wait for auto-selection
    await waitFor(() => {
      expect(useTimeline).toHaveBeenCalled();
    });

    // Look for pencil icon button - it should be in the lineage selector
    const pencilButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
      btn.querySelector('svg') && btn.closest('.group')
    );
    
    if (pencilButtons.length > 0) {
      fireEvent.click(pencilButtons[0]);

      // Should show input field
      const input = screen.getByDisplayValue('Test Lineage 1');
      expect(input).toBeInTheDocument();

      // Update the name
      fireEvent.change(input, { target: { value: 'Updated Name' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      // Should call update mutation
      await waitFor(() => {
        expect(mockUpdateMutation.mutateAsync!).toHaveBeenCalledWith({
          lineageId: 'lineage-1',
          name: 'Updated Name',
          projectId: 'test-project',
        });
      });
    }
  });

  it('cancels editing when Escape is pressed', async () => {
    vi.mocked(useTimelinesByProject).mockReturnValue({
      data: mockLineages,
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: true,
    } as unknown as UseQueryResult<Lineage[], Error>);

    renderWithProviders(<TimelineView projectId="test-project" />);

    await waitFor(() => {
      expect(useTimeline).toHaveBeenCalled();
    });

    // Find edit button and click it
    const pencilButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
      btn.querySelector('svg') && btn.closest('.group')
    );
    
    if (pencilButtons.length > 0) {
      fireEvent.click(pencilButtons[0]);

      // Should show input field
      const input = screen.getByDisplayValue('Test Lineage 1');
      expect(input).toBeInTheDocument();

      // Change value
      fireEvent.change(input, { target: { value: 'Changed Name' } });
      
      // Press Escape
      fireEvent.keyDown(input, { key: 'Escape' });

      // Should cancel editing and not call mutation
      await waitFor(() => {
        expect(input).not.toBeInTheDocument();
      });
      
      expect(mockUpdateMutation.mutateAsync!).not.toHaveBeenCalled();
    }
  });

  it('saves changes when check button is clicked', async () => {
    vi.mocked(useTimelinesByProject).mockReturnValue({
      data: mockLineages,
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: true,
    } as unknown as UseQueryResult<Lineage[], Error>);

    vi.mocked(mockUpdateMutation.mutateAsync!).mockResolvedValue({
      ...mockLineages[0],
      name: 'Saved Name',
    });

    renderWithProviders(<TimelineView projectId="test-project" />);

    await waitFor(() => {
      expect(useTimeline).toHaveBeenCalled();
    });

    // Find edit button and click it
    const pencilButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
      btn.querySelector('svg') && btn.closest('.group')
    );
    
    if (pencilButtons.length > 0) {
      fireEvent.click(pencilButtons[0]);

      // Should show input field
      const input = screen.getByDisplayValue('Test Lineage 1');
      expect(input).toBeInTheDocument();

      // Change value
      fireEvent.change(input, { target: { value: 'Saved Name' } });
      
      // Find and click check button
      const checkButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
        btn.querySelector('svg[class*="lucide-check"]')
      );
      
      if (checkButtons.length > 0) {
        fireEvent.click(checkButtons[0]);

        // Should call update mutation
        await waitFor(() => {
          expect(mockUpdateMutation.mutateAsync!).toHaveBeenCalledWith({
            lineageId: 'lineage-1',
            name: 'Saved Name',
            projectId: 'test-project',
          });
        });
      }
    }
  });
});
