import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { useBypassContext } from '../../hooks/useBypassContext';
import { BypassProvider } from '../../contexts/BypassProvider';
import { isLocalBypassEnabled } from '../../lib/local-mode';
import { vi } from 'vitest';

// Mock local-mode
vi.mock('../../lib/local-mode', () => ({
  isLocalBypassEnabled: vi.fn(() => false),
}));

// Test component
function TestComponent() {
  const isBypassEnabled = useBypassContext();
  return <div data-testid="bypass-value">{isBypassEnabled ? 'true' : 'false'}</div>;
}

describe('useBypassContext', () => {
  it('returns bypass enabled value from context', () => {
    vi.mocked(isLocalBypassEnabled).mockReturnValue(true);

    const { getByTestId } = render(
      <BypassProvider>
        <TestComponent />
      </BypassProvider>
    );

    expect(getByTestId('bypass-value')).toHaveTextContent('true');
  });

  it('returns bypass disabled value from context', () => {
    vi.mocked(isLocalBypassEnabled).mockReturnValue(false);

    const { getByTestId } = render(
      <BypassProvider>
        <TestComponent />
      </BypassProvider>
    );

    expect(getByTestId('bypass-value')).toHaveTextContent('false');
  });

  it('throws error when used outside BypassProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useBypassContext must be used within a BypassProvider');

    consoleSpy.mockRestore();
  });
});

