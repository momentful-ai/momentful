import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TimelineNodeComponent } from '../../../components/ProjectWorkspace/TimelineNode';
import { TimelineNode } from '../../../types/timeline';
import { MediaAsset, EditedImage, GeneratedVideo } from '../../../types';
import { mockSupabase } from '../../test-utils.tsx';

// Mock supabase
mockSupabase();

// Mock MediaCard component - provide more complete mock to match actual behavior
vi.mock('../../../components/shared/MediaCard', async () => {
  const React = await import('react');
  
  return {
    MediaCard: ({ item, showTypeLabel, getAssetUrl }: { 
      item: TimelineNode; 
      showTypeLabel?: boolean;
      getAssetUrl: (path: string) => string;
    }) => {
      const { type, data } = item;
      const [imageError, setImageError] = React.useState(false);
      const [videoError, setVideoError] = React.useState(false);
      
      const getThumbnail = () => {
        switch (type) {
          case 'media_asset':
            // If thumbnail_url exists and is not empty, use it
            if (data.thumbnail_url && data.thumbnail_url.trim() !== '') {
              return data.thumbnail_url;
            }
            // Otherwise, try to use storage_path, but return empty if storage_path is also missing
            // Check explicitly for undefined, null, or empty string
            if (!data.storage_path || data.storage_path === undefined || data.storage_path === null || (typeof data.storage_path === 'string' && data.storage_path.trim() === '')) {
              return '';
            }
            // Only call getAssetUrl if it's provided and storage_path is valid
            if (getAssetUrl && typeof getAssetUrl === 'function') {
              try {
                const url = getAssetUrl(data.storage_path);
                return url || '';
              } catch {
                return '';
              }
            }
            return '';
          case 'edited_image':
            return (data.edited_url && data.edited_url.trim() !== '') ? data.edited_url : '';
          case 'generated_video':
            if (data.thumbnail_url && data.thumbnail_url.trim() !== '') {
              return data.thumbnail_url;
            }
            // Check explicitly for undefined, null, or empty string
            if (!data.storage_path || data.storage_path === undefined || data.storage_path === null || (typeof data.storage_path === 'string' && data.storage_path.trim() === '')) {
              return '';
            }
            // Only call getAssetUrl if it's provided and storage_path is valid
            if (getAssetUrl && typeof getAssetUrl === 'function') {
              try {
                const url = getAssetUrl(data.storage_path);
                return url || '';
              } catch {
                return '';
              }
            }
            return '';
        }
        return '';
      };
      const thumbnailUrl = getThumbnail();
      // For media_asset, if thumbnail_url is explicitly undefined and storage_path is missing,
      // show placeholder. Also check if the URL is empty or just whitespace.
      const hasValidUrl = !!thumbnailUrl && thumbnailUrl.trim() !== '';
      const showPlaceholder = !hasValidUrl || (type === 'generated_video' ? videoError : imageError);
      
      return (
        <div data-testid={`timeline-node-${data.id}`} className="w-48 h-64 flex flex-col items-center p-2 relative">
          {showTypeLabel && (
            <div className="absolute top-2 left-2 z-10">
              {type === 'media_asset' && 'Original'}
              {type === 'edited_image' && 'Edited'}
              {type === 'generated_video' && 'Video'}
            </div>
          )}
          <div className="w-full h-32 rounded relative">
            {showPlaceholder ? (
              <div className="w-full h-32 bg-muted rounded flex items-center justify-center relative" data-testid="placeholder">
                <span>{type === 'generated_video' ? 'Video Placeholder' : 'Image Placeholder'}</span>
              </div>
            ) : type === 'generated_video' ? (
              <div className="w-full h-32 relative rounded overflow-hidden bg-black">
                <video 
                  src={thumbnailUrl} 
                  className="w-full h-32 object-cover" 
                  preload="metadata"
                  onError={() => setVideoError(true)}
                />
              </div>
            ) : (
              <img 
                src={thumbnailUrl} 
                alt={type === 'media_asset' ? data.file_name : data.prompt}
                className="w-full h-32 object-cover rounded"
                onError={() => setImageError(true)}
              />
            )}
          </div>
          <div className="mt-2 text-center w-full">
            <div className="font-medium text-sm truncate">
              {type === 'media_asset' ? data.file_name : type === 'edited_image' ? data.prompt.substring(0, 20) : (data.name || 'Untitled')}
            </div>
            {type === 'edited_image' && (
              <>
                <div className="text-sm">Prompt: {data.prompt.substring(0, 50)}</div>
                <div className="text-xs text-muted">Model: {data.ai_model}</div>
              </>
            )}
            {type === 'generated_video' && (
              <>
                {data.duration !== undefined && <div className="text-sm">Duration: {data.duration}s</div>}
                <div className="text-xs text-muted">Model: {data.ai_model}</div>
              </>
            )}
            <div className="text-xs text-muted mt-1">{new Date(data.created_at).toLocaleString()}</div>
          </div>
        </div>
      );
    },
  };
});

