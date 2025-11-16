import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { ThemeProvider } from '../../contexts/ThemeProvider';
import { useTheme } from '../../hooks/useTheme';

// Mock matchMedia
const mockMatchMedia = vi.fn();

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
});

// Test component to access context
function TestComponent() {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <div data-testid="theme-value">{theme}</div>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setTheme('light')}>Set Light</button>
      <button onClick={() => setTheme('system')}>Set System</button>
    </div>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('uses default theme when no localStorage value', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(getByTestId('theme-value')).toHaveTextContent('system');
  });

  it('loads theme from localStorage', () => {
    localStorage.setItem('momentful-theme', 'dark');

    const { getByTestId } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(getByTestId('theme-value')).toHaveTextContent('dark');
  });

  it('uses custom storage key when provided', () => {
    localStorage.setItem('custom-theme-key', 'light');

    const { getByTestId } = render(
      <ThemeProvider storageKey="custom-theme-key">
        <TestComponent />
      </ThemeProvider>
    );

    expect(getByTestId('theme-value')).toHaveTextContent('light');
  });

  it('uses custom default theme when provided', () => {
    const { getByTestId } = render(
      <ThemeProvider defaultTheme="dark">
        <TestComponent />
      </ThemeProvider>
    );

    expect(getByTestId('theme-value')).toHaveTextContent('dark');
  });

  it('updates theme and saves to localStorage', async () => {
    const { getByTestId, getByText } = render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const darkButton = getByText('Set Dark');

    act(() => {
      darkButton.click();
    });

    expect(getByTestId('theme-value')).toHaveTextContent('dark');
    expect(localStorage.getItem('momentful-theme')).toBe('dark');
  });

  it('applies dark class to document root when theme is dark', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <TestComponent />
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('applies light class to document root when theme is light', () => {
    render(
      <ThemeProvider defaultTheme="light">
        <TestComponent />
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('applies system theme based on prefers-color-scheme when theme is system', () => {
    mockMatchMedia.mockReturnValue({
      matches: true, // dark mode
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    render(
      <ThemeProvider defaultTheme="system">
        <TestComponent />
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('applies light theme when system prefers light', () => {
    mockMatchMedia.mockReturnValue({
      matches: false, // light mode
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    render(
      <ThemeProvider defaultTheme="system">
        <TestComponent />
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('removes previous theme classes when changing theme', async () => {
    const { getByText } = render(
      <ThemeProvider defaultTheme="light">
        <TestComponent />
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains('light')).toBe(true);

    const darkButton = getByText('Set Dark');

    act(() => {
      darkButton.click();
    });

    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('renders children correctly', () => {
    const { getByText } = render(
      <ThemeProvider>
        <div>Test Child</div>
      </ThemeProvider>
    );

    expect(getByText('Test Child')).toBeInTheDocument();
  });
});

