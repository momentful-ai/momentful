import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProjectPreviewCollage } from '../../../components/Dashboard/ProjectPreviewCollage';
import { Project } from '../../../types';
import { database } from '../../../lib/database';

// Mock database
vi.mock('../../../lib/database', () => ({
  database: {
    storage: {
      getPublicUrl: vi.fn((bucket, path) => `https://example.com/${bucket}/${path}`),
    },
  },
}));

describe('ProjectPreviewCollage', () => {
  const baseProject: Project = {
    id: 'project-1',
    user_id: 'user-1',
    name: 'Test Project',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays folder icon when no preview images', () => {
    render(<ProjectPreviewCollage project={baseProject} />);

    // FolderOpen icon should be visible
    const folderIcon = document.querySelector('.lucide-folder-open, svg');
    expect(folderIcon).toBeInTheDocument();
  });

  it('displays single preview image', () => {
    const project: Project = {
      ...baseProject,
      previewImages: ['path/to/image1.jpg'],
    };

    render(<ProjectPreviewCollage project={project} />);

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(1);
    expect(images[0]).toHaveAttribute('src', 'https://example.com/user-uploads/path/to/image1.jpg');
    expect(images[0]).toHaveAttribute('alt', 'Project preview');
  });

  it('displays two images in a grid', () => {
    const project: Project = {
      ...baseProject,
      previewImages: ['path/to/image1.jpg', 'path/to/image2.jpg'],
    };

    render(<ProjectPreviewCollage project={project} />);

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('alt', 'Preview 1');
    expect(images[1]).toHaveAttribute('alt', 'Preview 2');
  });

  it('displays three images in 2-column layout', () => {
    const project: Project = {
      ...baseProject,
      previewImages: ['path/to/image1.jpg', 'path/to/image2.jpg', 'path/to/image3.jpg'],
    };

    render(<ProjectPreviewCollage project={project} />);

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(3);
    expect(images[0]).toHaveAttribute('alt', 'Preview 1');
    expect(images[1]).toHaveAttribute('alt', 'Preview 2');
    expect(images[2]).toHaveAttribute('alt', 'Preview 3');
  });

  it('displays first 4 images in 2x2 grid when 4+ images', () => {
    const project: Project = {
      ...baseProject,
      previewImages: [
        'path/to/image1.jpg',
        'path/to/image2.jpg',
        'path/to/image3.jpg',
        'path/to/image4.jpg',
        'path/to/image5.jpg',
      ],
    };

    render(<ProjectPreviewCollage project={project} />);

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(4); // Only first 4 should be shown
    expect(images[0]).toHaveAttribute('alt', 'Preview 1');
    expect(images[1]).toHaveAttribute('alt', 'Preview 2');
    expect(images[2]).toHaveAttribute('alt', 'Preview 3');
    expect(images[3]).toHaveAttribute('alt', 'Preview 4');
  });

  it('generates correct image URLs using storage helper', () => {
    const project: Project = {
      ...baseProject,
      previewImages: ['user-uploads/project1/image.jpg'],
    };

    render(<ProjectPreviewCollage project={project} />);

    expect(database.storage.getPublicUrl).toHaveBeenCalledWith('user-uploads', 'user-uploads/project1/image.jpg');
  });
});

