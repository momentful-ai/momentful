import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserGenerationLimits } from '../../hooks/useUserGenerationLimits';
import { getUserGenerationLimits } from '../../services/generationLimits';

// Mock the service
vi.mock('../../services/generationLimits', () => ({
  getUserGenerationLimits: vi.fn(),
}));

// Mock useUserId
vi.mock('../../hooks/useUserId', () => ({
  useUserId: vi.fn(),
}));

const mockGetUserGenerationLimits = vi.mocked(getUserGenerationLimits);
const mockUseUserId = vi.mocked((await import('../../hooks/useUserId')).useUserId);

// Test component
function TestComponent() {
  const { imagesRemaining, videosRemaining, imagesLimit, videosLimit, isLoading, error } = useUserGenerationLimits();
  return (
    <div>
      <div data-testid="images-remaining">{imagesRemaining}</div>
      <div data-testid="videos-remaining">{videosRemaining}</div>
      <div data-testid="images-limit">{imagesLimit}</div>
      <div data-testid="videos-limit">{videosLimit}</div>
      <div data-testid="loading">{isLoading ? 'true' : 'false'}</div>
      <div data-testid="error">{error ? error.message : 'null'}</div>
    </div>
  );
}

describe('useUserGenerationLimits', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  it('returns default values when userId is null', async () => {
    mockUseUserId.mockReturnValue(null);

    const { getByTestId } = renderWithQueryClient(<TestComponent />);

    expect(getByTestId('images-remaining')).toHaveTextContent('0');
    expect(getByTestId('videos-remaining')).toHaveTextContent('0');
    expect(getByTestId('images-limit')).toHaveTextContent('10');
    expect(getByTestId('videos-limit')).toHaveTextContent('5');
    expect(getByTestId('loading')).toHaveTextContent('false');
  });

  it('fetches and returns user limits successfully', async () => {
    mockUseUserId.mockReturnValue('user123');
    mockGetUserGenerationLimits.mockResolvedValue({
      imagesRemaining: 8,
      videosRemaining: 3,
      imagesLimit: 10,
      videosLimit: 5,
    });

    const { getByTestId } = renderWithQueryClient(<TestComponent />);

    // Wait for the query to resolve
    await vi.waitFor(() => {
      expect(getByTestId('images-remaining')).toHaveTextContent('8');
      expect(getByTestId('videos-remaining')).toHaveTextContent('3');
      expect(getByTestId('images-limit')).toHaveTextContent('10');
      expect(getByTestId('videos-limit')).toHaveTextContent('5');
      expect(getByTestId('loading')).toHaveTextContent('false');
    });

    expect(mockGetUserGenerationLimits).toHaveBeenCalledWith('user123');
  });

  it('handles loading state', () => {
    mockUseUserId.mockReturnValue('user123');
    mockGetUserGenerationLimits.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { getByTestId } = renderWithQueryClient(<TestComponent />);

    expect(getByTestId('loading')).toHaveTextContent('true');
  });

  it('handles error state', async () => {
    mockUseUserId.mockReturnValue('user123');
    const error = new Error('Failed to fetch limits');
    mockGetUserGenerationLimits.mockRejectedValue(error);

    const { getByTestId } = renderWithQueryClient(<TestComponent />);

    await vi.waitFor(() => {
      expect(getByTestId('error')).toHaveTextContent('Failed to fetch limits');
      expect(getByTestId('loading')).toHaveTextContent('false');
    });
  });

  it('uses correct query key', () => {
    mockUseUserId.mockReturnValue('user123');
    mockGetUserGenerationLimits.mockResolvedValue({
      imagesRemaining: 5,
      videosRemaining: 2,
      imagesLimit: 10,
      videosLimit: 5,
    });

    renderWithQueryClient(<TestComponent />);

    expect(mockGetUserGenerationLimits).toHaveBeenCalledWith('user123');
  });

  it('does not call API when userId is null', () => {
    mockUseUserId.mockReturnValue(null);

    renderWithQueryClient(<TestComponent />);

    expect(mockGetUserGenerationLimits).not.toHaveBeenCalled();
  });
});