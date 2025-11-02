import { useRef, useEffect } from 'react';
import { TimelineNode } from '../../types/timeline';

interface TimelineConnectionProps {
  fromId: string;
  toId: string;
  nodes: TimelineNode[];
}

export function TimelineConnection({ fromId, toId, nodes }: TimelineConnectionProps) {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const fromNode = document.getElementById(`node-${fromId}`);
    const toNode = document.getElementById(`node-${toId}`);

    if (fromNode && toNode && pathRef.current) {
      const fromRect = fromNode.getBoundingClientRect();
      const toRect = toNode.getBoundingClientRect();

      const startX = fromRect.right;
      const startY = fromRect.top + fromRect.height / 2;
      const endX = toRect.left;
      const endY = toRect.top + toRect.height / 2;

      const curve = `M ${startX} ${startY} Q ${(startX + endX) / 2} ${startY}, ${endX} ${endY}`;

      pathRef.current.setAttribute('d', curve);
    }
  }, [fromId, toId, nodes]);

  return (
    <path
      ref={pathRef}
      stroke="gray"
      strokeWidth="2"
      fill="none"
      markerEnd="url(#arrowhead)"
    />
  );
}

// Add arrowhead definition in parent SVG
// <defs>
//   <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
//     <polygon points="0 0, 10 3.5, 0 7" />
//   </marker>
// </defs>

