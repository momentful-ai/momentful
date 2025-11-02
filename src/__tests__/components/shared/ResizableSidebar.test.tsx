import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { ResizableSidebar } from '../../../components/shared/ResizableSidebar';

// Mock window.innerWidth
const mockInnerWidth = vi.fn(() => 1200);
Object.defineProperty(window, 'innerWidth', {
  get: mockInnerWidth,
});

describe('ResizableSidebar', () => {
  beforeEach(() => {
    // Reset mocks
    mockInnerWidth.mockReturnValue(1200);
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any event listeners and body styles
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });

  describe('basic rendering', () => {
    it('renders with default props', () => {
      render(<ResizableSidebar>Test content</ResizableSidebar>);
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toBeInTheDocument();
      expect(sidebar).toHaveStyle({ width: '320px' });
      expect(sidebar).toHaveClass('bg-card', 'border-l', 'border-border');
    });

    it('renders children', () => {
      render(<ResizableSidebar><div>Test child</div></ResizableSidebar>);
      expect(screen.getByText('Test child')).toBeInTheDocument();
    });

    it('applies correct border class for right side', () => {
      render(<ResizableSidebar side="right">Content</ResizableSidebar>);
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('border-l');
    });

    it('applies correct border class for left side', () => {
      render(<ResizableSidebar side="left">Content</ResizableSidebar>);
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveClass('border-r');
    });
  });

  describe('resize handle', () => {
    it('renders resize handle on the correct side', () => {
      render(<ResizableSidebar side="right">Content</ResizableSidebar>);
      const handle = document.querySelector('.cursor-ew-resize');
      expect(handle).toHaveClass('left-0');
    });

    it('renders resize handle on left side', () => {
      render(<ResizableSidebar side="left">Content</ResizableSidebar>);
      const handle = document.querySelector('.cursor-ew-resize');
      expect(handle).toHaveClass('right-0');
    });
  });

  describe('resizing behavior', () => {
    it('starts resizing when mouse down on handle', () => {
      render(<ResizableSidebar side="right">Content</ResizableSidebar>);
      const handle = document.querySelector('.cursor-ew-resize');

      fireEvent.mouseDown(handle!);

      // Check if body styles are applied
      expect(document.body.style.cursor).toBe('ew-resize');
      expect(document.body.style.userSelect).toBe('none');
    });

    it('stops resizing and cleans up on mouse up', () => {
      render(<ResizableSidebar side="right">Content</ResizableSidebar>);
      const handle = document.querySelector('.cursor-ew-resize');

      // Start resizing
      fireEvent.mouseDown(handle!);
      expect(document.body.style.cursor).toBe('ew-resize');

      // End resizing
      act(() => {
        fireEvent(document, new MouseEvent('mouseup'));
      });

      expect(document.body.style.cursor).toBe('');
      expect(document.body.style.userSelect).toBe('');
    });

    it('resizes sidebar on mouse move when resizing (right side)', () => {
      render(<ResizableSidebar side="right" minWidth={200} maxWidth={500}>Content</ResizableSidebar>);
      const handle = document.querySelector('.cursor-ew-resize');
      const sidebar = screen.getByRole('complementary');

      // Start resizing
      fireEvent.mouseDown(handle!);

      // Move mouse (simulate moving to x=800, so width = 1200 - 800 = 400)
      act(() => {
        fireEvent(document, new MouseEvent('mousemove', { clientX: 800 }));
      });

      expect(sidebar).toHaveStyle({ width: '400px' });
    });

    it('resizes sidebar on mouse move when resizing (left side)', () => {
      render(<ResizableSidebar side="left" minWidth={200} maxWidth={500}>Content</ResizableSidebar>);
      const handle = document.querySelector('.cursor-ew-resize');
      const sidebar = screen.getByRole('complementary');

      // Start resizing
      fireEvent.mouseDown(handle!);

      // Move mouse (for left side, width = clientX)
      act(() => {
        fireEvent(document, new MouseEvent('mousemove', { clientX: 350 }));
      });

      expect(sidebar).toHaveStyle({ width: '350px' });
    });

    it('respects minimum width constraint', () => {
      render(<ResizableSidebar side="right" minWidth={300} maxWidth={500}>Content</ResizableSidebar>);
      const handle = document.querySelector('.cursor-ew-resize');

      fireEvent.mouseDown(handle!);

      // Try to resize below minimum (1200 - 950 = 250, which is below 300)
      act(() => {
        fireEvent(document, new MouseEvent('mousemove', { clientX: 950 }));
      });

      const sidebar = screen.getByRole('complementary');
      // Should stay at default width since 250 < 300
      expect(sidebar).toHaveStyle({ width: '320px' });
    });

    it('respects maximum width constraint', () => {
      render(<ResizableSidebar side="right" minWidth={200} maxWidth={400}>Content</ResizableSidebar>);
      const handle = document.querySelector('.cursor-ew-resize');

      fireEvent.mouseDown(handle!);

      // Try to resize above maximum (1200 - 700 = 500, which is above 400)
      act(() => {
        fireEvent(document, new MouseEvent('mousemove', { clientX: 700 }));
      });

      const sidebar = screen.getByRole('complementary');
      // Should stay at default width since 500 > 400
      expect(sidebar).toHaveStyle({ width: '320px' });
    });

    it('only resizes when isResizing is true', () => {
      render(<ResizableSidebar side="right">Content</ResizableSidebar>);
      const sidebar = screen.getByRole('complementary');

      // Move mouse without starting resize
      act(() => {
        fireEvent(document, new MouseEvent('mousemove', { clientX: 800 }));
      });

      // Should not change width
      expect(sidebar).toHaveStyle({ width: '320px' });
    });
  });

  describe('props', () => {
    it('uses custom defaultWidth', () => {
      render(<ResizableSidebar defaultWidth={400}>Content</ResizableSidebar>);
      const sidebar = screen.getByRole('complementary');
      expect(sidebar).toHaveStyle({ width: '400px' });
    });

    it('uses custom minWidth and maxWidth', () => {
      render(
        <ResizableSidebar
          side="right"
          minWidth={150}
          maxWidth={450}
          defaultWidth={200}
        >
          Content
        </ResizableSidebar>
      );
      const handle = document.querySelector('.cursor-ew-resize');
      const sidebar = screen.getByRole('complementary');

      fireEvent.mouseDown(handle!);

      // Test min width (1200 - 1100 = 100, below 150)
      act(() => {
        fireEvent(document, new MouseEvent('mousemove', { clientX: 1100 }));
      });
      expect(sidebar).toHaveStyle({ width: '200px' }); // Should not change

      // Test max width (1200 - 700 = 500, above 450)
      act(() => {
        fireEvent(document, new MouseEvent('mousemove', { clientX: 700 }));
      });
      expect(sidebar).toHaveStyle({ width: '200px' }); // Should not change
    });
  });
});
