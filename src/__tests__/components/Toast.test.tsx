import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Toast } from '../../components/Toast';

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders success toast correctly', () => {
    const onClose = vi.fn();
    render(<Toast id="toast-1" message="Success message" type="success" onClose={onClose} />);

    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders error toast correctly', () => {
    const onClose = vi.fn();
    render(<Toast id="toast-2" message="Error message" type="error" onClose={onClose} />);

    expect(screen.getByText('Error message')).toBeInTheDocument();
  });

  it('renders warning toast correctly', () => {
    const onClose = vi.fn();
    render(<Toast id="toast-3" message="Warning message" type="warning" onClose={onClose} />);

    expect(screen.getByText('Warning message')).toBeInTheDocument();
  });

  it('renders info toast correctly', () => {
    const onClose = vi.fn();
    render(<Toast id="toast-4" message="Info message" type="info" onClose={onClose} />);

    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('auto-dismisses after default duration', async () => {
    const onClose = vi.fn();
    render(<Toast id="toast-5" message="Auto dismiss" type="success" onClose={onClose} />);

    expect(onClose).not.toHaveBeenCalled();

    // Fast-forward 5 seconds (default duration)
    vi.advanceTimersByTime(5000);

    expect(onClose).toHaveBeenCalledWith('toast-5');
  });

  it('auto-dismisses after custom duration', async () => {
    const onClose = vi.fn();
    render(
      <Toast id="toast-6" message="Custom duration" type="success" duration={3000} onClose={onClose} />
    );

    vi.advanceTimersByTime(3000);

    expect(onClose).toHaveBeenCalledWith('toast-6');
  });

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn();
    render(<Toast id="toast-7" message="Manual close" type="success" onClose={onClose} />);

    const closeButton = screen.getByRole('button');
    closeButton.click();

    expect(onClose).toHaveBeenCalledWith('toast-7');
  });

  it('cleans up timer on unmount', () => {
    const onClose = vi.fn();
    const { unmount } = render(
      <Toast id="toast-8" message="Unmount test" type="success" onClose={onClose} />
    );

    unmount();

    // Fast-forward past duration - onClose should not be called after unmount
    vi.advanceTimersByTime(5000);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('uses correct icon for each toast type', () => {
    const onClose = vi.fn();

    const { rerender } = render(
      <Toast id="toast-9" message="Test" type="success" onClose={onClose} />
    );
    expect(document.querySelector('.text-green-500')).toBeInTheDocument();

    rerender(<Toast id="toast-10" message="Test" type="error" onClose={onClose} />);
    expect(document.querySelector('.text-red-500')).toBeInTheDocument();

    rerender(<Toast id="toast-11" message="Test" type="warning" onClose={onClose} />);
    expect(document.querySelector('.text-orange-500')).toBeInTheDocument();

    rerender(<Toast id="toast-12" message="Test" type="info" onClose={onClose} />);
    expect(document.querySelector('.text-blue-500')).toBeInTheDocument();
  });

  it('uses correct color classes for each toast type', () => {
    const onClose = vi.fn();

    const { rerender } = render(
      <Toast id="toast-13" message="Test" type="success" onClose={onClose} />
    );
    const successContainer = screen.getByText('Test').closest('div');
    expect(successContainer).toHaveClass('bg-green-50', 'border-green-200', 'text-green-800');

    rerender(<Toast id="toast-14" message="Test" type="error" onClose={onClose} />);
    const errorContainer = screen.getByText('Test').closest('div');
    expect(errorContainer).toHaveClass('bg-red-50', 'border-red-200', 'text-red-800');

    rerender(<Toast id="toast-15" message="Test" type="warning" onClose={onClose} />);
    const warningContainer = screen.getByText('Test').closest('div');
    expect(warningContainer).toHaveClass('bg-orange-50', 'border-orange-200', 'text-orange-800');

    rerender(<Toast id="toast-16" message="Test" type="info" onClose={onClose} />);
    const infoContainer = screen.getByText('Test').closest('div');
    expect(infoContainer).toHaveClass('bg-blue-50', 'border-blue-200', 'text-blue-800');
  });
});