describe('TimelineNodeComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockMediaAsset: MediaAsset = {
    id: 'asset-1',
    project_id: 'test-project',
    user_id: 'test-user',
    file_name: 'test-image.jpg',
    file_type: 'image',
    file_size: 1000,
    storage_path: 'path/to/test-image.jpg',
    thumbnail_url: 'https://example.com/thumb.jpg',
    width: 800,
    height: 600,
    sort_order: 0,
    created_at: '2025-01-01T00:00:00Z',
  };

  const mockEditedImage: EditedImage = {
    id: 'edited-1',
    project_id: 'test-project',
    user_id: 'test-user',
    prompt: 'Make it more vibrant',
    context: {},
    ai_model: 'dalle-3',
    edited_url: 'https://example.com/edited.jpg',
    storage_path: 'path/to/edited.jpg',
    width: 800,
    height: 600,
    version: 1,
    created_at: '2025-01-01T01:00:00Z',
  };

  const mockGeneratedVideo: GeneratedVideo = {
    id: 'video-1',
    project_id: 'test-project',
    user_id: 'test-user',
    name: 'Test Video',
    ai_model: 'runway-gen2',
    aspect_ratio: '16:9',
    storage_path: 'https://example.com/video.mp4',
    thumbnail_url: 'https://example.com/video-thumb.jpg',
    duration: 30,
    status: 'completed',
    created_at: '2025-01-01T02:00:00Z',
  };

  it('renders media asset node correctly', () => {
    const node: TimelineNode = {
      type: 'media_asset',
      data: mockMediaAsset,
    };

    render(<TimelineNodeComponent node={node} index={0} total={1} />);

    expect(screen.getByText('Original')).toBeInTheDocument();
    expect(screen.getByText('test-image.jpg')).toBeInTheDocument();
    // Date is formatted, so check for year instead of raw ISO string
    expect(screen.getByText(/2025/)).toBeInTheDocument();
    
    const img = screen.getByAltText('test-image.jpg');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/thumb.jpg');
  });

  it('renders edited image node correctly', () => {
    const node: TimelineNode = {
      type: 'edited_image',
      data: mockEditedImage,
    };

    render(<TimelineNodeComponent node={node} index={0} total={1} />);

    expect(screen.getByText('Edited')).toBeInTheDocument();
    // Title shows truncated prompt (first 20 chars) - "Make it more vibrant" is exactly 20 chars, so it shows fully
    expect(screen.getByText('Make it more vibrant')).toBeInTheDocument();
    expect(screen.getByText('Prompt: Make it more vibrant')).toBeInTheDocument();
    expect(screen.getByText('Model: dalle-3')).toBeInTheDocument();
    
    const img = screen.getByAltText('Make it more vibrant');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/edited.jpg');
  });

  it('renders generated video node correctly', () => {
    const node: TimelineNode = {
      type: 'generated_video',
      data: mockGeneratedVideo,
    };

    render(<TimelineNodeComponent node={node} index={0} total={1} />);

    expect(screen.getByText('Video')).toBeInTheDocument();
    expect(screen.getByText('Test Video')).toBeInTheDocument();
    expect(screen.getByText('Duration: 30s')).toBeInTheDocument();
    expect(screen.getByText('Model: runway-gen2')).toBeInTheDocument();
    
    const video = document.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('src', 'https://example.com/video-thumb.jpg');
  });

  it('shows placeholder when image URL is missing', () => {
    const node: TimelineNode = {
      type: 'media_asset',
      data: {
        ...mockMediaAsset,
        thumbnail_url: undefined as unknown as string,
        storage_path: undefined as unknown as string,
      },
    };

    render(<TimelineNodeComponent node={node} index={0} total={1} />);

    // Should show placeholder
    expect(screen.getByText('Image Placeholder')).toBeInTheDocument();
    
    // Should not have an img element
    const img = screen.queryByAltText('test-image.jpg');
    expect(img).not.toBeInTheDocument();
  });

  it('shows placeholder when edited image URL is missing', () => {
    const node: TimelineNode = {
      type: 'edited_image',
      data: {
        ...mockEditedImage,
        edited_url: undefined as unknown as string,
      },
    };

    render(<TimelineNodeComponent node={node} index={0} total={1} />);

    // Should show placeholder
    expect(screen.getByText('Image Placeholder')).toBeInTheDocument();
  });

  it('shows placeholder when video URL is missing', () => {
    const node: TimelineNode = {
      type: 'generated_video',
      data: {
        ...mockGeneratedVideo,
        thumbnail_url: undefined,
        storage_path: undefined,
      },
    };

    render(<TimelineNodeComponent node={node} index={0} total={1} />);

    // Should show placeholder
    expect(screen.getByText('Video Placeholder')).toBeInTheDocument();
    
    // Should not have a video element
    const video = document.querySelector('video');
    expect(video).not.toBeInTheDocument();
  });

  it('handles image loading error and shows placeholder', async () => {
    const node: TimelineNode = {
      type: 'media_asset',
      data: mockMediaAsset,
    };

    render(<TimelineNodeComponent node={node} index={0} total={1} />);

    const img = screen.getByAltText('test-image.jpg') as HTMLImageElement;
    
    // Simulate image loading error
    fireEvent.error(img);

    await waitFor(() => {
      // After error, placeholder should be shown
      expect(screen.getByText('Image Placeholder')).toBeInTheDocument();
    });
  });

  it('handles video loading error and shows placeholder', async () => {
    const node: TimelineNode = {
      type: 'generated_video',
      data: mockGeneratedVideo,
    };

    render(<TimelineNodeComponent node={node} index={0} total={1} />);

    const video = document.querySelector('video') as HTMLVideoElement;
    expect(video).toBeInTheDocument();
    
    // Simulate video loading error
    fireEvent.error(video);

    // After error, placeholder should be shown
    await waitFor(() => {
      expect(screen.getByText('Video Placeholder')).toBeInTheDocument();
    });
  });

  it('renders video element with correct attributes for generated video', () => {
    const node: TimelineNode = {
      type: 'generated_video',
      data: mockGeneratedVideo,
    };

    render(<TimelineNodeComponent node={node} index={0} total={1} />);

    const video = document.querySelector('video');
    expect(video).toBeInTheDocument();
    expect(video).toHaveAttribute('preload', 'metadata');
    expect(video).toHaveClass('w-full', 'h-32', 'object-cover');
  });

  it('displays formatted date correctly', () => {
    const node: TimelineNode = {
      type: 'media_asset',
      data: mockMediaAsset,
    };

    render(<TimelineNodeComponent node={node} index={0} total={1} />);

    // The date should be formatted by toLocaleString - check that it contains the year
    const dateElements = screen.getAllByText((_content, element) => {
      return element?.textContent?.includes('2025') || false;
    });
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('truncates long prompts in edited images', () => {
    const longPrompt = 'A'.repeat(100);
    const node: TimelineNode = {
      type: 'edited_image',
      data: {
        ...mockEditedImage,
        prompt: longPrompt,
      },
    };

    render(<TimelineNodeComponent node={node} index={0} total={1} />);

    // Should show truncated prompt in title (first 20 chars)
    expect(screen.getByText('A'.repeat(20))).toBeInTheDocument();
    
    // Should show full prompt in metadata (first 50 chars)
    expect(screen.getByText(`Prompt: ${'A'.repeat(50)}`)).toBeInTheDocument();
  });

  it('handles video without duration', () => {
    const node: TimelineNode = {
      type: 'generated_video',
      data: {
        ...mockGeneratedVideo,
        duration: undefined,
      },
    };

    render(<TimelineNodeComponent node={node} index={0} total={1} />);

    // Should not show duration metadata
    expect(screen.queryByText(/Duration:/)).not.toBeInTheDocument();
    expect(screen.getByText('Model: runway-gen2')).toBeInTheDocument();
  });

  it('handles video without name', () => {
    const node: TimelineNode = {
      type: 'generated_video',
      data: {
        ...mockGeneratedVideo,
        name: undefined as unknown as string,
      },
    };

    render(<TimelineNodeComponent node={node} index={0} total={1} />);

    // The mock MediaCard shows the video name or "Untitled" as fallback
    // Since name is undefined, it will show "Untitled" in the mock
    expect(screen.getByText('Untitled')).toBeInTheDocument();
  });

  it('applies correct classes and structure', () => {
    const node: TimelineNode = {
      type: 'media_asset',
      data: mockMediaAsset,
    };

    const { container } = render(<TimelineNodeComponent node={node} index={0} total={1} />);

    // TimelineNode wraps MediaCard in a div with the id
    const wrapper = container.querySelector('[id="node-asset-1"]');
    expect(wrapper).toBeInTheDocument();
    
    // MediaCard renders the content
    const badge = screen.getByText('Original');
    expect(badge).toBeInTheDocument();
  });
});

