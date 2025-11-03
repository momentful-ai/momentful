import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Dashboard } from '../../../components/Dashboard/Dashboard';
import { Project } from '../../../types';

// Mock database
const mockListProjects = vi.fn();
const mockCreateProject = vi.fn();
const mockUpdateProject = vi.fn();
const mockDeleteProject = vi.fn();

vi.mock('../../../lib/database', () => ({
  database: {
    projects: {
      list: () => mockListProjects(),
      create: (...args: unknown[]) => mockCreateProject(...args),
      update: (...args: unknown[]) => mockUpdateProject(...args),
      delete: (...args: unknown[]) => mockDeleteProject(...args),
    },
  },
}));

// Mock hooks
vi.mock('../../../hooks/useUserId', () => ({
  useUserId: vi.fn(() => 'test-user-id'),
}));

vi.mock('../../../hooks/useToast', () => ({
  useToast: vi.fn(() => ({
    showToast: vi.fn(),
  })),
}));

vi.mock('../../../hooks/useProjects', () => ({
  useProjects: vi.fn(),
}));

// Helper to create mock query results
const createMockQueryResult = (overrides = {}) => ({
  data: [],
  error: null,
  isError: false,
  isPending: false,
  isLoading: false,
  isLoadingError: false,
  isRefetchError: false,
  isSuccess: true,
  isFetched: true,
  isFetchedAfterMount: true,
  isFetching: false,
  isRefetching: false,
  isStale: false,
  isPlaceholderData: false,
  isInitialLoading: false,
  isEnabled: true,
  dataUpdatedAt: Date.now(),
  errorUpdatedAt: 0,
  failureCount: 0,
  failureReason: null,
  errorUpdateCount: 0,
  isPaused: false,
  fetchStatus: 'idle' as const,
  status: 'success' as const,
  refetch: vi.fn().mockResolvedValue({}),
  promise: undefined,
  ...overrides,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any);

// Import to access mocks
import { useToast } from '../../../hooks/useToast';
import { useProjects } from '../../../hooks/useProjects';
const mockUseToast = vi.mocked(useToast);
const mockUseProjects = vi.mocked(useProjects);
const mockShowToast = vi.fn();

// Mock components
vi.mock('../../../components/LoadingSkeleton', () => ({
  DashboardSkeleton: () => <div data-testid="dashboard-skeleton">Loading...</div>,
}));

interface ConfirmDialogProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

interface ProjectCardProps {
  project: Project;
  onClick: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateName: (id: string, name: string) => void;
}

vi.mock('../../../components/ConfirmDialog', () => ({
  ConfirmDialog: ({ title, message, onConfirm, onCancel }: ConfirmDialogProps) => (
    <div data-testid="confirm-dialog">
      <div>{title}</div>
      <div>{message}</div>
      <button onClick={onConfirm}>Confirm</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

// Mock ProjectCard
vi.mock('../../../components/Dashboard/ProjectCard', () => ({
  ProjectCard: ({ project, onClick, onDelete, onUpdateName }: ProjectCardProps) => (
    <div data-testid={`project-card-${project.id}`}>
      <div onClick={() => onClick(project.id)}>{project.name}</div>
      <button onClick={() => onDelete(project.id)}>Delete</button>
      <button onClick={() => onUpdateName(project.id, 'Updated Name')}>Update Name</button>
    </div>
  ),
}));

describe('Dashboard', () => {
  let queryClient: QueryClient;
  const mockOnSelectProject = vi.fn();

  const mockProjects: Project[] = [
    {
      id: 'project-1',
      user_id: 'test-user-id',
      name: 'Project 1',
      description: 'First project',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
    {
      id: 'project-2',
      user_id: 'test-user-id',
      name: 'Project 2',
      description: 'Second project',
      created_at: '2025-01-02T00:00:00Z',
      updated_at: '2025-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    vi.clearAllMocks();
    mockUseToast.mockReturnValue({
      showToast: mockShowToast,
    });
    mockUseProjects.mockReturnValue(createMockQueryResult({
      data: mockProjects,
    }));
  });

  it('shows loading skeleton while loading projects', () => {
    mockUseProjects.mockReturnValue(createMockQueryResult({
      data: [],
      isLoading: true,
      isPending: true,
      status: 'pending',
    }));

    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard onSelectProject={mockOnSelectProject} />
      </QueryClientProvider>
    );

    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();
  });

  it('displays empty state when no projects exist', async () => {
    mockUseProjects.mockReturnValue(createMockQueryResult({
      data: [],
    }));

    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard onSelectProject={mockOnSelectProject} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('No projects yet')).toBeInTheDocument();
      expect(screen.getByText(/Get started by creating your first project/i)).toBeInTheDocument();
    });
  });

  it('displays projects when they exist', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard onSelectProject={mockOnSelectProject} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Project 1')).toBeInTheDocument();
      expect(screen.getByText('Project 2')).toBeInTheDocument();
    });
  });

  it('creates a new project when New Project button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    mockUseProjects.mockReturnValue(createMockQueryResult({
      data: [],
    }));
    const newProject: Project = {
      id: 'project-new',
      user_id: 'test-user-id',
      name: 'Untitled Project',
      description: '',
      created_at: '2025-01-03T00:00:00Z',
      updated_at: '2025-01-03T00:00:00Z',
    };
    mockCreateProject.mockResolvedValue(newProject);
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();

    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard onSelectProject={mockOnSelectProject} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('No projects yet')).toBeInTheDocument();
    });

    const newProjectButton = screen.getByText('Create Your First Project');
    await user.click(newProjectButton);

    await waitFor(() => {
      expect(mockCreateProject).toHaveBeenCalledWith('test-user-id', 'Untitled Project', '');
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['projects'] });
      expect(mockOnSelectProject).toHaveBeenCalledWith(newProject);
    });
  });

  it('handles error when loading projects fails', async () => {
    mockUseProjects.mockReturnValue(createMockQueryResult({
      data: [],
      error: new Error('Failed to load'),
      isError: true,
      status: 'error',
    }));

    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard onSelectProject={mockOnSelectProject} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        'Failed to load projects. Please refresh the page.',
        'error'
      );
    });
  });

  it('handles error when creating project fails', async () => {
    const user = userEvent.setup({ delay: null });
    mockUseProjects.mockReturnValue(createMockQueryResult({
      data: [],
    }));
    mockCreateProject.mockRejectedValue(new Error('Create failed'));

    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard onSelectProject={mockOnSelectProject} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Create Your First Project')).toBeInTheDocument();
    });

    const newProjectButton = screen.getByText('Create Your First Project');
    await user.click(newProjectButton);

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith(
        'Failed to create project. Please try again.',
        'error'
      );
    });
  });

  it('updates project name when onUpdateName is called', async () => {
    const user = userEvent.setup({ delay: null });
    mockUpdateProject.mockResolvedValue(undefined);
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();

    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard onSelectProject={mockOnSelectProject} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Project 1')).toBeInTheDocument();
    });

    const updateButtons = screen.getAllByText('Update Name');
    await user.click(updateButtons[0]);

    await waitFor(() => {
      expect(mockUpdateProject).toHaveBeenCalledWith('project-1', { name: 'Updated Name' });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['projects'] });
      expect(mockShowToast).toHaveBeenCalledWith('Project name updated', 'success');
    });
  });

  it('deletes project when delete is confirmed', async () => {
    const user = userEvent.setup({ delay: null });
    mockDeleteProject.mockResolvedValue(undefined);
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue();

    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard onSelectProject={mockOnSelectProject} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Project 1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
      expect(screen.getByText('Delete Project')).toBeInTheDocument();
    });

    const confirmButton = screen.getByText('Confirm');
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockDeleteProject).toHaveBeenCalledWith('project-1');
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: ['projects'] });
      expect(mockShowToast).toHaveBeenCalledWith('Project deleted successfully', 'success');
    });
  });

  it('cancels delete when cancel is clicked', async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard onSelectProject={mockOnSelectProject} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Project 1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId('confirm-dialog')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
      expect(mockDeleteProject).not.toHaveBeenCalled();
    });
  });

  it('calls onSelectProject when a project is clicked', async () => {
    const user = userEvent.setup({ delay: null });

    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard onSelectProject={mockOnSelectProject} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Project 1')).toBeInTheDocument();
    });

    const project1 = screen.getByText('Project 1');
    await user.click(project1);

    await waitFor(() => {
      expect(mockOnSelectProject).toHaveBeenCalledWith(mockProjects[0]);
    });
  });
});

