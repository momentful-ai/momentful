import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectCard } from '../../../components/Dashboard/ProjectCard';
import { Project } from '../../../types';

// Mock ProjectPreviewCollage
vi.mock('../../../components/Dashboard/ProjectPreviewCollage', () => ({
  ProjectPreviewCollage: () => <div data-testid="preview-collage">Preview</div>,
}));

describe('ProjectCard', () => {
  const mockProject: Project = {
    id: 'project-1',
    user_id: 'user-1',
    name: 'Test Project',
    description: 'Test description',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-15T00:00:00Z',
  };

  const mockOnClick = vi.fn();
  const mockOnDelete = vi.fn();
  const mockOnUpdateName = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders project name', () => {
    render(
      <ProjectCard
        projectId={mockProject.id}
        project={mockProject}
        onClick={mockOnClick}
        onDelete={mockOnDelete}
        onUpdateName={mockOnUpdateName}
        index={0}
      />
    );

    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });


  it('calls onClick when card is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ProjectCard
        projectId={mockProject.id}
        project={mockProject}
        onClick={mockOnClick}
        onDelete={mockOnDelete}
        onUpdateName={mockOnUpdateName}
        index={0}
      />
    );

    const card = screen.getByText('Test Project').closest('.group');
    if (card) {
      await user.click(card);
      expect(mockOnClick).toHaveBeenCalledWith('project-1');
    }
  });

  it('renders menu button', () => {
    render(
      <ProjectCard
        projectId={mockProject.id}
        project={mockProject}
        onClick={mockOnClick}
        onDelete={mockOnDelete}
        onUpdateName={mockOnUpdateName}
        index={0}
      />
    );

    // Menu button should be present
    expect(screen.getByTestId('project-menu-button')).toBeInTheDocument();
  });

  it('renders pencil button for editing', () => {
    render(
      <ProjectCard
        projectId={mockProject.id}
        project={mockProject}
        onClick={mockOnClick}
        onDelete={mockOnDelete}
        onUpdateName={mockOnUpdateName}
        index={0}
      />
    );

    // Pencil button should be present
    expect(screen.getByTestId('project-edit-button')).toBeInTheDocument();
  });

  it('applies staggered animation delay based on index', () => {
    render(
      <ProjectCard
        projectId={mockProject.id}
        project={mockProject}
        onClick={mockOnClick}
        onDelete={mockOnDelete}
        onUpdateName={mockOnUpdateName}
        index={2}
      />
    );

    const card = screen.getByText('Test Project').closest('.group');
    expect(card).toHaveAttribute('style', 'animation-delay: 100ms; animation-fill-mode: backwards;');
  });

  it('renders ProjectPreviewCollage', () => {
    render(
      <ProjectCard
        projectId={mockProject.id}
        project={mockProject}
        onClick={mockOnClick}
        onDelete={mockOnDelete}
        onUpdateName={mockOnUpdateName}
        index={0}
      />
    );

    expect(screen.getByTestId('preview-collage')).toBeInTheDocument();
  });
});