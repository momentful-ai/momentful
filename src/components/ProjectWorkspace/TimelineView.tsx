import { useState, useEffect, useRef, useCallback } from 'react';
import { TimelineNodeComponent } from './TimelineNode';
import { TimelineConnection } from './TimelineConnection';
import { useTimelinesByProject, useTimeline } from '../../hooks/useTimeline';
import { useUpdateLineage } from '../../hooks/useUpdateLineage';
import { useToast } from '../../hooks/useToast';
import { Lineage, MediaAsset, EditedImage, GeneratedVideo } from '../../types';
import { TimelineNode as TimelineNodeType } from '../../types/timeline';
import { Pencil, Check, X } from 'lucide-react';
import { Button } from '../ui/button';

interface TimelineViewProps {
  projectId: string;
  onEditImage?: (asset: MediaAsset | EditedImage) => void;
  onDownload?: (item: MediaAsset | EditedImage | GeneratedVideo | TimelineNodeType) => void;
  onDelete?: (item: MediaAsset | EditedImage | GeneratedVideo | TimelineNodeType) => void;
}

export function TimelineView({ projectId, onEditImage, onDownload, onDelete }: TimelineViewProps) {
  const { data: lineages = [], isLoading } = useTimelinesByProject(projectId);
  const [selectedLineageId, setSelectedLineageId] = useState<string | null>(null);
  const [editingLineageId, setEditingLineageId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState<string>('');
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const updateMutation = useUpdateLineage();
  const { showToast } = useToast();

  // Auto-select first lineage when available
  useEffect(() => {
    if (lineages.length > 0 && selectedLineageId === null) {
      setSelectedLineageId(lineages[0].id);
    }
  }, [lineages, selectedLineageId]);

  const handleStartEdit = useCallback((lineage: Lineage, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingLineageId(lineage.id);
    setEditedName(lineage.name || '');
    setTimeout(() => {
      inputRefs.current[lineage.id]?.focus();
      inputRefs.current[lineage.id]?.select();
    }, 0);
  }, []);

  const handleSaveEdit = useCallback(async (lineageId: string) => {
    const trimmedName = editedName.trim();
    const lineage = lineages.find(l => l.id === lineageId);
    
    if (!lineage) return;
    
    // Only update if name changed
    if (trimmedName !== (lineage.name || '')) {
      try {
        await updateMutation.mutateAsync({
          lineageId,
          name: trimmedName,
          projectId,
        });
        showToast('Timeline name updated', 'success');
      } catch (error) {
        console.error('Error updating lineage name:', error);
        showToast('Failed to update timeline name', 'error');
        setEditedName(lineage.name || '');
      }
    }
    setEditingLineageId(null);
  }, [editedName, lineages, updateMutation, projectId, showToast]);

  const handleCancelEdit = useCallback((lineage: Lineage) => {
    setEditedName(lineage.name || '');
    setEditingLineageId(null);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, lineageId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleSaveEdit(lineageId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      const lineage = lineages.find(l => l.id === lineageId);
      if (lineage) {
        handleCancelEdit(lineage);
      }
    }
  }, [handleSaveEdit, handleCancelEdit, lineages]);

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
        {lineages.map((lineage: Lineage) => {
          const isEditing = editingLineageId === lineage.id;
          const isSelected = selectedLineageId === lineage.id;
          const displayName = lineage.name || `Lineage ${lineage.id.slice(0, 8)}`;

          return (
            <div
              key={lineage.id}
              className={`group flex items-center gap-1 px-4 py-2 rounded transition-colors ${
                isSelected ? 'bg-primary text-white' : 'bg-gray-200'
              }`}
            >
              {isEditing ? (
                <>
                  <input
                    ref={(el) => {
                      inputRefs.current[lineage.id] = el;
                    }}
                    type="text"
                    value={editedName}
                    onChange={(e) => {
                      e.stopPropagation();
                      setEditedName(e.target.value);
                    }}
                    onKeyDown={(e) => handleKeyDown(e, lineage.id)}
                    onClick={(e) => e.stopPropagation()}
                    className={`flex-1 min-w-[120px] px-2 py-1 text-sm bg-background border border-primary rounded focus:outline-none focus:ring-2 focus:ring-primary ${
                      isSelected ? 'text-foreground' : ''
                    }`}
                    maxLength={100}
                  />
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveEdit(lineage.id);
                    }}
                    variant="ghost"
                    size="icon"
                    className={`h-6 w-6 ${isSelected ? 'text-white hover:bg-primary/80' : ''}`}
                    disabled={updateMutation.isPending}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancelEdit(lineage);
                    }}
                    variant="ghost"
                    size="icon"
                    className={`h-6 w-6 ${isSelected ? 'text-white hover:bg-primary/80' : ''}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setSelectedLineageId(lineage.id)}
                    className="flex-1 text-left min-w-[120px]"
                  >
                    {displayName}
                  </button>
                  <Button
                    onClick={(e) => handleStartEdit(lineage, e)}
                    variant="ghost"
                    size="icon"
                    className={`h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ${
                      isSelected ? 'text-white hover:bg-primary/80' : ''
                    }`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected timeline */}
      {selectedLineageId && (
        <TimelineLane 
          lineageId={selectedLineageId} 
          onEditImage={onEditImage}
          onDownload={onDownload}
          onDelete={onDelete}
        />
      )}
    </div>
  );
}

function TimelineLane({ 
  lineageId, 
  onEditImage, 
  onDownload, 
  onDelete 
}: { 
  lineageId: string;
  onEditImage?: (asset: MediaAsset | EditedImage) => void;
  onDownload?: (item: MediaAsset | EditedImage | GeneratedVideo | TimelineNodeType) => void;
  onDelete?: (item: MediaAsset | EditedImage | GeneratedVideo | TimelineNodeType) => void;
}) {
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
          <TimelineNodeComponent 
            key={node.data.id} 
            node={node} 
            index={index} 
            total={timeline.nodes.length}
            onEditImage={onEditImage}
            onDownload={onDownload}
            onDelete={onDelete}
          />
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
