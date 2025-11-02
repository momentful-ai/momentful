import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TimelineConnection } from '../../../components/ProjectWorkspace/TimelineConnection';
import { TimelineNode } from '../../../types/timeline';
import { MediaAsset } from '../../../types';

// Mock basic DOM methods for SVG path element
const mockSetAttribute = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();

  // Mock SVG path element setAttribute in a simple way
  Object.defineProperty(window.HTMLUnknownElement.prototype, 'setAttribute', {
    value: mockSetAttribute,
    writable: true,
  });
});

describe('TimelineConnection', () => {
  const mockAsset: MediaAsset = {
    id: 'asset-1',
    project_id: 'proj-1',
    user_id: 'user-1',
    file_name: 'test.jpg',
    file_type: 'image',
    file_size: 1000,
    storage_path: 'path/to/file',
    sort_order: 0,
    created_at: '2024-01-01T00:00:00Z',
  };

  const mockNodes: TimelineNode[] = [
    {
      type: 'media_asset',
      data: mockAsset,
    },
    {
      type: 'generated_video',
      data: {
        id: 'video-1',
        project_id: 'proj-1',
        user_id: 'user-1',
        name: 'Generated Video',
        ai_model: 'runway',
        aspect_ratio: '16:9' as const,
        status: 'completed',
        created_at: '2024-01-01T00:00:00Z',
        lineage_id: 'lineage-1',
      },
    },
  ];

  const defaultProps = {
    fromId: 'node-1',
    toId: 'node-2',
    nodes: mockNodes,
  };

  it('renders SVG path element', () => {
    render(<TimelineConnection {...defaultProps} />);

    // The component renders an SVG path element
    // We can't easily test the DOM manipulation in JSDOM, but we can test that it renders
    expect(document.querySelector('path')).toBeInTheDocument();
  });

  it('accepts required props', () => {
    expect(() => {
      render(<TimelineConnection {...defaultProps} />);
    }).not.toThrow();
  });

  it('handles different node IDs', () => {
    const { rerender } = render(<TimelineConnection {...defaultProps} />);

    expect(() => {
      rerender(<TimelineConnection {...defaultProps} fromId="different-from" toId="different-to" />);
    }).not.toThrow();
  });
});
