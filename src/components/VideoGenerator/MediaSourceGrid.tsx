import { Check } from 'lucide-react';
import { SelectedSource } from './types';

interface MediaSourceGridProps {
  sources: Array<{ id: string; thumbnail?: string; name: string }>;
  selectedSources: SelectedSource[];
  isSelecting: boolean;
  onDragStart: (e: React.DragEvent, source: SelectedSource) => void;
  onMouseDown: (source: SelectedSource) => void;
  onMouseEnter: (source: SelectedSource) => void;
  getSource: (item: { id: string; thumbnail?: string; name: string }) => SelectedSource;
  emptyMessage: string;
  emptyHint: string;
}

export function MediaSourceGrid({
  sources,
  selectedSources,
  isSelecting,
  onDragStart,
  onMouseDown,
  onMouseEnter,
  getSource,
  emptyMessage,
  emptyHint,
}: MediaSourceGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {sources.map((item) => {
        const source = getSource(item);
        const isSelected = selectedSources.find((s) => s.id === item.id);
        return (
          <div
            key={item.id}
            draggable={!isSelecting}
            onDragStart={(e) => !isSelecting && onDragStart(e, source)}
            onMouseDown={(e) => {
              e.preventDefault();
              onMouseDown(source);
            }}
            onMouseEnter={() => onMouseEnter(source)}
            className={`relative w-full max-h-32 rounded-lg overflow-hidden border-2 cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${
              isSelected ? 'border-primary ring-2 ring-primary' : 'border-border'
            }`}
          >
            <div className="w-full h-full flex items-center justify-center">
              <img
                src={source.thumbnail}
                alt={source.name}
                className="max-w-full max-h-full object-contain pointer-events-none"
                draggable={false}
              />
            </div>
            {isSelected && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
          </div>
        );
      })}
      {sources.length === 0 && (
        <div className="col-span-2 text-center py-8">
          <p className="text-muted-foreground text-sm mb-2">{emptyMessage}</p>
          <p className="text-xs text-muted-foreground/70">{emptyHint}</p>
        </div>
      )}
    </div>
  );
}

