import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MediaSkeleton } from '../../components/MediaSkeleton';
import { ThemeProvider } from '../../contexts/ThemeProvider';

// Mock the useTheme hook to control theme in tests
vi.mock('../../hooks/useTheme', () => ({
    useTheme: vi.fn(() => ({ theme: 'light', setTheme: vi.fn() })),
}));

import { useTheme } from '../../hooks/useTheme';

describe('MediaSkeleton', () => {
    it('renders with default light theme color', () => {
        // Mock light theme
        vi.mocked(useTheme).mockReturnValue({ theme: 'light', setTheme: vi.fn() });

        const { container } = render(
            <ThemeProvider defaultTheme="light">
                <MediaSkeleton />
            </ThemeProvider>
        );

        const skeleton = container.firstChild as HTMLElement;
        expect(skeleton.style.backgroundColor).toBe('rgb(220, 220, 220)'); // #dcdcdc in rgb
    });

    it('renders with default dark theme color', () => {
        // Mock dark theme
        vi.mocked(useTheme).mockReturnValue({ theme: 'dark', setTheme: vi.fn() });

        const { container } = render(
            <ThemeProvider defaultTheme="dark">
                <MediaSkeleton />
            </ThemeProvider>
        );

        const skeleton = container.firstChild as HTMLElement;
        expect(skeleton.style.backgroundColor).toBe('rgb(69, 69, 69)'); // #454545 in rgb
    });

    it('applies custom styles through style prop', () => {
        // Mock light theme
        vi.mocked(useTheme).mockReturnValue({ theme: 'light', setTheme: vi.fn() });

        const customColor = '#ff0000';
        const { container } = render(
            <ThemeProvider defaultTheme="light">
                <MediaSkeleton style={{ backgroundColor: customColor }} />
            </ThemeProvider>
        );

        const skeleton = container.firstChild as HTMLElement;
        expect(skeleton.style.backgroundColor).toBe('rgb(255, 0, 0)');
    });

    it('renders with correct dimensions when width and height provided', () => {
        const { container } = render(
            <ThemeProvider>
                <MediaSkeleton width={100} height={50} />
            </ThemeProvider>
        );

        const skeleton = container.firstChild as HTMLElement;
        expect(skeleton.style.aspectRatio).toBe('100/50');
        expect(skeleton.style.maxWidth).toBe('100px');
    });

    it('renders video icon when type is video', () => {
        const { container } = render(
            <ThemeProvider>
                <MediaSkeleton type="video" />
            </ThemeProvider>
        );

        // Check for the triangle (play icon)
        const playIcon = container.querySelector('.border-l-\\[20px\\]');
        expect(playIcon).toBeInTheDocument();
    });
});
