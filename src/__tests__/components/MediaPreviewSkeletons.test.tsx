import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ImagePreviewSkeleton, VideoPreviewSkeleton } from '../../components/UnifiedMediaEditor/MediaPreviewSkeletons';

describe('ImagePreviewSkeleton', () => {
  it('renders with default className', () => {
    const { container } = render(<ImagePreviewSkeleton />);
    const skeleton = container.firstChild as HTMLElement;
    
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('relative', 'overflow-hidden', 'rounded-xl', 'bg-muted');
  });

  it('applies custom className', () => {
    const { container } = render(<ImagePreviewSkeleton className="custom-class" />);
    const skeleton = container.firstChild as HTMLElement;
    
    expect(skeleton).toHaveClass('custom-class');
  });

  it('has shimmer animation element with correct styles', () => {
    const { container } = render(<ImagePreviewSkeleton />);
    const shimmerElement = container.querySelector('.absolute.inset-0') as HTMLElement;
    
    expect(shimmerElement).toBeInTheDocument();
    expect(shimmerElement.style.background).toContain('linear-gradient');
    expect(shimmerElement.style.backgroundSize).toBe('200% 100%');
    expect(shimmerElement.style.backgroundPosition).toBe('-200% 0px');
    expect(shimmerElement.style.animation).toBe('shimmer 2s linear infinite');
  });

  it('has gradient with correct opacity values', () => {
    const { container } = render(<ImagePreviewSkeleton />);
    const shimmerElement = container.querySelector('.absolute.inset-0') as HTMLElement;
    const backgroundStyle = shimmerElement.style.background;
    
    expect(backgroundStyle).toContain('rgba(255, 255, 255, 0.1)');
    expect(backgroundStyle).toContain('rgba(255, 255, 255, 0.3)');
    expect(backgroundStyle).toContain('transparent');
  });
});

describe('VideoPreviewSkeleton', () => {
  it('renders with default className', () => {
    const { container } = render(<VideoPreviewSkeleton aspectRatio="16:9" />);
    const skeleton = container.firstChild as HTMLElement;
    
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('absolute', 'inset-0');
  });

  it('applies custom className', () => {
    const { container } = render(<VideoPreviewSkeleton aspectRatio="9:16" className="custom-video-class" />);
    const skeleton = container.firstChild as HTMLElement;
    
    expect(skeleton).toHaveClass('custom-video-class');
  });

  it('accepts all aspect ratio types', () => {
    const ratios: Array<'16:9' | '9:16' | '1:1' | '4:5'> = ['16:9', '9:16', '1:1', '4:5'];
    
    ratios.forEach((ratio) => {
      const { container } = render(<VideoPreviewSkeleton aspectRatio={ratio} />);
      const skeleton = container.firstChild as HTMLElement;
      
      expect(skeleton).toBeInTheDocument();
    });
  });

  it('has shimmer animation element with correct styles', () => {
    const { container } = render(<VideoPreviewSkeleton aspectRatio="16:9" />);
    // VideoPreviewSkeleton has nested structure: parent div > child shimmer div
    const shimmerElement = container.querySelector('.absolute.inset-0[style*="linear-gradient"]') as HTMLElement;
    
    expect(shimmerElement).toBeInTheDocument();
    expect(shimmerElement.style.background).toContain('linear-gradient');
    expect(shimmerElement.style.backgroundSize).toBe('200% 100%');
    expect(shimmerElement.style.backgroundPosition).toBe('-200% 0px');
    expect(shimmerElement.style.animation).toBe('shimmer 2s linear infinite');
  });

  it('has gradient with correct opacity values', () => {
    const { container } = render(<VideoPreviewSkeleton aspectRatio="1:1" />);
    // VideoPreviewSkeleton has nested structure: parent div > child shimmer div
    const shimmerElement = container.querySelector('.absolute.inset-0[style*="linear-gradient"]') as HTMLElement;
    const backgroundStyle = shimmerElement.style.background;
    
    expect(backgroundStyle).toContain('rgba(255, 255, 255, 0.1)');
    expect(backgroundStyle).toContain('rgba(255, 255, 255, 0.3)');
    expect(backgroundStyle).toContain('transparent');
  });

  it('does not throw when aspectRatio is provided but not used', () => {
    expect(() => {
      render(<VideoPreviewSkeleton aspectRatio="16:9" />);
    }).not.toThrow();
  });
});

