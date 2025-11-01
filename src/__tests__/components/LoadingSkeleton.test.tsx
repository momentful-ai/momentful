import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DashboardSkeleton, MediaLibrarySkeleton } from '../../components/LoadingSkeleton';

describe('LoadingSkeleton', () => {
  describe('DashboardSkeleton', () => {
    it('renders skeleton elements for dashboard', () => {
      render(<DashboardSkeleton />);

      // Check for skeleton elements
      const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders multiple card skeletons', () => {
      render(<DashboardSkeleton />);

      // Should render 6 card skeletons
      const cards = document.querySelectorAll('[class*="glass-card"]');
      expect(cards.length).toBe(6);
    });

    it('renders header skeleton elements', () => {
      render(<DashboardSkeleton />);

      // Should have skeleton elements for title and description
      const skeletons = document.querySelectorAll('[class*="h-"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('MediaLibrarySkeleton', () => {
    it('renders skeleton elements for media library', () => {
      render(<MediaLibrarySkeleton />);

      // Check for skeleton elements
      const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('renders multiple media item skeletons', () => {
      render(<MediaLibrarySkeleton />);

      // Should render 10 card skeletons
      const cards = document.querySelectorAll('[class*="glass-card"]');
      expect(cards.length).toBe(10);
    });

    it('renders grid layout for media library', () => {
      const { container } = render(<MediaLibrarySkeleton />);

      // Should have grid classes
      const gridContainer = container.querySelector('[class*="grid"]');
      expect(gridContainer).toBeInTheDocument();
    });
  });
});

