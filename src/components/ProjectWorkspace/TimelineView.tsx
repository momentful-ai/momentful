import { useState } from 'react';
import { TimelineNodeComponent } from './TimelineNode';
import { TimelineConnection } from './TimelineConnection';
import { useTimelinesByProject, useTimeline } from '../../hooks/useTimeline';
import { Lineage } from '../../types';

interface TimelineViewProps {
  projectId: string;
}

export function TimelineView({ projectId }: TimelineViewProps) {
  const { data: lineages = [], isLoading } = useTimelinesByProject(projectId);
  const [selectedLineageId, setSelectedLineageId] = useState<string | null>(null);

  if (isLoading) {
    return <div>Loading timelines...</div>;
  }

  if (lineages.length === 0) {
    return <div>No timelines available. Start by uploading media and editing.</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Lineage selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {lineages.map((lineage: Lineage) => (
          <button
            key={lineage.id}
            onClick={() => setSelectedLineageId(lineage.id)}
            className={`px-4 py-2 rounded ${selectedLineageId === lineage.id ? 'bg-primary text-white' : 'bg-gray-200'}`}
          >
            {lineage.name || `Lineage ${lineage.id.slice(0, 8)}`}
          </button>
        ))}
      </div>

      {/* Selected timeline */}
      {selectedLineageId && <TimelineLane lineageId={selectedLineageId} />}
    </div>
  );
}

function TimelineLane({ lineageId }: { lineageId: string }) {
  const { data: timeline, isLoading } = useTimeline(lineageId);

  if (isLoading) {
    return <div>Loading timeline...</div>;
  }

  if (!timeline || timeline.nodes.length === 0) {
    return <div>No items in this timeline.</div>;
  }

  return (
    <div className="flex-1 overflow-x-auto relative">
      <div className="flex gap-8 p-4 min-w-max">
        {timeline.nodes.map((node, index) => (
          <TimelineNodeComponent key={node.data.id} node={node} index={index} total={timeline.nodes.length} />
        ))}
      </div>
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-visible">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="gray" />
          </marker>
        </defs>
        {timeline.edges.map((edge, i) => (
          <TimelineConnection key={i} fromId={edge.from} toId={edge.to} nodes={timeline.nodes} />
        ))}
      </svg>
    </div>
  );
}
