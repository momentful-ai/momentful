import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ImagePreviewSkeleton, VideoPreviewSkeleton } from '../../components/UnifiedMediaEditor/MediaPreviewSkeletons';

describe('ImagePreviewSkeleton', () => {
  it('renders with default className', () => {
    const { container } = render(<ImagePreviewSkeleton />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('relative', 'overflow-hidden', 'rounded-xl');
  });

  it('applies custom className', () => {
    const { container } = render(<ImagePreviewSkeleton className="custom-class" />);
    const skeleton = container.firstChild as HTMLElement;

    expect(skeleton).toHaveClass('custom-class');
  });

  it('has shimmer animation element', () => {
    const { container } = render(<ImagePreviewSkeleton />);
    const shimmerElement = container.querySelector('.ai-shimmer');

    expect(shimmerElement).toBeInTheDocument();
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

  it('has shimmer animation element', () => {
    const { container } = render(<VideoPreviewSkeleton aspectRatio="16:9" />);
    const shimmerElement = container.querySelector('.ai-shimmer');

    expect(shimmerElement).toBeInTheDocument();
  });

  it('does not throw when aspectRatio is provided but not used', () => {
    expect(() => {
      render(<VideoPreviewSkeleton aspectRatio="16:9" />);
    }).not.toThrow();
  });
});

