import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { ProjectPreviewCollage } from '../../../components/Dashboard/ProjectPreviewCollage';
import { Project } from '../../../types';

// Mock database and storage
vi.mock('../../../lib/database', () => ({
  database: {
    storage: {
      getPublicUrl: vi.fn((bucket, path) => `https://example.com/${bucket}/${path}`),
      getSignedUrl: vi.fn((bucket, path) => `https://signed.example.com/${bucket}/${path}`),
    },
  },
}));

// Mock the useSignedUrls hook to return mock signed URLs synchronously
const mockPreloadSignedUrls = vi.fn(({ bucket, paths }) => {
  const result: Record<string, string> = {};
  paths.forEach((path: string) => {
    result[path] = `https://signed.example.com/${bucket}/${path}`;
  });
  return Promise.resolve(result);
});

const mockUseSignedUrl = vi.fn();

vi.mock('../../../hooks/useSignedUrls', () => ({
  useSignedUrls: () => ({
    useSignedUrl: mockUseSignedUrl,
    preloadSignedUrls: mockPreloadSignedUrls,
    prefetchThumbnails: vi.fn(),
    clearCache: vi.fn(),
    getSignedUrl: vi.fn(),
    useOptimisticSignedUrl: vi.fn(),
    useMediaUrlPrefetch: vi.fn(),
    useMediaGalleryUrls: vi.fn(),
    getMultipleSignedUrls: vi.fn(),
    getUrlCacheStats: vi.fn(),
    config: {
      defaultExpiry: 86400,
      maxExpiry: 86400,
      prefetchExpiry: 43200,
      cacheBuffer: 21600,
      staleBuffer: 7200,
    },
    queryClient: {} as QueryClient,
  }),
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
    // Mock useSignedUrl to return a signed URL immediately
    mockUseSignedUrl.mockImplementation((bucket: string, path: string) => ({
      data: `https://signed.example.com/${bucket}/${path}`,
      isLoading: false,
      error: null,
    }));
  });

  it('displays folder icon when no preview images', () => {
    render(<ProjectPreviewCollage project={baseProject} />);

    // FolderOpen icon should be visible
    const folderIcon = document.querySelector('.lucide-folder-open, svg');
    expect(folderIcon).toBeInTheDocument();
  });

  it('displays single preview image', async () => {
    const project: Project = {
      ...baseProject,
      previewImages: ['user-uploads/project1/image.jpg'],
    };

    render(<ProjectPreviewCollage project={project} />);

    await waitFor(() => {
      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(1);
      expect(images[0]).toHaveAttribute('src', 'https://signed.example.com/user-uploads/user-uploads/project1/image.jpg');
      expect(images[0]).toHaveAttribute('alt', 'Project preview');
    });

    // Verify useSignedUrl was called with correct parameters
    expect(mockUseSignedUrl).toHaveBeenCalledWith('user-uploads', 'user-uploads/project1/image.jpg');
  });

  it('displays two images in a grid', async () => {
    const project: Project = {
      ...baseProject,
      previewImages: ['user-uploads/project1/image1.jpg', 'user-uploads/project1/image2.jpg'],
    };

    render(<ProjectPreviewCollage project={project} />);

    await waitFor(() => {
      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(2);
      expect(images[0]).toHaveAttribute('alt', 'Preview 1');
      expect(images[0]).toHaveAttribute('src', 'https://signed.example.com/user-uploads/user-uploads/project1/image1.jpg');
      expect(images[1]).toHaveAttribute('alt', 'Preview 2');
      expect(images[1]).toHaveAttribute('src', 'https://signed.example.com/user-uploads/user-uploads/project1/image2.jpg');
    });

    // Verify useSignedUrl was called for both images
    expect(mockUseSignedUrl).toHaveBeenCalledWith('user-uploads', 'user-uploads/project1/image1.jpg');
    expect(mockUseSignedUrl).toHaveBeenCalledWith('user-uploads', 'user-uploads/project1/image2.jpg');
  });

  it('displays three images in 2-column layout', async () => {
    const project: Project = {
      ...baseProject,
      previewImages: ['user-uploads/project1/image1.jpg', 'user-uploads/project1/image2.jpg', 'user-uploads/project1/image3.jpg'],
    };

    render(<ProjectPreviewCollage project={project} />);

    await waitFor(() => {
      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(3);
      expect(images[0]).toHaveAttribute('alt', 'Preview 1');
      expect(images[0]).toHaveAttribute('src', 'https://signed.example.com/user-uploads/user-uploads/project1/image1.jpg');
      expect(images[1]).toHaveAttribute('alt', 'Preview 2');
      expect(images[1]).toHaveAttribute('src', 'https://signed.example.com/user-uploads/user-uploads/project1/image2.jpg');
      expect(images[2]).toHaveAttribute('alt', 'Preview 3');
      expect(images[2]).toHaveAttribute('src', 'https://signed.example.com/user-uploads/user-uploads/project1/image3.jpg');
    });

    // Verify useSignedUrl was called for all three images
    expect(mockUseSignedUrl).toHaveBeenCalledWith('user-uploads', 'user-uploads/project1/image1.jpg');
    expect(mockUseSignedUrl).toHaveBeenCalledWith('user-uploads', 'user-uploads/project1/image2.jpg');
    expect(mockUseSignedUrl).toHaveBeenCalledWith('user-uploads', 'user-uploads/project1/image3.jpg');
  });

  it('displays first 4 images in 2x2 grid when 4+ images', async () => {
    const project: Project = {
      ...baseProject,
      previewImages: [
        'user-uploads/project1/image1.jpg',
        'user-uploads/project1/image2.jpg',
        'user-uploads/project1/image3.jpg',
        'user-uploads/project1/image4.jpg',
        'user-uploads/project1/image5.jpg',
      ],
    };

    render(<ProjectPreviewCollage project={project} />);

    await waitFor(() => {
      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(4); // Only first 4 should be shown
      expect(images[0]).toHaveAttribute('alt', 'Preview 1');
      expect(images[0]).toHaveAttribute('src', 'https://signed.example.com/user-uploads/user-uploads/project1/image1.jpg');
      expect(images[1]).toHaveAttribute('alt', 'Preview 2');
      expect(images[1]).toHaveAttribute('src', 'https://signed.example.com/user-uploads/user-uploads/project1/image2.jpg');
      expect(images[2]).toHaveAttribute('alt', 'Preview 3');
      expect(images[2]).toHaveAttribute('src', 'https://signed.example.com/user-uploads/user-uploads/project1/image3.jpg');
      expect(images[3]).toHaveAttribute('alt', 'Preview 4');
      expect(images[3]).toHaveAttribute('src', 'https://signed.example.com/user-uploads/user-uploads/project1/image4.jpg');
    });

    // Verify useSignedUrl was called for first 4 images only
    expect(mockUseSignedUrl).toHaveBeenCalledWith('user-uploads', 'user-uploads/project1/image1.jpg');
    expect(mockUseSignedUrl).toHaveBeenCalledWith('user-uploads', 'user-uploads/project1/image2.jpg');
    expect(mockUseSignedUrl).toHaveBeenCalledWith('user-uploads', 'user-uploads/project1/image3.jpg');
    expect(mockUseSignedUrl).toHaveBeenCalledWith('user-uploads', 'user-uploads/project1/image4.jpg');
    expect(mockUseSignedUrl).not.toHaveBeenCalledWith('user-uploads', 'user-uploads/project1/image5.jpg');
  });

  it('uses MediaThumbnail component for image rendering', () => {
    const project: Project = {
      ...baseProject,
      previewImages: ['user-uploads/project1/image.jpg'],
    };

    render(<ProjectPreviewCollage project={project} />);

    // Should use useSignedUrl hook through MediaThumbnail
    expect(mockUseSignedUrl).toHaveBeenCalledWith('user-uploads', 'user-uploads/project1/image.jpg');
  });
});

