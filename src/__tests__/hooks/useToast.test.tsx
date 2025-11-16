import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast } from '../../hooks/useToast';
import { ToastProvider } from '../../contexts/ToastProvider';

describe('useToast', () => {
  it('returns toast context when used within ToastProvider', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastProvider>{children}</ToastProvider>
    );

    const { result } = renderHook(() => useToast(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.showToast).toBeDefined();
    expect(typeof result.current.showToast).toBe('function');
  });

  it('throws error when used outside ToastProvider', () => {
    // Suppress console.error for this test since we expect an error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useToast());
    }).toThrow('useToast must be used within ToastProvider');

    consoleErrorSpy.mockRestore();
  });

  it('error message is correct when used outside ToastProvider', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      renderHook(() => useToast());
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      if (error instanceof Error) {
        expect(error.message).toBe('useToast must be used within ToastProvider');
      }
    }

    consoleErrorSpy.mockRestore();
  });

  it('can call showToast function from context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ToastProvider>{children}</ToastProvider>
    );

    const { result } = renderHook(() => useToast(), { wrapper });

    // Should not throw when calling showToast
    act(() => {
      result.current.showToast('Test message', 'success');
    });
  });
});

