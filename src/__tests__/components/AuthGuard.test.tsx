import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

vi.mock('@clerk/themes', () => ({
  dark: { baseTheme: 'dark' },
}));

// Mock supabase-auth - define function first
const mockSetSupabaseAuth = vi.fn();
vi.mock('../../lib/supabase-auth', () => ({
  setSupabaseAuth: (...args: unknown[]) => mockSetSupabaseAuth(...args),
}));

// Mock DevToolbar
vi.mock('../../components/DevToolbar', () => ({
  DevToolbar: () => <div data-testid="dev-toolbar">DevToolbar</div>,
}));

// Mock hooks
vi.mock('../../hooks/useBypassContext', () => ({
  useBypassContext: vi.fn(() => false),
}));

const mockSetTheme = vi.fn();
vi.mock('../../hooks/useTheme', () => ({
  useTheme: vi.fn(() => ({
    theme: 'light',
    setTheme: mockSetTheme,
  })),
}));

// Import mocked modules to access mocks
import { useBypassContext } from '../../hooks/useBypassContext';
import { useTheme } from '../../hooks/useTheme';
const mockUseBypassContext = vi.mocked(useBypassContext);
const mockUseTheme = vi.mocked(useTheme);

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseBypassContext.mockReturnValue(false);
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
    });
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

  describe('Theme functionality', () => {
    it('shows theme toggle button when user is not signed in', () => {
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

      const themeButton = screen.getByLabelText('Toggle theme');
      expect(themeButton).toBeInTheDocument();
    });

    it('shows moon icon in light mode', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
      });
      mockUseUser.mockReturnValue({
        isLoaded: true,
        isSignedIn: false,
      });
      mockUseAuth.mockReturnValue({
        getToken: vi.fn(),
      });
      mockSignIn.mockReturnValue(<div>Sign In Component</div>);

      const { container } = render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      // Check for moon icon (light mode shows moon to switch to dark)
      const moonIcon = container.querySelector('.lucide-moon');
      expect(moonIcon).toBeInTheDocument();
    });

    it('shows sun icon in dark mode', () => {
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
      });
      mockUseUser.mockReturnValue({
        isLoaded: true,
        isSignedIn: false,
      });
      mockUseAuth.mockReturnValue({
        getToken: vi.fn(),
      });
      mockSignIn.mockReturnValue(<div>Sign In Component</div>);

      const { container } = render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      // Check for sun icon (dark mode shows sun to switch to light)
      const sunIcon = container.querySelector('.lucide-sun');
      expect(sunIcon).toBeInTheDocument();
    });

    it('calls setTheme when theme toggle button is clicked in light mode', async () => {
      const user = userEvent.setup();
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
      });
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

      const themeButton = screen.getByLabelText('Toggle theme');
      await user.click(themeButton);

      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('calls setTheme when theme toggle button is clicked in dark mode', async () => {
      const user = userEvent.setup();
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
      });
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

      const themeButton = screen.getByLabelText('Toggle theme');
      await user.click(themeButton);

      expect(mockSetTheme).toHaveBeenCalledWith('light');
    });

    it('applies light theme classes when theme is light', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
      });
      mockUseUser.mockReturnValue({
        isLoaded: true,
        isSignedIn: false,
      });
      mockUseAuth.mockReturnValue({
        getToken: vi.fn(),
      });
      mockSignIn.mockReturnValue(<div>Sign In Component</div>);

      const { container } = render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      // Check for light theme background classes
      const backgroundDiv = container.querySelector('.from-slate-50');
      expect(backgroundDiv).toBeInTheDocument();

      // Check for light theme text classes
      const heading = screen.getByText('Welcome to momentful!');
      expect(heading).toHaveClass('text-slate-900');
    });

    it('applies dark theme classes when theme is dark', () => {
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
      });
      mockUseUser.mockReturnValue({
        isLoaded: true,
        isSignedIn: false,
      });
      mockUseAuth.mockReturnValue({
        getToken: vi.fn(),
      });
      mockSignIn.mockReturnValue(<div>Sign In Component</div>);

      const { container } = render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      // Check for dark theme background classes
      const backgroundDiv = container.querySelector('.from-slate-900');
      expect(backgroundDiv).toBeInTheDocument();

      // Check for dark theme text classes
      const heading = screen.getByText('Welcome to momentful!');
      expect(heading).toHaveClass('text-white');
    });

    it('passes dark theme to Clerk SignIn when theme is dark', () => {
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        setTheme: mockSetTheme,
      });
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

      // The dark theme object is mocked, so we check that baseTheme is defined
      expect(mockSignIn).toHaveBeenCalledWith(
        expect.objectContaining({
          appearance: expect.objectContaining({
            baseTheme: expect.any(Object),
          }),
        })
      );
    });

    it('does not pass baseTheme to Clerk SignIn when theme is light', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: mockSetTheme,
      });
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
            baseTheme: undefined,
          }),
        })
      );
    });

    it('uses system theme preference when theme is set to system', () => {
      // Mock matchMedia to return dark preference
      const mockMatchMedia = vi.fn().mockReturnValue({
        matches: true,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      });
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });

      mockUseTheme.mockReturnValue({
        theme: 'system',
        setTheme: mockSetTheme,
      });
      mockUseUser.mockReturnValue({
        isLoaded: true,
        isSignedIn: false,
      });
      mockUseAuth.mockReturnValue({
        getToken: vi.fn(),
      });
      mockSignIn.mockReturnValue(<div>Sign In Component</div>);

      const { container } = render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      // Should show dark theme based on system preference
      const backgroundDiv = container.querySelector('.from-slate-900');
      expect(backgroundDiv).toBeInTheDocument();
    });

    it('renders DevToolbar on loading state', () => {
      mockUseUser.mockReturnValue({
        isLoaded: false,
        isSignedIn: false,
      });

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      );

      expect(screen.getByTestId('dev-toolbar')).toBeInTheDocument();
    });

    it('renders DevToolbar on sign-in state', () => {
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

      expect(screen.getByTestId('dev-toolbar')).toBeInTheDocument();
    });
  });
});

