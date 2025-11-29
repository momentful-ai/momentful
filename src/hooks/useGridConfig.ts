import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';

export interface GridConfig {
  columns: number;
  rows: number;
  rowHeight: number;
}

export function useGridConfig(
  parentRef: React.RefObject<HTMLElement>,
  assetCount: number,
  cardWidth = 200,
  gap = 16
): GridConfig | null {
  const [config, setConfig] = useState<GridConfig | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  const calculateConfig = useCallback(() => {
    const parent = parentRef.current;
    if (!parent) return;

    const containerWidth = parent.clientWidth;

    // If container has no width yet, try again later
    if (containerWidth === 0) {
      setTimeout(calculateConfig, 100);
      return;
    }

    const availableWidth = containerWidth - gap; // Account for right padding

    // Calculate how many cards fit per row
    const columns = Math.max(2, Math.floor((availableWidth + gap) / (cardWidth + gap)));

    // Calculate rows needed
    const rows = Math.ceil(assetCount / columns);

    // Estimate row height (cards are aspect-square, so base height = width, increased by 50%)
    const rowHeight = cardWidth * 1.3;

    setConfig({ columns, rows, rowHeight });
  }, [parentRef, assetCount, cardWidth, gap]);

  // Initial calculation
  useLayoutEffect(() => {
    calculateConfig();
  }, [calculateConfig]);

  // Setup ResizeObserver for responsive updates
  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    // Clean up existing observer
    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
    }

    // Check if ResizeObserver is available (for test environments)
    if (typeof ResizeObserver !== 'undefined') {
      // Create new observer
      resizeObserverRef.current = new ResizeObserver(() => {
        calculateConfig();
      });

      resizeObserverRef.current.observe(parent);
    }

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [calculateConfig, parentRef]);

  return config;
}
