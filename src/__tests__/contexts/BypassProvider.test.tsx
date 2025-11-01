import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BypassProvider } from '../../contexts/BypassProvider';
import { useBypassContext } from '../../hooks/useBypassContext';
import { isLocalBypassEnabled } from '../../lib/local-mode';

// Mock local-mode
vi.mock('../../lib/local-mode', () => ({
  isLocalBypassEnabled: vi.fn(() => false),
}));

// Test component to access context
function TestComponent() {
  const isBypassEnabled = useBypassContext();
  return <div data-testid="bypass-value">{isBypassEnabled ? 'true' : 'false'}</div>;
}

describe('BypassProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('provides bypass context value', () => {
    vi.mocked(isLocalBypassEnabled).mockReturnValue(false);

    const { getByTestId } = render(
      <BypassProvider>
        <TestComponent />
      </BypassProvider>
    );

    expect(getByTestId('bypass-value')).toHaveTextContent('false');
  });

  it('provides true when bypass is enabled', () => {
    vi.mocked(isLocalBypassEnabled).mockReturnValue(true);

    const { getByTestId } = render(
      <BypassProvider>
        <TestComponent />
      </BypassProvider>
    );

    expect(getByTestId('bypass-value')).toHaveTextContent('true');
  });

  it('calls isLocalBypassEnabled to determine bypass state', () => {
    vi.mocked(isLocalBypassEnabled).mockReturnValue(true);

    render(
      <BypassProvider>
        <TestComponent />
      </BypassProvider>
    );

    expect(isLocalBypassEnabled).toHaveBeenCalled();
  });

  it('renders children correctly', () => {
    vi.mocked(isLocalBypassEnabled).mockReturnValue(false);

    const { getByText } = render(
      <BypassProvider>
        <div>Test Child</div>
      </BypassProvider>
    );

    expect(getByText('Test Child')).toBeInTheDocument();
  });
});

