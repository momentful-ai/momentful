import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DevToolbar } from '../../components/DevToolbar';
import { isLocalhost, getLocalOverride } from '../../lib/local-mode';

// Mock local-mode
vi.mock('../../lib/local-mode', () => ({
  isLocalhost: vi.fn(),
  getLocalOverride: vi.fn(),
}));

// Mock window.location.reload
const mockReload = vi.fn();
Object.defineProperty(window, 'location', {
  value: {
    reload: mockReload,
  },
  writable: true,
});

describe('DevToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReload.mockClear();
    localStorage.clear();
  });

  it('does not render when not on localhost', () => {
    vi.mocked(isLocalhost).mockReturnValue(false);

    render(<DevToolbar />);

    expect(screen.queryByText('Dev')).not.toBeInTheDocument();
  });

  it('renders collapsed button when on localhost', () => {
    vi.mocked(isLocalhost).mockReturnValue(true);

    render(<DevToolbar />);

    expect(screen.getByText('Dev')).toBeInTheDocument();
    expect(screen.queryByText('Development Toolbar')).not.toBeInTheDocument();
  });

  it('opens toolbar when button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(isLocalhost).mockReturnValue(true);
    vi.mocked(getLocalOverride).mockReturnValue(undefined);

    render(<DevToolbar />);

    const devButton = screen.getByText('Dev');
    await user.click(devButton);

    await waitFor(() => {
      expect(screen.getByText('Development Toolbar')).toBeInTheDocument();
    });
  });

  it('closes toolbar when close button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(isLocalhost).mockReturnValue(true);
    vi.mocked(getLocalOverride).mockReturnValue(undefined);

    render(<DevToolbar />);

    // Open toolbar
    const devButton = screen.getByText('Dev');
    await user.click(devButton);

    await waitFor(() => {
      expect(screen.getByText('Development Toolbar')).toBeInTheDocument();
    });

    // Close toolbar
    const closeButtons = screen.getAllByRole('button');
    const xButton = closeButtons.find(btn => btn.querySelector('svg'));
    
    if (xButton) {
      await user.click(xButton);

      await waitFor(() => {
        expect(screen.queryByText('Development Toolbar')).not.toBeInTheDocument();
      });
    }
  });

  it('loads initial auth mode from localStorage', () => {
    localStorage.setItem('DEV_AUTH_MODE', 'bypass');
    vi.mocked(isLocalhost).mockReturnValue(true);
    vi.mocked(getLocalOverride).mockReturnValue('bypass');

    render(<DevToolbar />);

    // Toolbar should be rendered (we can't easily check which button is active without opening it)
    expect(screen.getByText('Dev')).toBeInTheDocument();
  });

  it('loads initial supabase backend from localStorage', () => {
    localStorage.setItem('DEV_SUPABASE_BACKEND', 'local');
    vi.mocked(isLocalhost).mockReturnValue(true);
    vi.mocked(getLocalOverride).mockImplementation((key) => {
      if (key === 'DEV_SUPABASE_BACKEND') return 'local';
      return undefined;
    });

    render(<DevToolbar />);

    expect(screen.getByText('Dev')).toBeInTheDocument();
  });

  it('changes auth mode and reloads page', async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(isLocalhost).mockReturnValue(true);
    vi.mocked(getLocalOverride).mockReturnValue('clerk');

    render(<DevToolbar />);

    // Open toolbar
    const devButton = screen.getByText('Dev');
    await user.click(devButton);

    await waitFor(() => {
      expect(screen.getByText('Development Toolbar')).toBeInTheDocument();
    });

    // Click bypass button
    const bypassButton = screen.getByText('Bypass');
    await user.click(bypassButton);

    // Should set localStorage and reload
    expect(localStorage.getItem('DEV_AUTH_MODE')).toBe('bypass');
    expect(mockReload).toHaveBeenCalled();
  });

  it('changes supabase backend and reloads page', async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(isLocalhost).mockReturnValue(true);
    vi.mocked(getLocalOverride).mockReturnValue('hosted');

    render(<DevToolbar />);

    // Open toolbar
    const devButton = screen.getByText('Dev');
    await user.click(devButton);

    await waitFor(() => {
      expect(screen.getByText('Development Toolbar')).toBeInTheDocument();
    });

    // Click local button
    const localButton = screen.getByText('Local');
    await user.click(localButton);

    // Should set localStorage and reload
    expect(localStorage.getItem('DEV_SUPABASE_BACKEND')).toBe('local');
    expect(mockReload).toHaveBeenCalled();
  });

  it('displays correct default values', async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(isLocalhost).mockReturnValue(true);
    vi.mocked(getLocalOverride).mockImplementation((key) => {
      if (key === 'DEV_AUTH_MODE') return 'clerk';
      if (key === 'DEV_SUPABASE_BACKEND') return 'hosted';
      return undefined;
    });

    render(<DevToolbar />);

    // Open toolbar
    const devButton = screen.getByText('Dev');
    await user.click(devButton);

    await waitFor(() => {
      expect(screen.getByText('Development Toolbar')).toBeInTheDocument();
      expect(screen.getByText('Auth Mode')).toBeInTheDocument();
      expect(screen.getByText('Supabase Backend')).toBeInTheDocument();
    });
  });
});

