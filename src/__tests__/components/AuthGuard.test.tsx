import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthGuard } from '../../components/AuthGuard';

// Mock Clerk hooks
const mockUseUser = vi.fn();
const mockUseAuth = vi.fn();
const mockSignIn = vi.fn();

vi.mock('@clerk/clerk-react', () => ({
  useUser: () => mockUseUser(),
  useAuth: () => mockUseAuth(),
  SignIn: ({ ...props }: { [key: string]: unknown }) => mockSignIn(props),
}));

// Mock supabase-auth - define function first
const mockSetSupabaseAuth = vi.fn();
vi.mock('../../lib/supabase-auth', () => ({
  setSupabaseAuth: (...args: unknown[]) => mockSetSupabaseAuth(...args),
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

// Import mocked modules to access mocks
import { useBypassContext } from '../../hooks/useBypassContext';
const mockUseBypassContext = vi.mocked(useBypassContext);

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseBypassContext.mockReturnValue(false);
  });

  it('renders children when user is signed in', async () => {
    mockUseUser.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
    });
    mockUseAuth.mockReturnValue({
      getToken: vi.fn().mockResolvedValue('test-token'),
    });

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });

  it('shows loading spinner when Clerk is not loaded', () => {
    mockUseUser.mockReturnValue({
      isLoaded: false,
      isSignedIn: false,
    });

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    // Check for loading spinner (animate-spin class)
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('shows SignIn component when user is not signed in', () => {
    mockUseUser.mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
    });
    mockUseAuth.mockReturnValue({
      getToken: vi.fn(),
    });
    mockSignIn.mockReturnValue(<div>Sign In Component</div>);

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    expect(mockSignIn).toHaveBeenCalledWith(
      expect.objectContaining({
        appearance: expect.objectContaining({
          elements: expect.objectContaining({
            rootBox: 'mx-auto',
            card: 'shadow-xl',
          }),
        }),
      })
    );
    expect(screen.getByText('Welcome to momentful!')).toBeInTheDocument();
    expect(screen.getByText('Create stunning marketing visuals with AI')).toBeInTheDocument();
  });

  it('renders children immediately when bypass mode is enabled', () => {
    mockUseBypassContext.mockReturnValue(true);
    mockUseUser.mockReturnValue({
      isLoaded: false,
      isSignedIn: false,
    });
    mockUseAuth.mockReturnValue({
      getToken: vi.fn(),
    });

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
    expect(screen.queryByText('Welcome to momentful')).not.toBeInTheDocument();
  });

  it('syncs Supabase auth when user signs in', async () => {
    const mockGetToken = vi.fn().mockResolvedValue('supabase-token-123');
    mockUseUser.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
    });
    mockUseAuth.mockReturnValue({
      getToken: mockGetToken,
    });
    mockSetSupabaseAuth.mockResolvedValue({});

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    await waitFor(() => {
      expect(mockGetToken).toHaveBeenCalledWith({ template: 'supabase' });
      expect(mockSetSupabaseAuth).toHaveBeenCalledWith('supabase-token-123');
    });
  });

  it('does not sync auth when bypass mode is enabled', async () => {
    mockUseBypassContext.mockReturnValue(true);
    const mockGetToken = vi.fn().mockResolvedValue('token');
    mockUseUser.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
    });
    mockUseAuth.mockReturnValue({
      getToken: mockGetToken,
    });

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    await waitFor(() => {
      expect(mockGetToken).not.toHaveBeenCalled();
      expect(mockSetSupabaseAuth).not.toHaveBeenCalled();
    });
  });

  it('does not sync auth when token is not available', async () => {
    const mockGetToken = vi.fn().mockResolvedValue(null);
    mockUseUser.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
    });
    mockUseAuth.mockReturnValue({
      getToken: mockGetToken,
    });

    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    );

    await waitFor(() => {
      expect(mockGetToken).toHaveBeenCalled();
      expect(mockSetSupabaseAuth).not.toHaveBeenCalled();
    });
  });
});

