import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { useUserId } from '../../hooks/useUserId';
import { BypassContext } from '../../contexts/bypass-context';

// Mock Clerk
const mockUseUser = vi.fn();

vi.mock('@clerk/clerk-react', () => ({
  useUser: () => mockUseUser(),
}));

// Mock local-mode
const mockGetLocalDevUserId = vi.fn(() => 'local-dev-user-id');
vi.mock('../../lib/local-mode', () => ({
  getLocalDevUserId: (...args: unknown[]) => mockGetLocalDevUserId(...args),
  isLocalBypassEnabled: vi.fn(() => false),
}));

// Test component
function TestComponent() {
  const userId = useUserId();
  return <div data-testid="user-id">{userId || 'null'}</div>;
}

describe('useUserId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns Clerk user ID when authenticated and not in bypass mode', () => {
    mockUseUser.mockReturnValue({
      user: { id: 'clerk-user-123' },
      isLoaded: true,
    });

    const { getByTestId } = render(
      <BypassContext.Provider value={{ isBypassEnabled: false }}>
        <TestComponent />
      </BypassContext.Provider>
    );

    expect(getByTestId('user-id')).toHaveTextContent('clerk-user-123');
  });

  it('returns null when Clerk is not loaded', () => {
    mockUseUser.mockReturnValue({
      user: null,
      isLoaded: false,
    });

    const { getByTestId } = render(
      <BypassContext.Provider value={{ isBypassEnabled: false }}>
        <TestComponent />
      </BypassContext.Provider>
    );

    expect(getByTestId('user-id')).toHaveTextContent('null');
  });

  it('returns null when user is not authenticated', () => {
    mockUseUser.mockReturnValue({
      user: null,
      isLoaded: true,
    });

    const { getByTestId } = render(
      <BypassContext.Provider value={{ isBypassEnabled: false }}>
        <TestComponent />
      </BypassContext.Provider>
    );

    expect(getByTestId('user-id')).toHaveTextContent('null');
  });

  it('returns local dev user ID when in bypass mode', () => {
    mockGetLocalDevUserId.mockReturnValue('local-dev-user-id');
    mockUseUser.mockReturnValue({
      user: { id: 'clerk-user-123' },
      isLoaded: true,
    });

    const { getByTestId } = render(
      <BypassContext.Provider value={{ isBypassEnabled: true }}>
        <TestComponent />
      </BypassContext.Provider>
    );

    expect(getByTestId('user-id')).toHaveTextContent('local-dev-user-id');
  });

  it('always calls useUser hook first to maintain hook order', () => {
    mockUseUser.mockReturnValue({
      user: { id: 'clerk-user-123' },
      isLoaded: true,
    });

    render(
      <BypassContext.Provider value={{ isBypassEnabled: false }}>
        <TestComponent />
      </BypassContext.Provider>
    );

    expect(mockUseUser).toHaveBeenCalled();
  });
});

