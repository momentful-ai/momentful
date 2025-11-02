import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimelineView } from '../../../components/ProjectWorkspace/TimelineView';
import { useTimelinesByProject } from '../../../hooks/useTimeline';
import { Lineage } from '../../../types';
import { UseQueryResult } from '@tanstack/react-query';

// Mock the hook
vi.mock('../../../hooks/useTimeline', () => ({
  useTimelinesByProject: vi.fn(),
  useTimeline: vi.fn(() => ({ data: { nodes: [], edges: [] }, isLoading: false })),
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
  it('renders loading state', () => {
    vi.mocked(useTimelinesByProject).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as unknown as UseQueryResult<Lineage[], Error>);

    render(<TimelineView projectId="test-project" />);

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

    render(<TimelineView projectId="test-project" />);

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

    render(<TimelineView projectId="test-project" />);

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

    render(<TimelineView projectId="test-project" />);

    fireEvent.click(screen.getByText('Test Lineage 1'));

    // Verify selected state (e.g., class change)
    expect(screen.getByText('Test Lineage 1').closest('button')).toHaveClass('bg-primary');
  });
});
