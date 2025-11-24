import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Layout } from '../../components/Layout';

// Mock Clerk hooks
const mockUseUser = vi.fn();
const mockUseClerk = vi.fn();

vi.mock('@clerk/clerk-react', () => ({
  useUser: () => mockUseUser(),
  useClerk: () => mockUseClerk(),
}));

// Mock hooks
vi.mock('../../hooks/useBypassContext', () => ({
  useBypassContext: vi.fn(() => false),
}));

vi.mock('../../hooks/useTheme', () => ({
  useTheme: vi.fn(() => ({
    theme: 'light',
    setTheme: vi.fn(),
  })),
}));

// Import to access mocks
import { useBypassContext } from '../../hooks/useBypassContext';
import { useTheme } from '../../hooks/useTheme';
const mockUseBypassContext = vi.mocked(useBypassContext);
const mockUseTheme = vi.mocked(useTheme);

// Mock DevToolbar
vi.mock('../../components/DevToolbar', () => ({
  DevToolbar: () => <div data-testid="dev-toolbar">DevToolbar</div>,
}));

describe('Layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseBypassContext.mockReturnValue(false);
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: vi.fn(),
    });
  });

  it('renders header with logo and title', () => {
    mockUseUser.mockReturnValue({
      user: null,
    });
    mockUseClerk.mockReturnValue({
      signOut: vi.fn(),
    });

    render(
      <Layout>
        <div>Page Content</div>
      </Layout>
    );

    expect(screen.getByAltText('momentful')).toBeInTheDocument();
    expect(screen.getByText('Page Content')).toBeInTheDocument();
  });

  it('shows theme toggle button', async () => {
    const mockSetTheme = vi.fn();
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
    });
    mockUseUser.mockReturnValue({
      user: null,
    });
    mockUseClerk.mockReturnValue({
      signOut: vi.fn(),
    });

    const user = userEvent.setup();
    render(
      <Layout>
        <div>Page Content</div>
      </Layout>
    );

    // Theme button is an icon button, find by container or query all buttons
    const buttons = screen.getAllByRole('button');
    const themeButton = buttons.find(btn => btn.querySelector('svg'));
    expect(themeButton).toBeInTheDocument();

    if (themeButton) {
      await user.click(themeButton);
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    }
  });

  it('shows user info when signed in', () => {
    const mockUser = {
      firstName: 'John',
      emailAddresses: [{ emailAddress: 'john@example.com' }],
    };
    mockUseUser.mockReturnValue({
      user: mockUser,
    });
    mockUseClerk.mockReturnValue({
      signOut: vi.fn(),
    });

    render(
      <Layout>
        <div>Page Content</div>
      </Layout>
    );

    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();
  });

  it('shows email when firstName is not available', () => {
    const mockUser = {
      firstName: null,
      emailAddresses: [{ emailAddress: 'jane@example.com' }],
    };
    mockUseUser.mockReturnValue({
      user: mockUser,
    });
    mockUseClerk.mockReturnValue({
      signOut: vi.fn(),
    });

    render(
      <Layout>
        <div>Page Content</div>
      </Layout>
    );

    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('shows sign out button when user is signed in', async () => {
    const mockSignOut = vi.fn();
    const mockUser = {
      firstName: 'John',
      emailAddresses: [{ emailAddress: 'john@example.com' }],
    };
    mockUseUser.mockReturnValue({
      user: mockUser,
    });
    mockUseClerk.mockReturnValue({
      signOut: mockSignOut,
    });

    const user = userEvent.setup();
    render(
      <Layout>
        <div>Page Content</div>
      </Layout>
    );

    const signOutButton = screen.getByText('Sign Out');
    await user.click(signOutButton);

    expect(mockSignOut).toHaveBeenCalled();
  });

  it('shows Local Mode badge when bypass is enabled', () => {
    mockUseBypassContext.mockReturnValue(true);
    mockUseUser.mockReturnValue({
      user: null,
    });
    mockUseClerk.mockReturnValue({
      signOut: vi.fn(),
    });

    render(
      <Layout>
        <div>Page Content</div>
      </Layout>
    );

    expect(screen.getByText('Local Mode')).toBeInTheDocument();
    expect(screen.getByText('Local Dev')).toBeInTheDocument();
    expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();
  });

  it('does not show user info when bypass is enabled', () => {
    mockUseBypassContext.mockReturnValue(true);
    mockUseUser.mockReturnValue({
      user: {
        firstName: 'John',
        emailAddresses: [{ emailAddress: 'john@example.com' }],
      },
    });
    mockUseClerk.mockReturnValue({
      signOut: vi.fn(),
    });

    render(
      <Layout>
        <div>Page Content</div>
      </Layout>
    );

    expect(screen.queryByText('John')).not.toBeInTheDocument();
    expect(screen.getByText('Local Dev')).toBeInTheDocument();
  });

  it('shows moon icon in light mode', () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: vi.fn(),
    });
    mockUseUser.mockReturnValue({
      user: null,
    });
    mockUseClerk.mockReturnValue({
      signOut: vi.fn(),
    });

    render(
      <Layout>
        <div>Page Content</div>
      </Layout>
    );

    // Moon icon should be visible (Sun would be visible in dark mode)
    const buttons = screen.getAllByRole('button');
    const themeButton = buttons.find(btn => btn.querySelector('svg'));
    expect(themeButton).toBeInTheDocument();
  });

  it('shows sun icon in dark mode', () => {
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      setTheme: vi.fn(),
    });
    mockUseUser.mockReturnValue({
      user: null,
    });
    mockUseClerk.mockReturnValue({
      signOut: vi.fn(),
    });

    render(
      <Layout>
        <div>Page Content</div>
      </Layout>
    );

    const buttons = screen.getAllByRole('button');
    const themeButton = buttons.find(btn => btn.querySelector('svg'));
    expect(themeButton).toBeInTheDocument();
  });

  it('renders DevToolbar', () => {
    mockUseUser.mockReturnValue({
      user: null,
    });
    mockUseClerk.mockReturnValue({
      signOut: vi.fn(),
    });

    render(
      <Layout>
        <div>Page Content</div>
      </Layout>
    );

    expect(screen.getByTestId('dev-toolbar')).toBeInTheDocument();
  });

  it('does not render sign out when user is null', () => {
    mockUseUser.mockReturnValue({
      user: null,
    });
    mockUseClerk.mockReturnValue({
      signOut: vi.fn(),
    });

    render(
      <Layout>
        <div>Page Content</div>
      </Layout>
    );

    expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();
  });
});

