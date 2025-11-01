import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../../contexts/ToastProvider';
import { useToast } from '../../hooks/useToast';
import type { ToastProps } from '../../components/Toast';

interface MockToastProps {
  id: string;
  message: string;
  type: ToastProps['type'];
  onClose: (id: string) => void;
}

// Mock the Toast component to simplify tests
vi.mock('../../components/Toast', () => ({
  Toast: ({ id, message, type, onClose }: MockToastProps) => (
    <div data-testid={`toast-${id}`} data-type={type}>
      {message}
      <button onClick={() => onClose(id)}>Close</button>
    </div>
  ),
}));

// Test component that uses the toast hook
function TestComponent() {
  const { showToast } = useToast();

  return (
    <div>
      <button onClick={() => showToast('Test message', 'success')}>Show Success</button>
      <button onClick={() => showToast('Error occurred', 'error')}>Show Error</button>
      <button onClick={() => showToast('Warning message', 'warning')}>Show Warning</button>
      <button onClick={() => showToast('Info message', 'info')}>Show Info</button>
    </div>
  );
}

describe('ToastContainer / ToastProvider', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders children without toasts initially', () => {
    render(
      <ToastProvider>
        <div>Test Content</div>
      </ToastProvider>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.queryByTestId(/toast-/)).not.toBeInTheDocument();
  });

  it('displays toast when showToast is called', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const showButton = screen.getByText('Show Success');
    await user.click(showButton);

    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    const toast = screen.getByTestId(/toast-/);
    expect(toast).toHaveAttribute('data-type', 'success');
  });

  it('displays multiple toasts', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await user.click(screen.getByText('Show Success'));
    await user.click(screen.getByText('Show Error'));

    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
      expect(screen.getByText('Error occurred')).toBeInTheDocument();
    });

    const toasts = screen.getAllByTestId(/toast-/);
    expect(toasts).toHaveLength(2);
  });

  it('removes toast when closed', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await user.click(screen.getByText('Show Success'));

    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    const closeButtons = screen.getAllByText('Close');
    await user.click(closeButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText('Test message')).not.toBeInTheDocument();
    });
  });

  it('supports all toast types', async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    await user.click(screen.getByText('Show Success'));
    await user.click(screen.getByText('Show Error'));
    await user.click(screen.getByText('Show Warning'));
    await user.click(screen.getByText('Show Info'));

    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument();
      expect(screen.getByText('Error occurred')).toBeInTheDocument();
      expect(screen.getByText('Warning message')).toBeInTheDocument();
      expect(screen.getByText('Info message')).toBeInTheDocument();
    });

    const toasts = screen.getAllByTestId(/toast-/);
    expect(toasts).toHaveLength(4);
    
    const types = toasts.map(toast => toast.getAttribute('data-type'));
    expect(types).toContain('success');
    expect(types).toContain('error');
    expect(types).toContain('warning');
    expect(types).toContain('info');
  });

  it('provides showToast function through context', () => {
    let contextValue: ReturnType<typeof useToast> | undefined;
    function TestConsumer() {
      contextValue = useToast();
      return null;
    }

    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );

    expect(contextValue).toBeDefined();
    expect(contextValue?.showToast).toBeInstanceOf(Function);
  });
});

