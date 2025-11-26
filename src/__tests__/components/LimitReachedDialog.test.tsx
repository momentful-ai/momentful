import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LimitReachedDialog } from '../../components/LimitReachedDialog';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  AlertCircle: () => <div data-testid="alert-icon">⚠️</div>,
}));

// Mock the utils function
vi.mock('../../lib/utils', () => ({
  mergeName: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' '),
}));

describe('LimitReachedDialog', () => {
  const defaultProps = {
    type: 'images' as const,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering - Images', () => {
    it('renders dialog with correct content for images', () => {
      render(<LimitReachedDialog {...defaultProps} />);

      expect(screen.getByText('Image Generation Limit Reached')).toBeInTheDocument();
      expect(screen.getByText(`You’ve maxed out your image credits :( Message the Momentful crew at hello@momentful.ai to unlock more.`)).toBeInTheDocument();
      expect(screen.getByText('OK')).toBeInTheDocument();
    });

    it('renders dialog with correct content for videos', () => {
      render(<LimitReachedDialog {...defaultProps} type="videos" />);

      expect(screen.getByText('Video Generation Limit Reached')).toBeInTheDocument();
      expect(screen.getByText(`You’ve maxed out your video credits :(Message the Momentful crew at hello@momentful.ai to unlock more.`)).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('renders alert icon', () => {
      render(<LimitReachedDialog {...defaultProps} />);

      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
    });

    it('applies backdrop styling', () => {
      render(<LimitReachedDialog {...defaultProps} />);

      const backdrop = screen.getByText('Image Generation Limit Reached').parentElement?.parentElement;
      expect(backdrop).toHaveClass('fixed inset-0 bg-black/60 backdrop-blur-sm');
    });

    it('applies glass card styling to dialog container', () => {
      render(<LimitReachedDialog {...defaultProps} />);

      const dialog = screen.getByText('Image Generation Limit Reached').closest('.glass-card');
      expect(dialog).toBeInTheDocument();
    });

    it('applies primary color scheme for both types', () => {
      render(<LimitReachedDialog {...defaultProps} />);

      const iconContainer = screen.getByTestId('alert-icon').parentElement;
      expect(iconContainer).toHaveClass('bg-primary/10');
    });
  });

  describe('Button Interactions', () => {
    it('calls onClose when OK button is clicked', () => {
      render(<LimitReachedDialog {...defaultProps} />);

      const okButton = screen.getByText('OK');
      fireEvent.click(okButton);

      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    it('has proper button styling', () => {
      render(<LimitReachedDialog {...defaultProps} />);

      const okButton = screen.getByText('OK');
      expect(okButton).toHaveClass('bg-primary');
      expect(okButton.tagName).toBe('BUTTON');
    });
  });

  describe('Animations', () => {
    it('applies fade-in animation to backdrop', () => {
      render(<LimitReachedDialog {...defaultProps} />);

      const backdrop = screen.getByText('Image Generation Limit Reached').closest('.animate-fade-in');
      expect(backdrop).toBeInTheDocument();
    });

    it('applies scale-in animation to dialog', () => {
      render(<LimitReachedDialog {...defaultProps} />);

      const dialog = screen.getByText('Image Generation Limit Reached').closest('.animate-scale-in');
      expect(dialog).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper button role and size', () => {
      render(<LimitReachedDialog {...defaultProps} />);

      const okButton = screen.getByText('OK');
      expect(okButton.tagName).toBe('BUTTON');
      expect(okButton).toHaveClass('min-w-[120px]');
    });

    it('centers dialog with responsive padding', () => {
      render(<LimitReachedDialog {...defaultProps} />);

      const container = screen.getByText('Image Generation Limit Reached').closest('.flex.items-center.justify-center');
      expect(container).toHaveClass('z-50 p-4');
    });
  });
});