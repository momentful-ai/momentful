import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VideoPlayer } from '../../components/VideoPlayer';
import { ExpiredUrlError } from '../../lib/storage-utils';

// Mock Radix UI components to avoid testing incompatibilities
vi.mock('../../components/ui/slider', () => ({
  Slider: () => <div data-testid="mock-slider" />
}));

vi.mock('../../components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-dropdown-menu">{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-dropdown-trigger">{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-dropdown-item">{children}</div>,
}));

vi.mock('../../components/ui/button', () => ({
  Button: ({ children }: { children: React.ReactNode }) => <button data-testid="mock-button">{children}</button>,
}));

// Mock HTMLVideoElement
const mockVideoElement = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  currentTime: 0,
  duration: 100,
  volume: 1,
  muted: false,
  playbackRate: 1,
  videoWidth: 1920,
  videoHeight: 1080,
  audioTracks: [] as unknown[],
  mozAudioTracks: [] as unknown[],
  webkitAudioTracks: [] as unknown[],
  error: null as MediaError | null,
};

// Mock useSignedUrls hook
const mockUseSignedUrl = vi.fn();
vi.mock('../../hooks/useSignedUrls', () => ({
  useSignedUrls: vi.fn(() => ({
    useSignedUrl: mockUseSignedUrl,
  })),
}));

// Create a custom render function that mocks the video ref
const renderWithVideoMock = (component: React.ReactElement) => {
  const mockRef = { current: mockVideoElement };
  vi.spyOn(React, 'useRef').mockReturnValue(mockRef);

  return render(component);
};

describe('VideoPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSignedUrl.mockReturnValue({
      data: 'https://signed.example.com/video.mp4',
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('renders nothing when no videoUrl is provided', () => {
      const { container } = render(<VideoPlayer videoUrl="" />);
      expect(container.firstChild).toBeNull();
    });

    it('renders video player when videoUrl is provided', () => {
      renderWithVideoMock(<VideoPlayer videoUrl="test-video.mp4" />);
      const video = document.querySelector('video');
      expect(video).toBeInTheDocument();
    });

    it('displays loading spinner initially', () => {
      renderWithVideoMock(<VideoPlayer videoUrl="test-video.mp4" />);
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('renders all UI components', () => {
      renderWithVideoMock(<VideoPlayer videoUrl="test-video.mp4" />);
      expect(screen.getByTestId('mock-slider')).toBeInTheDocument();
      expect(screen.getAllByTestId('mock-button')).toHaveLength(3); // play, settings, fullscreen buttons
      expect(screen.getByTestId('mock-dropdown-menu')).toBeInTheDocument();
    });
  });

  describe('Video Element Setup', () => {
    it('sets up video element with correct attributes', () => {
      renderWithVideoMock(<VideoPlayer videoUrl="test-video.mp4" />);
      const video = document.querySelector('video') as HTMLVideoElement;
      expect(video).toHaveAttribute('src', 'test-video.mp4');
      expect(video).toHaveClass('w-full', 'h-full', 'object-contain');
    });

    it('initializes video element correctly', () => {
      renderWithVideoMock(<VideoPlayer videoUrl="test-video.mp4" />);
      // Component renders and sets up the video element structure correctly
      const video = document.querySelector('video');
      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute('src', 'test-video.mp4');
    });
  });

  describe('State Management', () => {
    it('initializes with correct default state', () => {
      renderWithVideoMock(<VideoPlayer videoUrl="test-video.mp4" />);
      // Component should render without errors and show loading state
      expect(screen.getByText('0:00 / 0:00')).toBeInTheDocument();
    });

    it('updates URL when videoUrl prop changes', () => {
      const { rerender } = renderWithVideoMock(<VideoPlayer videoUrl="test-video.mp4" />);
      expect(document.querySelector('video')).toHaveAttribute('src', 'test-video.mp4');

      // Mock useRef for rerender
      vi.spyOn(React, 'useRef').mockReturnValue({ current: mockVideoElement });
      rerender(<VideoPlayer videoUrl="new-video.mp4" />);
      expect(document.querySelector('video')).toHaveAttribute('src', 'new-video.mp4');
    });
  });

  describe('Component Structure', () => {
    it('has correct container structure', () => {
      renderWithVideoMock(<VideoPlayer videoUrl="test-video.mp4" />);
      const container = document.querySelector('.group');
      expect(container).toHaveClass('relative', 'overflow-hidden', 'rounded-2xl', 'bg-black', 'shadow-2xl');
    });

    it('renders controls overlay', () => {
      renderWithVideoMock(<VideoPlayer videoUrl="test-video.mp4" />);
      const controls = document.querySelector('.absolute.bottom-0');
      expect(controls).toBeInTheDocument();
      expect(controls).toHaveClass('bg-gradient-to-t', 'from-black');
    });

    it('shows loading state when signed URL is loading', () => {
      mockUseSignedUrl.mockReturnValue({
        data: 'https://example.com/video.mp4', // Provide a URL so component renders
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      });

      renderWithVideoMock(<VideoPlayer videoUrl="storage-path" isStoragePath />);
      const spinner = screen.getByTestId('loading-spinner');
      expect(spinner).toBeInTheDocument();
    });

    it('displays error message for ExpiredUrlError', () => {
      const expiredError = new ExpiredUrlError('user-uploads', 'storage-path');

      mockUseSignedUrl.mockReturnValue({
        data: 'https://example.com/video.mp4', // Provide a URL so component renders
        isLoading: false,
        error: expiredError,
        refetch: vi.fn(),
      });

      renderWithVideoMock(<VideoPlayer videoUrl="storage-path" isStoragePath />);

      expect(screen.getByText('Unable to Play Video')).toBeInTheDocument();
      expect(screen.getByText('Refreshing...')).toBeInTheDocument();
    });

    it('displays error message for other errors', () => {
      mockUseSignedUrl.mockReturnValue({
        data: 'https://example.com/video.mp4', // Provide a URL so component renders
        isLoading: false,
        error: new Error('Network error'),
        refetch: vi.fn(),
      });

      renderWithVideoMock(<VideoPlayer videoUrl="storage-path" isStoragePath />);

      expect(screen.getByText('Unable to Play Video')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });
});
