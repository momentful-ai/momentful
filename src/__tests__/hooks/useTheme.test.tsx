import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { useTheme } from '../../hooks/useTheme';
import { ThemeProvider } from '../../contexts/ThemeProvider';

// Mock matchMedia
const mockMatchMedia = vi.fn();

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

// Test component
function TestComponent() {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <div data-testid="theme">{theme}</div>
      <button onClick={() => setTheme('dark')}>Dark</button>
      <button onClick={() => setTheme('light')}>Light</button>
    </div>
  );
}

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    mockMatchMedia.mockReturnValue({
      matches: false,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });
  });

  afterEach(() => {
    document.documentElement.classList.remove('light', 'dark');
  });

  it('returns theme from context', () => {
    const { getByTestId } = render(
      <ThemeProvider defaultTheme="dark">
        <TestComponent />
      </ThemeProvider>
    );

    expect(getByTestId('theme')).toHaveTextContent('dark');
  });

  it('returns setTheme function from context', async () => {
    const { getByTestId, getByText } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const lightButton = getByText('Light');
    lightButton.click();

    // Wait for state update
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(getByTestId('theme')).toHaveTextContent('light');
    expect(localStorage.getItem('momentful-theme')).toBe('light');
  });

  it('updates theme through setTheme', async () => {
    const { getByTestId, getByText } = render(
      <ThemeProvider defaultTheme="light">
        <TestComponent />
      </ThemeProvider>
    );

    // Wait for initial render
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getByTestId('theme')).toHaveTextContent('light');

    const darkButton = getByText('Dark');
    darkButton.click();

    // Wait for state update
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(getByTestId('theme')).toHaveTextContent('dark');
  });

  it('returns default theme state when used outside ThemeProvider', () => {
    // Note: ThemeProviderContext has initialThemeState as default,
    // so useContext will never return undefined. The hook will return the default state.
    const { getByTestId } = render(<TestComponent />);

    // Should return the initial theme state ('system')
    expect(getByTestId('theme')).toHaveTextContent('system');
  });
});

