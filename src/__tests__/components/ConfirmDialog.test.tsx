import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfirmDialog } from '../../components/ConfirmDialog';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  AlertCircle: () => <div data-testid="alert-icon">⚠️</div>,
}));

// Mock the utils function
vi.mock('../../lib/utils', () => ({
  mergeName: (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' '),
}));

describe('ConfirmDialog', () => {
  const defaultProps = {
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    confirmText: 'Yes, proceed',
    cancelText: 'Cancel',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    type: 'warning' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders dialog with correct content', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
      expect(screen.getByText('Yes, proceed')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('renders alert icon', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByTestId('alert-icon')).toBeInTheDocument();
    });

    it('applies backdrop styling', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const backdrop = screen.getByText('Confirm Action').parentElement?.parentElement;
      expect(backdrop).toHaveClass('fixed inset-0 bg-black/60 backdrop-blur-sm');
    });
  });

  describe('Dialog Types', () => {
    it('applies warning type styling', () => {
      render(<ConfirmDialog {...defaultProps} type="warning" />);

      const iconContainer = screen.getByTestId('alert-icon').parentElement;
      expect(iconContainer).toHaveClass('bg-accent/10');

      const confirmButton = screen.getByText('Yes, proceed');
      expect(confirmButton).toHaveClass('bg-primary');
    });

    it('applies danger type styling', () => {
      render(<ConfirmDialog {...defaultProps} type="danger" />);

      const iconContainer = screen.getByTestId('alert-icon').parentElement;
      expect(iconContainer).toHaveClass('bg-destructive/10');

      const confirmButton = screen.getByText('Yes, proceed');
      expect(confirmButton).toHaveClass('bg-destructive');
    });

    it('applies info type styling', () => {
      render(<ConfirmDialog {...defaultProps} type="info" />);

      const iconContainer = screen.getByTestId('alert-icon').parentElement;
      expect(iconContainer).toHaveClass('bg-primary/10');

      const confirmButton = screen.getByText('Yes, proceed');
      expect(confirmButton).toHaveClass('bg-primary');
    });
  });

  describe('Button Interactions', () => {
    it('calls onConfirm when confirm button is clicked', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const confirmButton = screen.getByText('Yes, proceed');
      fireEvent.click(confirmButton);

      expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
      expect(defaultProps.onCancel).not.toHaveBeenCalled();
    });

    it('calls onCancel when cancel button is clicked', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
      expect(defaultProps.onConfirm).not.toHaveBeenCalled();
    });
  });

  describe('Custom Button Text', () => {
    it('uses custom confirm text', () => {
      render(<ConfirmDialog {...defaultProps} confirmText="Delete Forever" />);

      expect(screen.getByText('Delete Forever')).toBeInTheDocument();
      expect(screen.queryByText('Yes, proceed')).not.toBeInTheDocument();
    });

    it('uses custom cancel text', () => {
      render(<ConfirmDialog {...defaultProps} cancelText="Nevermind" />);

      expect(screen.getByText('Nevermind')).toBeInTheDocument();
      expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
    });
  });

  describe('Default Button Text', () => {
    it('uses default confirm text when not provided', () => {
      const propsWithoutConfirmText = {
        ...defaultProps,
        confirmText: undefined,
      };

      render(<ConfirmDialog {...propsWithoutConfirmText} />);

      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    it('uses default cancel text when not provided', () => {
      const propsWithoutCancelText = {
        ...defaultProps,
        cancelText: undefined,
      };

      render(<ConfirmDialog {...propsWithoutCancelText} />);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('applies glass card styling to dialog container', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const dialog = screen.getByText('Confirm Action').closest('.glass-card');
      expect(dialog).toBeInTheDocument();
    });

    it('centers dialog with responsive padding', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const container = screen.getByText('Confirm Action').closest('.flex.items-center.justify-center');
      expect(container).toHaveClass('z-50 p-4');
    });

    it('applies fade-in animation', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const container = screen.getByText('Confirm Action').closest('.animate-fade-in');
      expect(container).toBeInTheDocument();
    });

    it('applies scale-in animation to dialog', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const dialog = screen.getByText('Confirm Action').closest('.animate-scale-in');
      expect(dialog).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper button roles', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const confirmButton = screen.getByText('Yes, proceed');
      const cancelButton = screen.getByText('Cancel');

      expect(confirmButton.tagName).toBe('BUTTON');
      expect(cancelButton.tagName).toBe('BUTTON');
    });

    it('applies correct button sizing', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const confirmButton = screen.getByText('Yes, proceed');
      const cancelButton = screen.getByText('Cancel');

      expect(confirmButton).toHaveClass('h-11');
      expect(cancelButton).toHaveClass('h-11');
    });

    it('makes buttons equally sized', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const confirmButton = screen.getByText('Yes, proceed');
      const cancelButton = screen.getByText('Cancel');

      expect(confirmButton).toHaveClass('flex-1');
      expect(cancelButton).toHaveClass('flex-1');
    });
  });
});
